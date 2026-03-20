from __future__ import annotations

import secrets
from dataclasses import dataclass, field
from enum import Enum
from itertools import combinations
from typing import Any

from app.crypto.secretsharing import DEFAULT_PRIME, Share, ShamirSecretSharing


class GateType(str, Enum):
    OR = "OR"
    AND = "AND"
    THRESHOLD = "THRESHOLD"
    LEAF = "LEAF"


@dataclass
class AccessTreeNode:
    """
    Node in the monotone access tree from Sections 4.2 and 6 of the paper.

    Leaf nodes correspond to attributes. Internal nodes correspond to OR, AND,
    or generic threshold gates.
    """

    node_id: str
    gate_type: GateType
    threshold: int | None = None
    attribute: str | None = None
    children: list["AccessTreeNode"] = field(default_factory=list)
    parent: "AccessTreeNode | None" = None
    secret_share: int | None = None

    def get_threshold(self) -> int:
        if self.gate_type == GateType.LEAF:
            return 1
        if self.gate_type == GateType.OR:
            return 1
        if self.gate_type == GateType.AND:
            return len(self.children)
        return self.threshold or 1

    def is_leaf(self) -> bool:
        return self.gate_type == GateType.LEAF


class AccessTree:
    """
    Access-tree implementation for paper Sections 4.2, 4.2.1, and 6.

    Supports:
    - Recursive construction from policy JSON
    - Dual access structure construction
    - Secret distribution to leaves
    - Satisfiability evaluation
    - Minimal qualified set enumeration
    """

    def __init__(self, prime_modulus: int = DEFAULT_PRIME) -> None:
        self.root: AccessTreeNode | None = None
        self.nodes: dict[str, AccessTreeNode] = {}
        self.attributes: set[str] = set()
        self.secret_sharing = ShamirSecretSharing(prime_modulus)
        self.prime_modulus = prime_modulus
        self._auto_id = 0

    def build_from_policy(self, policy_dict: dict[str, Any]) -> None:
        """Build the tree recursively from a JSON-style policy dictionary."""
        self.nodes.clear()
        self.attributes.clear()
        self._auto_id = 0
        self.root = self._build_node(policy_dict, None)
        self._collect_attributes(self.root)

    def get_dual(self) -> "AccessTree":
        """
        Build the dual access structure from Section 4.2.1.

        Transformations:
        - OR <-> AND
        - (k, n) threshold -> (n-k+1, n) threshold
        - leaves stay unchanged
        """
        if not self.root:
            raise ValueError("Tree not built")
        dual = AccessTree(prime_modulus=self.prime_modulus)
        dual.root = dual._build_dual_node(self.root, None)
        dual._collect_attributes(dual.root)
        return dual

    def distribute_secrets(self, secret: int) -> dict[str, int]:
        """
        Distribute a root secret to leaf attributes.

        This implements the tree-based share propagation used in Section 6.2:
        - OR: all children inherit the same share
        - AND: additive splitting where child shares sum to parent secret
        - THRESHOLD: Shamir shares with threshold k
        """
        if not self.root:
            raise ValueError("Tree not built")
        shares: dict[str, int] = {}
        self._distribute_secret_node(self.root, secret % self.prime_modulus, shares)
        return shares

    def evaluate(self, attribute_set: set[str]) -> bool:
        """Return whether the provided attribute set satisfies the tree."""
        if not self.root:
            return False
        return self._evaluate_node(self.root, attribute_set)

    def reconstruct_secret(self, leaf_shares: dict[str, int]) -> int:
        """
        Reconstruct the root secret from a set of leaf shares.

        This mirrors the Section 6 share propagation rules:
        - OR: inherit from any satisfying child
        - AND: sum child shares
        - THRESHOLD: use Shamir interpolation on child-node shares
        """
        if not self.root:
            raise ValueError("Tree not built")
        reconstructed = self._reconstruct_node(self.root, leaf_shares)
        if reconstructed is None:
            raise ValueError("Insufficient shares to reconstruct root secret")
        return reconstructed

    def get_minimal_qualified_sets(self) -> list[set[str]]:
        """
        Enumerate minimal qualified attribute sets from Section 6.3.

        This is intentionally exhaustive because the policies in this system are
        expected to stay relatively small.
        """
        if not self.root:
            return []

        minimal_sets: list[set[str]] = []
        ordered_attributes = sorted(self.attributes)
        for subset_size in range(1, len(ordered_attributes) + 1):
            for subset in combinations(ordered_attributes, subset_size):
                subset_set = set(subset)
                if not self.evaluate(subset_set):
                    continue
                if any(existing < subset_set for existing in minimal_sets):
                    continue
                is_minimal = True
                for attribute in subset:
                    reduced = subset_set - {attribute}
                    if self.evaluate(reduced):
                        is_minimal = False
                        break
                if is_minimal:
                    minimal_sets.append(subset_set)
        return minimal_sets

    def to_dict(self) -> dict[str, Any]:
        if not self.root:
            raise ValueError("Tree not built")
        return self._node_to_dict(self.root)

    def _build_node(
        self, node_dict: dict[str, Any], parent: AccessTreeNode | None
    ) -> AccessTreeNode:
        node_type_raw = str(node_dict.get("type", "leaf")).upper()
        if node_type_raw == "LEAF":
            attribute = node_dict.get("attribute")
            if not attribute:
                raise ValueError("Leaf nodes must define an attribute")
            node = AccessTreeNode(
                node_id=self._next_node_id(node_dict),
                gate_type=GateType.LEAF,
                attribute=str(attribute),
                parent=parent,
            )
            self.nodes[node.node_id] = node
            return node

        try:
            gate_type = GateType[node_type_raw]
        except KeyError as exc:
            raise ValueError(f"Unsupported node type: {node_type_raw}") from exc

        children_data = node_dict.get("children", [])
        if not isinstance(children_data, list) or not children_data:
            raise ValueError(f"{gate_type.value} nodes must define children")

        threshold = node_dict.get("threshold")
        if gate_type == GateType.THRESHOLD:
            if threshold is None:
                raise ValueError("Threshold nodes must define threshold")
            threshold = int(threshold)
            if threshold <= 0 or threshold > len(children_data):
                raise ValueError("Invalid threshold value")

        node = AccessTreeNode(
            node_id=self._next_node_id(node_dict),
            gate_type=gate_type,
            threshold=threshold,
            parent=parent,
        )
        self.nodes[node.node_id] = node
        for child_dict in children_data:
            child = self._build_node(child_dict, node)
            node.children.append(child)
        return node

    def _build_dual_node(
        self, node: AccessTreeNode, parent: AccessTreeNode | None
    ) -> AccessTreeNode:
        if node.is_leaf():
            dual_node = AccessTreeNode(
                node_id=node.node_id,
                gate_type=GateType.LEAF,
                attribute=node.attribute,
                parent=parent,
            )
            self.nodes[dual_node.node_id] = dual_node
            return dual_node

        if node.gate_type == GateType.OR:
            dual_type = GateType.AND
            threshold = None
        elif node.gate_type == GateType.AND:
            dual_type = GateType.OR
            threshold = None
        else:
            child_count = len(node.children)
            dual_type = GateType.THRESHOLD
            threshold = child_count - node.get_threshold() + 1

        dual_node = AccessTreeNode(
            node_id=node.node_id,
            gate_type=dual_type,
            threshold=threshold,
            parent=parent,
        )
        self.nodes[dual_node.node_id] = dual_node
        for child in node.children:
            dual_node.children.append(self._build_dual_node(child, dual_node))
        return dual_node

    def _collect_attributes(self, node: AccessTreeNode | None) -> None:
        if node is None:
            return
        if node.is_leaf():
            if not node.attribute:
                raise ValueError("Leaf node missing attribute")
            self.attributes.add(node.attribute)
            return
        for child in node.children:
            self._collect_attributes(child)

    def _distribute_secret_node(
        self, node: AccessTreeNode, secret: int, shares: dict[str, int]
    ) -> None:
        node.secret_share = secret
        if node.is_leaf():
            if not node.attribute:
                raise ValueError("Leaf node missing attribute")
            shares[node.attribute] = secret
            return

        if node.gate_type == GateType.OR:
            for child in node.children:
                self._distribute_secret_node(child, secret, shares)
            return

        if node.gate_type == GateType.AND:
            running_sum = 0
            child_count = len(node.children)
            for index, child in enumerate(node.children):
                if index == child_count - 1:
                    child_secret = (secret - running_sum) % self.prime_modulus
                else:
                    child_secret = secrets.randbelow(self.prime_modulus)
                    running_sum = (running_sum + child_secret) % self.prime_modulus
                self._distribute_secret_node(child, child_secret, shares)
            return

        threshold = node.get_threshold()
        threshold_shares = self.secret_sharing.split_secret(secret, len(node.children), threshold)
        for child, share in zip(node.children, threshold_shares, strict=True):
            self._distribute_secret_node(child, share.y, shares)

    def _evaluate_node(self, node: AccessTreeNode, attribute_set: set[str]) -> bool:
        if node.is_leaf():
            return bool(node.attribute and node.attribute in attribute_set)
        satisfied_children = sum(1 for child in node.children if self._evaluate_node(child, attribute_set))
        return satisfied_children >= node.get_threshold()

    def _node_to_dict(self, node: AccessTreeNode) -> dict[str, Any]:
        if node.is_leaf():
            return {
                "id": node.node_id,
                "type": "leaf",
                "attribute": node.attribute,
            }
        payload: dict[str, Any] = {
            "id": node.node_id,
            "type": node.gate_type.value,
            "children": [self._node_to_dict(child) for child in node.children],
        }
        if node.gate_type == GateType.THRESHOLD:
            payload["threshold"] = node.threshold
        return payload

    def _next_node_id(self, node_dict: dict[str, Any]) -> str:
        node_id = node_dict.get("id")
        if node_id:
            return str(node_id)
        self._auto_id += 1
        return f"node-{self._auto_id}"

    def _reconstruct_node(self, node: AccessTreeNode, leaf_shares: dict[str, int]) -> int | None:
        if node.is_leaf():
            if not node.attribute or node.attribute not in leaf_shares:
                return None
            return leaf_shares[node.attribute] % self.prime_modulus

        reconstructed_children: list[tuple[int, int]] = []
        for index, child in enumerate(node.children, start=1):
            child_secret = self._reconstruct_node(child, leaf_shares)
            if child_secret is not None:
                reconstructed_children.append((index, child_secret))

        threshold = node.get_threshold()
        if len(reconstructed_children) < threshold:
            return None

        if node.gate_type == GateType.OR:
            return reconstructed_children[0][1]

        if node.gate_type == GateType.AND:
            return sum(secret for _, secret in reconstructed_children) % self.prime_modulus

        return self.secret_sharing.reconstruct_secret(
            [Share(x=index, y=secret) for index, secret in reconstructed_children[:threshold]]
        )
