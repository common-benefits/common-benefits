"""The ``widgets`` resource (placeholder until a real model such as Program lands)."""

from __future__ import annotations

from typing import Any, ClassVar, Generic, Mapping, Optional, TypeVar, cast

import typing_extensions as te
from pydantic import BaseModel

from ...schemas.filters import FilterValue, NumberRange, StringComparison, WidgetFilters
from ..responses import ListResult, SearchResult
from ..results import ParsedItem
from .base import FilterSpecMap, Resource

TItem = TypeVar("TItem", bound=BaseModel)
TFilters = te.TypeVar("TFilters", default=WidgetFilters)


class Widgets(Resource[TItem], Generic[TItem, TFilters]):
    """Typed widgets resource.

    Generic over the parsed item type and the search-filters TypedDict (``WidgetFilters`` by
    default, or a plugin's registered extension). Both are supplied by the plugin via
    ``get_client``. ``search``'s ``filters`` accepts the registered TypedDict (registered
    keys autocomplete) or any open mapping (extra keys pass through to ``customFilters``).
    """

    #: Protocol default filters for widgets (mirrors ts-sdk WidgetDefaultFiltersSchema).
    _standard_filters: ClassVar[FilterSpecMap] = {
        "color": StringComparison,
        "weight": NumberRange,
    }

    def get(self, item_id: str) -> ParsedItem[TItem]:
        """Fetch a single widget by id."""
        return self._get(item_id)

    def list(
        self, *, page: Optional[int] = None, page_size: Optional[int] = None
    ) -> ListResult[TItem]:
        """List widgets."""
        return self._list(page=page, page_size=page_size)

    def search(
        self,
        *,
        filters: "Optional[TFilters | Mapping[str, FilterValue]]" = None,
        query: Optional[str] = None,
        page: Optional[int] = None,
        page_size: Optional[int] = None,
    ) -> SearchResult[TItem]:
        """Search widgets. Registered filter keys autocomplete; extra keys pass through."""
        return self._search(
            filters=cast("Optional[Mapping[str, Any]]", filters),
            query=query,
            page=page,
            page_size=page_size,
        )
