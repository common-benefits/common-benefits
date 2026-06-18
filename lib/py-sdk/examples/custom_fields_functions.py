"""Scenario 3 - custom fields + hand-written transform functions.

AUTHOR: attach custom fields and provide hand-written ``to_common`` / ``from_common`` (using
``validate_into`` so failures aggregate into ``TransformResult.errors`` rather than raising).
CONSUMER: run the transforms, read the typed custom field, and round-trip.

Run: ``python -m examples.custom_fields_functions`` (or ``python -m examples`` for all).
"""

from __future__ import annotations

from typing import assert_type

from common_benefits_sdk.extensions import (
    PluginMeta,
    PluginSchemas,
    TransformResult,
    define_plugin,
    schema,
    validate_into,
)
from common_benefits_sdk.schemas.models import GadgetCommon

from .source import SAMPLE_GADGET_SOURCE, GadgetFields, SourceGadget


# --- Author -----------------------------------------------------------------------------
def gadget_to_common(src: SourceGadget) -> TransformResult[GadgetCommon[GadgetFields]]:
    return validate_into(
        GadgetCommon[GadgetFields],
        {
            "id": src.gadget_id,
            "label": src.gadget_label,
            "size": src.gadget_dimension,
            "customFields": {
                "priority": {
                    "name": "priority",
                    "fieldType": "integer",
                    "value": src.gadget_priority,
                }
            },
        },
    )


def gadget_from_common(
    common: GadgetCommon[GadgetFields],
) -> TransformResult[SourceGadget]:
    priority = (
        common.custom_fields.priority.value
        if common.custom_fields and common.custom_fields.priority
        else None
    )
    return validate_into(
        SourceGadget,
        {
            "gadget_id": common.id,
            "gadget_label": common.label,
            "gadget_dimension": common.size,
            "gadget_priority": priority,
        },
    )


functions_plugin = define_plugin(
    PluginSchemas(
        Gadget=schema(
            source_schema=SourceGadget,
            common_schema=GadgetCommon[GadgetFields],
            to_common=gadget_to_common,
            from_common=gadget_from_common,
        )
    ),
    meta=PluginMeta(name="gadget functions plugin", source_system="acme-gadgets"),
)


# --- Consumer ---------------------------------------------------------------------------
def demo() -> None:
    print("Scenario 3 - custom fields + hand-written transforms")

    result = functions_plugin.schemas.Gadget.to_common(
        SourceGadget.model_validate(SAMPLE_GADGET_SOURCE)
    )
    assert_type(result, TransformResult[GadgetCommon[GadgetFields]])

    gadget = result.result
    if gadget.custom_fields and gadget.custom_fields.priority:
        assert_type(gadget.custom_fields.priority.value, int)
        ok = gadget.custom_fields.priority.value == 3
        print(f"  [{'PASS' if ok else 'FAIL'}] priority.value typed int == 3")

    back = functions_plugin.schemas.Gadget.from_common(gadget)
    assert_type(back, TransformResult[SourceGadget])
    ok = back.result.gadget_priority == 3
    print(f"  [{'PASS' if ok else 'FAIL'}] round-trips back to gadget_priority == 3")


if __name__ == "__main__":
    demo()
