"""
Bu dosya tum ORM modellerini import eder, boylece Alembic autogenerate
calisirken Base.metadata tum tablolari tanir.
"""
from app.models.tenant import Tenant
from app.models.user import User
from app.models.audit_log import AuditLog
from app.models.erp_connection import ERPConnection, SyncRun
from app.models.canonical import (
    CanonicalCustomer,
    CanonicalOrder,
    CanonicalOrderLine,
    CanonicalInventory,
)
from app.models.anomaly import AnomalyRule, AnomalyFinding

__all__ = [
    "Tenant",
    "User",
    "AuditLog",
    "ERPConnection",
    "SyncRun",
    "CanonicalCustomer",
    "CanonicalOrder",
    "CanonicalOrderLine",
    "CanonicalInventory",
    "AnomalyRule",
    "AnomalyFinding",
]
