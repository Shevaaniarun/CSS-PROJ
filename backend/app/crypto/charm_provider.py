from __future__ import annotations

import base64
from typing import Any

from app.crypto.providers import BaseProvider, CHARM_AVAILABLE, PairingGroup, PublicParameters, pair

if CHARM_AVAILABLE:
    from charm.toolbox.hash_module import Hash  # type: ignore
    from charm.toolbox.pairinggroup import G1, GT, ZR  # type: ignore


class CharmCryptoProvider(BaseProvider):
    """
    Charm-Crypto implementation of the paper's bilinear-map algorithms.

    This provider follows the same paper-driven flow used by the shared provider
    abstractions:
    - KeyGen: choose P in G1, derive g = e(P, P), choose h in GT, and create W_i = s_i * P
    - CreGen: issue credentials cred = (mu, {Sa_i}) where Sa_i = (1 / (s_i + mu)) * P
    - PseuGen: derive a pseudonym with Pu and Pa_i values from the credential
    - Sign / SignCheck / Revoke: inherited from BaseProvider and executed with real pairing math

    The implementation uses multiplicative group operations internally because
    Charm represents G1/GT that way, while the paper uses additive notation.
    """

    curve_type = "SS512"

    def __init__(self, curve_type: str = "SS512") -> None:
        if not CHARM_AVAILABLE:
            raise RuntimeError("Charm-Crypto is not installed")
        self.curve_type = curve_type
        self.group = PairingGroup(curve_type)
        self.hash = Hash(self.group)

    def keygen(self, attributes: list[str]) -> tuple[PublicParameters, dict[str, str], dict[str, str]]:
        """
        Run the paper's KeyGen algorithm with real bilinear pairings.

        Returns:
            public parameters,
            public attribute generators W_i,
            secret attribute scalars s_i
        """
        return super().keygen(attributes)

    def cregen(
        self,
        secrets_map: dict[str, str],
        public_params: PublicParameters,
        subject_id: str,
        attributes: list[str],
    ) -> dict:
        """
        Run the paper's CreGen algorithm against the real pairing group.

        The returned credential contains:
        - mu
        - the selected subject id
        - the attribute set
        - Sa_i values serialized from G1
        """
        return super().cregen(secrets_map, public_params, subject_id, attributes)

    def pseugen(
        self,
        credential: dict,
        public_params: PublicParameters,
        own_attributes: list[str],
        delegated_attributes: dict[str, Any] | None = None,
        simulated_attributes: dict[str, Any] | None = None,
    ) -> tuple[dict, dict]:
        """
        Run the paper's PseuGen algorithm with real bilinear-group elements.

        Returns:
            public pseudonym payload,
            private witness state used by the Sign phase
        """
        return super().pseugen(
            credential,
            public_params,
            own_attributes,
            delegated_attributes=delegated_attributes,
            simulated_attributes=simulated_attributes,
        )

    def _hash_to_scalar(self, value: str) -> Any:
        return self.group.hash(value.encode("utf-8"), ZR)

    def _random_scalar(self) -> Any:
        return self.group.random(ZR)

    def _generator_p(self) -> Any:
        return self.group.random(G1)

    def _generator_g(self, p: Any) -> Any:
        return pair(p, p)

    def _generator_h(self) -> Any:
        return self.group.random(GT)

    def _pair(self, left: Any, right: Any) -> Any:
        return pair(left, right)

    def _serialize_g1(self, value: Any) -> str:
        return base64.b64encode(self.group.serialize(value)).decode("utf-8")

    def _deserialize_g1(self, value: str) -> Any:
        return self.group.deserialize(base64.b64decode(value.encode("utf-8")))

    def _serialize_gt(self, value: Any) -> str:
        return base64.b64encode(self.group.serialize(value)).decode("utf-8")

    def _deserialize_gt(self, value: str) -> Any:
        return self.group.deserialize(base64.b64decode(value.encode("utf-8")))

    def _serialize_scalar(self, value: Any) -> str:
        return base64.b64encode(self.group.serialize(value)).decode("utf-8")

    def _deserialize_scalar(self, value: str) -> Any:
        return self.group.deserialize(base64.b64decode(value.encode("utf-8")))

    def _mul_g1(self, left: Any, right: Any) -> Any:
        return left * right

    def _div_g1(self, left: Any, right: Any) -> Any:
        return left / right

    def _pow_g1(self, base: Any, scalar: Any) -> Any:
        return base ** scalar

    def _mul_gt(self, left: Any, right: Any) -> Any:
        return left * right

    def _div_gt(self, left: Any, right: Any) -> Any:
        return left / right

    def _pow_gt(self, base: Any, scalar: Any) -> Any:
        return base ** scalar

    def _add_scalar(self, left: Any, right: Any) -> Any:
        return left + right

    def _sub_scalar(self, left: Any, right: Any) -> Any:
        return left - right

    def _mul_scalar(self, left: Any, right: Any) -> Any:
        return left * right

    def _div_scalar(self, left: Any, right: Any) -> Any:
        return left / right

    def _neg_scalar(self, value: Any) -> Any:
        return -value
