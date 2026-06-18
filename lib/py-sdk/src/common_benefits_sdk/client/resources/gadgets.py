"""The ``gadgets`` resource (a second placeholder model, distinct from widgets).

Gadgets also demonstrates a resource whose *additional* filterable verb is not ``search``:
``history`` accepts its own typed filters (``GadgetHistoryFilters``) and an extra ``since``
argument. Any verb that accepts filters delegates to ``Resource._filtered_request``, passing
that method's own standard-filter map, so the categorize / passthrough / validation behavior
is identical to ``search``.
"""

from __future__ import annotations

from typing import Any, ClassVar, Generic, Mapping, Optional, TypedDict, TypeVar, cast

import typing_extensions as te
from pydantic import BaseModel

from ...schemas.filters import FilterValue, GadgetFilters, StringComparison
from ..responses import ListResult, SearchResult
from ..results import ParsedItem
from .base import FilterSpecMap, Resource

TItem = TypeVar("TItem", bound=BaseModel)
TFilters = te.TypeVar("TFilters", default=GadgetFilters)


class GadgetHistoryFilters(TypedDict, total=False):
    """Standard filters for the gadgets ``history`` route."""

    actor: StringComparison


class Gadgets(Resource[TItem], Generic[TItem, TFilters]):
    """Typed gadgets resource.

    Generic over the parsed item type and the search-filters TypedDict (``GadgetFilters`` by
    default, or a plugin's registered extension). Both are supplied by ``get_client``.
    """

    #: Protocol filters for the ``history`` verb (top-level keys; the rest pass through).
    _history_filters: ClassVar[FilterSpecMap] = {"actor": StringComparison}

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

    def history(
        self,
        *,
        filters: "Optional[GadgetHistoryFilters | Mapping[str, FilterValue]]" = None,
        since: Optional[str] = None,
    ) -> SearchResult[TItem]:
        """Fetch a gadget's change history (POSTs to ``{path}/history``).

        A second filterable verb with its own filter shape (``GadgetHistoryFilters``) and an
        extra ``since`` argument, to show how a resource handles a non-``search`` method.
        """
        return self._filtered_request(
            f"{self._path}/history",
            filters=cast("Optional[Mapping[str, Any]]", filters),
            standard=self._history_filters,
            extra={"since": since} if since is not None else None,
        )
