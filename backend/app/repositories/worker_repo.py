from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entities import CompanyPublicKey, Credential, RevocationList, Worker
from app.repositories.base_repo import BaseRepository
from app.services.crypto_service import issue_credential


class WorkerRepository(BaseRepository[Worker]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, Worker)

    async def create_worker(
        self,
        *,
        company_id: str,
        full_name: str,
        phone: str,
        external_worker_id: str,
        password_hash: str,
        attributes: dict,
    ) -> Worker:
        existing = await self.session.scalar(
            select(Worker).where(Worker.external_worker_id == external_worker_id)
        )
        if existing:
            raise ValueError("Worker identifier already exists")
        worker = Worker(
            company_id=company_id,
            full_name=full_name,
            phone=phone,
            external_worker_id=external_worker_id,
            password_hash=password_hash,
            attributes=attributes,
            status="active",
        )
        return await self.add(worker)

    async def issue_credential(
        self,
        *,
        worker_id: str,
        company_id: str,
        attributes: list[str],
        role: str,
        expires_at: datetime,
    ) -> Credential:
        worker = await self.get(worker_id)
        if not worker:
            raise ValueError("Worker not found")
        key_bundle = await self.session.scalar(
            select(CompanyPublicKey).where(CompanyPublicKey.company_id == company_id)
        )
        if not key_bundle:
            raise ValueError("Company key bundle not found")
        credential_blob = issue_credential(
            worker.id,
            attributes,
            key_bundle.public_parameters["secret_keys"],
            key_bundle.public_parameters,
        )
        credential_blob.update(
            {
                "worker_id": worker.external_worker_id,
                "role": role,
                "expiry": expires_at.astimezone(UTC).isoformat(),
            }
        )
        credential = Credential(
            worker_id=worker.id,
            company_id=company_id,
            expires_at=expires_at.astimezone(UTC),
            credential_blob=credential_blob,
        )
        return await BaseRepository(self.session, Credential).add(credential)

    async def revoke_worker(self, worker_id: str, reason: str) -> Worker | None:
        worker = await self.get(worker_id)
        if not worker:
            return None
        worker.status = "revoked"
        self.session.add(RevocationList(entity_type="worker", entity_id=worker.id, reason=reason))
        await self.session.commit()
        await self.session.refresh(worker)
        return worker

    async def get_active_workers(self, company_id: str) -> list[Worker]:
        result = await self.session.scalars(
            select(Worker).where(Worker.company_id == company_id, Worker.status == "active")
        )
        return list(result)
