/**
 * `mergeExtensions()` — combine multiple `CustomFieldExtensions` records.
 *
 * Copied from the CommonGrants SDK (lib/ts-sdk/src/extensions/merge-extensions.ts)
 * with the input shape renamed `SchemaExtensions` → `CustomFieldExtensions` to
 * avoid collision with the richer `definePlugin` input shape.
 *
 * Treated as interim per the tech spec — multi-plugin merge semantics will be
 * revisited once we have real downstream consumers.
 */

import type { ExtensibleSchemaName, CustomFieldSpec, CustomFieldExtensions } from "./plugin-types";

// ############################################################################
// Public type - MergeExtensionsOptions
// ############################################################################

/**
 * Options controlling field-name conflict resolution.
 *
 * Using `"firstWins"` or `"lastWins"` widens the return type to
 * `CustomFieldExtensions`. Prefer the default `"error"` in published plugins
 * so downstream consumers keep full type safety.
 */
export interface MergeExtensionsOptions {
  onConflict?: "error" | "firstWins" | "lastWins";
}

// ############################################################################
// Public function - mergeExtensions()
// ############################################################################

/** Default-conflict overload preserves specific field types. */
export function mergeExtensions<const T extends readonly CustomFieldExtensions[]>(
  sources: [...T],
  options?: { onConflict?: "error" }
): MergedSchemaExtensions<T>;

/** `firstWins`/`lastWins` overload widens to `CustomFieldExtensions`. */
export function mergeExtensions(
  sources: CustomFieldExtensions[],
  options: MergeExtensionsOptions
): CustomFieldExtensions;

export function mergeExtensions(
  sources: CustomFieldExtensions[],
  options: MergeExtensionsOptions = {}
): CustomFieldExtensions {
  if (sources.length === 0) return {};
  if (sources.length === 1) return sources[0];

  const { onConflict = "error" } = options;
  const result: Record<string, Record<string, CustomFieldSpec>> = {};

  for (const source of sources) {
    mergeSource(result, source, onConflict);
  }

  return result as CustomFieldExtensions;
}

// ############################################################################
// Internal - merge helpers
// ############################################################################

function mergeSource(
  result: Record<string, Record<string, CustomFieldSpec>>,
  source: CustomFieldExtensions,
  onConflict: NonNullable<MergeExtensionsOptions["onConflict"]>
): void {
  for (const [model, fields] of Object.entries(source) as [
    ExtensibleSchemaName,
    Record<string, CustomFieldSpec>,
  ][]) {
    result[model] ??= {};
    mergeFields(result[model], fields, model, onConflict);
  }
}

function mergeFields(
  target: Record<string, CustomFieldSpec>,
  source: Record<string, CustomFieldSpec>,
  model: string,
  onConflict: NonNullable<MergeExtensionsOptions["onConflict"]>
): void {
  for (const [fieldName, spec] of Object.entries(source)) {
    if (fieldName in target) {
      switch (onConflict) {
        case "error":
          throw new Error(`mergeExtensions: duplicate field "${fieldName}" on model "${model}"`);
        case "firstWins":
          break;
        case "lastWins":
          target[fieldName] = spec;
          break;
      }
    } else {
      target[fieldName] = spec;
    }
  }
}

// ############################################################################
// Internal type-level merge utilities
// ############################################################################

type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never;

type ExtractModelFields<S, K extends string> = K extends keyof S ? NonNullable<S[K]> : never;

export type MergedSchemaExtensions<T extends readonly CustomFieldExtensions[]> = {
  [K in ExtensibleSchemaName]: UnionToIntersection<ExtractModelFields<T[number], K>>;
};
