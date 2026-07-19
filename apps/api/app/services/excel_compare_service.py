"""
TASK-025 · Excel upload & kolon eşleme — backend servisi

parse_excel(): yüklenen Excel/CSV dosyasını okur, kolon adlarını normalize
eder ve canonical şemaya otomatik eşleme dener.

compare() metodu TASK-026'da bu dosyaya eklenecektir.
"""

import io
import re
from typing import Any
from uuid import UUID

import pandas as pd
from fastapi import UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.canonical import CanonicalOrder, CanonicalInventory, CanonicalCustomer
from app.models.excel import ExcelUpload, ExcelDiffResult

# entity_type -> canonical tabloların beklediği alan adları
# ve bu alanlara eşleşebilecek olası Türkçe/İngilizce sütun başlıkları.
COLUMN_MAPPING_CANDIDATES: dict[str, dict[str, list[str]]] = {
    "orders": {
        "external_id": ["siparis_no", "siparişno", "sipariş_no", "order_id", "order_no"],
        "customer_external_id": ["musteri_no", "müşteri_no", "customer_id", "musteri_kodu"],
        "order_date": ["tarih", "siparis_tarihi", "sipariş_tarihi", "order_date"],
        "total_amount": ["tutar", "toplam_tutar", "total_amount", "toplam"],
        "status": ["durum", "status"],
    },
    "inventory": {
        "external_id": ["urun_no", "ürün_no", "product_id", "urun_kodu", "stok_kodu"],
        "product_name": ["urun_adi", "ürün_adı", "product_name", "ad"],
        "warehouse": ["depo", "warehouse", "ambar"],
        "quantity": ["miktar", "adet", "quantity", "stok_miktari"],
        "reorder_level": ["kritik_seviye", "reorder_level", "minimum_stok"],
    },
    "customers": {
        "external_id": ["musteri_no", "müşteri_no", "customer_id", "musteri_kodu"],
        "name": ["ad", "musteri_adi", "müşteri_adı", "name", "isim"],
        "city": ["sehir", "şehir", "city"],
        "segment": ["segment", "kategori"],
    },
}

# Her entity_type için MUTLAKA eşleşmesi gereken minimum alanlar
REQUIRED_FIELDS: dict[str, list[str]] = {
    "orders": ["external_id", "order_date", "total_amount"],
    "inventory": ["external_id", "product_name", "quantity"],
    "customers": ["external_id", "name"],
}


class ExcelValidationError(Exception):
    """parse_excel sırasında beklenen kolonlar eksikse fırlatılır."""

    def __init__(self, missing_fields: list[str], detected_columns: list[str]):
        self.missing_fields = missing_fields
        self.detected_columns = detected_columns
        alanlar = ", ".join(missing_fields)
        super().__init__(
            f"Excel dosyasında beklenen şu alanlar eşleştirilemedi: {alanlar}. "
            f"Dosyada bulunan sütunlar: {', '.join(detected_columns)}"
        )


def _normalize_column_name(col: str) -> str:
    """'Sipariş No' -> 'siparis_no' gibi normalize eder."""
    col = str(col).strip().lower()
    # Türkçe karakterleri sadeleştir
    replacements = {
        "ı": "i", "ğ": "g", "ü": "u", "ş": "s", "ö": "o", "ç": "c",
    }
    for tr_char, en_char in replacements.items():
        col = col.replace(tr_char, en_char)
    col = re.sub(r"[^a-z0-9]+", "_", col).strip("_")
    return col


def _auto_map_columns(
    normalized_columns: list[str], entity_type: str
) -> dict[str, str]:
    """
    Normalize edilmiş kolon adlarını canonical alanlara eşler.
    Dönen dict: {canonical_field: excel_column_name}
    """
    candidates = COLUMN_MAPPING_CANDIDATES.get(entity_type, {})
    mapping: dict[str, str] = {}

    for canonical_field, possible_names in candidates.items():
        for col in normalized_columns:
            if col in possible_names or col == canonical_field:
                mapping[canonical_field] = col
                break

    return mapping


