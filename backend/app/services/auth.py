from fastapi import HTTPException, Response

from app.core.security import create_access_token, verify_password


def issue_login_cookie(response: Response, subject: str, role: str) -> str:
    token = create_access_token(subject=subject, role=role)
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=False,
        samesite="lax",
    )
    return token


def validate_password(password: str, password_hash: str) -> None:
    if not verify_password(password, password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

