"""Low-level HTTP client: requests, URL building, and lifecycle."""

from __future__ import annotations

from typing import Any, Optional

import httpx

from .auth import Auth
from .config import Config
from .exceptions import APIError


class BaseClient:
    """Thin ``httpx`` wrapper: auth headers, URL building, JSON requests, lifecycle.

    Resource classes use :meth:`get_json` / :meth:`post_json`; the typed facade and
    resources are layered on top. HTTP and transport errors are normalized to
    :class:`APIError`.
    """

    def __init__(
        self, config: Optional[Config] = None, auth: Optional[Auth] = None
    ) -> None:
        self.config = config or Config()
        self.auth = auth or self.config.default_auth()
        self.http = httpx.Client(
            timeout=self.config.timeout, transport=self.config.transport
        )

    def url(self, path: str) -> str:
        """Join the configured base URL with ``path``."""
        return f"{self.config.base_url.rstrip('/')}/{path.lstrip('/')}"

    def _request(
        self,
        method: str,
        path: str,
        *,
        params: Optional[dict[str, Any]] = None,
        json: Optional[dict[str, Any]] = None,
    ) -> Any:
        try:
            response = self.http.request(
                method,
                self.url(path),
                headers=self.auth.get_headers(),
                params=params,
                json=json,
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as exc:
            raise APIError(
                exc.response.status_code, exc.response.reason_phrase, exc.response.text
            ) from exc
        except httpx.HTTPError as exc:
            raise APIError(0, str(exc)) from exc

    def get_json(self, path: str, params: Optional[dict[str, Any]] = None) -> Any:
        """GET ``path`` and return the decoded JSON body."""
        return self._request("GET", path, params=params)

    def post_json(
        self,
        path: str,
        json: dict[str, Any],
        params: Optional[dict[str, Any]] = None,
    ) -> Any:
        """POST ``json`` to ``path`` and return the decoded JSON body."""
        return self._request("POST", path, params=params, json=json)

    def close(self) -> None:
        """Close the underlying HTTP client."""
        self.http.close()

    def __enter__(self) -> "BaseClient":
        return self

    def __exit__(self, *exc: object) -> None:
        self.close()
