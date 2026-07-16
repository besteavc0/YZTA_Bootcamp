"""
CSV/Excel dosyalarindan veri okuyup canonical tablolara normalize eden connector.

config sozlugu su alanlari icerir:
    tenant_id       : str  - hangi tenant'a ait oldugu (UUID string)
    file_path       : str  - CSV dosyasinin yolu
    entity_type     : str  - "orders" | "customers" | "inventory"
    column_mapping  : dict - kaynak kolon adi -> canonical alan adi eslemesi
                              (verilmezse ayni isimli kolonlar oldugu varsayilir)
    source          : str  - opsiyonel, varsayilan "csv"
    database_url    : str  - opsiyonel, verilmezse DATABASE_URL env degiskeni kullanilir
"""
from __future__ import annotations

import os
import uuid
from datetime import datetime
from typing import Any

import pandas as pd
import psycopg2
from psycopg2.extras import execute_values

from connectors.base import ERPConnector, SyncResult, TableSchema

DEFAULT_DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/erpilot"

# entity_type -> canonical tablo adi ve upsert semasi
_ENTITY_CONFIG = {
    "customers": {
        "table": "canonical_customers",
        "required_columns": ["external_id", "name"],
        "optional_columns": ["city", "segment"],
        "conflict_target": "(tenant_id, external_id, source)",
    },
    "orders": {
        "table": "canonical_orders",
        "required_columns": ["external_id", "order_date", "total_amount"],
        "optional_columns": ["customer_external_id", "status"],
        "conflict_target": "(tenant_id, external_id, source)",
    },
    "inventory": {
        "table": "canonical_inventory",
        "required_columns": ["external_id", "product_name", "quantity"],
        "optional_columns": ["warehouse", "reorder_level"],
        "conflict_target": "(tenant_id, external_id, source, warehouse)",
    },
}


class CSVConnector(ERPConnector):
    """CSV/Excel tabanli ERP veri kaynagi connector'i."""

    def __init__(self, config: dict[str, Any]):
        super().__init__(config)
        self.file_path: str = config.get("file_path", "")
        self.entity_type: str = config.get("entity_type", "")
        self.column_mapping: dict[str, str] = config.get("column_mapping", {})
        self.source: str = config.get("source", "csv")
        self.tenant_id: str | None = config.get("tenant_id")
        self.database_url: str = config.get(
            "database_url", os.environ.get("DATABASE_URL", DEFAULT_DATABASE_URL)
        )

        if self.entity_type not in _ENTITY_CONFIG:
            raise ValueError(
                f"Gecersiz entity_type: '{self.entity_type}'. "
                f"Beklenen: {list(_ENTITY_CONFIG.keys())}"
            )

    # ------------------------------------------------------------------
    # ERPConnector arayuzu
    # ------------------------------------------------------------------

    def test_connection(self) -> bool:
        """Dosyanin var oldugunu ve okunabilir oldugunu dogrular."""
        try:
            if not os.path.isfile(self.file_path):
                return False
            pd.read_csv(self.file_path, nrows=5)
            return True
        except Exception:
            return False

    def extract_tables(self) -> list[TableSchema]:
        """CSV'nin kolon semasini dondurur."""
        df = pd.read_csv(self.file_path, nrows=0)  # sadece header
        columns = [{"name": col, "type": "string"} for col in df.columns]
        return [TableSchema(name=self.entity_type, columns=columns)]

    def sync_incremental(self, since: datetime | None = None) -> SyncResult:
        """
        CSV'yi okur, column_mapping'e gore kolonlari yeniden adlandirir,
        entity_type'a gore canonical tabloya upsert eder.

        Not: CSV connector'i icin `since` parametresi su an kullanilmiyor
        (dosyanin tamami her seferinde okunur) - gelecekte dosya
        degisiklik zaman damgasi ile kismi okumaya genisletilebilir.
        """
        if not self.tenant_id:
            return SyncResult(success=False, error="config icinde tenant_id eksik")

        try:
            df = pd.read_csv(self.file_path)
        except FileNotFoundError:
            return SyncResult(success=False, error=f"Dosya bulunamadi: {self.file_path}")
        except Exception as e:
            return SyncResult(success=False, error=f"CSV okuma hatasi: {e}")

        # column_mapping uygula (kaynak kolon adi -> canonical alan adi)
        if self.column_mapping:
            df = df.rename(columns=self.column_mapping)

        entity_cfg = _ENTITY_CONFIG[self.entity_type]
        missing = [c for c in entity_cfg["required_columns"] if c not in df.columns]
        if missing:
            return SyncResult(
                success=False,
                error=(
                    f"Beklenen kolonlar eksik: {missing}. "
                    f"Mevcut kolonlar: {list(df.columns)}. "
                    f"column_mapping ayarini kontrol edin."
                ),
            )

        try:
            rows_synced = self._upsert(df, entity_cfg)
        except Exception as e:
            return SyncResult(success=False, error=f"Veritabani yazma hatasi: {e}")

        return SyncResult(success=True, rows_synced=rows_synced)

    # ------------------------------------------------------------------
    # Yardimci metodlar
    # ------------------------------------------------------------------

    def _upsert(self, df: pd.DataFrame, entity_cfg: dict) -> int:
        table = entity_cfg["table"]
        all_columns = entity_cfg["required_columns"] + [
            c for c in entity_cfg["optional_columns"] if c in df.columns
        ]

        rows = []
        for record in df.to_dict(orient="records"):
            row = [str(uuid.uuid4()), self.tenant_id, self.source]
            for col in all_columns:
                value = record.get(col)
                # NaN -> None donusumu (pandas bos hucreleri NaN yapar)
                if pd.isna(value):
                    value = None
                row.append(value)
            rows.append(tuple(row))

        insert_columns = ["id", "tenant_id", "source"] + all_columns
        update_columns = [c for c in all_columns if c not in ("external_id",)]
        update_clause = ", ".join(f"{c} = EXCLUDED.{c}" for c in update_columns)
        update_clause += ", updated_at = NOW()"

        query = f"""
            INSERT INTO {table} ({', '.join(insert_columns)})
            VALUES %s
            ON CONFLICT {entity_cfg['conflict_target']} DO UPDATE
                SET {update_clause}
        """

        conn = psycopg2.connect(self.database_url)
        try:
            with conn:
                with conn.cursor() as cur:
                    execute_values(cur, query, rows)
            return len(rows)
        finally:
            conn.close()
