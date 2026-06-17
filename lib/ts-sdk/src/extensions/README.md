# Extensions

The CommonBenefits protocol defines a standard set of fields for benefits data, but agencies and systems often need to track additional information beyond that core set. **Extensions** are the mechanism for adding these agency- or system-specific fields (and filters) to CommonBenefits resources without modifying the base specification.

The extensions surface in `@common-benefits/sdk` provides TypeScript utilities for working with extensions: registering custom fields and custom filters on base schemas, bundling them into reusable plugins, and building a typed API client from a plugin.

> [!NOTE]
> The examples below use the placeholder `Widget` and `Gadget` base models that ship while the SDK is scaffolded. They stand in for the real protocol models (e.g. `Program`) until those land. The patterns are identical; only the model name and field set change.

## Table of contents <!-- omit in toc -->

- [Key concepts](#key-concepts)
- [Extending base models with custom fields](#extending-base-models-with-custom-fields)
  - [Option 1: Ad hoc with `withCustomFields()`](#option-1-ad-hoc-with-withcustomfields)
  - [Option 2: Build-time with plugins](#option-2-build-time-with-plugins)
- [Extracting custom field values](#extracting-custom-field-values)
  - [Direct dot notation](#direct-dot-notation)
  - [Using `getCustomFieldValue()`](#using-getcustomfieldvalue)
- [Plugins](#plugins)
  - [What is a plugin?](#what-is-a-plugin)
  - [Defining a plugin](#defining-a-plugin)
  - [Publishing a plugin](#publishing-a-plugin)
- [Filtering a search route](#filtering-a-search-route)
  - [Registering custom filters on a plugin](#registering-custom-filters-on-a-plugin)
  - [The `f.*` filter helpers](#the-f-filter-helpers)
- [Using plugins with the API client](#using-plugins-with-the-api-client)
- [Plugin transformations](#plugin-transformations)
  - [Declarative mappings](#declarative-mappings)
  - [Hand-written functions](#hand-written-functions)
  - [Built-in handlers and null handling](#built-in-handlers-and-null-handling)
  - [Validation and error handling](#validation-and-error-handling)
- [Best practices](#best-practices)
  - [Export value schemas alongside your plugin](#export-value-schemas-alongside-your-plugin)
  - [Use `peerDependencies` for `@common-benefits/sdk`](#use-peerdependencies-for-common-benefitssdk)
  - [Keep plugins focused](#keep-plugins-focused)
- [API reference](#api-reference)
  - [Plugin creation](#plugin-creation)
  - [Schema and filter utilities](#schema-and-filter-utilities)
  - [Transforms](#transforms)
  - [Shared types](#shared-types)

## Key concepts

Here are the key concepts used to define the custom fields, filters, and plugins that extend base schemas from the CommonBenefits protocol.

| Concept                | Description                                                                                                                                                                                                                                         |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Custom field**       | A key-value pair attached to a resource's `customFields` property. Each field has a `name`, `fieldType`, `value`, and optional `description`.                                                                                                       |
| **`CustomFieldSpec`**  | A TypeScript object that _describes_ a custom field: its `fieldType`, optional `value` (a Zod schema for validating the field's value), and optional `name` and `description`.                                                                      |
| **Custom filter**      | A typed filter the API accepts on a search route, expressed as an `{ operator, value }` literal (e.g. `{ operator: "eq", value: "red" }`).                                                                                                          |
| **`CustomFilterSpec`** | A TypeScript object that _describes_ a custom filter: its `filterType` (which drives operator and value validation), and optional `name` and `description`.                                                                                         |
| **`Plugin`**           | An object returned by `definePlugin()` with `.meta`, `.schemas` (per-model compiled output: `.commonSchema`, plus `.sourceSchema`, `.toCommon`, `.fromCommon` when transforms are configured), `.routes`, and a typed `.getClient(config)` factory. |

## Extending base models with custom fields

There are two ways to register custom fields on a base schema: at runtime (ad hoc) or at build-time (with plugins). Both produce Zod schemas with fully typed `customFields`.

### Option 1: Ad hoc with `withCustomFields()`

Use `withCustomFields()` when you want to extend a single schema directly, without creating a reusable plugin. This is useful for one-off scripts, tests, or quick prototyping.

```typescript
import { z } from "zod";
import { schemas, withCustomFields } from "@common-benefits/sdk";

// Define a Zod schema for a complex custom field value
const LegacyIdValueSchema = z.object({
  system: z.string(),
  id: z.number().int(),
});

// Extend the base schema with typed custom fields
const WidgetSchema = withCustomFields(schemas.WidgetBaseSchema, {
  legacyId: {
    fieldType: "object",
    value: LegacyIdValueSchema,
    description: "Maps to the widget_id in the legacy system",
  },
  category: {
    fieldType: "string",
    description: "Widget category",
  },
} as const);

// Parse data: customFields are now fully typed
const widget = WidgetSchema.parse(data);

widget.customFields?.legacyId?.value.id; // number
widget.customFields?.category?.value; // string
```

**Key points:**

- Pass `as const` to the specs object so TypeScript can infer literal `fieldType` values and preserve the specific keys.
- If a `value` Zod schema is provided in the spec, the custom field's `value` property is typed according to that schema. Otherwise, a default type is inferred from `fieldType` (e.g. `"string"` to `string`, `"integer"` to `number`).
- Unregistered custom fields still pass through validation but are typed as the base `CustomField` type (with `value: unknown`).

### Option 2: Build-time with plugins

Use `definePlugin()` when you want to create a **reusable, shareable** set of custom field definitions. Plugins are the recommended approach for any extensions that will be used across multiple files, projects, or teams.

```typescript
import { definePlugin } from "@common-benefits/sdk";

const legacyPlugin = definePlugin({
  meta: { name: "legacy-adapter", version: "0.1.0" },
  schemas: {
    Widget: {
      customFields: {
        legacyId: {
          fieldType: "object",
          value: LegacyIdValueSchema,
          description: "Maps to the widget_id in the legacy system",
        },
      },
    },
  },
} as const);

// The plugin exposes typed schemas for every extensible model
const widget = legacyPlugin.schemas.Widget.commonSchema.parse(data);
widget.customFields?.legacyId?.value.id; // number
```

See the [Plugins](#plugins) section below for full details on defining, composing, and publishing plugins.

## Extracting custom field values

There are two ways to access custom field values: direct dot notation and the `getCustomFieldValue()` helper.

### Direct dot notation

When data has been parsed through an extended schema (via `withCustomFields()` or a plugin), custom field values are fully typed and can be accessed directly:

```typescript
const widget = WidgetSchema.parse(data);

// Typed access, no helper needed
widget.customFields?.legacyId?.value.id; // number
widget.customFields?.category?.value; // string
```

This is the simplest approach when you have already validated the data through the extended schema.

### Using `getCustomFieldValue()`

Use `getCustomFieldValue()` when you need to validate a custom field value against a Zod schema at runtime. This is useful in three main situations:

1. **Unregistered fields**: you did not use `withCustomFields()` or a plugin to register a custom field, and want to validate its value at runtime.
2. **External data**: the data came from an external source and may not have been parsed through the extended schema.
3. **Programmatic access**: you need to access fields by variable name, such as in a loop.

The helper returns `undefined` if the key is absent (no `try`/`catch` needed) and throws a `ZodError` if the value is present but does not match the schema.

```typescript
import { getCustomFieldValue } from "@common-benefits/sdk";

const widget = WidgetSchema.parse(data);

// Returns { system: string; id: number } | undefined
const legacyId = getCustomFieldValue(widget, "legacyId", LegacyIdValueSchema);
if (legacyId) {
  console.log(legacyId.id); // typed as number
}

// Returns string | undefined
const category = getCustomFieldValue(widget, "category", z.string());

// Returns undefined, no error thrown
const missing = getCustomFieldValue(widget, "nonexistent", z.string());
```

`getCustomFieldValue()` works with both ad hoc (unregistered) and plugin-based (registered) custom fields.

## Plugins

### What is a plugin?

A plugin is the object returned by `definePlugin()`. It bundles three concerns behind one typed value:

```typescript
interface Plugin<TSchemas, TRoutes> {
  meta: PluginMeta; // name, version, optional sourceSystem
  schemas: ResolvedPluginSchemas<TSchemas>; // per-model compiled schemas + transforms
  routes: TRoutes; // per-resource route declarations (e.g. search filters)
  getClient: (config: ClientConfig) => BuiltClient<TRoutes, TSchemas>;
}
```

In practice you always create plugins with `definePlugin()`, which builds `.schemas` (including the `.commonSchema` Zod schema) from your `schemas` input and wires up a typed `getClient()` from your `routes` input automatically.

For the full interface definition, see [define-plugin.ts](./define-plugin.ts).

### Defining a plugin

```typescript
import { z } from "zod";
import { definePlugin } from "@common-benefits/sdk";

const LegacyIdValueSchema = z.object({
  system: z.string(),
  id: z.number().int(),
});

const myPlugin = definePlugin({
  meta: { name: "my-adapter", version: "0.1.0", sourceSystem: "legacy" },
  schemas: {
    Widget: {
      customFields: {
        legacyId: {
          fieldType: "object",
          value: LegacyIdValueSchema,
          description: "Maps to the widget_id in the legacy system",
        },
        category: {
          fieldType: "string",
          description: "Widget category",
        },
        priority: {
          fieldType: "integer",
          description: "Processing priority (1 = highest)",
        },
      },
    },
  },
} as const);
```

> [!IMPORTANT]
> Always pass `as const` to the options object for `definePlugin()` (and the specs object for `withCustomFields()`). Without it, TypeScript widens literal types like `"string"` to `string`, which prevents the type system from inferring the correct `value` type for each custom field.

The returned `Plugin` object has four properties:

- **`myPlugin.meta`**: the plugin identity you supplied (`name`, `version`, optional `sourceSystem`).
- **`myPlugin.schemas`**: a record of per-model compiled output, one entry per extensible model. Each entry has:
  - `.commonSchema`: the Zod schema with typed `customFields` applied (use this to parse data).
  - `.sourceSchema`, `.toCommon`, `.fromCommon`: populated when transforms are configured (see [Plugin transformations](#plugin-transformations)).
- **`myPlugin.routes`**: the route declarations you supplied (see [Filtering a search route](#filtering-a-search-route)).
- **`myPlugin.getClient(config)`**: a factory that returns a `Client` with the plugin's typed resources already attached (see [Using plugins with the API client](#using-plugins-with-the-api-client)).

### Publishing a plugin

#### Package structure

A minimal plugin package has one source file and two config files:

```
my-plugin/
  src/
    index.ts        # Plugin definition and package entry point
  tsconfig.json     # Must emit declaration files for type inference
  package.json      # Declares @common-benefits/sdk as a peer dependency
```

**`src/index.ts`** defines and exports the plugin:

```typescript
import { z } from "zod";
import { definePlugin } from "@common-benefits/sdk";

export const ProgramAreaValueSchema = z.object({
  code: z.string(),
  name: z.string(),
});

const plugin = definePlugin({
  meta: { name: "my-org-plugin", version: "1.0.0", sourceSystem: "my-org" },
  schemas: {
    Widget: {
      customFields: {
        programArea: {
          fieldType: "object",
          value: ProgramAreaValueSchema,
          description: "The program area for this widget",
        },
        cfda: {
          fieldType: "string",
          description: "CFDA number",
        },
      },
    },
  },
} as const);

export default plugin;
```

**`tsconfig.json`** must emit declaration files so consumers get type inference:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

**`package.json`**:

```json
{
  "name": "@my-org/widgets-plugin",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "peerDependencies": {
    "@common-benefits/sdk": "^0.0.1"
  },
  "devDependencies": {
    "@common-benefits/sdk": "^0.0.1",
    "typescript": "^5.0.0",
    "zod": "^4.0.0"
  }
}
```

#### Pre-publish checklist

1. **Build** the package to generate `.js` and `.d.ts` files in `dist/`.
2. **Verify type inference**: import your plugin in a test file and confirm that `.schemas` parse types resolve correctly. Hover over the types in your editor to confirm they are not `any`:

   ```typescript
   import plugin from "./";

   plugin.schemas.Widget.commonSchema.parse({} as any); // fully typed result
   ```

3. **Publish** with `npm publish` (or your preferred registry workflow).

#### Consumer usage

After installing the plugin (e.g. `npm install @my-org/widgets-plugin`):

```typescript
import plugin from "@my-org/widgets-plugin";

const widget = plugin.schemas.Widget.commonSchema.parse(data);
widget.customFields?.programArea?.value.code; // string
widget.customFields?.cfda?.value; // string
```

## Filtering a search route

A search route accepts two kinds of filters:

- **Default filters** are protocol-defined for the resource (for the `Widget` scaffold: `color` and `weight`). They are part of the spec, so you do not declare them; just pass them.
- **Custom filters** are implementation-defined. You can **register** them on the plugin for typed, per-type validation, or pass them **ad hoc** without registering anything.

The caller always passes a single flat `filters` bag to `search()`. The SDK categorizes it invisibly: keys that match the resource's default filters go to the top level of the request body's `filters`; every other key (registered or ad hoc) nests under `filters.customFilters`:

```jsonc
// search({ filters: { color: f.eq("red"), tags: f.in(["a"]), region: f.eq("us") } })
// is sent as:
{
  "filters": {
    "color": { "operator": "eq", "value": "red" }, // default → top level
    "customFilters": {
      "tags": { "operator": "in", "value": ["a"] }, // registered custom
      "region": { "operator": "eq", "value": "us" }, // ad hoc custom
    },
  },
}
```

### Registering custom filters on a plugin

Register custom filters under `routes.<resource>.search.filters`, keyed by filter name. Each spec names a `filterType` from the supported set. Registered filters get typed validation and autocomplete on `search({ filters })`:

```typescript
import { definePlugin } from "@common-benefits/sdk";

const plugin = definePlugin({
  meta: { name: "my-adapter", version: "0.1.0" },
  routes: {
    widgets: {
      search: {
        // `color`/`weight` are defaults, so they are not declared here.
        filters: {
          tags: { filterType: "stringArray" },
        },
      },
    },
  },
} as const);
```

Supported `filterType` values: `stringComparison`, `stringArray`, `numberComparison`, `numberArray`, `numberRange`, `dateComparison`, `dateRange`, `moneyComparison`, `moneyRange`. Each maps to a per-type Zod schema in [`CUSTOM_FILTER_SCHEMA_MAP`](./filter-type-map.ts).

Registering is optional. An unregistered key passed to `search({ filters })` is treated as an ad hoc custom filter, validated against the generic `{ operator, value }` schema, and nested under `customFilters` all the same. Validation per bucket: default keys against the protocol default-filters schema, registered keys against their declared type, ad hoc keys against the generic schema. Invalid filters throw before any request is sent.

> A typo'd default key (e.g. `wieght`) is not a compile error: because ad hoc keys are allowed, it silently falls through to `customFilters` and is validated only against the generic schema. This is the cost of keeping the split invisible behind one flat bag.

### The `f.*` filter helpers

A filter value is an `{ operator, value }` literal. The `f.*` helpers build those literals so call sites stay readable:

```typescript
import { f } from "@common-benefits/sdk";

f.eq("red"); // { operator: "eq", value: "red" }
f.between(1, 100); // { operator: "between", value: { min: 1, max: 100 } }
f.in(["new", "featured"]); // { operator: "in", value: ["new", "featured"] }
```

Available helpers: `eq`, `neq`, `lt`, `lte`, `gt`, `gte`, `in`, `notIn`, `like`, `notLike`, `between`, `outside`. The per-route filter schema does the runtime validation, so passing the wrong helper to a filter (e.g. `f.in(...)` to a `stringComparison` filter) is caught by Zod at call time with a clear error path.

## Using plugins with the API client

`plugin.getClient(config)` returns a `Client` whose resources are already wired to the plugin's typed schemas and filters. The resource construction is registry-driven, so a `Client` exposes every registered resource named in `routes`; there is no per-call `schema:` passthrough to remember. Items parse against the extended `commonSchema` by default, and `search({ filters })` categorizes and validates filters automatically.

```typescript
import { Auth, definePlugin, f } from "@common-benefits/sdk";

const plugin = definePlugin({
  meta: { name: "my-adapter", version: "0.1.0" },
  schemas: {
    Widget: {
      customFields: {
        legacyId: { fieldType: "integer", description: "Legacy system ID" },
        category: { fieldType: "string", description: "Widget category" },
      },
    },
  },
  routes: {
    widgets: {
      search: {
        // `color`/`weight` are default filters; `tags` is a registered custom.
        filters: {
          tags: { filterType: "stringArray" },
        },
      },
    },
  },
} as const);

const client = plugin.getClient({
  baseUrl: "https://api.example.org",
  auth: Auth.apiKey("your-api-key"),
});

// Get a single widget with typed custom fields
const widget = await client.widgets.get(widgetId);
widget.customFields?.legacyId?.value; // typed as number
widget.customFields?.category?.value; // typed as string

// Search with a single flat filter bag: defaults, a registered custom, and an
// ad hoc custom. search() splits them into the wire shape (see "Filtering a
// search route").
const results = await client.widgets.search({
  query: "blue",
  filters: {
    color: f.eq("blue"), // default → top-level filters.color
    weight: f.between(1, 100), // default → top-level filters.weight
    tags: f.in(["featured"]), // registered custom → filters.customFilters.tags
    region: f.eq("us-east"), // ad hoc custom → filters.customFilters.region
  },
});
```

`list()` and `search()` return per-record parse slots so one malformed row does not fail the whole response. Each item is either `{ ok: true, data }` (typed against the extended schema) or `{ ok: false, error, raw }`:

```typescript
for (const item of results.items) {
  if (item.ok) {
    console.log(item.data.customFields?.category?.value);
  } else {
    console.warn("parse error:", item.error.path);
  }
}
// Aggregated failures are also available on results.parseErrors
```

Each method (`get`, `list`, `search`) still accepts an optional `schema` override for a one-off call; when omitted, the schema bound at build time is used. The `filters` schema is bound at build time only.

For a complete runnable demo (offline, with a stubbed `fetch`), see [`examples/plugin-demo.ts`](../../examples/plugin-demo.ts).

## Plugin transformations

Plugins can declare bidirectional transforms that convert between a source system's native shape and the CommonBenefits protocol. `toCommon` maps `native` to common; `fromCommon` reverses it. Both directions are author-provided: the SDK does not invert one into the other, because many-to-one handlers (like `match`) are not reversible.

You author transforms entirely through `definePlugin`, one of two ways per model: declarative `mappings` (compiled for you) or hand-written `toCommon` / `fromCommon` functions. The two paths are mutually exclusive on a single entry, and both resolve to the same consumer interface:

```typescript
const result = plugin.schemas.Widget.toCommon(sourceData);
if (result.errors.length === 0) {
  use(result.result);
}
```

Each direction returns a `TransformResult<T>` of `{ result, errors }` unconditionally. Partial failures surface as `TransformError[]` rather than thrown exceptions, so consumers choose their own strict-vs-lenient rule.

### Declarative mappings

Supply a `sourceSchema` plus a `mappings` object with `toCommon` and `fromCommon` mapping dicts. A mapping is a nested object where keys are output field names and leaf nodes are either literals or handler invocations like `{ field: "dot.path" }`:

```typescript
const plugin = definePlugin({
  meta: { name: "legacy-adapter", version: "0.1.0", sourceSystem: "legacy" },
  schemas: {
    Widget: {
      customFields: { legacyId: { fieldType: "integer", value: z.number().int() } },
      sourceSchema: SourceWidgetSchema,
      mappings: {
        toCommon: {
          id: { field: "data.widget_uuid" },
          name: { field: "data.widget_name" },
          color: { field: "data.widget_color" },
          customFields: {
            legacyId: {
              value: { field: "data.legacy_id" },
              name: "legacyId",
              fieldType: "integer",
            },
          },
        },
        fromCommon: {
          data: {
            widget_uuid: { field: "id" },
            widget_name: { field: "name" },
            widget_color: { field: "color" },
            legacy_id: { field: "customFields.legacyId.value" },
          },
        },
      },
    },
  },
} as const);
```

### Hand-written functions

When a mapping is not expressive enough, supply `toCommon` / `fromCommon` functions directly (instead of `mappings`). Each returns a `TransformResult`. Use the `ToCommon` / `FromCommon` helper types to get `source` typed from your `sourceSchema` and the return checked against the resolved common type:

```typescript
import { definePlugin, type FromCommon, type ToCommon } from "@common-benefits/sdk";

type GadgetTypes = {
  model: "Gadget";
  sourceSchema: typeof SourceGadgetSchema;
  customFields: typeof gadgetCustomFields;
};

const toCommon: ToCommon<GadgetTypes> = (source) => ({
  result: { id: source.gadget_uuid, label: source.gadget_label, size: source.gadget_size },
  errors: [],
});

const fromCommon: FromCommon<GadgetTypes> = (common) => ({
  result: { gadget_uuid: common.id, gadget_label: common.label, gadget_size: common.size },
  errors: [],
});

const plugin = definePlugin({
  meta: { name: "gadget-adapter", version: "0.1.0", sourceSystem: "gadgets" },
  schemas: {
    Gadget: {
      customFields: gadgetCustomFields,
      sourceSchema: SourceGadgetSchema,
      toCommon,
      fromCommon,
    },
  },
});
```

### Built-in handlers and null handling

Mapping leaf nodes dispatch on a handler name. The built-ins are:

| Handler            | Spec shape                                      | Behavior                                                          |
| ------------------ | ----------------------------------------------- | ----------------------------------------------------------------- |
| `field`            | `{ field: "dot.notation.path" }`                | Plucks a value from the source via dot-notation.                  |
| `const`            | `{ const: <literal> }`                          | Returns the literal value, ignoring source data.                  |
| `match` / `switch` | `{ match: { field, case: { ... }, default? } }` | Case-based lookup on a source field value.                        |
| `numberToString`   | `{ numberToString: "dot.notation.path" }`       | Plucks a value and coerces it to a string via `String()`.         |
| `stringToNumber`   | `{ stringToNumber: "dot.notation.path" }`       | Plucks a value and parses it as a number (throws on non-numeric). |

The transform layer preserves the three-state contract for optional fields: **absent** (source not provided) becomes `undefined` and the output key is omitted, **`null`** (source asserts "doesn't apply") is preserved as a present `null`, and a real **value** is coerced. You can register additional handlers per model via a `handlers` map on the mapping entry; name collisions with the built-ins throw at build time. See [transformation.ts](../utils/transformation.ts) for the full handler contract and null-handling rules.

### Validation and error handling

`definePlugin` validates each direction's output for you: `toCommon` output is parsed against the extended `commonSchema`, `fromCommon` output against the `sourceSchema`. Validation failures are merged into `TransformResult.errors` rather than thrown, and the raw transformed object is still returned on `result` so callers can inspect malformed data.

`TransformError` carries structured context (`path`, `handler`, `sourceValue`, `cause`) so consumers can reason about failures programmatically.

> [!WARNING]
> The SDK does **not** redact by default. `TransformError.sourceValue` and `cause` are plain enumerable fields populated with the entire input record, and they flow through `JSON.stringify(err)`, `util.inspect(err)`, and any logger that enumerates own properties. On the validation path, `TransformError.message` is also data-bearing (Zod embeds the rejected value into the message). If your source data may contain PII, log a redacted projection instead, e.g. `{ name: err.name, message: err.message, path: err.path, handler: err.handler }`, and redact `message` alongside `sourceValue` and `cause`.

For a complete runnable round-trip across both authoring paths, see [`examples/transforms.ts`](../../examples/transforms.ts).

## Best practices

### Export value schemas alongside your plugin

When you define Zod schemas for complex `value` fields, export them as named exports from your package. Downstream consumers may need these schemas for use with utilities like `getCustomFieldValue()`:

```typescript
// index.ts of a plugin package
import { z } from "zod";
import { definePlugin } from "@common-benefits/sdk";

// Export value schemas so consumers can reference them directly
export const ProgramAreaValueSchema = z.object({
  code: z.string(),
  name: z.string(),
});

const plugin = definePlugin({
  meta: { name: "my-org-plugin", version: "1.0.0" },
  schemas: {
    Widget: {
      customFields: {
        programArea: {
          fieldType: "object",
          value: ProgramAreaValueSchema,
          description: "The program area for this widget",
        },
      },
    },
  },
} as const);

export default plugin;
```

This lets consumers use `getCustomFieldValue()` with the same schema the plugin uses for validation:

```typescript
import plugin, { ProgramAreaValueSchema } from "@my-org/widgets-plugin";
import { getCustomFieldValue } from "@common-benefits/sdk";

const widget = plugin.schemas.Widget.commonSchema.parse(data);

// Extract the value with full type safety using the exported schema
const area = getCustomFieldValue(widget, "programArea", ProgramAreaValueSchema);
area?.code; // string
```

### Use `peerDependencies` for `@common-benefits/sdk`

Declare `@common-benefits/sdk` as a `peerDependency` in your plugin's `package.json` rather than a direct `dependency`. This ensures that consumers who install multiple plugins all share a single copy of the SDK, avoiding version conflicts and duplicate type definitions. See [Publishing a plugin](#publishing-a-plugin) for a full `package.json` example.

### Keep plugins focused

A plugin should represent a single logical concern (one agency's fields, one integration's needs, or one domain concept). If you need fields from multiple concerns, declare them under a single `definePlugin({ schemas: { ... } })` call rather than splitting them across separate plugins.

## API reference

The tables below list the extension-related exports from `@common-benefits/sdk`, grouped by how they are used. Each entry links to the source definition and (where applicable) the section of this guide where it is demonstrated.

### Plugin creation

| Export                                      | Kind      | Description                                                                                                                                                       | Demonstrated in                                                         |
| ------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| [`definePlugin()`](./define-plugin.ts)      | function  | Creates a `Plugin` from `DefinePluginOptions`. Returns an object with `.meta`, `.schemas`, `.routes`, and a typed `.getClient(config)` factory.                   | [Defining a plugin](#defining-a-plugin)                                 |
| [`Plugin`](./define-plugin.ts)              | interface | The object returned by `definePlugin()`.                                                                                                                          | [What is a plugin?](#what-is-a-plugin)                                  |
| [`DefinePluginOptions`](./define-plugin.ts) | interface | Options for `definePlugin()`: `meta` (identity), `schemas` (per-model extensions and transforms), `routes` (per-resource filters), and `client` (default config). | [Defining a plugin](#defining-a-plugin)                                 |
| [`PluginMeta`](./define-plugin.ts)          | interface | Plugin identity: `name` and `version` (required), optional `sourceSystem`.                                                                                        | [Defining a plugin](#defining-a-plugin)                                 |
| [`buildGetClient()`](./build-get-client.ts) | function  | Produces the `getClient(config)` factory used by `definePlugin`. Wires each resource to its typed item schema and filters schema.                                 | [Using plugins with the API client](#using-plugins-with-the-api-client) |
| [`BuiltClient`](./build-get-client.ts)      | type      | The return type of `getClient(config)`: a `Client` intersected with its typed resources.                                                                          | [Using plugins with the API client](#using-plugins-with-the-api-client) |

### Schema and filter utilities

| Export                                                 | Kind     | Description                                                                                                                              | Demonstrated in                                                                   |
| ------------------------------------------------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| [`withCustomFields()`](./with-custom-fields.ts)        | function | Extends a single Zod object schema with typed custom fields. Unregistered fields pass through but are typed as the base `CustomField`.   | [Ad hoc with `withCustomFields()`](#option-1-ad-hoc-with-withcustomfields)        |
| [`WithCustomFieldsResult`](./with-custom-fields.ts)    | type     | The return type of `withCustomFields()`: a Zod object schema where `customFields` is replaced with a typed version.                      |                                                                                   |
| [`withCustomFilters()`](./with-custom-filters.ts)      | function | Builds a Zod schema for a route's filter bag from a `Record<string, CustomFilterSpec>`. Used by `buildGetClient()` to validate `search`. | [Filtering a search route](#filtering-a-search-route)                             |
| [`WithCustomFiltersResult`](./with-custom-filters.ts)  | type     | The return type of `withCustomFilters()`.                                                                                                |                                                                                   |
| [`f`](./filter-helpers.ts)                             | const    | Ergonomic builders for `{ operator, value }` filter literals (`f.eq`, `f.between`, `f.in`, ...).                                         | [The `f.*` filter helpers](#the-f-filter-helpers)                                 |
| [`CUSTOM_FILTER_SCHEMA_MAP`](./filter-type-map.ts)     | const    | Maps each `CustomFilterType` to its per-type Zod filter schema.                                                                          | [Registering custom filters on a plugin](#registering-custom-filters-on-a-plugin) |
| [`getCustomFieldValue()`](./get-custom-field-value.ts) | function | Safely extracts and parses a custom field value from an `ExtensibleObject`. Returns the parsed value, `undefined` if missing, or throws. | [Extracting custom field values](#extracting-custom-field-values)                 |
| [`EXTENSIBLE_SCHEMA_MAP`](./plugin-types.ts)           | const    | Maps each extensible model name to its base Zod schema. Currently `Widget` and `Gadget` (scaffolding placeholders).                      | [Key concepts](#key-concepts)                                                     |

### Transforms

| Export                                                 | Kind      | Description                                                                                                                       | Demonstrated in                                                             |
| ------------------------------------------------------ | --------- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| [`ToCommon`](./transform-helpers.ts)                   | type      | Helper type for a hand-written `toCommon`: `source` typed from `sourceSchema`, return checked against the resolved common type.   | [Hand-written functions](#hand-written-functions)                           |
| [`FromCommon`](./transform-helpers.ts)                 | type      | Helper type for a hand-written `fromCommon`: `common` typed from the resolved common type, return checked against `sourceSchema`. | [Hand-written functions](#hand-written-functions)                           |
| [`TransformTypes`](./transform-helpers.ts)             | interface | The named type argument for `ToCommon` / `FromCommon`: `{ model, sourceSchema, customFields? }`.                                  | [Hand-written functions](#hand-written-functions)                           |
| [`TransformResult`](./transform-types.ts)              | interface | Unconditional return shape `{ result, errors }` for `toCommon` / `fromCommon`.                                                    | [Plugin transformations](#plugin-transformations)                           |
| [`TransformError`](./transform-types.ts)               | class     | Structured transformation error carrying `path`, `handler`, `sourceValue`, `cause`. Extends `Error`.                              | [Validation and error handling](#validation-and-error-handling)             |
| [`transformWithMapping()`](../utils/transformation.ts) | function  | The pure, Zod-free mapping walker that compiles a declarative mapping into a transformed object.                                  | [Declarative mappings](#declarative-mappings)                               |
| [`getFromPath()`](../utils/transformation.ts)          | function  | Walks an object via dot-notation; returns `undefined` (or a provided default) when the path is missing or traverses a non-object. | [Built-in handlers and null handling](#built-in-handlers-and-null-handling) |
| [`DEFAULT_HANDLERS`](../utils/transformation.ts)       | const     | `Map<string, Handler>` of built-in handlers: `const`, `field`, `match`, `numberToString`, `stringToNumber`, `switch`.             | [Built-in handlers and null handling](#built-in-handlers-and-null-handling) |
| [`Handler`](../utils/transformation.ts)                | type      | Signature for mapping handler functions: `(data, arg) => unknown`.                                                                | [Built-in handlers and null handling](#built-in-handlers-and-null-handling) |

> `buildTransforms()` (in [build-transforms.ts](./build-transforms.ts)) compiles declarative `mappings` into raw transform callables. It is an `@internal` helper called by `definePlugin` and exported only for tests; it is not the author surface. Declare `mappings` on a `definePlugin` entry instead.

### Shared types

| Export                                      | Kind      | Description                                                                                                                          | Demonstrated in                                                                   |
| ------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| [`CustomFieldSpec`](./plugin-types.ts)      | interface | Describes a single custom field: its `fieldType`, optional `value`, and optional `name`/`description`.                               | [Key concepts](#key-concepts)                                                     |
| [`CustomFilterSpec`](./plugin-types.ts)     | interface | Describes a single custom filter: its `filterType`, and optional `name`/`description`.                                               | [Key concepts](#key-concepts)                                                     |
| [`CustomFilterType`](./plugin-types.ts)     | type      | The set of filter families adopters can attach to a search route (e.g. `stringComparison`, `numberRange`).                           | [Registering custom filters on a plugin](#registering-custom-filters-on-a-plugin) |
| [`PluginRoutes`](./plugin-types.ts)         | type      | The shape of `definePlugin`'s `routes` input: per-resource method declarations (currently `search.filters`).                         | [Registering custom filters on a plugin](#registering-custom-filters-on-a-plugin) |
| [`SchemaInput`](./plugin-types.ts)          | type      | Author-provided input per model: `customFields` alone, or with a `sourceSchema` plus either `mappings` or `toCommon` / `fromCommon`. | [Plugin transformations](#plugin-transformations)                                 |
| [`ExtensibleSchemaName`](./plugin-types.ts) | type      | Union of model names that support extensions. Currently `"Widget" \| "Gadget"`.                                                      |                                                                                   |
| [`HasCustomFields`](./plugin-types.ts)      | type      | A Zod object schema whose shape includes a `customFields` property. Constrains `withCustomFields()` inputs at compile time.          |                                                                                   |
| [`ExtensibleObject`](./plugin-types.ts)     | interface | An object with an optional `customFields` property. Constrains `getCustomFieldValue()` inputs at compile time.                       |                                                                                   |
