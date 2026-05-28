/**
 * `withCustomFields()` — extend an extensible base schema with typed
 * `customFields` slots.
 *
 * Copied verbatim from the CommonGrants SDK (lib/ts-sdk/src/extensions/with-custom-fields.ts)
 * with imports rewired to the local schema modules.
 */

import { z } from "zod";
import { CustomFieldSchema } from "../schemas/fields";
import type { CustomFieldSpec, CustomFieldType, HasCustomFields } from "./plugin-types";

// ############################################################################
// Public type - WithCustomFieldsResult
// ############################################################################

type CustomField = z.infer<typeof CustomFieldSchema>;

/**
 * Zod schema produced by {@link withCustomFields}.
 *
 * 1. Removes the base schema's untyped `customFields` property.
 * 2. Replaces it with a typed version derived from `TSpecs`.
 * 3. Wraps the result in `z.ZodObject` so it remains a valid Zod schema.
 *
 * Result: `z.infer<WithCustomFieldsResult<...>>` is the base type with
 * `customFields` strongly typed — registered fields get typed `value`s,
 * unregistered fields fall back to the base `CustomField` type.
 */
export type WithCustomFieldsResult<
  TSchema extends HasCustomFields,
  TSpecs extends Record<string, CustomFieldSpec>,
> = z.ZodObject<
  Omit<TSchema["shape"], "customFields"> & {
    customFields: z.ZodOptional<z.ZodType<TypedCustomFields<TSpecs>>>;
  }
>;

// ############################################################################
// Public function - withCustomFields()
// ############################################################################

/**
 * Extends a base schema with typed `customFields`.
 *
 * Each spec's record key becomes the default `name` on the resulting
 * `CustomField`; `spec.description` becomes the default `description`.
 * Unregistered fields still pass validation via the underlying `passthrough()`
 * but are typed as the base `CustomField`.
 *
 * @example
 * ```ts
 * const Schema = withCustomFields(WidgetBaseSchema, {
 *   legacyId: { fieldType: "object", value: z.object({ system: z.string(), id: z.number() }) },
 *   category: { fieldType: "string" },
 * } as const);
 *
 * type Widget = z.infer<typeof Schema>;
 * // widget.customFields?.legacyId?.value.id   -> number
 * // widget.customFields?.category?.value      -> string
 * ```
 */
export function withCustomFields<
  TSchema extends HasCustomFields,
  const TSpecs extends Record<string, CustomFieldSpec>,
>(baseSchema: TSchema, specs: TSpecs): WithCustomFieldsResult<TSchema, TSpecs> {
  const schemaShape = baseSchema.shape;
  if (!("customFields" in schemaShape)) {
    throw new Error(
      "Cannot register custom fields on a schema that doesn't support them. " +
        "The base schema must include a 'customFields' property (e.g., customFields: z.record(z.unknown()).nullish())"
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

  const result = baseSchema.extend({
    customFields: customFieldsSchema,
  });

  return result as unknown as WithCustomFieldsResult<TSchema, TSpecs>;
}

// ############################################################################
// Internal - Default value schemas
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

// ############################################################################
// Internal - Type inference utilities
// ############################################################################

type DefaultFieldTypeMap = {
  string: string;
  number: number;
  integer: number;
  boolean: boolean;
  object: Record<string, unknown>;
  array: unknown[];
};

type InferFromValueSchema<T extends CustomFieldSpec> = T["value"] extends z.ZodTypeAny
  ? z.infer<T["value"]>
  : never;

type DefaultValueType<T extends CustomFieldSpec> = T["fieldType"] extends keyof DefaultFieldTypeMap
  ? DefaultFieldTypeMap[T["fieldType"]]
  : unknown;

type InferValueType<T extends CustomFieldSpec> = T["value"] extends z.ZodTypeAny
  ? InferFromValueSchema<T>
  : DefaultValueType<T>;

type TypedCustomField<T extends CustomFieldSpec> = {
  name: string;
  fieldType: T["fieldType"];
  value: InferValueType<T>;
  schema?: string | null;
  description?: string | null;
};

type TypedCustomFields<TSpecs extends Record<string, CustomFieldSpec>> = {
  [K in keyof TSpecs]?: TypedCustomField<TSpecs[K]>;
} & Record<string, CustomField>;
