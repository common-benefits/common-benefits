"""Plugin assembly: ``PluginSchemas``, ``Plugin``, ``define_plugin``, and ``get_client``.

A plugin maps the schema extensions an author builds with ``schema(...)`` onto the
registered extensible schemas, and (optionally) registers per-route custom filters via
``routes``. Schemas a plugin does not extend fall back to the base schema (a ``SchemaOnly``),
never ``None``; routes a plugin does not register fall back to the resource's standard
filters. So consumers get fully typed, non-optional dot access: ``plugin.schemas.Widget``
and ``client.widgets.search(filters=...)``.

``PluginSchemas``, ``Plugin``, and the route carriers are frozen dataclasses with covariant
type parameters (read-only, so covariance is sound). That covariance lets ``get_client``
recover each slot's concrete common-model item type *and* each route's filter TypedDict via
a single ``self`` annotation, with no call-site type arguments.
"""

from __future__ import annotations

from dataclasses import dataclass, field, fields
from typing import Any, Generic, Optional, TypeVar, cast

import typing_extensions as te
from pydantic import BaseModel

from ..client import Auth, BaseClient, CommonBenefitsClient, Config, Gadgets, Widgets
from ..schemas.filters import GadgetFilters, WidgetFilters
from ..schemas.models import GadgetCommon, WidgetCommon
from .routes import ResourceRoutes, RouteFilters, Routes
from .schema import SchemaExtension, SchemaOnly, SchemaWithTransforms, schema
from .types import PluginMeta

# Fallbacks for an unextended schema slot: the base schema, no custom fields, no transforms.
DefaultWidget = SchemaOnly[WidgetCommon]
DefaultGadget = SchemaOnly[GadgetCommon]

# Covariant slot carriers: a plugin whose slot holds a SchemaWithTransforms is usable
# wherever the base SchemaExtension is expected, which is what get_client's projection relies
# on. The route carriers default to each resource's standard filters.
_TWidget = te.TypeVar("_TWidget", covariant=True, default=DefaultWidget)
_TGadget = te.TypeVar("_TGadget", covariant=True, default=DefaultGadget)
_RWidget = te.TypeVar(
    "_RWidget", covariant=True, default="ResourceRoutes[RouteFilters[WidgetFilters]]"
)
_RGadget = te.TypeVar(
    "_RGadget", covariant=True, default="ResourceRoutes[RouteFilters[GadgetFilters]]"
)

# Types get_client recovers from the plugin: per-slot item types and per-route filter types.
TWItem = TypeVar("TWItem", bound=BaseModel)
TGItem = TypeVar("TGItem", bound=BaseModel)
TFW = TypeVar("TFW")
TFG = TypeVar("TFG")


@dataclass(frozen=True)
class PluginSchemas(Generic[_TWidget, _TGadget]):
    """Maps your extensions to the extensible schemas. Construct it directly.

    Pass one extension per schema you extend, keyed by the registered schema name. Schemas
    you omit fall back to the base schema (a ``SchemaOnly``), never ``None``::

        plugin = define_plugin(PluginSchemas(Widget=widget_ext), meta=...)
        plugin.schemas.Widget   # the extension you passed
        plugin.schemas.Gadget   # SchemaOnly[GadgetCommon]
    """

    Widget: _TWidget = field(
        default_factory=lambda: cast("Any", schema(common_schema=WidgetCommon))
    )
    Gadget: _TGadget = field(
        default_factory=lambda: cast("Any", schema(common_schema=GadgetCommon))
    )


@dataclass(frozen=True)
class Plugin(Generic[_TWidget, _TGadget, _RWidget, _RGadget]):
    """The plugin singleton consumers import.

    ``schemas`` and ``routes`` are typed frozen dataclasses, so ``plugin.schemas.Widget`` is
    fully typed and ``get_client`` builds a client whose resources are typed from the
    plugin's common models and registered route filters.
    """

    schemas: PluginSchemas[_TWidget, _TGadget]
    routes: Routes[_RWidget, _RGadget]
    meta: PluginMeta

    def get_client(
        self: Plugin[
            SchemaExtension[TWItem],
            SchemaExtension[TGItem],
            ResourceRoutes[RouteFilters[TFW]],
            ResourceRoutes[RouteFilters[TFG]],
        ],
        config: Optional[Config] = None,
        auth: Optional[Auth] = None,
    ) -> CommonBenefitsClient[TWItem, TFW, TGItem, TFG]:
        """Build a typed client from the plugin's common models and registered filters.

        ``client.widgets.search(filters=...)`` returns rows typed as this plugin's Widget
        model and autocompletes the registered filter keys, with no call-site type args.
        """
        http = BaseClient(config, auth)
        client = CommonBenefitsClient(
            http=http,
            widgets=Widgets(http, self.schemas.Widget.common_schema, "widgets"),
            gadgets=Gadgets(http, self.schemas.Gadget.common_schema, "gadgets"),
        )
        return cast("CommonBenefitsClient[TWItem, TFW, TGItem, TFG]", client)


def define_plugin(
    schemas: PluginSchemas[_TWidget, _TGadget],
    *,
    routes: Routes[_RWidget, _RGadget] = Routes(),
    meta: PluginMeta,
) -> Plugin[_TWidget, _TGadget, _RWidget, _RGadget]:
    """Assemble the plugin from schema extensions, optional route registrations, and metadata.

    Each schema attribute name must equal the entry's ``schema_name``, so ``schemas.Widget``
    really holds the Widget extensible schema.

    Raises:
        PluginDefinitionError: If any slot does not hold a schema extension, or holds one
            whose ``schema_name`` does not match its attribute name.
    """
    from .schema import PluginDefinitionError

    errors: list[str] = []
    for fld in fields(cast(Any, schemas)):
        entry = getattr(schemas, fld.name)
        if not isinstance(entry, (SchemaWithTransforms, SchemaOnly)):
            errors.append(f"schemas.{fld.name}: not a schema extension")
        elif entry.schema_name != fld.name:
            errors.append(
                f"schemas.{fld.name}: holds the {entry.schema_name!r} extensible schema; "
                f"the attribute name must match the schema name"
            )
    if errors:
        raise PluginDefinitionError("plugin", errors)
    return Plugin(schemas=schemas, routes=routes, meta=meta)
