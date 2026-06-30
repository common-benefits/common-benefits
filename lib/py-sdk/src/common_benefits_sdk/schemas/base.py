"""Base model shared by CommonBenefits schemas."""

from pydantic import AliasGenerator, BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CommonBenefitsBaseModel(BaseModel):
    """Base model for CommonBenefits protocol models: camelCase wire, snake_case code.

    The alias generator means models declare snake_case fields (``custom_fields``) and
    round-trip camelCase JSON (``customFields``) with no per-field aliases. A field that
    needs a non-derivable wire name (e.g. ``schema_url`` -> ``schema``) sets its own alias,
    which overrides the generator. ``populate_by_name`` keeps field-name construction
    type-checking; ``strict=False`` coerces values (strings to enums, numbers, datetimes)
    as the wire expects.
    """

    model_config = ConfigDict(
        alias_generator=AliasGenerator(
            validation_alias=to_camel,
            serialization_alias=to_camel,
        ),
        populate_by_name=True,
        from_attributes=True,
        strict=False,
    )
