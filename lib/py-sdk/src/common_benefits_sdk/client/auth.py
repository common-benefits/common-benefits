"""Authentication for the CommonBenefits HTTP client."""

from __future__ import annotations


class Auth:
    """Authentication configuration for API requests.

    Build one with a factory (:meth:`api_key`, :meth:`bearer`, :meth:`none`) rather than
    the constructor. ``Accept: application/json`` is always added.
    """

    def __init__(self, headers: dict[str, str]) -> None:
        self._headers = headers.copy()
        self._headers["Accept"] = "application/json"

    @classmethod
    def api_key(cls, key: str, header: str = "X-API-Key") -> "Auth":
        """Authenticate with an API key sent in ``header`` (default ``X-API-Key``)."""
        return cls(headers={header: key})

    @classmethod
    def bearer(cls, token: str) -> "Auth":
        """Authenticate with a bearer token in the ``Authorization`` header."""
        return cls(headers={"Authorization": f"Bearer {token}"})

    @classmethod
    def none(cls) -> "Auth":
        """No authentication (for open endpoints)."""
        return cls(headers={})

    def get_headers(self) -> dict[str, str]:
        """Return a copy of the headers to send with each request."""
        return self._headers.copy()
