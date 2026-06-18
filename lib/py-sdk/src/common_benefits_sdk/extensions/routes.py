"""Per-route filter registration carriers (static typing only).

A plugin author registers the custom filters a route accepts by declaring a TypedDict that
extends the resource's standard filters, then naming it in ``Routes`` / ``ResourceRoutes``::

    class WidgetSearchFilters(WidgetFilters, total=False):
        region: StringArray

    routes = Routes(widget=ResourceRoutes(search=RouteFilters[WidgetSearchFilters]()))

``RouteFilters[TF]`` is a phantom carrier: it holds no runtime data, it only carries the
TypedDict type so ``get_client`` can project it onto ``client.widgets.search(filters=...)``.
These are frozen, covariant dataclasses so ``get_client`` can recover the per-method filter
type via a ``self`` annotation, the same pattern as the schema slots. The runtime filter
categorization on the resource does not need them.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Generic, TypeVar, cast

import typing_extensions as te

from ..schemas.filters import GadgetFilters, WidgetFilters

TF = TypeVar("TF")


class RouteFilters(Generic[TF]):
    """Phantom carrier of a route method's filters TypedDict type (static typing only)."""


_S = te.TypeVar("_S", covariant=True, default="RouteFilters[Any]")


@dataclass(frozen=True)
class ResourceRoutes(Generic[_S]):
    """A resource's filterable methods. One slot per method (``search`` to start)."""

    search: _S = field(default_factory=lambda: cast("Any", RouteFilters()))


_RWidget = te.TypeVar(
    "_RWidget", covariant=True, default="ResourceRoutes[RouteFilters[WidgetFilters]]"
)
_RGadget = te.TypeVar(
    "_RGadget", covariant=True, default="ResourceRoutes[RouteFilters[GadgetFilters]]"
)


@dataclass(frozen=True)
class Routes(Generic[_RWidget, _RGadget]):
    """Per-resource route registration. Omitted resources default to standard filters."""

    widget: _RWidget = field(default_factory=lambda: cast("Any", ResourceRoutes()))
    gadget: _RGadget = field(default_factory=lambda: cast("Any", ResourceRoutes()))
