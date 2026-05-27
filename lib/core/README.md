# CommonBenefits core library

`@common-benefits/core` is the [CommonBenefits](https://github.com/common-benefits/common-benefits) protocol, written in [TypeSpec](https://typespec.io). It defines a shared vocabulary for benefits programs, the households they serve, and the data exchanged between the systems that administer them.

Import it to describe a CommonBenefits-compatible API in TypeSpec and emit an OpenAPI document and JSON Schemas from it.

## Installation

```bash
npm install @common-benefits/core
```

You also need the TypeSpec compiler and whichever emitters you want to run:

```bash
npm install -D @typespec/compiler @typespec/openapi3 @typespec/json-schema
```

> `@common-benefits/core` is published to npm with the v0.1.0 protocol release.

## What's in the library

Everything lives under the `CommonBenefits` namespace, grouped by concern:

| Namespace                  | Contents                                                                                                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CommonBenefits.Models`    | Domain resources: `PersonBase`, `HouseholdBase`, `ProgramBase`, `JurisdictionBase`, `AppPackageBase`, `ApplicationBase`, `EnrollmentBase`, `EligibilityDeterminationBase` |
| `CommonBenefits.Fields`    | Reusable fields: `Address`, `Name`, `Phone`, `EmailCollection`, `Money`, `Event`, `File`, `Identifiers`, `Frequency`, `SystemMetadata`, `CustomField`, `ExtensibleEnum`   |
| `CommonBenefits.Types`     | Branded scalars: `uuid`, `email`, `isoDate`, `isoTime`, `calendarYear`, `decimalString`                                                                                   |
| `CommonBenefits.Filters`   | Operators and typed filters for querying collections                                                                                                                      |
| `CommonBenefits.Responses` | Response envelopes: `Ok` / `OkT<T>`, `Created` / `CreatedT<T>`, `Paginated` / `PaginatedT<T>`, `Sorted`, `Filtered`, `Error`                                              |
| `CommonBenefits.Routes`    | Reusable router interfaces: `Households`, `Applications`, `Packages`, `Programs`                                                                                          |
| `CommonBenefits.Versions`  | Protocol versions (currently `v0_1` = `0.1.0`)                                                                                                                            |

## Quickstart

A minimal project that defines an API service from the protocol's routers:

```
.
├── main.tsp        # Your API service
├── package.json
└── tspconfig.yaml  # Emitter configuration
```

### Define your service

Each router is an `interface`. Instantiate it with `alias` (not `extends`), decorate your namespace with `@route` and `@tag`, then expose the operations you want with `op <name> is Router.<name>`.

```typespec
// main.tsp
import "@typespec/http";
import "@typespec/versioning";
import "@common-benefits/core";

using TypeSpec.Http;
using CommonBenefits;

/** Description of your API. */
@service(#{ title: "My Benefits API" })
@Versioning.useDependency(CommonBenefits.Versions.v0_1)
@route("/my-benefits")
namespace MyBenefitsApi;

@tag("Households")
@route("/households")
namespace Households {
  alias Router = Routes.Households;

  op create is Router.create;
  op read is Router.read;
  op listEnrollments is Router.listEnrollments;
}
```

Mount as many or as few routers and operations as your implementation supports.

### Attach program-specific data

Several core models include an open `customFields` map, so you can carry program- or jurisdiction-specific data without forking a model. Describe a field by extending `CustomField`:

```typespec
import "@common-benefits/core";
using CommonBenefits.Fields;

model SnapCategory extends CustomField {
  name: "snapCategory";
  type: CustomFieldType.string;
  value: string;
}
```

### Emit OpenAPI and JSON Schema

Configure the emitters:

```yaml
# tspconfig.yaml
emit:
  - "@typespec/openapi3"
  - "@typespec/json-schema"
```

Then compile:

```bash
npx tsp compile main.tsp
```

The OpenAPI document and JSON Schemas are written to `tsp-output/`.

## Versioning

The protocol is versioned with `@typespec/versioning`. Pin your service to a protocol version with `@Versioning.useDependency(CommonBenefits.Versions.v0_1)`. Each model and operation records the version it was added in, so the emitted spec reflects the version you depend on.

## Further reading

- [TypeSpec documentation](https://typespec.io/docs)
- [CommonBenefits on GitHub](https://github.com/common-benefits/common-benefits)
- Maintaining or contributing to this package? See [DEVELOPMENT.md](./DEVELOPMENT.md).
