# Extensions

The extension framework: typed custom fields, declarative or hand-written transforms, plugins,
and per-route filter registration. No codegen build step.

The examples use the placeholder `Widget` / `Gadget` base models that ship while the SDK is
scaffolded; they stand in for real protocol models (e.g. `Program`) until those land.

## Table of contents <!-- omit in toc -->

- [Module layout](#module-layout)
- [Key concepts](#key-concepts)
- [Custom fields](#custom-fields)
- [Transforms](#transforms)
- [Plugins](#plugins)
- [Registering route filters](#registering-route-filters)
- [API reference](#api-reference)

## Module layout

Organized by concern (mirroring the Python SDK's extension modules). Each concern's `index.ts`
is its public surface; internal machinery lives in `helpers.ts` / `builder.ts` / `types.ts`:

| Module                         | Public surface                                                                   | Internal                                             |
| ------------------------------ | -------------------------------------------------------------------------------- | ---------------------------------------------------- |
| [`plugin/`](./plugin)          | `definePlugin`, `Plugin`, `PluginMeta`                                           | `buildGetClient`, `BuiltClient`, resolution types    |
| [`schemas/`](./schemas)        | `withCustomFields`, `SchemaWithTransforms` / `SchemaOnly`, `getCustomFieldValue` | `HasCustomFields`, the inference utilities           |
| [`routes/`](./routes)          | `withCustomFilters`, `f`, route declaration types                                | `CUSTOM_FILTER_SCHEMA_MAP`, the filter projection    |
| [`transforms/`](./transforms)  | `buildTransforms`, `TransformError`, `ToCommon` / `FromCommon`                   | the mapping compiler internals                       |
| [`registry.ts`](./registry.ts) | —                                                                                | `EXTENSIBLE_SCHEMA_MAP` (the extensible-schema seam) |

## Key concepts

- **`withCustomFields` derives a typed schema from specs.** A custom field's `value` type is
  inferred from the spec's Zod schema (or its `fieldType`), so registered fields get typed
  values and unregistered fields fall back to the base `CustomField`.
- **Common models are Zod schemas.** Extending one yields another Zod schema, so it composes
  with the response envelopes with no codegen.
- **`definePlugin(...)` is the author surface.** It assembles per-model extensions (custom
  fields + optional transforms) and per-route filters into a typed `Plugin` whose
  `getClient(config)` returns a fully typed client.
- **The registries are the seam.** `EXTENSIBLE_SCHEMA_MAP` (extensions) and `RESOURCE_REGISTRY`
  (client) are the single sources of truth for what models/resources exist; their key types are
  derived via `keyof typeof`, so they can't drift.

## Custom fields

Declare specs keyed by field name; `value` is a Zod schema for the field's value:

```ts
const widgetFields = {
  legacyId: { fieldType: "object", value: z.object({ system: z.string(), id: z.number() }) },
  category: { fieldType: "string" },
} as const;
```

A consumer reads them with full typing: `widget.customFields?.legacyId?.value.id` is `number`.
`getCustomFieldValue(item, key, schema)` parses a value defensively (returns `undefined` when
absent, throws on a mismatch).

## Transforms

A plugin entry can map a source-system model to the common model two ways.

**Declarative mappings** (compiled by `buildTransforms`), using the handler set `field`,
`const`, `match` / `switch`, `numberToString`, `stringToNumber` (custom handlers via the
`handlers` option):

```ts
definePlugin({
  schemas: {
    Widget: {
      sourceSchema: SourceWidget,
      mappings: {
        toCommon: { id: { field: "widget_id" }, color: { field: "colour" } },
        fromCommon: { widget_id: { field: "id" }, colour: { field: "color" } },
      },
    },
  },
  meta,
});
```

**Hand-written functions**, typed with the `ToCommon` / `FromCommon` helpers so `source` is
inferred and the return is checked against the resolved common type:

```ts
const toCommon: ToCommon<{
  model: "Widget";
  sourceSchema: typeof SourceWidget;
  customFields: typeof widgetFields;
}> = (src) => ({ result: { id: src.widget_id /* ... */ }, errors: [] });
```

Both directions return a `TransformResult` (`{ result, errors }`); failures aggregate into
`errors` rather than throwing, so callers apply their own strict-vs-lenient rule.

## Plugins

`definePlugin` assembles extensions (keyed by registered schema name) into a typed `Plugin`.
Schemas you omit fall back to a `SchemaOnly` over the base model, never `null`:

```ts
const plugin = definePlugin({
  schemas: { Widget: { customFields: widgetFields } },
  meta: { name: "acme", version: "0.1.0", sourceSystem: "acme-widgets" },
});

plugin.schemas.Widget; // the extension you passed (fully typed)
plugin.schemas.Gadget; // SchemaOnly over the base Gadget
```

`plugin.getClient(config)` builds a typed client (see the [client guide](../client/README.md)).

## Registering route filters

A plugin registers the custom filters a search route accepts by naming each filter's family.
Registered keys then autocomplete on `client.widgets.search({ filters })`; unregistered keys
still pass through to `customFilters`:

```ts
const plugin = definePlugin({
  schemas: { Widget: { customFields: widgetFields } },
  routes: { widgets: { search: { filters: { region: { filterType: "stringArray" } } } } },
  meta,
});
```

The set of filter families is the `routes` registry (`routes/helpers.ts`); `withCustomFilters`
builds the runtime Zod schema for a route's filter bag from these specs.

## API reference

| Symbol                                   | Description                                                                    |
| ---------------------------------------- | ------------------------------------------------------------------------------ |
| `definePlugin(options)`                  | Assemble a typed `Plugin` from schema extensions, route filters, and metadata. |
| `Plugin` / `PluginMeta`                  | The plugin object and its identity metadata.                                   |
| `withCustomFields(schema, specs)`        | Extend a base Zod schema with typed `customFields`.                            |
| `SchemaWithTransforms` / `SchemaOnly`    | The resolved per-model entry shapes on `plugin.schemas.*`.                     |
| `getCustomFieldValue(item, key, schema)` | Defensively read + parse a custom-field value off a returned item.             |
| `withCustomFilters(specs)`               | Build a route's filter-bag Zod schema from `CustomFilterSpec`s.                |
| `f`                                      | Filter value builders (`f.eq`, `f.between`, `f.in`, ...).                      |
| `PluginRoutes` / `RouteMethods`          | The `routes` declaration types (`satisfies PluginRoutes`).                     |
| `buildTransforms(options)`               | Compile declarative mappings into transform callables (with custom handlers).  |
| `TransformResult` / `TransformError`     | The `(result, errors)` transform contract and its structured error.            |
| `ToCommon` / `FromCommon` / `CommonOf`   | Author helper types for hand-written transforms.                               |
| `CustomFieldSpec` / `CustomFilterSpec`   | The per-field / per-filter declarations an author writes.                      |
