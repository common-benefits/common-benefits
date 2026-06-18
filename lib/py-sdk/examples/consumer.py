"""Plugin CONSUMER samples with ``assert_type`` proving the concrete types.

Consumers use non-optional dot access on ``plugin.schemas.<Schema>``. Every registered schema
is always present: unextended ones fall back to a ``SchemaOnly`` (never ``None``). The typing
is identical regardless of how the author built the extension.
"""

from __future__ import annotations

from typing import assert_type

from common_benefits_sdk.extensions import (
    PluginCustomFieldSpec,
    SchemaOnly,
    TransformResult,
)
from common_benefits_sdk.schemas.models import GadgetCommon, WidgetCommon

from .author import (
    bare_plugin,
    functions_plugin,
    mappings_plugin,
    schema_only_plugin,
)
from .source import (
    GadgetFields,
    SourceGadget,
    SourceWidget,
    WidgetFields,
    SAMPLE_GADGET_SOURCE,
    SAMPLE_WIDGET_SOURCE,
)


def _check(label: str, ok: bool) -> None:
    print(f"  [{'PASS' if ok else 'FAIL'}] {label}")


def main() -> None:
    # Scenario 1 — custom fields + mappings
    print("Scenario 1 — custom fields + mappings")
    res1 = mappings_plugin.schemas.Widget.to_common(
        SourceWidget.model_validate(SAMPLE_WIDGET_SOURCE)
    )
    assert_type(res1, TransformResult[WidgetCommon[WidgetFields]])
    # The schema this plugin does not extend is present and non-optional, as the base:
    assert_type(mappings_plugin.schemas.Gadget, SchemaOnly[GadgetCommon])
    # Consumers can inspect the declared custom fields; field_type/value are derived from
    # CustomField[V], so they cannot drift:
    specs = mappings_plugin.schemas.Widget.custom_fields
    assert_type(specs, dict[str, PluginCustomFieldSpec])
    w = res1.result
    _check("no transform errors", res1.errors == [])
    if w.custom_fields and w.custom_fields.legacy_ref:
        assert_type(w.custom_fields.legacy_ref.value.system, str)
        assert_type(w.custom_fields.legacy_ref.value.id, int)
        _check(
            "legacy_ref.value.id typed int == 42",
            w.custom_fields.legacy_ref.value.id == 42,
        )
    back1 = mappings_plugin.schemas.Widget.from_common(w)
    assert_type(back1, TransformResult[SourceWidget])
    _check("round-trips legacy_id == 42", back1.result.legacy_id == 42)

    # Scenario 2 — custom fields + hand-written functions
    print("Scenario 2 — custom fields + hand-written functions")
    res2 = functions_plugin.schemas.Gadget.to_common(
        SourceGadget.model_validate(SAMPLE_GADGET_SOURCE)
    )
    assert_type(res2, TransformResult[GadgetCommon[GadgetFields]])
    g = res2.result
    if g.custom_fields and g.custom_fields.priority:
        assert_type(g.custom_fields.priority.value, int)
        _check("priority.value typed int == 3", g.custom_fields.priority.value == 3)
    back2 = functions_plugin.schemas.Gadget.from_common(g)
    assert_type(back2, TransformResult[SourceGadget])
    _check("round-trips priority == 3", back2.result.gadget_priority == 3)

    # Scenario 3 — mappings, no custom fields
    print("Scenario 3 — mappings, no custom fields")
    # Note: passing the bare ``WidgetCommon`` class types the CF param as ``Any`` under mypy
    # and as the PEP 696 default under pyright, so we runtime-check rather than assert_type
    # the CF parameter for the unparameterized case.
    res3 = bare_plugin.schemas.Widget.to_common(
        SourceWidget.model_validate(SAMPLE_WIDGET_SOURCE)
    )
    _check("name mapped", res3.result.name == "Conservation widget")

    # Scenario 4 — custom fields only, no transforms
    print("Scenario 4 — custom fields only, no transforms")
    record = {
        "id": "x",
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
    parsed = schema_only_plugin.schemas.Widget.parse(record)
    assert_type(parsed, WidgetCommon[WidgetFields])
    if parsed.custom_fields and parsed.custom_fields.legacy_ref:
        assert_type(parsed.custom_fields.legacy_ref.value.id, int)
        _check(
            "schema-only legacy_ref.value.id == 7",
            parsed.custom_fields.legacy_ref.value.id == 7,
        )


if __name__ == "__main__":
    main()
