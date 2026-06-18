/**
 * The `schemas` concern: extending an extensible base schema with typed custom
 * fields, the resolved schema-entry shapes (`SchemaWithTransforms` / `SchemaOnly`),
 * the registry of extensible models, and the helper for reading a custom-field
 * value off a returned item. Mirrors `py-sdk`'s `extensions/schema.py`.
 */

import { z } from "zod";
import { CustomFieldSchema } from "../../schemas/fields";
import { WidgetBaseSchema } from "../../schemas/widget";
import { GadgetBaseSchema } from "../../schemas/gadget";
import type { CustomFieldSpec } from "../specs";
import type { CustomFieldType, ExtensibleObject, ExtensibleSchemaName } from "../types";
import type { TransformResult } from "../transforms";
import type { HasCustomFields, SchemaMappings, SchemaWithCustomFields } from "./types";

export type {
  HasCustomFields,
  SchemaExtensions,
  SchemaInput,
  SchemaMappings,
  MappingsSchemaInput,
  FunctionsSchemaInput,
  SchemaOnlyInput,
  SchemaWithCustomFields,
} from "./types";

// ############################################################################
// Resolved schema-entry shapes (output of definePlugin)
// ############################################################################

/**
 * A resolved entry with transforms. Both directions are non-optional and
 * two-sided typed: `toCommon` returns the common type, `fromCommon` the source
 * type.
 */
export interface SchemaWithTransforms<TCommon extends z.ZodTypeAny, TSource extends z.ZodTypeAny> {
  /** The (possibly extended) common-schema for this model. */
  commonSchema: TCommon;
  /** The source-system schema. */
  sourceSchema: TSource;
  /** Custom fields declared on the entry, if any. */
  customFields?: Record<string, CustomFieldSpec>;
  /** Declarative mappings, when the entry used the mappings path. */
  mappings?: SchemaMappings;
  /** Transform a source record into common-schema shape (validated against `commonSchema`). */
  toCommon: (source: z.infer<TSource>) => TransformResult<z.infer<TCommon>>;
  /** Transform a common-schema record back to the source shape (validated against `sourceSchema`). */
  fromCommon: (common: z.infer<TCommon>) => TransformResult<z.infer<TSource>>;
}

/** A resolved entry with custom fields only — no transforms. */
export interface SchemaOnly<TCommon extends z.ZodTypeAny> {
  /** The (possibly extended) common-schema for this model. */
  commonSchema: TCommon;
  /** Custom fields declared on the entry, if any. */
  customFields?: Record<string, CustomFieldSpec>;
}

// ############################################################################
// EXTENSIBLE_SCHEMA_MAP — the registry of extensible models
// ############################################################################

/**
 * Maps each extensible model to its base Zod schema. `definePlugin()` and the
 * client builder use this to resolve plugin-declared extensions back to the
 * schemas they extend.
 */
export const EXTENSIBLE_SCHEMA_MAP = {
  Widget: WidgetBaseSchema,
  Gadget: GadgetBaseSchema,
} as const satisfies Record<ExtensibleSchemaName, HasCustomFields>;

// ############################################################################
// withCustomFields()
// ############################################################################

const DEFAULT_VALUE_SCHEMAS: Record<CustomFieldType, z.ZodTypeAny> = {
  string: z.string(),
  number: z.number(),
  integer: z.number().int(),
  boolean: z.boolean(),
  object: z.record(z.string(), z.unknown()),
  array: z.array(z.unknown()),
};

function getValueSchema(spec: CustomFieldSpec): z.ZodTypeAny {
  return spec.value ?? DEFAULT_VALUE_SCHEMAS[spec.fieldType];
}

/**
 * Extends a base schema with typed `customFields`. Each spec's record key
 * becomes the default `name`; `spec.description` becomes the default
 * `description`. Unregistered fields still pass validation via `passthrough()`
 * but are typed as the base `CustomField`.
 *
 * @example
 * ```ts
 * const Schema = withCustomFields(WidgetBaseSchema, {
 *   legacyId: { fieldType: "object", value: z.object({ system: z.string(), id: z.number() }) },
 *   category: { fieldType: "string" },
 * } as const);
 * // z.infer<typeof Schema>: customFields?.legacyId?.value.id -> number
 * ```
 */
export function withCustomFields<
  TSchema extends HasCustomFields,
  const TSpecs extends Record<string, CustomFieldSpec>,
>(baseSchema: TSchema, specs: TSpecs): SchemaWithCustomFields<TSchema, TSpecs> {
  const schemaShape = baseSchema.shape;
  if (!("customFields" in schemaShape)) {
    throw new Error(
      "Cannot register custom fields on a schema that doesn't support them. " +
        "The base schema must include a 'customFields' property."
    );
  }

  const typedFieldSchemas: Record<string, z.ZodTypeAny> = {};
  for (const [key, spec] of Object.entries(specs)) {
    typedFieldSchemas[key] = CustomFieldSchema.extend({
      fieldType: z.literal(spec.fieldType),
      value: getValueSchema(spec),
      name: z.string().default(spec.name ?? key),
      description:
        spec.description !== undefined
          ? z.string().nullish().default(spec.description)
          : z.string().nullish(),
    }).optional();
  }

  const customFieldsSchema = z.object(typedFieldSchemas).passthrough().nullish();
  const result = baseSchema.extend({ customFields: customFieldsSchema });
  return result as unknown as SchemaWithCustomFields<TSchema, TSpecs>;
}

// ############################################################################
// getCustomFieldValue()
// ############################################################################

/**
 * Extracts and parses a custom field value from an object with `customFields`.
 * Returns the typed value when present and valid, `undefined` when the field or
 * `customFields` is missing/null, and throws a `ZodError` when present but invalid.
 */
export function getCustomFieldValue<T extends z.ZodTypeAny>(
  obj: ExtensibleObject,
  key: string,
  valueType: T
): z.infer<T> | undefined {
  const customFields = obj.customFields;
  if (!customFields) return undefined;
  const field = customFields[key];
  if (!field) return undefined;
  const value = field.value;
  if (value == null) return undefined;
  return valueType.parse(value);
}
