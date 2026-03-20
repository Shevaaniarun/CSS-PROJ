from pydantic import BaseModel


class WorkerAuthRequest(BaseModel):
    external_worker_id: str
    password: str


class PseudonymGenerateRequest(BaseModel):
    credential_id: str
    gate_nonce: str
    own_attributes: list[str]
    delegated_attributes: dict[str, int] = {}
    simulated_attributes: dict[str, int] = {}
    access_tree: dict = {}
    message: dict = {}


class VerifyStatusRequest(BaseModel):
    pseudonym_id: str
