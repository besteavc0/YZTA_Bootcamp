"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AuditLog } from "@/services/audit-log-service";

type AuditLogDetailsModalProps = {
  log: AuditLog | null;
  onClose: () => void;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function AuditLogDetailsModal({
  log,
  onClose,
}: AuditLogDetailsModalProps) {
  if (!log) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-xl border bg-card shadow-lg">
        <div className="flex items-start justify-between gap-4 border-b p-5">
          <div>
            <h2 className="text-lg font-semibold">Audit Log Detayı</h2>
            <p className="text-sm text-muted-foreground">
              {log.userEmail} · {formatDateTime(log.createdAt)}
            </p>
          </div>

          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4 p-5">
          <div className="grid gap-3 text-sm md:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Aksiyon</p>
              <p className="font-medium">{log.action}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Durum</p>
              <p className="font-medium">{log.status}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Kaynak</p>
              <p className="font-medium">{log.resourceType}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">IP Adresi</p>
              <p className="font-medium">{log.ipAddress}</p>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Details JSON</p>
            <pre className="max-h-[420px] overflow-auto rounded-lg bg-muted p-4 text-xs">
              {JSON.stringify(log.details, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}