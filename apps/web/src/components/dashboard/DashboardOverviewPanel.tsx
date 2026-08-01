"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import {
  Activity,
  Bot,
  Database,
  FileSpreadsheet,
  RefreshCw,
  ShieldCheck,
  ShoppingCart,
  Upload,
} from "lucide-react";

import {
  getDashboardStats,
  type DashboardStats,
} from "@/services/dashboard-service";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function getStatusLabel(status: string | null) {
  if (!status) {
    return "Henüz yok";
  }

  if (status === "success") {
    return "Başarılı";
  }

  if (status === "failed") {
    return "Başarısız";
  }

  if (status === "error") {
    return "Hata";
  }

  return status;
}

function getActionLabel(action: string) {
  const labels: Record<string, string> = {
    chat_query: "Chat Sorgusu",
    erp_sync: "ERP Sync",
    erp_config_change: "ERP Test/Ayar",
    excel_upload: "Excel Yükleme",
    excel_compare: "Excel Karşılaştırma",
    login: "Giriş",
    user_role_change: "Rol Değişikliği",
  };

  return labels[action] ?? action;
}

export function DashboardOverviewPanel() {
  const { getToken } = useAuth();
  const { user } = useUser();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const hasLoadedStatsRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchStats() {
      if (hasLoadedStatsRef.current) {
  setIsRefreshing(true);
} else {
  setIsLoading(true);
}

      setErrorMessage(null);

      try {
        const token = await getToken();

        const response = await getDashboardStats({
          token,
        });

        if (isMounted) {
  setStats(response);
  hasLoadedStatsRef.current = true;
}
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Dashboard verileri yüklenirken beklenmeyen bir hata oluştu.";

        if (isMounted) {
          setErrorMessage(message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    }

    void fetchStats();

    return () => {
      isMounted = false;
    };
  }, [getToken, refreshKey]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-28 animate-pulse rounded-lg bg-muted" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-32 animate-pulse rounded-lg bg-muted" />
          <div className="h-32 animate-pulse rounded-lg bg-muted" />
          <div className="h-32 animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="h-48 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  const displayName =
    user?.firstName ||
    user?.fullName ||
    user?.primaryEmailAddress?.emailAddress ||
    "Yusuf";

  const statCards = stats
    ? [
        {
          title: "Aylık Satış",
          value: formatCurrency(stats.totalSales),
          description: "Bu ay canonical_orders toplamı",
          icon: ShoppingCart,
        },
        {
          title: "Sipariş",
          value: stats.orderCount.toString(),
          description: "Bu ayki sipariş kaydı",
          icon: Activity,
        },
        {
          title: "ERP Bağlantısı",
          value: stats.erpConnectionsCount.toString(),
          description: `Son sync: ${getStatusLabel(stats.lastSyncStatus)}`,
          icon: Database,
        },
        {
          title: "Excel Upload",
          value: stats.excelUploadCount.toString(),
          description: "Yüklenen Excel/CSV dosyası",
          icon: FileSpreadsheet,
        },
        {
          title: "Chat Mesajı",
          value: stats.chatMessagesCount.toString(),
          description: "Kaydedilen chat mesajları",
          icon: Bot,
        },
        {
          title: "Audit Event",
          value: stats.auditEventCount.toString(),
          description: "Sistemde oluşan log kayıtları",
          icon: ShieldCheck,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Hoş geldin,</p>
            <h1 className="text-2xl font-bold">{displayName}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              ERPilot modüllerinden gelen gerçek backend verilerinin özetini
              burada görüntüleyebilirsin.
            </p>
          </div>

          <button
            type="button"
            disabled={isRefreshing}
            onClick={() => setRefreshKey((currentValue) => currentValue + 1)}
            className="inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium disabled:opacity-50"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {isRefreshing ? "Yenileniyor..." : "Yenile"}
          </button>
        </div>
      </section>

      {errorMessage ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      {stats ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {statCards.map((card) => {
              const Icon = card.icon;

              return (
                <div key={card.title} className="rounded-lg border bg-card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {card.title}
                      </p>
                      <p className="mt-2 text-2xl font-bold">{card.value}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {card.description}
                      </p>
                    </div>

                    <div className="rounded-full bg-muted p-3">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              );
            })}
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border bg-card p-5">
              <h2 className="text-lg font-semibold">Son Sync Durumu</h2>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Durum</span>
                  <span className="font-medium">
                    {getStatusLabel(stats.lastSyncStatus)}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Senkron satır</span>
                  <span className="font-medium">{stats.lastSyncRows}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Son tarih</span>
                  <span className="font-medium">
                    {formatDate(stats.lastSyncAt)}
                  </span>
                </div>
                {stats.lastSyncError ? (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-destructive">
                    {stats.lastSyncError}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-lg border bg-card p-5">
              <h2 className="text-lg font-semibold">Hızlı Erişim</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <a
                  href="/chat"
                  className="rounded-lg border p-3 text-sm hover:bg-muted/50"
                >
                  <Bot className="mb-2 h-4 w-4" />
                  Chat Asistan
                </a>
                <a
                  href="/erp-connections"
                  className="rounded-lg border p-3 text-sm hover:bg-muted/50"
                >
                  <Database className="mb-2 h-4 w-4" />
                  ERP Bağlantıları
                </a>
                <a
                  href="/excel-compare"
                  className="rounded-lg border p-3 text-sm hover:bg-muted/50"
                >
                  <Upload className="mb-2 h-4 w-4" />
                  Excel Karşılaştırma
                </a>
                <a
                  href="/admin/audit"
                  className="rounded-lg border p-3 text-sm hover:bg-muted/50"
                >
                  <ShieldCheck className="mb-2 h-4 w-4" />
                  Audit Log
                </a>
              </div>
            </div>
          </section>

          <section className="rounded-lg border bg-card p-5">
            <h2 className="text-lg font-semibold">Son Aktiviteler</h2>

            {stats.recentActivities.length > 0 ? (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="py-3 pr-4">Aksiyon</th>
                      <th className="py-3 pr-4">Kaynak</th>
                      <th className="py-3 pr-4">Durum</th>
                      <th className="py-3 pr-4">Tarih</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentActivities.map((activity, index) => (
                      <tr
                        key={`${activity.action}-${activity.createdAt}-${index}`}
                        className="border-b last:border-0"
                      >
                        <td className="py-3 pr-4 font-medium">
                          {getActionLabel(activity.action)}
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {activity.resourceType ?? "-"}
                        </td>
                        <td className="py-3 pr-4">
                          {getStatusLabel(activity.status)}
                        </td>
                        <td className="py-3 pr-4">
                          {formatDate(activity.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                Henüz aktivite kaydı bulunamadı.
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}