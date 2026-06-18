"""Response envelope models and the typed per-resource result objects.

``PaginationInfo`` / ``SortInfo`` / ``FilterInfo`` model the protocol response envelope.
``ListResult`` / ``SearchResult`` are what a resource method returns: the per-row
``ParsedItem`` list plus the envelope metadata and a flat ``parse_errors`` list.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Generic, Optional, TypeVar

from pydantic import BaseModel, Field

from ..schemas.base import CommonBenefitsBaseModel
from .results import ParseError, ParsedItem

TItem = TypeVar("TItem", bound=BaseModel)


class PaginationInfo(CommonBenefitsBaseModel):
    """Pagination metadata from a paged response (camelCase on the wire)."""

    page: int
    page_size: int
    total_items: Optional[int] = None
    total_pages: Optional[int] = None


class SortInfo(CommonBenefitsBaseModel):
    """Sort metadata echoed back by a search response."""

    sort_by: Optional[str] = None
    sort_order: Optional[str] = None
    errors: Optional[list[str]] = None


class FilterInfo(CommonBenefitsBaseModel):
    """Filter metadata echoed back by a search response (the applied filters)."""

    filters: dict[str, Any] = Field(default_factory=dict)
    errors: Optional[list[str]] = None


class _RawPage(CommonBenefitsBaseModel):
    """Internal: the raw server page, items left as dicts for per-row parsing."""

    items: list[dict[str, Any]] = Field(default_factory=list)
    pagination_info: PaginationInfo
    sort_info: Optional[SortInfo] = None
    filter_info: Optional[FilterInfo] = None
    status: int = 200
    message: str = "Success"


@dataclass
class ListResult(Generic[TItem]):
    """Result of ``list``: per-row parse results plus pagination and aggregated errors."""

    items: list[ParsedItem[TItem]]
    pagination_info: PaginationInfo
    parse_errors: list[ParseError] = field(default_factory=list)


@dataclass
class SearchResult(Generic[TItem]):
    """Result of ``search``: ``ListResult`` plus the echoed filter and sort metadata."""

    items: list[ParsedItem[TItem]]
    pagination_info: PaginationInfo
    parse_errors: list[ParseError] = field(default_factory=list)
    filter_info: Optional[FilterInfo] = None
    sort_info: Optional[SortInfo] = None
