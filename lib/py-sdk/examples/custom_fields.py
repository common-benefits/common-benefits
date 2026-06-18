"""Scenario 1 - custom fields only (no transforms).

AUTHOR: register a typed ``CustomFieldSet`` on a schema via ``schema(common_schema=...)``.
CONSUMER: parse a record and read the custom-field value with non-optional, typed dot access.

Run: ``python -m examples.custom_fields`` (or ``python -m examples`` for all scenarios).
"""

from __future__ import annotations

from typing import assert_type

from common_benefits_sdk.extensions import (
    PluginMeta,
    PluginSchemas,
    define_plugin,
    schema,
)
from common_benefits_sdk.schemas.models import WidgetCommon

from .source import WidgetFields

# --- Author -----------------------------------------------------------------------------
# No source schema and no transforms: just attach the typed custom fields to Widget.
schema_only_plugin = define_plugin(
    PluginSchemas(Widget=schema(common_schema=WidgetCommon[WidgetFields])),
    meta=PluginMeta(name="schema-only widget plugin", source_system="acme-widgets"),
)


# --- Consumer ---------------------------------------------------------------------------
def demo() -> None:
    print("Scenario 1 - custom fields only")

    record = {
        "id": "w-1",
        "name": "Direct",
        "color": "blue",
        "weight": 1.0,
        "customFields": {
            "legacyRef": {
                "name": "legacy_ref",
                "fieldType": "object",
                "value": {"system": "legacy", "id": 7},
            }
        },
    }
    widget = schema_only_plugin.schemas.Widget.parse(record)
    assert_type(widget, WidgetCommon[WidgetFields])

    if widget.custom_fields and widget.custom_fields.legacy_ref:
        # `value` is typed from CustomField[LegacyRef]: `.id` is int, `.system` is str.
        assert_type(widget.custom_fields.legacy_ref.value.id, int)
        ok = widget.custom_fields.legacy_ref.value.id == 7
        print(f"  [{'PASS' if ok else 'FAIL'}] legacy_ref.value.id typed int == 7")


if __name__ == "__main__":
    demo()
