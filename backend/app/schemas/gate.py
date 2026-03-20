from datetime import datetime

from pydantic import BaseModel


class GateRegisterRequest(BaseModel):
    name: str
    identifier: str
    location: str
    institution: str
    device_details: dict = {}
    password: str


class NonceRequest(BaseModel):
    gate_id: str


class VerifyRequest(BaseModel):
    gate_id: str
    gate_nonce: str
    received_nonce: str
    timestamp: datetime
    qr_data: dict


class SyncRequest(BaseModel):
    gate_id: str


class GateStatusResponse(BaseModel):
    id: str
    name: str
    identifier: str
    location: str
    status: str
    timestamp: datetime
