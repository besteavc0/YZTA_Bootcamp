# Güvenlik Akış Testi Sonuçları (SECURITY_TEST_RESULTS.md)

TASK-034 · P1 · Sprint 3

Bu doküman, ERPilot'un güvenlik kontrollerinin 6 senaryo üzerinden doğrulanmasını
içerir. Her senaryo hem otomatik test (pytest) hem de manuel/canlı doğrulama ile
kontrol edilebilir.

> Çalıştırma ortamı: `apps/api` dizini, `ENVIRONMENT=development`, kurulu `erpilot` DB.
> Otomatik testler: `pytest tests/test_tenant_isolation.py tests/test_chat_endpoint.py -v`

## Test Ortamı Bilgileri

| Alan | Değer |
|------|-------|
| Tarih | 31.07.2026 |
| Ortam | Local / development |
| Test eden | Beste Avcı  |
| Backend commit | (git rev-parse --short HEAD) |

---

## Senaryo 1 — Kimliksiz erişim reddedilir (401)

**Beklenen:** Token olmadan `POST /api/v1/chat` ve `GET /api/v1/auth/me` → **401**.

**Otomatik test:** `test_unauthenticated_gets_401`, `test_chat_requires_auth`
**Manuel doğrulama:**
```
curl -i -X POST http://localhost:8000/api/v1/chat -H "Content-Type: application/json" -d '{"question":"test"}'
# Beklenen: HTTP/1.1 401
```
**Sonuç:** ☐ PASS 

---

## Senaryo 2 — viewer chat sorusu soramaz (403)

**Beklenen:** `viewer` rolü `POST /api/v1/chat` → **403** (yalnızca okuma yetkisi).

**Otomatik test:** `test_viewer_cannot_chat`
**Manuel doğrulama:**
```
curl -i -X POST http://localhost:8000/api/v1/chat \
  -H "X-Dev-User-Id: <uid>" -H "X-Dev-Role: viewer" -H "X-Dev-Tenant-Id: <tid>" \
  -H "Content-Type: application/json" -d '{"question":"test"}'
# Beklenen: HTTP/1.1 403
```
**Sonuç:** ☐ PASS 

---

## Senaryo 3 — user ayrıcalıklı endpoint'e giremez (403)

**Beklenen:** `user` rolü admin-only bir işleme (ör. ERP bağlantısı ekleme / audit log)
eriştiğinde → **403**.

**Manuel doğrulama:**
```
curl -i http://localhost:8000/api/v1/audit/logs \
  -H "X-Dev-User-Id: <uid>" -H "X-Dev-Role: user" -H "X-Dev-Tenant-Id: <tid>"
# Beklenen: HTTP/1.1 403  (audit yalnızca admin)
```
**Sonuç:** ☐ PASS 
> Not: Test sırasında audit endpoint'inin router.py'a bağlanmamış olduğu tespit
> edildi (GET /api/v1/audit/logs 404 dönüyordu). Ayrı bir bugfix ile (fix/audit-router)



---

## Senaryo 4 — Cross-tenant veri sızıntısı engellenir

**Beklenen:** AI'ın ürettiği SQL `tenant_id` filtresi içermiyorsa reddedilir;
bir tenant başka tenant'ın verisini göremez.

**Otomatik test:** `test_sql_without_tenant_filter_rejected`,
`test_cross_tenant_union_rejected`, `test_valid_tenant_scoped_query_passes`
**Sonuç:** ☐ PASS 

---

## Senaryo 5 — Tehlikeli SQL / injection reddedilir

**Beklenen:** DROP/INSERT/UPDATE/DELETE/UNION/çoklu-sorgu/yorum içeren üretilmiş
SQL, validator tarafından reddedilir.

**Otomatik test:** `test_dangerous_sql_rejected[...]` (13 varyant)
**Sonuç:** ☐ PASS 

---

## Senaryo 6 — Şifreleme anahtarı olmadan hassas veri çözülemez

**Beklenen:** `CREDENTIAL_ENCRYPTION_KEY` tanımsız/yanlışsa, ERP bağlantı
bilgileri (config_encrypted) çözülemez ve işlem güvenli şekilde hata verir
(sessizce düz metin sızdırmaz).

**Manuel doğrulama:** ERP bağlantısı çözme akışı yanlış anahtarla denenir;
`InvalidToken`/şifre çözme hatası beklenir, düz metin DÖNMEZ.
**Sonuç:** ☐ PASS 

---

## Özet

| # | Senaryo | Sonuç |
|---|---------|-------|
| 1 | Kimliksiz erişim → 401 | ☐ |
| 2 | viewer chat → 403 | ☐ |
| 3 | user ayrıcalıklı endpoint → 403 | ☐ |
| 4 | Cross-tenant izolasyon | ☐ |
| 5 | Tehlikeli SQL reddi | ☐ |
| 6 | Şifreleme anahtarı zorunluluğu | ☐ |

**Genel sonuç:** … / 6 senaryo başarılı.

> Testleri çalıştırdıktan sonra ☐ kutularını ☑ (PASS) olarak işaretle ve tarih/commit
> alanlarını doldur. Otomatik test çıktısının ekran görüntüsü bu dokümana veya PR'a eklenebilir.
