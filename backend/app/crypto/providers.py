from __future__ import annotations

import base64
import hashlib
import json
import secrets
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any, Protocol

try:
    from charm.toolbox.hash_module import Hash  # type: ignore
    from charm.toolbox.pairinggroup import G1, GT, ZR, PairingGroup, pair  # type: ignore

    CHARM_AVAILABLE = True
except ImportError:
    CHARM_AVAILABLE = False
    G1 = GT = ZR = object  # type: ignore[misc,assignment]


GROUP_ORDER = 2**255 - 19


def _canonical_json(value: Any) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), default=str)


def _hash_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


@dataclass
class PublicParameters:
    generator_p: str
    generator_g: str
    generator_h: str
    attribute_generators: dict[str, str]
    curve_type: str = "mock"
    security_param: int = 128


class CryptoProvider(Protocol):
    def keygen(self, attributes: list[str]) -> tuple[PublicParameters, dict[str, str], dict[str, str]]: ...
    def cregen(
        self,
        secrets_map: dict[str, str],
        public_params: PublicParameters,
        subject_id: str,
        attributes: list[str],
    ) -> dict: ...
    def pseugen(
        self,
        credential: dict,
        public_params: PublicParameters,
        own_attributes: list[str],
        delegated_attributes: dict[str, Any] | None = None,
        simulated_attributes: dict[str, Any] | None = None,
    ) -> tuple[dict, dict]: ...
    def sign(
        self,
        credential: dict,
        pseudonym: dict,
        private_state: dict,
        payload: dict,
        access_tree: dict,
        public_params: PublicParameters,
    ) -> dict: ...
    def sign_check(
        self,
        signature: dict,
        pseudonym: dict,
        payload: dict,
        access_tree: dict,
        public_params: PublicParameters,
    ) -> bool: ...
    def revoke(
        self,
        pseudonym: dict,
        credential: dict,
        public_params: PublicParameters,
    ) -> bool: ...


class AccessTree:
    """Small access-tree helper for AND/OR/k-of-n policies."""

    def __init__(self, tree: dict | None) -> None:
        self.tree = tree or {}

    def required_attributes(self, attributes: set[str]) -> set[str]:
        if not self.tree:
            return attributes
        return self._required(self.tree, attributes)

    def is_satisfied(self, attributes: set[str]) -> bool:
        if not self.tree:
            return True
        return self._satisfied(self.tree, attributes)

    def digest(self) -> str:
        return _hash_text(_canonical_json(self.tree))

    def non_delegatable(self) -> set[str]:
        values = self.tree.get("non_delegatable", [])
        return set(values if isinstance(values, list) else [])

    def _required(self, node: dict, attributes: set[str]) -> set[str]:
        node_type = node.get("type", "leaf")
        if node_type == "leaf":
            attr = node.get("attribute")
            return {attr} if attr in attributes else set()
        children = [child for child in node.get("children", []) if isinstance(child, dict)]
        child_sets = [self._required(child, attributes) for child in children]
        if node_type == "and":
            return set().union(*child_sets) if all(child_sets) else set()
        if node_type == "or":
            valid_sets = [child for child in child_sets if child]
            return min(valid_sets, key=len) if valid_sets else set()
        threshold = int(node.get("threshold", len(children)))
        valid_sets = [child for child in child_sets if child]
        if len(valid_sets) < threshold:
            return set()
        valid_sets.sort(key=len)
        result: set[str] = set()
        for child in valid_sets[:threshold]:
            result.update(child)
        return result

    def _satisfied(self, node: dict, attributes: set[str]) -> bool:
        node_type = node.get("type", "leaf")
        if node_type == "leaf":
            return node.get("attribute") in attributes
        children = [child for child in node.get("children", []) if isinstance(child, dict)]
        if node_type == "and":
            return all(self._satisfied(child, attributes) for child in children)
        if node_type == "or":
            return any(self._satisfied(child, attributes) for child in children)
        threshold = int(node.get("threshold", len(children)))
        satisfied = sum(1 for child in children if self._satisfied(child, attributes))
        return satisfied >= threshold


