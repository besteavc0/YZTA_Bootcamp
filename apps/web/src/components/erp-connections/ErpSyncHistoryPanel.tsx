import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import type {
  ErpConnection,
  ErpSyncRun,
} from "@/services/erp-connection-service";

type ErpSyncHistoryPanelProps = {
  connections: ErpConnection[];
  selectedConnectionId: string;
  syncRuns: ErpSyncRun[];
  isLoading: boolean;
  errorMessage: string | null;
  onConnectionChange: (connectionId: string) => void;
  onRefresh: () => void;
};

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function getStatusLabel(status: string) {
  if (status === "success") {
    return "Başarılı";
  }

  if (status === "failed") {
    return "Başarısız";
  }

  return status;
}

export function ErpSyncHistoryPanel({
  connections,
  selectedConnectionId,
  syncRuns,
  isLoading,
  errorMessage,
  onConnectionChange,
  onRefresh,
}: ErpSyncHistoryPanelProps) {
  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Sync Geçmişi</h2>
          <p className="text-sm text-muted-foreground">
            Seçili ERP bağlantısı için son senkronizasyon sonuçları.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={selectedConnectionId}
            onChange={(event) => onConnectionChange(event.target.value)}
            className="rounded-md border bg-background px-3 py-2 text-sm"
          >
            {connections.map((connection) => (
              <option key={connection.id} value={connection.id}>
                {connection.name}
              </option>
            ))}
          </select>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isLoading || selectedConnectionId.length === 0}
            onClick={onRefresh}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {isLoading ? "Yükleniyor..." : "Geçmişi Yenile"}
          </Button>
        </div>
      </div>

      {errorMessage ? (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      {syncRuns.length > 0 ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-xs uppercase text-muted-foreground">
              <tr>
                <th className="py-3 pr-4">Durum</th>
                <th className="py-3 pr-4">Satır</th>
                <th className="py-3 pr-4">Başlangıç</th>
                <th className="py-3 pr-4">Bitiş</th>
                <th className="py-3 pr-4">Hata</th>
              </tr>
            </thead>
            <tbody>
              {syncRuns.map((syncRun) => (
                <tr key={syncRun.id} className="border-b last:border-0">
                  <td className="py-3 pr-4 font-medium">
                    {getStatusLabel(syncRun.status)}
                  </td>
                  <td className="py-3 pr-4">{syncRun.rowsSynced ?? "-"}</td>
                  <td className="py-3 pr-4">
                    {formatDate(syncRun.startedAt)}
                  </td>
                  <td className="py-3 pr-4">
                    {formatDate(syncRun.finishedAt)}
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">
                    {syncRun.errorMessage ?? "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Bu bağlantı için sync geçmişi bulunamadı.
        </div>
      )}
    </section>
  );
}