import { apiFetch } from "@/lib/api";

export type DigestTrendDirection = "up" | "down" | "flat";

export type DigestMetric = {
  id: string;
  title: string;
  value: string;
  description: string;
  trendDirection: DigestTrendDirection;
  trendLabel: string;
};

export type DigestHighlight = {
  id: string;
  title: string;
  description: string;
  severity: "info" | "warning" | "success";
};

export type DailyDigest = {
  id: string;
  date: string;
  summary: string;
  generatedAt: string;
  metrics: DigestMetric[];
  highlights: DigestHighlight[];
};

type BackendDigestMetrics = {
  digest_date?: string;
  today_order_count?: number;
  today_total_amount?: number;
  yesterday_order_count?: number;
  yesterday_total_amount?: number;
  order_count_change_pct?: number | null;
  total_amount_change_pct?: number | null;
  top_customers?: Array<{
    name: string;
    order_count: number;
    total_amount: number;
  }>;
  critical_stock_count?: number;
  new_anomalies_count?: number;
};

type BackendDigestResponse = {
  tenant_id: string;
  digest_date: string;
  metrics: BackendDigestMetrics | string;
  summary_text: string;
  created_at: string | null;
};

type GetLatestDigestParams = {
  token?: string | null;
};

type GetDigestByDateParams = {
  date: string;
  token?: string | null;
};

const useMockDigests = process.env.NEXT_PUBLIC_USE_MOCK_DIGESTS !== "false";

function getTodayDateValue() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isFutureDate(value: string) {
  return value > getTodayDateValue();
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(value);
}

function getTrendDirection(value: number | null | undefined): DigestTrendDirection {
  if (typeof value !== "number") {
    return "flat";
  }

  if (value > 0) {
    return "up";
  }

  if (value < 0) {
    return "down";
  }

  return "flat";
}

function getTrendLabel(value: number | null | undefined) {
  if (typeof value !== "number") {
    return "Dün veri yok";
  }

  if (value > 0) {
    return `%${Math.abs(value)} artış`;
  }

  if (value < 0) {
    return `%${Math.abs(value)} düşüş`;
  }

  return "Değişim yok";
}

function normalizeBackendMetrics(
  metrics: BackendDigestMetrics | string
): BackendDigestMetrics {
  if (typeof metrics === "string") {
    try {
      return JSON.parse(metrics) as BackendDigestMetrics;
    } catch {
      return {};
    }
  }

  return metrics;
}

