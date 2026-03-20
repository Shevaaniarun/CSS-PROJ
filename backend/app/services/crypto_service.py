from __future__ import annotations

import hashlib
from datetime import UTC, datetime, timedelta

from app.core.config import get_settings
from app.crypto.providers import PublicParameters, get_crypto_provider

settings = get_settings()
provider = get_crypto_provider(settings.crypto_provider)


def _hash_payload(payload: dict) -> str:
    return hashlib.sha256(str(payload).encode("utf-8")).hexdigest()


def generate_company_key_bundle(attributes: list[str]) -> tuple[dict, dict]:
    public_params, attribute_generators, secret_keys = provider.keygen(attributes)
    return (
        {
            "generator_p": public_params.generator_p,
            "generator_g": public_params.generator_g,
            "generator_h": public_params.generator_h,
            "attribute_generators": attribute_generators,
            "curve_type": public_params.curve_type,
            "security_param": public_params.security_param,
        },
        secret_keys,
    )


def issue_credential(subject_id: str, attributes: list[str], secret_keys: dict[str, int], public_params: dict) -> dict:
    pp = PublicParameters(
        generator_p=public_params["generator_p"],
        generator_g=public_params["generator_g"],
        generator_h=public_params["generator_h"],
        attribute_generators=public_params["attribute_generators"],
        curve_type=public_params.get("curve_type", settings.crypto_provider),
        security_param=public_params.get("security_param", 128),
    )
    return provider.cregen(secret_keys, pp, subject_id, attributes)


def generate_pseudonym(credential: dict, public_params: dict, own_attributes: list[str], delegated_attributes: dict[str, int], simulated_attributes: dict[str, int], access_tree: dict, message: dict) -> dict:
    pp = PublicParameters(
        generator_p=public_params["generator_p"],
        generator_g=public_params["generator_g"],
        generator_h=public_params["generator_h"],
        attribute_generators=public_params["attribute_generators"],
        curve_type=public_params.get("curve_type", settings.crypto_provider),
        security_param=public_params.get("security_param", 128),
    )
    pseudonym, private_state = provider.pseugen(
        credential,
        pp,
        own_attributes,
        delegated_attributes=delegated_attributes,
        simulated_attributes=simulated_attributes,
    )
    payload = {
        **message,
        "timestamp": datetime.now(UTC).isoformat(),
        "expires_at": (datetime.now(UTC) + timedelta(seconds=settings.pseudonym_ttl_seconds)).isoformat(),
    }
    signature = provider.sign(credential, pseudonym, private_state, payload, access_tree, pp)
    qr_payload = {
        "pseudonym": pseudonym,
        "signature": signature,
        "message": payload,
        "access_tree": access_tree,
        "fingerprint": _hash_payload(pseudonym),
    }
    return qr_payload


def verify_signature(qr_data: dict, public_params: dict) -> bool:
    pp = PublicParameters(
        generator_p=public_params["generator_p"],
        generator_g=public_params["generator_g"],
        generator_h=public_params["generator_h"],
        attribute_generators=public_params["attribute_generators"],
        curve_type=public_params.get("curve_type", settings.crypto_provider),
        security_param=public_params.get("security_param", 128),
    )
    pseudonym = qr_data["pseudonym"]
    return provider.sign_check(
        qr_data["signature"],
        pseudonym,
        qr_data["message"],
        qr_data.get("access_tree", {}),
        pp,
    )
