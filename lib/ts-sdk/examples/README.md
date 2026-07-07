# Examples

Runnable, offline examples, one file per scenario. Each file has an **Author** section (build
the plugin) and a **Consumer** section (use it); the custom-filters scenario stubs
`globalThis.fetch`, so no network or running API is needed.

## Running

```sh
pnpm install

# from lib/ts-sdk:
pnpm run examples                              # run every scenario in order
pnpm dlx tsx examples/custom-filters.ts        # run one scenario
```

## Scenarios

| #   | File                                                         | Author shows                            | Consumer shows                                                                                          |
| --- | ------------------------------------------------------------ | --------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 1   | [`custom-fields.ts`](./custom-fields.ts)                     | custom fields only, no transforms       | parse a record, typed custom-field access                                                               |
| 2   | [`custom-fields-mappings.ts`](./custom-fields-mappings.ts)   | custom fields + declarative mappings    | `toCommon` / `fromCommon`, typed field, round-trip                                                      |
| 3   | [`custom-fields-functions.ts`](./custom-fields-functions.ts) | custom fields + hand-written transforms | hand-written `toCommon` / `fromCommon`, round-trip                                                      |
| 4   | [`mappings-only.ts`](./mappings-only.ts)                     | declarative mappings, no custom fields  | mapped base fields                                                                                      |
| 5   | [`custom-filters.ts`](./custom-filters.ts)                   | register a custom filter on a route     | typed `client.widgets.search(...)`: standard key top-level, registered + ad hoc keys to `customFilters` |

[`source.ts`](./source.ts) holds the shared sample source-system schemas (`SourceWidgetSchema`,
`SourceGadgetSchema`) and the typed custom-field specs (`widgetCustomFields`, `gadgetCustomFields`).

The same flows are covered by the test suite (`__tests__/`); run `pnpm run test`, or
`pnpm run ci` to also run lint, format, types, and build.
