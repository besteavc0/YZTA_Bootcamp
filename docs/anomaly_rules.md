# Anomali Kuralları Tasarım Dokümanı

> TASK-014 çıktısıdır. Kod implementasyonu Sprint 2 - TASK-022'de yapılacaktır.
> İskelet: `apps/api/app/services/anomaly_service.py`
> Kaynak: ERPilot_Jira_Sprint_Plani.md, TASK-022 (Sprint 2 — Anomali kural motoru implementasyonu)
> Not: Bu 5 kural, Sprint 2'de `anomaly_rules` tablosuna seed edilecek ve `seed_demo_data.py` içinde tanımlanacak kurallarla birebir aynıdır.

---

## Kural 1 — Gece Saati Yüksek Tutarlı Sipariş

- **Sorgulanacak tablo:** `canonical_orders`
- **Severity:** high
- **Tetikleme koşulu:** Siparişin saati 00:00–06:00 arasında VE `total_amount > 50.000`
- **SQL mantığı (pseudocode):**
  ```sql
  SELECT external_id, total_amount, order_date
  FROM canonical_orders
  WHERE tenant_id = :tenant_id
    AND EXTRACT(HOUR FROM order_date) BETWEEN 0 AND 6
    AND total_amount > 50000
  ```
- **Gerekçe:** Mesai saatleri dışında yapılan yüksek tutarlı bir sipariş; yetkisiz erişim, hatalı veri girişi veya olağan dışı bir işlem göstergesi olabilir.

---

## Kural 2 — Aynı Müşteriden Kısa Sürede Çok Sipariş

- **Sorgulanacak tablo:** `canonical_orders`
- **Severity:** medium
- **Tetikleme koşulu:** Aynı `customer_external_id`'den 1 saatlik zaman penceresinde 5'ten fazla sipariş
- **SQL mantığı (pseudocode):**
  ```sql
  SELECT customer_external_id, COUNT(*) as siparis_sayisi
  FROM canonical_orders
  WHERE tenant_id = :tenant_id
  GROUP BY customer_external_id, date_trunc('hour', order_date)
  HAVING COUNT(*) > 5
  ```
- **Gerekçe:** Bot/otomasyon kaynaklı hatalı sipariş akışı veya entegrasyon hatası olabilir.

---

## Kural 3 — Negatif veya Sıfır Stok

- **Sorgulanacak tablo:** `canonical_inventory`
- **Severity:** high
- **Tetikleme koşulu:** `quantity <= 0`
- **SQL mantığı (pseudocode):**
  ```sql
  SELECT product_name, quantity
  FROM canonical_inventory
  WHERE tenant_id = :tenant_id
    AND quantity <= 0
  ```
- **Gerekçe:** Negatif stok mantıksal olarak imkânsızdır; senkronizasyon hatası veya iptal/iade akışında tutarsızlığa işaret eder. Sıfır stok da tükenme durumunu gösterir, yüksek öncelikle incelenmelidir.

---

## Kural 4 — Ortalamanın 3 Katından Fazla Sipariş Tutarı

- **Sorgulanacak tablo:** `canonical_orders`
- **Severity:** medium
- **Tetikleme koşulu:** `total_amount > (genel ortalama total_amount * 3)`
- **SQL mantığı (pseudocode):**
  ```sql
  SELECT * FROM canonical_orders
  WHERE tenant_id = :tenant_id
    AND total_amount > (
      SELECT AVG(total_amount) * 3
      FROM canonical_orders
      WHERE tenant_id = :tenant_id
    )
  ```
- **Gerekçe:** Fiyatlandırma hatası, yanlış girilen miktar veya olağan dışı büyük bir sipariş; manuel doğrulama gerektirir.

---

## Kural 5 — 30 Gün Sipariş Vermeyen Müşteri (Churn Riski)

- **Sorgulanacak tablo:** `canonical_customers` (canonical_orders ile ilişkili)
- **Severity:** low
- **Tetikleme koşulu:** Son 30 günde `canonical_orders`'da kaydı olmayan müşteriler
- **SQL mantığı (pseudocode):**
  ```sql
  SELECT c.* FROM canonical_customers c
  WHERE c.tenant_id = :tenant_id
    AND NOT EXISTS (
      SELECT 1 FROM canonical_orders o
      WHERE o.customer_external_id = c.external_id
        AND o.order_date >= CURRENT_DATE - INTERVAL '30 days'
    )
  ```
- **Gerekçe:** Düşük öncelikli ama iş değeri yüksek bir sinyal; pazarlama/müşteri ilişkileri ekibinin proaktif olarak müşteriyle iletişime geçmesini sağlar.

---

## Genel Notlar

- Tüm kurallar `tenant_id` ile filtrelenerek çok kiracılı (multi-tenant) izolasyon sağlanmalıdır.
- Kurallar `anomaly_rules` tablosuna Sprint 2'de (`seed_demo_data.py` içinde) seed edilecek; `AnomalyService.run_all_rules()` bu kuralları sırayla çalıştırıp `anomaly_findings` tablosuna sonuç yazacaktır.
- Eşik değerleri (₺50.000, 5 sipariş/saat, 3x ortalama, 30 gün vb.) sabit (hardcoded) olarak başlanacak, ileride `anomaly_rules.rule_config` üzerinden konfigüre edilebilir hale getirilebilir.
- Her finding, `anomaly_findings` tablosuna `rule_name`, `severity`, `tenant_id`, `related_record_id`, `detected_at`, `is_resolved` alanlarıyla yazılacak.
- Aynı kural + aynı `external_id` kombinasyonu için aynı gün içinde birden fazla finding oluşturulmaması gerekir (duplicate önleme, TASK-022 kabul kriteri).
