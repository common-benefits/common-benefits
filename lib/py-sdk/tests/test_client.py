"""Tests for the typed client: projection, per-row ParsedItem, and filter passthrough."""

from __future__ import annotations

import json
from typing import Any, Callable, assert_type

import httpx

from common_benefits_sdk.client import (
    Config,
    ListResult,
    ParsedErr,
    ParsedOk,
    SearchResult,
)
from common_benefits_sdk.schemas.filters import f
from common_benefits_sdk.schemas.models import WidgetCommon

from examples import bare_plugin, mappings_plugin
from examples.source import WidgetFields

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


def _client(plugin: Any, handler: Callable[[httpx.Request], httpx.Response]):
    config = Config(
        base_url="https://example.test", transport=httpx.MockTransport(handler)
    )
    return plugin.get_client(config)


def test_search_typed_and_isolates_bad_rows():
    def handler(_req: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=_page([GOOD_WIDGET, BAD_WIDGET]))

    with _client(mappings_plugin, handler) as client:
        res = client.widgets.search(
            filters={"color": {"operator": "eq", "value": "red"}}
        )

    assert isinstance(res, SearchResult)
    assert len(res.items) == 2

    ok = res.items[0]
    assert isinstance(ok, ParsedOk)
    assert ok.data.custom_fields is not None
    assert ok.data.custom_fields.legacy_ref is not None
    assert ok.data.custom_fields.legacy_ref.value.id == 7

    bad = res.items[1]
    assert isinstance(bad, ParsedErr)
    assert bad.raw == BAD_WIDGET
    assert res.parse_errors  # one bad row did not fail the whole response


def test_get_returns_parsed_item():
    def handler(_req: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"data": GOOD_WIDGET})

    with _client(mappings_plugin, handler) as client:
        item = client.widgets.get("w-1")

    assert isinstance(item, ParsedOk)
    assert item.data.id == "w-1"
    assert item.data.color == "red"


def test_list_parses_rows():
    def handler(_req: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=_page([GOOD_WIDGET]))

    with _client(mappings_plugin, handler) as client:
        res = client.widgets.list(page=1)

    assert isinstance(res, ListResult)
    assert len(res.items) == 1
    assert isinstance(res.items[0], ParsedOk)


def test_filters_pass_through_without_plugin():
    captured: dict[str, Any] = {}

    def handler(req: httpx.Request) -> httpx.Response:
        captured["body"] = json.loads(req.content)
        return httpx.Response(200, json=_page([GOOD_WIDGET]))

    # bare_plugin registers no Widget custom fields, yet an arbitrary filter passes through.
    with _client(bare_plugin, handler) as client:
        client.widgets.search(filters={"color": f.eq("red"), "region": f.in_(["PA"])})

    body = captured["body"]
    # "color" is a standard filter -> top level; "region" is unknown -> customFilters.
    assert body["filters"]["color"] == {"operator": "eq", "value": "red"}
    assert body["filters"]["customFilters"]["region"] == {
        "operator": "in",
        "value": ["PA"],
    }


def test_search_is_statically_typed():
    def handler(_req: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=_page([GOOD_WIDGET]))

    # Call get_client on the concrete plugin (not the Any-typed _client helper) so the
    # per-slot item type flows: this is the projection that assert_type below verifies.
    config = Config(
        base_url="https://example.test", transport=httpx.MockTransport(handler)
    )
    with mappings_plugin.get_client(config) as client:
        res = client.widgets.search()
        assert_type(res, SearchResult[WidgetCommon[WidgetFields]])
        row = res.items[0]
        if isinstance(row, ParsedOk):
            assert_type(row.data, WidgetCommon[WidgetFields])
