# Development

Guide for maintainers and contributors working in this monorepo. Per-package details (structure, scripts, build pipelines) live in each package's own `DEVELOPMENT.md`:

- [lib/core/DEVELOPMENT.md](lib/core/DEVELOPMENT.md) — `@common-benefits/core` (TypeSpec library)
- [lib/ts-sdk/DEVELOPMENT.md](lib/ts-sdk/DEVELOPMENT.md) — `@common-benefits/sdk` (TypeScript SDK)
- [website/DEVELOPMENT.md](website/DEVELOPMENT.md) — `@common-benefits/website` (docs site, not published)

This document covers the conventions and tooling that apply across the whole repo.

## Monorepo layout

```
common-benefits/
├── lib/
│   ├── core/      # @common-benefits/core   — released to npm via release-please
│   └── ts-sdk/    # @common-benefits/sdk    — released to npm via release-please
└── website/       # @common-benefits/website — deployed to Cloudflare on every merge to main
```

## Top-level commands

```sh
pnpm install         # install all workspace deps
pnpm run ci          # lint + build + test across every package (CI-equivalent)
pnpm run ci:core     # same, scoped to @common-benefits/core
pnpm run ci:sdk      # same, scoped to @common-benefits/sdk
pnpm run ci:website  # same, scoped to @common-benefits/website
```

## Conventional commits

PR titles must follow the [Conventional Commits](https://www.conventionalcommits.org/) format. The CI **PR: Conventional Title** check enforces this on every PR.

Squash-merging is required and the PR title becomes the commit message on `main`, so the PR title is what release-please reads.

### Allowed types and what they do

| Prefix                                    | Version bump (for released packages)  | Example                                          |
| ----------------------------------------- | ------------------------------------- | ------------------------------------------------ |
| `feat:`                                   | Minor (0.1.0 → 0.2.0)                 | `feat(core): add Organization field [GH #12]`    |
| `fix:`, `docs:`, `refactor:`, `build:`    | Patch (0.1.0 → 0.1.1)                 | `fix(core): handle null custom-field values`     |
| `feat!:` or `fix!:`                       | Minor while pre-v1.0 (0.1.0 → 0.2.0)  | `feat(core)!: rename Address.line1 [GH #15]`     |
| `chore:`, `ci:`, `test:`                  | No bump                               | `chore(sdk): regenerate Zod schemas`             |

Scopes (`core`, `sdk`, `website`) are optional but, when present, must be one of those three.

### `build:` vs `chore:`

Use `build:` for changes consumers can observe at install time — bumping a runtime dependency, changing `package.json` `dependencies`/`peerDependencies`/`exports`, or anything else that affects the published artifact. Use `chore:` for devDependency bumps, ESLint/Prettier config, and other build-tool tweaks that shouldn't trigger a release.

### Breaking changes pre-v1.0

While pre-v1.0, breaking changes (`feat!:`, `fix!:`) bump the **minor** version instead of major. Breaking changes are still called out in the changelog under a "BREAKING CHANGES" section. When you're ready to release v1.0 for a package, remove `"bump-minor-pre-major": true` from `release-please-config.json` and breaking changes will start bumping the major version.

### Path-based attribution

Release-please routes each commit to a package by **file path**, not scope. A commit that changes files under `lib/core/` is attributed to `@common-benefits/core` regardless of the scope in the title. The scope is purely for human readability — keep it accurate, but don't expect it to control routing.

A single PR that touches both `lib/core/` and `lib/ts-sdk/` will contribute to both packages' next releases. Use separate PRs when you want changes attributed cleanly.

## Releases

`@common-benefits/core` and `@common-benefits/sdk` are released to npm via [release-please](https://github.com/googleapis/release-please) in manifest mode. The website is not released — it deploys on every merge to `main`.

Release-please runs at the repo root and manages each package independently. Each package gets its own release PR, tag, and changelog.

### How it works

1. **Use conventional commits** — see above. PR titles drive everything.
2. **Release PR is created automatically** — when changes that trigger a version bump land on `main`, release-please opens (or updates) a release PR per affected package. The PR bumps `version` in the package's `package.json`, updates the package's `CHANGELOG.md`, updates the package's entry in `.release-please-manifest.json`, and accumulates additional commits until it's merged. The release PR is the primary way to preview what will be in the next release.
3. **Merge the release PR to publish** — merging the release PR creates a git tag (`<package-name>@X.Y.Z`) and a GitHub Release. The corresponding CD workflow triggers on the tag and publishes to npm.

| Package                  | Tag format                       | Publish workflow                          | Environment |
| ------------------------ | -------------------------------- | ----------------------------------------- | ----------- |
| `@common-benefits/core`  | `@common-benefits/core@X.Y.Z`    | `CD - Publish @common-benefits/core`      | `npm-core`  |
| `@common-benefits/sdk`   | `@common-benefits/sdk@X.Y.Z`     | `CD - Publish @common-benefits/sdk`       | `npm-sdk`   |

### Retrying a failed publish

If the publish step fails after a release is created:

1. Go to **Actions → CD - Publish @common-benefits/&lt;package&gt;**
2. Click **Run workflow**, enter the git tag (e.g., `@common-benefits/core@0.2.0`), and run

If the failure requires a code fix (not just a CI retry):

1. **Revert the release PR** so `main` reflects the unpublished state:

   ```sh
   # Find the merge commit of the release PR
   git log --oneline main

   # Create a revert branch
   git checkout -b revert-release-<pkg>-v0.2.0 main
   git revert --no-edit <merge-commit-sha>
   git push -u origin revert-release-<pkg>-v0.2.0
   ```

2. Merge the revert PR.
3. Delete the unpublished GitHub Release and tag:

   ```sh
   git push origin --delete '<tag>'
   ```

4. Merge your fix PR.
5. Release-please will open a new release PR for the same version (since the revert undid the previous bump) that includes both the original changes and your fix.
6. Merge the new release PR to publish.

### Bundling multiple changes

A release PR accumulates all version-bumping commits since the last release of that package. Keep merging PRs to `main` — the release PR updates automatically. Merge the release PR only when you're ready to cut a release.

## Repository setup

Required for the release and deploy workflows to function:

- **Squash merge**: Enable squash merging as the default merge strategy with "Default to pull request title" so PR titles become the conventional commit messages on `main`.
- **`NPM_TOKEN`**: An npm [granular access token](https://docs.npmjs.com/creating-and-viewing-access-tokens) as a repo secret, scoped to the `@common-benefits` org with publish permissions. Used by both publish workflows.
- **`CLOUDFLARE_API_TOKEN`** and **`CLOUDFLARE_ACCOUNT_ID`**: Used by the website deploy workflow. See [website/DEVELOPMENT.md](website/DEVELOPMENT.md).
- **GitHub Environments** (optional but recommended): `npm-core`, `npm-sdk`, and `cloudflare-production` are referenced by the deploy/publish workflows — add required reviewers to gate them behind manual approval.
