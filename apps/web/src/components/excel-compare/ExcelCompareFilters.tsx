"use client";

import { Download, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ExcelCompareStatusFilter } from "@/services/excel-compare-service";

type ExcelCompareFiltersProps = {
  searchQuery: string;
  statusFilter: ExcelCompareStatusFilter;
  onlyIssues: boolean;
  resultCount: number;
  totalCount: number;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: ExcelCompareStatusFilter) => void;
  onOnlyIssuesChange: (value: boolean) => void;
  onExportCsv: () => void;
};

export function ExcelCompareFilters({
  searchQuery,
  statusFilter,
  onlyIssues,
  resultCount,
  totalCount,
  onSearchChange,
  onStatusFilterChange,
  onOnlyIssuesChange,
  onExportCsv,
}: ExcelCompareFiltersProps) {
  return (
    <div className="space-y-3 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium">Sonuçları Filtrele</h3>
          <p className="text-xs text-muted-foreground">
            {resultCount} / {totalCount} kayıt gösteriliyor.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={resultCount === 0}
          onClick={onExportCsv}
        >
          <Download className="mr-2 h-4 w-4" />
          CSV İndir
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Referans, alan, değer veya not ara..."
            className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) =>
            onStatusFilterChange(event.target.value as ExcelCompareStatusFilter)
          }
          className="h-10 rounded-md border bg-background px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="all">Tüm durumlar</option>
          <option value="matched">Aynı</option>
          <option value="different">Farklı</option>
          <option value="missing">ERP&apos;de Yok</option>
        </select>

        <label className="flex h-10 items-center gap-2 rounded-md border bg-background px-3 text-sm">
          <input
            type="checkbox"
            checked={onlyIssues}
            onChange={(event) => onOnlyIssuesChange(event.target.checked)}
            className="h-4 w-4"
          />
          Sadece sorunlular
        </label>
      </div>
    </div>
  );
}