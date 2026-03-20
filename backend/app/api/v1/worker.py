from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_worker
from app.core.config import get_settings
from app.db.session import get_db
from app.models.entities import AccessLog, Company, CompanyPublicKey, Credential, NonceTracking, Pseudonym, Worker
from app.schemas.common import MessageResponse, TokenResponse
from app.schemas.worker import PseudonymGenerateRequest, VerifyStatusRequest, WorkerAuthRequest
from app.services.auth import issue_login_cookie, validate_password
from app.services.crypto_service import generate_pseudonym

router = APIRouter(prefix="/worker", tags=["worker"])
settings = get_settings()


def _normalize_attribute_name(attribute: str) -> str:
    return attribute.split(":", 1)[0].strip()


def _normalize_attribute_list(attributes: list[str]) -> list[str]:
    normalized: list[str] = []
    for attribute in attributes:
        key = _normalize_attribute_name(attribute)
        if key and key not in normalized:
            normalized.append(key)
    return normalized


def _normalize_attribute_map(attributes: dict[str, int]) -> dict[str, int]:
    normalized: dict[str, int] = {}
    for attribute, value in attributes.items():
        key = _normalize_attribute_name(attribute)
        if key:
            normalized[key] = value
    return normalized


def _normalize_access_tree(policy: dict) -> dict:
    if not policy:
        return {}
    if policy.get("type") == "leaf":
        return {**policy, "attribute": _normalize_attribute_name(policy.get("attribute", ""))}
    if "children" in policy:
        return {**policy, "children": [_normalize_access_tree(child) for child in policy.get("children", [])]}
    return policy


@router.post("/auth", response_model=TokenResponse)
async def auth_worker(payload: WorkerAuthRequest, response: Response, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    worker = await db.scalar(select(Worker).where(Worker.external_worker_id == payload.external_worker_id))
    if not worker:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    validate_password(payload.password, worker.password_hash)
    token = issue_login_cookie(response, worker.id, "worker")
    return TokenResponse(access_token=token)


@router.get("/credential/{credential_id}")
async def get_credential(
    credential_id: str,
    db: AsyncSession = Depends(get_db),
    worker: Worker = Depends(require_worker),
) -> dict:
    credential = await db.scalar(select(Credential).where(Credential.id == credential_id, Credential.worker_id == worker.id))
    if not credential:
        raise HTTPException(status_code=404, detail="Credential not found")
    return credential.credential_blob


@router.get("/credentials")
async def list_worker_credentials(
    db: AsyncSession = Depends(get_db),
    worker: Worker = Depends(require_worker),
) -> list[dict]:
    credentials = await db.scalars(
        select(Credential).where(Credential.worker_id == worker.id).order_by(Credential.created_at.desc())
    )
    company = await db.scalar(select(Company).where(Company.id == worker.company_id))
    company_name = company.name if company else worker.attributes.get("company")
    return [
        {
            "id": credential.id,
            "expires_at": credential.expires_at,
            "status": credential.status,
            "created_at": credential.created_at,
            "company_name": company_name,
            "credential_blob": credential.credential_blob,
        }
        for credential in credentials
    ]


@router.post("/pseudonym/generate")
async def create_pseudonym(
    payload: PseudonymGenerateRequest,
    db: AsyncSession = Depends(get_db),
    worker: Worker = Depends(require_worker),
) -> dict:
    credential = await db.scalar(select(Credential).where(Credential.id == payload.credential_id, Credential.worker_id == worker.id))
    if not credential:
        raise HTTPException(status_code=404, detail="Credential not found")
    nonce_record = await db.scalar(
        select(NonceTracking).where(
            NonceTracking.nonce == payload.gate_nonce,
            NonceTracking.expires_at > datetime.now(UTC),
            NonceTracking.consumed.is_(False),
        )
    )
    if not nonce_record:
        raise HTTPException(status_code=400, detail="Gate nonce invalid or expired")
    key_bundle = await db.scalar(select(CompanyPublicKey).where(CompanyPublicKey.company_id == credential.company_id))
    company = await db.scalar(select(Company).where(Company.id == credential.company_id))
    if not key_bundle:
        raise HTTPException(status_code=400, detail="Missing company public parameters")
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    qr_data = generate_pseudonym(
        credential.credential_blob,
        key_bundle.public_parameters,
        _normalize_attribute_list(payload.own_attributes),
        _normalize_attribute_map(payload.delegated_attributes),
        _normalize_attribute_map(payload.simulated_attributes),
        _normalize_access_tree(payload.access_tree),
        {
            **payload.message,
            "nonce": payload.gate_nonce,
            "worker_id": worker.external_worker_id,
            "company": company.name,
            "role": credential.credential_blob.get("role", worker.attributes.get("role")),
            "credential_expiry": credential.expires_at.isoformat(),
        },
    )
    pseudonym = Pseudonym(
        worker_id=worker.id,
        credential_id=credential.id,
        company_id=credential.company_id,
        pseudonym_hash=qr_data["fingerprint"],
        payload=qr_data,
        expires_at=datetime.now(UTC) + timedelta(seconds=settings.pseudonym_ttl_seconds),
    )
    db.add(pseudonym)
    await db.commit()
    await db.refresh(pseudonym)
    qr_data.update(
        {
            "pseudonym_id": pseudonym.id,
            "worker_id": worker.id,
            "worker_identifier": worker.external_worker_id,
            "company_id": credential.company_id,
            "company_name": company.name,
            "credential_id": credential.id,
            "credential": {
                "worker_id": worker.external_worker_id,
                "company": company.name,
                "role": credential.credential_blob.get("role", worker.attributes.get("role")),
                "expiry": credential.expires_at.isoformat(),
            },
        }
    )
    pseudonym.payload = qr_data
    await db.commit()
    return qr_data


@router.post("/verify-status", response_model=MessageResponse)
async def verify_status(
    payload: VerifyStatusRequest,
    db: AsyncSession = Depends(get_db),
    worker: Worker = Depends(require_worker),
) -> MessageResponse:
    pseudonym = await db.scalar(select(Pseudonym).where(Pseudonym.id == payload.pseudonym_id, Pseudonym.worker_id == worker.id))
    if not pseudonym:
        raise HTTPException(status_code=404, detail="Pseudonym not found")
    return MessageResponse(message=pseudonym.status)


@router.get("/history")
async def worker_history(
    db: AsyncSession = Depends(get_db),
    worker: Worker = Depends(require_worker),
) -> list[dict]:
    logs = await db.scalars(
        select(AccessLog).where(AccessLog.worker_id == worker.id).order_by(AccessLog.created_at.desc()).limit(100)
    )
    return [
        {
            "id": log.id,
            "result": log.result,
            "reason": log.reason,
            "gate_id": log.gate_id,
            "created_at": log.created_at,
        }
        for log in logs
    ]
