from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    JSON,
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    LargeBinary,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


def pk() -> Mapped[str]:
    return mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))


class Admin(Base, TimestampMixin):
    __tablename__ = "admins"
    __table_args__ = (
        CheckConstraint("status IN ('active','disabled')", name="ck_admin_status"),
        Index("ix_admin_email", "email", unique=True),
    )

    id: Mapped[str] = pk()
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(32), default="admin")
    status: Mapped[str] = mapped_column(String(16), default="active")


class Company(Base, TimestampMixin):
    __tablename__ = "companies"
    __table_args__ = (
        CheckConstraint("status IN ('pending','approved','rejected','revoked')", name="ck_company_status"),
        Index("ix_company_email", "email", unique=True),
        Index("ix_company_name", "name"),
    )

    id: Mapped[str] = pk()
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(16), default="pending")
    notes: Mapped[str | None] = mapped_column(Text())
    metadata_json: Mapped[dict] = mapped_column("metadata", JSON, default=dict)

    workers: Mapped[list["Worker"]] = relationship(back_populates="company", cascade="all, delete-orphan")
    keys: Mapped[list["CompanyPublicKey"]] = relationship(
        back_populates="company", cascade="all, delete-orphan"
    )


class Gate(Base, TimestampMixin):
    __tablename__ = "gates"
    __table_args__ = (
        CheckConstraint("status IN ('pending','approved','rejected','revoked','expired')", name="ck_gate_status"),
        Index("ix_gate_name", "name"),
        Index("ix_gate_identifier", "identifier", unique=True),
    )

    id: Mapped[str] = pk()
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    identifier: Mapped[str] = mapped_column(String(128), nullable=False)
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(16), default="pending")
    offline_bundle: Mapped[dict] = mapped_column(JSON, default=dict)


class Worker(Base, TimestampMixin):
    __tablename__ = "workers"
    __table_args__ = (
        CheckConstraint("status IN ('active','inactive','revoked')", name="ck_worker_status"),
        Index("ix_worker_external_id", "external_worker_id", unique=True),
        Index("ix_worker_company", "company_id"),
    )

    id: Mapped[str] = pk()
    company_id: Mapped[str] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(32), nullable=False)
    external_worker_id: Mapped[str] = mapped_column(String(128), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(16), default="active")
    attributes: Mapped[dict] = mapped_column(JSON, default=dict)

    company: Mapped["Company"] = relationship(back_populates="workers")
    credentials: Mapped[list["Credential"]] = relationship(
        back_populates="worker", cascade="all, delete-orphan"
    )


class Credential(Base, TimestampMixin):
    __tablename__ = "credentials"
    __table_args__ = (
        CheckConstraint("status IN ('issued','expired','revoked')", name="ck_credential_status"),
        Index("ix_credential_worker", "worker_id"),
    )

    id: Mapped[str] = pk()
    worker_id: Mapped[str] = mapped_column(ForeignKey("workers.id", ondelete="CASCADE"), nullable=False)
    company_id: Mapped[str] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column(String(16), default="issued")
    credential_blob: Mapped[dict] = mapped_column(JSON, default=dict)
    encrypted_export: Mapped[bytes | None] = mapped_column(LargeBinary())

    worker: Mapped["Worker"] = relationship(back_populates="credentials")


class Pseudonym(Base, TimestampMixin):
    __tablename__ = "pseudonyms"
    __table_args__ = (
        CheckConstraint("status IN ('generated','used','expired','revoked')", name="ck_pseudonym_status"),
        UniqueConstraint("pseudonym_hash", name="uq_pseudonym_hash"),
        Index("ix_pseudonym_worker", "worker_id"),
    )

    id: Mapped[str] = pk()
    worker_id: Mapped[str] = mapped_column(ForeignKey("workers.id", ondelete="CASCADE"), nullable=False)
    credential_id: Mapped[str] = mapped_column(ForeignKey("credentials.id", ondelete="CASCADE"), nullable=False)
    company_id: Mapped[str] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    pseudonym_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    payload: Mapped[dict] = mapped_column(JSON, default=dict)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column(String(16), default="generated")


class AccessLog(Base, TimestampMixin):
    __tablename__ = "access_logs"
    __table_args__ = (
        CheckConstraint("result IN ('grant','deny')", name="ck_access_result"),
        Index("ix_access_gate", "gate_id"),
        Index("ix_access_worker", "worker_id"),
    )

    id: Mapped[str] = pk()
    gate_id: Mapped[str] = mapped_column(ForeignKey("gates.id", ondelete="CASCADE"), nullable=False)
    worker_id: Mapped[str | None] = mapped_column(ForeignKey("workers.id", ondelete="SET NULL"))
    pseudonym_id: Mapped[str | None] = mapped_column(ForeignKey("pseudonyms.id", ondelete="SET NULL"))
    company_id: Mapped[str | None] = mapped_column(ForeignKey("companies.id", ondelete="SET NULL"))
    result: Mapped[str] = mapped_column(String(16), nullable=False)
    reason: Mapped[str] = mapped_column(String(255), nullable=False)
    request_payload: Mapped[dict] = mapped_column(JSON, default=dict)


class RevocationList(Base, TimestampMixin):
    __tablename__ = "revocation_lists"
    __table_args__ = (
        CheckConstraint(
            "entity_type IN ('company','gate','worker','credential','pseudonym')",
            name="ck_revocation_entity_type",
        ),
        Index("ix_revocation_entity", "entity_type", "entity_id"),
    )

    id: Mapped[str] = pk()
    entity_type: Mapped[str] = mapped_column(String(32), nullable=False)
    entity_id: Mapped[str] = mapped_column(String(36), nullable=False)
    reason: Mapped[str] = mapped_column(String(255), nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class CompanyPublicKey(Base, TimestampMixin):
    __tablename__ = "company_public_keys"
    __table_args__ = (Index("ix_company_public_key_company", "company_id"),)

    id: Mapped[str] = pk()
    company_id: Mapped[str] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    provider: Mapped[str] = mapped_column(String(32), nullable=False)
    public_parameters: Mapped[dict] = mapped_column(JSON, default=dict)
    attribute_generators: Mapped[dict] = mapped_column(JSON, default=dict)
    company: Mapped["Company"] = relationship(back_populates="keys")


class NonceTracking(Base, TimestampMixin):
    __tablename__ = "nonce_tracking"
    __table_args__ = (
        UniqueConstraint("gate_id", "nonce", name="uq_gate_nonce"),
        Index("ix_nonce_gate", "gate_id"),
    )

    id: Mapped[str] = pk()
    gate_id: Mapped[str] = mapped_column(ForeignKey("gates.id", ondelete="CASCADE"), nullable=False)
    nonce: Mapped[str] = mapped_column(String(255), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    consumed: Mapped[bool] = mapped_column(Boolean, default=False)


class AuditLog(Base, TimestampMixin):
    __tablename__ = "audit_logs"
    __table_args__ = (
        CheckConstraint(
            "actor_type IN ('admin','company','gate','worker','system')", name="ck_audit_actor_type"
        ),
        Index("ix_audit_actor", "actor_type", "actor_id"),
        Index("ix_audit_action", "action"),
    )

    id: Mapped[str] = pk()
    actor_type: Mapped[str] = mapped_column(String(32), nullable=False)
    actor_id: Mapped[str | None] = mapped_column(String(36))
    action: Mapped[str] = mapped_column(String(128), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(64), nullable=False)
    entity_id: Mapped[str] = mapped_column(String(36), nullable=False)
    details: Mapped[dict] = mapped_column(JSON, default=dict)
