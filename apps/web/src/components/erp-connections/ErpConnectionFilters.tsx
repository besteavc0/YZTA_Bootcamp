"use client";

import { RefreshCw, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import type {
  ErpConnectionStatusFilter,
  ErpProviderFilter,
} from "@/services/erp-connection-service";

type ErpConnectionFiltersProps = {
  searchQuery: string;
  providerFilter: ErpProviderFilter;
  statusFilter: ErpConnectionStatusFilter;
  resultCount: number;
  totalCount: number;
  isRefreshing: boolean;
  onSearchChange: (value: string) => void;
  onProviderFilterChange: (value: ErpProviderFilter) => void;
  onStatusFilterChange: (value: ErpConnectionStatusFilter) => void;
  onRefresh: () => void;
};

export function ErpConnectionFilters({
  searchQuery,
  providerFilter,
  statusFilter,
  resultCount,
  totalCount,
  isRefreshing,
  onSearchChange,
  onProviderFilterChange,
  onStatusFilterChange,
  onRefresh,
}: ErpConnectionFiltersProps) {
  return (
    <div className="space-y-3 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium">Bağlantıları Filtrele</h3>
          <p className="text-xs text-muted-foreground">
            {resultCount} / {totalCount} bağlantı gösteriliyor.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isRefreshing}
          onClick={onRefresh}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          {isRefreshing ? "Yenileniyor..." : "Yenile"}
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="İsim, açıklama, host veya company code ara..."
            className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <select
          value={providerFilter}
          onChange={(event) =>
            onProviderFilterChange(event.target.value as ErpProviderFilter)
          }
          className="h-10 rounded-md border bg-background px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="all">Tüm ERP&apos;ler</option>
          <option value="sap">SAP</option>
          <option value="logo">Logo</option>
          <option value="mikro">Mikro</option>
        </select>

        <select
          value={statusFilter}
          onChange={(event) =>
            onStatusFilterChange(
              event.target.value as ErpConnectionStatusFilter
            )
          }
          className="h-10 rounded-md border bg-background px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="all">Tüm durumlar</option>
          <option value="connected">Bağlı</option>
          <option value="disconnected">Bağlı Değil</option>
          <option value="error">Hata</option>
        </select>
      </div>
    </div>
  );
}