class BaseProvider:
    curve_type = "mock"

    def _hash_to_scalar(self, value: str) -> Any:
        raise NotImplementedError

    def _random_scalar(self) -> Any:
        raise NotImplementedError

    def _generator_p(self) -> Any:
        raise NotImplementedError

    def _generator_g(self, p: Any) -> Any:
        raise NotImplementedError

    def _generator_h(self) -> Any:
        raise NotImplementedError

    def _pair(self, left: Any, right: Any) -> Any:
        raise NotImplementedError

    def _serialize_g1(self, value: Any) -> str:
        raise NotImplementedError

    def _deserialize_g1(self, value: str) -> Any:
        raise NotImplementedError

    def _serialize_gt(self, value: Any) -> str:
        raise NotImplementedError

    def _deserialize_gt(self, value: str) -> Any:
        raise NotImplementedError

    def _serialize_scalar(self, value: Any) -> str:
        raise NotImplementedError

    def _deserialize_scalar(self, value: str) -> Any:
        raise NotImplementedError

    def _mul_g1(self, left: Any, right: Any) -> Any:
        raise NotImplementedError

    def _div_g1(self, left: Any, right: Any) -> Any:
        raise NotImplementedError

    def _pow_g1(self, base: Any, scalar: Any) -> Any:
        raise NotImplementedError

    def _mul_gt(self, left: Any, right: Any) -> Any:
        raise NotImplementedError

    def _div_gt(self, left: Any, right: Any) -> Any:
        raise NotImplementedError

    def _pow_gt(self, base: Any, scalar: Any) -> Any:
        raise NotImplementedError

    def _add_scalar(self, left: Any, right: Any) -> Any:
        raise NotImplementedError

    def _sub_scalar(self, left: Any, right: Any) -> Any:
        raise NotImplementedError

    def _mul_scalar(self, left: Any, right: Any) -> Any:
        raise NotImplementedError

    def _div_scalar(self, left: Any, right: Any) -> Any:
        raise NotImplementedError

    def _neg_scalar(self, value: Any) -> Any:
        raise NotImplementedError

    def _eq_gt(self, left: Any, right: Any) -> bool:
        return left == right

    def _one_scalar(self) -> Any:
        return self._deserialize_scalar("1")

    def _two_scalar(self) -> Any:
        return self._deserialize_scalar("2")

    def _zero_scalar(self) -> Any:
        return self._deserialize_scalar("0")

    def keygen(self, attributes: list[str]) -> tuple[PublicParameters, dict[str, str], dict[str, str]]:
        p = self._generator_p()
        g = self._generator_g(p)
        h = self._generator_h()
        secret_keys: dict[str, str] = {}
        attribute_generators: dict[str, str] = {}
        for attribute in attributes:
            secret = self._random_scalar()
            public_key = self._pow_g1(p, secret)
            secret_keys[attribute] = self._serialize_scalar(secret)
            attribute_generators[attribute] = self._serialize_g1(public_key)
        public_params = PublicParameters(
            generator_p=self._serialize_g1(p),
            generator_g=self._serialize_gt(g),
            generator_h=self._serialize_gt(h),
            attribute_generators=attribute_generators,
            curve_type=self.curve_type,
        )
        return public_params, attribute_generators, secret_keys

    def cregen(
        self,
        secrets_map: dict[str, str],
        public_params: PublicParameters,
        subject_id: str,
        attributes: list[str],
    ) -> dict:
        p = self._deserialize_g1(public_params.generator_p)
        mu = self._random_scalar()
        sa_values: dict[str, str] = {}
        for attribute in attributes:
            secret = self._deserialize_scalar(secrets_map[attribute])
            denominator = self._add_scalar(secret, mu)
            inverse = self._div_scalar(self._one_scalar(), denominator)
            sa_values[attribute] = self._serialize_g1(self._pow_g1(p, inverse))
        return {
            "subject_id": subject_id,
            "mu": self._serialize_scalar(mu),
            "attributes": attributes,
            "sa": sa_values,
        }

    def pseugen(
        self,
        credential: dict,
        public_params: PublicParameters,
        own_attributes: list[str],
        delegated_attributes: dict[str, Any] | None = None,
        simulated_attributes: dict[str, Any] | None = None,
    ) -> tuple[dict, dict]:
        delegated_attributes = delegated_attributes or {}
        simulated_attributes = simulated_attributes or {}
        p = self._deserialize_g1(public_params.generator_p)
        mu = self._deserialize_scalar(credential["mu"])
        z_raw = secrets.token_bytes(32)
        z = self._hash_to_scalar(base64.b64encode(z_raw).decode("utf-8"))
        d = self._hash_to_scalar(self._serialize_scalar(z))
        mu_prime = self._div_scalar(self._sub_scalar(d, mu), self._two_scalar())
        mu_plus_mu_prime = self._add_scalar(mu, mu_prime)
        pu = self._pow_g1(p, mu_plus_mu_prime)

        pa_values: dict[str, str] = {}
        witnesses: dict[str, str] = {}

        for attribute in own_attributes:
            if attribute not in credential["sa"]:
                continue
            sa_i = self._deserialize_g1(credential["sa"][attribute])
            pa_i = self._pow_g1(sa_i, mu_prime)
            pa_values[attribute] = self._serialize_g1(pa_i)
            witnesses[attribute] = self._serialize_scalar(mu_prime)

        for attribute, value in delegated_attributes.items():
            if attribute not in credential["sa"]:
                continue
            mu_j = self._deserialize_scalar(value["mu_j"] if isinstance(value, dict) else value)
            sa_source = value.get("sa_j") if isinstance(value, dict) else credential["sa"][attribute]
            sa_j = self._deserialize_g1(sa_source)
            witness = self._sub_scalar(mu_j, mu_plus_mu_prime)
            pa_j = self._pow_g1(sa_j, witness)
            pa_values[attribute] = self._serialize_g1(pa_j)
            witnesses[attribute] = self._serialize_scalar(witness)

        for attribute, value in simulated_attributes.items():
            witness = self._deserialize_scalar(value) if isinstance(value, str) else self._random_scalar()
            pa_sim = self._pow_g1(p, witness)
            pa_values[attribute] = self._serialize_g1(pa_sim)

        public_pseudonym = {
            "pu": self._serialize_g1(pu),
            "pa": pa_values,
            "z": self._serialize_scalar(z),
            "attributes": sorted(pa_values.keys()),
            "owned_attributes": [attr for attr in own_attributes if attr in pa_values],
        }
        private_state = {
            "mu_prime": self._serialize_scalar(mu_prime),
            "d": self._serialize_scalar(d),
            "witnesses": witnesses,
        }
        return public_pseudonym, private_state

    def sign(
        self,
        credential: dict,
        pseudonym: dict,
        private_state: dict,
        payload: dict,
        access_tree: dict,
        public_params: PublicParameters,
    ) -> dict:
        tree = AccessTree(access_tree)
        available_attrs = set(pseudonym["attributes"])
        if not tree.is_satisfied(available_attrs):
            raise ValueError("Attributes do not satisfy the access tree")

        required_attrs = tree.required_attributes(available_attrs)
        policy_digest = tree.digest()
        non_delegatable = tree.non_delegatable()

        p = self._deserialize_g1(public_params.generator_p)
        g = self._deserialize_gt(public_params.generator_g)
        h = self._deserialize_gt(public_params.generator_h)
        mu = self._deserialize_scalar(credential["mu"])
        mu_prime = self._deserialize_scalar(private_state["mu_prime"])

        r1 = self._random_scalar()
        r3 = self._random_scalar()
        r5 = self._random_scalar()
        t_g1 = self._pow_g1(p, r1)
        t3 = self._mul_gt(self._pow_gt(h, r3), self._pow_gt(g, self._neg_scalar(r1)))
        t5 = self._pow_gt(h, r5)

        t2_i: dict[str, str] = {}
        r2_i: dict[str, Any] = {}
        t4_i: dict[str, str] = {}
        r4_i: dict[str, Any] = {}

        for attribute, pa_value in pseudonym["pa"].items():
            pa = self._deserialize_g1(pa_value)
            r2 = self._random_scalar()
            r2_i[attribute] = r2
            pairing_base = self._pair(p, self._mul_g1(p, pa))
            t2_i[attribute] = self._serialize_gt(self._pow_gt(pairing_base, r2))

        for attribute in non_delegatable.intersection(required_attrs):
            r4 = self._random_scalar()
            r4_i[attribute] = r4
            t4_i[attribute] = self._serialize_gt(
                self._mul_gt(self._pow_gt(h, r4), self._pow_gt(g, self._neg_scalar(r2_i[attribute])))
            )

        delta = self._random_scalar()
        gamma = self._random_scalar()
        mu_plus_mu_prime = self._add_scalar(mu, mu_prime)
        y1 = self._mul_gt(self._pow_gt(h, gamma), self._pow_gt(g, mu_plus_mu_prime))
        y2 = self._mul_gt(self._pow_gt(h, delta), self._pow_gt(g, mu_prime))

        challenge_input = _canonical_json(
            {
                "pu": pseudonym["pu"],
                "pa": pseudonym["pa"],
                "t_g1": self._serialize_g1(t_g1),
                "t2_i": t2_i,
                "t3": self._serialize_gt(t3),
                "t4_i": t4_i,
                "t5": self._serialize_gt(t5),
                "y1": self._serialize_gt(y1),
                "y2": self._serialize_gt(y2),
                "payload": payload,
                "z": pseudonym["z"],
                "policy": policy_digest,
            }
        )
        c = self._hash_to_scalar(challenge_input)

        c_i: dict[str, Any] = {}
        for attribute in pseudonym["pa"]:
            if attribute in required_attrs:
                c_i[attribute] = self._hash_to_scalar(
                    f"{self._serialize_scalar(c)}|{attribute}|{policy_digest}"
                )
            else:
                c_i[attribute] = self._zero_scalar()

        s1 = self._add_scalar(r1, self._mul_scalar(mu_plus_mu_prime, c))
        s2_i: dict[str, str] = {}
        for attribute in pseudonym["pa"]:
            witness_raw = private_state["witnesses"].get(attribute)
            witness = self._deserialize_scalar(witness_raw) if witness_raw is not None else self._zero_scalar()
            s2 = self._add_scalar(r2_i[attribute], self._mul_scalar(witness, c_i[attribute]))
            s2_i[attribute] = self._serialize_scalar(s2)
        s3 = self._add_scalar(r3, self._neg_scalar(self._mul_scalar(c, gamma)))
        s5 = self._add_scalar(r5, self._neg_scalar(self._mul_scalar(c, self._add_scalar(delta, gamma))))
        s4_i = {
            attribute: self._serialize_scalar(
                self._add_scalar(
                    r4_i[attribute],
                    self._neg_scalar(self._mul_scalar(c_i[attribute], delta)),
                )
            )
            for attribute in r4_i
        }

        return {
            "c": self._serialize_scalar(c),
            "c_i": {attribute: self._serialize_scalar(value) for attribute, value in c_i.items()},
            "s1": self._serialize_scalar(s1),
            "s2_i": s2_i,
            "s3": self._serialize_scalar(s3),
            "s4_i": s4_i,
            "s5": self._serialize_scalar(s5),
            "t_g1": self._serialize_g1(t_g1),
            "t2_i": t2_i,
            "t3": self._serialize_gt(t3),
            "t4_i": t4_i,
            "t5": self._serialize_gt(t5),
            "y1": self._serialize_gt(y1),
            "y2": self._serialize_gt(y2),
            "policy_digest": policy_digest,
            "required_attributes": sorted(required_attrs),
            "timestamp": datetime.now(UTC).isoformat(),
        }

    def sign_check(
        self,
        signature: dict,
        pseudonym: dict,
        payload: dict,
        access_tree: dict,
        public_params: PublicParameters,
    ) -> bool:
        tree = AccessTree(access_tree)
        available_attrs = set(pseudonym["attributes"])
        if not tree.is_satisfied(available_attrs):
            return False
        required_attrs = set(signature.get("required_attributes", []))
        if not required_attrs.issubset(available_attrs):
            return False
        if signature.get("policy_digest") != tree.digest():
            return False

        p = self._deserialize_g1(public_params.generator_p)
        g = self._deserialize_gt(public_params.generator_g)
        h = self._deserialize_gt(public_params.generator_h)
        pu = self._deserialize_g1(pseudonym["pu"])
        c = self._deserialize_scalar(signature["c"])
        s1 = self._deserialize_scalar(signature["s1"])
        y1 = self._deserialize_gt(signature["y1"])
        y2 = self._deserialize_gt(signature["y2"])

        computed_t_g1 = self._div_g1(self._pow_g1(p, s1), self._pow_g1(pu, c))
        computed_t2_i: dict[str, str] = {}
        for attribute, pa_value in pseudonym["pa"].items():
            if attribute not in public_params.attribute_generators:
                return False
            pa = self._deserialize_g1(pa_value)
            wi = self._deserialize_g1(public_params.attribute_generators[attribute])
            s2 = self._deserialize_scalar(signature["s2_i"][attribute])
            c_i = self._deserialize_scalar(signature["c_i"][attribute])
            left = self._pow_gt(self._pair(p, self._mul_g1(p, pa)), s2)
            right = self._pow_gt(self._pair(self._mul_g1(pu, wi), pa), c_i)
            computed_t2_i[attribute] = self._serialize_gt(self._div_gt(left, right))

        s3 = self._deserialize_scalar(signature["s3"])
        computed_t3 = self._mul_gt(
            self._mul_gt(self._pow_gt(h, s3), self._pow_gt(g, self._neg_scalar(s1))),
            self._pow_gt(y1, c),
        )

        computed_t4_i: dict[str, str] = {}
        for attribute in tree.non_delegatable().intersection(required_attrs):
            if attribute not in signature["s4_i"]:
                return False
            s4 = self._deserialize_scalar(signature["s4_i"][attribute])
            s2 = self._deserialize_scalar(signature["s2_i"][attribute])
            computed_t4_i[attribute] = self._serialize_gt(
                self._mul_gt(
                    self._mul_gt(self._pow_gt(h, s4), self._pow_gt(g, self._neg_scalar(s2))),
                    self._pow_gt(y2, self._deserialize_scalar(signature["c_i"][attribute])),
                )
            )

        s5 = self._deserialize_scalar(signature["s5"])
        d = self._hash_to_scalar(pseudonym["z"])
        computed_t5 = self._mul_gt(
            self._pow_gt(h, s5),
            self._pow_gt(
                self._div_gt(self._mul_gt(y1, y2), self._pow_gt(g, d)),
                c,
            ),
        )

        challenge_input = _canonical_json(
            {
                "pu": pseudonym["pu"],
                "pa": pseudonym["pa"],
                "t_g1": self._serialize_g1(computed_t_g1),
                "t2_i": computed_t2_i,
                "t3": self._serialize_gt(computed_t3),
                "t4_i": computed_t4_i,
                "t5": self._serialize_gt(computed_t5),
                "y1": signature["y1"],
                "y2": signature["y2"],
                "payload": payload,
                "z": pseudonym["z"],
                "policy": signature["policy_digest"],
            }
        )
        recomputed_c = self._hash_to_scalar(challenge_input)
        if self._serialize_scalar(recomputed_c) != signature["c"]:
            return False

        for attribute in pseudonym["pa"]:
            expected = (
                self._serialize_scalar(self._hash_to_scalar(f"{signature['c']}|{attribute}|{signature['policy_digest']}"))
                if attribute in required_attrs
                else self._serialize_scalar(self._zero_scalar())
            )
            if signature["c_i"][attribute] != expected:
                return False
        return True

    def revoke(self, pseudonym: dict, credential: dict, public_params: PublicParameters) -> bool:
        p = self._deserialize_g1(public_params.generator_p)
        pu = self._deserialize_g1(pseudonym["pu"])
        for attribute, sa_value in credential["sa"].items():
            if attribute not in pseudonym["pa"] or attribute not in public_params.attribute_generators:
                continue
            wi = self._deserialize_g1(public_params.attribute_generators[attribute])
            sa = self._deserialize_g1(sa_value)
            pa = self._deserialize_g1(pseudonym["pa"][attribute])
            left = self._pair(self._mul_g1(pu, wi), sa)
            right = self._pair(p, self._mul_g1(p, pa))
            if self._eq_gt(left, right):
                return True
        return False


