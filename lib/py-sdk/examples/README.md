# Examples

Runnable, offline examples. The client examples use an `httpx.MockTransport`, so no network
or running API is needed.

## Running

```sh
poetry install

# Author + consumer extension samples (transforms, custom fields, schema-only), with
# assert_type checks that pyright verifies:
poetry run python -m examples.consumer

# The typed client end to end: search returns typed rows, one bad row is isolated, and
# custom filters pass through with no plugin:
poetry run python -m examples.client_demo
```

## Files

| File                                 | What it shows                                                                                                                                              |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`source.py`](./source.py)           | Sample source-system models (`SourceWidget`, `SourceGadget`) and typed custom-field containers (`WidgetFields`, `GadgetFields`).                           |
| [`author.py`](./author.py)           | Five ways to build a plugin: mappings + custom fields, hand-written transforms + custom fields, mappings only, schema-only, and route-filter registration. |
| [`consumer.py`](./consumer.py)       | The consumer side: non-optional dot access, typed custom fields, round-trip transforms, and schema-only `parse()`, with `assert_type` lines.               |
| [`client_demo.py`](./client_demo.py) | `plugin.get_client(...).widgets.search(...)` over a stubbed transport: typed rows, per-row parse errors, and plugin-free filter passthrough.               |

The same flows are covered by the test suite (`tests/`); run `make test` to execute them, or
`make checks` to also run formatting, linting, and `pyright`.
