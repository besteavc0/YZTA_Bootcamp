import { Database, PlugZap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ErpConnection } from "@/services/erp-connection-service";

import { ErpConnectionStatusBadge } from "./ErpConnectionStatusBadge";
import { ErpProviderBadge } from "./ErpProviderBadge";

type ErpConnectionCardProps = {
  connection: ErpConnection;
  isTesting: boolean;
  onTestConnection: (connectionId: string) => void;
};

function formatDateTime(value: string | null) {
  if (!value) {
    return "Henüz senkronize edilmedi";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function ErpConnectionCard({
  connection,
  isTesting,
  onTestConnection,
}: ErpConnectionCardProps) {
  return (
    <Card>
      <CardContent className="space-y-5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
              <Database className="h-6 w-6 text-muted-foreground" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold">{connection.name}</h2>
                <ErpProviderBadge provider={connection.provider} />
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                {connection.description}
              </p>
            </div>
          </div>

          <ErpConnectionStatusBadge status={connection.status} />
        </div>

        <div className="grid gap-3 rounded-lg border bg-muted/30 p-4 text-sm md:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Host</p>
            <p className="font-medium">{connection.host}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Company Code</p>
            <p className="font-medium">{connection.companyCode}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Son Senkronizasyon</p>
            <p className="font-medium">{formatDateTime(connection.lastSyncAt)}</p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={isTesting}
          onClick={() => onTestConnection(connection.id)}
        >
          <PlugZap className="mr-2 h-4 w-4" />
          {isTesting ? "Test Ediliyor..." : "Bağlantıyı Test Et"}
        </Button>
      </CardContent>
    </Card>
  );
}