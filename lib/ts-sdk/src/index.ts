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
  CommonBenefitsClient,
  ResourceSlots,
  ResourceTypeMap,
  ResourceTypes,
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

// Extensions (public author/consumer API; internal machinery is reachable from
// the concern sub-modules directly, not re-exported here)
export {
  definePlugin,
  withCustomFields,
  withCustomFilters,
  getCustomFieldValue,
  buildTransforms,
  TransformError,
  f,
} from "./extensions";
export type {
  Plugin,
  PluginMeta,
  DefinePluginOptions,
  SchemaOnly,
  SchemaWithTransforms,
  SchemaWithCustomFields,
  TransformResult,
  CommonOf,
  FromCommon,
  ToCommon,
  TransformTypes,
  BuildTransformsOptions,
  RawTransforms,
  WithCustomFiltersResult,
  CustomFieldSpec,
  CustomFilterSpec,
  FunctionsSchemaInput,
  MappingsSchemaInput,
  PluginRoutes,
  RouteMethodSpec,
  RouteMethods,
  SchemaExtensions,
  SchemaInput,
  SchemaMappings,
  SchemaOnlyInput,
} from "./extensions";

// Pure mapping runtime (Zod-free)
export { transformWithMapping, getFromPath, DEFAULT_HANDLERS } from "./utils";
export type { Handler, JsonValue, TransformWithMappingOptions } from "./utils";

// Schemas — exposed as a namespace so callers can reach base schemas directly
export * as schemas from "./schemas";
