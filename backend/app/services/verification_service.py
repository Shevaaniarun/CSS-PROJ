from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entities import CompanyPublicKey, Credential, Pseudonym, Worker
from app.repositories.access_log_repo import AccessLogRepository
from app.repositories.company_repo import CompanyRepository
from app.repositories.gate_repo import GateRepository
from app.services.crypto_service import verify_signature


def _as_utc(value: datetime) -> datetime:
    return value if value.tzinfo else value.replace(tzinfo=UTC)


class VerificationService:
    """Implements the 7-step gate verification pipeline."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.company_repo = CompanyRepository(session)
        self.gate_repo = GateRepository(session)
        self.log_repo = AccessLogRepository(session)

    async def verify(
        self,
        *,
        qr_data: dict,
        gate_id: str,
        gate_nonce: str,
        received_nonce: str,
        timestamp: datetime,
    ) -> dict:
        checks = {
            "signature_verified": False,
            "expiry_check_passed": False,
            "timestamp_check_passed": False,
            "nonce_check_passed": False,
            "trust_check_passed": False,
            "revocation_check_passed": False,
            "replay_check_passed": False,
        }
        result = "deny"
        reason = "unknown"

        gate = await self.gate_repo.get(gate_id)
        if not gate or gate.status != "approved":
            reason = "gate_unavailable"
            return await self._finish(qr_data, gate_id, checks, result, reason)

        key_bundle = await self.company_repo.get_public_key_bundle(qr_data["company_id"])
        if not key_bundle or not verify_signature(qr_data, key_bundle.public_parameters):
            reason = "signature_invalid"
            return await self._finish(qr_data, gate_id, checks, result, reason)
        checks["signature_verified"] = True

        credential = await self.session.scalar(select(Credential).where(Credential.id == qr_data["credential_id"]))
        worker = await self.session.scalar(select(Worker).where(Worker.id == qr_data["worker_id"]))
        pseudonym = await self.session.scalar(
            select(Pseudonym).where(Pseudonym.pseudonym_hash == qr_data["fingerprint"])
        )
        company = await self.company_repo.get(qr_data["company_id"])
        if not credential or not worker or not pseudonym or not company:
            reason = "missing_entities"
            return await self._finish(qr_data, gate_id, checks, result, reason)

        if _as_utc(credential.expires_at) < datetime.now(UTC):
            reason = "credential_expired"
            return await self._finish(qr_data, gate_id, checks, result, reason)
        checks["expiry_check_passed"] = True

        if abs((datetime.now(UTC) - timestamp).total_seconds()) > 300:
            reason = "timestamp_out_of_window"
            return await self._finish(qr_data, gate_id, checks, result, reason)
        checks["timestamp_check_passed"] = True

        if received_nonce != gate_nonce or qr_data["message"].get("nonce") != gate_nonce:
            reason = "nonce_invalid"
            return await self._finish(qr_data, gate_id, checks, result, reason)
        if not await self.gate_repo.validate_nonce(gate_id, received_nonce):
            reason = "nonce_invalid"
            return await self._finish(qr_data, gate_id, checks, result, reason)
        checks["nonce_check_passed"] = True

        if company.status != "approved":
            reason = "company_untrusted"
            return await self._finish(qr_data, gate_id, checks, result, reason)
        checks["trust_check_passed"] = True

        revoked_entities = [
            await self.log_repo.is_revoked("company", company.id),
            await self.log_repo.is_revoked("worker", worker.id),
            await self.log_repo.is_revoked("credential", credential.id),
            await self.log_repo.is_revoked("pseudonym", pseudonym.id),
            await self.log_repo.is_revoked("gate", gate.id),
        ]
        if any(revoked_entities):
            reason = "revoked_entity"
            return await self._finish(qr_data, gate_id, checks, result, reason)
        checks["revocation_check_passed"] = True

        if pseudonym.status == "used":
            reason = "replay_detected"
            return await self._finish(qr_data, gate_id, checks, result, reason)
        checks["replay_check_passed"] = True

        pseudonym.status = "used"
        await self.session.commit()
        result = "grant"
        reason = "grant"
        return await self._finish(qr_data, gate_id, checks, result, reason)

    async def _finish(
        self,
        qr_data: dict,
        gate_id: str,
        checks: dict,
        result: str,
        reason: str,
    ) -> dict:
        await self.log_repo.log_access_attempt(
            gate_id=gate_id,
            worker_id=qr_data.get("worker_id"),
            pseudonym_id=qr_data.get("pseudonym_id"),
            company_id=qr_data.get("company_id"),
            result=result,
            reason=reason,
            checks=checks,
            request_payload=qr_data,
        )
        return {
            "granted": result == "grant",
            "signature_verified": checks["signature_verified"],
            "expiry_check_passed": checks["expiry_check_passed"],
            "timestamp_check_passed": checks["timestamp_check_passed"],
            "nonce_check_passed": checks["nonce_check_passed"],
            "trust_check_passed": checks["trust_check_passed"],
            "revocation_check_passed": checks["revocation_check_passed"],
            "replay_check_passed": checks["replay_check_passed"],
            "failure_reason": None if result == "grant" else reason,
            "pseudonym_id": qr_data.get("pseudonym_id"),
        }
