"""Base model shared by CommonBenefits schemas."""

from pydantic import BaseModel, ConfigDict


class CommonBenefitsBaseModel(BaseModel):
    """Base model with shared configuration for CommonBenefits models.

    ``strict=False`` lets values coerce (strings to enums, numbers, datetimes), matching
    the lenient parsing the protocol expects on the wire.
    """

    model_config = ConfigDict(
        from_attributes=True,
        strict=False,
    )
