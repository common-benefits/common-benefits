# Client

A typed HTTP client. `plugin.getClient(config)` returns a client whose resources are typed from
the plugin's common models and registered route filters, so
`client.widgets.search({ filters })` returns rows typed as the plugin's model with no call-site
type arguments. `new Client(config)` gives just the HTTP primitives.

## Table of contents <!-- omit in toc -->

- [Configuration](#configuration)
- [Authentication](#authentication)
- [Resources](#resources)
- [Per-row parse results](#per-row-parse-results)
- [Filters](#filters)
- [Low-level HTTP](#low-level-http)
- [API reference](#api-reference)

## Configuration

`ClientConfig` resolves from explicit arguments, then `CB_API_*` environment variables, then
defaults:

| Field      | Env var            | Default  | Notes                                   |
| ---------- | ------------------ | -------- | --------------------------------------- |
| `baseUrl`  | `CB_API_BASE_URL`  | required | must start with `http://` or `https://` |
| `timeout`  | `CB_API_TIMEOUT`   | `30000`  | milliseconds                            |
| `pageSize` | `CB_API_PAGE_SIZE` | `100`    |                                         |
| `maxItems` | `CB_API_MAX_ITEMS` | `1000`   | cap when auto-paginating                |
| `auth`     | —                  | none     | an `Auth` method (see below)            |

## Authentication

```ts
import { Auth } from "@common-benefits/sdk";

Auth.bearer("jwt"); // Authorization: Bearer
Auth.apiKey("key"); // X-API-Key header (pass a second arg to change the header)
Auth.none(); // open endpoints
```

## Resources

Each resource declares its own verbs. `Widgets` and `Gadgets` expose `get` / `list` / `search`;
`Gadgets` adds a distinct filterable verb, `history`. The shared `get` / `list` /
filtered-request plumbing lives on the `Resource` base, so a real resource (e.g. `Applications`)
adds its own verbs by delegating to those helpers.

```ts
const item = await client.widgets.get("w-1"); // throws on parse failure
const listed = await client.widgets.list({ page: 1 }); // ListResult
const found = await client.widgets.search({ filters }); // SearchResult
```

`list` / `search` without `page` auto-paginate up to `config.maxItems`.

## Per-row parse results

`list` and `search` return per-row `ParsedItem`s so one malformed record does not fail the whole
response:

```ts
const result = await client.widgets.search();
for (const row of result.items) {
  if (row.ok)
    use(row.data); // typed model
  else log(row.raw, row.error); // ParsingError + the raw record
}
result.parseErrors; // flat list of every row's errors
```

## Filters

`search({ filters })` takes one flat object. Build values with the `f.*` helpers (see the
[schemas guide](../schemas/README.md#filters)). Standard protocol keys route to the top level of
the request body's `filters`; registered and ad hoc keys validate and nest under
`customFilters`. Custom filters pass through even with no plugin; an invalid value throws before
the request:

```ts
import { f } from "@common-benefits/sdk";

client.widgets.search({
  filters: {
    color: f.eq("red"), // standard -> top level
    region: f.in(["PA", "NJ"]), // unknown -> customFilters
  },
});
```

## Low-level HTTP

`Client` exposes `get` / `post` / `fetch` / `fetchMany`, plus `url(path)`. A built client
(`plugin.getClient(...)`) intersects `Client` with its typed resource slots, so both
`client.get(...)` and `client.widgets.search(...)` work on the same object. HTTP errors throw
`ApiError`.

## API reference

| Symbol                                     | Description                                                                   |
| ------------------------------------------ | ----------------------------------------------------------------------------- |
| `Client`                                   | Low-level HTTP: `get` / `post` / `fetch` / `fetchMany` / `url`.               |
| `Auth`                                     | `bearer` / `apiKey` / `none` factories.                                       |
| `CommonBenefitsClient`                     | The typed facade (`Client` + fixed `widgets` / `gadgets` slots).              |
| `Resource` / `Widgets` / `Gadgets`         | Resource base and the placeholder resources.                                  |
| `ParsedItem<T>`                            | Per-row parse envelope (`{ ok: true, data }` or `{ ok: false, error, raw }`). |
| `parseBatch` / `safeParseItem`             | Per-row parsing helpers.                                                      |
| `Ok` / `Paginated` / `Sorted` / `Filtered` | The protocol success-response envelope types + Zod factories.                 |
| `ApiError` / `ParsingError`                | HTTP/transport errors and per-record parse failures.                          |
