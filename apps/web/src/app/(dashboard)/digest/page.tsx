import { DigestPanel } from "@/components/digest/DigestPanel";

export default function DigestPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Günlük Özet</h1>
        <p className="text-muted-foreground">
          ERP verilerinden oluşturulan sabah yönetici özetini, metrikleri ve öne
          çıkan aksiyonları görüntüle.
        </p>
      </div>

      <DigestPanel />
    </section>
  );
}