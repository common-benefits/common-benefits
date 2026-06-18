"""Scenario 2 - custom fields + declarative mappings.

AUTHOR: attach custom fields and compile source <-> common transforms from declarative
``mappings`` (no hand-written functions).
CONSUMER: run ``to_common`` / ``from_common``, read the typed custom field, and round-trip.

Run: ``python -m examples.custom_fields_mappings`` (or ``python -m examples`` for all).
"""

from __future__ import annotations

from typing import assert_type

from common_benefits_sdk.extensions import (
    PluginMeta,
    PluginSchemas,
    TransformResult,
    define_plugin,
    schema,
)
from common_benefits_sdk.schemas.models import WidgetCommon

from .source import SAMPLE_WIDGET_SOURCE, SourceWidget, WidgetFields

# --- Author -----------------------------------------------------------------------------
WIDGET_TO_COMMON = {
    "id": {"field": "widget_id"},
    "name": {"field": "widget_name"},
    "color": {"field": "colour"},
    "weight": {"field": "legacy_weight"},
    "customFields": {
        "legacyRef": {
            "name": {"const": "legacy_ref"},
            "fieldType": {"const": "object"},
            "value": {
                "system": {"field": "legacy_system"},
                "id": {"field": "legacy_id"},
            },
        },
        "category": {
            "name": {"const": "category"},
            "fieldType": {"const": "string"},
            "value": {"field": "category"},
        },
    },
}

WIDGET_FROM_COMMON = {
    "widget_id": {"field": "id"},
    "widget_name": {"field": "name"},
    "colour": {"field": "color"},
    "legacy_weight": {"field": "weight"},
    "legacy_system": {"field": "customFields.legacyRef.value.system"},
    "legacy_id": {"field": "customFields.legacyRef.value.id"},
    "category": {"field": "customFields.category.value"},
}

mappings_plugin = define_plugin(
    PluginSchemas(
        Widget=schema(
            source_schema=SourceWidget,
            common_schema=WidgetCommon[WidgetFields],
            mappings={"to_common": WIDGET_TO_COMMON, "from_common": WIDGET_FROM_COMMON},
        )
    ),
    meta=PluginMeta(name="widget mappings plugin", source_system="acme-widgets"),
)


# --- Consumer ---------------------------------------------------------------------------
def demo() -> None:
    print("Scenario 2 - custom fields + declarative mappings")

    result = mappings_plugin.schemas.Widget.to_common(
        SourceWidget.model_validate(SAMPLE_WIDGET_SOURCE)
    )
    assert_type(result, TransformResult[WidgetCommon[WidgetFields]])
    print(f"  [{'PASS' if result.errors == [] else 'FAIL'}] to_common had no errors")

    widget = result.result
    if widget.custom_fields and widget.custom_fields.legacy_ref:
        assert_type(widget.custom_fields.legacy_ref.value.id, int)
        ok = widget.custom_fields.legacy_ref.value.id == 42
        print(f"  [{'PASS' if ok else 'FAIL'}] legacy_ref.value.id typed int == 42")

    back = mappings_plugin.schemas.Widget.from_common(widget)
    assert_type(back, TransformResult[SourceWidget])
    ok = back.result.legacy_id == 42
    print(f"  [{'PASS' if ok else 'FAIL'}] round-trips back to legacy_id == 42")


if __name__ == "__main__":
    demo()
