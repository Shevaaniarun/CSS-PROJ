import asyncio
from datetime import UTC, datetime, timedelta

from httpx import ASGITransport, AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.security import hash_password
from app.db.base import Base
from app.db.session import get_db
from app.main import create_app
from app.models.entities import Admin, Company, Credential, Gate, Worker
from app.api.v1 import admin as admin_api
from app.api.v1 import company as company_api
from app.api.v1 import gate as gate_api
from app.api.v1 import worker as worker_api


def _patch_auth_helpers() -> None:
    def fake_hash_password(password: str) -> str:
        return password

    def fake_validate_password(password: str, password_hash: str) -> None:
        if password != password_hash:
            raise AssertionError("Password validation failed in test stub")

    admin_api.validate_password = fake_validate_password
    company_api.hash_password = fake_hash_password
    company_api.validate_password = fake_validate_password
    gate_api.hash_password = fake_hash_password
    gate_api.validate_password = fake_validate_password
    worker_api.validate_password = fake_validate_password


async def _create_client():
    _patch_auth_helpers()
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", future=True)
    session_maker = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    app = create_app()

    async def override_get_db():
        async with session_maker() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    client = AsyncClient(transport=transport, base_url="http://testserver")
    return app, engine, session_maker, client


async def _close_client(engine, client: AsyncClient):
    await client.aclose()
    await engine.dispose()


async def _seed_admin(session_maker):
    async with session_maker() as session:
        admin = Admin(
            email="admin@example.com",
            full_name="Super Admin",
            password_hash="admin-pass",
            role="super_admin",
        )
        session.add(admin)
        await session.commit()


async def _login_admin(client: AsyncClient):
    response = await client.post("/api/v1/admin/login", json={"email": "admin@example.com", "password": "admin-pass"})
    assert response.status_code == 200


async def _run_admin_company_gate_flow():
    app, engine, session_maker, client = await _create_client()
    try:
        await _seed_admin(session_maker)

        company_register = await client.post(
            "/api/v1/company/register",
            json={
                "name": "Amazon Campus",
                "email": "ops@amazon-campus.test",
                "password": "company-pass",
                "license_id": "LIC-101",
                "contact_name": "Ops Lead",
                "contact_phone": "9999999999",
                "metadata": {"region": "north-campus"},
            },
        )
        assert company_register.status_code == 200

        gate_register = await client.post(
            "/api/v1/gate/register",
            json={
                "name": "North Gate",
                "identifier": "north-gate-01",
                "location": "North Campus",
                "institution": "Campus A",
                "device_details": {"model": "kiosk-v1"},
                "password": "gate-pass",
            },
        )
        assert gate_register.status_code == 200

        await _login_admin(client)

        pending_companies = await client.get("/api/v1/admin/pending-companies")
        pending_gates = await client.get("/api/v1/admin/pending-gates")
        assert pending_companies.status_code == 200
        assert pending_gates.status_code == 200
        company_id = pending_companies.json()[0]["id"]
        gate_id = pending_gates.json()[0]["id"]

        approve_company = await client.post(
            f"/api/v1/admin/approve-company/{company_id}",
            json={"approve": True, "notes": "Approved in API integration test"},
        )
        approve_gate = await client.post(
            f"/api/v1/admin/approve-gate/{gate_id}",
            json={"approve": True, "notes": "Approved in API integration test"},
        )
        assert approve_company.status_code == 200
        assert approve_gate.status_code == 200

        company_login = await client.post(
            "/api/v1/company/auth",
            json={"email": "ops@amazon-campus.test", "password": "company-pass"},
        )
        assert company_login.status_code == 200

        create_worker = await client.post(
            "/api/v1/company/workers",
            json={
                "worker_id": "worker-1001",
                "full_name": "Delivery Rider",
                "phone": "8888888888",
                "password": "worker-pass",
                "role": "delivery",
                "attributes": {"route": "hostel", "shift": "morning"},
            },
        )
        assert create_worker.status_code == 200
        worker_id = create_worker.json()["id"]

        issue_credential = await client.post(
            "/api/v1/company/credentials/issue",
            json={
                "worker_id": worker_id,
                "expires_at": (datetime.now(UTC) + timedelta(days=30)).isoformat(),
                "role": "delivery",
                "attributes": ["company:Amazon Campus", "role:delivery"],
            },
        )
        assert issue_credential.status_code == 200

        list_credentials = await client.get("/api/v1/company/credentials")
        assert list_credentials.status_code == 200
        credentials = list_credentials.json()
        assert len(credentials) == 1
        assert credentials[0]["external_worker_id"] == "worker-1001"
    finally:
        app.dependency_overrides.clear()
        await _close_client(engine, client)


