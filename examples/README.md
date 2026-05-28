# `@common-benefits/sdk` examples

End-to-end demos showing the public interface adopters use. Read these before
diving into `lib/ts-sdk/src/` — they're the shortest path to "what does this
library actually feel like to use?"

## Running

```sh
pnpm install        # from the repo root
pnpm --filter @common-benefits/examples demo
```

The demo stubs `globalThis.fetch` so it runs offline — no API needed.

## Files

- **`plugin-demo.ts`** — the canonical round-trip:
  1. Declare a plugin with custom fields, custom filters, a source-system
     Zod schema, and `toCommon` / `fromCommon` transforms.
  2. Call `plugin.getClient(config).widgets.search({ filters: ... })` against
     a stubbed fetch.
  3. Inspect typed `customFields` on returned items.
  4. Show how a malformed record yields `{ ok: false, error: ParsingError }`
     without failing the whole response.
  5. Show that `plugin.schemas.Widget.toCommon` / `.fromCommon` are stored as
     callable transforms (the SDK doesn't invoke them automatically — that's
     intentional, so adopters can run them at their own integration boundary).
