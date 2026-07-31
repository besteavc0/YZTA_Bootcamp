# Güvenlik Dokümanı (SECURITY.md)

ERPilot güvenlik mimarisi, uygulanan kontroller ve sorumluluklar. (TASK-038, P1)

## 1. Kimlik Doğrulama (Authentication)

- Kimlik doğrulama **Clerk** üzerinden yapılır. Frontend, kullanıcı giriş yaptığında
  bir JWT (JSON Web Token) alır ve her API isteğinde `Authorization: Bearer <token>`
  başlığıyla gönderir.
- Backend, token'ı Clerk'in yayınladığı **JWKS** (public key seti) ile doğrular
  (`app/security/auth.py`). İmza geçersizse veya süresi dolmuşsa istek **401** ile reddedilir.
- Doğrulanan kullanıcı, `users` tablosuyla eşlenir (ilk girişte otomatik kayıt/upsert).
- **Geliştirme kolaylığı:** `ENVIRONMENT=development` iken `X-Dev-User-Id`, `X-Dev-Role`,
  `X-Dev-Tenant-Id` başlıklarıyla JWT doğrulaması atlanabilir. Bu bypass **production'da
  tamamen devre dışıdır** ve yalnızca yerel test içindir.

## 2. Yetkilendirme (Authorization / RBAC)

Rol tabanlı erişim kontrolü uygulanır. Roller: **admin > user > viewer**
(`app/security/rbac.py`, `app/dependencies.py`).

| Rol | Yetki |
|-----|-------|
| **admin** | Tüm işlemler: ERP bağlantıları, audit log, kullanıcı yönetimi, chat, dashboard |
| **user** | Chat sorusu sorma, Excel yükleme, anomali/dashboard görüntüleme |
| **viewer** | Yalnızca okuma: geçmiş, anomali, dashboard. Chat sorusu SORAMAZ (403). |

Detaylı endpoint matrisi: `docs/RBAC_MATRIX.md`.

## 3. Çok Kiracılı İzolasyon (Multi-Tenant Isolation)

- Her kayıt bir `tenant_id` ile ilişkilidir. Kullanıcılar yalnızca kendi
  tenant'larının verisine erişir.
- **AI tarafından üretilen her SQL sorgusunda `WHERE tenant_id = :tenant_id` şartı
  zorunludur.** Bu şartı içermeyen sorgular SQL validator tarafından reddedilir
  (`app/services/sql_validator.py`).
- `tenant_id` her zaman parametre olarak bağlanır; asla string birleştirme ile
  sorguya gömülmez (SQL injection koruması).

## 4. AI / Text-to-SQL Güvenliği

LLM'in ürettiği SQL, çalıştırılmadan önce bağımsız bir doğrulayıcıdan geçer
(`sql_validator.py`). Reddedilen durumlar:

- SELECT dışı ifadeler (INSERT, UPDATE, DELETE, DROP, TRUNCATE, ALTER, CREATE, GRANT...)
- Birden fazla ifade (`;` ile ayrılmış çoklu sorgu)
- SQL yorumları (`--`, `/* */`)
- `UNION` tabanlı sorgular
- `tenant_id` filtresi olmayan sorgular
- `LIMIT` üst sınırı 1000'e zorlanır (yoksa eklenir)

## 5. Hassas Veri ve Kimlik Bilgileri

- ERP bağlantı bilgileri (API key, şifre vb.) veritabanında **şifreli** saklanır
  (`erp_connections.config_encrypted`, Fernet simetrik şifreleme).
- Şifreleme anahtarı `CREDENTIAL_ENCRYPTION_KEY` ortam değişkeninden okunur;
  koda gömülmez. Uygulama bu anahtar olmadan hassas alanları çözemez.
- `OPENAI_API_KEY`, `CLERK_SECRET_KEY` gibi sırlar yalnızca ortam değişkeni /
  `.env` üzerinden verilir. `.env` dosyası `.gitignore` ile depoya dahil edilmez.

## 6. Denetim İzi (Audit Log)

- Hassas işlemler (ERP bağlantısı ekleme/silme, kullanıcı yönetimi vb.) `audit_logs`
  tablosuna kaydedilir (`app/security/audit.py`, `app/api/v1/audit.py`).
- Audit log'ları yalnızca **admin** rolü görüntüleyebilir.

## 7. Taşıma Katmanı ve CORS

- Production'da tüm trafik HTTPS üzerinden taşınmalıdır (deployment sorumluluğu).
- CORS yalnızca bilinen frontend origin'ine izin verir (`app/main.py`).

## 8. Bilinen Sınırlar / Sorumluluk Reddi

- Bu MVP'de Keycloak/kurumsal SSO yoktur; kimlik doğrulama Clerk ile yapılır.
- Rate limiting ve WAF gibi altyapı seviyesi korumalar deployment aşamasında
  (ters proxy / API gateway) eklenmelidir.
- Güvenlik testleri için bkz. `docs/SECURITY_TEST_RESULTS.md` (TASK-034).

## 9. Güvenlik Açığı Bildirimi

Bir güvenlik açığı tespit edilirse, ekip Scrum Master'ı (Hatice Şevik) üzerinden
özel olarak bildirilmelidir. Açıklar herkese açık issue olarak paylaşılmamalıdır.
