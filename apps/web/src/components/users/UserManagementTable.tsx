import { Power } from "lucide-react";

import { Button } from "@/components/ui/button";
import type {
  ManagedUser,
  UserRole,
  UserStatus,
} from "@/services/user-management-service";

import { UserRoleBadge } from "./UserRoleBadge";
import { UserStatusBadge } from "./UserStatusBadge";

type UserManagementTableProps = {
  users: ManagedUser[];
  updatingUserId: string | null;
  onRoleChange: (userId: string, role: UserRole) => void;
  onStatusToggle: (userId: string, currentStatus: UserStatus) => void;
};

function formatDateTime(value: string | null) {
  if (!value) {
    return "Henüz giriş yapmadı";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function UserManagementTable({
  users,
  updatingUserId,
  onRoleChange,
  onStatusToggle,
}: UserManagementTableProps) {
  if (users.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Seçili filtrelere uygun kullanıcı bulunamadı.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[940px] text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">Kullanıcı</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 font-medium">Durum</th>
              <th className="px-4 py-3 font-medium">Son Giriş</th>
              <th className="px-4 py-3 font-medium">Oluşturulma</th>
              <th className="px-4 py-3 font-medium">Aksiyon</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => {
              const isUpdating = updatingUserId === user.id;

              return (
                <tr key={user.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <UserRoleBadge role={user.role} />

                      <select
                        value={user.role}
                        disabled={isUpdating}
                        onChange={(event) =>
                          onRoleChange(user.id, event.target.value as UserRole)
                        }
                        className="h-9 rounded-md border bg-background px-2 text-xs outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="admin">Admin</option>
                        <option value="user">User</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <UserStatusBadge status={user.status} />
                  </td>

                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDateTime(user.lastLoginAt)}
                  </td>

                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDateTime(user.createdAt)}
                  </td>

                  <td className="px-4 py-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isUpdating}
                      onClick={() => onStatusToggle(user.id, user.status)}
                    >
                      <Power className="mr-2 h-4 w-4" />
                      {user.status === "active" ? "Pasifleştir" : "Aktifleştir"}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}