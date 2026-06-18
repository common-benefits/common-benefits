"""Plugin assembly: ``PluginSchemas``, ``Plugin``, and ``define_plugin``.

A plugin maps the schema extensions an author builds with ``schema(...)`` onto the
registered extensible schemas, keyed by registry name. Schemas a plugin does not extend
fall back to the base schema (a ``SchemaOnly``), never ``None``, so consumers get fully
typed, non-optional dot access: ``plugin.schemas.Widget``.
"""

from __future__ import annotations

from dataclasses import dataclass, field, fields
from typing import Any, Generic, TypeVar, cast

import typing_extensions as te

from ..schemas.models import GadgetCommon, WidgetCommon
from .schema import SchemaOnly, SchemaWithTransforms, schema
from .types import PluginMeta

SchemasT = TypeVar("SchemasT")

# The fallback for a schema a plugin does not extend: the base schema, no custom fields, no
# transforms. A SchemaOnly, so unextended slots have no to_common either.
DefaultWidget = SchemaOnly[WidgetCommon]
DefaultGadget = SchemaOnly[GadgetCommon]

_TWidget = te.TypeVar("_TWidget", default=DefaultWidget)
_TGadget = te.TypeVar("_TGadget", default=DefaultGadget)


@dataclass
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
        default_factory=lambda: cast(_TWidget, schema(common_schema=WidgetCommon))
    )
    Gadget: _TGadget = field(
        default_factory=lambda: cast(_TGadget, schema(common_schema=GadgetCommon))
    )


@dataclass(frozen=True)
class Plugin(Generic[SchemasT]):
    """The plugin singleton consumers import.

    ``schemas`` is a typed frozen dataclass, so ``plugin.schemas.Widget`` is fully typed.
    """

    schemas: SchemasT
    meta: PluginMeta


def define_plugin(schemas: SchemasT, *, meta: PluginMeta) -> Plugin[SchemasT]:
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
