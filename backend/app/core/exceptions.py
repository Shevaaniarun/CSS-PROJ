class AppException(Exception):
    """Base application exception."""


class AuthenticationError(AppException):
    """Raised when authentication fails."""


class AuthorizationError(AppException):
    """Raised when authorization fails."""


class VerificationError(AppException):
    """Raised when verification pipeline denies access."""

