# Schemas

The Pydantic models for the CommonBenefits protocol: the shared base model, custom-field
primitives, the placeholder extensible models, and the filter value models + `f.*` helpers.

## Table of contents <!-- omit in toc -->

- [Base model](#base-model)
- [Custom fields](#custom-fields)
- [Extensible models](#extensible-models)
- [Filters](#filters)
- [API reference](#api-reference)

## Base model

`CommonBenefitsBaseModel` is the shared base: camelCase on the wire, snake_case in code (via a
Pydantic `AliasGenerator`), with `populate_by_name=True` and `strict=False`. Subclasses
declare snake_case fields and round-trip camelCase JSON with no per-field aliases. A field
whose wire name is not derivable (e.g. `schema_url` -> `schema`) sets its own alias.

## Custom fields

`CustomFieldType` is the JSON-schema type tag. `CustomField[V]` is a generic custom field
whose value type `V` is the single source of truth for both its `field_type` and its
inspectable value type:

```python
from common_benefits_sdk.schemas import CustomField

CustomField[str]          # field_type derived as "string"
CustomField[int]          # "integer"
CustomField[SomeModel]    # "object"
```

Authors group these in a `CustomFieldSet` (see the [Extensions guide](../extensions/README.md)).

## Extensible models

`WidgetCommon[CF]` and `GadgetCommon[CF]` are Pydantic generics over their custom-fields
container `CF` (default `dict[str, CustomField]`). They stand in for real protocol models
(e.g. `Program`) and mirror `ts-sdk/src/schemas/widget.ts` / `gadget.ts`:

```python
WidgetCommon                      # bare: custom_fields is dict[str, CustomField] | None
WidgetCommon[WidgetFields]        # typed: custom_fields is WidgetFields | None
```

## Filters

Each filter type has a distinct shape (operator enum + value type), mirroring
`ts-sdk/src/schemas/filters.ts`: `StringComparison`, `StringArray`, `NumberComparison`,
`NumberArray`, `NumberRange`, `DateComparison`, `DateRange`, `MoneyComparison`, `MoneyRange`,
plus the generic `DefaultFilter` (constrained to the operator/value-variant superset).

`f.*` provides ergonomic, typed constructors so you write `f.eq("red")` instead of
`StringComparison(operator="eq", value="red")`:

```python
from common_benefits_sdk.schemas.filters import f

f.eq("red")            # StringComparison
f.eq(5)                # NumberComparison
f.between(1, 100)      # NumberRange
f.in_(["a", "b"])      # StringArray
```

`FilterValue` is the union of all filter models; it is the value type a `search(filters=...)`
mapping accepts. `WidgetFilters` / `GadgetFilters` are the per-resource standard-filter
TypedDicts an author extends to register custom filters (see the
[Extensions guide](../extensions/README.md#registering-route-filters)).

## API reference

| Symbol                                  | Description                                                                                                             |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `CommonBenefitsBaseModel`               | Shared base: camelCase wire, snake_case code.                                                                           |
| `CustomFieldType` / `CustomField[V]`    | Custom-field type tag and generic field.                                                                                |
| `WidgetCommon[CF]` / `GadgetCommon[CF]` | Placeholder extensible models.                                                                                          |
| `f`                                     | Filter value constructors (`eq`, `neq`, `lt`/`lte`/`gt`/`gte`, `like`/`not_like`, `in_`/`not_in`, `between`/`outside`). |
| `FilterValue`                           | Union of all filter value models.                                                                                       |
| filter models                           | `StringComparison`, `NumberRange`, `StringArray`, ... and `DefaultFilter`.                                              |
| `WidgetFilters` / `GadgetFilters`       | Per-resource standard-filter TypedDicts.                                                                                |
| `CustomFilterType`                      | Closed enum of registrable filter shapes.                                                                               |