async def _run_worker_gate_verification_flow():
    app, engine, session_maker, client = await _create_client()
    try:
        await _seed_admin(session_maker)

        await client.post(
            "/api/v1/company/register",
            json={
                "name": "Swiggy Campus",
                "email": "ops@swiggy-campus.test",
                "password": "company-pass",
                "license_id": "LIC-202",
                "contact_name": "Ops Lead",
                "contact_phone": "7777777777",
                "metadata": {"region": "west-campus"},
            },
        )
        await client.post(
            "/api/v1/gate/register",
            json={
                "name": "West Gate",
                "identifier": "west-gate-01",
                "location": "West Campus",
                "institution": "Campus B",
                "device_details": {"model": "kiosk-v2"},
                "password": "gate-pass",
            },
        )

        await _login_admin(client)
        company_id = (await client.get("/api/v1/admin/pending-companies")).json()[0]["id"]
        gate_id = (await client.get("/api/v1/admin/pending-gates")).json()[0]["id"]
        await client.post(f"/api/v1/admin/approve-company/{company_id}", json={"approve": True, "notes": "ok"})
        await client.post(f"/api/v1/admin/approve-gate/{gate_id}", json={"approve": True, "notes": "ok"})

        await client.post(
            "/api/v1/company/auth",
            json={"email": "ops@swiggy-campus.test", "password": "company-pass"},
        )
        worker_response = await client.post(
            "/api/v1/company/workers",
            json={
                "worker_id": "worker-2002",
                "full_name": "Courier Worker",
                "phone": "6666666666",
                "password": "worker-pass",
                "role": "delivery",
                "attributes": {"route": "library", "vehicle": "bike"},
            },
        )
        worker_id = worker_response.json()["id"]
        await client.post(
            "/api/v1/company/credentials/issue",
            json={
                "worker_id": worker_id,
                "expires_at": (datetime.now(UTC) + timedelta(days=30)).isoformat(),
                "role": "delivery",
                "attributes": ["company:Swiggy Campus", "role:delivery"],
            },
        )

        async with session_maker() as session:
            credential = await session.scalar(select(Credential).where(Credential.worker_id == worker_id))
            gate = await session.scalar(select(Gate).where(Gate.id == gate_id))
            company = await session.scalar(select(Company).where(Company.id == company_id))
            assert credential is not None
            assert gate is not None
            assert company is not None
            credential_id = credential.id

        gate_client = AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver")
        worker_client = AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver")
        try:
            gate_login = await gate_client.post(
                "/api/v1/gate/auth",
                json={"identifier": "west-gate-01", "password": "gate-pass"},
            )
            assert gate_login.status_code == 200
            nonce_response = await gate_client.post("/api/v1/gate/nonce", json={"gate_id": gate_id})
            assert nonce_response.status_code == 200
            gate_nonce = nonce_response.json()["nonce"]

            worker_login = await worker_client.post(
                "/api/v1/worker/auth",
                json={"external_worker_id": "worker-2002", "password": "worker-pass"},
            )
            assert worker_login.status_code == 200
            pseudonym_response = await worker_client.post(
                "/api/v1/worker/pseudonym/generate",
                json={
                    "credential_id": credential_id,
                    "gate_nonce": gate_nonce,
                    "own_attributes": ["company:Swiggy Campus", "role:delivery"],
                    "delegated_attributes": {},
                    "simulated_attributes": {},
                    "access_tree": {
                        "type": "AND",
                        "children": [
                            {"type": "leaf", "attribute": "company:Swiggy Campus"},
                            {"type": "leaf", "attribute": "role:delivery"},
                        ],
                    },
                    "message": {"purpose": "campus-entry"},
                },
            )
            assert pseudonym_response.status_code == 200
            qr_data = pseudonym_response.json()

            verify_response = await gate_client.post(
                "/api/v1/gate/verify",
                json={
                    "gate_id": gate_id,
                    "gate_nonce": gate_nonce,
                    "received_nonce": gate_nonce,
                    "timestamp": datetime.now(UTC).isoformat(),
                    "qr_data": qr_data,
                },
            )
            assert verify_response.status_code == 200
            verification = verify_response.json()
            assert verification["granted"] is True
        finally:
            await gate_client.aclose()
            await worker_client.aclose()
    finally:
        app.dependency_overrides.clear()
        await _close_client(engine, client)


