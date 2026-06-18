# Extensions

The extension framework: typed custom fields, declarative or hand-written transforms,
plugins, and per-route filter registration. No codegen build step.

## Table of contents <!-- omit in toc -->

- [Key concepts](#key-concepts)
- [Custom fields](#custom-fields)
- [Transforms](#transforms)
- [Plugins](#plugins)
- [Registering route filters](#registering-route-filters)
- [API reference](#api-reference)

## Key concepts

- **`CustomField[V]` is the single source of truth.** A custom field's `field_type` and its
  inspectable value type are *derived* from the static type `V`, so they cannot drift.
- **Common models are generics.** `WidgetCommon[WidgetFields]` is a fully concrete type the
  checker understands with no codegen; consumers get concrete, non-optional types.
- **`schema(...)` is the only way to build an extension.** Its overloads enforce, statically:
  mappings XOR hand-written transforms, a source schema when transforms are present, and no
  transforms on a schema-only entry.
- **Everything is camelCase on the wire, snake_case in code** (via `CommonBenefitsBaseModel`).

## Custom fields

Declare a `CustomFieldSet` subclass; each field is an `Optional[CustomField[V]]`:

```python
from typing import Optional
from pydantic import Field
from common_benefits_sdk.extensions import CustomField, CustomFieldSet


class WidgetFields(CustomFieldSet):
    category: Optional[CustomField[str]] = Field(default=None, description="Category")
    legacy_id: Optional[CustomField[int]] = Field(default=None, description="Legacy id")
```

A consumer reads them with full typing: `widget.custom_fields.category.value` is `str`. The
resolved specs are exposed for inspection on `extension.custom_fields` (a
`dict[str, PluginCustomFieldSpec]`), with `field_type` and value type derived from `V`.

## Transforms

A `schema(...)` extension can map a source-system model to the common model two ways.

**Declarative mappings** (compiled by `build_transforms`), using the handler set `field`,
`const`, `match`/`switch`, `numberToString`, `stringToNumber`:

```python
ext = schema(
    source_schema=SourceWidget,
    common_schema=WidgetCommon[WidgetFields],
    mappings={
        "to_common": {"id": {"field": "widget_id"}, "color": {"field": "colour"}},
        "from_common": {"widget_id": {"field": "id"}, "colour": {"field": "color"}},
    },
)
```

**Hand-written functions**, returning a `TransformResult` (use `validate_into`):

```python
def to_common(src: SourceWidget) -> TransformResult[WidgetCommon[WidgetFields]]:
    return validate_into(WidgetCommon[WidgetFields], {"id": src.widget_id, ...})

ext = schema(source_schema=SourceWidget, common_schema=WidgetCommon[WidgetFields],
             to_common=to_common, from_common=from_common)
```

`TransformResult` always returns `(result, errors)`; failures are aggregated into `errors`
(never raised), so callers apply their own strict-vs-lenient rule.

## Plugins

`define_plugin` assembles extensions (keyed by registered schema name) into a typed `Plugin`.
Schemas you omit fall back to a `SchemaOnly` over the base model, never `None`:

```python
plugin = define_plugin(
    PluginSchemas(Widget=ext),
    meta=PluginMeta(name="acme", source_system="acme-widgets"),
)

plugin.schemas.Widget        # the extension you passed (fully typed)
plugin.schemas.Gadget        # SchemaOnly[GadgetCommon] (fallback)
plugin.schemas.Widget.to_common(source)   # typed transform, when the extension has one
```

`plugin.get_client(config)` builds a typed client (see the [Client guide](../client/README.md)).

## Registering route filters

A plugin can register the custom filters a search route accepts by extending the resource's
standard filters TypedDict and naming it via the route carriers. Registered keys then
autocomplete on `client.widgets.search(filters=...)`:

```python
from common_benefits_sdk.extensions import ResourceRoutes, RouteFilters, Routes
from common_benefits_sdk.schemas.filters import StringArray, WidgetFilters


class WidgetSearchFilters(WidgetFilters, total=False):
    region: StringArray


plugin = define_plugin(
    PluginSchemas(Widget=ext),
    routes=Routes(widget=ResourceRoutes(search=RouteFilters[WidgetSearchFilters]())),
    meta=PluginMeta(name="acme", source_system="acme-widgets"),
)
```

`RouteFilters[TF]` is a phantom carrier: it exists only so `get_client` can project the
TypedDict onto the typed `search`. See [Design notes](../../../README.md#design-notes) for why
route registration is static-only.

## API reference

| Symbol | Description |
| ------ | ----------- |
| `schema(...)` | Build a `SchemaWithTransforms` or `SchemaOnly` extension (overloaded). |
| `define_plugin(schemas, *, routes=Routes(), meta)` | Assemble a typed `Plugin`. |
| `PluginSchemas` / `Plugin` | Frozen, covariant slot carriers (Widget / Gadget). |
| `Routes` / `ResourceRoutes` / `RouteFilters` | Per-resource, per-method filter registration carriers. |
| `CustomField[V]` / `CustomFieldSet` | Typed custom-field primitives. |
| `build_transforms(...)` | Compile declarative mappings into transform callables. |
| `validate_into(model, data)` | Validate into a model, routing failures to `TransformResult.errors`. |
| `TransformResult` / `TransformError` | Unconditional `(result, errors)` transform shape. |
| `PluginMeta` | Plugin identity (`name`, `source_system`, ...). |
| `PluginDefinitionError` | Raised at definition time with all problems aggregated. |
| `EXTENSIBLE_SCHEMA_MAP` | The closed registry of extensible models. |
