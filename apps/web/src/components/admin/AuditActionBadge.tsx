import type { AuditActionType } from "@/services/audit-log-service";

type AuditActionBadgeProps = {
  action: AuditActionType;
};

const actionMap: Record<
  AuditActionType,
  {
    label: string;
    className: string;
  }
> = {
  login: {
    label: "Giriş",
    className: "border-slate-200 bg-slate-50 text-slate-700",
  },
  chat_query: {
    label: "Chat Sorgusu",
    className: "border-purple-200 bg-purple-50 text-purple-700",
  },
  excel_upload: {
    label: "Excel Yükleme",
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },
  excel_compare: {
    label: "Excel Karşılaştırma",
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },
  erp_sync: {
    label: "ERP Sync",
    className: "border-green-200 bg-green-50 text-green-700",
  },
  erp_config_change: {
    label: "ERP Ayar Değişikliği",
    className: "border-yellow-200 bg-yellow-50 text-yellow-700",
  },
  user_role_change: {
    label: "Rol Değişikliği",
    className: "border-red-200 bg-red-50 text-red-700",
  },
};

export function AuditActionBadge({ action }: AuditActionBadgeProps) {
  const actionConfig = actionMap[action];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${actionConfig.className}`}
    >
      {actionConfig.label}
    </span>
  );
}