import { AlertTriangle, CheckCircle2, FileSpreadsheet, XCircle } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { ExcelCompareSummary } from "@/services/excel-compare-service";

type ExcelCompareSummaryCardsProps = {
  summary: ExcelCompareSummary;
};

export function ExcelCompareSummaryCards({
  summary,
}: ExcelCompareSummaryCardsProps) {
  const cards = [
    {
      title: "Toplam Satır",
      value: summary.totalRows,
      description: "Karşılaştırılan kayıt",
      icon: FileSpreadsheet,
    },
    {
      title: "Eşleşen",
      value: summary.matchedRows,
      description: "Excel ve ERP aynı",
      icon: CheckCircle2,
    },
    {
      title: "Farklı",
      value: summary.differentRows,
      description: "Değer farkı bulundu",
      icon: AlertTriangle,
    },
    {
      title: "ERP'de Yok",
      value: summary.missingRows,
      description: "ERP kaydı bulunamadı",
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