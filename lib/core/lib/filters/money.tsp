import "./base.tsp";
import "../fields/index.tsp";

namespace CommonBenefits.Filters;

/** Filters by comparing a field to a monetary value. */
@Versioning.added(Versions.v0_1)
model MoneyComparisonFilter {
  /** The operator to apply to the filter value. */
  operator: ComparisonOperators;

  /** The value to use for the filter operation. */
  @example(#{ amount: "1000", currency: "USD" })
  value: Fields.Money;
}

/** Filters by comparing a field to a range of monetary values. */
@Versioning.added(Versions.v0_1)
model MoneyRangeFilter {
  /** The operator to apply to the filter value. */
  operator: RangeOperators;

  /** The value to use for the filter operation. */
  @example(#{
    min: #{ amount: "1000", currency: "USD" },
    max: #{ amount: "10000", currency: "USD" },
  })
  value: {
    min: Fields.Money;
    max: Fields.Money;
  };
}
