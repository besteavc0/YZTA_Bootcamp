import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";

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

export function DigestMetricCard({ metric }: DigestMetricCardProps) {
  const TrendIcon = trendIconMap[metric.trendDirection];

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div>
          <p className="text-sm text-muted-foreground">{metric.title}</p>
          <p className="mt-2 text-2xl font-bold">{metric.value}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {metric.description}
          </p>
        </div>

        <div className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
          <TrendIcon className="mr-1.5 h-3.5 w-3.5" />
          {metric.trendLabel}
        </div>
      </CardContent>
    </Card>
  );
}