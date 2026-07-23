import type { AuditLog, AuditLogStatus } from "@/services/audit-log-service";

import { AuditActionBadge } from "./AuditActionBadge";
import { AuditStatusBadge } from "./AuditStatusBadge";

type AuditLogTableProps = {
  logs: AuditLog[];
  onRowClick: (log: AuditLog) => void;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

const rowClassMap: Record<AuditLogStatus, string> = {
  success: "bg-background",
  denied: "bg-red-50/60",
  error: "bg-yellow-50/60",
};

export function AuditLogTable({ logs, onRowClick }: AuditLogTableProps) {
  if (logs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Seçili filtrelere uygun audit log kaydı bulunamadı.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">Kullanıcı</th>
              <th className="px-4 py-3 font-medium">Aksiyon</th>
              <th className="px-4 py-3 font-medium">Kaynak</th>
              <th className="px-4 py-3 font-medium">IP Adresi</th>
              <th className="px-4 py-3 font-medium">Durum</th>
              <th className="px-4 py-3 font-medium">Tarih</th>
            </tr>
          </thead>

          <tbody>
            {logs.map((log) => (
              <tr
                key={log.id}
                role="button"
                tabIndex={0}
                className={`cursor-pointer border-b transition last:border-0 hover:bg-muted/60 ${rowClassMap[log.status]}`}
                onClick={() => onRowClick(log)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    onRowClick(log);
                  }
                }}
              >
                <td className="px-4 py-3 font-medium">{log.userEmail}</td>
                <td className="px-4 py-3">
                  <AuditActionBadge action={log.action} />
                </td>
                <td className="px-4 py-3">{log.resourceType}</td>
                <td className="px-4 py-3">{log.ipAddress}</td>
                <td className="px-4 py-3">
                  <AuditStatusBadge status={log.status} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDateTime(log.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}