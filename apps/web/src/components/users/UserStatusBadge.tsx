import type { UserStatus } from "@/services/user-management-service";

type UserStatusBadgeProps = {
  status: UserStatus;
};

const statusMap: Record<
  UserStatus,
  {
    label: string;
    className: string;
  }
> = {
  active: {
    label: "Aktif",
    className: "border-green-200 bg-green-50 text-green-700",
  },
  inactive: {
    label: "Pasif",
    className: "border-red-200 bg-red-50 text-red-700",
  },
};

export function UserStatusBadge({ status }: UserStatusBadgeProps) {
  const statusConfig = statusMap[status];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusConfig.className}`}
    >
      {statusConfig.label}
    </span>
  );
}