def test_admin_company_gate_api_flow() -> None:
    asyncio.run(_run_admin_company_gate_flow())


def test_worker_gate_verification_api_flow() -> None:
    asyncio.run(_run_worker_gate_verification_flow())


async def _prepare_verification_fixture(
    *,
    credential_expiry_offset_days: int = 30,
):
    app, engine, session_maker, client = await _create_client()
    await _seed_admin(session_maker)

    await client.post(
        "/api/v1/company/register",
        json={
            "name": "Blinkit Campus",
            "email": "ops@blinkit-campus.test",
            "password": "company-pass",
            "license_id": "LIC-303",
            "contact_name": "Ops Lead",
            "contact_phone": "5555555555",
            "metadata": {"region": "east-campus"},
        },
    )
    await client.post(
        "/api/v1/gate/register",
        json={
            "name": "East Gate",
            "identifier": "east-gate-01",
            "location": "East Campus",
            "institution": "Campus C",
            "device_details": {"model": "kiosk-v3"},
            "password": "gate-pass",
        },
    )
    await _login_admin(client)
    company_id = (await client.get("/api/v1/admin/pending-companies")).json()[0]["id"]
    gate_id = (await client.get("/api/v1/admin/pending-gates")).json()[0]["id"]
    await client.post(f"/api/v1/admin/approve-company/{company_id}", json={"approve": True, "notes": "ok"})
    await client.post(f"/api/v1/admin/approve-gate/{gate_id}", json={"approve": True, "notes": "ok"})

    await client.post("/api/v1/company/auth", json={"email": "ops@blinkit-campus.test", "password": "company-pass"})
    worker_response = await client.post(
        "/api/v1/company/workers",
        json={
            "worker_id": "worker-3003",
            "full_name": "Campus Worker",
            "phone": "5555551234",
            "password": "worker-pass",
            "role": "delivery",
            "attributes": {"route": "canteen", "vehicle": "bike"},
        },
    )
    worker_id = worker_response.json()["id"]
    await client.post(
        "/api/v1/company/credentials/issue",
        json={
            "worker_id": worker_id,
            "expires_at": (datetime.now(UTC) + timedelta(days=credential_expiry_offset_days)).isoformat(),
            "role": "delivery",
            "attributes": ["company:Blinkit Campus", "role:delivery"],
        },
    )

    async with session_maker() as session:
        credential = await session.scalar(select(Credential).where(Credential.worker_id == worker_id))
        assert credential is not None
        credential_id = credential.id

    gate_client = AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver")
    worker_client = AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver")
    gate_login = await gate_client.post("/api/v1/gate/auth", json={"identifier": "east-gate-01", "password": "gate-pass"})
    assert gate_login.status_code == 200
    nonce_response = await gate_client.post("/api/v1/gate/nonce", json={"gate_id": gate_id})
    assert nonce_response.status_code == 200
    gate_nonce = nonce_response.json()["nonce"]

    worker_login = await worker_client.post(
        "/api/v1/worker/auth",
        json={"external_worker_id": "worker-3003", "password": "worker-pass"},
    )
    assert worker_login.status_code == 200
    pseudonym_response = await worker_client.post(
        "/api/v1/worker/pseudonym/generate",
        json={
            "credential_id": credential_id,
            "gate_nonce": gate_nonce,
            "own_attributes": ["company:Blinkit Campus", "role:delivery"],
            "delegated_attributes": {},
            "simulated_attributes": {},
            "access_tree": {
                "type": "AND",
                "children": [
                    {"type": "leaf", "attribute": "company:Blinkit Campus"},
                    {"type": "leaf", "attribute": "role:delivery"},
                ],
            },
            "message": {"purpose": "campus-entry"},
        },
    )
    assert pseudonym_response.status_code == 200
    qr_data = pseudonym_response.json()
    return {
        "app": app,
        "engine": engine,
        "session_maker": session_maker,
        "client": client,
        "gate_client": gate_client,
        "worker_client": worker_client,
        "company_id": company_id,
        "gate_id": gate_id,
        "worker_id": worker_id,
        "credential_id": credential_id,
        "gate_nonce": gate_nonce,
        "qr_data": qr_data,
    }


