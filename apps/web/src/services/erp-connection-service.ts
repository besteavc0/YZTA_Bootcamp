export type ErpProvider = "sap" | "logo" | "mikro";

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

export async function getErpConnections({
  token,
}: GetErpConnectionsParams = {}): Promise<ErpConnection[]> {
  if (useMockErpConnections) {
    await new Promise((resolve) => setTimeout(resolve, 500));

    return mockConnections;
  }

  const response = await fetch("/api/erp-connections", {
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
  });

  if (!response.ok) {
    throw new Error("ERP bağlantıları alınamadı.");
  }

  return response.json();
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

  const response = await fetch(`/api/erp-connections/${connectionId}/test`, {
    method: "POST",
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
  });

  if (!response.ok) {
    throw new Error("ERP bağlantı testi başarısız oldu.");
  }

  return response.json();
}

export async function updateErpConnection({
  connectionId,
  payload,
  token,
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

  const response = await fetch(`/api/erp-connections/${connectionId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("ERP bağlantısı güncellenemedi.");
  }

  return response.json();
}