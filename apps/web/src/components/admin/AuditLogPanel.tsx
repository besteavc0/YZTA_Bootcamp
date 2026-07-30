"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  getAuditLogs,
  type AuditActionFilter,
  type AuditLog,
  type AuditStatusFilter,
} from "@/services/audit-log-service";

import { AuditLogDetailsModal } from "./AuditLogDetailsModal";
import { AuditLogFilters } from "./AuditLogFilters";
import { AuditLogTable } from "./AuditLogTable";

const PAGE_SIZE = 50;

export function AuditLogPanel() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { user, isLoaded } = useUser();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [actionFilter, setActionFilter] = useState<AuditActionFilter>("all");
  const [statusFilter, setStatusFilter] = useState<AuditStatusFilter>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [offset, setOffset] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const role = user?.publicMetadata?.role ?? "user";
  const isAdmin = role === "admin";

  useEffect(() => {
    if (isLoaded && !isAdmin) {
      router.push("/dashboard");
    }
  }, [isLoaded, isAdmin, router]);

  useEffect(() => {
    if (!isLoaded || !isAdmin) {
      return;
    }

    let isMounted = true;

async function fetchLogs() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const token = await getToken();

      const response = await getAuditLogs({
        action: actionFilter,
        status: statusFilter,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        limit: PAGE_SIZE,
        offset,
        token,
      });

      if (isMounted) {
        setLogs(response.items);
        setTotalCount(response.totalCount);
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Audit log kayıtları yüklenirken beklenmeyen bir hata oluştu.";

      if (isMounted) {
        setErrorMessage(message);
      }
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  }

  void fetchLogs();

  return () => {
    isMounted = false;
  };
}, [
  actionFilter,
  endDate,
  getToken,
  isAdmin,
  isLoaded,
  offset,
  refreshKey,
  startDate,
  statusFilter,
]);

function handleActionFilterChange(value: AuditActionFilter) {
  setActionFilter(value);
  setOffset(0);
}

function handleStatusFilterChange(value: AuditStatusFilter) {
  setStatusFilter(value);
  setOffset(0);
}

function handleStartDateChange(value: string) {
  setStartDate(value);
  setOffset(0);
}

function handleEndDateChange(value: string) {
  setEndDate(value);
  setOffset(0);
}


  if (!isLoaded) {
    return <div className="h-40 animate-pulse rounded-lg bg-muted" />;
  }

  if (!isAdmin) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        Bu sayfaya erişim yetkiniz yok. Dashboard sayfasına yönlendiriliyorsunuz.
      </div>
    );
  }

  const canGoPrevious = offset > 0;
  const canGoNext = offset + PAGE_SIZE < totalCount;

  return (
    <div className="space-y-6">
      <AuditLogFilters
  actionFilter={actionFilter}
  statusFilter={statusFilter}
  startDate={startDate}
  endDate={endDate}
  resultCount={logs.length}
  totalCount={totalCount}
  isLoading={isLoading}
  onActionFilterChange={handleActionFilterChange}
  onStatusFilterChange={handleStatusFilterChange}
  onStartDateChange={handleStartDateChange}
  onEndDateChange={handleEndDateChange}
  onRefresh={() => setRefreshKey((currentValue) => currentValue + 1)}
/>

      {errorMessage ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-14 animate-pulse rounded-lg bg-muted" />
          <div className="h-14 animate-pulse rounded-lg bg-muted" />
          <div className="h-14 animate-pulse rounded-lg bg-muted" />
          <div className="h-14 animate-pulse rounded-lg bg-muted" />
        </div>
      ) : (
        <>
          <AuditLogTable logs={logs} onRowClick={setSelectedLog} />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {totalCount === 0
                ? "Kayıt yok"
                : `${offset + 1}-${Math.min(
                    offset + logs.length,
                    totalCount
                  )} / ${totalCount} kayıt`}
            </p>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={!canGoPrevious}
                onClick={() =>
                  setOffset((currentOffset) =>
                    Math.max(currentOffset - PAGE_SIZE, 0)
                  )
                }
              >
                Önceki
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={!canGoNext}
                onClick={() =>
                  setOffset((currentOffset) => currentOffset + PAGE_SIZE)
                }
              >
                Sonraki
              </Button>
            </div>
          </div>
        </>
      )}

      <AuditLogDetailsModal
        log={selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    </div>
  );
}