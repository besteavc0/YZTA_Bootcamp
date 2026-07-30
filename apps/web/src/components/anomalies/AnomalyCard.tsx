import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AnomalyFinding } from "@/types";
import { AnomalySeverityBadge } from "./AnomalySeverityBadge";

type AnomalyCardProps = {
  anomaly: AnomalyFinding;
  isAdmin: boolean;
  isResolving?: boolean;
  onResolve: (id: string) => void;
};

export function AnomalyCard({
  anomaly,
  isAdmin,
  isResolving = false,
  onResolve,
}: AnomalyCardProps) {
  return (
    <article className="rounded-xl border bg-background p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            {anomaly.isResolved ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">{anomaly.title}</h3>
              <AnomalySeverityBadge severity={anomaly.severity} />

              {anomaly.isResolved && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  Çözüldü
                </span>
              )}
            </div>

            {anomaly.description && (
              <p className="mt-2 text-sm text-muted-foreground">
                {anomaly.description}
              </p>
            )}

            <p className="mt-3 text-xs text-muted-foreground">
              Tespit tarihi:{" "}
              {new Date(anomaly.detectedAt).toLocaleString("tr-TR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        {isAdmin && !anomaly.isResolved && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isResolving}
            onClick={() => onResolve(anomaly.id)}
          >
            Çözüldü İşaretle
          </Button>
        )}
      </div>

      {anomaly.metadata && Object.keys(anomaly.metadata).length > 0 && (
        <div className="mt-4 rounded-lg bg-muted/50 p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            İlgili kayıt bilgileri
          </p>

          <dl className="grid gap-2 text-xs sm:grid-cols-2">
            {Object.entries(anomaly.metadata).map(([key, value]) => (
              <div key={key}>
                <dt className="text-muted-foreground">{key}</dt>
                <dd className="font-medium">{String(value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </article>
  );
}