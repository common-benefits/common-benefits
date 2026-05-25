import "../types.tsp";
import "./base.tsp";
import "../fields/index.tsp";

namespace CommonBenefits.Filters;

/** Filters by comparing a field to a numeric value. */
model NumberComparisonFilter {
  /** The comparison operator to apply to the filter value. */
  operator: ComparisonOperators | EquivalenceOperators;

  /** The value to use for the filter operation. */
  @example(1000)
  value: numeric;
}

/** Filters by comparing a field to a numeric range. */
model NumberRangeFilter {
  /** The operator to apply to the filter value. */
  operator: RangeOperators;

  /** The value to use for the filter operation. */
  @example(#{ min: 1000, max: 10000 })
  value: {
    min: numeric;
    max: numeric;
  };
}

/** Filters by comparing a field to an array of numeric values. */
model NumberArrayFilter {
  /** The operator to apply to the filter value. */
  operator: ArrayOperators;

  /** The value to use for the filter operation. */
  @example(#[1000, 2000, 3000])
  value: Array<numeric>;
}
