import { CheckCircle2, Database, PlugZap, XCircle } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { ErpConnection } from "@/services/erp-connection-service";

type ErpConnectionSummaryCardsProps = {
  connections: ErpConnection[];
};

export function ErpConnectionSummaryCards({
  connections,
}: ErpConnectionSummaryCardsProps) {
  const totalCount = connections.length;
  const connectedCount = connections.filter(
    (connection) => connection.status === "connected"
  ).length;
  const disconnectedCount = connections.filter(
    (connection) => connection.status === "disconnected"
  ).length;
  const errorCount = connections.filter(
    (connection) => connection.status === "error"
  ).length;

  const cards = [
    {
      title: "Toplam Bağlantı",
      value: totalCount,
      description: "Tanımlı ERP bağlantısı",
      icon: Database,
    },
    {
      title: "Bağlı",
      value: connectedCount,
      description: "Aktif bağlantı",
      icon: CheckCircle2,
    },
    {
      title: "Bağlı Değil",
      value: disconnectedCount,
      description: "Kurulum bekliyor",
      icon: PlugZap,
    },
    {
      title: "Hatalı",
      value: errorCount,
      description: "Kontrol edilmeli",
      icon: XCircle,
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