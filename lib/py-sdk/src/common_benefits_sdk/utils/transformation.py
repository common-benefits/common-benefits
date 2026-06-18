"""Declarative mapping engine for transforms.

``transform_from_mapping`` takes a data dict and a mapping dict that describes how to
build a new dict from it. The mapping supports literal values and transformations keyed
by reserved handler names (``const``, ``field``, ``match`` / ``switch``,
``numberToString``, ``stringToNumber``), plus per-call custom handlers.

Ported from the CommonGrants Python SDK (``utils/transformation.py``).
"""

from typing import Any, Callable

from pydantic import BaseModel

handle_func = Callable[[dict, Any], Any]


def get_from_path(data: dict, path: str, default: Any = None) -> Any:
    """Get a value from a dict using dot notation, or ``default`` if absent."""
    parts = path.split(".")
    for part in parts:
        if isinstance(data, dict) and part in data:
            data = data[part]
        else:
            return default
    return data


def pluck_field_value(data: dict, field_path: str) -> Any:
    """``field`` handler: extract a value at a dot-notation path."""
    return get_from_path(data, field_path)


def switch_on_value(data: dict, switch_spec: dict) -> Any:
    """``match`` / ``switch`` handler: look up a field value in a case table.

    ``switch_spec`` carries ``field`` (path), ``case`` (value -> result), and an
    optional ``default``.
    """
    val = get_from_path(data, switch_spec.get("field", ""))
    lookup = switch_spec.get("case", {})
    return lookup.get(val, switch_spec.get("default"))


def const_value(_data: dict, value: Any) -> Any:
    """``const`` handler: return a fixed literal value, ignoring the input."""
    return value


def number_to_string(data: dict, field_path: str) -> str | None:
    """``numberToString`` handler: pluck a value and coerce it to ``str``.

    Returns ``None`` when the path is absent (the absent contract).
    """
    val = get_from_path(data, field_path)
    return str(val) if val is not None else None


def string_to_number(data: dict, field_path: str) -> int | float | None:
    """``stringToNumber`` handler: pluck a value and coerce it to a number.

    Tries ``int`` first, falls back to ``float``. Returns ``None`` when the path is
    absent.
    """
    val = get_from_path(data, field_path)
    if val is None:
        return None
    s = str(val)
    try:
        return int(s)
    except ValueError:
        return float(s)


class HandlerError(ValueError):
    """Raised when a handler function raises, carrying the handler name for attribution.

    Extends ``ValueError`` so existing ``except ValueError`` callers keep working;
    callers wanting handler-level attribution can catch ``HandlerError`` specifically.
    """

    def __init__(self, handler: str, cause: Exception) -> None:
        super().__init__(str(cause))
        self.handler = handler
        self.cause = cause


DEFAULT_HANDLERS: dict[str, handle_func] = {
    "const": const_value,
    "field": pluck_field_value,
    "match": switch_on_value,
    "numberToString": number_to_string,
    "stringToNumber": string_to_number,
    "switch": switch_on_value,  # alias for match
}


def transform_from_mapping(
    data: Any,
    mapping: dict,
    depth: int = 0,
    max_depth: int = 500,
    handlers: dict[str, handle_func] = DEFAULT_HANDLERS,
) -> dict:
    """Transform ``data`` according to ``mapping``.

    A mapping node that is a single reserved-handler key invokes that handler; any other
    dict is preserved structurally and recursed into; a non-dict node is a literal.

    Pydantic model inputs are normalized to camelCase dicts first, so field paths resolve
    whether the caller passes a raw dict or a validated model.
    """
    if isinstance(data, BaseModel):
        data = data.model_dump(mode="json", by_alias=True)

    if depth > max_depth:
        raise ValueError("Maximum transformation depth exceeded.")

    def transform_node(node: Any, depth: int) -> Any:
        if depth > max_depth:
            raise ValueError("Maximum transformation depth exceeded.")

        if not isinstance(node, dict):
            return node

        for k, v in node.items():
            if k in handlers:
                handler_func = handlers[k]
                try:
                    return handler_func(data, v)
                except Exception as exc:
                    raise HandlerError(k, exc) from exc

            return {k: transform_node(v, depth + 1) for k, v in node.items()}

        return {}

    return transform_node(mapping, depth)
