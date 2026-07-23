"use client";

import { RefreshCw, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { UserRole, UserStatus } from "@/services/user-management-service";

export type UserRoleFilter = UserRole | "all";

export type UserStatusFilter = UserStatus | "all";

type UserManagementFiltersProps = {
  searchQuery: string;
  roleFilter: UserRoleFilter;
  statusFilter: UserStatusFilter;
  resultCount: number;
  totalCount: number;
  isLoading: boolean;
  onSearchChange: (value: string) => void;
  onRoleFilterChange: (value: UserRoleFilter) => void;
  onStatusFilterChange: (value: UserStatusFilter) => void;
  onRefresh: () => void;
};

export function UserManagementFilters({
  searchQuery,
  roleFilter,
  statusFilter,
  resultCount,
  totalCount,
  isLoading,
  onSearchChange,
  onRoleFilterChange,
  onStatusFilterChange,
  onRefresh,
}: UserManagementFiltersProps) {
  return (
    <div className="space-y-3 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium">Kullanıcıları Filtrele</h2>
          <p className="text-xs text-muted-foreground">
            {resultCount} / {totalCount} kullanıcı gösteriliyor.
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

      <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <input
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="İsim veya e-posta ara..."
            className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(event) =>
            onRoleFilterChange(event.target.value as UserRoleFilter)
          }
          className="h-10 rounded-md border bg-background px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="all">Tüm roller</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
          <option value="viewer">Viewer</option>
        </select>

        <select
          value={statusFilter}
          onChange={(event) =>
            onStatusFilterChange(event.target.value as UserStatusFilter)
          }
          className="h-10 rounded-md border bg-background px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="all">Tüm durumlar</option>
          <option value="active">Aktif</option>
          <option value="inactive">Pasif</option>
        </select>
      </div>
    </div>
  );
}