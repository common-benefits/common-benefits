"""The composable success envelopes parse and type like the protocol shapes."""

from __future__ import annotations

from typing import assert_type

from common_benefits_sdk.client import Filtered, Ok, Paginated
from common_benefits_sdk.schemas.models import WidgetCommon

GOOD_WIDGET = {"id": "w-1", "name": "A", "color": "red", "weight": 5.0}


def test_ok_envelope_types_and_parses_data():
    ok = Ok[WidgetCommon].model_validate(
        {"status": 200, "message": "ok", "data": GOOD_WIDGET}
    )
    assert_type(ok.data, WidgetCommon)
    assert ok.data.name == "A"
    assert ok.status == 200


def test_paginated_items_are_typed():
    page = Paginated[WidgetCommon].model_validate(
        {
            "status": 200,
            "message": "ok",
            "items": [GOOD_WIDGET],
            "paginationInfo": {"page": 1, "pageSize": 1},
        }
    )
    assert_type(page.items, list[WidgetCommon])
    assert page.items[0].color == "red"


def test_filtered_carries_typed_filter_info_and_round_trips_camelcase():
    page = Filtered[WidgetCommon, dict].model_validate(
        {
            "status": 200,
            "message": "ok",
            "items": [GOOD_WIDGET],
            "paginationInfo": {
                "page": 1,
                "pageSize": 1,
                "totalItems": 1,
                "totalPages": 1,
            },
            "sortInfo": {"sortBy": "name", "sortOrder": "asc"},
            "filterInfo": {"filters": {"color": {"operator": "eq", "value": "red"}}},
        }
    )
    assert_type(page.items[0], WidgetCommon)
    assert_type(page.filter_info.filters, dict)
    assert page.filter_info.filters["color"] == {"operator": "eq", "value": "red"}
    # envelope serializes camelCase on the wire, matching the protocol / TS SDK
    assert set(page.model_dump(by_alias=True)) >= {
        "paginationInfo",
        "sortInfo",
        "filterInfo",
    }
