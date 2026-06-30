"""Configuration for the CommonBenefits HTTP client."""

from __future__ import annotations

import os
from typing import Optional

import httpx

from .auth import Auth


class Config:
    """Client configuration, resolved from explicit args then ``CB_*`` env vars.

    ``base_url`` is required (arg or ``CB_API_BASE_URL``). ``api_key`` is optional: when
    set (arg or ``CB_API_KEY``) the client uses API-key auth, otherwise no auth. ``transport``
    lets callers inject an ``httpx`` transport (e.g. a mock) for offline use and tests.
    """

    DEFAULT_PAGE_SIZE = 100
    DEFAULT_TIMEOUT = 10.0
    DEFAULT_MAX_ITEMS = 1000

    def __init__(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        timeout: Optional[float] = None,
        page_size: Optional[int] = None,
        max_items: Optional[int] = None,
        transport: Optional[httpx.BaseTransport] = None,
    ) -> None:
        base_url_value = (
            base_url if base_url is not None else os.getenv("CB_API_BASE_URL")
        )
        if not base_url_value:
            raise ValueError(
                "base_url is required (pass base_url= or set CB_API_BASE_URL)"
            )
        if not base_url_value.startswith(("http://", "https://")):
            raise ValueError("base_url must start with http:// or https://")
        self.base_url: str = base_url_value

        self.api_key: Optional[str] = (
            api_key if api_key is not None else os.getenv("CB_API_KEY")
        )
        self.timeout: float = timeout or float(
            os.getenv("CB_API_TIMEOUT", self.DEFAULT_TIMEOUT)
        )
        self.page_size: int = page_size or int(
            os.getenv("CB_API_PAGE_SIZE", self.DEFAULT_PAGE_SIZE)
        )
        self.max_items: int = max_items or int(
            os.getenv("CB_API_MAX_ITEMS", self.DEFAULT_MAX_ITEMS)
        )
        self.transport: Optional[httpx.BaseTransport] = transport

    def default_auth(self) -> Auth:
        """API-key auth when ``api_key`` is set, otherwise no auth."""
        return Auth.api_key(self.api_key) if self.api_key else Auth.none()
