"""Schema extensions: the ``schema(...)`` factory and its building blocks.

Authors build each schema extension with the overloaded ``schema(...)`` factory, which
returns a discriminated ``SchemaWithTransforms`` or ``SchemaOnly`` (both subclasses of the
shared generic base ``SchemaExtension[TCommon]``). The overloads enforce, statically:
mappings XOR hand-written transforms, a source when transforms are present, and no
``to_common`` on schema-only entries. Registry membership, custom-field consistency, and
mapping output keys are validated when the extension is built, aggregated into one error.

``CustomField[V]`` is the single source of truth for a custom field: ``field_type`` and the
inspectable value type are derived from ``V``, so they cannot drift. The common models are
generics over their custom-fields container (``WidgetCommon[WidgetFields]``), so consumers
get concrete, non-optional types.

Adapted from the codegen-free extensions design in the CommonGrants Python SDK.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import (
    Any,
    Callable,
    Generic,
    Optional,
    TypeGuard,
    TypeVar,
    get_args,
    get_origin,
    overload,
)

from pydantic import BaseModel, TypeAdapter, ValidationError

from ..schemas.base import CommonBenefitsBaseModel
from ..schemas.fields import CustomField, CustomFieldType
from ..schemas.models import GadgetCommon, WidgetCommon
from .specs import PluginCustomFieldSpec
from .transforms import build_transforms
from .types import TransformError, TransformResult

__all__ = [
    "EXTENSIBLE_SCHEMA_MAP",
    "CustomField",
    "CustomFieldSet",
    "PluginDefinitionError",
    "SchemaExtension",
    "SchemaOnly",
    "SchemaWithTransforms",
    "get_custom_field_value",
    "resolve_custom_field_specs",
    "schema",
    "validate_into",
]

TVal = TypeVar("TVal")


def get_custom_field_value(
    item: BaseModel,
    key: str,
    value_type: type[TVal],
) -> Optional[TVal]:
    """Read and validate a single custom field's value off a returned item.

    Returns ``None`` when the item has no ``custom_fields``, when the named field is absent,
    or when its value is ``None``; otherwise validates the value against ``value_type`` and
    returns it (raising ``pydantic.ValidationError`` on a mismatch). Mirrors the TS SDK's
    ``getCustomFieldValue``. Registered custom fields are already typed via ``CustomField[V]``;
    this helper is for defensive or dynamic-key access.

    ``custom_fields`` may be a ``dict`` (the bare model) or a ``CustomFieldSet`` (a typed
    container); both a mapping lookup and attribute access are tried.
    """
    custom_fields = getattr(item, "custom_fields", None)
    if custom_fields is None:
        return None
    field = (
        custom_fields.get(key)
        if isinstance(custom_fields, dict)
        else getattr(custom_fields, key, None)
    )
    if field is None:
        return None
    value = getattr(field, "value", None)
    if value is None:
        return None
    return TypeAdapter(value_type).validate_python(value)


TSource = TypeVar("TSource", bound=BaseModel)
TCommon = TypeVar("TCommon", bound=BaseModel)
T = TypeVar("T", bound=BaseModel)


class CustomFieldSet(CommonBenefitsBaseModel):
    """Base class an author subclasses to declare a schema's custom fields.

    Each field is declared as ``Optional[CustomField[V]] = Field(default=None,
    description=...)``. ``CustomField[V]`` is the single source of truth: ``V`` anchors both
    ``field_type`` and the inspectable value type, so they cannot drift. camelCase wire
    names come from ``CommonBenefitsBaseModel``'s alias generator.
    """


# The extensible-schema registry: the closed set of models a plugin may extend, mapped to
# their generic base model. Add an entry when a new model gains custom-field support.
EXTENSIBLE_SCHEMA_MAP: dict[str, type[BaseModel]] = {
    "Widget": WidgetCommon,
    "Gadget": GadgetCommon,
}
_BASE_TO_NAME: dict[type[BaseModel], str] = {
    v: k for k, v in EXTENSIBLE_SCHEMA_MAP.items()
}


class PluginDefinitionError(Exception):
    """Raised at definition (import) time, listing every problem at once."""

    def __init__(self, cls_name: str, errors: list[str]) -> None:
        self.errors = errors
        body = "\n".join(f"  - {e}" for e in errors)
        super().__init__(f"{cls_name} is not a valid plugin definition:\n{body}")


def _is_model_class(obj: Any) -> TypeGuard[type[BaseModel]]:
    return isinstance(obj, type) and issubclass(obj, BaseModel)


def _infer_field_type(value_type: Any) -> Optional[CustomFieldType]:
    """Derive the ``field_type`` tag from a ``CustomField[V]`` value type.

    Returns ``None`` for value types that do not map to a ``CustomFieldType``.
    """
    origin = get_origin(value_type)
    if value_type is bool:  # before int: bool is a subclass of int
        return CustomFieldType.BOOLEAN
    if value_type is int:
        return CustomFieldType.INTEGER
    if value_type is float:
        return CustomFieldType.NUMBER
    if value_type is str:
        return CustomFieldType.STRING
    if isinstance(value_type, type) and issubclass(value_type, BaseModel):
        return CustomFieldType.OBJECT
    if value_type is dict or origin is dict:
        return CustomFieldType.OBJECT
    if value_type is list or origin is list:
        return CustomFieldType.ARRAY
    return None


def _value_type(annotation: Any) -> Any:
    """Pull ``V`` out of an ``Optional[CustomField[V]]`` annotation.

    ``CustomField[V]`` is a parameterized Pydantic generic (a concrete subclass), so its
    argument lives in ``__pydantic_generic_metadata__`` rather than via ``get_args``.
    """
    candidates = get_args(annotation) or (annotation,)
    for cand in candidates:
        meta = getattr(cand, "__pydantic_generic_metadata__", None)
        if meta and meta.get("origin") is CustomField:
            args = meta.get("args", ())
            return args[0] if args else None
        if get_origin(cand) is CustomField:  # non-concrete fallback
            args = get_args(cand)
            return args[0] if args else None
    return None


def _check_custom_fields(container: type[BaseModel]) -> list[str]:
    """Ensure each custom field's value type ``V`` maps to a known ``field_type``."""
    errors: list[str] = []
    for name, info in container.model_fields.items():
        value_type = _value_type(info.annotation)
        if _infer_field_type(value_type) is None:
            label = getattr(value_type, "__name__", value_type)
            errors.append(
                f"custom field {name!r}: cannot derive a field_type from value type "
                f"{label}; use a supported CustomField[V]"
            )
    return errors


