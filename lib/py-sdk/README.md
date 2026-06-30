# common-benefits-sdk

The CommonBenefits protocol Python SDK: a codegen-free extensions framework, a typed HTTP
client, and custom filters. It mirrors the conceptual model of the TypeScript SDK
(`lib/ts-sdk`) using Pythonic patterns (Pydantic v2 + static typing), with **no codegen build
step**.

`Widget` and `Gadget` are placeholder extensible models standing in for real protocol models
(e.g. `Program`) until those land.

## Table of contents <!-- omit in toc -->

- [Installation](#installation)
- [Usage](#usage)
  - [Quick start](#quick-start)
  - [Kitchen sink example](#kitchen-sink-example)
- [Modules](#modules)
- [Development](#development)

## Installation

```bash
poetry add common-benefits-sdk   # once published; for now it is a workspace package
```

## Usage

### Quick start

```python
from common_benefits_sdk.client import Config
from common_benefits_sdk.extensions import PluginMeta, PluginSchemas, define_plugin
from common_benefits_sdk.schemas.filters import f

# 1. Define a plugin (no extensions here -- bare base models).
plugin = define_plugin(
    PluginSchemas(),
    meta=PluginMeta(name="demo", source_system="demo"),
)

# 2. Build a typed client.
client = plugin.get_client(Config(base_url="https://api.example.org", api_key="your-key"))

# 3. Search. Each row is wrapped in a ParsedItem so one bad record does not fail the batch.
result = client.widgets.search(filters={"color": f.eq("red")})
for row in result.items:
    if row.ok:
        print(f"{row.data.name} ({row.data.color})")
```

### Kitchen sink example

Custom fields, declarative transforms, a typed client, and registered route filters working
together:

```python
from typing import Optional, TypedDict

from pydantic import Field

from common_benefits_sdk.client import Config, ParsedOk
from common_benefits_sdk.extensions import (
    CustomField,
    CustomFieldSet,
    PluginMeta,
    PluginSchemas,
    ResourceRoutes,
    RouteFilters,
    Routes,
    define_plugin,
    schema,
)
from common_benefits_sdk.schemas.filters import StringArray, WidgetFilters, f
from common_benefits_sdk.schemas.models import WidgetCommon


# 1. Declare typed custom fields. CustomField[V] is the single source of truth:
#    field_type and the inspectable value type are derived from V.
class WidgetFields(CustomFieldSet):
    category: Optional[CustomField[str]] = Field(default=None, description="Widget category")
    priority: Optional[CustomField[int]] = Field(default=None, description="Priority")


# 2. Register a custom filter for the widgets search route (extends the standard filters).
class WidgetSearchFilters(WidgetFilters, total=False):
    region: StringArray


# 3. Assemble the plugin.
plugin = define_plugin(
    PluginSchemas(Widget=schema(common_schema=WidgetCommon[WidgetFields])),
    routes=Routes(widget=ResourceRoutes(search=RouteFilters[WidgetSearchFilters]())),
    meta=PluginMeta(name="acme", source_system="acme-widgets"),
)

# 4. Build a typed client and search. `color`/`weight` (standard) and `region` (registered)
#    autocomplete; unknown keys pass through to customFilters. No call-site type args.
client = plugin.get_client(Config(base_url="https://api.example.org"))
result = client.widgets.search(
    filters={"color": f.eq("red"), "region": f.in_(["PA", "NJ"])}
)

for row in result.items:
    if isinstance(row, ParsedOk):
        widget = row.data  # typed WidgetCommon[WidgetFields]
        if widget.custom_fields and widget.custom_fields.category:
            print(widget.custom_fields.category.value)  # typed str

# Rows that failed validation are isolated, not fatal.
for err in result.parse_errors:
    print(f"bad row: {err.loc} -> {err.msg}")
```

## Modules

The SDK is organized into modules under `common_benefits_sdk/`:

| Module                                                       | Import path                      | Description                                        |
| ------------------------------------------------------------ | -------------------------------- | -------------------------------------------------- |
| [Extensions](./src/common_benefits_sdk/extensions/README.md) | `common_benefits_sdk.extensions` | Custom fields, transforms, plugins, route filters  |
| [Client](./src/common_benefits_sdk/client/README.md)         | `common_benefits_sdk.client`     | Typed HTTP client with per-row parse results       |
| [Schemas](./src/common_benefits_sdk/schemas/README.md)       | `common_benefits_sdk.schemas`    | Pydantic models, custom fields, and filter helpers |

Runnable examples live in [`examples/`](./examples/README.md).

## Development

```sh
make install      # poetry install
make test         # pytest
make check-types  # pyright
make checks       # format + lint + pyright + tests
```

Type checking uses [pyright](https://microsoft.github.io/pyright/) (the engine behind Pylance
in VS Code), so the CLI matches the editor.
