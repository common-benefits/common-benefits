# CommonBenefits protocol website

Code for the CommonBenefits protocol website and public docs. The site is built with [Starlight](https://starlight.astro.build/) on top of [Astro](https://astro.build/) and hosted on a [Cloudflare Worker](https://developers.cloudflare.com/workers/) with [Static Assets](https://developers.cloudflare.com/workers/static-assets/).

To get started locally:

```sh
pnpm install                                              # from the repo root
pnpm --filter @common-benefits/website run dev            # http://localhost:4321
```

For project structure, the full command reference, the TypeSpec → Astro build pipeline, and how deploys and PR previews work, see [DEVELOPMENT.md](DEVELOPMENT.md). For commit conventions across the repo, see the [root DEVELOPMENT.md](../DEVELOPMENT.md).
