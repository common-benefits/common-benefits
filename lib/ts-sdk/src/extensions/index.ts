/**
 * Extensions module entry point — the public author/consumer API.
 *
 * Organized by concern (mirroring the Python SDK's extension modules). Each
 * concern's `index.ts` is its public surface; internal machinery lives in that
 * concern's `helpers.ts` / `builder.ts` / `types.ts` and is intentionally NOT
 * re-exported here (reachable directly for advanced use and tests):
 * - `plugin/`     — `definePlugin`, `Plugin` (internal: `buildGetClient`, `BuiltClient`)
 * - `schemas/`    — `withCustomFields`, `SchemaWithTransforms` / `SchemaOnly`,
 *                   `getCustomFieldValue` (internal: `EXTENSIBLE_SCHEMA_MAP`, `HasCustomFields`)
 * - `routes/`     — `withCustomFilters`, `f` (internal: `CUSTOM_FILTER_SCHEMA_MAP`, the projection types)
 * - `transforms/` — `TransformError`, `buildTransforms`, author helper types
 */

// plugin
export { definePlugin } from "./plugin";
export type { Plugin, PluginMeta, DefinePluginOptions } from "./plugin";

// schemas
export { withCustomFields, getCustomFieldValue } from "./schemas";
export type {
  CustomFieldSpec,
  SchemaWithTransforms,
  SchemaOnly,
  SchemaWithCustomFields,
  SchemaExtensions,
  SchemaInput,
  SchemaMappings,
  MappingsSchemaInput,
  FunctionsSchemaInput,
  SchemaOnlyInput,
} from "./schemas";

// routes
export { withCustomFilters, f } from "./routes";
export type {
  CustomFilterSpec,
  WithCustomFiltersResult,
  PluginRoutes,
  RouteMethods,
  RouteMethodSpec,
} from "./routes";

// transforms
export { TransformError, buildTransforms } from "./transforms";
export type {
  TransformResult,
  TransformTypes,
  CommonOf,
  ToCommon,
  FromCommon,
  BuildTransformsOptions,
  RawTransforms,
} from "./transforms";
