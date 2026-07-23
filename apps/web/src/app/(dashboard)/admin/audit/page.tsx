import { AuditLogPanel } from "@/components/admin/AuditLogPanel";

export default function AuditLogPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit Logları</h1>
        <p className="text-muted-foreground">
          Sistemdeki kritik işlemleri, kullanıcı aksiyonlarını ve güvenlik
          olaylarını takip et.
        </p>
      </div>

      <AuditLogPanel />
    </section>
  );
}