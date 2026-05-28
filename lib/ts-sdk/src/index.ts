/**
 * @common-benefits/sdk — runtime SDK for CommonBenefits-compliant APIs.
 *
 * Public surface:
 * - `Client` + `Auth` for direct HTTP access
 * - `definePlugin` + `buildGetClient` for typed, extensible clients
 * - `withCustomFields` + `withCustomFilters` to compose extended schemas
 * - `f.*` filter helpers and `getCustomFieldValue` for ergonomic call sites
 * - `schemas` namespace for the hand-written / generated Zod schemas
 */

// HTTP client primitives
export { Client, Auth, AuthType, ApiError, ParsingError, isParsingError } from "./client";
export type {
  AuthMethod,
  ClientConfig,
  ResolvedConfig,
  GetOptions,
  PostOptions,
  FetchManyOptions,
  ParsedItem,
  ParseBatchResult,
  ParsingErrorOptions,
  Ok,
  Paginated,
  Sorted,
  Filtered,
} from "./client";
export {
  parseBatch,
  safeParseItem,
  OkSchema,
  PaginatedSchema,
  SortedSchema,
  FilteredSchema,
} from "./client";

// Extensions
export {
  definePlugin,
  buildGetClient,
  withCustomFields,
  withCustomFilters,
  mergeExtensions,
  getCustomFieldValue,
  f,
  CUSTOM_FILTER_SCHEMA_MAP,
  EXTENSIBLE_SCHEMA_MAP,
} from "./extensions";
export type {
  Plugin,
  PluginMeta,
  DefinePluginOptions,
  ResolvedPluginSchemaEntry,
  ResolvedPluginSchemas,
  BuildGetClientOptions,
  BuiltClient,
  ClientResources,
  WithCustomFieldsResult,
  WithCustomFiltersResult,
  MergeExtensionsOptions,
  MergedSchemaExtensions,
  CustomFieldExtensions,
  CustomFieldSpec,
  CustomFieldType,
  CustomFilterSpec,
  CustomFilterType,
  CustomFilterSchema,
  ExtensibleObject,
  ExtensibleSchemaName,
  HasCustomFields,
  PluginRoutes,
  PluginSchemaEntry,
  RouteMethodSpec,
  RouteMethods,
  SchemaExtensions,
} from "./extensions";

// Schemas — exposed as a namespace so callers can reach base schemas directly
export * as schemas from "./schemas";
