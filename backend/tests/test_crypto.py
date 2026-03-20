from app.services.crypto_service import generate_company_key_bundle, generate_pseudonym, issue_credential, verify_signature


def test_mock_crypto_round_trip() -> None:
    public_params, secret_keys = generate_company_key_bundle(["company", "role"])
    credential = issue_credential("worker-1", ["company", "role"], secret_keys, public_params)
    qr_data = generate_pseudonym(
        credential,
        public_params,
        ["company"],
        {},
        {},
        {"type": "leaf", "attribute": "company"},
        {"company": "Amazon"},
    )
    assert qr_data["pseudonym"]["pu"]
    assert verify_signature(qr_data, public_params)


def test_signature_fails_when_message_is_tampered() -> None:
    public_params, secret_keys = generate_company_key_bundle(["company", "role"])
    credential = issue_credential("worker-1", ["company", "role"], secret_keys, public_params)
    qr_data = generate_pseudonym(
        credential,
        public_params,
        ["company"],
        {},
        {},
        {"type": "leaf", "attribute": "company"},
        {"company": "Amazon"},
    )
    tampered = {
        **qr_data,
        "message": {
            **qr_data["message"],
            "company": "Tampered",
        },
    }
    assert not verify_signature(tampered, public_params)
