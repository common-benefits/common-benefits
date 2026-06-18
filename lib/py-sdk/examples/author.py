"""Plugin AUTHOR samples: four ways to build schema extensions.

Each ``define_plugin(...)`` produces a fully-typed plugin singleton a consumer imports.
Schemas an author does not extend fall back to a ``SchemaOnly`` over the base model.
"""

from __future__ import annotations

from common_benefits_sdk.extensions import (
    PluginMeta,
    PluginSchemas,
    TransformResult,
    define_plugin,
    schema,
    validate_into,
)
from common_benefits_sdk.schemas.models import GadgetCommon, WidgetCommon

from .source import (
    GadgetFields,
    SourceGadget,
    SourceWidget,
    WidgetFields,
)

# --- Scenario 1: custom fields + declarative mappings -----------------------------------

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


# --- Scenario 2: custom fields + hand-written transform functions -----------------------


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


# --- Scenario 3: mappings, no custom fields ---------------------------------------------

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


# --- Scenario 4: custom fields only, no transforms --------------------------------------

schema_only_plugin = define_plugin(
    PluginSchemas(Widget=schema(common_schema=WidgetCommon[WidgetFields])),
    meta=PluginMeta(name="schema-only widget plugin", source_system="acme-widgets"),
)
