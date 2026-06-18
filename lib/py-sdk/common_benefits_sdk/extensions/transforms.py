"""``build_transforms()`` -- compile to_common/from_common callables from mapping dicts.

Using this is optional: authors may provide plain hand-written callables instead. Mappings
are validated at call time. Custom handler names are registered per call only; collisions
with the defaults raise rather than silently shadowing them.

Ported from the CommonGrants Python SDK (``extensions/transforms.py``).
"""

from __future__ import annotations

from typing import Any, Callable, TypeVar, overload

from pydantic import BaseModel, ValidationError

from ..utils.transformation import (
    DEFAULT_HANDLERS,
    HandlerError,
    transform_from_mapping,
)
from .types import Handler, TransformError, TransformResult

TCommon = TypeVar("TCommon", bound=BaseModel)
TSource = TypeVar("TSource", bound=BaseModel)


def _output_field_names(model: type[BaseModel]) -> set[str]:
    """Valid top-level output keys for a model: field names plus their aliases."""
    names: set[str] = set(model.model_fields.keys())
    for info in model.model_fields.values():
        if info.alias:
            names.add(info.alias)
        if isinstance(info.validation_alias, str):
            names.add(info.validation_alias)
    return names


def _validate_output_paths(
    mapping: dict[str, Any],
    model: type[BaseModel],
    known_handlers: set[str],
    direction: str = "to_common",
) -> None:
    """Validate that top-level output keys in ``mapping`` are real fields on ``model``.

    Models configured with ``extra="allow"`` accept arbitrary keys, so the check is
    skipped for them. Raises ``ValueError`` if any top-level key is not a field or alias.
    """
    if model.model_config.get("extra") == "allow":
        return

    valid_names = _output_field_names(model)
    output_keys = {k for k in mapping if k not in known_handlers}
    invalid = output_keys - valid_names
    if invalid:
        noun = "field" if len(invalid) == 1 else "fields"
        raise ValueError(
            f"build_transforms ({direction}_mapping): unknown output {noun} "
            f"{sorted(invalid)!r} for model {model.__name__}. "
            f"Declare them on the schema's CustomFieldSet or check the field name."
        )


def _validate_mapping(mapping: Any, known_handlers: set[str], path: str = "") -> None:
    """Walk the mapping tree and raise ``ValueError`` on structural malformation.

    A handler key must be the sole key in its dict; any other key is an output field name
    whose value is recursed into. Primitives and ``None`` are valid literals.
    """
    if mapping is None or isinstance(mapping, (str, int, float, bool)):
        return

    if not isinstance(mapping, dict):
        raise ValueError(
            f"Invalid mapping node at '{path}': expected dict, str, number, or bool, "
            f"got {type(mapping).__name__}"
        )

    handler_keys = [k for k in mapping if k in known_handlers]
    if handler_keys and len(mapping) > 1:
        label = f" at '{path}'" if path else ""
        siblings = sorted(k for k in mapping if k not in known_handlers)
        raise ValueError(
            f"Invalid mapping node{label}: handler key {handler_keys[0]!r} "
            f"cannot have sibling keys {siblings!r}. "
            f"A handler invocation must be the only key in its dict."
        )

    for key, value in mapping.items():
        current_path = f"{path}.{key}" if path else key
        if key in known_handlers:
            continue
        _validate_mapping(value, known_handlers, current_path)


@overload
def build_transforms(
    to_common_mapping: dict[str, Any],
    from_common_mapping: dict[str, Any],
    handlers: dict[str, Handler] | None = ...,
    *,
    common_schema: type[TCommon],
    source_schema: type[TSource],
) -> tuple[
    Callable[[Any], TransformResult[TCommon]],
    Callable[[Any], TransformResult[TSource]],
]: ...
@overload
def build_transforms(
    to_common_mapping: dict[str, Any],
    from_common_mapping: dict[str, Any],
    handlers: dict[str, Handler] | None = ...,
) -> tuple[
    Callable[[Any], TransformResult[Any]],
    Callable[[Any], TransformResult[Any]],
]: ...
def build_transforms(
    to_common_mapping: dict[str, Any],
    from_common_mapping: dict[str, Any],
    handlers: dict[str, Handler] | None = None,
    *,
    common_schema: type[BaseModel] | None = None,
    source_schema: type[BaseModel] | None = None,
) -> tuple[
    Callable[[Any], TransformResult[Any]],
    Callable[[Any], TransformResult[Any]],
]:
    """Generate ``to_common`` and ``from_common`` callables from mapping dicts.

    When a schema is supplied for a direction, that direction validates its output into the
    model: ``TransformResult.result`` holds the validated instance on success, or the raw
    transformed dict alongside ``TransformError`` entries on failure (never raised).
    """
    if handlers:
        collisions = set(handlers) & set(DEFAULT_HANDLERS)
        if collisions:
            raise ValueError(
                f"build_transforms: handler names collide with defaults: {sorted(collisions)}"
            )

    merged = {**DEFAULT_HANDLERS, **(handlers or {})}
    known = set(merged)

    _validate_mapping(to_common_mapping, known)
    _validate_mapping(from_common_mapping, known)

    if common_schema is not None:
        _validate_output_paths(to_common_mapping, common_schema, known, "to_common")
    if source_schema is not None:
        _validate_output_paths(from_common_mapping, source_schema, known, "from_common")

    def _run(
        mapping: dict[str, Any], schema: type[BaseModel] | None, data: Any
    ) -> TransformResult[Any]:
        try:
            result = transform_from_mapping(data, mapping, handlers=merged)
        except HandlerError as exc:
            error = TransformError(
                str(exc.cause), handler=exc.handler, source_value=data, cause=exc.cause
            )
            return TransformResult(result={}, errors=[error])
        except Exception as exc:  # noqa: BLE001 - aggregate, never raise
            error = TransformError(str(exc), source_value=data, cause=exc)
            return TransformResult(result={}, errors=[error])

        if schema is None:
            return TransformResult(result=result, errors=[])

        try:
            return TransformResult(result=schema.model_validate(result), errors=[])
        except ValidationError as exc:
            errors = [
                TransformError(e["msg"], path=".".join(str(loc) for loc in e["loc"]))
                for e in exc.errors()
            ]
            return TransformResult(result=result, errors=errors)

    def to_common(native: Any) -> TransformResult[Any]:
        return _run(to_common_mapping, common_schema, native)

    def from_common(common: Any) -> TransformResult[Any]:
        return _run(from_common_mapping, source_schema, common)

    return to_common, from_common
