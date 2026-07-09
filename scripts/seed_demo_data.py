"""
ERPilot - Demo Veri Seed Script (TASK-004)

Kullanim:
    python scripts/seed_demo_data.py

Ortam degiskeni ile veritabani baglantisini ozellestirebilirsin:
    DATABASE_URL=postgresql://postgres:postgres@localhost:5432/erpilot python scripts/seed_demo_data.py

Script idempotent'tir: birden fazla kez calistirilabilir, duplicate kayit olusturmaz
(ON CONFLICT ... DO UPDATE kullanilir).
"""

import os
import json
import uuid
import pandas as pd
import psycopg2
from psycopg2.extras import execute_values

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/erpilot",
)

DEMO_TENANT_NAME = "ERPilot Demo Sirketi"
DEMO_ADMIN_EMAIL = "admin@demo.com"
DEMO_SOURCE = "csv"

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Bu script scripts/ altinda calisacagi icin data/sample bir ust dizinde bekleniyor.
# Eger farkli bir konumdan calistiriyorsan asagidaki yollari duzelt.
DATA_DIR = os.path.join(BASE_DIR, "..", "data", "sample")
GLOSSARY_PATH = os.path.join(BASE_DIR, "..", "data", "business_glossary.json")


def get_connection():
    return psycopg2.connect(DATABASE_URL)


def upsert_tenant(cur):
    # Once var olan tenant'i ara (tenants.name uzerinde UNIQUE constraint
    # olmadigi icin ON CONFLICT guvenilir degil - once SELECT ile kontrol ediyoruz)
    cur.execute("SELECT id FROM tenants WHERE name = %s LIMIT 1", (DEMO_TENANT_NAME,))
    row = cur.fetchone()
    if row:
        return row[0]

    new_id = str(uuid.uuid4())
    cur.execute(
        """
        INSERT INTO tenants (id, name, is_active)
        VALUES (%s, %s, TRUE)
        """,
        (new_id, DEMO_TENANT_NAME),
    )
    return new_id


def upsert_admin_user(cur, tenant_id):
    auth_provider_id = "demo-admin-clerk-id"
    cur.execute(
        """
        INSERT INTO users (id, tenant_id, auth_provider_id, email, full_name, role, is_active)
        VALUES (%s, %s, %s, %s, %s, 'admin', TRUE)
        ON CONFLICT (auth_provider_id) DO UPDATE
            SET email = EXCLUDED.email
        RETURNING id
        """,
        (str(uuid.uuid4()), tenant_id, auth_provider_id, DEMO_ADMIN_EMAIL, "Demo Admin"),
    )
    return cur.fetchone()[0]


def seed_customers(cur, tenant_id):
    df = pd.read_csv(os.path.join(DATA_DIR, "customers.csv"))
    rows = [
        (
            str(uuid.uuid4()),
            tenant_id,
            row.customer_id,
            DEMO_SOURCE,
            row.name,
            row.city,
            row.segment,
        )
        for row in df.itertuples(index=False)
    ]
    execute_values(
        cur,
        """
        INSERT INTO canonical_customers
            (id, tenant_id, external_id, source, name, city, segment)
        VALUES %s
        ON CONFLICT (tenant_id, external_id, source) DO UPDATE
            SET name = EXCLUDED.name,
                city = EXCLUDED.city,
                segment = EXCLUDED.segment,
                updated_at = NOW()
        """,
        rows,
    )
    return len(rows)


def seed_orders(cur, tenant_id):
    df = pd.read_csv(os.path.join(DATA_DIR, "orders.csv"))
    rows = [
        (
            str(uuid.uuid4()),
            tenant_id,
            row.order_id,
            DEMO_SOURCE,
            row.customer_id,
            row.order_date,
            row.total_amount,
            row.status,
        )
        for row in df.itertuples(index=False)
    ]
    execute_values(
        cur,
        """
        INSERT INTO canonical_orders
            (id, tenant_id, external_id, source, customer_external_id,
             order_date, total_amount, status)
        VALUES %s
        ON CONFLICT (tenant_id, external_id, source) DO UPDATE
            SET total_amount = EXCLUDED.total_amount,
                status = EXCLUDED.status,
                updated_at = NOW()
        """,
        rows,
    )
    return len(rows)


def seed_inventory(cur, tenant_id):
    df = pd.read_csv(os.path.join(DATA_DIR, "inventory.csv"))
    rows = [
        (
            str(uuid.uuid4()),
            tenant_id,
            row.product_id,
            DEMO_SOURCE,
            row.product_name,
            row.warehouse,
            row.quantity,
            row.reorder_level,
        )
        for row in df.itertuples(index=False)
    ]
    execute_values(
        cur,
        """
        INSERT INTO canonical_inventory
            (id, tenant_id, external_id, source, product_name,
             warehouse, quantity, reorder_level)
        VALUES %s
        ON CONFLICT (tenant_id, external_id, source, warehouse) DO UPDATE
            SET quantity = EXCLUDED.quantity,
                reorder_level = EXCLUDED.reorder_level,
                updated_at = NOW()
        """,
        rows,
    )
    return len(rows)


def seed_glossary(cur):
    with open(GLOSSARY_PATH, "r", encoding="utf-8") as f:
        entries = json.load(f)

    # basit yaklasim: ayni table_name+column_name varsa once sil, sonra ekle
    # (embedding TASK-008'de doldurulacak, simdilik NULL birakiyoruz)
    for entry in entries:
        cur.execute(
            """
            DELETE FROM business_glossary
            WHERE table_name = %s AND column_name = %s
            """,
            (entry["table_name"], entry["column_name"]),
        )
        cur.execute(
            """
            INSERT INTO business_glossary
                (id, table_name, column_name, turkish_label, description, aliases)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (
                str(uuid.uuid4()),
                entry["table_name"],
                entry["column_name"],
                entry["turkish_label"],
                entry["description"],
                json.dumps(entry["aliases"], ensure_ascii=False),
            ),
        )
    return len(entries)


def main():
    print(f"Veritabanina baglaniliyor: {DATABASE_URL}")
    conn = get_connection()
    conn.autocommit = False
    try:
        with conn.cursor() as cur:
            tenant_id = upsert_tenant(cur)
            print(f"Tenant hazir: {tenant_id}")

            admin_id = upsert_admin_user(cur, tenant_id)
            print(f"Admin kullanici hazir: {admin_id}")

            n_customers = seed_customers(cur, tenant_id)
            print(f"canonical_customers: {n_customers} kayit islendi")

            n_orders = seed_orders(cur, tenant_id)
            print(f"canonical_orders: {n_orders} kayit islendi")

            n_inventory = seed_inventory(cur, tenant_id)
            print(f"canonical_inventory: {n_inventory} kayit islendi")

            n_glossary = seed_glossary(cur)
            print(f"business_glossary: {n_glossary} kayit islendi")

        conn.commit()
        print("\nSeed islemi basariyla tamamlandi.")
    except Exception as e:
        conn.rollback()
        print(f"\nHATA: seed islemi geri alindi. Sebep: {e}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
