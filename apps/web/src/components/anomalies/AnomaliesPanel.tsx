"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { AnomalyFinding, AnomalySeverity } from "@/types";
import type { AnomalyStatusFilter } from "@/services/anomaly-service";
import { getAnomalies, resolveAnomaly } from "@/services/anomaly-service";
import { AnomalyCard } from "./AnomalyCard";
import { AnomalySummaryCards } from "./AnomalySummaryCards";

const statusFilters: Array<{
  label: string;
  value: AnomalyStatusFilter;
}> = [
  { label: "Tümü", value: "all" },
  { label: "Çözülmemiş", value: "open" },
  { label: "Çözülmüş", value: "resolved" },
];

const severityFilters: Array<{
  label: string;
  value: AnomalySeverity | "all";
}> = [
  { label: "Tüm seviyeler", value: "all" },
  { label: "Yüksek", value: "high" },
  { label: "Orta", value: "medium" },
  { label: "Düşük", value: "low" },
];

export function AnomaliesPanel() {
  const { getToken } = useAuth();
  const { user } = useUser();

  const [items, setItems] = useState<AnomalyFinding[]>([]);
  const [summaryItems, setSummaryItems] = useState<AnomalyFinding[]>([]);
  const [statusFilter, setStatusFilter] =
    useState<AnomalyStatusFilter>("open");
  const [severityFilter, setSeverityFilter] =
    useState<AnomalySeverity | "all">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const role = user?.publicMetadata?.role ?? "user";
  const isAdmin = role === "admin";

  const totalCount = summaryItems.length;
  const openCount = summaryItems.filter((item) => !item.isResolved).length;
  const resolvedCount = summaryItems.filter((item) => item.isResolved).length;
  const highRiskCount = summaryItems.filter(
  (item) => item.severity === "high"
).length;

  useEffect(() => {
    let isMounted = true;

    async function fetchAnomalies() {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const token = await getToken();

        const [listResponse, summaryResponse] = await Promise.all([
  getAnomalies({
    severity: severityFilter,
    status: statusFilter,
    token,
  }),
  getAnomalies({
    severity: "all",
    status: "all",
    token,
  }),
]);

if (isMounted) {
  setItems(listResponse.items);
  setSummaryItems(summaryResponse.items);
}
      } catch {
        if (isMounted) {
          setErrorMessage("Anomaliler yüklenirken bir hata oluştu.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void fetchAnomalies();

    return () => {
      isMounted = false;
    };
  }, [getToken, severityFilter, statusFilter, refreshKey]);

  async function handleResolve(anomalyId: string) {
    try {
      setResolvingId(anomalyId);
      setErrorMessage(null);

      const token = await getToken();
      await resolveAnomaly(anomalyId, token);

      setItems((currentItems) =>
      currentItems.map((item) =>
    item.id === anomalyId ? { ...item, isResolved: true } : item
  )
);

setSummaryItems((currentItems) =>
  currentItems.map((item) =>
    item.id === anomalyId ? { ...item, isResolved: true } : item
  )
);
    } catch {
      setErrorMessage("Anomali çözüldü olarak işaretlenemedi.");
    } finally {
      setResolvingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Tespit Edilen Anomaliler</h2>
          <p className="text-sm text-muted-foreground">
            ERP verilerinde kurallar tarafından yakalanan olağandışı durumlar.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => setRefreshKey((currentValue) => currentValue + 1)}
        >
          Yenile
        </Button>
      </div>

              <AnomalySummaryCards
              totalCount={totalCount}
              openCount={openCount}
              highRiskCount={highRiskCount}
              resolvedCount={resolvedCount}
              />

      <div className="flex flex-wrap gap-3">
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((filter) => (
            <Button
              key={filter.value}
              type="button"
              size="sm"
              variant={statusFilter === filter.value ? "default" : "outline"}
              onClick={() => setStatusFilter(filter.value)}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {severityFilters.map((filter) => (
            <Button
              key={filter.value}
              type="button"
              size="sm"
              variant={severityFilter === filter.value ? "default" : "outline"}
              onClick={() => setSeverityFilter(filter.value)}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border bg-background p-8 text-center">
          <p className="font-medium">
            Şu an tespit edilmiş anomali bulunmuyor.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Filtreleri değiştirerek farklı kayıtları görüntüleyebilirsin.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((anomaly) => (
            <AnomalyCard
              key={anomaly.id}
              anomaly={anomaly}
              isAdmin={isAdmin}
              isResolving={resolvingId === anomaly.id}
              onResolve={(id) => {
                void handleResolve(id);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}