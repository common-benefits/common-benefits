"""Runnable, offline examples.

One file per scenario, each with an Author section and a Consumer section. Run them all with
``python -m examples`` or one at a time with ``python -m examples.<scenario>``. The plugins are
re-exported here so tests (and other scenarios) can import them by name.
"""

from .custom_fields import schema_only_plugin
from .custom_fields_functions import functions_plugin
from .custom_fields_mappings import mappings_plugin
from .custom_filters import routes_plugin
from .mappings_only import bare_plugin

__all__ = [
    "schema_only_plugin",
    "mappings_plugin",
    "functions_plugin",
    "bare_plugin",
    "routes_plugin",
]
