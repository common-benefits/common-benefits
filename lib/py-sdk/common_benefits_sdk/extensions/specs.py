"""Custom-field spec types for plugin extensions."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Optional, TypedDict

from ..schemas.fields import CustomFieldType


@dataclass
class CustomFieldSpec:
    """Runtime custom-field declaration (author-facing for the registration path).

    ``field_type`` selects the value type when ``value`` is not given, and is pinned on
    the resulting custom field.
    """

    field_type: CustomFieldType
    value: Optional[Any] = None
    name: str = ""
    description: str = ""


@dataclass
class PluginCustomFieldSpec:
    """Resolved, inspection-only view of a single custom field.

    Authors never construct it. The ``schema(...)`` factory produces it via
    ``resolve_custom_field_specs`` from a ``CustomField[V]`` declaration on a
    ``CustomFieldSet`` and exposes it through ``extension.custom_fields``, so consumers can
    introspect each field without it ever drifting from the typed declaration:

    - ``field_type`` -- the JSON-schema tag derived from ``V`` (``None`` if unmappable).
    - ``value`` -- the static value type ``V`` itself, for runtime inspection.
    - ``name`` -- the attribute name on the container.
    - ``description`` -- the Pydantic field description.
    """

    field_type: Optional[CustomFieldType] = None
    value: Optional[Any] = None
    name: str = ""
    description: str = ""


class SchemaExtensions(TypedDict, total=False):
    """Maps extensible model names to custom field specifications."""

    Widget: dict[str, CustomFieldSpec]
    Gadget: dict[str, CustomFieldSpec]
