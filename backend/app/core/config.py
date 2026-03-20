from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = Field(default="Campus Privacy Auth", alias="APP_NAME")
    app_env: str = Field(default="development", alias="APP_ENV")
    app_debug: bool = Field(default=True, alias="APP_DEBUG")
    api_v1_prefix: str = Field(default="/api/v1", alias="API_V1_PREFIX")
    backend_host: str = Field(default="0.0.0.0", alias="BACKEND_HOST")
    backend_port: int = Field(default=8000, alias="BACKEND_PORT")
    database_url: str = Field(default="sqlite+aiosqlite:///./privacy_auth.db", alias="DATABASE_URL")
    sync_database_url: str = Field(default="sqlite:///./privacy_auth.db", alias="SYNC_DATABASE_URL")
    jwt_secret_key: str = Field(default="change-me", alias="JWT_SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    jwt_expire_minutes: int = Field(default=30, alias="JWT_EXPIRE_MINUTES")
    bcrypt_rounds: int = Field(default=12, alias="BCRYPT_ROUNDS")
    crypto_provider: Literal["mock", "charm"] = Field(default="mock", alias="CRYPTO_PROVIDER")
    cors_origins: list[str] = Field(default_factory=list, alias="CORS_ORIGINS")
    cookie_secure: bool = Field(default=False, alias="COOKIE_SECURE")
    cookie_domain: str | None = Field(default=None, alias="COOKIE_DOMAIN")
    rate_limit_per_minute: int = Field(default=120, alias="RATE_LIMIT_PER_MINUTE")
    nonce_ttl_seconds: int = Field(default=300, alias="NONCE_TTL_SECONDS")
    pseudonym_ttl_seconds: int = Field(default=300, alias="PSEUDONYM_TTL_SECONDS")
    access_log_export_limit: int = Field(default=5000, alias="ACCESS_LOG_EXPORT_LIMIT")


@lru_cache
def get_settings() -> Settings:
    return Settings()

