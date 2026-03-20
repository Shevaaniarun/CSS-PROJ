from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entities import AuditLog


async def write_audit_log(
    db: AsyncSession,
    *,
    actor_type: str,
    actor_id: str | None,
    action: str,
    entity_type: str,
    entity_id: str,
    details: dict,
) -> None:
    db.add(
        AuditLog(
            actor_type=actor_type,
            actor_id=actor_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details,
        )
    )
    await db.commit()

