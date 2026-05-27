import "./extensible-enum.tsp";

namespace CommonBenefits.Fields;

/** Predefined set of frequencies for recurring monetary amounts (e.g., income,
 * estimated benefits).
 *
 * - `weekly`: Once per week.
 * - `bi_weekly`: Once every two weeks.
 * - `semi_monthly`: Twice per month.
 * - `monthly`: Once per month.
 * - `annual`: Once per year.
 * - `custom`: A caller-defined frequency captured in the description.
 */
@Versioning.added(Versions.v0_1)
enum FrequencyOptions {
  weekly,
  bi_weekly,
  semi_monthly,
  monthly,
  annual,
  custom,
}

/** Frequency of a recurring monetary amount, modeled as an extensible enum so
 * implementations can supply a custom frequency via the `description` field
 * when none of the predefined options apply.
 */
@example(Examples.Frequency.monthly)
@Versioning.added(Versions.v0_1)
model Frequency is ExtensibleEnumT<FrequencyOptions>;

namespace Examples.Frequency {
  const monthly = #{ value: FrequencyOptions.monthly, description: "" };
}
