# Development

Guide for maintainers and contributors working on `@common-benefits/website`.

This package is **not published to npm** — it's a Cloudflare Worker that serves the public docs site. There is no release-please release PR, no version bump, and no `CHANGELOG.md`. Deploys happen on every merge to `main` that touches `website/`.

For commit conventions across the repo (including PR title rules that still apply to website-only PRs), see the [root DEVELOPMENT.md](../DEVELOPMENT.md).

## Package structure

```
website/
├── public/                       # Static assets served as-is (favicon, generated schemas)
├── src/
│   ├── content/
│   │   └── docs/                 # Markdown/MDX pages — Starlight routes by filename
│   ├── pages/
│   │   └── protocol/             # Dynamic [slug].astro pages — one per CommonBenefits type
│   ├── components/
│   │   ├── SchemaTable.astro     # Table renderer for a schema's properties
│   │   ├── SchemaFormatTabs.astro # Tabbed JSON-Schema / OpenAPI view
│   │   └── starlight-overrides/  # Header / PageFrame component overrides
│   ├── lib/
│   │   ├── protocol-catalog.ts   # Index of types grouped by section (fields, filters, …)
│   │   ├── paths.ts              # URL helpers
│   │   └── schema/               # JSON Schema loader, $ref resolver, example generator
│   ├── specs/
│   │   └── main.tsp              # TypeSpec entry — imports @common-benefits/core
│   ├── styles/custom.css         # Style overrides
│   ├── content.config.ts         # Starlight content collections config
│   └── index.ts                  # Cloudflare Worker entry (serves static assets via ASSETS binding)
├── astro.config.ts               # Site title, base URL, Starlight integration, output mode
├── wrangler.jsonc                # Cloudflare Worker config (deploy target)
├── tspconfig.yaml                # TypeSpec compile config (emits to public/schemas + public/openapi)
└── package.json                  # Scripts and dependencies
```

Starlight serves any `.md` or `.mdx` in `src/content/docs/` as a route based on its file name. The `/protocol/*` routes are generated dynamically from the TypeSpec output (JSON Schema + OpenAPI), driven by `src/lib/protocol-catalog.ts`.

For more on managing content, see the [Starlight docs](https://starlight.astro.build/) and [Astro docs](https://docs.astro.build).

## How the site is built

The `/protocol/*` routes are generated at build time from TypeSpec output. The pipeline is:

1. `pnpm --filter @common-benefits/core run typespec` — compiles `lib/core/lib/main.tsp` so the core library's emitted artifacts are available to consumers.
2. `pnpm typespec` (in `website/`) — compiles `src/specs/main.tsp` (which imports `@common-benefits/core`) and copies the emitted JSON Schema and OpenAPI files into `public/schemas/yaml/` and `public/openapi/`.
3. `astro build` — Starlight builds the docs, and the dynamic `src/pages/protocol/<section>/[slug].astro` routes use `src/lib/protocol-catalog.ts` to enumerate types and render `SchemaTable` + `SchemaFormatTabs` for each one.

Steps 1 and 2 are wired into `pnpm dev` and `pnpm build`, so `pnpm dev` is the right starting point for most local work.

## Commands

Run from `website/` (or `pnpm --filter @common-benefits/website run <cmd>` from anywhere).

| Command                 | Action                                                                  |
| :---------------------- | :---------------------------------------------------------------------- |
| `pnpm dev`              | TypeSpec compile + Astro dev server at `localhost:4321`                 |
| `pnpm build`            | TypeSpec compile + production build to `dist/`                          |
| `pnpm preview`          | Preview the built site locally with Astro                               |
| `pnpm preview:wrangler` | Build and preview under Wrangler (closer to production)                 |
| `pnpm deploy`           | Build and deploy the Worker to Cloudflare (CI-managed; see below)       |
| `pnpm typespec`         | Compile `src/specs/main.tsp` to JSON Schema + OpenAPI under `public/`   |
| `pnpm typespec:clear`   | Remove generated TypeSpec output from `public/`                         |
| `pnpm format`           | Format with Prettier and auto-fix                                       |
| `pnpm lint`             | Lint and auto-fix with ESLint                                           |
| `pnpm check:format`     | Check formatting without fixing (CI-safe)                               |
| `pnpm check:lint`       | Lint without fixing (CI-safe)                                           |
| `pnpm check:types`      | Type-check with `astro sync && tsc --noEmit`                            |
| `pnpm check:astro`      | Validate Astro components and content                                   |
| `pnpm checks`           | Run all `check:*` scripts                                               |
| `pnpm test`             | Run tests with Vitest (`--passWithNoTests`)                             |
| `pnpm ci`               | Run checks, build, and tests (mirrors CI)                               |
| `pnpm astro -- --help`  | Get help using the Astro CLI                                            |

## Adding a new page

- For prose pages, add a `.md` or `.mdx` file to `src/content/docs/` (or a subdirectory like `src/content/docs/protocol/`). Starlight will pick it up and route it by filename. Add it to the sidebar in `astro.config.ts` if you want it surfaced in navigation.
- For new dynamic schema pages, update `src/lib/protocol-catalog.ts` to register the new type under the appropriate section (`fields`, `filters`, `models`, `responses`, `types`). The existing `[slug].astro` page for that section will pick it up automatically once the TypeSpec output is regenerated.

## Deploying

The site deploys automatically on every push to `main` that touches `website/`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, or `.github/workflows/cd-deploy-website.yml`. The **CD - Deploy Website** workflow runs `wrangler deploy` against the `cloudflare-production` environment.

### Manual deploy

```sh
pnpm --filter @common-benefits/website run deploy
```

You'll need a Cloudflare API token and account ID exported as `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` (or be logged in via `wrangler login`).

### PR previews

Every PR that touches `website/` gets a preview deployment via `wrangler versions upload --preview-alias=pr-<number>`. The preview URL is posted as a PR comment. See `.github/workflows/ci-website-preview.yml` for the wiring.

### Repository setup

These settings are required for deploys to work:

- **`CLOUDFLARE_API_TOKEN`**: Cloudflare API token with `Workers Scripts: Edit` permission, stored as a repo secret (or environment secret on `cloudflare-production`).
- **`CLOUDFLARE_ACCOUNT_ID`**: The Cloudflare account ID, stored as a repo or environment variable.
- **GitHub Environment** (optional): The deploy workflow references an environment called `cloudflare-production` — add required reviewers there to gate production deploys behind a manual approval.
