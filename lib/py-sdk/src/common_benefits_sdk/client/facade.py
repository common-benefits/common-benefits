"""The typed client facade returned by ``plugin.get_client(...)``.

Fixed, typed resource attributes (``widgets``, ``gadgets``) parallel the fixed slots in
``PluginSchemas``. The facade is generic over each resource's item type; ``get_client``
projects the plugin's per-slot common-model types onto these parameters, so
``client.widgets.search(...)`` returns rows typed as the plugin's Widget model with no
call-site annotations.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Generic, TypeVar

from pydantic import BaseModel

from .base import BaseClient
from .resources import Gadgets, Widgets

TWItem = TypeVar("TWItem", bound=BaseModel)
TGItem = TypeVar("TGItem", bound=BaseModel)


@dataclass
class CommonBenefitsClient(Generic[TWItem, TGItem]):
    """Typed client with one resource per registered extensible schema."""

    http: BaseClient
    widgets: Widgets[TWItem]
    gadgets: Gadgets[TGItem]

    def close(self) -> None:
        """Close the underlying HTTP client."""
        self.http.close()

    def __enter__(self) -> "CommonBenefitsClient[TWItem, TGItem]":
        return self

    def __exit__(self, *exc: object) -> None:
        self.close()
