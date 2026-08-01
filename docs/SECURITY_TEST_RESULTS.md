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
| Backend commit | eaae60a |

---

## Senaryo 1 — Kimliksiz erişim reddedilir (401)

**Beklenen:** Token olmadan `POST /api/v1/chat` ve `GET /api/v1/auth/me` → **401**.

**Otomatik test:** `test_unauthenticated_gets_401`, `test_chat_requires_auth`
**Sonuç:** ☑ PASS

---

## Senaryo 2 — viewer chat sorusu soramaz (403)

**Beklenen:** `viewer` rolü `POST /api/v1/chat` → **403** (yalnızca okuma yetkisi).

**Otomatik test:** `test_viewer_cannot_chat`
**Sonuç:** ☑ PASS

---

## Senaryo 3 — user ayrıcalıklı endpoint'e giremez (403)

**Beklenen:** `user` rolü admin-only bir işleme (audit log) eriştiğinde → **403**.

**Manuel doğrulama:** `curl` ile `X-Dev-Role: user` → 403, `X-Dev-Role: admin` → 200.
**Sonuç:** ☑ PASS
> Not: Test sırasında audit endpoint'inin router.py'a bağlanmamış olduğu tespit
> edildi (GET /api/v1/audit/logs 404 dönüyordu). Ayrı bir bugfix ile (fix/audit-router)
> router'a audit.router eklendi; ardından test PASS (user→403, admin→200).

---

## Senaryo 4 — Cross-tenant veri sızıntısı engellenir

**Beklenen:** AI'ın ürettiği SQL `tenant_id` filtresi içermiyorsa reddedilir.

**Otomatik test:** `test_sql_without_tenant_filter_rejected`,
`test_cross_tenant_union_rejected`, `test_valid_tenant_scoped_query_passes`
**Sonuç:** ☑ PASS

---

## Senaryo 5 — Tehlikeli SQL / injection reddedilir

**Beklenen:** DROP/INSERT/UPDATE/DELETE/UNION/çoklu-sorgu/yorum içeren SQL reddedilir.

**Otomatik test:** `test_dangerous_sql_rejected[...]` (13 varyant)
**Sonuç:** ☑ PASS

---

## Senaryo 6 — Şifreleme anahtarı olmadan hassas veri çözülemez

**Beklenen:** `CREDENTIAL_ENCRYPTION_KEY` yanlış/eksikse, şifreli veri çözülemez.

**Manuel doğrulama:** Yanlış Fernet anahtarıyla decrypt denendi; `InvalidToken` alındı,
düz metin dönmedi.
**Sonuç:** ☑ PASS

---

**Genel sonuç:** 6 / 6 senaryo başarılı.