"""The resource base: construction and reusable protected helpers.

This base intentionally exposes no public verbs. Each concrete resource (``Widgets``,
``Gadgets``, and real resources such as ``Applications`` / ``Organizations``) declares its
own public API (``get`` / ``list`` / ``search`` plus resource-specific verbs like
``submit`` or ``history``) by delegating to the ``_get`` / ``_list`` / ``_search`` helpers
here. HTTP requests and pagination live on :class:`BaseClient`.
"""

from __future__ import annotations

from typing import Any, Generic, Mapping, Optional, TypeVar

from pydantic import BaseModel

from ..base import BaseClient
from ..responses import ListResult, SearchResult
from ..results import ParsedItem, parse_batch, parse_item

TItem = TypeVar("TItem", bound=BaseModel)


class Resource(Generic[TItem]):
    """Base for a typed API resource bound to one common-model item type."""

    def __init__(self, http: BaseClient, item_schema: type[TItem], path: str) -> None:
        self._http = http
        self._item_schema = item_schema
        self._path = path

    def _get(self, item_id: str) -> ParsedItem[TItem]:
        """Fetch one item by id, wrapped in a ``ParsedItem``."""
        body = self._http.fetch(f"{self._path}/{item_id}")
        raw = body.get("data", body) if isinstance(body, dict) else body
        return parse_item(self._item_schema, raw)

    def _list(
        self, *, page: Optional[int] = None, page_size: Optional[int] = None
    ) -> ListResult[TItem]:
        """List items, per-row parsed. With ``page=None``, fetch all pages."""
        page_obj = self._http.fetch_many(
            self._path, method="GET", page=page, page_size=page_size
        )
        items, errors = parse_batch(self._item_schema, page_obj.items)
        return ListResult(
            items=items, pagination_info=page_obj.pagination_info, parse_errors=errors
        )

    def _search(
        self,
        *,
        filters: Optional[Mapping[str, Any]] = None,
        query: Optional[str] = None,
        page: Optional[int] = None,
        page_size: Optional[int] = None,
    ) -> SearchResult[TItem]:
        """Search items, per-row parsed (POSTed to ``{path}/search``)."""
        body: dict[str, Any] = {}
        if filters:
            body["filters"] = dict(filters)
        if query is not None:
            body["search"] = query
        page_obj = self._http.fetch_many(
            f"{self._path}/search",
            method="POST",
            json=body,
            page=page,
            page_size=page_size,
        )
        items, errors = parse_batch(self._item_schema, page_obj.items)
        return SearchResult(
            items=items,
            pagination_info=page_obj.pagination_info,
            parse_errors=errors,
            filter_info=page_obj.filter_info,
            sort_info=page_obj.sort_info,
        )


__all__ = ["Resource"]
