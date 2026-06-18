"""The generic resource base: ``get`` / ``list`` / ``search`` over one item type."""

from __future__ import annotations

from typing import Any, Generic, Mapping, Optional, TypeVar

from pydantic import BaseModel

from ..base import BaseClient
from ..responses import (
    FilterInfo,
    ListResult,
    PaginationInfo,
    SearchResult,
    SortInfo,
    _RawPage,
)
from ..results import ParsedItem, parse_batch, parse_item

TItem = TypeVar("TItem", bound=BaseModel)


class Resource(Generic[TItem]):
    """A typed API resource bound to one common-model item type.

    ``get`` returns a single :data:`ParsedItem`; ``list`` and ``search`` return
    per-row-parsed results so one malformed record does not fail the whole response.
    ``search`` accepts an open ``filters`` mapping, so custom filters pass through even
    with no plugin (Phase 3 layers the typed, per-method filter declaration on top).
    """

    def __init__(self, http: BaseClient, item_schema: type[TItem], path: str) -> None:
        self._http = http
        self._item_schema = item_schema
        self._path = path

    def get(self, item_id: str) -> ParsedItem[TItem]:
        """Fetch a single item by id, returning it wrapped in a ``ParsedItem``."""
        body = self._http.get_json(f"{self._path}/{item_id}")
        raw = body.get("data", body) if isinstance(body, dict) else body
        return parse_item(self._item_schema, raw)

    def list(
        self, *, page: Optional[int] = None, page_size: Optional[int] = None
    ) -> ListResult[TItem]:
        """List items. With ``page=None``, fetch all pages up to ``config.max_items``."""
        page_obj = self._paginate("GET", None, page, page_size)
        items, errors = parse_batch(self._item_schema, page_obj.items)
        return ListResult(
            items=items, pagination_info=page_obj.pagination_info, parse_errors=errors
        )

    def search(
        self,
        *,
        filters: Optional[Mapping[str, Any]] = None,
        query: Optional[str] = None,
        page: Optional[int] = None,
        page_size: Optional[int] = None,
    ) -> SearchResult[TItem]:
        """Search items by ``query`` and/or ``filters`` (POSTed to ``{path}/search``)."""
        body: dict[str, Any] = {}
        if filters:
            body["filters"] = dict(filters)
        if query is not None:
            body["search"] = query
        page_obj = self._paginate("POST", body, page, page_size)
        items, errors = parse_batch(self._item_schema, page_obj.items)
        return SearchResult(
            items=items,
            pagination_info=page_obj.pagination_info,
            parse_errors=errors,
            filter_info=page_obj.filter_info,
            sort_info=page_obj.sort_info,
        )

    # -- pagination helpers --------------------------------------------------------------

    def _fetch(
        self, method: str, body: Optional[dict[str, Any]], page: int, page_size: int
    ) -> _RawPage:
        params = {"page": page, "pageSize": page_size}
        if method == "GET":
            raw = self._http.get_json(self._path, params)
        else:
            raw = self._http.post_json(f"{self._path}/search", body or {}, params)
        return _RawPage.model_validate(raw)

    def _paginate(
        self,
        method: str,
        body: Optional[dict[str, Any]],
        page: Optional[int],
        page_size: Optional[int],
    ) -> _RawPage:
        page_size = page_size or self._http.config.page_size
        if page is not None:
            return self._fetch(method, body, page, page_size)

        collected: list[dict[str, Any]] = []
        last: Optional[_RawPage] = None
        current = 1
        max_items = self._http.config.max_items
        while True:
            rp = self._fetch(method, body, current, page_size)
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


__all__ = ["Resource", "FilterInfo", "SortInfo"]
