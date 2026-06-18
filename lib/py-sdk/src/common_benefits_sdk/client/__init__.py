"""The CommonBenefits typed HTTP client."""

from .auth import Auth
from .base import BaseClient
from .config import Config
from .exceptions import APIError, FilterError
from .facade import CommonBenefitsClient
from .resources import Gadgets, Resource, Widgets
from .responses import (
    FilterInfo,
    ListResult,
    PaginationInfo,
    SearchResult,
    SortInfo,
)
from .results import (
    ParseError,
    ParsedErr,
    ParsedItem,
    ParsedOk,
    parse_batch,
    parse_item,
)

__all__ = [
    "APIError",
    "FilterError",
    "Auth",
    "BaseClient",
    "CommonBenefitsClient",
    "Config",
    "FilterInfo",
    "Gadgets",
    "ListResult",
    "PaginationInfo",
    "ParseError",
    "ParsedErr",
    "ParsedItem",
    "ParsedOk",
    "Resource",
    "SearchResult",
    "SortInfo",
    "Widgets",
    "parse_batch",
    "parse_item",
]
