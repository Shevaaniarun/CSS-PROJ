from __future__ import annotations

import asyncio
from datetime import UTC, datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.db.base import Base
from app.repositories.access_log_repo import AccessLogRepository
from app.repositories.company_repo import CompanyRepository
from app.repositories.gate_repo import GateRepository
from app.repositories.worker_repo import WorkerRepository


async def _create_session() -> tuple[AsyncSession, object]:
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    return session_factory(), engine


def test_company_repository_create_and_approve() -> None:
    async def scenario() -> None:
        session, engine = await _create_session()
        async with session:
            repo = CompanyRepository(session)
            company = await repo.create_company(
                name="Amazon",
                email="amazon@example.com",
                password_hash="hashed-secret",
                metadata={"license_id": "LIC-1"},
                attribute_universe=["company", "role"],
                provider_name="mock",
            )
            assert company.status == "pending"
            approved = await repo.approve_company(company.id, True, "ok")
            assert approved is not None
            assert approved.status == "approved"
            approved_companies = await repo.get_approved_companies()
            assert len(approved_companies) == 1
        await engine.dispose()

    asyncio.run(scenario())


def test_worker_repository_issue_credential() -> None:
    async def scenario() -> None:
        session, engine = await _create_session()
        async with session:
            company_repo = CompanyRepository(session)
            company = await company_repo.create_company(
                name="Amazon",
                email="amazon@example.com",
                password_hash="hashed-secret",
                metadata={"license_id": "LIC-1"},
                attribute_universe=["company", "role"],
                provider_name="mock",
            )
            await company_repo.approve_company(company.id, True)
            worker_repo = WorkerRepository(session)
            worker = await worker_repo.create_worker(
                company_id=company.id,
                full_name="Courier One",
                phone="9999999999",
                external_worker_id="WRK-1",
                password_hash="hashed-worker",
                attributes={"company": "Amazon", "role": "delivery"},
            )
            credential = await worker_repo.issue_credential(
                worker_id=worker.id,
                company_id=company.id,
                attributes=["company", "role"],
                role="delivery",
                expires_at=datetime.now(UTC) + timedelta(days=1),
            )
            assert credential.credential_blob["worker_id"] == "WRK-1"
            assert credential.credential_blob["role"] == "delivery"
        await engine.dispose()

    asyncio.run(scenario())


def test_gate_nonce_and_api_key() -> None:
    async def scenario() -> None:
        session, engine = await _create_session()
        async with session:
            repo = GateRepository(session)
            gate = await repo.register_gate(
                name="North Gate",
                identifier="GATE-1",
                location="North campus",
                password_hash="hashed-gate",
                institution="Campus",
                device_details={"camera": "usb"},
            )
            gate.status = "approved"
            await session.commit()
            assert await repo.verify_api_key(gate.id, gate.offline_bundle["api_key"])
            nonce = await repo.create_nonce(gate.id, ttl_seconds=30)
            assert await repo.validate_nonce(gate.id, nonce.nonce)
            assert not await repo.validate_nonce(gate.id, nonce.nonce)
        await engine.dispose()

    asyncio.run(scenario())


def test_access_log_stats_and_revocation() -> None:
    async def scenario() -> None:
        session, engine = await _create_session()
        async with session:
            repo = AccessLogRepository(session)
            await repo.log_access_attempt(
                gate_id="gate-1",
                worker_id=None,
                pseudonym_id=None,
                company_id=None,
                result="grant",
                reason="grant",
                checks={"signature_verified": True},
                request_payload={},
            )
            await repo.log_access_attempt(
                gate_id="gate-1",
                worker_id=None,
                pseudonym_id=None,
                company_id=None,
                result="deny",
                reason="nonce_invalid",
                checks={"nonce_check_passed": False},
                request_payload={},
            )
            stats = await repo.get_stats()
            assert stats["total_attempts"] == 2
            assert stats["granted"] == 1
            assert stats["denied"] == 1
            revocation = await repo.add_revocation("worker", "worker-1", "fraud")
            assert revocation.entity_type == "worker"
            assert await repo.is_revoked("worker", "worker-1")
        await engine.dispose()

    asyncio.run(scenario())
