"""Filter value models, the ``CustomFilterType`` enum, and the ``f.*`` helpers.

Each filter type has a distinct shape (operator enum + value type), mirroring the TS SDK's
``schemas/filters.ts``. ``f`` provides ergonomic constructors so a consumer writes
``f.eq("red")`` instead of ``StringComparison(operator="eq", value="red")``. The per-key
filter value a consumer passes is one of these models (or a plain ``{"operator", "value"}``
dict for ad hoc passthrough).
"""

from __future__ import annotations

from enum import StrEnum
from typing import Any, List, Literal, TypedDict, Union, overload

from .base import CommonBenefitsBaseModel

# --- Operator groups --------------------------------------------------------------------

EquivalenceOperator = Literal["eq", "neq"]
ComparisonOperator = Literal["gt", "gte", "lt", "lte"]
ArrayOperator = Literal["in", "notIn"]
StringOperator = Literal["like", "notLike"]
RangeOperator = Literal["between", "outside"]

# Every operator any filter may use (the superset).
AllOperator = Literal[
    "eq",
    "neq",
    "gt",
    "gte",
    "lt",
    "lte",
    "in",
    "notIn",
    "like",
    "notLike",
    "between",
    "outside",
]


# --- Shared value sub-models ------------------------------------------------------------


class Money(CommonBenefitsBaseModel):
    """A monetary amount (decimal string + ISO currency code)."""

    amount: str
    currency: str


class NumberRangeValue(CommonBenefitsBaseModel):
    min: float
    max: float


class DateRangeValue(CommonBenefitsBaseModel):
    min: str
    max: str


class MoneyRangeValue(CommonBenefitsBaseModel):
    min: Money
    max: Money


# --- Per-type filter models -------------------------------------------------------------


class StringComparison(CommonBenefitsBaseModel):
    operator: Union[EquivalenceOperator, StringOperator]
    value: str


class StringArray(CommonBenefitsBaseModel):
    operator: ArrayOperator
    value: List[str]


class NumberComparison(CommonBenefitsBaseModel):
    operator: Union[ComparisonOperator, EquivalenceOperator]
    value: float


class NumberArray(CommonBenefitsBaseModel):
    operator: ArrayOperator
    value: List[float]


class NumberRange(CommonBenefitsBaseModel):
    operator: RangeOperator
    value: NumberRangeValue


class DateComparison(CommonBenefitsBaseModel):
    operator: ComparisonOperator
    value: str


class DateRange(CommonBenefitsBaseModel):
    operator: RangeOperator
    value: DateRangeValue


class MoneyComparison(CommonBenefitsBaseModel):
    operator: ComparisonOperator
    value: Money


class MoneyRange(CommonBenefitsBaseModel):
    operator: RangeOperator
    value: MoneyRangeValue


# The superset of value shapes any filter may carry.
FilterValueVariant = Union[
    str,
    List[str],
    float,
    List[float],
    NumberRangeValue,
    DateRangeValue,
    MoneyRangeValue,
    Money,
]


class DefaultFilter(CommonBenefitsBaseModel):
    """Generic filter shape for ad hoc (unregistered) custom filters passed through.

    Constrained to the superset ``{operator: <any operator>, value: <any value variant>}``
    so a passthrough filter still conforms to the protocol filter shape (never arbitrary).
    """

    operator: AllOperator
    value: FilterValueVariant


# Any concrete filter value a consumer can pass for one key.
FilterValue = Union[
    StringComparison,
    StringArray,
    NumberComparison,
    NumberArray,
    NumberRange,
    DateComparison,
    DateRange,
    MoneyComparison,
    MoneyRange,
    DefaultFilter,
]


class CustomFilterType(StrEnum):
    """Closed set of supported filter shapes (registration tag)."""

    STRING_COMPARISON = "stringComparison"
    STRING_ARRAY = "stringArray"
    NUMBER_COMPARISON = "numberComparison"
    NUMBER_ARRAY = "numberArray"
    NUMBER_RANGE = "numberRange"
    DATE_COMPARISON = "dateComparison"
    DATE_RANGE = "dateRange"
    MONEY_COMPARISON = "moneyComparison"
    MONEY_RANGE = "moneyRange"


