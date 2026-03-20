from fastapi import Depends, HTTPException, Request, status
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.db.session import get_db
from app.models.entities import Admin, Company, Gate, Worker

settings = get_settings()


async def get_current_token_payload(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing auth cookie")
    try:
        return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc


async def require_admin(
    payload: dict = Depends(get_current_token_payload), db: AsyncSession = Depends(get_db)
) -> Admin:
    if payload.get("role") not in {"admin", "super_admin"}:
        raise HTTPException(status_code=403, detail="Admin role required")
    admin = await db.scalar(select(Admin).where(Admin.id == payload["sub"]))
    if not admin:
        raise HTTPException(status_code=401, detail="Admin not found")
    return admin


async def require_company(
    payload: dict = Depends(get_current_token_payload), db: AsyncSession = Depends(get_db)
) -> Company:
    if payload.get("role") != "company":
        raise HTTPException(status_code=403, detail="Company role required")
    company = await db.scalar(select(Company).where(Company.id == payload["sub"]))
    if not company:
        raise HTTPException(status_code=401, detail="Company not found")
    return company


async def require_gate(
    payload: dict = Depends(get_current_token_payload), db: AsyncSession = Depends(get_db)
) -> Gate:
    if payload.get("role") != "gate":
        raise HTTPException(status_code=403, detail="Gate role required")
    gate = await db.scalar(select(Gate).where(Gate.id == payload["sub"]))
    if not gate:
        raise HTTPException(status_code=401, detail="Gate not found")
    return gate


async def require_worker(
    payload: dict = Depends(get_current_token_payload), db: AsyncSession = Depends(get_db)
) -> Worker:
    if payload.get("role") != "worker":
        raise HTTPException(status_code=403, detail="Worker role required")
    worker = await db.scalar(select(Worker).where(Worker.id == payload["sub"]))
    if not worker:
        raise HTTPException(status_code=401, detail="Worker not found")
    return worker

