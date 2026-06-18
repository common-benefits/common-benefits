/**
 * Type machinery for the `plugin` concern: resolving each schema input to its
 * consumer-facing shape (`ResolvedPluginSchemas`), recovering a resolved item
 * type, and projecting the plugin's resolved schemas/routes onto the fixed-slot
 * client facade (`BuiltClient`).
 */

import { z } from "zod";
import type { CommonBenefitsClient } from "../../client/facade";
import { GadgetBaseSchema, GadgetDefaultFiltersSchema } from "../../schemas/gadget";
import { WidgetBaseSchema, WidgetDefaultFiltersSchema } from "../../schemas/widget";
import { EXTENSIBLE_SCHEMA_MAP } from "../registry";
import type {
  CustomFieldSpec,
  SchemaExtensions,
  SchemaOnly,
  SchemaWithTransforms,
  SchemaWithCustomFields,
} from "../schemas";
import type { ExtensibleSchemaName, HasCustomFields } from "../schemas/types";
import type { PluginRoutes } from "../routes";
import type { ResolvedSearchFilters } from "../routes/types";

type WidgetBase = z.infer<typeof WidgetBaseSchema>;
type WidgetDefaultFilters = z.input<typeof WidgetDefaultFiltersSchema>;
type GadgetBase = z.infer<typeof GadgetBaseSchema>;
type GadgetDefaultFilters = z.input<typeof GadgetDefaultFiltersSchema>;

// ############################################################################
// Schema resolution
// ############################################################################

/** Resolve the common schema for entry `E` against base schema `Base`. */
type CommonSchemaFor<Base extends HasCustomFields, E> = E extends {
  customFields: infer CF;
}
  ? CF extends Record<string, CustomFieldSpec>
    ? SchemaWithCustomFields<Base, CF>
    : Base
  : Base;

/**
 * Resolve a single input entry to its consumer-facing shape. An entry with a
 * `sourceSchema` carries transforms (`SchemaWithTransforms`); otherwise it is
 * `SchemaOnly`.
 */
type ResolveSchemaEntry<E, Base extends HasCustomFields> = E extends {
  sourceSchema: infer TSource;
}
  ? TSource extends z.ZodTypeAny
    ? SchemaWithTransforms<CommonSchemaFor<Base, E>, TSource>
    : SchemaOnly<CommonSchemaFor<Base, E>>
  : SchemaOnly<CommonSchemaFor<Base, E>>;

/**
 * Resolves each input entry to a typed `SchemaWithTransforms` or `SchemaOnly`,
 * picking the right base + common schema per model.
 */
export type ResolvedPluginSchemas<TSchemas extends SchemaExtensions> = {
  [K in ExtensibleSchemaName]: K extends keyof TSchemas
    ? ResolveSchemaEntry<NonNullable<TSchemas[K]>, (typeof EXTENSIBLE_SCHEMA_MAP)[K]>
    : SchemaOnly<(typeof EXTENSIBLE_SCHEMA_MAP)[K]>;
};

/** Resolves the typed item type produced by a plugin schema entry. */
export type ResolvedItemType<
  TSchemas extends SchemaExtensions,
  TSchemaName extends keyof TSchemas,
  TDefault,
> = TSchemas[TSchemaName] extends { customFields: Record<string, unknown> }
  ? ResolvedPluginSchemas<TSchemas>[TSchemaName & "Widget"] extends {
      commonSchema: infer S;
    }
    ? S extends z.ZodTypeAny
      ? z.infer<S>
      : TDefault
    : TDefault
  : TDefault;

// ############################################################################
// BuiltClient — the projected client facade
// ############################################################################

/**
 * Final return type of `getClient(config)`: the {@link CommonBenefitsClient}
 * facade with each slot's item and filter types projected from the plugin's
 * already-bound `TSchemas` / `TRoutes` into the structured resource map. One
 * named entry per resource; the `item` comes from `schemas`, the `filters` from
 * `routes`.
 */
export type BuiltClient<
  TRoutes extends PluginRoutes,
  TSchemas extends SchemaExtensions,
> = CommonBenefitsClient<{
  widgets: {
    item: ResolvedItemType<TSchemas, "Widget", WidgetBase>;
    filters: ResolvedSearchFilters<TRoutes, "widgets", WidgetDefaultFilters>;
  };
  gadgets: {
    item: ResolvedItemType<TSchemas, "Gadget", GadgetBase>;
    filters: ResolvedSearchFilters<TRoutes, "gadgets", GadgetDefaultFilters>;
  };
}>;
