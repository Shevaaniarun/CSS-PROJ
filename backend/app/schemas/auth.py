from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str | None = None
    identifier: str | None = None
    password: str
