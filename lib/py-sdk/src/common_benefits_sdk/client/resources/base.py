"""The resource base: construction, reusable helpers, and filter categorization.

This base intentionally exposes no public verbs. Each concrete resource (``Widgets``,
``Gadgets``, and real resources such as ``Applications`` / ``Organizations``) declares its
own public API (``get`` / ``list`` / ``search`` plus resource-specific verbs like
``submit`` or ``history``) by delegating to the ``_get`` / ``_list`` / ``_search`` helpers
here. HTTP requests and pagination live on :class:`BaseClient`.

``_search`` categorizes the flat ``filters`` bag the way the TS SDK does: keys matching the
resource's standard (protocol) filters go to the top level; registered custom keys and ad
hoc keys alike validate and nest under ``customFilters``. So custom filters pass through
even with no plugin; invalid filter values raise :class:`FilterError` before the request.
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

    #: Protocol-defined ("standard") filters for this resource; keys route to top level.
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
        """Search items, per-row parsed (POSTed to ``{path}/search``)."""
        body: dict[str, Any] = {}
        if filters:
            body["filters"] = self._categorize(filters)
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

    # -- filter categorization -----------------------------------------------------------

    def _categorize(self, filters: Mapping[str, Any]) -> dict[str, Any]:
        """Split filters into standard (top-level) and custom (nested), validating each."""
        standard: dict[str, Any] = {}
        custom: dict[str, Any] = {}
        for key, value in filters.items():
            if key in self._standard_filters:
                standard[key] = self._validate(self._standard_filters[key], key, value)
            elif key in self._custom_filters:
                custom[key] = self._validate(self._custom_filters[key], key, value)
            else:
                custom[key] = self._validate(DefaultFilter, key, value)
        out: dict[str, Any] = dict(standard)
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
