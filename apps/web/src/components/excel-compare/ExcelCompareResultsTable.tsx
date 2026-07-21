import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ExcelCompareResult } from "@/services/excel-compare-service";

import { ExcelCompareStatusBadge } from "./ExcelCompareStatusBadge";

type ExcelCompareResultsTableProps = {
  results: ExcelCompareResult[];
  emptyMessage?: string;
};

export function ExcelCompareResultsTable({
  results,
  emptyMessage = "Henüz karşılaştırma sonucu bulunmuyor.",
}: ExcelCompareResultsTableProps) {
  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          {emptyMessage}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Karşılaştırma Sonuçları</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-3 pr-4 font-medium">Satır</th>
                <th className="py-3 pr-4 font-medium">Referans</th>
                <th className="py-3 pr-4 font-medium">Alan</th>
                <th className="py-3 pr-4 font-medium">Excel</th>
                <th className="py-3 pr-4 font-medium">ERP</th>
                <th className="py-3 pr-4 font-medium">Durum</th>
                <th className="py-3 pr-4 font-medium">Not</th>
              </tr>
            </thead>

            <tbody>
              {results.map((result) => (
                <tr key={result.id} className="border-b last:border-0">
                  <td className="py-3 pr-4">{result.rowNumber}</td>
                  <td className="py-3 pr-4 font-medium">{result.sourceRef}</td>
                  <td className="py-3 pr-4">{result.fieldName}</td>
                  <td className="py-3 pr-4">{result.excelValue}</td>
                  <td className="py-3 pr-4">{result.erpValue}</td>
                  <td className="py-3 pr-4">
                    <ExcelCompareStatusBadge status={result.status} />
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">
                    {result.note}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}