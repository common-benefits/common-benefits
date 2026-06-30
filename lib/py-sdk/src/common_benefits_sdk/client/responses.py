"""Response envelope models and the typed per-resource result objects.

The composable success envelopes — ``Ok`` / ``Paginated`` / ``Sorted`` / ``Filtered`` — mirror
the protocol response shapes (and the TypeScript SDK's ``responses.ts``): each builds on the
previous (``Ok`` adds ``data``; ``Paginated`` adds ``items`` + ``pagination_info``; ``Sorted``
adds ``sort_info``; ``Filtered`` adds a typed ``filter_info``). ``PaginationInfo`` / ``SortInfo``
/ ``FilterInfo`` are the metadata pieces they carry.

``ListResult`` / ``SearchResult`` are the *ergonomic* objects a resource method returns: the
per-row ``ParsedItem`` list plus the envelope metadata and a flat ``parse_errors`` list. They
sit on top of the envelopes so one bad row doesn't fail the batch; ``_RawPage`` is the raw form
the client parses (items left as dicts for per-row parsing — the analog of the TS client
parsing ``Paginated<unknown>``).
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Generic, Optional, TypeVar

from pydantic import BaseModel, Field

from ..schemas.base import CommonBenefitsBaseModel
from .results import ParseError, ParsedItem

TItem = TypeVar("TItem", bound=BaseModel)
T = TypeVar("T")
F = TypeVar("F")


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


class TypedFilterInfo(CommonBenefitsBaseModel, Generic[F]):
    """The ``filterInfo`` of a filtered response, with ``filters`` typed by ``F``."""

    filters: F
    errors: Optional[list[str]] = None


# ############################################################################
# Composable success envelopes (mirror ts-sdk/src/client/responses.ts)
# ############################################################################


class Success(CommonBenefitsBaseModel):
    """The base success envelope: an HTTP status and a message."""

    status: int = 200
    message: str = "Success"


class Ok(Success, Generic[T]):
    """A single-item success response: ``{ status, message, data }``."""

    data: T


class Paginated(Success, Generic[T]):
    """A paginated success response: adds ``items`` and ``pagination_info``."""

    items: list[T] = Field(default_factory=list)
    pagination_info: PaginationInfo


class Sorted(Paginated[T], Generic[T]):
    """A paginated + sorted response: adds ``sort_info``."""

    sort_info: SortInfo


class Filtered(Sorted[T], Generic[T, F]):
    """A paginated + sorted + filtered response: adds a typed ``filter_info``."""

    filter_info: TypedFilterInfo[F]


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