def resolve_custom_field_specs(
    container: Optional[type[BaseModel]],
) -> dict[str, PluginCustomFieldSpec]:
    """Build the resolved, inspection-only spec for each custom field.

    Everything is derived from the single source of truth, ``CustomField[V]``: ``field_type``
    and value type come from ``V``, ``name`` is the attribute name, ``description`` is the
    Pydantic field description. This is what ``extension.custom_fields`` exposes.
    """
    if not (isinstance(container, type) and issubclass(container, CustomFieldSet)):
        return {}
    out: dict[str, PluginCustomFieldSpec] = {}
    for name, info in container.model_fields.items():
        value_type = _value_type(info.annotation)
        out[name] = PluginCustomFieldSpec(
            field_type=_infer_field_type(value_type),
            value=value_type,
            name=name,
            description=info.description or "",
        )
    return out


def validate_into(model: type[T], data: Any) -> TransformResult[T]:
    """Validate ``data`` into ``model``, routing failures to ``errors``.

    The helper hand-written transform authors use so their ``to_common`` / ``from_common``
    return the validated model on success, or the raw data alongside structured
    ``TransformError`` entries on failure.
    """
    try:
        return TransformResult(result=model.model_validate(data), errors=[])
    except ValidationError as exc:
        errors = [
            TransformError(e["msg"], path=".".join(str(loc) for loc in e["loc"]))
            for e in exc.errors()
        ]
        return TransformResult(result=data, errors=errors)


Mappings = dict[str, Any]


def _resolve_common(common: Any) -> tuple[Any, Any]:
    """Return ``(origin, custom_fields_model)`` for a common type.

    A parameterized Pydantic generic (``WidgetCommon[WidgetFields]``) is a concrete
    subclass, so its origin/args live in ``__pydantic_generic_metadata__``.
    """
    pyd_meta = getattr(common, "__pydantic_generic_metadata__", None)
    if pyd_meta and pyd_meta.get("origin"):
        args = pyd_meta.get("args", ())
        return pyd_meta["origin"], (args[0] if args else None)
    return (get_origin(common) or common), (get_args(common)[:1] or (None,))[0]


@dataclass
class SchemaExtension(Generic[TCommon]):
    """Shared base for the two extension kinds.

    Carrying ``common_schema: type[TCommon]`` on one generic base is what lets a type
    checker recover the item type ``TCommon`` reliably (recovering it from a union of two
    unrelated generics is not reliable across mypy and pyright).
    """

    schema_name: str
    common_schema: type[TCommon]
    custom_fields: dict[str, PluginCustomFieldSpec]

    def parse(self, data: Any) -> TCommon:
        return self.common_schema.model_validate(data)


