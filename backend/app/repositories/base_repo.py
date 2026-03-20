from __future__ import annotations

from typing import Generic, TypeVar

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


ModelType = TypeVar("ModelType")


class BaseRepository(Generic[ModelType]):
    """Small async CRUD base repository."""

    def __init__(self, session: AsyncSession, model: type[ModelType]) -> None:
        self.session = session
        self.model = model

    async def get(self, entity_id: str) -> ModelType | None:
        return await self.session.get(self.model, entity_id)

    async def list_all(self) -> list[ModelType]:
        result = await self.session.scalars(select(self.model))
        return list(result)

    async def add(self, instance: ModelType) -> ModelType:
        self.session.add(instance)
        await self.session.commit()
        await self.session.refresh(instance)
        return instance

    async def delete(self, instance: ModelType) -> None:
        await self.session.delete(instance)
        await self.session.commit()