async def _close_fixture(fixture: dict) -> None:
    await fixture["gate_client"].aclose()
    await fixture["worker_client"].aclose()
    fixture["app"].dependency_overrides.clear()
    await _close_client(fixture["engine"], fixture["client"])


def _verify_payload(fixture: dict, **overrides):
    payload = {
        "gate_id": fixture["gate_id"],
        "gate_nonce": fixture["gate_nonce"],
        "received_nonce": fixture["gate_nonce"],
        "timestamp": datetime.now(UTC).isoformat(),
        "qr_data": fixture["qr_data"],
    }
    payload.update(overrides)
    return payload


async def _run_replay_attack_flow():
    fixture = await _prepare_verification_fixture()
    try:
        first = await fixture["gate_client"].post("/api/v1/gate/verify", json=_verify_payload(fixture))
        second = await fixture["gate_client"].post("/api/v1/gate/verify", json=_verify_payload(fixture))
        assert first.status_code == 200
        assert second.status_code == 200
        assert first.json()["granted"] is True
        assert second.json()["granted"] is False
        assert second.json()["failure_reason"] in {"replay_detected", "nonce_invalid"}
    finally:
        await _close_fixture(fixture)


async def _run_expired_credential_flow():
    fixture = await _prepare_verification_fixture(credential_expiry_offset_days=-1)
    try:
      response = await fixture["gate_client"].post("/api/v1/gate/verify", json=_verify_payload(fixture))
      assert response.status_code == 200
      assert response.json()["granted"] is False
      assert response.json()["failure_reason"] == "credential_expired"
    finally:
      await _close_fixture(fixture)


async def _run_revoked_worker_flow():
    fixture = await _prepare_verification_fixture()
    try:
      revoke = await fixture["client"].post(f"/api/v1/company/workers/{fixture['worker_id']}/revoke")
      assert revoke.status_code == 200
      response = await fixture["gate_client"].post("/api/v1/gate/verify", json=_verify_payload(fixture))
      assert response.status_code == 200
      assert response.json()["granted"] is False
      assert response.json()["failure_reason"] == "revoked_entity"
    finally:
      await _close_fixture(fixture)


async def _run_revoked_company_flow():
    fixture = await _prepare_verification_fixture()
    try:
      await _login_admin(fixture["client"])
      revoke = await fixture["client"].post(
          "/api/v1/admin/revoke",
          json={"entity_type": "company", "entity_id": fixture["company_id"], "reason": "test"},
      )
      assert revoke.status_code == 200
      response = await fixture["gate_client"].post("/api/v1/gate/verify", json=_verify_payload(fixture))
      assert response.status_code == 200
      assert response.json()["granted"] is False
      assert response.json()["failure_reason"] == "company_untrusted"
    finally:
      await _close_fixture(fixture)


async def _run_invalid_nonce_flow():
    fixture = await _prepare_verification_fixture()
    try:
      response = await fixture["gate_client"].post(
          "/api/v1/gate/verify",
          json=_verify_payload(fixture, received_nonce="bad-nonce"),
      )
      assert response.status_code == 200
      assert response.json()["granted"] is False
      assert response.json()["failure_reason"] == "nonce_invalid"
    finally:
      await _close_fixture(fixture)


async def _run_old_timestamp_flow():
    fixture = await _prepare_verification_fixture()
    try:
      old_timestamp = (datetime.now(UTC) - timedelta(minutes=6)).isoformat()
      response = await fixture["gate_client"].post(
          "/api/v1/gate/verify",
          json=_verify_payload(fixture, timestamp=old_timestamp),
      )
      assert response.status_code == 200
      assert response.json()["granted"] is False
      assert response.json()["failure_reason"] == "timestamp_out_of_window"
    finally:
      await _close_fixture(fixture)


def test_replay_attack_denied() -> None:
    asyncio.run(_run_replay_attack_flow())


def test_expired_credential_denied() -> None:
    asyncio.run(_run_expired_credential_flow())


def test_revoked_worker_denied() -> None:
    asyncio.run(_run_revoked_worker_flow())


def test_revoked_company_denied() -> None:
    asyncio.run(_run_revoked_company_flow())


def test_invalid_nonce_denied() -> None:
    asyncio.run(_run_invalid_nonce_flow())


def test_old_timestamp_denied() -> None:
    asyncio.run(_run_old_timestamp_flow())
