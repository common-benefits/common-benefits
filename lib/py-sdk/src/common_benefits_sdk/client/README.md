# Client

A typed HTTP client. `plugin.get_client(config)` returns a client whose resources are typed
from the plugin's common models and registered route filters, so
`client.widgets.search(filters=...)` returns rows typed as the plugin's model with no
call-site type arguments.

## Table of contents <!-- omit in toc -->

- [Quick start](#quick-start)
- [Configuration](#configuration)
- [Authentication](#authentication)
- [Resources](#resources)
- [Per-row parse results](#per-row-parse-results)
- [Filters](#filters)
- [Low-level HTTP](#low-level-http)
- [API reference](#api-reference)

## Quick start

```python
from common_benefits_sdk.client import Config, ParsedOk

client = plugin.get_client(Config(base_url="https://api.example.org", api_key="your-key"))

result = client.widgets.search(query="conservation")
for row in result.items:
    if isinstance(row, ParsedOk):
        print(row.data.name)
```

## Configuration

`Config` resolves from explicit arguments, then `CB_*` environment variables, then defaults:

```python
Config(base_url="https://api.example.org", api_key="key", timeout=10.0,
       page_size=100, max_items=1000)
```

| Field | Env var | Default | Notes |
| ----- | ------- | ------- | ----- |
| `base_url` | `CB_API_BASE_URL` | required | must start with `http://` or `https://` |
| `api_key` | `CB_API_KEY` | none | optional; absent means no auth |
| `timeout` | `CB_API_TIMEOUT` | `10.0` | seconds |
| `page_size` | `CB_API_PAGE_SIZE` | `100` | |
| `max_items` | `CB_API_MAX_ITEMS` | `1000` | cap when auto-paginating |

`transport` accepts an `httpx` transport (e.g. `httpx.MockTransport`) for offline use/tests.

## Authentication

```python
from common_benefits_sdk.client import Auth

Auth.api_key("key")            # X-API-Key header (or pass header=...)
Auth.bearer("jwt")             # Authorization: Bearer
Auth.none()                    # open endpoints
```

`Config` builds API-key auth from `api_key` automatically; pass an `Auth` to `get_client`
only to override.

## Resources

Each resource declares its own verbs. `Widgets` and `Gadgets` expose `get` / `list` /
`search`; real resources add their own (e.g. an `Applications` resource would add
`submit` / `start`). Shared `_get` / `_list` / `_search` helpers live on the `Resource` base.

```python
item = client.widgets.get("w-1")                      # ParsedItem
listing = client.widgets.list(page=1)                 # ListResult
found = client.widgets.search(query="x", filters=...) # SearchResult
```

`list` / `search` with `page=None` auto-paginate up to `config.max_items`.

## Per-row parse results

`list` and `search` return per-row `ParsedItem`s so one malformed record does not fail the
whole response:

```python
result = client.widgets.search()
for row in result.items:
    if row.ok:               # ParsedOk[TItem]
        use(row.data)        # typed model
    else:                    # ParsedErr
        log(row.raw, row.errors)

result.parse_errors          # flat list of every row's errors
```

## Filters

`search(filters=...)` takes one inline dict. Build values with the `f.*` helpers (see the
[Schemas guide](../schemas/README.md#filters)). Standard protocol keys route to the top level;
registered and ad hoc keys validate and nest under `customFilters`. Custom filters pass
through even with no plugin; an invalid value raises `FilterError` before the request:

```python
from common_benefits_sdk.schemas.filters import f

client.widgets.search(filters={
    "color": f.eq("red"),          # standard -> top level
    "region": f.in_(["PA", "NJ"]), # unknown -> customFilters
})
```

## Low-level HTTP

`BaseClient` (`client.http`) exposes the generic verbs the resources build on:
`get` / `post` / `fetch` / `fetch_many` / `url`, plus `close()` and context-manager support.
HTTP and transport errors are normalized to `APIError`.

## API reference

| Symbol | Description |
| ------ | ----------- |
| `Config` | Client configuration with `CB_*` env fallbacks. |
| `Auth` | `api_key` / `bearer` / `none` factories. |
| `CommonBenefitsClient` | The typed facade returned by `get_client` (`.widgets`, `.gadgets`). |
| `BaseClient` | Low-level HTTP: `get` / `post` / `fetch` / `fetch_many` / `url`. |
| `Resource` / `Widgets` / `Gadgets` | Resource base and the placeholder resources. |
| `ParsedItem` = `ParsedOk[T] \| ParsedErr` | Per-row parse envelope (discriminate on `.ok`). |
| `ListResult` / `SearchResult` | Per-row results plus pagination / filter / sort info. |
| `PaginationInfo` / `SortInfo` / `FilterInfo` | Response envelope metadata. |
| `APIError` / `FilterError` | HTTP/transport errors and pre-request filter validation errors. |
