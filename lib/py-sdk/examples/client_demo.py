"""Offline CLIENT demo: ``plugin.get_client(...).widgets.search(...)`` with a stub transport.

Shows the Phase 2 result: the client's rows are typed as the plugin's Widget common model
(custom fields included) with no call-site annotations; one malformed row surfaces as a
per-row error; and custom filters pass through even on a plugin with no extensions.

Run: python -m examples.client_demo
"""

from __future__ import annotations

from typing import Optional, assert_type

import httpx

from common_benefits_sdk.client import Config, ParsedOk, SearchResult
from common_benefits_sdk.schemas.models import WidgetCommon

from .author import bare_plugin, mappings_plugin
from .source import WidgetFields

GOOD_WIDGET = {
    "id": "w-1",
    "name": "Red widget",
    "color": "red",
    "weight": 5.0,
    "customFields": {
        "legacyRef": {
            "name": "legacy_ref",
            "fieldType": "object",
            "value": {"system": "legacy", "id": 7},
        },
        "category": {"name": "category", "fieldType": "string", "value": "eco"},
    },
}
BAD_WIDGET = {"id": "w-2", "name": "Broken"}  # missing required color / weight


def _page(items: list[dict]) -> dict:
    return {
        "items": items,
        "paginationInfo": {
            "page": 1,
            "pageSize": len(items),
            "totalItems": len(items),
            "totalPages": 1,
        },
        "sortInfo": {"sortBy": "name", "sortOrder": "asc"},
        "filterInfo": {"filters": {}, "errors": []},
    }


def _handler(request: httpx.Request) -> httpx.Response:
    return httpx.Response(200, json=_page([GOOD_WIDGET, BAD_WIDGET]))


def _check(label: str, ok: bool) -> None:
    print(f"  [{'PASS' if ok else 'FAIL'}] {label}")


def _config() -> Config:
    return Config(
        base_url="https://example.test", transport=httpx.MockTransport(_handler)
    )


def main() -> None:
    print("Client demo — typed search with a plugin's custom fields")
    with mappings_plugin.get_client(_config()) as client:
        result = client.widgets.search(
            filters={"color": {"operator": "eq", "value": "red"}}
        )
        assert_type(result, SearchResult[WidgetCommon[WidgetFields]])

        first = result.items[0]
        if isinstance(first, ParsedOk):
            assert_type(first.data, WidgetCommon[WidgetFields])
            cf: Optional[WidgetFields] = first.data.custom_fields
            assert_type(cf, Optional[WidgetFields])
            _check(
                "row 0 typed custom field legacy_ref.value.id == 7",
                bool(cf and cf.legacy_ref and cf.legacy_ref.value.id == 7),
            )
        _check(
            "one malformed row surfaced as a parse error", len(result.parse_errors) > 0
        )

    print("Client demo — custom filter passthrough with no plugin extension")
    with bare_plugin.get_client(_config()) as client2:
        result2 = client2.widgets.search(
            filters={"region": {"operator": "in", "value": ["PA", "NJ"]}}
        )
        _check("passthrough search returned rows", len(result2.items) > 0)


if __name__ == "__main__":
    main()
