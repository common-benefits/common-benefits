"""Plugin assembly: ``PluginSchemas``, ``Plugin``, ``define_plugin``, and ``get_client``.

A plugin maps the schema extensions an author builds with ``schema(...)`` onto the
registered extensible schemas, keyed by registry name. Schemas a plugin does not extend
fall back to the base schema (a ``SchemaOnly``), never ``None``, so consumers get fully
typed, non-optional dot access: ``plugin.schemas.Widget``.

``PluginSchemas`` and ``Plugin`` are frozen dataclasses with covariant type parameters
(read-only, so covariance is sound). That covariance is what lets ``get_client`` recover
each slot's concrete common-model item type via a ``self`` annotation, with no call-site
type arguments.
"""

from __future__ import annotations

from dataclasses import dataclass, field, fields
from typing import Any, Generic, Optional, TypeVar, cast

import typing_extensions as te
from pydantic import BaseModel

from ..client import Auth, BaseClient, CommonBenefitsClient, Config, Gadgets, Widgets
from ..schemas.models import GadgetCommon, WidgetCommon
from .schema import SchemaExtension, SchemaOnly, SchemaWithTransforms, schema
from .types import PluginMeta

# The fallback for a schema a plugin does not extend: the base schema, no custom fields, no
# transforms. A SchemaOnly, so unextended slots have no to_common either.
DefaultWidget = SchemaOnly[WidgetCommon]
DefaultGadget = SchemaOnly[GadgetCommon]

# Covariant: a plugin whose slot holds a SchemaWithTransforms is usable wherever the base
# SchemaExtension is expected, which is what get_client's projection relies on.
_TWidget = te.TypeVar("_TWidget", covariant=True, default=DefaultWidget)
_TGadget = te.TypeVar("_TGadget", covariant=True, default=DefaultGadget)

# Item-type variables recovered by get_client from each slot's common model.
TWItem = TypeVar("TWItem", bound=BaseModel)
TGItem = TypeVar("TGItem", bound=BaseModel)


@dataclass(frozen=True)
class PluginSchemas(Generic[_TWidget, _TGadget]):
    """Maps your extensions to the extensible schemas. Construct it directly.

    Pass one extension per schema you extend, keyed by the registered schema name. Schemas
    you omit fall back to the base schema (a ``SchemaOnly``), never ``None``. Each slot's
    type is inferred concretely, so consumers get non-optional dot access::

        plugin = define_plugin(PluginSchemas(Widget=widget_ext), meta=...)
        plugin.schemas.Widget   # the extension you passed
        plugin.schemas.Gadget   # SchemaOnly[GadgetCommon]

    There is one field per registered extensible schema.
    """

    Widget: _TWidget = field(
        default_factory=lambda: cast("Any", schema(common_schema=WidgetCommon))
    )
    Gadget: _TGadget = field(
        default_factory=lambda: cast("Any", schema(common_schema=GadgetCommon))
    )


@dataclass(frozen=True)
class Plugin(Generic[_TWidget, _TGadget]):
    """The plugin singleton consumers import.

    ``schemas`` is a typed frozen dataclass, so ``plugin.schemas.Widget`` is fully typed.
    ``get_client`` builds a typed client whose resources are typed from the plugin's
    per-slot common models.
    """

    schemas: PluginSchemas[_TWidget, _TGadget]
    meta: PluginMeta

    def get_client(
        self: "Plugin[SchemaExtension[TWItem], SchemaExtension[TGItem]]",
        config: Optional[Config] = None,
        auth: Optional[Auth] = None,
    ) -> CommonBenefitsClient[TWItem, TGItem]:
        """Build a typed client; resources are typed from the plugin's common models.

        ``client.widgets.search(...)`` returns rows typed as this plugin's Widget model
        (custom fields included), with no call-site type arguments.
        """
        http = BaseClient(config, auth)
        return CommonBenefitsClient(
            http=http,
            widgets=Widgets(http, self.schemas.Widget.common_schema, "widgets"),
            gadgets=Gadgets(http, self.schemas.Gadget.common_schema, "gadgets"),
        )


def define_plugin(
    schemas: PluginSchemas[_TWidget, _TGadget], *, meta: PluginMeta
) -> Plugin[_TWidget, _TGadget]:
    """Assemble the plugin from a ``PluginSchemas`` instance and metadata.

    Each attribute name must equal the entry's ``schema_name``, so ``schemas.Widget`` really
    holds the Widget extensible schema.

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
    return Plugin(schemas=schemas, meta=meta)
