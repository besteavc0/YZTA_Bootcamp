# Anomali Kuralları Tasarım Dokümanı

> TASK-014 çıktısıdır. Kod implementasyonu Sprint 2 - TASK-022'de yapılacaktır.
> İskelet: `apps/api/app/services/anomaly_service.py`
> Kaynak: ERPILOT_MASTER_PLAN.md, Bölüm 10 — Anomali Kural Motoru (MVP örnek kuralları)

---

## Kural 1 — Yüksek Tutarlı Sipariş

- **Sorgulanacak tablo:** `canonical_orders`
- **Severity:** high
- **Tetikleme koşulu:** Son 7 gün içinde `total_amount > 100.000`
- **SQL mantığı (pseudocode):**
  ```sql
  SELECT external_id, total_amount, order_date
  FROM canonical_orders
  WHERE tenant_id = :tenant_id
    AND total_amount > 100000
    AND order_date >= CURRENT_DATE - INTERVAL '7 days'
  ```
- **Gerekçe:** Olağan dışı yüksek tutarlı bir sipariş; hatalı veri girişi, fiyatlandırma hatası veya dikkat gerektiren büyük bir işlem olabilir.

---

## Kural 2 — Kritik Stok Altı Ürünler

- **Sorgulanacak tablo:** `canonical_inventory`
- **Severity:** medium
- **Tetikleme koşulu:** `quantity < reorder_level` (reorder_level tanımlıysa)
- **SQL mantığı (pseudocode):**
  ```sql
  SELECT product_name, quantity, reorder_level
  FROM canonical_inventory
  WHERE tenant_id = :tenant_id
    AND reorder_level IS NOT NULL
    AND quantity < reorder_level
  ```
- **Gerekçe:** Stok tükenme riski; tedarik/satın alma ekibinin önceden haberdar edilmesi operasyonel devamlılık için önemlidir.

---

## Kural 3 — Aynı Gün Çoklu İade

- **Sorgulanacak tablo:** `canonical_orders`
- **Severity:** medium
- **Tetikleme koşulu:** Aynı günde `status = 'returned'` olan sipariş sayısı 10'dan fazla (son 1 gün)
- **SQL mantığı (pseudocode):**
  ```sql
  SELECT order_date, COUNT(*) as iade_sayisi
  FROM canonical_orders
  WHERE tenant_id = :tenant_id
    AND status = 'returned'
    AND order_date >= CURRENT_DATE - INTERVAL '1 day'
  GROUP BY order_date
  HAVING COUNT(*) > 10
  ```
- **Gerekçe:** Kısa sürede yoğun iade; ürün/kalite sorunu, hatalı kampanya veya sistemsel bir hata göstergesi olabilir.

---

## Kural 4 — Sıfır Tutarlı Sipariş

- **Sorgulanacak tablo:** `canonical_orders`
- **Severity:** high
- **Tetikleme koşulu:** Son 30 gün içinde `total_amount = 0`
- **SQL mantığı (pseudocode):**
  ```sql
  SELECT external_id, order_date
  FROM canonical_orders
  WHERE tenant_id = :tenant_id
    AND total_amount = 0
    AND order_date >= CURRENT_DATE - INTERVAL '30 days'
  ```
- **Gerekçe:** Sıfır tutarlı bir sipariş normalde beklenmez; veri senkronizasyon hatası veya hatalı kayıt oluşturma sürecine işaret edebilir.

---

## Kural 5 — Gece Saatlerinde Sipariş (Veri Kalitesi)

- **Sorgulanacak tablo:** `canonical_orders`
- **Severity:** low
- **Tetikleme koşulu:** Son 7 gün içindeki siparişler taranır (veri kalitesi/gözlem amaçlı, ilk 50 kayıt)
- **SQL mantığı (pseudocode):**
  ```sql
  SELECT external_id, order_date
  FROM canonical_orders
  WHERE tenant_id = :tenant_id
    AND order_date >= CURRENT_DATE - INTERVAL '7 days'
  LIMIT 50
  ```
- **Gerekçe:** Düşük öncelikli, veri kalitesi/gözlem amaçlı bir tarama; Sprint 2'de saat bazlı filtre (örn. 00:00–06:00) eklenerek daraltılabilir.

---

## Genel Notlar

- Tüm kurallar `tenant_id` ile filtrelenerek çok kiracılı (multi-tenant) izolasyon sağlanmalıdır.
- Kurallar `anomaly_rules` tablosunda JSON `rule_config` olarak saklanacak; Celery job (`workers/tasks/run_anomalies.py`) bu kuralları sırayla çalıştırıp `anomaly_findings` tablosuna sonuç yazacak (bkz. Master Plan Bölüm 10).
- Eşik değerleri (₺100.000, 10 iade/gün, 30 gün vb.) Sprint 2'de `rule_config` içinden konfigüre edilebilir hale getirilecek.
- Her finding, `anomaly_findings` tablosuna `rule_name`, `severity`, `tenant_id`, `related_record_id`, `detected_at`, `is_resolved` alanlarıyla yazılacak.
