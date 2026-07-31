# Sistem Mimarisi (ARCHITECTURE.md)

ERPilot'un teknik mimarisi, bileşenleri ve veri akışları. (TASK-038, P1)

## 1. Genel Bakış

ERPilot, işletmelerin ERP verisini doğal dilde (Türkçe) sorgulamasını sağlayan,
çok kiracılı (multi-tenant) bir AI asistan platformudur. Kullanıcı bir soru sorar,
sistem bunu güvenli bir SQL sorgusuna çevirir, çalıştırır ve sonucu Türkçe özetler.

## 2. Bileşenler

```
┌─────────────┐        ┌──────────────────────────────┐        ┌──────────────┐
│  Frontend   │ HTTP   │          Backend API          │  SQL   │  PostgreSQL  │
│  (Next.js)  │──────▶ │          (FastAPI)            │──────▶ │  + pgvector  │
│   Clerk     │ Bearer │  chat / erp / audit / excel   │        └──────────────┘
└─────────────┘  JWT   │  auth · RBAC · SQL validator  │
                       │           │                   │        ┌──────────────┐
                       │           ▼                   │  task  │    Redis     │
                       │      AI Pipeline ─────────────┼──────▶ │  (broker)    │
                       │   (LLM + RAG + embeddings)    │        └──────┬───────┘
                       └───────────┬───────────────────┘               │
                                   │ OpenAI API                        ▼
                                   ▼                            ┌──────────────┐
                            ┌──────────────┐                    │ Celery Worker│
                            │    OpenAI    │                    │  (sync_erp)  │
                            └──────────────┘                    └──────┬───────┘
                                                                       │ Connector
                                                                       ▼
                                                                ┌──────────────┐
                                                                │  ERP (Dolibarr│
                                                                │   / CSV ...)  │
                                                                └──────────────┘
```

## 3. Katmanlar

### 3.1 Frontend (Next.js) — P3
Rol bazlı arayüz: chat, sohbet geçmişi, dashboard, anomali, Excel karşılaştırma,
ERP bağlantı yönetimi, admin paneli. Clerk ile kimlik doğrulama; API'ye
`Authorization: Bearer <token>` ile istek atar.

### 3.2 Backend API (FastAPI) — P1 çekirdek + ekip
`apps/api/app/` altında:
- `main.py` — uygulama girişi, CORS, router bağlama
- `api/v1/` — endpoint'ler: `health`, `chat`, `erp`, `audit`, `excel`
- `security/` — `auth` (Clerk JWT), `rbac` (rol kontrolü), `audit` (denetim izi)
- `dependencies.py` — `get_current_user`, `require_admin` vb. FastAPI dependency'leri
- `services/` — `sql_generator`, `sql_validator`, `chat_service` (AI pipeline orkestrasyonu)
- `ai/` — `llm_client` (OpenAI wrapper), `embeddings` (pgvector/RAG), `prompt_loader`
- `models/` — SQLAlchemy ORM modelleri (tenant, user, canonical, erp_connection, audit, anomaly, excel)
- `db/` — async session + Alembic migration'ları

### 3.3 AI Pipeline (Text-to-SQL) — P1
Akış: **soru → embedding ile ilgili sözlük (RAG) → LLM ile SQL üretimi →
SQL validator (güvenlik) → parametrik çalıştırma → LLM ile Türkçe özet → yanıt.**
`business_glossary` tablosu Türkçe terimleri kolonlara eşler; pgvector ile semantik arama yapılır.

### 3.4 Connector Katmanı — P1 (base) + P2 (implementasyon)
`connectors/` altında plugin mimarisi:
- `base.py` — `ERPConnector` abstract sınıf (test_connection, extract_tables, sync_incremental)
- `registry.py` — connector tipi → sınıf eşlemesi (factory)
- `dolibarr/`, `csv/` — implementasyonlar; `sap_b1/`, `logo/`, `oracle/` — ürün fazı iskeletleri
Yeni ERP eklemek çekirdeğe dokunmadan, yeni bir `connector.py` yazmakla olur.

### 3.5 Worker (Celery) — P2
`workers/` altında arka plan görevleri: `sync_erp` — bağlı ERP'den veriyi çekip
canonical tablolara yazar. Redis broker olarak kullanılır.

### 3.6 Veritabanı (PostgreSQL + pgvector)
Canonical şema (müşteri/sipariş/stok), tenant/user, business_glossary (embedding'li),
chat_messages, erp_connections, audit_logs, anomaly ve excel tabloları.

## 4. Veri Akışı: Bir Sohbet Sorusu

1. Kullanıcı frontend'de soru sorar → `POST /api/v1/chat` (Bearer token)
2. `auth` token'ı doğrular, `rbac` rolü kontrol eder (viewer engellenir)
3. `chat_service` → `sql_generator`: soru embedding'e çevrilir, RAG ile sözlük çekilir, LLM SQL üretir
4. `sql_validator`: SELECT-only + tenant_id + LIMIT + injection kontrolü
5. SQL parametrik çalıştırılır (`:tenant_id` bağlı)
6. Sonuç LLM ile Türkçe özetlenir, kaynak bilgisiyle döner
7. Soru + cevap `chat_messages`'a kaydedilir

## 5. Dağıtım (Deployment)

`docker-compose.yml` ile tüm servisler ayağa kalkar: `postgres`, `redis`, `api`,
`worker`, `web`. Tek komut: `docker compose up -d`. Ortam değişkenleri `.env`
üzerinden verilir (`.env.example` şablon).

Ücretsiz ERP denemesi için ayrı: `docker-compose.dolibarr.yml` (bkz. `docs/DOLIBARR_KURULUM.md`).

## 6. Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| Frontend | Next.js, Clerk |
| Backend | FastAPI, SQLAlchemy (async), Pydantic |
| AI | OpenAI (gpt-4o-mini), text-embedding-3-small, pgvector (RAG) |
| Worker | Celery + Redis |
| Veritabanı | PostgreSQL 16 + pgvector |
| Connector | Dolibarr REST API, CSV |
| Dağıtım | Docker Compose |
