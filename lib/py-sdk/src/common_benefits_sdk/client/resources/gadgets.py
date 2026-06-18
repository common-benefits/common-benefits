"""The ``gadgets`` resource (a second placeholder model, distinct from widgets)."""

from __future__ import annotations

from typing import Any, Mapping, Optional, TypeVar

from pydantic import BaseModel

from ..responses import ListResult, SearchResult
from ..results import ParsedItem
from .base import Resource

TItem = TypeVar("TItem", bound=BaseModel)


class Gadgets(Resource[TItem]):
    """Typed gadgets resource. Item type is supplied by the plugin via ``get_client``."""

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
        filters: Optional[Mapping[str, Any]] = None,
        query: Optional[str] = None,
        page: Optional[int] = None,
        page_size: Optional[int] = None,
    ) -> SearchResult[TItem]:
        """Search gadgets by query and/or filters."""
        return self._search(
            filters=filters, query=query, page=page, page_size=page_size
        )
