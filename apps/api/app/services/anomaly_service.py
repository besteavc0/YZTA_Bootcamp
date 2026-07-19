"""
TASK-022 · Anomali kural motoru — backend implementasyonu

TASK-014'te tasarlanan 5 kuralın gerçek SQLAlchemy implementasyonu.
Kural tasarımı için: docs/anomaly_rules.md

Her check_* metodu:
  1. İlgili canonical tabloyu sorgular
  2. Kural koşulunu sağlayan kayıtları bulur
  3. AnomalyFinding olarak DB'ye kaydeder (aynı gün + aynı kural + aynı kayıt
     için tekrar oluşturmaz — uq_finding_dedupe constraint'i buna güvenir)

run_all_rules(), aktif tüm AnomalyRule kayıtlarını çalıştırıp toplam
finding sayısını döndürür. Sprint 2'de Celery job (workers/tasks/run_anomalies.py)
bu metodu periyodik olarak çağıracaktır.
"""

from datetime import datetime, timedelta, date, time
from typing import List
from uuid import UUID

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.models.canonical import CanonicalOrder, CanonicalInventory, CanonicalCustomer
from app.models.anomaly import AnomalyRule, AnomalyFinding


# Kural adları — AnomalyRule.name ile birebir eşleşmeli (seed_demo_data.py'de de aynı olmalı)
RULE_GECE_YUKSEK_TUTAR = "gece_saati_yuksek_tutarli_siparis"
RULE_KISA_SUREDE_COK_SIPARIS = "kisa_surede_cok_siparis"
RULE_NEGATIF_SIFIR_STOK = "negatif_veya_sifir_stok"
RULE_ORTALAMA_3KAT = "ortalamanin_3_katindan_fazla_tutar"
RULE_30GUN_SIPARIS_YOK = "30_gun_siparis_vermeyen_musteri"


