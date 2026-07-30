import type { AuditActionType } from "@/services/audit-log-service";

type AuditActionBadgeProps = {
  action: AuditActionType;
};

const actionLabelMap: Record<AuditActionType, string> = {
  login: "Login",
  chat_query: "Chat Query",
  excel_upload: "Excel Upload",
  erp_sync: "ERP Sync",
  erp_config_change: "ERP Config",
  user_role_change: "Role Change",
};

export function AuditActionBadge({ action }: AuditActionBadgeProps) {
  return (
    <span className="inline-flex items-center rounded-md bg-muted px-2.5 py-1 text-xs font-medium">
      {actionLabelMap[action]}
    </span>
  );
}