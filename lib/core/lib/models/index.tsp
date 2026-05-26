import "./app-package.tsp";
import "./application.tsp";
import "./eligibility-determination.tsp";
import "./enrollment.tsp";
import "./household.tsp";
import "./jurisdiction.tsp";
import "./person.tsp";
import "./program.tsp";

using TypeSpec.JsonSchema;

/** Domain models for the CommonBenefits protocol.
 *
 * @example How to use the `Models` namespace
 *
 * ```typespec
 * import "@common-benefits/core";
 *
 * using CommonBenefits;
 *
 * op getHousehold(@path id: Types.uuid): Responses.OkT<Models.HouseholdBase>;
 * ```
 */
@jsonSchema
namespace CommonBenefits.Models;