class AnomalyService:
    """ERP verisinde anomali tespiti yapan servis."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def _get_rule_id(self, rule_name: str) -> UUID | None:
        """anomaly_rules tablosundan aktif kuralın id'sini getirir."""
        result = await self.db.execute(
            select(AnomalyRule.id).where(
                AnomalyRule.name == rule_name, AnomalyRule.is_active.is_(True)
            )
        )
        row = result.first()
        return row[0] if row else None

    async def _save_finding(
        self,
        tenant_id: UUID,
        rule_id: UUID,
        resource_type: str,
        resource_external_id: str,
        description: str,
        severity: str,
    ) -> None:
        """
        Bir finding'i DB'ye kaydeder. Aynı tenant+rule+resource için aynı gün
        zaten bir finding varsa (uq_finding_dedupe), sessizce atlar (ON CONFLICT
        DO NOTHING) — böylece motor birden fazla kez çalıştırılsa da tekrarlı
        kayıt oluşmaz.
        """
        stmt = (
            pg_insert(AnomalyFinding)
            .values(
                tenant_id=tenant_id,
                rule_id=rule_id,
                resource_type=resource_type,
                resource_external_id=resource_external_id,
                description=description,
                severity=severity,
                detected_at=datetime.utcnow(),
            )
            .on_conflict_do_nothing(constraint="uq_finding_dedupe")
        )
        await self.db.execute(stmt)

    # ------------------------------------------------------------------
    # Kural 1 — Gece saati yüksek tutarlı sipariş
    # ------------------------------------------------------------------
    async def check_gece_saati_yuksek_tutarli_siparis(
        self, tenant_id: UUID, amount_threshold: float = 50000
    ) -> List[CanonicalOrder]:
        """
        Severity: high
        Koşul: order_date saati 00:00-06:00 arası VE total_amount > amount_threshold
        """
        result = await self.db.execute(
            select(CanonicalOrder).where(
                CanonicalOrder.tenant_id == tenant_id,
                func.extract("hour", CanonicalOrder.order_date).between(0, 6),
                CanonicalOrder.total_amount > amount_threshold,
            )
        )
        orders = list(result.scalars().all())

        rule_id = await self._get_rule_id(RULE_GECE_YUKSEK_TUTAR)
        if rule_id:
            for order in orders:
                await self._save_finding(
                    tenant_id=tenant_id,
                    rule_id=rule_id,
                    resource_type="canonical_orders",
                    resource_external_id=order.external_id,
                    description=(
                        f"Gece saati ({order.order_date.strftime('%H:%M')}) "
                        f"{order.total_amount}₺ tutarında sipariş"
                    ),
                    severity="high",
                )
        return orders

    # ------------------------------------------------------------------
    # Kural 2 — Aynı müşteriden kısa sürede çok sipariş
    # ------------------------------------------------------------------
    async def check_kisa_surede_cok_siparis(
        self, tenant_id: UUID, min_orders: int = 5
    ) -> List[dict]:
        """
        Severity: medium
        Koşul: aynı customer_external_id'den 1 saatlik pencerede min_orders'tan fazla sipariş
        """
        hour_bucket = func.date_trunc("hour", CanonicalOrder.order_date)
        result = await self.db.execute(
            select(
                CanonicalOrder.customer_external_id,
                hour_bucket.label("hour_bucket"),
                func.count().label("siparis_sayisi"),
            )
            .where(
                CanonicalOrder.tenant_id == tenant_id,
                CanonicalOrder.customer_external_id.is_not(None),
            )
            .group_by(CanonicalOrder.customer_external_id, hour_bucket)
            .having(func.count() > min_orders)
        )
        rows = [
            {"customer_external_id": r[0], "hour_bucket": r[1], "siparis_sayisi": r[2]}
            for r in result.all()
        ]

        rule_id = await self._get_rule_id(RULE_KISA_SUREDE_COK_SIPARIS)
        if rule_id:
            for row in rows:
                await self._save_finding(
                    tenant_id=tenant_id,
                    rule_id=rule_id,
                    resource_type="canonical_customers",
                    resource_external_id=row["customer_external_id"],
                    description=(
                        f"{row['hour_bucket']} saatinde {row['siparis_sayisi']} sipariş "
                        f"(müşteri: {row['customer_external_id']})"
                    ),
                    severity="medium",
                )
        return rows

    # ------------------------------------------------------------------
    # Kural 3 — Negatif veya sıfır stok
    # ------------------------------------------------------------------
    async def check_negatif_veya_sifir_stok(self, tenant_id: UUID) -> List[CanonicalInventory]:
        """
        Severity: high
        Koşul: quantity <= 0
        """
        result = await self.db.execute(
            select(CanonicalInventory).where(
                CanonicalInventory.tenant_id == tenant_id,
                CanonicalInventory.quantity <= 0,
            )
        )
        items = list(result.scalars().all())

        rule_id = await self._get_rule_id(RULE_NEGATIF_SIFIR_STOK)
        if rule_id:
            for item in items:
                await self._save_finding(
                    tenant_id=tenant_id,
                    rule_id=rule_id,
                    resource_type="canonical_inventory",
                    resource_external_id=item.external_id,
                    description=f"{item.product_name}: stok miktarı {item.quantity}",
                    severity="high",
                )
        return items

    # ------------------------------------------------------------------
    # Kural 4 — Ortalamanın 3 katından fazla sipariş tutarı
    # ------------------------------------------------------------------
    async def check_ortalamanin_3_katindan_fazla_tutar(
        self, tenant_id: UUID, multiplier: float = 3.0
    ) -> List[CanonicalOrder]:
        """
        Severity: medium
        Koşul: total_amount > (tenant genel ortalaması * multiplier)
        """
        avg_result = await self.db.execute(
            select(func.avg(CanonicalOrder.total_amount)).where(
                CanonicalOrder.tenant_id == tenant_id
            )
        )
        avg_amount = avg_result.scalar()
        if avg_amount is None:
            return []

        threshold = float(avg_amount) * multiplier
        result = await self.db.execute(
            select(CanonicalOrder).where(
                CanonicalOrder.tenant_id == tenant_id,
                CanonicalOrder.total_amount > threshold,
            )
        )
        orders = list(result.scalars().all())

        rule_id = await self._get_rule_id(RULE_ORTALAMA_3KAT)
        if rule_id:
            for order in orders:
                await self._save_finding(
                    tenant_id=tenant_id,
                    rule_id=rule_id,
                    resource_type="canonical_orders",
                    resource_external_id=order.external_id,
                    description=(
                        f"Sipariş tutarı {order.total_amount}₺, ortalamanın "
                        f"{multiplier}x katı olan {threshold:.2f}₺'den fazla"
                    ),
                    severity="medium",
                )
        return orders

    # ------------------------------------------------------------------
    # Kural 5 — 30 gün sipariş vermeyen müşteri (churn riski)
    # ------------------------------------------------------------------
    async def check_30_gun_siparis_vermeyen_musteri(
        self, tenant_id: UUID, days: int = 30
    ) -> List[CanonicalCustomer]:
        """
        Severity: low
        Koşul: son `days` günde canonical_orders'da kaydı olmayan müşteriler
        """
        cutoff = datetime.utcnow() - timedelta(days=days)

        recent_customer_ids_subq = (
            select(CanonicalOrder.customer_external_id)
            .where(
                CanonicalOrder.tenant_id == tenant_id,
                CanonicalOrder.order_date >= cutoff,
                CanonicalOrder.customer_external_id.is_not(None),
            )
            .distinct()
        )

        result = await self.db.execute(
            select(CanonicalCustomer).where(
                CanonicalCustomer.tenant_id == tenant_id,
                CanonicalCustomer.external_id.not_in(recent_customer_ids_subq),
            )
        )
        customers = list(result.scalars().all())

        rule_id = await self._get_rule_id(RULE_30GUN_SIPARIS_YOK)
        if rule_id:
            for customer in customers:
                await self._save_finding(
                    tenant_id=tenant_id,
                    rule_id=rule_id,
                    resource_type="canonical_customers",
                    resource_external_id=customer.external_id,
                    description=f"{customer.name}: son {days} günde sipariş yok (churn riski)",
                    severity="low",
                )
        return customers

    # ------------------------------------------------------------------
    # Tüm kuralları çalıştır
    # ------------------------------------------------------------------
    async def run_all_rules(self, tenant_id: UUID) -> dict:
        """
        Aktif tüm kuralları sırayla çalıştırır, sonuçları commit eder ve
        her kural için kaç finding bulunduğunu döndürür.
        """
        results = {
            RULE_GECE_YUKSEK_TUTAR: len(
                await self.check_gece_saati_yuksek_tutarli_siparis(tenant_id)
            ),
            RULE_KISA_SUREDE_COK_SIPARIS: len(
                await self.check_kisa_surede_cok_siparis(tenant_id)
            ),
            RULE_NEGATIF_SIFIR_STOK: len(
                await self.check_negatif_veya_sifir_stok(tenant_id)
            ),
            RULE_ORTALAMA_3KAT: len(
                await self.check_ortalamanin_3_katindan_fazla_tutar(tenant_id)
            ),
            RULE_30GUN_SIPARIS_YOK: len(
                await self.check_30_gun_siparis_vermeyen_musteri(tenant_id)
            ),
        }
        await self.db.commit()
        return results
