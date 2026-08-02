import { apiFetch } from "@/lib/api";

export type DashboardActivity = {
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  status: string;
  createdAt: string | null;
};

export type DashboardStats = {
  totalSales: number;
  orderCount: number;
  erpConnectionsCount: number;
  lastSyncStatus: string | null;
  lastSyncRows: number;
  lastSyncError: string | null;
  lastSyncAt: string | null;
  excelUploadCount: number;
  chatMessagesCount: number;
  auditEventCount: number;
  recentActivities: DashboardActivity[];
};

type BackendDashboardActivity = {
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  status: string;
  created_at: string | null;
};

type BackendDashboardStats = {
  total_sales: number;
  order_count: number;
  erp_connections_count: number;
  last_sync_status: string | null;
  last_sync_rows: number;
  last_sync_error: string | null;
  last_sync_at: string | null;
  excel_upload_count: number;
  chat_messages_count: number;
  audit_event_count: number;
  recent_activities: BackendDashboardActivity[];
};

type GetDashboardStatsParams = {
  token?: string | null;
};

function mapActivity(activity: BackendDashboardActivity): DashboardActivity {
  return {
    action: activity.action,
    resourceType: activity.resource_type,
    resourceId: activity.resource_id,
    status: activity.status,
    createdAt: activity.created_at,
  };
}

function mapDashboardStats(response: BackendDashboardStats): DashboardStats {
  return {
    totalSales: response.total_sales,
    orderCount: response.order_count,
    erpConnectionsCount: response.erp_connections_count,
    lastSyncStatus: response.last_sync_status,
    lastSyncRows: response.last_sync_rows,
    lastSyncError: response.last_sync_error,
    lastSyncAt: response.last_sync_at,
    excelUploadCount: response.excel_upload_count,
    chatMessagesCount: response.chat_messages_count,
    auditEventCount: response.audit_event_count,
    recentActivities: response.recent_activities.map(mapActivity),
  };
}

export async function getDashboardStats({
  token,
}: GetDashboardStatsParams = {}): Promise<DashboardStats> {
  const response = await apiFetch<BackendDashboardStats>(
    "/api/v1/dashboard/stats",
    {
      token,
      method: "GET",
    }
  );

  return mapDashboardStats(response);
}