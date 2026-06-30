"""Tests for get_custom_field_value (defensive custom-field reads)."""

from __future__ import annotations

from typing import Optional, assert_type

from common_benefits_sdk.extensions import get_custom_field_value
from common_benefits_sdk.schemas.models import WidgetCommon

WITH_FIELDS = {
    "id": "w-1",
    "name": "A",
    "color": "red",
    "weight": 5.0,
    "customFields": {
        "priority": {"name": "priority", "fieldType": "integer", "value": 3},
    },
}


def test_reads_and_validates_a_present_value():
    widget = WidgetCommon.model_validate(WITH_FIELDS)
    value = get_custom_field_value(widget, "priority", int)
    assert_type(value, Optional[int])
    assert value == 3


def test_returns_none_for_missing_field_or_no_custom_fields():
    widget = WidgetCommon.model_validate(WITH_FIELDS)
    assert get_custom_field_value(widget, "absent", int) is None

    bare = WidgetCommon.model_validate(
        {"id": "w-2", "name": "B", "color": "blue", "weight": 1.0}
    )
    assert get_custom_field_value(bare, "priority", int) is None
