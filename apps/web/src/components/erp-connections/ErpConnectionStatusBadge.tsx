import type { ErpConnectionStatus } from "@/services/erp-connection-service";

type ErpConnectionStatusBadgeProps = {
  status: ErpConnectionStatus;
};

const statusMap: Record<
  ErpConnectionStatus,
  {
    label: string;
    className: string;
  }
> = {
  connected: {
    label: "Bağlı",
    className: "border-green-200 bg-green-50 text-green-700",
  },
  disconnected: {
    label: "Bağlı Değil",
    className: "border-gray-200 bg-gray-50 text-gray-700",
  },
  error: {
    label: "Hata",
    className: "border-red-200 bg-red-50 text-red-700",
  },
};

export function ErpConnectionStatusBadge({
  status,
}: ErpConnectionStatusBadgeProps) {
  const statusConfig = statusMap[status];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusConfig.className}`}
    >
      {statusConfig.label}
    </span>
  );
}