@dataclass
class SchemaWithTransforms(SchemaExtension[TCommon], Generic[TSource, TCommon]):
    """A schema extension with transforms. Built by ``schema(...)``, never by hand."""

    source_schema: type[TSource]
    to_common: Callable[[TSource], TransformResult[TCommon]]
    from_common: Callable[[TCommon], TransformResult[TSource]]


@dataclass
class SchemaOnly(SchemaExtension[TCommon]):
    """A schema extension with custom fields but no transforms. Built by ``schema(...)``.

    It deliberately has no ``to_common`` / ``from_common``, so a consumer cannot call a
    transform on a schema-only entry -- that is a static error.
    """


@overload
def schema(
    *, source_schema: type[TSource], common_schema: type[TCommon], mappings: Mappings
) -> SchemaWithTransforms[TSource, TCommon]: ...
@overload
def schema(
    *,
    source_schema: type[TSource],
    common_schema: type[TCommon],
    to_common: Callable[[TSource], TransformResult[TCommon]],
    from_common: Callable[[TCommon], TransformResult[TSource]],
) -> SchemaWithTransforms[TSource, TCommon]: ...
@overload
def schema(*, common_schema: type[TCommon]) -> SchemaOnly[TCommon]: ...
def schema(
    *,
    source_schema: Any = None,
    common_schema: Any,
    mappings: Optional[Mappings] = None,
    to_common: Any = None,
    from_common: Any = None,
) -> Any:
    """Build a schema extension. The overloads enforce, statically:

    - ``mappings`` XOR hand-written ``to_common`` / ``from_common`` (both = no match),
    - a ``source_schema`` is required whenever transforms are present,
    - a schema-only entry (``common_schema`` only) returns a ``SchemaOnly`` whose type has no
      ``to_common`` (so consumers cannot transform it).

    Registry membership, custom-field consistency, and mapping output keys are validated here
    at call (import) time, aggregated into one ``PluginDefinitionError``.
    """
    errors: list[str] = []
    common_origin, custom_fields_model = _resolve_common(common_schema)

    schema_name = _BASE_TO_NAME.get(common_origin)
    if schema_name is None:
        base_label = getattr(common_origin, "__name__", repr(common_origin))
        raise PluginDefinitionError(
            "schema",
            [
                f"common base {base_label} is not a registered extensible schema "
                f"(expected one of {sorted(EXTENSIBLE_SCHEMA_MAP)})"
            ],
        )

    if (
        custom_fields_model is not None
        and isinstance(custom_fields_model, type)
        and issubclass(custom_fields_model, CustomFieldSet)
    ):
        errors.extend(_check_custom_fields(custom_fields_model))

    has_callables = to_common is not None or from_common is not None
    if mappings is not None and has_callables:
        errors.append(
            "cannot specify both `mappings` and `to_common`/`from_common`; "
            "use mappings for declarative transforms or explicit callables, not both"
        )
    if has_callables and not (to_common is not None and from_common is not None):
        errors.append(
            "both `to_common` and `from_common` are required when either is provided"
        )
    if (mappings is not None or has_callables) and source_schema is None:
        errors.append(
            "a `source_schema` is required when transforms (mappings or "
            "to_common/from_common) are declared"
        )

    if mappings is not None:
        for direction in ("to_common", "from_common"):
            if direction not in mappings:
                errors.append(f"mappings: missing `{direction}` direction")

    if errors:
        raise PluginDefinitionError(schema_name, errors)

    custom_fields = resolve_custom_field_specs(custom_fields_model)

    if mappings is not None:
        # The validation above guarantees a source_schema when transforms are declared.
        assert source_schema is not None
        to_fn, from_fn = build_transforms(
            mappings["to_common"],
            mappings["from_common"],
            common_schema=common_schema,
            source_schema=source_schema,
        )
        return SchemaWithTransforms[Any, Any](
            schema_name, common_schema, custom_fields, source_schema, to_fn, from_fn
        )
    if to_common is not None:
        # The validation above guarantees both directions and a source_schema are present.
        assert source_schema is not None and from_common is not None
        return SchemaWithTransforms[Any, Any](
            schema_name,
            common_schema,
            custom_fields,
            source_schema,
            to_common,
            from_common,
        )
    return SchemaOnly[Any](schema_name, common_schema, custom_fields)
