from __future__ import annotations

import secrets
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entities import Gate, NonceTracking
from app.repositories.base_repo import BaseRepository


class GateRepository(BaseRepository[Gate]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, Gate)

    async def register_gate(
        self,
        *,
        name: str,
        identifier: str,
        location: str,
        password_hash: str,
        institution: str,
        device_details: dict,
    ) -> Gate:
        api_key = secrets.token_urlsafe(24)
        gate = Gate(
            name=name,
            identifier=identifier,
            location=location,
            password_hash=password_hash,
            status="pending",
            offline_bundle={
                "institution": institution,
                "device_details": device_details,
                "api_key": api_key,
                "trusted_companies": [],
            },
        )
        return await self.add(gate)

    async def verify_api_key(self, gate_id: str, api_key: str) -> bool:
        gate = await self.get(gate_id)
        if not gate or gate.status == "revoked":
            return False
        return gate.offline_bundle.get("api_key") == api_key

    async def create_nonce(self, gate_id: str, ttl_seconds: int = 30) -> NonceTracking:
        nonce = NonceTracking(
            gate_id=gate_id,
            nonce=secrets.token_urlsafe(16),
            expires_at=datetime.now(UTC) + timedelta(seconds=ttl_seconds),
            consumed=False,
        )
        return await BaseRepository(self.session, NonceTracking).add(nonce)

    async def validate_nonce(self, gate_id: str, nonce_value: str) -> bool:
        nonce = await self.session.scalar(
            select(NonceTracking).where(
                NonceTracking.gate_id == gate_id,
                NonceTracking.nonce == nonce_value,
                NonceTracking.consumed.is_(False),
            )
        )
        if not nonce:
            return False
        expires_at = nonce.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=UTC)
        if expires_at < datetime.now(UTC):
            return False
        nonce.consumed = True
        await self.session.commit()
        return True
