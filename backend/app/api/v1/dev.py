from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.db.session import get_db
from app.schemas.common import MessageResponse
from app.utils.startup import ensure_default_admin

router = APIRouter(prefix="/dev", tags=["dev"])
settings = get_settings()


@router.post("/create-admin", response_model=MessageResponse)
async def create_default_admin(db: AsyncSession = Depends(get_db)) -> MessageResponse:
    if settings.app_env != "development":
        raise HTTPException(status_code=404, detail="Not found")
    admin = await ensure_default_admin(db)
    if admin is None:
        return MessageResponse(message="Admin already exists")
    return MessageResponse(message="Default admin created: admin@campus.local / secret123")
