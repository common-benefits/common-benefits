/**
 * Canonical resource registry.
 *
 * `buildGetClient()` reads this to construct each resource generically: one
 * entry names the resource class (`resourceClass`), the extensible model whose resolved
 * schema parses each method's items (`schemas`, per method so a `get` can return
 * a richer shape than a `list`), and the default-filters set for its search
 * route (`defaultFilters`). Schema fields are *names* resolved through the
 * canonical maps (the plugin's resolved schemas, rooted in
 * `EXTENSIBLE_SCHEMA_MAP`, and `DEFAULT_FILTERS_MAP`) rather than embedded schema
 * values, so there is a single source of truth per schema.
 *
 * Adding a resource is a registry entry plus one line in `build-get-client.ts`'s
 * type map — no bespoke builder. Name-based inference (e.g. `widgets → Widget`)
 * is intentionally rejected: too magical and brittle when protocol model names
 * change without their route names changing.
 */

import type { z } from "zod";
import type { ExtensibleSchemaName } from "../../extensions/registry";
import { WidgetDefaultFiltersSchema } from "../../schemas/widget";
import { GadgetDefaultFiltersSchema } from "../../schemas/gadget";
import type { ResourceConstructor, ResourceMethod } from "./base";
import { Widgets } from "./widgets";
import { Gadgets } from "./gadgets";

export type { ResourceMethod } from "./base";

/**
 * Default-filters sets, keyed by name. The registry's `defaultFilters` field
 * indexes into this map (mirrors how item schemas resolve through
 * `EXTENSIBLE_SCHEMA_MAP`).
 */
export const DEFAULT_FILTERS_MAP = {
  Widget: WidgetDefaultFiltersSchema,
  Gadget: GadgetDefaultFiltersSchema,
} as const satisfies Record<string, z.ZodTypeAny>;

/** Name of a registered default-filters set. */
export type DefaultFiltersName = keyof typeof DEFAULT_FILTERS_MAP;

/** One registry entry per resource. */
export interface ResourceRegistryEntry {
  /** Resource class constructor (accepts the shared `ResourceOptions` bag). */
  resourceClass: ResourceConstructor;
  /**
   * Per-method extensible model name. Resolved to a schema via the plugin's
   * resolved schemas (rooted in `EXTENSIBLE_SCHEMA_MAP`), so a method can bind a
   * different model than another.
   */
  schemas: Partial<Record<ResourceMethod, ExtensibleSchemaName>>;
  /** Default-filters set name for this resource's search route, if any. */
  defaultFilters?: DefaultFiltersName;
}

/** Map of `resource → { resourceClass, per-method schema names, default-filters name }`. */
export const RESOURCE_REGISTRY = {
  widgets: {
    resourceClass: Widgets,
    schemas: { get: "Widget", list: "Widget", search: "Widget" },
    defaultFilters: "Widget",
  },
  gadgets: {
    resourceClass: Gadgets,
    schemas: { get: "Gadget", list: "Gadget", search: "Gadget" },
    defaultFilters: "Gadget",
  },
} as const satisfies Record<string, ResourceRegistryEntry>;

export type ResourceName = keyof typeof RESOURCE_REGISTRY;
