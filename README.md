# CommonBenefits

A protocol for describing benefits programs, with a TypeSpec-defined core, a generated TypeScript SDK, and a documentation site.

## Layout

```
common-benefits/
├── lib/
│   ├── core/      # @common-benefits/core — TypeSpec library defining the protocol
│   └── ts-sdk/    # @common-benefits/sdk  — generated TypeScript SDK (Zod schemas via typespec-zod)
└── website/       # @common-benefits/website — Astro + Starlight docs site, deployed to a Cloudflare Worker
```

## Getting started

```sh
pnpm install
pnpm run ci          # lint + build + test, all packages
```

## Per-package commands

```sh
pnpm --filter @common-benefits/core run typespec      # emit OpenAPI 3 + JSON Schema
pnpm --filter @common-benefits/sdk run typespec       # run typespec-zod to emit Zod schemas
pnpm --filter @common-benefits/website run dev        # local docs site
pnpm --filter @common-benefits/website exec wrangler dev   # local Worker preview after `run build`
```

## Releases

Versioning and tagging are handled by [Release Please](https://github.com/googleapis/release-please) in manifest mode. Conventional commits on `main` produce per-package release PRs; merging those PRs creates tags like `@common-benefits/core@0.1.0` and `@common-benefits/sdk@0.1.0`, which trigger npm publishes via `pnpm publish`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md).
