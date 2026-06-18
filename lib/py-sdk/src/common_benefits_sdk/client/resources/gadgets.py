"""The ``gadgets`` resource (a second placeholder model, distinct from widgets)."""

from __future__ import annotations

from typing import Any, Generic, Mapping, Optional, TypeVar, cast

import typing_extensions as te
from pydantic import BaseModel

from ...schemas.filters import FilterValue, GadgetFilters
from ..responses import ListResult, SearchResult
from ..results import ParsedItem
from .base import Resource

TItem = TypeVar("TItem", bound=BaseModel)
TFilters = te.TypeVar("TFilters", default=GadgetFilters)


class Gadgets(Resource[TItem], Generic[TItem, TFilters]):
    """Typed gadgets resource.

    Generic over the parsed item type and the search-filters TypedDict (``GadgetFilters`` by
    default, or a plugin's registered extension). Both are supplied by ``get_client``.
    """

    def get(self, item_id: str) -> ParsedItem[TItem]:
        """Fetch a single gadget by id."""
        return self._get(item_id)

    def list(
        self, *, page: Optional[int] = None, page_size: Optional[int] = None
    ) -> ListResult[TItem]:
        """List gadgets."""
        return self._list(page=page, page_size=page_size)

    def search(
        self,
        *,
        filters: "Optional[TFilters | Mapping[str, FilterValue]]" = None,
        query: Optional[str] = None,
        page: Optional[int] = None,
        page_size: Optional[int] = None,
    ) -> SearchResult[TItem]:
        """Search gadgets. Registered filter keys autocomplete; extra keys pass through."""
        return self._search(
            filters=cast("Optional[Mapping[str, Any]]", filters),
            query=query,
            page=page,
            page_size=page_size,
        )
