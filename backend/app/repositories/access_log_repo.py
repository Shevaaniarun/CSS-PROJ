from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entities import AccessLog, RevocationList
from app.repositories.base_repo import BaseRepository


class AccessLogRepository(BaseRepository[AccessLog]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, AccessLog)

    async def log_access_attempt(
        self,
        *,
        gate_id: str,
        worker_id: str | None,
        pseudonym_id: str | None,
        company_id: str | None,
        result: str,
        reason: str,
        checks: dict,
        request_payload: dict,
    ) -> AccessLog:
        log = AccessLog(
            gate_id=gate_id,
            worker_id=worker_id,
            pseudonym_id=pseudonym_id,
            company_id=company_id,
            result=result,
            reason=reason,
            request_payload={**request_payload, "checks": checks},
        )
        return await self.add(log)

    async def get_stats(self) -> dict:
        total = await self.session.scalar(select(func.count(AccessLog.id)))
        granted = await self.session.scalar(
            select(func.count(AccessLog.id)).where(AccessLog.result == "grant")
        )
        denied = await self.session.scalar(
            select(func.count(AccessLog.id)).where(AccessLog.result == "deny")
        )
        total_value = total or 0
        granted_value = granted or 0
        denied_value = denied or 0
        success_rate = (granted_value / total_value) if total_value else 0.0
        return {
            "total_attempts": total_value,
            "granted": granted_value,
            "denied": denied_value,
            "success_rate": success_rate,
        }

    async def add_revocation(self, entity_type: str, entity_id: str, reason: str) -> RevocationList:
        revocation = RevocationList(entity_type=entity_type, entity_id=entity_id, reason=reason)
        return await BaseRepository(self.session, RevocationList).add(revocation)

    async def is_revoked(self, entity_type: str, entity_id: str) -> bool:
        revoked = await self.session.scalar(
            select(RevocationList).where(
                RevocationList.entity_type == entity_type,
                RevocationList.entity_id == entity_id,
                RevocationList.active.is_(True),
            )
        )
        return revoked is not None
