-- ============================================================
-- ERPilot — PostgreSQL Şema Taslağı (TASK-003)
-- Bu dosya container ilk açılışında otomatik çalışır
-- (docker-compose.yml içinde postgres servisine
--  /docker-entrypoint-initdb.d/init.sql olarak mount edilir)
-- ============================================================

-- ------------------------------------------------------------
-- 0. EXTENSION'LAR
-- ------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- ------------------------------------------------------------
-- 1. TENANTS — her müşteri şirket bir tenant
-- ------------------------------------------------------------
CREATE TABLE tenants (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(255) NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 2. USERS — Clerk ile senkron kullanıcılar
-- ------------------------------------------------------------
CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    auth_provider_id    VARCHAR(255) UNIQUE NOT NULL,  -- Clerk user ID
    email               VARCHAR(255) NOT NULL,
    full_name           VARCHAR(255),
    role                VARCHAR(20) NOT NULL DEFAULT 'user', -- admin | user | viewer
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at       TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_role CHECK (role IN ('admin', 'user', 'viewer'))
);

-- ------------------------------------------------------------
-- 3. AUDIT_LOGS — kim ne zaman ne yaptı
-- ------------------------------------------------------------
CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    action          VARCHAR(100) NOT NULL, -- login | chat_query | excel_upload | erp_sync | erp_config_change | user_role_change
    resource_type   VARCHAR(100),
    resource_id     VARCHAR(255),
    details         JSONB,
    ip_address      VARCHAR(64),
    user_agent      VARCHAR(512),
    status          VARCHAR(20) NOT NULL DEFAULT 'success', -- success | denied | error
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 4. ERP_CONNECTIONS — bağlantı tanımları (credential şifreli)
-- ------------------------------------------------------------
CREATE TABLE erp_connections (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name                VARCHAR(255) NOT NULL,
    connector_type      VARCHAR(50) NOT NULL, -- csv | erpnext | dolibarr | sap_b1 | logo
    config_encrypted    TEXT NOT NULL,        -- Fernet ile şifrelenmiş JSON — asla plaintext yazılmaz
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    last_sync_at        TIMESTAMPTZ,
    last_sync_status    VARCHAR(20),          -- success | failed | never
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 5. SYNC_RUNS — her sync denemesinin geçmişi
-- ------------------------------------------------------------
CREATE TABLE sync_runs (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    erp_connection_id   UUID NOT NULL REFERENCES erp_connections(id) ON DELETE CASCADE,
    started_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at         TIMESTAMPTZ,
    rows_synced         INTEGER DEFAULT 0,
    status              VARCHAR(20) NOT NULL DEFAULT 'running', -- running | success | failed
    error_message       TEXT
);

-- ------------------------------------------------------------
-- 6. CANONICAL_CUSTOMERS — tüm ERP kaynaklarından normalize müşteri
-- ------------------------------------------------------------
CREATE TABLE canonical_customers (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    external_id     VARCHAR(255) NOT NULL,   -- kaynak sistemdeki orijinal ID
    source          VARCHAR(50) NOT NULL,    -- csv | erpnext | dolibarr ...
    name            VARCHAR(255) NOT NULL,
    city            VARCHAR(100),
    segment         VARCHAR(100),            -- Kurumsal | Bireysel | KOBİ
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_customer_external UNIQUE (tenant_id, external_id, source)
);

-- ------------------------------------------------------------
-- 7. CANONICAL_ORDERS
-- ------------------------------------------------------------
CREATE TABLE canonical_orders (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    external_id             VARCHAR(255) NOT NULL,
    source                  VARCHAR(50) NOT NULL,
    customer_external_id    VARCHAR(255),
    order_date              TIMESTAMPTZ NOT NULL,
    total_amount            NUMERIC(14,2) NOT NULL,
    status                  VARCHAR(50) NOT NULL DEFAULT 'completed', -- completed|pending|cancelled|returned
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_order_external UNIQUE (tenant_id, external_id, source)
);

-- ------------------------------------------------------------
-- 8. CANONICAL_ORDER_LINES — sipariş kalemleri (opsiyonel detay)
-- ------------------------------------------------------------
CREATE TABLE canonical_order_lines (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_id        UUID NOT NULL REFERENCES canonical_orders(id) ON DELETE CASCADE,
    product_external_id VARCHAR(255),
    product_name    VARCHAR(255),
    quantity        NUMERIC(12,2) NOT NULL DEFAULT 1,
    unit_price      NUMERIC(14,2),
    line_total      NUMERIC(14,2),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 9. CANONICAL_INVENTORY
-- ------------------------------------------------------------
CREATE TABLE canonical_inventory (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    external_id     VARCHAR(255) NOT NULL,   -- product_id
    source          VARCHAR(50) NOT NULL,
    product_name    VARCHAR(255) NOT NULL,
    warehouse       VARCHAR(100),
    quantity        NUMERIC(14,2) NOT NULL DEFAULT 0,
    reorder_level   NUMERIC(14,2) NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_inventory_external UNIQUE (tenant_id, external_id, source, warehouse)
);

-- ------------------------------------------------------------
-- 10. BUSINESS_GLOSSARY — Türkçe <-> şema sözlüğü (RAG için embedding)
-- ------------------------------------------------------------
CREATE TABLE business_glossary (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name      VARCHAR(100) NOT NULL,
    column_name     VARCHAR(100) NOT NULL,
    turkish_label   VARCHAR(255) NOT NULL,
    description     TEXT,
    aliases         JSONB,                 -- ["satış", "tutar", "ciro"]
    embedding       vector(1536),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 11. CHAT_MESSAGES
-- ------------------------------------------------------------
CREATE TABLE chat_messages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role            VARCHAR(20) NOT NULL,  -- user | assistant
    content         TEXT NOT NULL,
    sql_query       TEXT,
    sources         JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 12. ANOMALY_RULES
-- ------------------------------------------------------------
CREATE TABLE anomaly_rules (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    severity        VARCHAR(20) NOT NULL DEFAULT 'medium', -- low | medium | high
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 13. ANOMALY_FINDINGS
-- ------------------------------------------------------------
CREATE TABLE anomaly_findings (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    rule_id             UUID NOT NULL REFERENCES anomaly_rules(id) ON DELETE CASCADE,
    resource_type       VARCHAR(100),          -- canonical_orders | canonical_inventory | canonical_customers
    resource_external_id VARCHAR(255),
    description         TEXT,
    severity            VARCHAR(20) NOT NULL,
    is_resolved         BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_by         UUID REFERENCES users(id) ON DELETE SET NULL,
    resolution_note     TEXT,
    detected_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at         TIMESTAMPTZ,
    CONSTRAINT uq_finding_dedupe UNIQUE (tenant_id, rule_id, resource_external_id, detected_at)
);

-- ------------------------------------------------------------
-- 14. DAILY_DIGESTS
-- ------------------------------------------------------------
CREATE TABLE daily_digests (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    digest_date     DATE NOT NULL,
    metrics         JSONB NOT NULL,
    summary_text    TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_digest_per_day UNIQUE (tenant_id, digest_date)
);

-- ------------------------------------------------------------
-- 15. EXCEL_UPLOADS
-- ------------------------------------------------------------
CREATE TABLE excel_uploads (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    uploaded_by     UUID REFERENCES users(id) ON DELETE SET NULL,
    filename        VARCHAR(255) NOT NULL,
    entity_type     VARCHAR(50) NOT NULL, -- orders | customers | inventory
    column_mapping  JSONB,
    row_count       INTEGER,
    uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 16. EXCEL_DIFF_RESULTS
-- ------------------------------------------------------------
CREATE TABLE excel_diff_results (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    upload_id       UUID NOT NULL REFERENCES excel_uploads(id) ON DELETE CASCADE,
    diff_type       VARCHAR(20) NOT NULL, -- only_in_excel | only_in_erp | mismatch
    external_id     VARCHAR(255),
    excel_data      JSONB,
    erp_data        JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEX'LER
-- ============================================================
CREATE INDEX idx_orders_tenant_date       ON canonical_orders (tenant_id, order_date);
CREATE INDEX idx_inventory_tenant         ON canonical_inventory (tenant_id);
CREATE INDEX idx_findings_tenant_resolved ON anomaly_findings (tenant_id, is_resolved);
CREATE INDEX idx_audit_tenant_created     ON audit_logs (tenant_id, created_at DESC);
CREATE INDEX idx_users_auth_provider      ON users (auth_provider_id);
CREATE INDEX idx_chat_tenant_user         ON chat_messages (tenant_id, user_id, created_at DESC);
CREATE INDEX idx_sync_runs_connection     ON sync_runs (erp_connection_id, started_at DESC);
CREATE INDEX idx_excel_diff_upload        ON excel_diff_results (upload_id, diff_type);

-- pgvector semantik arama için ivfflat index
CREATE INDEX idx_glossary_embedding ON business_glossary
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);
