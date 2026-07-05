"""
TASK-014 · Anomali servis iskeleti

Bu dosya, Sprint 2'de doldurulacak anomali kural motorunun iskeletini içerir.
5 kuralın detaylı tasarımı için: docs/anomaly_rules.md
Kaynak: ERPILOT_MASTER_PLAN.md, Bölüm 10 — Anomali Kural Motoru (MVP örnek kuralları)

Not: Metotlar Sprint 1'de BOŞTUR (sadece imza + docstring + pass).
Gerçek SQL/pandas mantığı Sprint 2 - TASK-022'de yazılacak.
"""

from typing import List, Dict, Any


class AnomalyService:
    """
    ERP verisinde anomali tespiti yapan servis.
    Her `check_*` metodu bir kuralı temsil eder ve bulunan anomalileri
    (finding) bir liste olarak döndürür.

    Sprint 2'de her metot:
      1. İlgili canonical tabloyu sorgulayacak
      2. Kural koşulunu değerlendirecek
      3. Koşulu sağlayan kayıtları `anomaly_findings` tablosuna yazacak
    """

    def __init__(self, db_session=None):
        self.db_session = db_session

    async def check_yuksek_tutarli_siparis(self, tenant_id: str) -> List[Dict[str, Any]]:
        """
        Kural 1: Son 7 gün içinde total_amount > 100.000 olan siparişler.
        Severity: high
        TODO (Sprint 2): canonical_orders üzerinde tutar + tarih filtresi uygula.
        """
        pass

    async def check_kritik_stok_alti_urunler(self, tenant_id: str) -> List[Dict[str, Any]]:
        """
        Kural 2: quantity < reorder_level olan ürünler.
        Severity: medium
        TODO (Sprint 2): canonical_inventory'de quantity < reorder_level filtrele.
        """
        pass

    async def check_ayni_gun_coklu_iade(self, tenant_id: str) -> List[Dict[str, Any]]:
        """
        Kural 3: Aynı günde status='returned' sipariş sayısının 10'dan fazla olması.
        Severity: medium
        TODO (Sprint 2): order_date group-by + HAVING COUNT(*) > 10.
        """
        pass

    async def check_sifir_tutarli_siparis(self, tenant_id: str) -> List[Dict[str, Any]]:
        """
        Kural 4: Son 30 gün içinde total_amount = 0 olan siparişler.
        Severity: high
        TODO (Sprint 2): canonical_orders'da total_amount = 0 filtrele.
        """
        pass

    async def check_gece_saatlerinde_siparis(self, tenant_id: str) -> List[Dict[str, Any]]:
        """
        Kural 5: Son 7 gündeki siparişlerin veri kalitesi taraması (ilk 50 kayıt).
        Severity: low
        TODO (Sprint 2): saat bazlı filtre (00:00-06:00) eklenerek daraltılabilir.
        """
        pass

    async def run_all_checks(self, tenant_id: str) -> List[Dict[str, Any]]:
        """
        Tüm kuralları sırayla çalıştırır ve sonuçları birleştirir.
        Sprint 2 - TASK-023'teki Celery job (workers/tasks/run_anomalies.py)
        bu metodu çağıracak.
        """
        pass
