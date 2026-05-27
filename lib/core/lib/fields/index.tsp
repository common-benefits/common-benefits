import "./address.tsp";
import "./custom-field.tsp";
import "./email.tsp";
import "./event.tsp";
import "./extensible-enum.tsp";
import "./file.tsp";
import "./frequency.tsp";
import "./identifiers.tsp";
import "./metadata.tsp";
import "./money.tsp";
import "./name.tsp";
import "./phone.tsp";

using TypeSpec.JsonSchema;

/** A standard set of fields (money, address, phone, etc.) that can be reused across models.
 *
 * @example How to use the `Fields` namespace
 *
 * ```typespec
 * import "@common-benefits/core";
 *
 * using CommonBenefits;
 *
 * model MyModel {
 *   amount: Fields.Money;
 *   address: Fields.Address;
 * }
 * ```
 */
@jsonSchema
namespace CommonBenefits.Fields;