# CustomFilterType -> the value model that validates a filter of that type.
FILTER_MODELS: dict[CustomFilterType, type[CommonBenefitsBaseModel]] = {
    CustomFilterType.STRING_COMPARISON: StringComparison,
    CustomFilterType.STRING_ARRAY: StringArray,
    CustomFilterType.NUMBER_COMPARISON: NumberComparison,
    CustomFilterType.NUMBER_ARRAY: NumberArray,
    CustomFilterType.NUMBER_RANGE: NumberRange,
    CustomFilterType.DATE_COMPARISON: DateComparison,
    CustomFilterType.DATE_RANGE: DateRange,
    CustomFilterType.MONEY_COMPARISON: MoneyComparison,
    CustomFilterType.MONEY_RANGE: MoneyRange,
}


class f:
    """Readable, typed constructors for filter values (mirrors the TS ``f.*``).

    String and number variants are overloaded so ``f.eq("red")`` is a ``StringComparison``
    and ``f.eq(5)`` a ``NumberComparison``. Date and money filters are constructed via their
    models directly.
    """

    @overload
    @staticmethod
    def eq(value: str) -> StringComparison: ...
    @overload
    @staticmethod
    def eq(value: float) -> NumberComparison: ...
    @staticmethod
    def eq(value: Any) -> Any:
        return (
            StringComparison(operator="eq", value=value)
            if isinstance(value, str)
            else NumberComparison(operator="eq", value=value)
        )

    @overload
    @staticmethod
    def neq(value: str) -> StringComparison: ...
    @overload
    @staticmethod
    def neq(value: float) -> NumberComparison: ...
    @staticmethod
    def neq(value: Any) -> Any:
        return (
            StringComparison(operator="neq", value=value)
            if isinstance(value, str)
            else NumberComparison(operator="neq", value=value)
        )

    @staticmethod
    def like(value: str) -> StringComparison:
        return StringComparison(operator="like", value=value)

    @staticmethod
    def not_like(value: str) -> StringComparison:
        return StringComparison(operator="notLike", value=value)

    @staticmethod
    def lt(value: float) -> NumberComparison:
        return NumberComparison(operator="lt", value=value)

    @staticmethod
    def lte(value: float) -> NumberComparison:
        return NumberComparison(operator="lte", value=value)

    @staticmethod
    def gt(value: float) -> NumberComparison:
        return NumberComparison(operator="gt", value=value)

    @staticmethod
    def gte(value: float) -> NumberComparison:
        return NumberComparison(operator="gte", value=value)

    @overload
    @staticmethod
    def in_(value: List[str]) -> StringArray: ...
    @overload
    @staticmethod
    def in_(value: List[float]) -> NumberArray: ...
    @staticmethod
    def in_(value: Any) -> Any:
        if all(isinstance(v, str) for v in value):
            return StringArray(operator="in", value=value)
        return NumberArray(operator="in", value=value)

    @overload
    @staticmethod
    def not_in(value: List[str]) -> StringArray: ...
    @overload
    @staticmethod
    def not_in(value: List[float]) -> NumberArray: ...
    @staticmethod
    def not_in(value: Any) -> Any:
        if all(isinstance(v, str) for v in value):
            return StringArray(operator="notIn", value=value)
        return NumberArray(operator="notIn", value=value)

    @staticmethod
    def between(low: float, high: float) -> NumberRange:
        return NumberRange(
            operator="between", value=NumberRangeValue(min=low, max=high)
        )

    @staticmethod
    def outside(low: float, high: float) -> NumberRange:
        return NumberRange(
            operator="outside", value=NumberRangeValue(min=low, max=high)
        )


# --- Per-resource standard (protocol) filter shapes -------------------------------------
# These TypedDicts give the consumer autocomplete + per-key value typing for a resource's
# standard filters. A plugin author extends one to register custom filters for a route:
#
#     class MyWidgetFilters(WidgetFilters, total=False):
#         region: StringArray


class WidgetFilters(TypedDict, total=False):
    """Standard filters for the widgets search route."""

    color: StringComparison
    weight: NumberRange


class GadgetFilters(TypedDict, total=False):
    """Standard filters for the gadgets search route."""

    size: NumberComparison