def parse_excel(
    file_bytes: bytes, filename: str, entity_type: str
) -> tuple[pd.DataFrame, dict[str, Any]]:
    """
    Excel/CSV dosyasını okur, kolonları normalize eder, canonical şemaya
    otomatik eşleme dener.

    Args:
        file_bytes: dosyanın ham içeriği (UploadFile.read() ile alınır)
        filename: orijinal dosya adı (uzantı kontrolü için)
        entity_type: "orders" | "inventory" | "customers"

    Returns:
        (df, mapping_info) — df: normalize edilmiş kolon adlarıyla DataFrame
        mapping_info: {"detected_columns": [...], "column_mapping": {...}, "row_count": N}

    Raises:
        ExcelValidationError: entity_type için gereken minimum alanlar eşleşmezse
        ValueError: dosya formatı desteklenmiyorsa veya okunamıyorsa
    """
    if entity_type not in COLUMN_MAPPING_CANDIDATES:
        raise ValueError(
            f"Desteklenmeyen entity_type: {entity_type}. "
            f"Geçerli değerler: {list(COLUMN_MAPPING_CANDIDATES.keys())}"
        )

    if filename.lower().endswith(".csv"):
        df = pd.read_csv(io.BytesIO(file_bytes))
    elif filename.lower().endswith((".xlsx", ".xls")):
        df = pd.read_excel(io.BytesIO(file_bytes))
    else:
        raise ValueError("Sadece .xlsx, .xls ve .csv dosyaları kabul edilir")

    # Tamamen boş satırları at (bozuk Excel testlerinde gördüğümüz senaryo)
    df = df.dropna(how="all").reset_index(drop=True)

    # Kolon adlarını normalize et
    original_columns = list(df.columns)
    normalized_columns = [_normalize_column_name(c) for c in original_columns]
    df.columns = normalized_columns

    # Otomatik eşleme dene
    column_mapping = _auto_map_columns(normalized_columns, entity_type)

    # Minimum gereken alanlar eşleşti mi kontrol et
    required = REQUIRED_FIELDS.get(entity_type, [])
    missing = [f for f in required if f not in column_mapping]
    if missing:
        raise ExcelValidationError(missing_fields=missing, detected_columns=original_columns)

    # raw_data: DB'ye JSONB olarak yazılacak satır listesi (compare() için)
    raw_data = df.where(pd.notnull(df), None).to_dict(orient="records")
    # Timestamp gibi JSON'a serileşemeyen tipleri string'e çevir
    for record in raw_data:
        for key, value in record.items():
            if hasattr(value, "isoformat"):
                record[key] = value.isoformat()
            elif hasattr(value, "item"):  # numpy int64/float64
                record[key] = value.item()

    mapping_info = {
        "detected_columns": original_columns,
        "column_mapping": column_mapping,
        "row_count": len(df),
        "raw_data": raw_data,
    }
    return df, mapping_info


async def read_upload_file(file: UploadFile) -> bytes:
    """UploadFile'dan bytes okur (test edilebilirlik için ayrı fonksiyon)."""
    return await file.read()


# entity_type -> (canonical model, karşılaştırılacak alan eşlemesi)
# Karşılaştırma alanı: mismatch kontrolü için hangi alan(lar) kıyaslanacak
ENTITY_MODEL_MAP: dict[str, type] = {
    "orders": CanonicalOrder,
    "inventory": CanonicalInventory,
    "customers": CanonicalCustomer,
}

COMPARE_FIELDS: dict[str, list[str]] = {
    "orders": ["total_amount", "status"],
    "inventory": ["quantity", "reorder_level"],
    "customers": ["name", "city"],
}


def _row_to_canonical_dict(row: pd.Series, column_mapping: dict[str, str]) -> dict:
    """Excel satırını canonical alan adlarıyla dict'e çevirir."""
    result = {}
    for canonical_field, excel_col in column_mapping.items():
        value = row.get(excel_col)
        # NaN/NaT değerlerini None'a çevir (JSON serileştirme için)
        if pd.isna(value):
            value = None
        elif hasattr(value, "isoformat"):  # Timestamp -> string
            value = value.isoformat()
        else:
            value = value.item() if hasattr(value, "item") else value
        result[canonical_field] = value
    return result


def _canonical_obj_to_dict(obj, fields: list[str]) -> dict:
    """SQLAlchemy canonical nesnesini dict'e çevirir (sadece ilgili alanlar)."""
    result = {"external_id": obj.external_id}
    for field in fields:
        value = getattr(obj, field, None)
        if hasattr(value, "isoformat"):
            value = value.isoformat()
        elif value is not None and not isinstance(value, (str, int, bool)):
            value = float(value)  # Decimal -> float
        result[field] = value
    return result


