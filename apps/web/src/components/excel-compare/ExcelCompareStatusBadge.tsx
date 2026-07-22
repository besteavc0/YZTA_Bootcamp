import type { ExcelCompareStatus } from "@/services/excel-compare-service";

type ExcelCompareStatusBadgeProps = {
  status: ExcelCompareStatus;
};

const statusMap: Record<
  ExcelCompareStatus,
  {
    label: string;
    className: string;
  }
> = {
  matched: {
    label: "Aynı",
    className: "border-green-200 bg-green-50 text-green-700",
  },
  different: {
    label: "Farklı",
    className: "border-yellow-200 bg-yellow-50 text-yellow-700",
  },
  missing: {
    label: "ERP'de Yok",
    className: "border-red-200 bg-red-50 text-red-700",
  },
};

export function ExcelCompareStatusBadge({
  status,
}: ExcelCompareStatusBadgeProps) {
  const statusConfig = statusMap[status];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusConfig.className}`}
    >
      {statusConfig.label}
    </span>
  );
}