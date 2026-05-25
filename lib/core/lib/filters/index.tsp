import "./base.tsp";
import "./date.tsp";
import "./numeric.tsp";
import "./money.tsp";
import "./string.tsp";

using TypeSpec.JsonSchema;

/** A standard set of filters (StringArrayFilter, NumberRangeFilter, etc.) that can be reused across models.
 *
 * @example How to use the `Filters` namespace
 *
 * ```typespec
 * import "@common-benefits/core";
 *
 * using CommonBenefits;
 *
 * model MyFilters extends Record<Filters.DefaultFilter> {
 *   stringField: Filters.StringArrayFilter;
 *   numberField: Filters.NumberComparisonFilter;
 *   dateField: Filters.DateRangeFilter;
 * }
 * ```
 */
@jsonSchema
namespace CommonBenefits.Filters;
