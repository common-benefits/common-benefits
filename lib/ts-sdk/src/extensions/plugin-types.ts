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
import type { Handler } from "../utils/transformation";
import type { TransformResult } from "./transform-types";

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
// SchemaExtensions / SchemaInput (consumed by definePlugin)
// ############################################################################

/** Declarative bidirectional mappings supplied on a `SchemaInput` entry. */
export interface SchemaMappings {
  toCommon: Record<string, unknown>;
  fromCommon: Record<string, unknown>;
}

/**
 * Mappings authoring path: declarative `mappings` compiled by the
 * `@internal buildTransforms`. Forbids hand-written `toCommon` / `fromCommon`.
 */
export interface MappingsSchemaInput {
  /** Custom fields to attach via `withCustomFields()` */
  customFields?: Record<string, CustomFieldSpec>;
  /** Source-system Zod schema (the shape a source system returns) */
  sourceSchema: z.ZodTypeAny;
  /** Declarative mappings compiled into transforms by `definePlugin` */
  mappings: SchemaMappings;
  /** Custom mapping handlers registered for this entry's mappings only */
  handlers?: Map<string, Handler>;
  toCommon?: never;
  fromCommon?: never;
}

/**
 * Functions authoring path: hand-written `toCommon` / `fromCommon`. Forbids
 * declarative `mappings`.
 *
 * The function slots are intentionally loose on the input side (`any`): a flat,
 * multi-key `definePlugin` cannot infer per-entry `TCommon` to check an inline
 * function, so `source` falls to `any`. The slot still pins the
 * `TransformResult` envelope (a function returning a non-`TransformResult` is
 * rejected). Authors recover full typing with the `ToCommon` / `FromCommon`
 * helper types, and the resolved consumer-facing types are always correct.
 */
export interface FunctionsSchemaInput {
  /** Custom fields to attach via `withCustomFields()` */
  customFields?: Record<string, CustomFieldSpec>;
  /** Source-system Zod schema (the shape a source system returns) */
  sourceSchema: z.ZodTypeAny;
  mappings?: never;
  handlers?: never;
  /** Map a parsed source record to common-schema shape */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toCommon: (source: any) => TransformResult<unknown>;
  /** Map a parsed common-schema record back to the source shape */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fromCommon: (common: any) => TransformResult<unknown>;
}

/** Schema-only path: custom fields, no transforms. Forbids both other paths. */
export interface SchemaOnlyInput {
  /** Custom fields to attach via `withCustomFields()` */
  customFields: Record<string, CustomFieldSpec>;
  sourceSchema?: never;
  mappings?: never;
  handlers?: never;
  toCommon?: never;
  fromCommon?: never;
}

/**
 * Per-model configuration accepted by `definePlugin()`.
 *
 * An exclusive choice: declarative `mappings` XOR hand-written `toCommon` /
 * `fromCommon`, alongside `customFields` + `sourceSchema`; or `customFields`
 * alone. Supplying both `mappings` and functions is a compile error (the
 * `?: never` pairs).
 */
export type SchemaInput = MappingsSchemaInput | FunctionsSchemaInput | SchemaOnlyInput;

/**
 * Top-level `schemas:` input for `definePlugin()`.
 */
export type SchemaExtensions = Partial<Record<ExtensibleSchemaName, SchemaInput>>;

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
