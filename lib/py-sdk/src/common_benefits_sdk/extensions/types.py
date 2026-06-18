"""Plugin framework types for the CommonBenefits SDK."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Callable, Generic, Literal, TypeVar

from pydantic import BaseModel, ConfigDict

from ..schemas.base import CommonBenefitsBaseModel

T = TypeVar("T")

# Capability enum kept as a Literal (rather than StrEnum) to stay JSON-safe.
PluginCapability = Literal["customFields", "customFilters", "transforms"]

# A mapping handler: (data, handler_arg) -> value.
Handler = Callable[[Any, Any], Any]


class PassthroughModel(BaseModel):
    """Permissive source schema that preserves the input dict as-is.

    Validates only that the input is a mapping and preserves arbitrary keys
    (``extra="allow"``). Use it as a ``source_schema`` to satisfy the source-schema
    requirement without modeling the source-system shape (e.g. in tests or early
    development).
    """

    model_config = ConfigDict(extra="allow")


class TransformError(Exception):
    """Structured transformation error.

    Carries field path, handler name, source value, and underlying cause so consumers
    can reason about failures programmatically without parsing error text.

    Note: ``source_value`` may contain sensitive data when transforming real records;
    adopters are responsible for redacting it before logging. The SDK does not redact.
    """

    def __init__(
        self,
        message: str,
        *,
        path: str | None = None,
        handler: str | None = None,
        source_value: Any = None,
        cause: BaseException | None = None,
    ) -> None:
        super().__init__(message)
        self.path = path
        self.handler = handler
        self.source_value = source_value
        self.cause = cause


@dataclass
class TransformResult(Generic[T]):
    """Unconditional return shape for ``to_common`` / ``from_common``.

    ``result`` is the transformed value (may be partial on error); ``errors`` aggregates
    any ``TransformError`` entries and is empty on full success. Consumers apply their own
    strict-vs-lenient rule for what counts as success.
    """

    result: T
    errors: list[TransformError]


class PluginMeta(CommonBenefitsBaseModel):
    """Plugin identity and capability declaration.

    ``name`` and ``source_system`` are required so registries always have a label and a
    provenance string; ``version`` and ``capabilities`` are optional.
    """

    name: str
    source_system: str  # serialized as ``sourceSystem`` by the base alias generator
    version: str | None = None
    capabilities: list[PluginCapability] | None = None
