import "./applications.tsp";
import "./households.tsp";
import "./packages.tsp";
import "./programs.tsp";

/** Reusable router interfaces for the CommonBenefits API.
 *
 * Implementations should declare a namespace, instantiate the router via
 * `alias` (not `extends`), and decorate the namespace with `@route` and
 * `@tag` — neither is inherited from the interface itself.
 */
namespace CommonBenefits.Routes;
