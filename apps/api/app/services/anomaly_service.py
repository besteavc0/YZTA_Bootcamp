"""
TASK-014 · Anomali servis iskeleti

Bu dosya, Sprint 2'de doldurulacak anomali kural motorunun iskeletini içerir.
5 kuralın detaylı tasarımı için: docs/anomaly_rules.md
Kaynak: ERPilot_Jira_Sprint_Plani.md, TASK-022 (Sprint 2 — Anomali kural motoru implementasyonu)

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

    async def check_gece_saati_yuksek_tutarli_siparis(self, tenant_id: str) -> List[Dict[str, Any]]:
        """
        Kural 1: Saat 00:00-06:00 arası VE total_amount > 50.000 olan siparişler.
        Severity: high
        TODO (Sprint 2): canonical_orders üzerinde saat + tutar filtresi uygula.
        """
        pass

    async def check_kisa_surede_cok_siparis(self, tenant_id: str) -> List[Dict[str, Any]]:
        """
        Kural 2: Aynı customer_external_id'den 1 saat içinde 5'ten fazla sipariş.
        Severity: medium
        TODO (Sprint 2): customer_external_id + order_date time-window group-by.
        """
        pass

    async def check_negatif_veya_sifir_stok(self, tenant_id: str) -> List[Dict[str, Any]]:
        """
        Kural 3: canonical_inventory'de quantity <= 0 olan ürünler.
        Severity: high
        TODO (Sprint 2): canonical_inventory'de quantity <= 0 filtrele.
        """
        pass

    async def check_ortalamanin_3_katindan_fazla_tutar(self, tenant_id: str) -> List[Dict[str, Any]]:
        """
        Kural 4: total_amount > (AVG(total_amount) * 3).
        Severity: medium
        TODO (Sprint 2): genel ortalamayı hesapla, sapan kayıtları bul.
        """
        pass

    async def check_30_gun_siparis_vermeyen_musteri(self, tenant_id: str) -> List[Dict[str, Any]]:
        """
        Kural 5: Son 30 günde canonical_orders'da kaydı olmayan müşteriler (churn riski).
        Severity: low
        TODO (Sprint 2): canonical_customers vs canonical_orders NOT EXISTS sorgusu.
        """
        pass

    async def run_all_rules(self, tenant_id: str) -> List[Dict[str, Any]]:
        """
        Tüm kuralları sırayla çalıştırır ve sonuçları birleştirir.
        Sprint 2 - TASK-022'de aktif tüm kuralları çalıştırıp
        anomaly_findings tablosuna yazacak şekilde doldurulacak.
        """
        pass
