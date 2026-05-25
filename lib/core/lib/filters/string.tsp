import "./base.tsp";

namespace CommonBenefits.Filters;

/** A filter that applies a comparison to a string value. */
model StringComparisonFilter {
  /** The operator to apply to the filter value. */
  operator: EquivalenceOperators | StringOperators;

  /** The value to use for the filter operation. */
  @example("value")
  value: string;
}

/** Filters by comparing a field to an array of string values. */
model StringArrayFilter {
  /** The operator to apply to the filter value. */
  operator: ArrayOperators;

  /** The value to use for the filter operation. */
  @example(#["value1", "value2"])
  value: Array<string>;
}
