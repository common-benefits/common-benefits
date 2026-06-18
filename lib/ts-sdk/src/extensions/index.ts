/**
 * Extensions module entry point.
 *
 * Public API:
 * - `definePlugin()` / `Plugin`
 * - `buildGetClient()` / `BuiltClient`
 * - `withCustomFields()` / `withCustomFilters()`
 * - `getCustomFieldValue()`
 * - `f` filter helpers
 */

export { definePlugin } from "./define-plugin";
export type {
  DefinePluginOptions,
  Plugin,
  PluginMeta,
  ResolvedPluginSchemas,
  SchemaOnly,
  SchemaWithTransforms,
} from "./define-plugin";

// Transform layer
export { TransformError } from "./transform-types";
export type { TransformResult } from "./transform-types";
export type { CommonOf, FromCommon, ToCommon, TransformTypes } from "./transform-helpers";
// `buildTransforms` is `@internal` — exported for tests only, not part of the
// public README surface.
export { buildTransforms } from "./build-transforms";
export type { BuildTransformsOptions, RawTransforms } from "./build-transforms";

export { buildGetClient } from "./build-get-client";
export type { BuildGetClientOptions, BuiltClient } from "./build-get-client";

export { withCustomFields } from "./with-custom-fields";
export type { WithCustomFieldsResult } from "./with-custom-fields";

export { withCustomFilters } from "./with-custom-filters";
export type { WithCustomFiltersResult } from "./with-custom-filters";

export { getCustomFieldValue } from "./get-custom-field-value";

export { f } from "./filter-helpers";

export { CUSTOM_FILTER_SCHEMA_MAP, type CustomFilterSchema } from "./filter-type-map";

export { EXTENSIBLE_SCHEMA_MAP } from "./plugin-types";
export type {
  CustomFieldSpec,
  CustomFieldType,
  CustomFilterSpec,
  CustomFilterType,
  ExtensibleObject,
  ExtensibleSchemaName,
  FunctionsSchemaInput,
  HasCustomFields,
  MappingsSchemaInput,
  PluginRoutes,
  RouteMethodSpec,
  RouteMethods,
  SchemaExtensions,
  SchemaInput,
  SchemaMappings,
  SchemaOnlyInput,
} from "./plugin-types";