function mapBackendDigest(response: BackendDigestResponse): DailyDigest {
  const metrics = normalizeBackendMetrics(response.metrics);

  const topCustomer = metrics.top_customers?.[0] ?? null;

  const digestMetrics: DigestMetric[] = [
    {
      id: "total-sales",
      title: "Toplam Satış",
      value: formatCurrency(metrics.today_total_amount ?? 0),
      description: "Bugünkü toplam sipariş tutarı",
      trendDirection: getTrendDirection(metrics.total_amount_change_pct),
      trendLabel: getTrendLabel(metrics.total_amount_change_pct),
    },
    {
      id: "order-count",
      title: "Sipariş Sayısı",
      value: String(metrics.today_order_count ?? 0),
      description: "Bugün işlenen sipariş",
      trendDirection: getTrendDirection(metrics.order_count_change_pct),
      trendLabel: getTrendLabel(metrics.order_count_change_pct),
    },
    {
      id: "new-anomalies",
      title: "Yeni Anomali",
      value: String(metrics.new_anomalies_count ?? 0),
      description: "Bugün tespit edilen anomali",
      trendDirection: (metrics.new_anomalies_count ?? 0) > 0 ? "up" : "flat",
      trendLabel:
        (metrics.new_anomalies_count ?? 0) > 0
          ? "İnceleme gerekli"
          : "Yeni kayıt yok",
    },
    {
      id: "critical-stock",
      title: "Kritik Stok",
      value: String(metrics.critical_stock_count ?? 0),
      description: "Reorder seviyesinin altındaki ürün",
      trendDirection: (metrics.critical_stock_count ?? 0) > 0 ? "up" : "flat",
      trendLabel:
        (metrics.critical_stock_count ?? 0) > 0
          ? "Aksiyon gerekli"
          : "Risk yok",
    },
    {
      id: "top-customer",
      title: "En Aktif Müşteri",
      value: topCustomer?.name ?? "-",
      description: topCustomer
        ? `${topCustomer.order_count} sipariş · ${formatCurrency(
            topCustomer.total_amount
          )}`
        : "Bugün müşteri hareketi yok",
      trendDirection: "flat",
      trendLabel: "Bugün",
    },
    {
      id: "digest-date",
      title: "Özet Tarihi",
      value: response.digest_date,
      description: "Görüntülenen rapor tarihi",
      trendDirection: "flat",
      trendLabel: "Güncel",
    },
  ];

  const highlights: DigestHighlight[] = [];

  if ((metrics.new_anomalies_count ?? 0) > 0) {
    highlights.push({
      id: "highlight-anomalies",
      title: "Anomali kontrolü gerekli",
      description: `Bugün ${
        metrics.new_anomalies_count ?? 0
      } yeni anomali tespit edildi. Anomali panelinden detayları inceleyebilirsin.`,
      severity: "warning",
    });
  }

  if ((metrics.critical_stock_count ?? 0) > 0) {
    highlights.push({
      id: "highlight-stock",
      title: "Kritik stok uyarısı",
      description: `${
        metrics.critical_stock_count ?? 0
      } ürün reorder seviyesinin altında. Stok aksiyonu gerekebilir.`,
      severity: "warning",
    });
  }

  if (topCustomer) {
    highlights.push({
      id: "highlight-customer",
      title: "En aktif müşteri",
      description: `${topCustomer.name}, bugün ${topCustomer.order_count} sipariş ile öne çıkıyor.`,
      severity: "info",
    });
  }

  if (highlights.length === 0) {
    highlights.push({
      id: "highlight-stable",
      title: "Operasyon dengeli",
      description:
        "Bugünkü metriklerde kritik seviyede anomali veya stok uyarısı görünmüyor.",
      severity: "success",
    });
  }

  return {
    id: `${response.tenant_id}-${response.digest_date}`,
    date: response.digest_date,
    summary: response.summary_text,
    generatedAt: response.created_at ?? new Date().toISOString(),
    metrics: digestMetrics,
    highlights,
  };
}

function createMockDigest(date: string): DailyDigest {
  return {
    id: `digest-${date}`,
    date,
    generatedAt: new Date().toISOString(),
    summary:
      "Bugünkü ERP verilerine göre satış hacmi dengeli ilerliyor. Yüksek tutarlı siparişlerde artış gözlenirken stok tarafında kritik seviyeye yaklaşan ürünler dikkat çekiyor. Excel karşılaştırma sonuçlarında birkaç uyuşmazlık tespit edildi ve öncelikli inceleme için anomali paneline yönlendirme öneriliyor.",
    metrics: [
      {
        id: "sales",
        title: "Toplam Satış",
        value: "₺284.750",
        description: "Bugünkü toplam sipariş tutarı",
        trendDirection: "up",
        trendLabel: "%12 artış",
      },
      {
        id: "orders",
        title: "Sipariş Sayısı",
        value: "46",
        description: "Bugün işlenen sipariş",
        trendDirection: "up",
        trendLabel: "+8 sipariş",
      },
    ],
    highlights: [
      {
        id: "highlight-1",
        title: "Yüksek tutarlı sipariş kontrolü",
        description:
          "Gece saatlerinde oluşan yüksek tutarlı siparişler anomali panelinde takip edilmeli.",
        severity: "warning",
      },
    ],
  };
}

export async function getLatestDigest({
  token,
}: GetLatestDigestParams = {}): Promise<DailyDigest | null> {
  if (useMockDigests) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return createMockDigest(getTodayDateValue());
  }

  try {
    const response = await apiFetch<BackendDigestResponse>(
      "/api/v1/digest/latest",
      {
        token,
      }
    );

    return mapBackendDigest(response);
  } catch (error) {
    if (error instanceof Error && error.message.includes("404")) {
      return null;
    }

    throw error;
  }
}

export async function getDigestByDate({
  date,
  token,
}: GetDigestByDateParams): Promise<DailyDigest | null> {
  if (useMockDigests) {
    await new Promise((resolve) => setTimeout(resolve, 600));

    if (isFutureDate(date)) {
      return null;
    }

    return createMockDigest(date);
  }

  try {
    const response = await apiFetch<BackendDigestResponse>(
      `/api/v1/digest?date=${date}`,
      {
        token,
      }
    );

    return mapBackendDigest(response);
  } catch (error) {
    if (error instanceof Error && error.message.includes("404")) {
      return null;
    }

    throw error;
  }
}