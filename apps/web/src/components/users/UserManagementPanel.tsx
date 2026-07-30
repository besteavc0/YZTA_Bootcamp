"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

import {
  getManagedUsers,
  updateUserRole,
  updateUserStatus,
  type ManagedUser,
  type UserRole,
  type UserStatus,
} from "@/services/user-management-service";

import {
  UserManagementFilters,
  type UserRoleFilter,
  type UserStatusFilter,
} from "./UserManagementFilters";
import { UserManagementSummaryCards } from "./UserManagementSummaryCards";
import { UserManagementTable } from "./UserManagementTable";

export function UserManagementPanel() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { user, isLoaded } = useUser();

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<UserStatusFilter>("all");
  const [refreshKey, setRefreshKey] = useState(0);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

    async function fetchUsers() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const token = await getToken();

        const response = await getManagedUsers({
          token,
        });

        if (isMounted) {
          setUsers(response);
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Kullanıcılar yüklenirken beklenmeyen bir hata oluştu.";

        if (isMounted) {
          setErrorMessage(message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void fetchUsers();

    return () => {
      isMounted = false;
    };
  }, [getToken, isAdmin, isLoaded, refreshKey]);

  const filteredUsers = users.filter((managedUser) => {
    const normalizedSearchQuery = searchQuery.trim().toLowerCase();

    const searchableText = [managedUser.name, managedUser.email]
      .join(" ")
      .toLowerCase();

    const matchesSearch =
      normalizedSearchQuery.length === 0 ||
      searchableText.includes(normalizedSearchQuery);

    const matchesRole =
      roleFilter === "all" || managedUser.role === roleFilter;

    const matchesStatus =
      statusFilter === "all" || managedUser.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  async function handleRoleChange(userId: string, nextRole: UserRole) {
    setUpdatingUserId(userId);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const token = await getToken();

      const response = await updateUserRole({
        userId,
        role: nextRole,
        token,
      });

      setUsers((currentUsers) =>
        currentUsers.map((managedUser) =>
          managedUser.id === userId
            ? {
                ...managedUser,
                role: response.role,
              }
            : managedUser
        )
      );

      setSuccessMessage("Kullanıcı rolü güncellendi.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Kullanıcı rolü güncellenirken beklenmeyen bir hata oluştu.";

      setErrorMessage(message);
    } finally {
      setUpdatingUserId(null);
    }
  }

  async function handleStatusToggle(
    userId: string,
    currentStatus: UserStatus
  ) {
    const nextStatus: UserStatus =
      currentStatus === "active" ? "inactive" : "active";

    setUpdatingUserId(userId);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const token = await getToken();

      const response = await updateUserStatus({
        userId,
        status: nextStatus,
        token,
      });

      setUsers((currentUsers) =>
        currentUsers.map((managedUser) =>
          managedUser.id === userId
            ? {
                ...managedUser,
                status: response.status,
              }
            : managedUser
        )
      );

      setSuccessMessage("Kullanıcı durumu güncellendi.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Kullanıcı durumu güncellenirken beklenmeyen bir hata oluştu.";

      setErrorMessage(message);
    } finally {
      setUpdatingUserId(null);
    }
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="h-28 animate-pulse rounded-lg bg-muted" />
          <div className="h-28 animate-pulse rounded-lg bg-muted" />
          <div className="h-28 animate-pulse rounded-lg bg-muted" />
          <div className="h-28 animate-pulse rounded-lg bg-muted" />
        </div>

        <div className="h-24 animate-pulse rounded-lg bg-muted" />
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {errorMessage ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {successMessage}
        </div>
      ) : null}

      <UserManagementSummaryCards users={users} />

      <UserManagementFilters
        searchQuery={searchQuery}
        roleFilter={roleFilter}
        statusFilter={statusFilter}
        resultCount={filteredUsers.length}
        totalCount={users.length}
        isLoading={isLoading}
        onSearchChange={setSearchQuery}
        onRoleFilterChange={setRoleFilter}
        onStatusFilterChange={setStatusFilter}
        onRefresh={() => setRefreshKey((currentValue) => currentValue + 1)}
      />

      <UserManagementTable
        users={filteredUsers}
        updatingUserId={updatingUserId}
        onRoleChange={handleRoleChange}
        onStatusToggle={handleStatusToggle}
      />
    </div>
  );
}