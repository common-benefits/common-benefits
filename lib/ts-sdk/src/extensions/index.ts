/**
 * Extensions module entry point.
 *
 * Organized by concern (mirroring the Python SDK's extension modules), each
 * concern splitting exported API (`index`) from type machinery (`types`) and
 * runtime construction (`builder`):
 * - `plugin/`     — `definePlugin`, `Plugin`, `getClient` / `buildGetClient`
 * - `schemas/`    — `withCustomFields`, `SchemaWithTransforms` / `SchemaOnly`,
 *                   `EXTENSIBLE_SCHEMA_MAP`, `getCustomFieldValue`
 * - `routes/`     — `withCustomFilters`, `f`, the filter map + registration types
 * - `transforms/` — `buildTransforms`, `TransformError`, author helper types
 * - `specs.ts`    — `CustomFieldSpec` / `CustomFilterSpec`
 * - `types.ts`    — shared vocabulary (`ExtensibleSchemaName`, field/filter tags)
 */

// plugin
export { definePlugin, buildGetClient } from "./plugin";
export type {
  Plugin,
  PluginMeta,
  DefinePluginOptions,
  ResolvedPluginSchemas,
  BuildGetClientOptions,
  BuiltClient,
} from "./plugin";

// schemas
export { withCustomFields, getCustomFieldValue, EXTENSIBLE_SCHEMA_MAP } from "./schemas";
export type {
  SchemaWithTransforms,
  SchemaOnly,
  SchemaWithCustomFields,
  HasCustomFields,
  SchemaExtensions,
  SchemaInput,
  SchemaMappings,
  MappingsSchemaInput,
  FunctionsSchemaInput,
  SchemaOnlyInput,
} from "./schemas";

// routes
export { withCustomFilters, f, CUSTOM_FILTER_SCHEMA_MAP } from "./routes";
export type {
  WithCustomFiltersResult,
  CustomFilterSchema,
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

// specs + shared types
export type { CustomFieldSpec, CustomFilterSpec } from "./specs";
export type {
  CustomFieldType,
  CustomFilterType,
  ExtensibleObject,
  ExtensibleSchemaName,
} from "./types";
