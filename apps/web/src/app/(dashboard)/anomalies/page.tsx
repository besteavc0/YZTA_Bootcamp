import { AnomaliesPanel } from "@/components/anomalies/AnomaliesPanel";

export default function AnomaliesPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Anomaliler</h1>
        <p className="mt-2 text-muted-foreground">
          ERP verilerindeki olağandışı işlemleri, kritik stok durumlarını ve
          riskli kayıtları takip et.
        </p>
      </div>

      <AnomaliesPanel />
    </section>
  );
}