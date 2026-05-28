/**
 * `getCustomFieldValue()` — safely extract and parse a custom field's value.
 *
 * Copied verbatim from the CommonGrants SDK
 * (lib/ts-sdk/src/extensions/get-custom-field-value.ts).
 */

import { z } from "zod";
import type { ExtensibleObject } from "./plugin-types";

/**
 * Extracts and parses a custom field value from an object with `customFields`.
 *
 * 1. If the field is present and matches, returns the typed `value`.
 * 2. If present but doesn't match, throws a `ZodError`.
 * 3. If the field is present but null/undefined, returns `undefined`.
 * 4. If the field or `customFields` is missing, returns `undefined`.
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
