/**
 * Canonical resource → schema map.
 *
 * `buildGetClient()` reads this to decide which Zod schema to attach to each
 * resource method. New resources register here. Name-based inference
 * (e.g. `widgets → Widget`) is intentionally rejected — too magical and brittle
 * when protocol model names change without their route names changing.
 */

import type { ExtensibleSchemaName } from "../../extensions/plugin-types";

/** Names of resource methods that can be bound to a Zod schema. */
export type ResourceMethod = "get" | "list" | "search";

/** Map of `resource → method → schema name`. */
export const RESOURCE_SCHEMA_MAP = {
  widgets: { get: "Widget", list: "Widget", search: "Widget" },
} as const satisfies Record<string, Partial<Record<ResourceMethod, ExtensibleSchemaName>>>;

export type ResourceName = keyof typeof RESOURCE_SCHEMA_MAP;
