# SDK contract fixtures

Language-neutral fixtures that both SDKs (`lib/ts-sdk`, `lib/py-sdk`) test against, so the
TypeScript and Python clients behave **identically**: same filter categorization, same request
bodies, same response parsing. Neither SDK hard-codes its own copy — both load `cases.json`.

These fixtures back two things in each SDK:

1. **Table-driven client tests** — drive the client with each case's `call`, assert the captured
   request equals `expectedRequest`, feed back `response`, and assert `expectedResult`.
2. **A runnable mock server** (`pnpm mock-server` / `make mock-server`) — match an incoming
   request against the cases by `expectedRequest.method` + `path`, and return `response`. This
   lets either SDK's client run against the other SDK's server.

## Canonical placeholder models

`Widget` and `Gadget` are placeholder extensible models (they stand in for real protocol models
such as `Program`) and **must have the same field shape and the same supported methods in both
SDKs**. This is the canonical definition both conform to.

### Widget

| Field          | Type                              | Notes                          |
| -------------- | --------------------------------- | ------------------------------ |
| `id`           | string (uuid)                     | required                       |
| `name`         | string                            | required                       |
| `color`        | string                            | required; sample string field  |
| `weight`       | number                            | required; sample numeric field |
| `customFields` | map<string, CustomField> \| null  | adopter-defined                |

- **Verbs:** `get(id)`, `list(page)`, `search(filters)`.
- **Standard search filters:** `color` -> `StringComparison`, `weight` -> `NumberRange`.

### Gadget

| Field          | Type                              | Notes                            |
| -------------- | --------------------------------- | -------------------------------- |
| `id`           | string (uuid)                     | required                         |
| `label`        | string                            | required (distinct from `name`)  |
| `size`         | number                            | required (distinct from `weight`)|
| `customFields` | map<string, CustomField> \| null  | adopter-defined                  |

- **Verbs:** `get(id)`, `list(page)`, `search(filters)`, `history(filters, since)`.
- **Standard search filters:** `size` -> `NumberComparison`.
- **Standard `history` filters:** `actor` -> `StringComparison`; plus a non-filter `since`
  parameter (ISO datetime) sent as a top-level body field.

### CustomField

`{ name: string, fieldType: "string"|"number"|"integer"|"boolean"|"object"|"array",
schema?: string (url), value: unknown, description?: string }`.

## Filter values

A filter value is always `{ operator, value }`. The shapes used in these fixtures:

| Shape              | `operator` (examples)          | `value`             |
| ------------------ | ------------------------------ | ------------------- |
| `StringComparison` | `eq` `neq` `like` `notLike`    | string              |
| `NumberComparison` | `eq` `neq` `gt` `gte` `lt` `lte` | number            |
| `NumberRange`      | `between` `outside`            | `{ min, max }`      |
| `StringArray`      | `in` `notIn`                   | string[]            |

## Filter categorization

A consumer passes one flat `filters` map to a filterable verb. The client splits it before the
request: keys named in that verb's **standard filters** stay at the top of the request body's
`filters`; every other key nests under `filters.customFilters` (passthrough, works with or
without a plugin). Each case's `categorization` lists the expected split; `expectedRequest.body`
shows the resulting wire body.

## Response envelopes

Success responses follow the protocol's composable envelopes (the shape the TS SDK already
emits; the Python SDK aligns to it):

- **Ok** — `{ status, message, data: T }` (single item, e.g. `get`).
- **Paginated** — `{ status, message, items: T[], paginationInfo }`.
- **Sorted** — Paginated + `sortInfo`.
- **Filtered** — Sorted + `filterInfo: { filters, errors? }` (list/search responses).

`paginationInfo`: `{ page, pageSize, totalItems?, totalPages? }`.
`sortInfo`: `{ sortBy, customSortBy?, sortOrder: "asc"|"desc", errors? }`.
`filterInfo`: `{ filters, errors? }`.

A list/search `items` array may contain a **malformed row** (missing required fields). The client
must isolate it as a per-row parse error rather than failing the whole response; `expectedResult`
records the expected `okCount` / `errorCount`.

## Case format (`cases.json`)

```jsonc
{
  "name": "short identifier",
  "description": "what this case proves",
  "call": {                      // how a consumer invokes the client
    "resource": "widgets",       // "widgets" | "gadgets"
    "verb": "search",            // get | list | search | history
    "id": "w-1",                 // for get
    "page": 1,                   // for list/search
    "since": "2026-01-01T00:00:00Z", // for history
    "filters": { "color": { "operator": "eq", "value": "red" } }
  },
  "categorization": {            // omitted for get/list with no filters
    "topLevel": ["color"],
    "customFilters": ["region"]
  },
  "expectedRequest": {           // the wire request the client should produce
    "method": "POST",
    "path": "/widgets/search",
    "body": { "filters": { "color": { "operator": "eq", "value": "red" } } }
  },
  "response": {                  // what the server returns / mock replays
    "status": 200,
    "body": { "...": "envelope" }
  },
  "expectedResult": { "okCount": 1, "errorCount": 1 }
}
```

`expectedRequest.body` is matched as a **subset**: each key it lists must be present and
deep-equal in the sent body, so SDK-specific defaults (e.g. pagination params) need not be
enumerated and do not break the contract.
