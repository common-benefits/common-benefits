import "./routes/index.tsp";
import "@typespec/http";
import "@typespec/openapi";

using TypeSpec.Http;
using TypeSpec.OpenAPI;

/** The base OpenAPI specification for a CommonBenefits API. */
@service(#{ title: "CommonBenefits Base API" })
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

  op create is Router.create;
  op read is Router.read;
  op listEnrollments is Router.listEnrollments;
}

// #########################################################
// Applications
// #########################################################

@tag("Applications")
@route("/households/{householdId}/applications")
namespace Applications {
  alias Router = Routes.Applications;

  op submit is Router.submit;
}

// #########################################################
// Packages
// #########################################################

@tag("Packages")
@route("/packages")
namespace Packages {
  alias Router = Routes.Packages;

  op list is Router.list;
  op read is Router.read;
}

// #########################################################
// Programs
// #########################################################

@tag("Programs")
@route("/programs")
namespace Programs {
  alias Router = Routes.Programs;

  op list is Router.list;
  op read is Router.read;
}
