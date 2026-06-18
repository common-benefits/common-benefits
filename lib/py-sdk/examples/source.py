"""Sample source-system models and custom-field containers for the examples.

These stand in for an adopter's legacy schema (``SourceWidget`` / ``SourceGadget``) and the
typed custom-fields containers a plugin author declares (``WidgetFields`` / ``GadgetFields``).
"""

from __future__ import annotations

from typing import Optional

from pydantic import Field

from common_benefits_sdk.extensions import CustomField, CustomFieldSet
from common_benefits_sdk.schemas.base import CommonBenefitsBaseModel


# --- Typed custom-field value models ----------------------------------------------------


class LegacyRef(CommonBenefitsBaseModel):
    """A structured custom-field value (proves OBJECT-typed custom fields)."""

    system: str
    id: int


# --- Custom-field containers an author declares -----------------------------------------


class WidgetFields(CustomFieldSet):
    """Custom fields a Widget plugin adds. ``CustomField[V]`` is the single source of truth."""

    legacy_ref: Optional[CustomField[LegacyRef]] = Field(
        default=None, description="Reference to the legacy system record"
    )
    category: Optional[CustomField[str]] = Field(
        default=None, description="Widget category"
    )


class GadgetFields(CustomFieldSet):
    """Custom fields a Gadget plugin adds."""

    priority: Optional[CustomField[int]] = Field(
        default=None, description="Processing priority"
    )


# --- Legacy source-system models --------------------------------------------------------


class SourceWidget(CommonBenefitsBaseModel):
    """An adopter's native widget record, with field names that differ from the protocol."""

    widget_id: str
    widget_name: str
    colour: str
    legacy_weight: float
    legacy_system: str
    legacy_id: int
    category: str


class SourceGadget(CommonBenefitsBaseModel):
    """An adopter's native gadget record."""

    gadget_id: str
    gadget_label: str
    gadget_dimension: float
    gadget_priority: int


SAMPLE_WIDGET_SOURCE = {
    "widget_id": "w-1",
    "widget_name": "Conservation widget",
    "colour": "green",
    "legacy_weight": 12.5,
    "legacy_system": "legacy",
    "legacy_id": 42,
    "category": "eco",
}

SAMPLE_GADGET_SOURCE = {
    "gadget_id": "g-1",
    "gadget_label": "Sprocket",
    "gadget_dimension": 3.0,
    "gadget_priority": 3,
}
