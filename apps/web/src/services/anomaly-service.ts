import { apiFetch } from "@/lib/api";
import type { AnomalyFinding, AnomalySeverity } from "@/types";

export type AnomalyStatusFilter = "all" | "open" | "resolved";

export type GetAnomaliesParams = {
  severity?: AnomalySeverity | "all";
  status?: AnomalyStatusFilter;
  token?: string | null;
};

export type GetAnomaliesResponse = {
  items: AnomalyFinding[];
};

const useMockAnomalies =
  process.env.NEXT_PUBLIC_USE_MOCK_ANOMALIES !== "false";

const mockAnomalies: AnomalyFinding[] = [
  {
    id: "anom-1",
    title: "Gece saati yüksek tutarlı sipariş",
    description:
      "ORD-1042 numaralı sipariş gece saatlerinde ve normal ortalamanın üzerinde bir tutarla oluşturuldu.",
    severity: "high",
    isResolved: false,
    detectedAt: new Date().toISOString(),
    metadata: {
      externalId: "ORD-1042",
      totalAmount: 85000,
      orderDate: "2026-07-19 02:14",
    },
  },
  {
    id: "anom-2",
    title: "Kritik stok seviyesinin altında ürün",
    description:
      "Laptop Stand ürününün mevcut stoğu yeniden sipariş seviyesinin altına düştü.",
    severity: "medium",
    isResolved: false,
    detectedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    metadata: {
      productName: "Laptop Stand",
      quantity: 4,
      reorderLevel: 15,
    },
  },
  {
    id: "anom-3",
    title: "Negatif stok tespit edildi",
    description:
      "Depo A içinde USB-C Hub ürünü için negatif stok değeri tespit edildi.",
    severity: "high",
    isResolved: false,
    detectedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    metadata: {
      productName: "USB-C Hub",
      warehouse: "Depo A",
      quantity: -5,
    },
  },
  {
    id: "anom-4",
    title: "30 gündür sipariş vermeyen müşteri",
    description:
      "KOBİ segmentindeki bir müşteri son 30 gün içerisinde sipariş oluşturmadı.",
    severity: "low",
    isResolved: true,
    detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    metadata: {
      customerName: "Demo Market A.Ş.",
      segment: "KOBİ",
    },
  },
];

export async function getAnomalies({
  severity = "all",
  status = "all",
  token,
}: GetAnomaliesParams): Promise<GetAnomaliesResponse> {
  if (useMockAnomalies) {
    await new Promise((resolve) => setTimeout(resolve, 600));

    const filteredItems = mockAnomalies.filter((anomaly) => {
      const severityMatches =
        severity === "all" || anomaly.severity === severity;

      const statusMatches =
        status === "all" ||
        (status === "open" && !anomaly.isResolved) ||
        (status === "resolved" && anomaly.isResolved);

      return severityMatches && statusMatches;
    });

    return {
      items: filteredItems,
    };
  }

  const searchParams = new URLSearchParams();

  if (severity !== "all") {
    searchParams.set("severity", severity);
  }

  if (status === "open") {
    searchParams.set("is_resolved", "false");
  }

  if (status === "resolved") {
    searchParams.set("is_resolved", "true");
  }

  const queryString = searchParams.toString();

  return apiFetch<GetAnomaliesResponse>(
    `/api/v1/anomalies${queryString ? `?${queryString}` : ""}`,
    {
      token,
      method: "GET",
    }
  );
}

export async function resolveAnomaly(
  anomalyId: string,
  token?: string | null
): Promise<void> {
  if (useMockAnomalies) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return;
  }

  await apiFetch(`/api/v1/anomalies/${anomalyId}/resolve`, {
    token,
    method: "PATCH",
  });
}