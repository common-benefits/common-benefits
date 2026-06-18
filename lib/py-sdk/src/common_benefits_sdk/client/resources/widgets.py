"""The ``widgets`` resource (placeholder until a real model such as Program lands)."""

from __future__ import annotations

from typing import TypeVar

from pydantic import BaseModel

from .base import Resource

TItem = TypeVar("TItem", bound=BaseModel)


class Widgets(Resource[TItem]):
    """Typed widgets resource. Item type is supplied by the plugin via ``get_client``."""
