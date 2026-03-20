from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.security import hash_password
from app.models.entities import Admin

settings = get_settings()


async def ensure_default_admin(session: AsyncSession) -> Admin | None:
    """Create a development super admin if none exists yet."""
    existing = await session.scalar(select(Admin).limit(1))
    if existing:
        return None
    admin = Admin(
        email="admin@campus.local",
        full_name="Campus Super Admin",
        password_hash=hash_password("secret123"),
        role="super_admin",
    )
    session.add(admin)
    await session.commit()
    await session.refresh(admin)
    print("Default admin created: admin@campus.local / secret123")
    return admin
