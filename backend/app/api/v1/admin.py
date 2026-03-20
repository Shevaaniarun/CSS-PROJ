from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_admin
from app.core.security import hash_password
from app.db.session import get_db
from app.models.entities import AccessLog, Admin, AuditLog, Company, Gate, RevocationList
from app.schemas.admin import AdminRegisterRequest, CompanyApprovalRequest, CompanySummary, GateSummary, RevokeRequest
from app.schemas.auth import LoginRequest
from app.schemas.common import MessageResponse, TokenResponse
from app.services.audit import write_audit_log
from app.services.auth import issue_login_cookie, validate_password

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/login", response_model=TokenResponse)
async def admin_login(payload: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    admin = await db.scalar(select(Admin).where(Admin.email == payload.email))
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    validate_password(payload.password, admin.password_hash)
    token = issue_login_cookie(response, admin.id, admin.role)
    return TokenResponse(access_token=token)


@router.post("/register", response_model=MessageResponse)
async def admin_register(
    payload: AdminRegisterRequest,
    db: AsyncSession = Depends(get_db),
    current_admin: Admin = Depends(require_admin),
) -> MessageResponse:
    if current_admin.role != "super_admin":
        raise HTTPException(status_code=403, detail="Super admin required")
    admin = Admin(
        email=payload.email,
        full_name=payload.full_name,
        password_hash=hash_password(payload.password),
        role=payload.role,
    )
    db.add(admin)
    await db.commit()
    await write_audit_log(
        db,
        actor_type="admin",
        actor_id=current_admin.id,
        action="admin.register",
        entity_type="admin",
        entity_id=admin.id,
        details={"email": admin.email},
    )
    return MessageResponse(message="Admin created")


@router.get("/pending-companies", response_model=list[CompanySummary])
async def pending_companies(
    db: AsyncSession = Depends(get_db), _: Admin = Depends(require_admin)
) -> list[CompanySummary]:
    companies = await db.scalars(select(Company).where(Company.status == "pending"))
    return [CompanySummary.model_validate(company) for company in companies]


@router.get("/companies", response_model=list[CompanySummary])
async def list_companies(
    db: AsyncSession = Depends(get_db), _: Admin = Depends(require_admin)
) -> list[CompanySummary]:
    companies = await db.scalars(select(Company).order_by(Company.created_at.desc()))
    return [CompanySummary.model_validate(company) for company in companies]


@router.get("/pending-gates", response_model=list[GateSummary])
async def pending_gates(
    db: AsyncSession = Depends(get_db), _: Admin = Depends(require_admin)
) -> list[GateSummary]:
    gates = await db.scalars(select(Gate).where(Gate.status == "pending"))
    return [GateSummary.model_validate(gate) for gate in gates]


@router.get("/gates", response_model=list[GateSummary])
async def list_gates(
    db: AsyncSession = Depends(get_db), _: Admin = Depends(require_admin)
) -> list[GateSummary]:
    gates = await db.scalars(select(Gate).order_by(Gate.created_at.desc()))
    return [GateSummary.model_validate(gate) for gate in gates]


@router.post("/approve-company/{company_id}", response_model=MessageResponse)
async def approve_company(
    company_id: str,
    payload: CompanyApprovalRequest,
    db: AsyncSession = Depends(get_db),
    current_admin: Admin = Depends(require_admin),
) -> MessageResponse:
    company = await db.scalar(select(Company).where(Company.id == company_id))
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    company.status = "approved" if payload.approve else "rejected"
    company.notes = payload.notes
    await db.commit()
    await write_audit_log(
        db,
        actor_type="admin",
        actor_id=current_admin.id,
        action="company.approval",
        entity_type="company",
        entity_id=company.id,
        details={"status": company.status, "notes": payload.notes},
    )
    return MessageResponse(message=f"Company {company.status}")


@router.post("/approve-gate/{gate_id}", response_model=MessageResponse)
async def approve_gate(
    gate_id: str,
    payload: CompanyApprovalRequest,
    db: AsyncSession = Depends(get_db),
    current_admin: Admin = Depends(require_admin),
) -> MessageResponse:
    gate = await db.scalar(select(Gate).where(Gate.id == gate_id))
    if not gate:
        raise HTTPException(status_code=404, detail="Gate not found")
    gate.status = "approved" if payload.approve else "rejected"
    await db.commit()
    await write_audit_log(
        db,
        actor_type="admin",
        actor_id=current_admin.id,
        action="gate.approval",
        entity_type="gate",
        entity_id=gate.id,
        details={"status": gate.status, "notes": payload.notes},
    )
    return MessageResponse(message=f"Gate {gate.status}")


@router.post("/revoke", response_model=MessageResponse)
async def revoke_entity(
    payload: RevokeRequest,
    db: AsyncSession = Depends(get_db),
    current_admin: Admin = Depends(require_admin),
) -> MessageResponse:
    if payload.entity_type == "company":
        company = await db.scalar(select(Company).where(Company.id == payload.entity_id))
        if company:
            company.status = "revoked"
    if payload.entity_type == "gate":
        gate = await db.scalar(select(Gate).where(Gate.id == payload.entity_id))
        if gate:
            gate.status = "revoked"
    revocation = RevocationList(
        entity_type=payload.entity_type, entity_id=payload.entity_id, reason=payload.reason
    )
    db.add(revocation)
    await db.commit()
    await write_audit_log(
        db,
        actor_type="admin",
        actor_id=current_admin.id,
        action="entity.revoke",
        entity_type=payload.entity_type,
        entity_id=payload.entity_id,
        details={"reason": payload.reason, "timestamp": datetime.now(UTC).isoformat()},
    )
    return MessageResponse(message="Entity revoked")


@router.get("/access-logs")
async def access_logs(
    db: AsyncSession = Depends(get_db), _: Admin = Depends(require_admin)
) -> list[dict]:
    logs = await db.scalars(select(AccessLog).order_by(AccessLog.created_at.desc()).limit(100))
    return [
        {
            "id": log.id,
            "gate_id": log.gate_id,
            "worker_id": log.worker_id,
            "result": log.result,
            "reason": log.reason,
            "created_at": log.created_at,
        }
        for log in logs
    ]


@router.get("/stats")
async def stats(
    db: AsyncSession = Depends(get_db), _: Admin = Depends(require_admin)
) -> dict:
    total_attempts = await db.scalar(select(func.count(AccessLog.id)))
    granted = await db.scalar(select(func.count(AccessLog.id)).where(AccessLog.result == "grant"))
    denied = await db.scalar(select(func.count(AccessLog.id)).where(AccessLog.result == "deny"))
    pending_companies_count = await db.scalar(
        select(func.count(Company.id)).where(Company.status == "pending")
    )
    pending_gates_count = await db.scalar(select(func.count(Gate.id)).where(Gate.status == "pending"))
    return {
        "total_attempts": total_attempts or 0,
        "granted": granted or 0,
        "denied": denied or 0,
        "pending_companies": pending_companies_count or 0,
        "pending_gates": pending_gates_count or 0,
    }


@router.get("/audit-logs")
async def audit_logs(
    db: AsyncSession = Depends(get_db), _: Admin = Depends(require_admin)
) -> list[dict]:
    logs = await db.scalars(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(100))
    return [
        {
            "id": log.id,
            "actor_type": log.actor_type,
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "details": log.details,
            "created_at": log.created_at,
        }
        for log in logs
    ]
