/**
 * Extensions module entry point.
 *
 * Public API:
 * - `definePlugin()` / `Plugin`
 * - `buildGetClient()` / `BuiltClient`
 * - `withCustomFields()` / `withCustomFilters()`
 * - `mergeExtensions()`
 * - `getCustomFieldValue()`
 * - `f` filter helpers
 */

export { definePlugin } from "./define-plugin";
export type {
  DefinePluginOptions,
  Plugin,
  PluginMeta,
  ResolvedPluginSchemaEntry,
  ResolvedPluginSchemas,
} from "./define-plugin";

export { buildGetClient } from "./build-get-client";
export type { BuildGetClientOptions, BuiltClient, ClientResources } from "./build-get-client";

export { withCustomFields } from "./with-custom-fields";
export type { WithCustomFieldsResult } from "./with-custom-fields";

export { withCustomFilters } from "./with-custom-filters";
export type { WithCustomFiltersResult } from "./with-custom-filters";

export { mergeExtensions } from "./merge-extensions";
export type { MergeExtensionsOptions, MergedSchemaExtensions } from "./merge-extensions";

export { getCustomFieldValue } from "./get-custom-field-value";

export { f } from "./filter-helpers";

export { CUSTOM_FILTER_SCHEMA_MAP, type CustomFilterSchema } from "./filter-type-map";

export { EXTENSIBLE_SCHEMA_MAP } from "./plugin-types";
export type {
  CustomFieldExtensions,
  CustomFieldSpec,
  CustomFieldType,
  CustomFilterSpec,
  CustomFilterType,
  ExtensibleObject,
  ExtensibleSchemaName,
  HasCustomFields,
  PluginRoutes,
  PluginSchemaEntry,
  RouteMethodSpec,
  RouteMethods,
  SchemaExtensions,
} from "./plugin-types";
