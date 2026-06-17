/**
 * Shared construction contract for client resources.
 *
 * Every resource class accepts the same options bag so `buildGetClient()` can
 * construct any registered resource generically (`new entry.resourceClass(options)`)
 * without a per-resource builder. Schemas are loosely typed here (`ZodTypeAny`);
 * each resource narrows them internally, and the precise per-resource instance
 * types are recovered at the type layer in `build-get-client.ts`.
 */

import type { z } from "zod";
import type { Client } from "../client";

/** Resource methods that can be bound to a Zod schema. */
export type ResourceMethod = "get" | "list" | "search";

/** Options accepted by every resource constructor. */
export interface ResourceOptions {
  /** HTTP client used for requests. */
  client: Client;
  /** Override the resource's default base path. */
  basePath?: string;
  /**
   * Per-method item schemas used to parse responses. Each is the plugin's
   * extended `commonSchema` (from `withCustomFields()`) or the model's base
   * schema; a method can bind a different (e.g. more detailed) schema than
   * another. A method falls back to the resource's own base schema when omitted.
   */
  itemSchemas?: Partial<Record<ResourceMethod, z.ZodTypeAny>>;
  /** Protocol-defined ("standard") filters for the resource's search route. */
  defaultFiltersSchema?: z.ZodTypeAny;
  /** Registered custom filters (`withCustomFilters()` output), when the plugin declared any. */
  customFiltersSchema?: z.ZodTypeAny;
}

/** Constructor signature shared by all resource classes. */
export type ResourceConstructor = new (options: ResourceOptions) => object;
