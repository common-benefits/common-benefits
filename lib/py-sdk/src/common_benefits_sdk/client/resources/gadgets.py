"""The ``gadgets`` resource (a second placeholder model, distinct from widgets)."""

from __future__ import annotations

from typing import TypeVar

from pydantic import BaseModel

from .base import Resource

TItem = TypeVar("TItem", bound=BaseModel)


class Gadgets(Resource[TItem]):
    """Typed gadgets resource. Item type is supplied by the plugin via ``get_client``."""
