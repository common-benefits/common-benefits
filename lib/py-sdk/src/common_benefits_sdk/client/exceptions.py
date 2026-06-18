"""Client exceptions."""

from __future__ import annotations


class APIError(Exception):
    """Raised when an API request fails (HTTP error or transport error).

    ``status`` is the HTTP status code, or ``0`` for transport-level errors (network,
    timeout) where no response was received. ``body`` carries the raw response text when
    available.
    """

    def __init__(self, status: int, message: str, body: str | None = None) -> None:
        self.status = status
        self.body = body
        super().__init__(f"{status}: {message}")
