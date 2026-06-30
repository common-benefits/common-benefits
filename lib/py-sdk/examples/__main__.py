"""Run every example scenario in order: ``python -m examples``.

Each scenario also runs standalone, e.g. ``python -m examples.custom_filters``.
"""

from __future__ import annotations

from . import (
    custom_fields,
    custom_fields_functions,
    custom_fields_mappings,
    custom_filters,
    mappings_only,
)


def main() -> None:
    for module in (
        custom_fields,
        custom_fields_mappings,
        custom_fields_functions,
        mappings_only,
        custom_filters,
    ):
        module.demo()
        print()


if __name__ == "__main__":
    main()
