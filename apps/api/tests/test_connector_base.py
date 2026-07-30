"""TASK-005 kabul kriterleri için testler: connector base + registry."""
import pytest

import connectors  # noqa: F401  (import edilince registry otomatik dolar)
from connectors.base import ERPConnector, SyncResult, TableSchema
from connectors.registry import CONNECTOR_REGISTRY, get_connector, register_connector


class DummyConnector(ERPConnector):
    """Sadece testte kullanılan, sözleşmeyi uygulayan basit bir connector."""

    def test_connection(self) -> bool:
        return True

    def extract_tables(self) -> list[TableSchema]:
        return [TableSchema(name="dummy", columns=[{"name": "id", "type": "int"}])]

    def sync_incremental(self, since=None) -> SyncResult:
        return SyncResult(success=True, rows_synced=1)


def test_import_does_not_raise():
    assert callable(get_connector)


def test_unknown_connector_raises_value_error():
    with pytest.raises(ValueError):
        get_connector("does-not-exist", {})


def test_register_and_get_connector():
    register_connector("dummy", DummyConnector)
    instance = get_connector("dummy", {"foo": "bar"})
    assert isinstance(instance, DummyConnector)
    assert instance.config == {"foo": "bar"}
    assert instance.test_connection() is True
    result = instance.sync_incremental()
    assert result.success is True
    assert result.rows_synced == 1
    del CONNECTOR_REGISTRY["dummy"]


def test_new_connector_requires_no_change_to_base():
    assert issubclass(DummyConnector, ERPConnector)
