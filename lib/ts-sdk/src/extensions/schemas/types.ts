/**
 * Types for the `schemas` concern: the custom-field vocabulary and spec, the
 * `withCustomFields` result type and its value-inference utilities, the
 * `HasCustomFields` constraint, and the `SchemaInput` authoring union
 * `definePlugin` accepts per model.
 */

import { z } from "zod";
import { CustomFieldSchema, CustomFieldTypeEnum } from "../../schemas/fields";
import type { Handler } from "../../utils/transformation";
import type { ExtensibleSchemaName } from "../registry";
import type { TransformResult } from "../transforms";

// ############################################################################
// Custom-field vocabulary
// ############################################################################

/** JSON-schema type tag for a custom field's value (derived from the Zod enum). */
export type CustomFieldType = z.infer<typeof CustomFieldTypeEnum>;

type CustomField = z.infer<typeof CustomFieldSchema>;

/** Runtime object with an optional `customFields` property. */
export interface ExtensibleObject {
  customFields?: Record<string, CustomField> | null;
}

/**
 * Specification for a custom field attached to an extensible base schema.
 * `withCustomFields()` consumes a `Record<string, CustomFieldSpec>` keyed by
 * field name and produces a Zod schema with a typed `customFields` slot.
 */
export interface CustomFieldSpec {
  /** Optional display name (defaults to the record key). */
  name?: string;
  /** JSON-schema type for the field's value. */
  fieldType: CustomFieldType;
  /** Optional Zod schema validating `value` (defaults to a type-appropriate schema). */
  value?: z.ZodTypeAny;
  /** Optional description. */
  description?: string;
}

// ############################################################################
// HasCustomFields constraint
// ############################################################################

type CustomFieldsZodType = z.ZodType<Record<string, CustomField> | null | undefined>;

/** A Zod object schema with a `customFields` property suitable for extension. */
export type HasCustomFields = z.ZodObject<{ customFields: CustomFieldsZodType } & z.ZodRawShape>;

// ############################################################################
// withCustomFields result + value inference
// ############################################################################

/**
 * Zod schema produced by `withCustomFields`. Removes the base schema's untyped
 * `customFields` and replaces it with a typed version derived from `TSpecs`, so
 * `z.infer<...>` gives the base type with registered fields strongly typed and
 * unregistered fields falling back to the base `CustomField`.
 */
export type SchemaWithCustomFields<
  TSchema extends HasCustomFields,
  TSpecs extends Record<string, CustomFieldSpec>,
> = z.ZodObject<
  Omit<TSchema["shape"], "customFields"> & {
    customFields: z.ZodOptional<z.ZodType<TypedCustomFields<TSpecs>>>;
  }
>;

type DefaultFieldTypeMap = {
  string: string;
  number: number;
  integer: number;
  boolean: boolean;
  object: Record<string, unknown>;
  array: unknown[];
};

/** Infers the value type from a spec's explicit value schema, if one is provided. */
type InferFromValueSchema<T extends CustomFieldSpec> = T["value"] extends z.ZodTypeAny
  ? z.infer<T["value"]>
  : never;

/** Falls back to `DefaultFieldTypeMap` based on `fieldType`. */
type DefaultValueType<T extends CustomFieldSpec> = T["fieldType"] extends keyof DefaultFieldTypeMap
  ? DefaultFieldTypeMap[T["fieldType"]]
  : unknown;

/** Use the explicit value schema if available, else the default for the field type. */
type InferValueType<T extends CustomFieldSpec> = T["value"] extends z.ZodTypeAny
  ? InferFromValueSchema<T>
  : DefaultValueType<T>;

/** The runtime shape of a single registered custom field. */
type TypedCustomField<T extends CustomFieldSpec> = {
  name: string;
  fieldType: T["fieldType"];
  value: InferValueType<T>;
  schema?: string | null;
  description?: string | null;
};

/**
 * The `customFields` object type built from a Record of specs: registered keys
 * get a typed `TypedCustomField`, and `& Record<string, CustomField>` lets
 * unregistered fields pass through typed as the base `CustomField`.
 */
type TypedCustomFields<TSpecs extends Record<string, CustomFieldSpec>> = {
  [K in keyof TSpecs]?: TypedCustomField<TSpecs[K]>;
} & Record<string, CustomField>;

// ############################################################################
// SchemaInput — the authoring union accepted per model by definePlugin
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
  customFields?: Record<string, CustomFieldSpec>;
  sourceSchema: z.ZodTypeAny;
  mappings: SchemaMappings;
  handlers?: Map<string, Handler>;
  toCommon?: never;
  fromCommon?: never;
}

/**
 * Functions authoring path: hand-written `toCommon` / `fromCommon`. Forbids
 * declarative `mappings`. The function slots are loose on the input side
 * (`any`): a flat, multi-key `definePlugin` cannot infer per-entry `TCommon`,
 * so authors recover full typing with the `ToCommon` / `FromCommon` helpers.
 */
export interface FunctionsSchemaInput {
  customFields?: Record<string, CustomFieldSpec>;
  sourceSchema: z.ZodTypeAny;
  mappings?: never;
  handlers?: never;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toCommon: (source: any) => TransformResult<unknown>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fromCommon: (common: any) => TransformResult<unknown>;
}

/** Schema-only path: custom fields, no transforms. Forbids both other paths. */
export interface SchemaOnlyInput {
  customFields: Record<string, CustomFieldSpec>;
  sourceSchema?: never;
  mappings?: never;
  handlers?: never;
  toCommon?: never;
  fromCommon?: never;
}

/**
 * Per-model configuration accepted by `definePlugin()`: declarative `mappings`
 * XOR hand-written `toCommon` / `fromCommon` (with `customFields` + `sourceSchema`),
 * or `customFields` alone. Supplying both `mappings` and functions is a compile
 * error (the `?: never` pairs).
 */
export type SchemaInput = MappingsSchemaInput | FunctionsSchemaInput | SchemaOnlyInput;

/** Top-level `schemas:` input for `definePlugin()`. */
export type SchemaExtensions = Partial<Record<ExtensibleSchemaName, SchemaInput>>;
