# Examples

Runnable, offline examples. The client demo stubs `globalThis.fetch`, so no network or running
API is needed.

## Running

```sh
pnpm install

# from lib/ts-sdk:
pnpm run examples            # runs both examples
pnpm dlx tsx examples/plugin-demo.ts
pnpm dlx tsx examples/transforms.ts
```

## Files

| File                                 | What it shows                                                                                                             |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| [`plugin-demo.ts`](./plugin-demo.ts) | Defining a plugin with custom fields, getting a typed client, filtering with `f.*`, per-row parse errors, and transforms. |
| [`transforms.ts`](./transforms.ts)   | The transform surface standalone: declarative mappings vs. hand-written `ToCommon` / `FromCommon`, with round-tripping.   |

The same flows are covered by the test suite (`__tests__/`); run `pnpm run test`, or
`pnpm run ci` to also run lint, format, types, and build.
