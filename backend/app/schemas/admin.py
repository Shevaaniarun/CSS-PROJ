from datetime import datetime

from pydantic import BaseModel

from app.schemas.common import ORMModel


class AdminRegisterRequest(BaseModel):
    email: str
    full_name: str
    password: str
    role: str = "admin"


class CompanyApprovalRequest(BaseModel):
    approve: bool = True
    notes: str | None = None


class RevokeRequest(BaseModel):
    entity_type: str
    entity_id: str
    reason: str


class CompanySummary(ORMModel):
    id: str
    name: str
    email: str
    status: str
    created_at: datetime


class GateSummary(ORMModel):
    id: str
    name: str
    identifier: str
    location: str
    status: str
    created_at: datetime
