"""Placeholder extensible models: ``WidgetCommon`` and ``GadgetCommon``.

These stand in for real protocol models (e.g. ``Program``) until those land, mirroring
``ts-sdk/src/schemas/widget.ts`` and ``gadget.ts``. Each is a Pydantic generic over its
custom-fields container ``CF``, so ``WidgetCommon[WidgetFields]`` is a fully concrete type
the checker understands with no codegen. ``CF`` defaults to ``dict[str, CustomField]``, so
the bare ``WidgetCommon`` keeps the protocol's untyped custom-fields behavior.
"""

from __future__ import annotations

from typing import Generic, Optional

import typing_extensions as te
from pydantic import AliasGenerator, ConfigDict, Field
from pydantic.alias_generators import to_camel

from .base import CommonBenefitsBaseModel
from .fields import CustomField

CF = te.TypeVar("CF", default="dict[str, CustomField]")


class _ExtensibleModel(CommonBenefitsBaseModel):
    """Common config for extensible models: camelCase on the wire, snake_case in code."""

    model_config = ConfigDict(
        alias_generator=AliasGenerator(
            validation_alias=to_camel,
            serialization_alias=to_camel,
        ),
        populate_by_name=True,
    )


class WidgetCommon(_ExtensibleModel, Generic[CF]):
    """The common Widget model, generic over its custom-fields container."""

    id: str = Field(..., description="Unique identifier for the widget")
    name: str = Field(..., description="Human-readable widget name")
    color: str = Field(
        ..., description="Widget color (a sample filterable string field)"
    )
    weight: float = Field(
        ..., description="Widget weight (a sample filterable number field)"
    )
    custom_fields: Optional[CF] = Field(
        default=None, description="Adopter-defined custom fields, keyed by field name"
    )


class GadgetCommon(_ExtensibleModel, Generic[CF]):
    """The common Gadget model (distinct shape from Widget)."""

    id: str = Field(..., description="Unique identifier for the gadget")
    label: str = Field(..., description="Human-readable gadget label")
    size: float = Field(..., description="Gadget size (distinct from Widget's weight)")
    custom_fields: Optional[CF] = Field(
        default=None, description="Adopter-defined custom fields, keyed by field name"
    )


__all__ = ["WidgetCommon", "GadgetCommon"]
