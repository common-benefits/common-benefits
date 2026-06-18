"""The resource base: construction, reusable helpers, and filter categorization.

This base intentionally exposes no public verbs. Each concrete resource (``Widgets``,
``Gadgets``, and real resources such as ``Applications`` / ``Organizations``) declares its
own public API (``get`` / ``list`` / ``search`` plus resource-specific filterable verbs like
``history`` or ``submit``) by delegating to the ``_get`` / ``_list`` / ``_filtered_request``
helpers here. HTTP requests and pagination live on :class:`BaseClient`.

``_filtered_request`` categorizes a flat ``filters`` bag the way the TS SDK does: keys
matching the method's standard (protocol) filters go to the top level; registered and ad hoc
keys validate and nest under ``customFilters``. So custom filters pass through even with no
plugin; invalid filter values raise :class:`FilterError` before the request. ``search`` is
just the most common filterable verb built on this helper; ``Gadgets.history`` shows a second.
"""

from __future__ import annotations

from typing import Any, ClassVar, Generic, Mapping, Optional, TypeVar

from pydantic import BaseModel, ValidationError

from ...schemas.base import CommonBenefitsBaseModel
from ...schemas.filters import DefaultFilter
from ..base import BaseClient
from ..exceptions import FilterError
from ..responses import ListResult, SearchResult
from ..results import ParsedItem, parse_batch, parse_item

TItem = TypeVar("TItem", bound=BaseModel)

# A registry of filter key -> the model that validates that key's value.
FilterSpecMap = dict[str, type[CommonBenefitsBaseModel]]


class Resource(Generic[TItem]):
    """Base for a typed API resource bound to one common-model item type."""

    #: Protocol-defined ("standard") filters for the search route; keys route to top level.
    _standard_filters: ClassVar[FilterSpecMap] = {}

    def __init__(
        self,
        http: BaseClient,
        item_schema: type[TItem],
        path: str,
        custom_filters: Optional[FilterSpecMap] = None,
    ) -> None:
        self._http = http
        self._item_schema = item_schema
        self._path = path
        self._custom_filters: FilterSpecMap = custom_filters or {}

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
        """The standard search verb (POSTs to ``{path}/search``)."""
        return self._filtered_request(
            f"{self._path}/search",
            filters=filters,
            standard=self._standard_filters,
            query=query,
            page=page,
            page_size=page_size,
        )

    def _filtered_request(
        self,
        path: str,
        *,
        filters: Optional[Mapping[str, Any]] = None,
        standard: Optional[FilterSpecMap] = None,
        query: Optional[str] = None,
        extra: Optional[dict[str, Any]] = None,
        page: Optional[int] = None,
        page_size: Optional[int] = None,
    ) -> SearchResult[TItem]:
        """Run any filterable verb: categorize ``filters``, POST, and parse rows.

        ``standard`` is the method's top-level (protocol) filter map; ``extra`` adds extra
        body fields (e.g. ``history``'s ``since``). Used by ``_search`` and by resource-
        specific verbs like ``Gadgets.history``.
        """
        body: dict[str, Any] = dict(extra or {})
        if filters:
            body["filters"] = self._categorize(filters, standard or {})
        if query is not None:
            body["search"] = query
        page_obj = self._http.fetch_many(
            path, method="POST", json=body, page=page, page_size=page_size
        )
        items, errors = parse_batch(self._item_schema, page_obj.items)
        return SearchResult(
            items=items,
            pagination_info=page_obj.pagination_info,
            parse_errors=errors,
            filter_info=page_obj.filter_info,
            sort_info=page_obj.sort_info,
        )

    # -- filter categorization -----------------------------------------------------------

    def _categorize(
        self, filters: Mapping[str, Any], standard: FilterSpecMap
    ) -> dict[str, Any]:
        """Split filters into standard (top-level) and custom (nested), validating each."""
        top: dict[str, Any] = {}
        custom: dict[str, Any] = {}
        for key, value in filters.items():
            if key in standard:
                top[key] = self._validate(standard[key], key, value)
            elif key in self._custom_filters:
                custom[key] = self._validate(self._custom_filters[key], key, value)
            else:
                custom[key] = self._validate(DefaultFilter, key, value)
        out: dict[str, Any] = dict(top)
        if custom:
            out["customFilters"] = custom
        return out

    @staticmethod
    def _validate(model: type[CommonBenefitsBaseModel], key: str, value: Any) -> Any:
        try:
            validated = model.model_validate(value)
        except ValidationError as exc:
            raise FilterError(key, exc.errors()) from exc
        return validated.model_dump(by_alias=True, mode="json")


__all__ = ["Resource", "FilterSpecMap"]
