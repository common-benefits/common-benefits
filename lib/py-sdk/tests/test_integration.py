"""End-to-end integration: define a plugin, get a client, transform, search, filter.

Mirrors the TS SDK's define-plugin spec: custom fields typed on returned items, filters
validated at the call site, per-row parse errors surfaced, transforms round-trip both ways.
"""

from __future__ import annotations

import json
from typing import Any

import httpx
import pytest

from common_benefits_sdk.client import Config, FilterError, ParsedErr, ParsedOk
from common_benefits_sdk.schemas.filters import f

from examples.author import mappings_plugin
from examples.source import SAMPLE_WIDGET_SOURCE, SourceWidget

GOOD = {
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
BAD = {"id": "w-2", "name": "Broken"}  # missing color / weight


def _page(items: list[dict]) -> dict:
    return {
        "items": items,
        "paginationInfo": {
            "page": 1,
            "pageSize": len(items),
            "totalItems": len(items),
            "totalPages": 1,
        },
        "filterInfo": {"filters": {}, "errors": []},
        "sortInfo": {"sortBy": "name", "sortOrder": "asc"},
    }


def _client(handler):
    config = Config(
        base_url="https://example.test", transport=httpx.MockTransport(handler)
    )
    return mappings_plugin.get_client(config)


def test_transforms_round_trip_both_directions():
    widget = mappings_plugin.schemas.Widget
    to = widget.to_common(SourceWidget.model_validate(SAMPLE_WIDGET_SOURCE))
    assert to.errors == []
    assert to.result.custom_fields is not None
    assert to.result.custom_fields.legacy_ref is not None
    assert to.result.custom_fields.legacy_ref.value.id == 42

    back = widget.from_common(to.result)
    assert back.errors == []
    assert back.result.legacy_id == 42
    assert back.result.colour == "green"


def test_client_rows_typed_with_custom_fields_and_bad_rows_isolated():
    def handler(_req: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=_page([GOOD, BAD]))

    with _client(handler) as client:
        result = client.widgets.search(filters={"color": f.eq("red")})

    assert len(result.items) == 2
    ok = result.items[0]
    assert isinstance(ok, ParsedOk)
    assert ok.data.custom_fields is not None
    assert ok.data.custom_fields.category is not None
    assert ok.data.custom_fields.category.value == "eco"  # typed custom field

    assert isinstance(result.items[1], ParsedErr)  # one bad row did not fail the batch
    assert result.parse_errors


def test_filters_validated_at_call_site():
    def handler(_req: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=_page([GOOD]))

    with _client(handler) as client:
        with pytest.raises(FilterError):
            # color is a string-comparison filter; a number range is invalid for it.
            client.widgets.search(filters={"color": f.between(1, 10)})


def test_unknown_filter_passes_through_to_custom_filters():
    captured: dict[str, Any] = {}

    def handler(req: httpx.Request) -> httpx.Response:
        captured["body"] = json.loads(req.content) if req.content else None
        return httpx.Response(200, json=_page([GOOD]))

    with _client(handler) as client:
        client.widgets.search(filters={"region": f.in_(["PA"])})

    assert captured["body"]["filters"]["customFilters"]["region"] == {
        "operator": "in",
        "value": ["PA"],
    }