class MockCryptoProvider(BaseProvider):
    curve_type = "mock"

    def _hash_to_scalar(self, value: str) -> int:
        return int(hashlib.sha256(value.encode("utf-8")).hexdigest(), 16) % GROUP_ORDER

    def _random_scalar(self) -> int:
        return secrets.randbelow(GROUP_ORDER - 2) + 2

    def _generator_p(self) -> int:
        return 1

    def _generator_g(self, p: int) -> int:
        return self._pair(p, p)

    def _generator_h(self) -> int:
        return self._random_scalar()

    def _pair(self, left: int, right: int) -> int:
        return (left * right) % GROUP_ORDER

    def _serialize_g1(self, value: int) -> str:
        return str(value % GROUP_ORDER)

    def _deserialize_g1(self, value: str) -> int:
        return int(value) % GROUP_ORDER

    def _serialize_gt(self, value: int) -> str:
        return str(value % GROUP_ORDER)

    def _deserialize_gt(self, value: str) -> int:
        return int(value) % GROUP_ORDER

    def _serialize_scalar(self, value: int) -> str:
        return str(value % GROUP_ORDER)

    def _deserialize_scalar(self, value: str) -> int:
        return int(value) % GROUP_ORDER

    def _mul_g1(self, left: int, right: int) -> int:
        return (left + right) % GROUP_ORDER

    def _div_g1(self, left: int, right: int) -> int:
        return (left - right) % GROUP_ORDER

    def _pow_g1(self, base: int, scalar: int) -> int:
        return (base * scalar) % GROUP_ORDER

    def _mul_gt(self, left: int, right: int) -> int:
        return (left + right) % GROUP_ORDER

    def _div_gt(self, left: int, right: int) -> int:
        return (left - right) % GROUP_ORDER

    def _pow_gt(self, base: int, scalar: int) -> int:
        return (base * scalar) % GROUP_ORDER

    def _add_scalar(self, left: int, right: int) -> int:
        return (left + right) % GROUP_ORDER

    def _sub_scalar(self, left: int, right: int) -> int:
        return (left - right) % GROUP_ORDER

    def _mul_scalar(self, left: int, right: int) -> int:
        return (left * right) % GROUP_ORDER

    def _div_scalar(self, left: int, right: int) -> int:
        return (left * pow(right % GROUP_ORDER, -1, GROUP_ORDER)) % GROUP_ORDER

    def _neg_scalar(self, value: int) -> int:
        return (-value) % GROUP_ORDER


class CharmCryptoProvider(BaseProvider):
    curve_type = "SS512"

    def __init__(self) -> None:
        if not CHARM_AVAILABLE:
            raise RuntimeError("Charm-Crypto is not installed")
        self.group = PairingGroup(self.curve_type)
        self.hash = Hash(self.group)

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


def get_crypto_provider(provider_name: str) -> CryptoProvider:
    if provider_name == "charm":
        try:
            return CharmCryptoProvider()
        except RuntimeError:
            return MockCryptoProvider()
    return MockCryptoProvider()
