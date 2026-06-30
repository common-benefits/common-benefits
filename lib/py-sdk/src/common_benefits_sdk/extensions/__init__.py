"""Public extension APIs for the CommonBenefits SDK."""

from .plugin import Plugin, PluginSchemas, define_plugin
from .routes import ResourceRoutes, RouteFilters, Routes
from .schema import (
    EXTENSIBLE_SCHEMA_MAP,
    CustomField,
    CustomFieldSet,
    PluginDefinitionError,
    SchemaExtension,
    SchemaOnly,
    SchemaWithTransforms,
    get_custom_field_value,
    resolve_custom_field_specs,
    schema,
    validate_into,
)
from .specs import CustomFieldSpec, PluginCustomFieldSpec, SchemaExtensions
from .transforms import build_transforms
from .types import (
    Handler,
    PassthroughModel,
    PluginCapability,
    PluginMeta,
    TransformError,
    TransformResult,
)

__all__ = [
    "EXTENSIBLE_SCHEMA_MAP",
    "CustomField",
    "CustomFieldSet",
    "CustomFieldSpec",
    "Handler",
    "PassthroughModel",
    "Plugin",
    "PluginCapability",
    "PluginCustomFieldSpec",
    "PluginDefinitionError",
    "PluginMeta",
    "PluginSchemas",
    "ResourceRoutes",
    "RouteFilters",
    "Routes",
    "SchemaExtension",
    "SchemaExtensions",
    "SchemaOnly",
    "SchemaWithTransforms",
    "TransformError",
    "TransformResult",
    "build_transforms",
    "define_plugin",
    "get_custom_field_value",
    "resolve_custom_field_specs",
    "schema",
    "validate_into",
]
