import type { AuditLogStatus } from "@/services/audit-log-service";

type AuditStatusBadgeProps = {
  status: AuditLogStatus;
};

const statusMap: Record<
  AuditLogStatus,
  {
    label: string;
    className: string;
  }
> = {
  success: {
    label: "Başarılı",
    className: "border-green-200 bg-green-50 text-green-700",
  },
  denied: {
    label: "Reddedildi",
    className: "border-red-200 bg-red-50 text-red-700",
  },
  error: {
    label: "Hata",
    className: "border-yellow-200 bg-yellow-50 text-yellow-700",
  },
};

export function AuditStatusBadge({ status }: AuditStatusBadgeProps) {
  const statusConfig = statusMap[status];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusConfig.className}`}
    >
      {statusConfig.label}
    </span>
  );
}