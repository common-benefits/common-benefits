"""The CommonBenefits typed HTTP client."""

from .auth import Auth
from .base import BaseClient
from .config import Config
from .exceptions import APIError, FilterError
from .facade import CommonBenefitsClient
from .resources import Gadgets, Resource, Widgets
from .responses import (
    Filtered,
    FilterInfo,
    ListResult,
    Ok,
    Paginated,
    PaginationInfo,
    SearchResult,
    Sorted,
    Success,
    SortInfo,
    TypedFilterInfo,
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
    "Filtered",
    "FilterInfo",
    "Gadgets",
    "ListResult",
    "Ok",
    "Paginated",
    "PaginationInfo",
    "ParseError",
    "ParsedErr",
    "ParsedItem",
    "ParsedOk",
    "Resource",
    "SearchResult",
    "Sorted",
    "SortInfo",
    "Success",
    "TypedFilterInfo",
    "Widgets",
    "parse_batch",
    "parse_item",
]