class ExcelCompareService:
    """TASK-026 · Excel vs ERP diff motoru."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def compare(self, upload_id: UUID, tenant_id: UUID) -> list[ExcelDiffResult]:
        """
        Excel yüklemesiyle canonical tablodaki ERP verisini karşılaştırır.
        3 diff türü üretir: only_in_excel, only_in_erp, mismatch.

        Adımlar:
          1) excel_uploads kaydını oku (column_mapping + raw_data)
          2) entity_type'a göre canonical tabloyu sorgula (tüm tenant verisi)
          3) İki tarafı external_id üzerinden karşılaştır
          4) excel_diff_results tablosuna yaz
        """
        upload = await self.db.get(ExcelUpload, upload_id)
        if upload is None or upload.tenant_id != tenant_id:
            raise ValueError(f"Upload bulunamadı: {upload_id}")

        entity_type = upload.entity_type
        column_mapping = upload.column_mapping or {}
        model = ENTITY_MODEL_MAP.get(entity_type)
        compare_fields = COMPARE_FIELDS.get(entity_type, [])

        if model is None:
            raise ValueError(f"Desteklenmeyen entity_type: {entity_type}")
        if not upload.raw_data:
            raise ValueError(
                f"Upload {upload_id} için ham veri bulunamadı (raw_data boş)"
            )

        # 1) Canonical tablodaki tüm tenant verisini çek
        result = await self.db.execute(
            select(model).where(model.tenant_id == tenant_id)
        )
        canonical_rows = list(result.scalars().all())
        canonical_by_id = {row.external_id: row for row in canonical_rows}

        # 2) Excel satırlarını (DB'den okunan raw_data) external_id'ye göre indeksle
        external_id_col = column_mapping.get("external_id")
        excel_by_id: dict[str, dict] = {}
        for record in upload.raw_data:
            ext_id = record.get(external_id_col)
            if ext_id is None:
                continue
            mapped = {
                canonical_field: record.get(excel_col)
                for canonical_field, excel_col in column_mapping.items()
            }
            excel_by_id[str(ext_id)] = mapped

        diff_results: list[ExcelDiffResult] = []

        excel_ids = set(excel_by_id.keys())
        canonical_ids = set(canonical_by_id.keys())

        # only_in_excel: Excel'de var, canonical'da yok
        for ext_id in excel_ids - canonical_ids:
            diff = ExcelDiffResult(
                tenant_id=tenant_id,
                upload_id=upload_id,
                diff_type="only_in_excel",
                external_id=ext_id,
                excel_data=excel_by_id[ext_id],
                erp_data=None,
            )
            self.db.add(diff)
            diff_results.append(diff)

        # only_in_erp: canonical'da var, Excel'de yok
        for ext_id in canonical_ids - excel_ids:
            canonical_obj = canonical_by_id[ext_id]
            diff = ExcelDiffResult(
                tenant_id=tenant_id,
                upload_id=upload_id,
                diff_type="only_in_erp",
                external_id=ext_id,
                excel_data=None,
                erp_data=_canonical_obj_to_dict(canonical_obj, compare_fields),
            )
            self.db.add(diff)
            diff_results.append(diff)

        # mismatch: ikisinde de var, compare_fields farklıysa
        for ext_id in excel_ids & canonical_ids:
            excel_data = excel_by_id[ext_id]
            canonical_obj = canonical_by_id[ext_id]
            erp_data = _canonical_obj_to_dict(canonical_obj, compare_fields)

            is_mismatch = False
            for field in compare_fields:
                excel_val = excel_data.get(field)
                erp_val = erp_data.get(field)
                # Sayısal alanları toleranslı karşılaştır (float rounding)
                if isinstance(excel_val, (int, float)) and isinstance(erp_val, (int, float)):
                    if abs(float(excel_val) - float(erp_val)) > 0.01:
                        is_mismatch = True
                        break
                elif str(excel_val) != str(erp_val):
                    is_mismatch = True
                    break

            if is_mismatch:
                diff = ExcelDiffResult(
                    tenant_id=tenant_id,
                    upload_id=upload_id,
                    diff_type="mismatch",
                    external_id=ext_id,
                    excel_data=excel_data,
                    erp_data=erp_data,
                )
                self.db.add(diff)
                diff_results.append(diff)

        await self.db.commit()
        return diff_results
