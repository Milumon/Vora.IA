from fastapi import HTTPException, status


class VoraException(Exception):
    """Base exception for Vora application."""
    pass


class AuthenticationError(VoraException):
    """Authentication related errors."""
    pass


class AuthorizationError(VoraException):
    """Authorization related errors."""
    pass


class ResourceNotFoundError(VoraException):
    """Resource not found errors."""
    pass


class ValidationError(VoraException):
    """Validation errors."""
    pass


class ExternalAPIError(VoraException):
    """External API call errors."""
    pass


def raise_not_found(resource: str, identifier: str):
    """Raise a 404 HTTPException."""
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"{resource} with id '{identifier}' not found"
    )


def raise_unauthorized(detail: str = "Not authenticated"):
    """Raise a 401 HTTPException."""
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def raise_forbidden(detail: str = "Not enough permissions"):
    """Raise a 403 HTTPException."""
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=detail
    )
