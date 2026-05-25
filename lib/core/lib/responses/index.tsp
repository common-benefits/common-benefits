import "@typespec/http";

import "./error.tsp";
import "./success.tsp";

using TypeSpec.JsonSchema;

/** A standardized set of response schemas for CommonBenefits API routes.
 *
 * @example How to use the `Responses` namespace
 *
 * ```typespec
 * import "@typespec/http";
 * import "@common-benefits/core";
 *
 * using CommonBenefits;
 * using TypeSpec.Http;
 *
 * @route("/pets")
 * namespace Pets {
 *   @get
 *   op getPets(): Responses.Ok<Pet> | Responses.Unauthorized;
 * }
 * ```
 */
@jsonSchema
namespace CommonBenefits.Responses;
