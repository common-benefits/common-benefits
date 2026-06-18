"""Scenario 4 - declarative mappings, no custom fields.

AUTHOR: map a source system onto the bare common model (``WidgetCommon``) with no custom
fields attached.
CONSUMER: run ``to_common`` and read the mapped base fields.

Run: ``python -m examples.mappings_only`` (or ``python -m examples`` for all scenarios).
"""

from __future__ import annotations

from common_benefits_sdk.extensions import (
    PluginMeta,
    PluginSchemas,
    define_plugin,
    schema,
)
from common_benefits_sdk.schemas.models import WidgetCommon

from .source import SAMPLE_WIDGET_SOURCE, SourceWidget

# --- Author -----------------------------------------------------------------------------
BARE_TO_COMMON = {
    "id": {"field": "widget_id"},
    "name": {"field": "widget_name"},
    "color": {"field": "colour"},
    "weight": {"field": "legacy_weight"},
}
BARE_FROM_COMMON = {
    "widget_id": {"field": "id"},
    "widget_name": {"field": "name"},
    "colour": {"field": "color"},
    "legacy_weight": {"field": "weight"},
}

bare_plugin = define_plugin(
    PluginSchemas(
        Widget=schema(
            source_schema=SourceWidget,
            common_schema=WidgetCommon,
            mappings={"to_common": BARE_TO_COMMON, "from_common": BARE_FROM_COMMON},
        )
    ),
    meta=PluginMeta(name="bare widget plugin", source_system="acme-widgets"),
)


# --- Consumer ---------------------------------------------------------------------------
def demo() -> None:
    print("Scenario 4 - mappings, no custom fields")

    # The bare WidgetCommon types its custom-fields container as the PEP 696 default, so we
    # read the mapped base fields here rather than asserting a custom-field type.
    result = bare_plugin.schemas.Widget.to_common(
        SourceWidget.model_validate(SAMPLE_WIDGET_SOURCE)
    )
    ok = result.result.name == "Conservation widget"
    print(f"  [{'PASS' if ok else 'FAIL'}] widget_name mapped to name")


if __name__ == "__main__":
    demo()
