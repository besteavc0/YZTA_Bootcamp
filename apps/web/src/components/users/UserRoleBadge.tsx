import type { UserRole } from "@/services/user-management-service";

type UserRoleBadgeProps = {
  role: UserRole;
};

const roleMap: Record<
  UserRole,
  {
    label: string;
    className: string;
  }
> = {
  admin: {
    label: "Admin",
    className: "border-purple-200 bg-purple-50 text-purple-700",
  },
  user: {
    label: "User",
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },
  viewer: {
    label: "Viewer",
    className: "border-gray-200 bg-gray-50 text-gray-700",
  },
};

export function UserRoleBadge({ role }: UserRoleBadgeProps) {
  const roleConfig = roleMap[role];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${roleConfig.className}`}
    >
      {roleConfig.label}
    </span>
  );
}