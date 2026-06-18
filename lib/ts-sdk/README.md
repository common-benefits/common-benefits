# @common-benefits/sdk

A typed TypeScript SDK for CommonBenefits-compliant APIs: a low-level HTTP client, hand-written
Zod schemas for the protocol, and an extension framework (custom fields, transforms, plugins,
custom filters) that produces a fully typed client with no codegen build step.

While the SDK is scaffolded it ships placeholder `Widget` / `Gadget` models that stand in for
real protocol models (e.g. `Program`); the patterns are identical.

## Table of contents <!-- omit in toc -->

- [Installation](#installation)
- [Quick start](#quick-start)
- [Kitchen sink](#kitchen-sink)
- [Modules](#modules)
- [Development](#development)

## Installation

Part of the CommonBenefits workspace; install from the repo root with `pnpm install`. Within
the workspace, depend on it as `@common-benefits/sdk`.

## Quick start

Use the `Client` directly for untyped HTTP, or a plugin for a typed client:

```ts
import { Client, Auth, definePlugin } from "@common-benefits/sdk";

// Low-level client:
const client = new Client({ baseUrl: "https://api.example.org", auth: Auth.bearer("jwt") });

// Typed client from a plugin:
const plugin = definePlugin({ meta: { name: "demo", version: "0.1.0" } });
const typed = plugin.getClient({ baseUrl: "https://api.example.org" });
const result = await typed.widgets.search({ filters: { color: { operator: "eq", value: "red" } } });
for (const row of result.items) {
  if (row.ok) console.log(row.data.name);
}
```

## Kitchen sink

Custom fields, registered filters, and a typed search — end to end:

```ts
import { definePlugin, f } from "@common-benefits/sdk";
import { z } from "zod";

const plugin = definePlugin({
  meta: { name: "acme", version: "0.1.0", sourceSystem: "acme-widgets" },
  schemas: {
    Widget: {
      customFields: {
        legacyId: { fieldType: "object", value: z.object({ system: z.string(), id: z.number() }) },
      },
    },
  },
  routes: { widgets: { search: { filters: { region: { filterType: "stringArray" } } } } },
});

const client = plugin.getClient({ baseUrl: "https://api.example.org" });
const result = await client.widgets.search({
  filters: {
    color: f.eq("red"), // standard filter -> top level
    region: f.in(["PA", "NJ"]), // registered custom filter -> customFilters
  },
});

for (const row of result.items) {
  if (row.ok) {
    // typed custom field: row.data.customFields?.legacyId?.value.id is number
  }
}
```

## Modules

| Module                                      | What it provides                                                                 |
| ------------------------------------------- | -------------------------------------------------------------------------------- |
| [`client/`](./src/client/README.md)         | The HTTP `Client`, `Auth`, response envelopes, per-row parse results, resources. |
| [`schemas/`](./src/schemas/README.md)       | Hand-written Zod schemas: fields, filters, the placeholder `Widget` / `Gadget`.  |
| [`extensions/`](./src/extensions/README.md) | Custom fields, transforms, plugins, and per-route filter registration.           |
| [`examples/`](./examples/README.md)         | Runnable, offline examples of the plugin + transform surfaces.                   |

## Development

```sh
pnpm run ci          # check:lint + check:format + check:types + build + typespec + test
pnpm run check:types # tsc --noEmit (also validates the type-level test gates)
pnpm run test        # vitest
pnpm run format      # prettier --write + tsp format
```
