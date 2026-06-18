# CommonBenefits Python SDK

A Python SDK for the CommonBenefits protocol, mirroring the conceptual model of the
TypeScript SDK (`lib/ts-sdk`) with Pythonic patterns and **no codegen build step**.

It has three layers:

- **`extensions/`** — plugin authors declare schema extensions (custom fields and transforms)
  with the `schema(...)` factory and assemble them with `define_plugin(...)`. `CustomField[V]`
  is the single source of truth for a custom field: its `field_type` and inspectable value type
  are derived from `V`, so they cannot drift. Adapted from the codegen-free extensions design in
  the CommonGrants Python SDK.
- **`client/`** — a typed client. `plugin.get_client(config).widgets.search(filters=...)` returns
  rows typed as the plugin's common model (custom fields included), each wrapped in a per-row
  `ParsedItem` so one bad record does not fail the whole response.
- **filters** — a single inline `filters` dict at the call site. Registered keys are typed and
  validated; unrecognized keys pass through to `customFilters`, so a consumer can send custom
  filters a target API supports even with no plugin registered.

`Widget` and `Gadget` are placeholder extensible models standing in for real protocol models
(e.g. `Program`) until those land.

## Development

```sh
make install      # poetry install
make test         # pytest
make check-types  # pyright
make checks       # format + lint + pyright + tests
```

Type checking uses [pyright](https://microsoft.github.io/pyright/) (the same engine behind
Pylance in VS Code), so the CLI matches the editor. It handles the SDK's generics (PEP 695/696
defaults, overload resolution, pydantic `populate_by_name` aliases) where mypy and the newer
pyrefly currently fall short.
