import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DigestHighlight } from "@/services/digest-service";

type DigestHighlightsProps = {
  highlights: DigestHighlight[];
};

const severityIconMap = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle2,
};

export function DigestHighlights({ highlights }: DigestHighlightsProps) {
  if (highlights.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Öne Çıkanlar</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {highlights.map((highlight) => {
          const Icon = severityIconMap[highlight.severity];

          return (
            <div
              key={highlight.id}
              className="flex gap-3 rounded-lg border bg-muted/30 p-4"
            >
              <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>

              <div>
                <p className="text-sm font-medium">{highlight.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {highlight.description}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}