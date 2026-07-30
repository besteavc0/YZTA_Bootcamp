import { ErpConnectionsPanel } from "@/components/erp-connections/ErpConnectionsPanel";

export default function ErpConnectionsPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          ERP Bağlantıları
        </h1>
        <p className="text-muted-foreground">
          SAP, Logo ve Mikro gibi ERP sistemlerinin bağlantı durumlarını görüntüle
          ve bağlantı testlerini çalıştır.
        </p>
      </div>

      <ErpConnectionsPanel />
    </section>
  );
}