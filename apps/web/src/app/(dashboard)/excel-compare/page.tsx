import { ExcelComparePanel } from "@/components/excel-compare/ExcelComparePanel";

export default function ExcelComparePage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Excel Karşılaştırma
        </h1>
        <p className="text-muted-foreground">
          Excel veya CSV dosyalarını ERP kayıtlarıyla karşılaştırarak eşleşen,
          farklı ve eksik kayıtları görüntüle.
        </p>
      </div>

      <ExcelComparePanel />
    </section>
  );
}