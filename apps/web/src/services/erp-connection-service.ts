import { apiFetch } from "@/lib/api";

export type ErpProvider =
  | "csv"
  | "sap"
  | "sap_b1"
  | "logo"
  | "mikro"
  | "erpnext"
  | "dolibarr";

export type ErpConnectionStatus = "connected" | "disconnected" | "error";

export type ErpConnection = {
  id: string;
  provider: ErpProvider;
  name: string;
  description: string;
  status: ErpConnectionStatus;
  host: string;
  companyCode: string;
  lastSyncAt: string | null;
};

export type TestErpConnectionResponse = {
  connectionId: string;
  status: ErpConnectionStatus;
  message: string;
  testedAt: string;
};

export type ErpProviderFilter = ErpProvider | "all";

export type ErpConnectionStatusFilter = ErpConnectionStatus | "all";

export type UpdateErpConnectionPayload = {
  name: string;
  description: string;
  host: string;
  companyCode: string;
};

export type CreateErpConnectionPayload = {
  name: string;
  connectorType: ErpProvider;
  config: Record<string, unknown>;
};

type CreateErpConnectionParams = {
  payload: CreateErpConnectionPayload;
  token?: string | null;
};

type GetErpConnectionsParams = {
  token?: string | null;
};

type TestErpConnectionParams = {
  connectionId: string;
  token?: string | null;
};

type UpdateErpConnectionParams = {
  connectionId: string;
  payload: UpdateErpConnectionPayload;
  token?: string | null;
};

type BackendErpConnection = {
  id: string;
  tenant_id: string;
  name: string;
  connector_type: string;
  is_active: boolean;
  last_sync_at: string | null;
  last_sync_status: string | null;
  created_at: string;
};

type BackendTestErpConnectionResponse = {
  success: boolean;
};

export type SyncErpConnectionResponse = {
  connectionId: string;
  message: string;
  taskId: string;
};

type SyncErpConnectionParams = {
  connectionId: string;
  token?: string | null;
};

type BackendSyncErpConnectionResponse = {
  message: string;
  task_id: string;
};

export type ErpSyncRun = {
  id: string;
  tenantId: string;
  connectionId: string;
  startedAt: string;
  finishedAt: string | null;
  rowsSynced: number | null;
  status: string;
  errorMessage: string | null;
};

type BackendErpSyncRun = {
  id: string;
  tenant_id: string;
  erp_connection_id: string;
  started_at: string;
  finished_at: string | null;
  rows_synced: number | null;
  status: string;
  error_message: string | null;
};

type GetErpSyncRunsParams = {
  connectionId: string;
  token?: string | null;
};

type DeleteErpConnectionParams = {
  connectionId: string;
  token?: string | null;
};

type DeleteErpConnectionResponse = {
  success: boolean;
  connection_id: string;
};

const useMockErpConnections =
  process.env.NEXT_PUBLIC_USE_MOCK_ERP_CONNECTIONS !== "false";

const mockConnections: ErpConnection[] = [
  {
    id: "erp-sap-001",
    provider: "sap",
    name: "SAP Finans Modülü",
    description: "SAP FI kayıtları ve finansal belge hareketleri.",
    status: "connected",
    host: "sap.erp.local",
    companyCode: "1000",
    lastSyncAt: "2026-07-21T14:30:00.000Z",
  },
  {
    id: "erp-logo-001",
    provider: "logo",
    name: "Logo Muhasebe",
    description: "Logo üzerinden cari, fatura ve stok kayıtları.",
    status: "disconnected",
    host: "logo.erp.local",
    companyCode: "L001",
    lastSyncAt: null,
  },
  {
    id: "erp-mikro-001",
    provider: "mikro",
    name: "Mikro ERP",
    description: "Mikro ERP satış ve tahsilat kayıtları.",
    status: "error",
    host: "mikro.erp.local",
    companyCode: "M001",
    lastSyncAt: "2026-07-20T09:15:00.000Z",
  },
];

const providerLabels: Record<ErpProvider, string> = {
  csv: "CSV",
  sap: "SAP",
  sap_b1: "SAP B1",
  logo: "Logo",
  mikro: "Mikro",
  erpnext: "ERPNext",
  dolibarr: "Dolibarr",
};

function normalizeProvider(value: string): ErpProvider {
  const normalizedValue = value.toLowerCase();

  if (
    normalizedValue === "csv" ||
    normalizedValue === "sap" ||
    normalizedValue === "sap_b1" ||
    normalizedValue === "logo" ||
    normalizedValue === "mikro" ||
    normalizedValue === "erpnext" ||
    normalizedValue === "dolibarr"
  ) {
    return normalizedValue;
  }

  return "csv";
}

function mapBackendStatus(
  isActive: boolean,
  lastSyncStatus: string | null
): ErpConnectionStatus {
  if (!isActive) {
    return "disconnected";
  }

  if (!lastSyncStatus) {
    return "disconnected";
  }

  const normalizedStatus = lastSyncStatus.toLowerCase();

  if (
    normalizedStatus.includes("success") ||
    normalizedStatus.includes("completed")
  ) {
    return "connected";
  }

  if (
    normalizedStatus.includes("error") ||
    normalizedStatus.includes("fail")
  ) {
    return "error";
  }

  return "disconnected";
}

function mapBackendConnection(connection: BackendErpConnection): ErpConnection {
  const provider = normalizeProvider(connection.connector_type);

  return {
    id: connection.id,
    provider,
    name: connection.name,
    description: `${providerLabels[provider]} bağlantısı`,
    status: mapBackendStatus(connection.is_active, connection.last_sync_status),
    host: "-",
    companyCode: connection.tenant_id,
    lastSyncAt: connection.last_sync_at,
  };
}

