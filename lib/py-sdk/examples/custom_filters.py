"""Scenario 5 - custom fields + a registered custom filter.

AUTHOR: extend the resource's standard-filters TypedDict with a custom filter and register it
on the route via ``Routes`` / ``ResourceRoutes`` / ``RouteFilters``.
CONSUMER: get a typed client and call ``widgets.search(filters=...)``: the standard ``color``
key routes to the top level, the registered ``region`` and an ad hoc ``tier`` pass through to
``customFilters``, and rows are typed as the plugin's Widget model.

Run: ``python -m examples.custom_filters`` (or ``python -m examples`` for all scenarios).
"""

from __future__ import annotations

import json
from typing import Any, assert_type

import httpx

from common_benefits_sdk.client import Config, SearchResult
from common_benefits_sdk.extensions import (
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

from .source import WidgetFields


# --- Author -----------------------------------------------------------------------------
# Extend the standard WidgetFilters with the custom filter, then name it in routes so
# `region` autocompletes (and is value-typed) on widgets.search.
class WidgetSearchFilters(WidgetFilters, total=False):
    region: StringArray


routes_plugin = define_plugin(
    schemas=PluginSchemas(Widget=schema(common_schema=WidgetCommon[WidgetFields])),
    routes=Routes(widget=ResourceRoutes(search=RouteFilters[WidgetSearchFilters]())),
    meta=PluginMeta(name="widget routes plugin", source_system="acme-widgets"),
)


# --- Consumer ---------------------------------------------------------------------------
def _page() -> dict:
    return {
        "items": [{"id": "w-1", "name": "Red", "color": "red", "weight": 5.0}],
        "paginationInfo": {"page": 1, "pageSize": 1, "totalItems": 1, "totalPages": 1},
    }


def demo() -> None:
    print("Scenario 5 - custom fields + a registered custom filter")

    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["filters"] = json.loads(request.content)["filters"]
        return httpx.Response(200, json=_page())

    config = Config(
        base_url="https://example.test", transport=httpx.MockTransport(handler)
    )
    with routes_plugin.get_client(config) as client:
        result = client.widgets.search(
            filters={
                "color": f.eq("red"),  # standard -> top level
                "region": f.in_(["PA", "CA"]),  # registered custom -> customFilters
                "tier": f.eq("gold"),  # ad hoc -> customFilters (passthrough)
            }
        )
        # Rows are typed as the plugin's Widget model, no call-site annotations.
        assert_type(result, SearchResult[WidgetCommon[WidgetFields]])

    filters = captured["filters"]
    top_level = "color" in filters and "region" not in filters
    passed_through = set(filters.get("customFilters", {})) == {"region", "tier"}
    print(
        f"  [{'PASS' if top_level else 'FAIL'}] standard color routed to the top level"
    )
    print(
        f"  [{'PASS' if passed_through else 'FAIL'}] region (registered) + tier (ad hoc) -> customFilters"
    )


if __name__ == "__main__":
    demo()
