/**
 * Client layer entry point.
 *
 * Re-exports the HTTP client, auth, config, response envelopes, error types,
 * per-record parse helpers, and the dummy `Widgets` resource.
 */

export { Client } from "./client";
export type { FetchManyOptions, GetOptions, PostOptions } from "./client";
export { Auth, AuthType, buildAuthHeaders } from "./auth";
export type { AuthMethod } from "./auth";
export { resolveConfig } from "./config";
export type { ClientConfig, ResolvedConfig } from "./config";
export { ApiError, ParsingError, isParsingError } from "./errors";
export type { ParsingErrorOptions } from "./errors";
export { parseBatch, safeParseItem } from "./results";
export type { ParsedItem, ParseBatchResult } from "./results";
export {
  OkSchema,
  PaginatedSchema,
  SortedSchema,
  FilteredSchema,
  SuccessSchema,
  ErrorSchema,
  PaginatedResultsInfoSchema,
  SortedResultsInfoSchema,
  PaginatedBodyParamsSchema,
  SortOrderEnum,
} from "./responses";
export type {
  Ok,
  Paginated,
  Sorted,
  Filtered,
  Success,
  ErrorResponse,
  PaginatedResultsInfo,
  SortedResultsInfo,
  PaginatedBodyParams,
} from "./responses";
export { Widgets, RESOURCE_REGISTRY } from "./resources";
export type {
  ResourceOptions,
  ResourceConstructor,
  ListOptions,
  SearchOptions,
  WidgetsListResult,
  WidgetsSearchResult,
  ResourceMethod,
  ResourceName,
  ResourceRegistryEntry,
} from "./resources";
