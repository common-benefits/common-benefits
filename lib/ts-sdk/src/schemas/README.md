# Schemas

Hand-written Zod schemas for the CommonBenefits protocol: scalar types, field-level types, the
filter value schemas, and the placeholder extensible models. These are the source of truth until
codegen from TypeSpec lands (it emits into `src/generated/`).

## Table of contents <!-- omit in toc -->

- [Scalars and fields](#scalars-and-fields)
- [Extensible models](#extensible-models)
- [Filters](#filters)
- [API reference](#api-reference)

## Scalars and fields

`types.ts` holds protocol scalar schemas (UUID, decimal string, UTC datetime, ISO date/time).
`fields.ts` holds the field-level types: `MoneySchema`, `SystemMetadataSchema`, and
`CustomFieldSchema` (`{ name, fieldType, schema?, value, description? }`) with its
`CustomFieldTypeEnum` (`string` / `number` / `integer` / `boolean` / `object` / `array`).

## Extensible models

`WidgetBaseSchema` and `GadgetBaseSchema` are placeholder extensible models (they stand in for
real protocol models such as `Program`). Each carries a few base fields plus a `customFields`
slot that `withCustomFields()` replaces with a typed version. The canonical shapes are:

- **Widget** — `id`, `name`, `color`, `weight`, `customFields`. Standard search filters:
  `color` (string comparison), `weight` (number range).
- **Gadget** — `id`, `label`, `size`, `customFields`. Standard search filters: `size` (number
  comparison); plus a `history` verb with an `actor` (string comparison) filter.

(These match the Python SDK and the shared contract fixtures under `lib/sdk-contract/`.)

## Filters

Each filter family has a per-type Zod schema mirroring the protocol's filter shapes:
`StringComparisonFilterSchema`, `StringArrayFilterSchema`, `NumberComparisonFilterSchema`,
`NumberArrayFilterSchema`, `NumberRangeFilterSchema`, `DateComparisonFilterSchema`,
`DateRangeFilterSchema`, `MoneyComparisonFilterSchema`, `MoneyRangeFilterSchema`, plus the
generic `DefaultFilterSchema`. The `extensions/routes` registry maps each `CustomFilterType` to
one of these.

Build filter values ergonomically with `f.*` (from `extensions`) rather than object literals:

```ts
import { f } from "@common-benefits/sdk";

f.eq("red"); // { operator: "eq", value: "red" }
f.between(1, 100); // { operator: "between", value: { min: 1, max: 100 } }
f.in(["a", "b"]); // { operator: "in", value: ["a", "b"] }
```

## API reference

| Symbol                                                                                     | Description                                                 |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| `CustomFieldSchema` / `CustomFieldTypeEnum`                                                | The custom-field value schema and its JSON-schema type tag. |
| `MoneySchema` / `SystemMetadataSchema`                                                     | Field-level protocol types.                                 |
| `WidgetBaseSchema` / `GadgetBaseSchema`                                                    | Placeholder extensible models.                              |
| `WidgetDefaultFiltersSchema` / `GadgetDefaultFiltersSchema` / `GadgetHistoryFiltersSchema` | Standard (protocol) filters per route.                      |
| `*FilterSchema` / `DefaultFilterSchema`                                                    | Per-family filter value schemas + the generic fallback.     |
| scalar schemas (`UuidSchema`, `UTCDateTimeSchema`, …)                                      | Protocol scalar types in `types.ts`.                        |
