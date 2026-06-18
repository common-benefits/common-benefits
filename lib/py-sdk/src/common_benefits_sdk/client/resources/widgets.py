"""The ``widgets`` resource (placeholder until a real model such as Program lands)."""

from __future__ import annotations

from typing import Any, ClassVar, Mapping, Optional, TypeVar

from pydantic import BaseModel

from ...schemas.filters import NumberRange, StringComparison
from ..responses import ListResult, SearchResult
from ..results import ParsedItem
from .base import FilterSpecMap, Resource

TItem = TypeVar("TItem", bound=BaseModel)


class Widgets(Resource[TItem]):
    """Typed widgets resource. Item type is supplied by the plugin via ``get_client``."""

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
        filters: Optional[Mapping[str, Any]] = None,
        query: Optional[str] = None,
        page: Optional[int] = None,
        page_size: Optional[int] = None,
    ) -> SearchResult[TItem]:
        """Search widgets by query and/or filters."""
        return self._search(
            filters=filters, query=query, page=page, page_size=page_size
        )
