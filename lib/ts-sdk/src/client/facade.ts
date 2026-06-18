/**
 * The typed client facade.
 *
 * `CommonBenefitsClient` is the shape `plugin.getClient(config)` returns: the
 * low-level {@link Client} (HTTP primitives) plus one fixed, typed slot per
 * protocol resource. The slots are written out explicitly — one line per
 * resource — rather than derived by a mapped type over a registry, mirroring
 * `py-sdk .../client/facade.py`.
 *
 * Each slot's `item` and `filters` types are supplied through a single
 * **structured** type argument (`ResourceTypeMap`) keyed by resource name,
 * rather than a positional list of generics — so a resource's two type
 * parameters stay grouped and labelled, and adding a resource is a named entry
 * rather than two more positions to thread. The map is projected from the
 * plugin in `BuiltClient` (build-get-client.ts), so consumers never write it by
 * hand. Adding a resource is one slot here plus its registry entry; the type
 * checker enforces the two stay in sync (see `build-get-client.ts`).
 */

import type { Client } from "./client";
import type { Gadgets } from "./resources/gadgets";
import type { Widgets } from "./resources/widgets";
import type { GadgetBaseSchema } from "../schemas/gadget";
import type { WidgetBaseSchema } from "../schemas/widget";
import type { z } from "zod";

type WidgetBase = z.infer<typeof WidgetBaseSchema>;
type GadgetBase = z.infer<typeof GadgetBaseSchema>;

/** The parsed item type and filters bag for a single resource. */
export interface ResourceTypes<
  TItem,
  TFilters extends Record<string, unknown> = Record<string, unknown>,
> {
  /** The type each parsed row is validated into. */
  item: TItem;
  /** The flat filter bag the resource's filterable verbs accept. */
  filters: TFilters;
}

/**
 * Structured per-resource type map. Each key names a resource and carries its
 * {@link ResourceTypes}; the default is the bare protocol types (no plugin
 * extension). `getClient` builds a fully-resolved map from the plugin.
 */
export interface ResourceTypeMap {
  widgets: ResourceTypes<WidgetBase>;
  gadgets: ResourceTypes<GadgetBase>;
}

/** The fixed, typed resource slots attached to a built client. */
export interface ResourceSlots<R extends ResourceTypeMap = ResourceTypeMap> {
  /** The widgets resource: `get` / `list` / `search`. */
  readonly widgets: Widgets<R["widgets"]["item"], R["widgets"]["filters"]>;
  /** The gadgets resource: `get` / `list` / `search` / `history`. */
  readonly gadgets: Gadgets<R["gadgets"]["item"], R["gadgets"]["filters"]>;
}

/**
 * A fully built client: the HTTP primitives of {@link Client} plus the typed
 * resource slots. `plugin.getClient(config)` returns this with the slots'
 * item/filter types resolved from the plugin.
 */
export type CommonBenefitsClient<R extends ResourceTypeMap = ResourceTypeMap> = Client &
  ResourceSlots<R>;
