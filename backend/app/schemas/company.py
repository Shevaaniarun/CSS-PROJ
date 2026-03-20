from datetime import datetime

from pydantic import BaseModel

from app.schemas.common import ORMModel


class CompanyRegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    license_id: str
    contact_name: str
    contact_phone: str
    metadata: dict = {}


class WorkerCreateRequest(BaseModel):
    worker_id: str
    full_name: str
    phone: str
    password: str
    role: str
    attributes: dict


class CredentialIssueRequest(BaseModel):
    worker_id: str
    expires_at: datetime
    role: str
    attributes: list[str]


class WorkerSummary(ORMModel):
    id: str
    company_id: str
    full_name: str
    phone: str
    external_worker_id: str
    status: str
    attributes: dict
