"""Tests for the extensions core: transforms, custom-field inspection, and validation."""

from __future__ import annotations

from typing import Any, cast

import pytest

from common_benefits_sdk.extensions import (
    CustomField,
    CustomFieldSet,
    PluginDefinitionError,
    PluginMeta,
    PluginSchemas,
    SchemaOnly,
    define_plugin,
    schema,
)
from common_benefits_sdk.schemas.fields import CustomFieldType
from common_benefits_sdk.schemas.models import GadgetCommon, WidgetCommon

from examples.author import (
    bare_plugin,
    functions_plugin,
    mappings_plugin,
    schema_only_plugin,
)
from examples.source import (
    SourceGadget,
    SourceWidget,
    SAMPLE_GADGET_SOURCE,
    SAMPLE_WIDGET_SOURCE,
)


def test_mappings_to_common_typed_and_round_trips():
    res = mappings_plugin.schemas.Widget.to_common(
        SourceWidget.model_validate(SAMPLE_WIDGET_SOURCE)
    )
    assert res.errors == []
    w = res.result
    assert w.name == "Conservation widget"
    assert w.custom_fields is not None
    assert w.custom_fields.legacy_ref is not None
    assert w.custom_fields.legacy_ref.value.id == 42
    assert w.custom_fields.legacy_ref.value.system == "legacy"
    assert w.custom_fields.category is not None
    assert w.custom_fields.category.value == "eco"

    back = mappings_plugin.schemas.Widget.from_common(w)
    assert back.errors == []
    assert back.result.legacy_id == 42
    assert back.result.colour == "green"


def test_functions_round_trip():
    res = functions_plugin.schemas.Gadget.to_common(
        SourceGadget.model_validate(SAMPLE_GADGET_SOURCE)
    )
    assert res.errors == []
    g = res.result
    assert g.custom_fields is not None
    assert g.custom_fields.priority is not None
    assert g.custom_fields.priority.value == 3

    back = functions_plugin.schemas.Gadget.from_common(g)
    assert back.errors == []
    assert back.result.gadget_priority == 3


def test_bare_mappings_no_custom_fields():
    res = bare_plugin.schemas.Widget.to_common(
        SourceWidget.model_validate(SAMPLE_WIDGET_SOURCE)
    )
    assert res.errors == []
    assert res.result.weight == 12.5


def test_unextended_slot_falls_back_to_schema_only():
    assert isinstance(mappings_plugin.schemas.Gadget, SchemaOnly)
    assert mappings_plugin.schemas.Gadget.schema_name == "Gadget"


def test_custom_field_specs_derived_from_value_type():
    specs = mappings_plugin.schemas.Widget.custom_fields
    assert specs["legacy_ref"].field_type == CustomFieldType.OBJECT
    assert specs["category"].field_type == CustomFieldType.STRING


def test_schema_only_parse_typed_value():
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
    assert parsed.custom_fields is not None
    assert parsed.custom_fields.legacy_ref is not None
    assert parsed.custom_fields.legacy_ref.value.id == 7


def test_unregistered_base_rejected():
    class NotRegistered(WidgetCommon):  # not in EXTENSIBLE_SCHEMA_MAP
        pass

    with pytest.raises(PluginDefinitionError):
        schema(common_schema=NotRegistered)


def test_unmappable_custom_field_value_rejected():
    # bytes is a valid pydantic value type, but does not map to a CustomFieldType,
    # so schema(...) should reject it with an aggregated PluginDefinitionError.
    class BadFields(CustomFieldSet):
        thing: CustomField[bytes] | None = None

    with pytest.raises(PluginDefinitionError):
        schema(common_schema=WidgetCommon[BadFields])


def test_mappings_unknown_output_field_rejected():
    with pytest.raises((PluginDefinitionError, ValueError)):
        schema(
            source_schema=SourceWidget,
            common_schema=WidgetCommon,
            mappings={
                "to_common": {"not_a_field": {"field": "widget_id"}},
                "from_common": {},
            },
        )


def test_define_plugin_rejects_mismatched_slot():
    widget_ext = schema(common_schema=WidgetCommon)
    # Deliberately put a Widget extension in the Gadget slot (cast bypasses the static
    # guard that correctly forbids this) to exercise the runtime name-match check.
    bad = PluginSchemas(Gadget=cast(Any, widget_ext))
    with pytest.raises(PluginDefinitionError):
        define_plugin(bad, meta=PluginMeta(name="bad", source_system="x"))


def test_gadget_default_is_gadget_schema_only():
    assert isinstance(functions_plugin.schemas.Widget, SchemaOnly)
    assert functions_plugin.schemas.Widget.common_schema is WidgetCommon
    assert (
        functions_plugin.schemas.Gadget.common_schema is not GadgetCommon
    )  # parameterized
