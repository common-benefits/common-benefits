# Examples

Runnable, offline examples, one file per scenario. Each file has an **Author** section (build
the plugin) and a **Consumer** section (use it, with `assert_type` lines pyright verifies); the
custom-filters scenario uses an `httpx.MockTransport`, so no network or running API is needed.

## Running

```sh
poetry install

python -m examples                  # run every scenario in order
python -m examples.custom_filters   # run one scenario
```

## Scenarios

| #   | File                                                         | Author shows                            | Consumer shows                                                                                          |
| --- | ------------------------------------------------------------ | --------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 1   | [`custom_fields.py`](./custom_fields.py)                     | custom fields only, no transforms       | `parse()` a record, typed custom-field access                                                           |
| 2   | [`custom_fields_mappings.py`](./custom_fields_mappings.py)   | custom fields + declarative mappings    | `to_common` / `from_common`, typed field, round-trip                                                    |
| 3   | [`custom_fields_functions.py`](./custom_fields_functions.py) | custom fields + hand-written transforms | hand-written `to_common` / `from_common`, round-trip                                                    |
| 4   | [`mappings_only.py`](./mappings_only.py)                     | declarative mappings, no custom fields  | mapped base fields                                                                                      |
| 5   | [`custom_filters.py`](./custom_filters.py)                   | register a custom filter on a route     | typed `client.widgets.search(...)`: standard key top-level, registered + ad hoc keys to `customFilters` |

[`source.py`](./source.py) holds the shared sample source-system models (`SourceWidget`,
`SourceGadget`) and the typed custom-field containers (`WidgetFields`, `GadgetFields`).

The same flows are covered by the test suite (`tests/`); run `make test` to execute them, or
`make checks` to also run formatting, linting, and `pyright`.
