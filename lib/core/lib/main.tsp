// Import the JS entry point for this library.
// See: https://typespec.io/docs/extending-typespec/basics/#h-add-your-main-typespec-file
import "../dist/src/index.js";

// Import TypeSpec libraries we depend on.
import "@typespec/json-schema";

// Import core TypeSpec sources.
import "./types.tsp";
import "./fields/index.tsp";
import "./pagination.tsp";
import "./sorting.tsp";
import "./filters/index.tsp";
import "./responses/index.tsp";

namespace CommonBenefits;
