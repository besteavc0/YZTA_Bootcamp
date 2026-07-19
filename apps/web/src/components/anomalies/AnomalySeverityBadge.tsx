import { Badge } from "@/components/ui/badge";
import type { AnomalySeverity } from "@/types";

type AnomalySeverityBadgeProps = {
  severity: AnomalySeverity;
};

const severityLabelMap: Record<AnomalySeverity, string> = {
  high: "Yüksek",
  medium: "Orta",
  low: "Düşük",
};

const severityClassMap: Record<AnomalySeverity, string> = {
  high: "border-red-200 bg-red-50 text-red-700",
  medium: "border-yellow-200 bg-yellow-50 text-yellow-700",
  low: "border-green-200 bg-green-50 text-green-700",
};

export function AnomalySeverityBadge({
  severity,
}: AnomalySeverityBadgeProps) {
  return (
    <Badge variant="outline" className={severityClassMap[severity]}>
      {severityLabelMap[severity]}
    </Badge>
  );
}