import secrets
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_gate
from app.core.config import get_settings
from app.core.security import hash_password
from app.db.session import get_db
from app.models.entities import Company, CompanyPublicKey, Gate, NonceTracking, RevocationList
from app.repositories.gate_repo import GateRepository
from app.schemas.auth import LoginRequest
from app.schemas.common import MessageResponse, StatusResponse, TokenResponse
from app.schemas.gate import GateRegisterRequest, NonceRequest, SyncRequest, VerifyRequest
from app.services.verification_service import VerificationService
from app.services.auth import issue_login_cookie, validate_password

router = APIRouter(prefix="/gate", tags=["gate"])
settings = get_settings()


@router.post("/register", response_model=MessageResponse)
async def register_gate(payload: GateRegisterRequest, db: AsyncSession = Depends(get_db)) -> MessageResponse:
    gate = Gate(
        name=payload.name,
        identifier=payload.identifier,
        location=payload.location,
        password_hash=hash_password(payload.password),
        status="pending",
        offline_bundle={
            "institution": payload.institution,
            "device_details": payload.device_details,
            "trusted_companies": [],
            "last_sync": None,
        },
    )
    db.add(gate)
    await db.commit()
    return MessageResponse(message="Gate registered")


@router.post("/auth", response_model=TokenResponse)
async def auth_gate(payload: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    gate = await db.scalar(select(Gate).where(Gate.identifier == payload.identifier))
    if not gate:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if gate.status in {"rejected", "revoked", "expired"}:
        raise HTTPException(status_code=403, detail=f"Gate is {gate.status}")
    validate_password(payload.password, gate.password_hash)
    token = issue_login_cookie(response, gate.id, "gate")
    return TokenResponse(access_token=token)


@router.post("/nonce")
async def issue_nonce(
    payload: NonceRequest,
    db: AsyncSession = Depends(get_db),
    gate: Gate = Depends(require_gate),
) -> dict:
    if gate.id != payload.gate_id:
        raise HTTPException(status_code=403, detail="Gate mismatch")
    if gate.status != "approved":
        raise HTTPException(status_code=403, detail=f"Gate is {gate.status}")
    nonce_record = await GateRepository(db).create_nonce(gate.id, settings.nonce_ttl_seconds)
    return {"gate_id": gate.id, "nonce": nonce_record.nonce, "expires_at": nonce_record.expires_at}


@router.post("/verify")
async def verify_gate_access(
    payload: VerifyRequest,
    db: AsyncSession = Depends(get_db),
    gate: Gate = Depends(require_gate),
) -> dict:
    if gate.id != payload.gate_id:
        raise HTTPException(status_code=403, detail="Gate mismatch")
    if gate.status != "approved":
        raise HTTPException(status_code=403, detail=f"Gate is {gate.status}")
    return await VerificationService(db).verify(
        qr_data=payload.qr_data,
        gate_id=payload.gate_id,
        gate_nonce=payload.gate_nonce,
        received_nonce=payload.received_nonce,
        timestamp=payload.timestamp.astimezone(UTC),
    )


@router.post("/sync", response_model=MessageResponse)
async def sync_gate_data(
    payload: SyncRequest,
    db: AsyncSession = Depends(get_db),
    gate: Gate = Depends(require_gate),
) -> dict:
    if gate.id != payload.gate_id:
        raise HTTPException(status_code=403, detail="Gate mismatch")
    if gate.status == "revoked":
        raise HTTPException(status_code=403, detail="Gate is revoked")
    key_rows = await db.scalars(select(CompanyPublicKey))
    trusted = []
    for key in key_rows:
        company = await db.scalar(select(Company).where(Company.id == key.company_id))
        if not company or company.status != "approved":
            continue
        trusted.append(
            {
                "company_id": key.company_id,
                "company_name": company.name,
                "provider": key.provider,
                "public_parameters": {
                    k: v for k, v in key.public_parameters.items() if k != "secret_keys"
                },
                "attribute_generators": key.attribute_generators,
                "updated_at": key.updated_at,
            }
        )
    revocations = await db.scalars(select(RevocationList).where(RevocationList.active.is_(True)))
    gate.offline_bundle = {
        **gate.offline_bundle,
        "trusted_companies": trusted,
        "revocation_list": [
            {"entity_type": item.entity_type, "entity_id": item.entity_id, "reason": item.reason}
            for item in revocations
        ],
        "last_sync": datetime.now(UTC).isoformat(),
    }
    await db.commit()
    return gate.offline_bundle


@router.get("/status", response_model=StatusResponse)
async def gate_status(gate: Gate = Depends(require_gate)) -> StatusResponse:
    return StatusResponse(status=gate.status, timestamp=datetime.now(UTC))
