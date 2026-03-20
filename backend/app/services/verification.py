from __future__ import annotations

from datetime import UTC, datetime

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.entities import AccessLog, Company, CompanyPublicKey, Credential, Gate, NonceTracking, Pseudonym, RevocationList, Worker
from app.services.crypto_service import verify_signature

settings = get_settings()


async def verify_access(
    db: AsyncSession,
    *,
    qr_data: dict,
    gate_id: str,
    gate_nonce: str,
    received_nonce: str,
    timestamp: datetime,
) -> dict:
    gate = await db.scalar(select(Gate).where(Gate.id == gate_id))
    if not gate:
        raise HTTPException(status_code=404, detail="Gate not found")
    if gate.status != "approved":
        raise HTTPException(status_code=403, detail=f"Gate is {gate.status}")

    reason = "grant"
    result = "grant"

    key_bundle = await db.scalar(select(CompanyPublicKey).where(CompanyPublicKey.company_id == qr_data["company_id"]))
    if key_bundle is None or not verify_signature(qr_data, key_bundle.public_parameters):
        reason = "signature_invalid"
        result = "deny"
    else:
        credential = await db.scalar(select(Credential).where(Credential.id == qr_data["credential_id"]))
        worker = await db.scalar(select(Worker).where(Worker.id == qr_data["worker_id"]))
        company = await db.scalar(select(Company).where(Company.id == qr_data["company_id"]))
        pseudonym = await db.scalar(
            select(Pseudonym).where(Pseudonym.pseudonym_hash == qr_data["fingerprint"])
        )

        if credential is None or worker is None or company is None or pseudonym is None:
            reason = "missing_entities"
            result = "deny"
        elif credential.expires_at < datetime.now(UTC):
            reason = "credential_expired"
            result = "deny"
        elif abs((datetime.now(UTC) - timestamp).total_seconds()) > 300:
            reason = "timestamp_out_of_window"
            result = "deny"
        else:
            nonce = await db.scalar(
                select(NonceTracking).where(NonceTracking.gate_id == gate_id, NonceTracking.nonce == received_nonce)
            )
            if (
                nonce is None
                or nonce.expires_at < datetime.now(UTC)
                or nonce.consumed
                or received_nonce != gate_nonce
                or qr_data["message"].get("nonce") != gate_nonce
            ):
                reason = "nonce_invalid"
                result = "deny"
            elif company.status != "approved":
                reason = "company_unapproved"
                result = "deny"
            else:
                revocations = await db.scalars(
                    select(RevocationList).where(
                        RevocationList.active.is_(True),
                        RevocationList.entity_id.in_([company.id, worker.id, credential.id, pseudonym.id, gate.id]),
                    )
                )
                if list(revocations):
                    reason = "revoked_entity"
                    result = "deny"
                elif pseudonym.status == "used":
                    reason = "replay_detected"
                    result = "deny"
                else:
                    pseudonym.status = "used"
                    nonce.consumed = True

    db.add(
        AccessLog(
            gate_id=gate_id,
            worker_id=qr_data.get("worker_id"),
            company_id=qr_data.get("company_id"),
            pseudonym_id=qr_data.get("pseudonym_id"),
            result=result,
            reason=reason,
            request_payload=qr_data,
        )
    )
    await db.commit()
    return {"result": result.upper(), "reason": reason}
