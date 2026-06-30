"""Custom field primitives: ``CustomFieldType`` and the generic ``CustomField[V]``."""

from enum import StrEnum
from typing import Any, Generic, Optional

import typing_extensions as te
from pydantic import Field, HttpUrl

from .base import CommonBenefitsBaseModel


class CustomFieldType(StrEnum):
    """The JSON-schema type tag for a custom field's value."""

    STRING = "string"
    NUMBER = "number"
    INTEGER = "integer"
    BOOLEAN = "boolean"
    OBJECT = "object"
    ARRAY = "array"


V = te.TypeVar("V", default=Any)


class CustomField(CommonBenefitsBaseModel, Generic[V]):
    """A custom field with type information and a typed value.

    Generic over its value type ``V`` (default ``Any``): the bare ``CustomField`` keeps
    the protocol's untyped-value behavior, while ``CustomField[int]`` (or a Pydantic
    model) gives authors and consumers a concrete, inspectable ``value`` type. camelCase
    wire names (``fieldType``) come from the base model's alias generator; ``schema_url``
    sets an explicit ``schema`` alias because that name is not derivable from the field.
    """

    name: str = Field(..., description="Name of the custom field", min_length=1)
    field_type: CustomFieldType = Field(
        ...,
        description="The JSON schema type used when de-serializing the `value` field",
    )
    schema_url: Optional[HttpUrl] = Field(
        None,
        validation_alias="schema",
        serialization_alias="schema",
        description="Link to the full JSON schema for this custom field",
    )
    value: V = Field(..., description="Value of the custom field")
    description: Optional[str] = Field(
        None, description="Description of the custom field's purpose"
    )


__all__ = ["CustomFieldType", "CustomField"]
