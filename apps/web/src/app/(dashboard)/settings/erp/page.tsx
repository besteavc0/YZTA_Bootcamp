import { ErpConnectionsPanel } from "@/components/erp-connections/ErpConnectionsPanel";

export default function ERPSettingsPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ERP Ayarları</h1>
        <p className="text-muted-foreground">
          Admin kullanıcılar ERP bağlantılarını buradan görüntüleyebilir,
          bağlantı testlerini çalıştırabilir ve sync işlemlerini başlatabilir.
        </p>
      </div>

      <ErpConnectionsPanel />
    </section>
  );
}