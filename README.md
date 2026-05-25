# CommonBenefits protocol

A common language for benefits program data.

CommonBenefits is an open standard for describing benefits programs, with a TypeSpec-defined core, a generated TypeScript SDK, and a documentation site.

## Key resources

- Protocol website *(URL forthcoming)*
  - **Overview**: The motivation and design of the CommonBenefits protocol.
  - **Models**: The schemas for the CommonBenefits protocol, with browsable per-type pages.
  - **Pagination / Sorting / Filters / Responses**: Cross-cutting conventions for CommonBenefits APIs.
- Published packages:
  - [@common-benefits/core](https://www.npmjs.com/package/@common-benefits/core): TypeSpec library defining the CommonBenefits protocol.
  - [@common-benefits/sdk](https://www.npmjs.com/package/@common-benefits/sdk): TypeScript SDK with Zod schemas generated from the protocol.
- Repository sections:
  - [Website](website): The code for the public website and docs.
  - [Libraries](lib): The code for the CommonBenefits public packages:
    - [@common-benefits/core](lib/core): TypeSpec library defining the protocol.
    - [@common-benefits/sdk](lib/ts-sdk): TypeScript SDK with Zod schemas generated from the protocol.
- Community docs:
  - [Code of conduct](CODE_OF_CONDUCT.md): Our community guidelines.
  - [Contributing](CONTRIBUTING.md): How to contribute to the CommonBenefits project.
  - [Security policy](SECURITY.md): How to report a security issue.

## Getting started

```sh
pnpm install
pnpm run ci          # lint + build + test across all packages
```

### Per-package quickstart

```sh
pnpm --filter @common-benefits/core    run typespec   # emit OpenAPI 3 + JSON Schema
pnpm --filter @common-benefits/sdk     run typespec   # run typespec-zod to emit Zod schemas
pnpm --filter @common-benefits/website run dev        # local docs site at http://localhost:4321
```

For commit conventions, release-please workflow, and repo-wide tooling, see [DEVELOPMENT.md](DEVELOPMENT.md). For per-package details:

- [lib/core/DEVELOPMENT.md](lib/core/DEVELOPMENT.md)
- [lib/ts-sdk/DEVELOPMENT.md](lib/ts-sdk/DEVELOPMENT.md)
- [website/DEVELOPMENT.md](website/DEVELOPMENT.md)
