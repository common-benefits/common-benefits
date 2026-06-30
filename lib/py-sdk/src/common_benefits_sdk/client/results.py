"""Per-row parse envelope: one bad record does not fail the whole response.

A response row is wrapped in a :data:`ParsedItem` discriminated union: ``ParsedOk`` with a
typed ``data``, or ``ParsedErr`` with the raw record and the validation errors. Consumers
discriminate on ``.ok``. This is the Python analog of the TS SDK's ``ParsedItem<T>``.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Generic, Literal, TypeVar, Union

from pydantic import BaseModel, ValidationError

TItem = TypeVar("TItem", bound=BaseModel)


@dataclass
class ParseError:
    """A single validation failure on a row: message plus dotted location path."""

    msg: str
    loc: str


@dataclass
class ParsedOk(Generic[TItem]):
    """A successfully parsed row, with the typed model in ``data``."""

    data: TItem
    ok: Literal[True] = True


@dataclass
class ParsedErr:
    """A row that failed to parse, preserving the raw record and the errors."""

    raw: Any
    errors: list[ParseError] = field(default_factory=list)
    ok: Literal[False] = False


# Discriminated on ``ok``: ``if item.ok:`` narrows to ParsedOk[TItem].
ParsedItem = Union[ParsedOk[TItem], ParsedErr]


def parse_item(schema: type[TItem], raw: Any) -> "ParsedItem[TItem]":
    """Validate one raw record into ``schema``, isolating failures into ``ParsedErr``."""
    try:
        return ParsedOk(data=schema.model_validate(raw))
    except ValidationError as exc:
        errors = [
            ParseError(msg=e["msg"], loc=".".join(str(p) for p in e["loc"]))
            for e in exc.errors()
        ]
        return ParsedErr(raw=raw, errors=errors)


def parse_batch(
    schema: type[TItem], items: list[Any]
) -> tuple[list["ParsedItem[TItem]"], list[ParseError]]:
    """Validate a batch; return the per-row results and a flat list of all errors."""
    parsed: list[ParsedItem[TItem]] = [parse_item(schema, raw) for raw in items]
    errors = [e for item in parsed if isinstance(item, ParsedErr) for e in item.errors]
    return parsed, errors
