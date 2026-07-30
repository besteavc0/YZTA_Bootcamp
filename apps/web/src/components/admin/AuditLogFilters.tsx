"use client";

import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import type {
  AuditActionFilter,
  AuditStatusFilter,
} from "@/services/audit-log-service";

type AuditLogFiltersProps = {
  actionFilter: AuditActionFilter;
  statusFilter: AuditStatusFilter;
  startDate: string;
  endDate: string;
  resultCount: number;
  totalCount: number;
  isLoading: boolean;
  onActionFilterChange: (value: AuditActionFilter) => void;
  onStatusFilterChange: (value: AuditStatusFilter) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onRefresh: () => void;
};

export function AuditLogFilters({
  actionFilter,
  statusFilter,
  startDate,
  endDate,
  resultCount,
  totalCount,
  isLoading,
  onActionFilterChange,
  onStatusFilterChange,
  onStartDateChange,
  onEndDateChange,
  onRefresh,
}: AuditLogFiltersProps) {
  return (
    <div className="space-y-3 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium">Audit Log Filtreleri</h2>
          <p className="text-xs text-muted-foreground">
            {resultCount} / {totalCount} kayıt gösteriliyor.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isLoading}
          onClick={onRefresh}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          {isLoading ? "Yenileniyor..." : "Yenile"}
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <select
          value={actionFilter}
          onChange={(event) =>
            onActionFilterChange(event.target.value as AuditActionFilter)
          }
          className="h-10 rounded-md border bg-background px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="all">Tüm aksiyonlar</option>
          <option value="login">Login</option>
          <option value="chat_query">Chat Query</option>
          <option value="excel_upload">Excel Upload</option>
          <option value="erp_sync">ERP Sync</option>
          <option value="erp_config_change">ERP Config Change</option>
          <option value="user_role_change">User Role Change</option>
        </select>

        <select
          value={statusFilter}
          onChange={(event) =>
            onStatusFilterChange(event.target.value as AuditStatusFilter)
          }
          className="h-10 rounded-md border bg-background px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="all">Tüm durumlar</option>
          <option value="success">Başarılı</option>
          <option value="denied">Reddedildi</option>
          <option value="error">Hata</option>
        </select>

        <input
          type="date"
          value={startDate}
          onChange={(event) => onStartDateChange(event.target.value)}
          className="h-10 rounded-md border bg-background px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
        />

        <input
          type="date"
          value={endDate}
          onChange={(event) => onEndDateChange(event.target.value)}
          className="h-10 rounded-md border bg-background px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
    </div>
  );
}