export async function getErpConnections({
  token,
}: GetErpConnectionsParams = {}): Promise<ErpConnection[]> {
  if (useMockErpConnections) {
    await new Promise((resolve) => setTimeout(resolve, 500));

    return mockConnections;
  }

  const response = await apiFetch<BackendErpConnection[]>(
    "/api/v1/erp/connections",
    {
      token,
      method: "GET",
    }
  );

  return response.map(mapBackendConnection);
}

export async function testErpConnection({
  connectionId,
  token,
}: TestErpConnectionParams): Promise<TestErpConnectionResponse> {
  if (useMockErpConnections) {
    await new Promise((resolve) => setTimeout(resolve, 700));

    const connection = mockConnections.find((item) => item.id === connectionId);

    if (!connection) {
      throw new Error("ERP bağlantısı bulunamadı.");
    }

    return {
      connectionId,
      status: connection.status === "error" ? "error" : "connected",
      message:
        connection.status === "error"
          ? "Bağlantı testi başarısız oldu. Sunucu yanıt vermiyor."
          : "Bağlantı testi başarıyla tamamlandı.",
      testedAt: new Date().toISOString(),
    };
  }

  

  const response = await apiFetch<BackendTestErpConnectionResponse>(
    `/api/v1/erp/connections/${connectionId}/test`,
    {
      token,
      method: "POST",
    }
  );

  return {
    connectionId,
    status: response.success ? "connected" : "error",
    message: response.success
      ? "Bağlantı testi başarıyla tamamlandı."
      : "Bağlantı testi başarısız oldu.",
    testedAt: new Date().toISOString(),
  };
}

export async function syncErpConnection({
  connectionId,
  token,
}: SyncErpConnectionParams): Promise<SyncErpConnectionResponse> {
  if (useMockErpConnections) {
    await new Promise((resolve) => setTimeout(resolve, 700));

    return {
      connectionId,
      message: "Sync işlemi kuyruğa alındı.",
      taskId: `mock-task-${Date.now()}`,
    };
  }

  const response = await apiFetch<BackendSyncErpConnectionResponse>(
    `/api/v1/erp/connections/${connectionId}/sync`,
    {
      token,
      method: "POST",
    }
  );

  return {
    connectionId,
    message: response.message,
    taskId: response.task_id,
  };
}
function mapBackendSyncRun(syncRun: BackendErpSyncRun): ErpSyncRun {
  return {
    id: syncRun.id,
    tenantId: syncRun.tenant_id,
    connectionId: syncRun.erp_connection_id,
    startedAt: syncRun.started_at,
    finishedAt: syncRun.finished_at,
    rowsSynced: syncRun.rows_synced,
    status: syncRun.status,
    errorMessage: syncRun.error_message,
  };
}

export async function getErpSyncRuns({
  connectionId,
  token,
}: GetErpSyncRunsParams): Promise<ErpSyncRun[]> {
  if (useMockErpConnections) {
    await new Promise((resolve) => setTimeout(resolve, 500));

    return [
      {
        id: "mock-sync-001",
        tenantId: "mock-tenant",
        connectionId,
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        rowsSynced: 12,
        status: "success",
        errorMessage: null,
      },
    ];
  }

  const response = await apiFetch<BackendErpSyncRun[]>(
    `/api/v1/erp/sync-runs/${connectionId}`,
    {
      token,
      method: "GET",
    }
  );

  return response.map(mapBackendSyncRun);
}

export async function createErpConnection({
  payload,
  token,
}: CreateErpConnectionParams): Promise<ErpConnection> {
  if (useMockErpConnections) {
    await new Promise((resolve) => setTimeout(resolve, 600));

    const newConnection: ErpConnection = {
      id: `mock-erp-${Date.now()}`,
      provider: payload.connectorType,
      name: payload.name,
      description: `${providerLabels[payload.connectorType]} bağlantısı`,
      status: "disconnected",
      host:
        typeof payload.config.file_path === "string"
          ? payload.config.file_path
          : "-",
      companyCode: "-",
      lastSyncAt: null,
    };

    mockConnections.unshift(newConnection);
    return newConnection;
  }

  const response = await apiFetch<BackendErpConnection>(
    "/api/v1/erp/connections",
    {
      token,
      method: "POST",
      body: JSON.stringify({
        name: payload.name,
        connector_type: payload.connectorType,
        config: payload.config,
      }),
    }
  );

  return mapBackendConnection(response);
}

export async function updateErpConnection({
  connectionId,
  payload,
}: UpdateErpConnectionParams): Promise<ErpConnection> {
  if (useMockErpConnections) {
    await new Promise((resolve) => setTimeout(resolve, 600));

    const connection = mockConnections.find((item) => item.id === connectionId);

    if (!connection) {
      throw new Error("ERP bağlantısı bulunamadı.");
    }

    return {
      ...connection,
      ...payload,
    };
  }

  throw new Error(
    `ERP bağlantısı güncelleme endpoint'i backend tarafında henüz hazır değil. Connection ID: ${connectionId}`
  );
}

export async function deleteErpConnection({
  connectionId,
  token,
}: DeleteErpConnectionParams): Promise<void> {
  if (useMockErpConnections) {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const connectionIndex = mockConnections.findIndex(
      (item) => item.id === connectionId
    );

    if (connectionIndex === -1) {
      throw new Error("ERP bağlantısı bulunamadı.");
    }

    mockConnections.splice(connectionIndex, 1);
    return;
  }

  await apiFetch<DeleteErpConnectionResponse>(
    `/api/v1/erp/connections/${connectionId}`,
    {
      token,
      method: "DELETE",
    }
  );
}