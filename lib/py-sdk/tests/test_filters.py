"""Tests for custom filters: f.* helpers, categorization, passthrough, and validation."""

from __future__ import annotations

import json
from typing import Any

import httpx
import pytest

from common_benefits_sdk.client import Config, FilterError
from common_benefits_sdk.schemas.filters import (
    NumberComparison,
    NumberRange,
    StringArray,
    StringComparison,
    f,
)

from examples.author import mappings_plugin


def test_f_helpers_build_typed_models():
    assert isinstance(f.eq("red"), StringComparison)
    assert f.eq("red").operator == "eq"
    assert f.eq("red").value == "red"
    assert isinstance(f.eq(5), NumberComparison)
    rng = f.between(1, 10)
    assert isinstance(rng, NumberRange)
    assert rng.value.min == 1 and rng.value.max == 10
    arr = f.in_(["a", "b"])
    assert isinstance(arr, StringArray)
    assert arr.operator == "in" and arr.value == ["a", "b"]


def _capture_client(captured: dict[str, Any]):
    def handler(req: httpx.Request) -> httpx.Response:
        if req.content:
            captured["body"] = json.loads(req.content)
        return httpx.Response(
            200,
            json={
                "items": [],
                "paginationInfo": {
                    "page": 1,
                    "pageSize": 0,
                    "totalItems": 0,
                    "totalPages": 1,
                },
            },
        )

    config = Config(
        base_url="https://example.test", transport=httpx.MockTransport(handler)
    )
    return mappings_plugin.get_client(config)


def test_standard_filters_route_to_top_level():
    captured: dict[str, Any] = {}
    with _capture_client(captured) as client:
        client.widgets.search(
            filters={"color": f.eq("red"), "weight": f.between(1, 10)}
        )

    filters = captured["body"]["filters"]
    assert filters["color"] == {"operator": "eq", "value": "red"}
    assert filters["weight"]["operator"] == "between"
    assert filters["weight"]["value"] == {"min": 1, "max": 10}
    assert "customFilters" not in filters  # both color and weight are standard


def test_unknown_filters_route_to_custom_filters():
    captured: dict[str, Any] = {}
    with _capture_client(captured) as client:
        client.widgets.search(
            filters={"color": f.eq("red"), "region": f.in_(["PA", "NJ"])}
        )

    filters = captured["body"]["filters"]
    assert filters["color"] == {"operator": "eq", "value": "red"}  # standard, top level
    assert filters["customFilters"]["region"] == {  # unknown, passed through
        "operator": "in",
        "value": ["PA", "NJ"],
    }


def test_ad_hoc_dict_filter_passes_through():
    captured: dict[str, Any] = {}
    with _capture_client(captured) as client:
        # A raw {operator, value} dict (not built via f.*) is accepted for an unknown key.
        client.widgets.search(filters={"tier": {"operator": "eq", "value": "gold"}})

    assert captured["body"]["filters"]["customFilters"]["tier"] == {
        "operator": "eq",
        "value": "gold",
    }


def test_invalid_filter_value_raises_before_request():
    captured: dict[str, Any] = {}
    with _capture_client(captured) as client:
        # color is a standard string-comparison filter; a number range is invalid for it.
        with pytest.raises(FilterError):
            client.widgets.search(filters={"color": f.between(1, 10)})
    assert "body" not in captured  # raised before any request was sent
