import { AlertTriangle, CheckCircle2, ListChecks, ShieldAlert } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

type AnomalySummaryCardsProps = {
  totalCount: number;
  openCount: number;
  highRiskCount: number;
  resolvedCount: number;
};

export function AnomalySummaryCards({
  totalCount,
  openCount,
  highRiskCount,
  resolvedCount,
}: AnomalySummaryCardsProps) {
  const cards = [
    {
      title: "Toplam Anomali",
      value: totalCount,
      description: "Tespit edilen toplam kayıt",
      icon: ListChecks,
    },
    {
      title: "Çözülmemiş",
      value: openCount,
      description: "Aksiyon bekleyen kayıt",
      icon: AlertTriangle,
    },
    {
      title: "Yüksek Risk",
      value: highRiskCount,
      description: "Öncelikli incelenmeli",
      icon: ShieldAlert,
    },
    {
      title: "Çözülmüş",
      value: resolvedCount,
      description: "Tamamlanan kayıt",
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Card key={card.title}>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className="mt-2 text-3xl font-bold">{card.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {card.description}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted">
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}