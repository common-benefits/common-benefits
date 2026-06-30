"""The typed client facade returned by ``plugin.get_client(...)``.

Fixed, typed resource attributes (``widgets``, ``gadgets``) parallel the fixed slots in
``PluginSchemas``. The facade is generic over each resource's item type and search-filters
TypedDict; ``get_client`` projects the plugin's per-slot common-model types and per-route
filter types onto these parameters, so ``client.widgets.search(...)`` returns rows typed as
the plugin's Widget model and accepts the registered filter keys, with no call-site
annotations.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Generic, TypeVar

from pydantic import BaseModel

from .base import BaseClient
from .resources import Gadgets, Widgets

TWItem = TypeVar("TWItem", bound=BaseModel)
TGItem = TypeVar("TGItem", bound=BaseModel)
TWFilters = TypeVar("TWFilters")
TGFilters = TypeVar("TGFilters")


@dataclass
class CommonBenefitsClient(Generic[TWItem, TWFilters, TGItem, TGFilters]):
    """Typed client with one resource per registered extensible schema."""

    http: BaseClient
    widgets: Widgets[TWItem, TWFilters]
    gadgets: Gadgets[TGItem, TGFilters]

    def close(self) -> None:
        """Close the underlying HTTP client."""
        self.http.close()

    def __enter__(self) -> "CommonBenefitsClient[TWItem, TWFilters, TGItem, TGFilters]":
        return self

    def __exit__(self, *exc: object) -> None:
        self.close()
