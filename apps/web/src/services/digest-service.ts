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

type GetLatestDigestParams = {
  token?: string | null;
};

type GetDigestByDateParams = {
  date: string;
  token?: string | null;
};

const useMockDigests = process.env.NEXT_PUBLIC_USE_MOCK_DIGESTS !== "false";

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
      {
        id: "anomalies",
        title: "Açık Anomali",
        value: "7",
        description: "Çözüm bekleyen kayıt",
        trendDirection: "down",
        trendLabel: "3 azaldı",
      },
      {
        id: "excel-diffs",
        title: "Excel Farkları",
        value: "5",
        description: "Son karşılaştırmadaki fark",
        trendDirection: "flat",
        trendLabel: "Sabit",
      },
      {
        id: "critical-stock",
        title: "Kritik Stok",
        value: "4",
        description: "Reorder seviyesinin altında",
        trendDirection: "up",
        trendLabel: "+1 ürün",
      },
      {
        id: "erp-sync",
        title: "ERP Sync",
        value: "Başarılı",
        description: "Son senkronizasyon durumu",
        trendDirection: "flat",
        trendLabel: "Güncel",
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
      {
        id: "highlight-2",
        title: "Excel karşılaştırma tamamlandı",
        description:
          "Son yüklenen dosyada 2 farklı değer ve 1 ERP'de bulunmayan kayıt tespit edildi.",
        severity: "info",
      },
      {
        id: "highlight-3",
        title: "ERP bağlantıları aktif",
        description:
          "SAP bağlantısı başarılı, Logo bağlantısı için kurulum bekleniyor.",
        severity: "success",
      },
    ],
  };
}

export async function getLatestDigest({
  token,
}: GetLatestDigestParams = {}): Promise<DailyDigest | null> {
  if (useMockDigests) {
    await new Promise((resolve) => setTimeout(resolve, 600));

    const today = new Date().toISOString().slice(0, 10);

    return createMockDigest(today);
  }

  const response = await fetch("/api/v1/digest/latest", {
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Günlük özet alınamadı.");
  }

  return response.json();
}

export async function getDigestByDate({
  date,
  token,
}: GetDigestByDateParams): Promise<DailyDigest | null> {
  if (useMockDigests) {
    await new Promise((resolve) => setTimeout(resolve, 600));

    return createMockDigest(date);
  }

  const response = await fetch(`/api/v1/digest?date=${date}`, {
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Seçili tarih için günlük özet alınamadı.");
  }

  return response.json();
}