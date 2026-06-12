/**
 * Shared types for the extensions module.
 *
 * Defines:
 * - `CustomFieldSpec` / `CustomFilterSpec` — what plugins declare per extension
 * - `ExtensibleSchemaName` + `EXTENSIBLE_SCHEMA_MAP` — protocol models that
 *   accept custom fields (currently just `Widget` while we scaffold)
 * - `PluginRoutes` — shape of the per-route filter declarations
 */

import { z } from "zod";
import type { CustomFieldTypeEnum } from "../schemas/fields";
import { WidgetBaseSchema } from "../schemas/widget";
import { GadgetBaseSchema } from "../schemas/gadget";

// ############################################################################
// CustomFieldSpec / CustomFilterSpec
// ############################################################################

export type CustomFieldType = z.infer<typeof CustomFieldTypeEnum>;

/**
 * Specification for a custom field attached to an extensible base schema.
 *
 * `withCustomFields()` consumes a `Record<string, CustomFieldSpec>` keyed by
 * field name and produces a Zod schema with a typed `customFields` slot.
 */
export interface CustomFieldSpec {
  /** Optional display name (defaults to the record key) */
  name?: string;
  /** JSON-schema type for the field's value */
  fieldType: CustomFieldType;
  /** Optional Zod schema validating the `value` property (defaults to a type-appropriate schema) */
  value?: z.ZodTypeAny;
  /** Optional description */
  description?: string;
}

/**
 * The narrow set of filter types adopters can attach to a search route.
 *
 * Each key mirrors the corresponding per-type filter schema name (e.g.
 * `"stringComparison"` ↔ `StringComparisonFilterSchema`). `integer` flows
 * through `numberComparison`; `boolean` is omitted until a real use case
 * shows up.
 */
export type CustomFilterType =
  | "stringComparison"
  | "stringArray"
  | "numberComparison"
  | "numberArray"
  | "numberRange"
  | "dateComparison"
  | "dateRange"
  | "moneyComparison"
  | "moneyRange";

/** Specification for a custom filter on a search route. */
export interface CustomFilterSpec {
  /** Optional display name (defaults to the record key) */
  name?: string;
  /** The filter family — drives operator + value validation */
  filterType: CustomFilterType;
  /** Optional description */
  description?: string;
}

// ############################################################################
// HasCustomFields / ExtensibleObject
// ############################################################################

import type { CustomFieldSchema } from "../schemas/fields";

type CustomField = z.infer<typeof CustomFieldSchema>;

type CustomFieldsZodType = z.ZodType<Record<string, CustomField> | null | undefined>;

/** A Zod object schema with a `customFields` property suitable for extension. */
export type HasCustomFields = z.ZodObject<{ customFields: CustomFieldsZodType } & z.ZodRawShape>;

/** Runtime object with an optional `customFields` property. */
export interface ExtensibleObject {
  customFields?: Record<string, CustomField> | null;
}

// ############################################################################
// ExtensibleSchemaName / EXTENSIBLE_SCHEMA_MAP
// ############################################################################

/**
 * Names of base models that support custom-field extensions.
 *
 * For this scaffolding PR, the dummy `Widget` schema and a second dummy
 * `Gadget` schema are registered. `Gadget` exists only to prove the transform
 * surface generalizes beyond a single hardcoded base (see the transforms plan,
 * Task 9); remove it once a real second model lands. When the Programs route
 * lands, `"Program"` joins (and `Widget` goes away).
 */
export type ExtensibleSchemaName = "Widget" | "Gadget";

/**
 * Maps each extensible model to its base Zod schema. `definePlugin()` and
 * `buildGetClient()` use this to resolve plugin-declared extensions back to
 * the schemas they extend.
 */
export const EXTENSIBLE_SCHEMA_MAP = {
  Widget: WidgetBaseSchema,
  Gadget: GadgetBaseSchema,
} as const satisfies Record<ExtensibleSchemaName, HasCustomFields>;

// ############################################################################
// SchemaExtensions / PluginSchemaEntry (consumed by definePlugin)
// ############################################################################

/**
 * Per-model configuration accepted by `definePlugin()`.
 *
 * - `customFields` — drives `withCustomFields()` to produce `commonSchema`
 * - `sourceSchema` / `toCommon` / `fromCommon` — pass-through hooks the SDK
 *   stores but does NOT invoke. Consumers can pull them off `plugin.schemas[Name]`
 *   and run them at their own integration boundary.
 */
export interface PluginSchemaEntry<TSource extends z.ZodTypeAny = z.ZodTypeAny> {
  /** Custom fields to attach via `withCustomFields()` */
  customFields?: Record<string, CustomFieldSpec>;
  /** Optional native/source Zod schema (e.g. the shape a source system returns) */
  sourceSchema?: TSource;
  /** Map a parsed source record to common-schema shape */
  toCommon?: (source: z.infer<TSource>) => unknown;
  /** Map a parsed common-schema record back to the source shape */
  fromCommon?: (common: unknown) => z.infer<TSource>;
}

/**
 * Top-level `schemas:` input for `definePlugin()`.
 */
export type SchemaExtensions = Partial<Record<ExtensibleSchemaName, PluginSchemaEntry>>;

// ############################################################################
// PluginRoutes
// ############################################################################

/** Per-method route configuration (currently only `search` has filter specs). */
export interface RouteMethodSpec {
  /** Custom filter specs keyed by filter name */
  filters?: Record<string, CustomFilterSpec>;
}

/** Map of method-name to its spec, currently only `"search"` is meaningful. */
export type RouteMethods = Partial<Record<"search", RouteMethodSpec>>;

/**
 * Top-level routes declaration.
 *
 * @example
 * ```ts
 * const routes = {
 *   widgets: {
 *     search: {
 *       filters: {
 *         color: { filterType: "stringComparison" },
 *         weight: { filterType: "numberRange" },
 *       },
 *     },
 *   },
 * } satisfies PluginRoutes;
 * ```
 */
export type PluginRoutes = Partial<Record<string, RouteMethods>>;
