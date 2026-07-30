import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Database,
  FileSpreadsheet,
  Package,
  ShoppingCart,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type {
  DigestMetric,
  DigestTrendDirection,
} from "@/services/digest-service";

type DigestMetricCardProps = {
  metric: DigestMetric;
};

const trendIconMap: Record<DigestTrendDirection, typeof ArrowRight> = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  flat: ArrowRight,
};

const metricIconMap: Partial<Record<string, LucideIcon>> = {
  sales: TrendingUp,
  orders: ShoppingCart,
  anomalies: AlertTriangle,
  "excel-diffs": FileSpreadsheet,
  "critical-stock": Package,
  "erp-sync": Database,
};

export function DigestMetricCard({ metric }: DigestMetricCardProps) {
  const TrendIcon = trendIconMap[metric.trendDirection];
  const MetricIcon = metricIconMap[metric.id] ?? Activity;

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{metric.title}</p>
            <p className="mt-2 text-2xl font-bold">{metric.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {metric.description}
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
            <MetricIcon className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>

        <div className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
          <TrendIcon className="mr-1.5 h-3.5 w-3.5" />
          {metric.trendLabel}
        </div>
      </CardContent>
    </Card>
  );
}