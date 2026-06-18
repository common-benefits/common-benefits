/**
 * The specs an author declares per extension: a typed custom field and a custom
 * filter. `schemas` (`withCustomFields`) consumes `CustomFieldSpec`; `routes`
 * (`withCustomFilters`) consumes `CustomFilterSpec`. Mirrors `py-sdk`'s
 * `extensions/specs.py`.
 */

import type { z } from "zod";
import type { CustomFieldType, CustomFilterType } from "./types";

/**
 * Specification for a custom field attached to an extensible base schema.
 *
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

/** Specification for a custom filter on a search route. */
export interface CustomFilterSpec {
  /** Optional display name (defaults to the record key). */
  name?: string;
  /** The filter family — drives operator + value validation. */
  filterType: CustomFilterType;
  /** Optional description. */
  description?: string;
}
