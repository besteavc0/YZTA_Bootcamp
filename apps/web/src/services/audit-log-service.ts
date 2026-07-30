export type AuditActionType =
  | "login"
  | "chat_query"
  | "excel_upload"
  | "erp_sync"
  | "erp_config_change"
  | "user_role_change";

export type AuditActionFilter = AuditActionType | "all";

export type AuditLogStatus = "success" | "denied" | "error";

export type AuditStatusFilter = AuditLogStatus | "all";

export type AuditLog = {
  id: string;
  userEmail: string;
  action: AuditActionType;
  resourceType: string;
  resourceId: string | null;
  ipAddress: string;
  status: AuditLogStatus;
  details: Record<string, unknown>;
  createdAt: string;
};

export type GetAuditLogsParams = {
  action?: AuditActionFilter;
  status?: AuditStatusFilter;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
  token?: string | null;
};

export type GetAuditLogsResponse = {
  items: AuditLog[];
  totalCount: number;
  limit: number;
  offset: number;
};

const useMockAuditLogs =
  process.env.NEXT_PUBLIC_USE_MOCK_AUDIT_LOGS !== "false";

const mockAuditLogs: AuditLog[] = [
  {
    id: "audit-001",
    userEmail: "admin@demo.com",
    action: "login",
    resourceType: "auth",
    resourceId: null,
    ipAddress: "192.168.1.12",
    status: "success",
    details: {
      provider: "clerk",
      role: "admin",
    },
    createdAt: "2026-07-23T06:45:00.000Z",
  },
  {
    id: "audit-002",
    userEmail: "yusuf.eker@demo.com",
    action: "chat_query",
    resourceType: "chat_messages",
    resourceId: "chat-1024",
    ipAddress: "192.168.1.18",
    status: "success",
    details: {
      question: "Bu ay toplam satış tutarı ne kadar?",
      sources: ["canonical_orders"],
      sql_query:
        "SELECT SUM(total_amount) FROM canonical_orders WHERE tenant_id = :tenant_id",
    },
    createdAt: "2026-07-23T07:10:00.000Z",
  },
  {
    id: "audit-003",
    userEmail: "viewer@demo.com",
    action: "chat_query",
    resourceType: "chat_messages",
    resourceId: null,
    ipAddress: "192.168.1.21",
    status: "denied",
    details: {
      reason: "Viewer rolü chat sorgusu gönderemez.",
      required_roles: ["user", "admin"],
    },
    createdAt: "2026-07-23T07:25:00.000Z",
  },
  {
    id: "audit-004",
    userEmail: "user@demo.com",
    action: "excel_upload",
    resourceType: "excel_uploads",
    resourceId: "upload-221",
    ipAddress: "192.168.1.22",
    status: "success",
    details: {
      filename: "temmuz_siparisleri.xlsx",
      row_count: 128,
      entity_type: "orders",
    },
    createdAt: "2026-07-23T08:05:00.000Z",
  },
  {
    id: "audit-005",
    userEmail: "admin@demo.com",
    action: "erp_sync",
    resourceType: "erp_connections",
    resourceId: "erp-sap-001",
    ipAddress: "192.168.1.12",
    status: "success",
    details: {
      connector: "SAP",
      rows_synced: 240,
      duration_seconds: 18,
    },
    createdAt: "2026-07-23T08:40:00.000Z",
  },
  {
    id: "audit-006",
    userEmail: "admin@demo.com",
    action: "erp_config_change",
    resourceType: "erp_connections",
    resourceId: "erp-logo-001",
    ipAddress: "192.168.1.12",
    status: "success",
    details: {
      connector: "Logo",
      host: "logo.erp.local",
      password: "***MASKED***",
      api_key: "***MASKED***",
    },
    createdAt: "2026-07-23T09:15:00.000Z",
  },
  {
    id: "audit-007",
    userEmail: "admin@demo.com",
    action: "user_role_change",
    resourceType: "users",
    resourceId: "user-778",
    ipAddress: "192.168.1.12",
    status: "success",
    details: {
      target_user: "viewer@demo.com",
      previous_role: "viewer",
      new_role: "user",
    },
    createdAt: "2026-07-23T10:20:00.000Z",
  },
  {
    id: "audit-008",
    userEmail: "user@demo.com",
    action: "erp_sync",
    resourceType: "erp_connections",
    resourceId: "erp-mikro-001",
    ipAddress: "192.168.1.31",
    status: "denied",
    details: {
      reason: "ERP sync işlemi sadece admin kullanıcılar tarafından başlatılabilir.",
      required_roles: ["admin"],
    },
    createdAt: "2026-07-23T11:05:00.000Z",
  },
  {
    id: "audit-009",
    userEmail: "admin@demo.com",
    action: "erp_sync",
    resourceType: "erp_connections",
    resourceId: "erp-mikro-001",
    ipAddress: "192.168.1.12",
    status: "error",
    details: {
      connector: "Mikro",
      error_message: "Connection timeout",
      retry_count: 3,
    },
    createdAt: "2026-07-23T11:25:00.000Z",
  },
];

function isInDateRange(log: AuditLog, startDate?: string, endDate?: string) {
  const logDate = log.createdAt.slice(0, 10);

  if (startDate && logDate < startDate) {
    return false;
  }

  if (endDate && logDate > endDate) {
    return false;
  }

  return true;
}

export async function getAuditLogs({
  action = "all",
  status = "all",
  startDate,
  endDate,
  limit = 50,
  offset = 0,
  token,
}: GetAuditLogsParams = {}): Promise<GetAuditLogsResponse> {
  if (useMockAuditLogs) {
    await new Promise((resolve) => setTimeout(resolve, 600));

    const filteredLogs = mockAuditLogs.filter((log) => {
      const matchesAction = action === "all" || log.action === action;
      const matchesStatus = status === "all" || log.status === status;
      const matchesDate = isInDateRange(log, startDate, endDate);

      return matchesAction && matchesStatus && matchesDate;
    });

    return {
      items: filteredLogs.slice(offset, offset + limit),
      totalCount: filteredLogs.length,
      limit,
      offset,
    };
  }

  const searchParams = new URLSearchParams();

  if (action !== "all") {
    searchParams.set("action", action);
  }

  if (status !== "all") {
    searchParams.set("status", status);
  }

  if (startDate) {
    searchParams.set("start_date", startDate);
  }

  if (endDate) {
    searchParams.set("end_date", endDate);
  }

  searchParams.set("limit", String(limit));
  searchParams.set("offset", String(offset));

  const response = await fetch(`/api/v1/audit/logs?${searchParams.toString()}`, {
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
  });

  if (!response.ok) {
    throw new Error("Audit log kayıtları alınamadı.");
  }

  return response.json();
}