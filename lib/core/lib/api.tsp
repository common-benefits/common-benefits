import "./routes/index.tsp";
import "@typespec/http";
import "@typespec/openapi";

using TypeSpec.Http;
using TypeSpec.OpenAPI;

/** The base OpenAPI specification for a CommonBenefits API.
 *
 * To be compliant with the CommonBenefits protocol, an implementation must
 * implement every route tagged `required` in this specification.
 */
@service(#{ title: "CommonBenefits Base API" })
@tagMetadata(
  "required",
  #{ description: "Endpoints that MUST be implemented by all CommonBenefits APIs" }
)
@tagMetadata(
  "optional",
  #{ description: "Endpoints that MAY be implemented by CommonBenefits APIs" }
)
@tagMetadata("Households", #{ description: "Endpoints for managing household eligibility data" })
@tagMetadata("Applications", #{ description: "Endpoints for submitting applications for benefits" })
@tagMetadata(
  "Packages",
  #{
    description: "Endpoints for browsing application packages (joint applications across programs)",
  }
)
@tagMetadata("Programs", #{ description: "Endpoints for browsing the program registry" })
@route("/common-benefits")
namespace CommonBenefits.API;

// #########################################################
// Households
// #########################################################

@tag("Households")
@route("/households")
namespace Households {
  alias Router = Routes.Households;

  @tag("required")
  op create is Router.create;

  @tag("required")
  op read is Router.read;

  @tag("required")
  op listEnrollments is Router.listEnrollments;
}

// #########################################################
// Applications
// #########################################################

@tag("Applications")
@route("/households/{householdId}/applications")
namespace Applications {
  alias Router = Routes.Applications;

  @tag("required")
  op submit is Router.submit;
}

// #########################################################
// Packages
// #########################################################

@tag("Packages")
@route("/packages")
namespace Packages {
  alias Router = Routes.Packages;

  @tag("required")
  op list is Router.list;

  @tag("required")
  op read is Router.read;
}

// #########################################################
// Programs
// #########################################################

@tag("Programs")
@route("/programs")
namespace Programs {
  alias Router = Routes.Programs;

  @tag("required")
  op list is Router.list;

  @tag("required")
  op read is Router.read;
}
