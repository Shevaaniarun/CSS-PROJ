from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entities import Company, CompanyPublicKey, RevocationList
from app.repositories.base_repo import BaseRepository
from app.services.crypto_service import generate_company_key_bundle


class CompanyRepository(BaseRepository[Company]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, Company)

    async def create_company(
        self,
        *,
        name: str,
        email: str,
        password_hash: str,
        metadata: dict,
        attribute_universe: list[str],
        provider_name: str,
    ) -> Company:
        public_params, secret_keys = generate_company_key_bundle(attribute_universe)
        company = Company(
            name=name,
            email=email,
            password_hash=password_hash,
            metadata_json=metadata,
            status="pending",
        )
        self.session.add(company)
        await self.session.flush()
        self.session.add(
            CompanyPublicKey(
                company_id=company.id,
                provider=provider_name,
                public_parameters={**public_params, "secret_keys": secret_keys},
                attribute_generators=public_params["attribute_generators"],
            )
        )
        await self.session.commit()
        await self.session.refresh(company)
        return company

    async def approve_company(self, company_id: str, approve: bool, notes: str | None = None) -> Company | None:
        company = await self.get(company_id)
        if not company:
            return None
        company.status = "approved" if approve else "rejected"
        company.notes = notes
        await self.session.commit()
        await self.session.refresh(company)
        return company

    async def revoke_company(self, company_id: str, reason: str) -> Company | None:
        company = await self.get(company_id)
        if not company:
            return None
        company.status = "revoked"
        self.session.add(RevocationList(entity_type="company", entity_id=company.id, reason=reason))
        await self.session.commit()
        await self.session.refresh(company)
        return company

    async def get_approved_companies(self) -> list[Company]:
        result = await self.session.scalars(select(Company).where(Company.status == "approved"))
        return list(result)

    async def get_public_key_bundle(self, company_id: str) -> CompanyPublicKey | None:
        return await self.session.scalar(
            select(CompanyPublicKey).where(CompanyPublicKey.company_id == company_id)
        )
