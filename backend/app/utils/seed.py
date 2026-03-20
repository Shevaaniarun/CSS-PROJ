import asyncio

from sqlalchemy import select

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.entities import Admin


async def seed_super_admin() -> None:
    async with SessionLocal() as session:
        existing = await session.scalar(select(Admin).where(Admin.email == "admin@campus.local"))
        if existing:
            return
        session.add(
            Admin(
                email="admin@campus.local",
                full_name="Campus Super Admin",
                password_hash=hash_password("secret123"),
                role="super_admin",
            )
        )
        await session.commit()


if __name__ == "__main__":
    asyncio.run(seed_super_admin())

