/**
 * Hand-written Zod schemas for the protocol's field-level types.
 *
 * Copied from the CommonGrants SDK (lib/ts-sdk/src/schemas/zod/fields.ts).
 * Only the pieces actually consumed by the client + extension layer are kept:
 * MoneySchema, CustomFieldSchema, CustomFieldTypeEnum, SystemMetadataSchema.
 */

import { z } from "zod";
import { DecimalStringSchema, UTCDateTimeSchema } from "./types";

// ############################################################################
// Money
// ############################################################################

export const MoneySchema = z.object({
  /** The amount of money */
  amount: DecimalStringSchema,

  /** The ISO 4217 currency code */
  currency: z.string(),
});

// ############################################################################
// CustomField
// ############################################################################

export const CustomFieldTypeEnum = z.enum([
  "string",
  "number",
  "integer",
  "boolean",
  "object",
  "array",
]);

export const CustomFieldSchema = z.object({
  /** Name of the custom field */
  name: z.string(),

  /** The JSON schema type */
  fieldType: CustomFieldTypeEnum,

  /** Link to the full JSON schema */
  schema: z.string().url().nullish(),

  /** Value of the custom field */
  value: z.unknown(),

  /** Description of the custom field's purpose */
  description: z.string().nullish(),
});

// ############################################################################
// SystemMetadata
// ############################################################################

export const SystemMetadataSchema = z.object({
  /** The timestamp (in UTC) at which the record was created */
  createdAt: UTCDateTimeSchema,

  /** The timestamp (in UTC) at which the record was last modified */
  lastModifiedAt: UTCDateTimeSchema,
});
