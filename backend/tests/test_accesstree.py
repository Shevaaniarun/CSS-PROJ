from app.crypto.accesstree import AccessTree
from app.crypto.secretsharing import ShamirSecretSharing


def test_or_gate_evaluation() -> None:
    tree = AccessTree()
    tree.build_from_policy(
        {
            "type": "OR",
            "children": [
                {"type": "leaf", "attribute": "company:Amazon"},
                {"type": "leaf", "attribute": "role:delivery"},
            ],
        }
    )
    assert tree.evaluate({"company:Amazon"})
    assert tree.evaluate({"role:delivery"})
    assert not tree.evaluate({"company:Swiggy"})


def test_and_gate_evaluation() -> None:
    tree = AccessTree()
    tree.build_from_policy(
        {
            "type": "AND",
            "children": [
                {"type": "leaf", "attribute": "company:Amazon"},
                {"type": "leaf", "attribute": "role:delivery"},
            ],
        }
    )
    assert tree.evaluate({"company:Amazon", "role:delivery"})
    assert not tree.evaluate({"company:Amazon"})


def test_threshold_gate_evaluation() -> None:
    tree = AccessTree()
    tree.build_from_policy(
        {
            "type": "THRESHOLD",
            "threshold": 2,
            "children": [
                {"type": "leaf", "attribute": "company:Amazon"},
                {"type": "leaf", "attribute": "role:delivery"},
                {"type": "leaf", "attribute": "campus:north"},
            ],
        }
    )
    assert tree.evaluate({"company:Amazon", "role:delivery"})
    assert tree.evaluate({"company:Amazon", "campus:north"})
    assert not tree.evaluate({"company:Amazon"})


def test_dual_structure() -> None:
    tree = AccessTree()
    tree.build_from_policy(
        {
            "type": "THRESHOLD",
            "threshold": 2,
            "children": [
                {"type": "leaf", "attribute": "a"},
                {"type": "leaf", "attribute": "b"},
                {"type": "leaf", "attribute": "c"},
            ],
        }
    )
    dual = tree.get_dual()
    assert dual.evaluate({"a", "b"})
    assert dual.evaluate({"a", "b", "c"})
    assert not dual.evaluate({"a"})


def test_secret_distribution_and_reconstruction() -> None:
    tree = AccessTree()
    tree.build_from_policy(
        {
            "type": "THRESHOLD",
            "threshold": 2,
            "children": [
                {"type": "leaf", "attribute": "a"},
                {"type": "leaf", "attribute": "b"},
                {"type": "leaf", "attribute": "c"},
            ],
        }
    )
    secret = 987654321
    shares = tree.distribute_secrets(secret)
    sharing = ShamirSecretSharing()
    recovered = sharing.reconstruct_secret([(1, shares["a"]), (2, shares["b"])])
    assert recovered == secret
    assert tree.reconstruct_secret({"a": shares["a"], "b": shares["b"]}) == secret


def test_and_tree_root_reconstruction() -> None:
    tree = AccessTree()
    tree.build_from_policy(
        {
            "type": "AND",
            "children": [
                {"type": "leaf", "attribute": "company:Amazon"},
                {"type": "leaf", "attribute": "role:delivery"},
            ],
        }
    )
    secret = 777777
    shares = tree.distribute_secrets(secret)
    assert tree.reconstruct_secret(shares) == secret


def test_minimal_qualified_sets() -> None:
    tree = AccessTree()
    tree.build_from_policy(
        {
            "type": "OR",
            "children": [
                {
                    "type": "AND",
                    "children": [
                        {"type": "leaf", "attribute": "company:Amazon"},
                        {"type": "leaf", "attribute": "role:delivery"},
                    ],
                },
                {"type": "leaf", "attribute": "override:security"},
            ],
        }
    )
    minimal = tree.get_minimal_qualified_sets()
    assert {"override:security"} in minimal
    assert {"company:Amazon", "role:delivery"} in minimal
