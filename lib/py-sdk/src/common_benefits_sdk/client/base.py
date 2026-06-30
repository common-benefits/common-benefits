"""Low-level HTTP client: the request primitives, pagination, and lifecycle.

``BaseClient`` owns the generic verbs (``get`` / ``post`` / ``fetch`` / ``fetch_many``),
mirroring the TS SDK's ``Client``. Resource classes layer their resource-specific verbs on
top by calling these. HTTP and transport errors are normalized to :class:`APIError`.
"""

from __future__ import annotations

from typing import Any, Optional

import httpx

from .auth import Auth
from .config import Config
from .exceptions import APIError
from .responses import PaginationInfo, _RawPage


class BaseClient:
    """Thin ``httpx`` wrapper: auth headers, URL building, request verbs, pagination."""

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

    def request(
        self,
        method: str,
        path: str,
        *,
        params: Optional[dict[str, Any]] = None,
        json: Optional[dict[str, Any]] = None,
    ) -> httpx.Response:
        """Make a request and return the raw response, normalizing errors to ``APIError``."""
        try:
            response = self.http.request(
                method,
                self.url(path),
                headers=self.auth.get_headers(),
                params=params,
                json=json,
            )
            response.raise_for_status()
            return response
        except httpx.HTTPStatusError as exc:
            raise APIError(
                exc.response.status_code, exc.response.reason_phrase, exc.response.text
            ) from exc
        except httpx.HTTPError as exc:
            raise APIError(0, str(exc)) from exc

    def get(
        self, path: str, *, params: Optional[dict[str, Any]] = None
    ) -> httpx.Response:
        """GET ``path``."""
        return self.request("GET", path, params=params)

    def post(
        self,
        path: str,
        *,
        json: Optional[dict[str, Any]] = None,
        params: Optional[dict[str, Any]] = None,
    ) -> httpx.Response:
        """POST ``json`` to ``path``."""
        return self.request("POST", path, params=params, json=json)

    def fetch(
        self,
        path: str,
        *,
        method: str = "GET",
        params: Optional[dict[str, Any]] = None,
        json: Optional[dict[str, Any]] = None,
    ) -> Any:
        """Make a single request and return the decoded JSON body."""
        return self.request(method, path, params=params, json=json).json()

    def fetch_many(
        self,
        path: str,
        *,
        method: str = "GET",
        json: Optional[dict[str, Any]] = None,
        page: Optional[int] = None,
        page_size: Optional[int] = None,
    ) -> _RawPage:
        """Fetch a page, or (when ``page`` is None) all pages up to ``config.max_items``.

        Returns the raw page envelope with items left as dicts, for the caller to parse
        per-row.
        """
        page_size = page_size or self.config.page_size
        if page is not None:
            return self._fetch_page(method, path, json, page, page_size)

        collected: list[dict[str, Any]] = []
        last: Optional[_RawPage] = None
        current = 1
        max_items = self.config.max_items
        while True:
            rp = self._fetch_page(method, path, json, current, page_size)
            last = rp
            collected.extend(rp.items)
            total = rp.pagination_info.total_pages
            if (
                len(collected) >= max_items
                or total is None
                or rp.pagination_info.page >= total
            ):
                break
            current += 1

        collected = collected[:max_items]
        return _RawPage(
            items=collected,
            pagination_info=PaginationInfo(
                page=1,
                page_size=len(collected),
                total_items=len(collected),
                total_pages=1,
            ),
            sort_info=last.sort_info if last else None,
            filter_info=last.filter_info if last else None,
        )

    def _fetch_page(
        self,
        method: str,
        path: str,
        json: Optional[dict[str, Any]],
        page: int,
        page_size: int,
    ) -> _RawPage:
        params = {"page": page, "pageSize": page_size}
        raw = self.fetch(path, method=method, params=params, json=json)
        return _RawPage.model_validate(raw)

    def close(self) -> None:
        """Close the underlying HTTP client."""
        self.http.close()

    def __enter__(self) -> "BaseClient":
        return self

    def __exit__(self, *exc: object) -> None:
        self.close()
