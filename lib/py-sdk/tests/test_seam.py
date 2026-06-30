"""Seam guard: the schema/resource registration sites stay consistent.

The Python analog of the TS SDK's compile-time facade/registry guard. Adding (or replacing) an
extensible model touches a fixed set of sites; this test fails if they drift, pointing at the
missed one. To add e.g. ``Program``:

1. ``extensions`` ``EXTENSIBLE_SCHEMA_MAP`` -- register ``Program`` -> its common model.
2. ``extensions.PluginSchemas`` -- add a ``Program`` field (same PascalCase name).
3. ``extensions.Routes`` -- add a ``program`` carrier (lowercased).
4. ``client.CommonBenefitsClient`` -- add a ``programs`` resource slot (lower + plural), and
   construct it in ``Plugin.get_client``.

The naming convention across the sites is: schema ``Widget`` -> ``PluginSchemas.Widget`` ->
``Routes.widget`` -> ``CommonBenefitsClient.widgets``. ``EXTENSIBLE_SCHEMA_MAP`` is the single
source of truth; every other site is checked against it here.
"""

from __future__ import annotations

from dataclasses import fields

from common_benefits_sdk.client import CommonBenefitsClient
from common_benefits_sdk.extensions import EXTENSIBLE_SCHEMA_MAP, PluginSchemas, Routes


def test_schema_resource_seam_is_consistent():
    schema_names = set(EXTENSIBLE_SCHEMA_MAP)  # PascalCase schema names

    # PluginSchemas has one field per extensible schema, same (PascalCase) name.
    assert {f.name for f in fields(PluginSchemas)} == schema_names

    # Routes has one carrier per schema, lowercased.
    assert {f.name for f in fields(Routes)} == {name.lower() for name in schema_names}

    # The facade has one resource slot per schema (lower + plural), aside from `http`.
    facade_slots = {f.name for f in fields(CommonBenefitsClient) if f.name != "http"}
    assert facade_slots == {f"{name.lower()}s" for name in schema_names}
