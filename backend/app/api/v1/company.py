from datetime import UTC

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_company
from app.core.config import get_settings
from app.core.security import hash_password
from app.db.session import get_db
from app.models.entities import Company, CompanyPublicKey, Credential, RevocationList, Worker
from app.schemas.auth import LoginRequest
from app.schemas.common import MessageResponse, TokenResponse
from app.schemas.company import CompanyRegisterRequest, CredentialIssueRequest, WorkerCreateRequest, WorkerSummary
from app.services.auth import issue_login_cookie, validate_password
from app.services.crypto_service import generate_company_key_bundle, issue_credential

router = APIRouter(prefix="/company", tags=["company"])
settings = get_settings()


def _normalize_crypto_attributes(attributes: list[str]) -> list[str]:
    normalized: list[str] = []
    for attribute in attributes:
        key = attribute.split(":", 1)[0].strip()
        if key and key not in normalized:
            normalized.append(key)
    return normalized


@router.post("/register", response_model=MessageResponse)
async def register_company(payload: CompanyRegisterRequest, db: AsyncSession = Depends(get_db)) -> MessageResponse:
    company = Company(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        metadata_json={
            "license_id": payload.license_id,
            "contact_name": payload.contact_name,
            "contact_phone": payload.contact_phone,
            **payload.metadata,
        },
    )
    db.add(company)
    await db.flush()
    public_params, secret_keys = generate_company_key_bundle(["company", "role", "campus_access"])
    db.add(
        CompanyPublicKey(
            company_id=company.id,
            provider=settings.crypto_provider,
            public_parameters={**public_params, "secret_keys": secret_keys},
            attribute_generators=public_params["attribute_generators"],
        )
    )
    await db.commit()
    return MessageResponse(message="Company registered and pending approval")


@router.post("/auth", response_model=TokenResponse)
async def auth_company(payload: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    company = await db.scalar(select(Company).where(Company.email == payload.email))
    if not company:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if company.status in {"rejected", "revoked"}:
        raise HTTPException(status_code=403, detail=f"Company is {company.status}")
    validate_password(payload.password, company.password_hash)
    token = issue_login_cookie(response, company.id, "company")
    return TokenResponse(access_token=token)


@router.post("/workers", response_model=WorkerSummary)
async def create_worker(
    payload: WorkerCreateRequest,
    db: AsyncSession = Depends(get_db),
    company: Company = Depends(require_company),
) -> WorkerSummary:
    if company.status != "approved":
        raise HTTPException(status_code=403, detail="Company must be approved")
    worker = Worker(
        company_id=company.id,
        full_name=payload.full_name,
        phone=payload.phone,
        external_worker_id=payload.worker_id,
        password_hash=hash_password(payload.password),
        attributes={**payload.attributes, "role": payload.role, "company": company.name},
    )
    db.add(worker)
    await db.commit()
    await db.refresh(worker)
    return WorkerSummary.model_validate(worker)


@router.get("/workers", response_model=list[WorkerSummary])
async def list_workers(
    db: AsyncSession = Depends(get_db), company: Company = Depends(require_company)
) -> list[WorkerSummary]:
    workers = await db.scalars(select(Worker).where(Worker.company_id == company.id))
    return [WorkerSummary.model_validate(worker) for worker in workers]


@router.get("/credentials")
async def list_credentials(
    db: AsyncSession = Depends(get_db), company: Company = Depends(require_company)
) -> list[dict]:
    credentials = await db.scalars(select(Credential).where(Credential.company_id == company.id).order_by(Credential.created_at.desc()))
    items: list[dict] = []
    for credential in credentials:
        worker = await db.scalar(select(Worker).where(Worker.id == credential.worker_id))
        items.append(
            {
                "id": credential.id,
                "worker_id": credential.worker_id,
                "worker_name": worker.full_name if worker else None,
                "external_worker_id": worker.external_worker_id if worker else None,
                "expires_at": credential.expires_at,
                "created_at": credential.created_at,
                "credential_blob": credential.credential_blob,
            }
        )
    return items


@router.get("/credentials/{credential_id}")
async def get_credential_detail(
    credential_id: str,
    db: AsyncSession = Depends(get_db),
    company: Company = Depends(require_company),
) -> dict:
    credential = await db.scalar(
        select(Credential).where(Credential.id == credential_id, Credential.company_id == company.id)
    )
    if not credential:
        raise HTTPException(status_code=404, detail="Credential not found")
    worker = await db.scalar(select(Worker).where(Worker.id == credential.worker_id))
    return {
        "id": credential.id,
        "worker_id": credential.worker_id,
        "worker_name": worker.full_name if worker else None,
        "external_worker_id": worker.external_worker_id if worker else None,
        "expires_at": credential.expires_at,
        "created_at": credential.created_at,
        "credential_blob": credential.credential_blob,
    }


@router.post("/credentials/issue", response_model=MessageResponse)
async def issue_worker_credential(
    payload: CredentialIssueRequest,
    db: AsyncSession = Depends(get_db),
    company: Company = Depends(require_company),
) -> MessageResponse:
    if company.status != "approved":
        raise HTTPException(status_code=403, detail="Company must be approved")
    worker = await db.scalar(select(Worker).where(Worker.id == payload.worker_id, Worker.company_id == company.id))
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    key_bundle = await db.scalar(select(CompanyPublicKey).where(CompanyPublicKey.company_id == company.id))
    if not key_bundle:
        raise HTTPException(status_code=400, detail="Missing company key bundle")
    credential_blob = issue_credential(
        worker.id,
        _normalize_crypto_attributes(payload.attributes),
        key_bundle.public_parameters["secret_keys"],
        key_bundle.public_parameters,
    )
    credential_blob["role"] = payload.role
    credential_blob["company"] = company.name
    credential_blob["worker_id"] = worker.external_worker_id
    credential_blob["expiry"] = payload.expires_at.astimezone(UTC).isoformat()
    credential_blob["issued_attributes"] = payload.attributes
    credential = Credential(
        worker_id=worker.id,
        company_id=company.id,
        expires_at=payload.expires_at.astimezone(UTC),
        credential_blob=credential_blob,
    )
    db.add(credential)
    await db.commit()
    return MessageResponse(message="Credential issued")


@router.post("/workers/{worker_id}/revoke", response_model=MessageResponse)
async def revoke_worker(
    worker_id: str,
    db: AsyncSession = Depends(get_db),
    company: Company = Depends(require_company),
) -> MessageResponse:
    worker = await db.scalar(select(Worker).where(Worker.id == worker_id, Worker.company_id == company.id))
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    worker.status = "revoked"
    db.add(RevocationList(entity_type="worker", entity_id=worker.id, reason="company_revocation"))
    await db.commit()
    return MessageResponse(message="Worker revoked")
