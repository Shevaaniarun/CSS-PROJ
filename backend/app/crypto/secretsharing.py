from __future__ import annotations

import secrets
from dataclasses import dataclass


DEFAULT_PRIME = 2**127 - 1


@dataclass(frozen=True)
class Share:
    """
    A Shamir secret-sharing point (x, y) over Z_p.

    The paper's threshold gates in Section 4.3.1 are defined over a finite
    field, so shares are represented as polynomial evaluation points.
    """

    x: int
    y: int


class ShamirSecretSharing:
    """
    Shamir secret sharing over a prime field.

    This class is used by threshold access-tree nodes as described in the paper:
    a threshold gate with parameter k distributes a parent secret to its child
    nodes by evaluating a random polynomial q(x) of degree k-1 with q(0)=secret.
    """

    def __init__(self, prime_modulus: int = DEFAULT_PRIME) -> None:
        if prime_modulus <= 2:
            raise ValueError("Prime modulus must be greater than 2")
        self.prime_modulus = prime_modulus

    def split_secret(self, secret: int, num_shares: int, threshold: int) -> list[Share]:
        """
        Split a secret into `num_shares` points with reconstruction threshold `threshold`.

        Args:
            secret: secret value in Z_p
            num_shares: total number of shares to generate
            threshold: minimum number of shares needed for reconstruction

        Returns:
            List of Share objects (x, y).

        Raises:
            ValueError: for invalid threshold/num_shares combinations.
        """
        if num_shares <= 0:
            raise ValueError("num_shares must be positive")
        if threshold <= 0:
            raise ValueError("threshold must be positive")
        if threshold > num_shares:
            raise ValueError("threshold cannot be greater than num_shares")

        secret_mod = secret % self.prime_modulus
        coefficients = [secret_mod] + [
            secrets.randbelow(self.prime_modulus - 1) + 1 for _ in range(threshold - 1)
        ]

        shares: list[Share] = []
        for x in range(1, num_shares + 1):
            y = self._evaluate_polynomial(coefficients, x)
            shares.append(Share(x=x, y=y))
        return shares

    def reconstruct_secret(self, shares: list[Share] | list[tuple[int, int]]) -> int:
        """
        Reconstruct the original secret using Lagrange interpolation at x = 0.

        Args:
            shares: list of share objects or raw `(x, y)` tuples

        Returns:
            The reconstructed secret in Z_p.

        Raises:
            ValueError: if not enough valid distinct shares are supplied.
        """
        normalized = [share if isinstance(share, Share) else Share(*share) for share in shares]
        if len(normalized) < 2:
            raise ValueError("At least two shares are required for reconstruction")

        seen_x: set[int] = set()
        for share in normalized:
            if share.x in seen_x:
                raise ValueError("Duplicate x-coordinates are not allowed")
            seen_x.add(share.x)

        secret = 0
        for idx, share_i in enumerate(normalized):
            numerator = 1
            denominator = 1
            for jdx, share_j in enumerate(normalized):
                if idx == jdx:
                    continue
                numerator = (numerator * (-share_j.x)) % self.prime_modulus
                denominator = (denominator * (share_i.x - share_j.x)) % self.prime_modulus

            if denominator % self.prime_modulus == 0:
                raise ValueError("Shares are not linearly independent")

            lagrange_basis = numerator * pow(denominator, -1, self.prime_modulus)
            secret = (secret + share_i.y * lagrange_basis) % self.prime_modulus

        return secret

    def _evaluate_polynomial(self, coefficients: list[int], x: int) -> int:
        result = 0
        power = 1
        for coefficient in coefficients:
            result = (result + coefficient * power) % self.prime_modulus
            power = (power * x) % self.prime_modulus
        return result
