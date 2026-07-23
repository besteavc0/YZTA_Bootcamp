import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  PlugZap,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const overviewStats = [
  {
    title: "Aktif Modül",
    value: "4",
    description: "Chat, Anomali, Excel ve ERP bağlantıları",
    icon: Activity,
  },
  {
    title: "Mock Veri Akışı",
    value: "Hazır",
    description: "Backend entegrasyonu için servis katmanı kuruldu",
    icon: CheckCircle2,
  },
  {
    title: "ERP Bağlantıları",
    value: "3",
    description: "SAP, Logo ve Mikro bağlantı ekranları hazır",
    icon: PlugZap,
  },
  {
    title: "Demo Durumu",
    value: "Uygun",
    description: "Frontend akışları demo için kullanılabilir",
    icon: ShieldCheck,
  },
];

const featureCards = [
  {
    title: "AI Chat",
    description:
      "Kullanıcıların ERP verileri hakkında doğal dilde soru sorabildiği chat ekranı.",
    href: "/chat",
    icon: Bot,
    actionLabel: "Chat ekranına git",
  },
  {
    title: "Anomali Paneli",
    description:
      "ERP kayıtlarında tespit edilen olağandışı durumları ve risk seviyelerini görüntüle.",
    href: "/anomalies",
    icon: AlertTriangle,
    actionLabel: "Anomalileri incele",
  },
  {
    title: "Excel Karşılaştırma",
    description:
      "Excel veya CSV dosyalarını ERP kayıtlarıyla karşılaştırarak farkları analiz et.",
    href: "/excel-compare",
    icon: FileSpreadsheet,
    actionLabel: "Karşılaştırma yap",
  },
  {
    title: "ERP Bağlantıları",
    description:
      "SAP, Logo ve Mikro gibi ERP sistemlerinin bağlantı durumlarını takip et.",
    href: "/erp-connections",
    icon: Database,
    actionLabel: "Bağlantıları yönet",
  },
];

const recentActivities = [
  {
    title: "Chat UI tamamlandı",
    description: "AI destekli soru-cevap arayüzü ve geçmiş paneli eklendi.",
  },
  {
    title: "Anomali UI tamamlandı",
    description: "Risk kartları, filtreler ve resolve akışı hazırlandı.",
  },
  {
    title: "Excel Compare UI tamamlandı",
    description: "Dosya yükleme, filtreleme ve CSV export akışı eklendi.",
  },
  {
    title: "ERP Connection UI tamamlandı",
    description: "Bağlantı kartları, test aksiyonu ve ayar formu eklendi.",
  },
];

export default function DashboardPage() {
  return (
    <section className="space-y-8">
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center rounded-full border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              ERPilot Frontend Overview
            </div>

            <h1 className="text-3xl font-bold tracking-tight">
              ERP verilerini yapay zekâ destekli analiz ekranlarıyla yönetin.
            </h1>

            <p className="mt-3 text-muted-foreground">
              Chat, anomali tespiti, Excel karşılaştırma ve ERP bağlantı
              modülleri tek dashboard üzerinden erişilebilir hale getirildi.
            </p>
          </div>

          <Link
            href="/chat"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            AI Chat&apos;i Aç
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {overviewStats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card key={stat.title}>
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="mt-2 text-2xl font-bold">{stat.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {stat.description}
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

      <div>
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Modüller</h2>
          <p className="text-sm text-muted-foreground">
            ERPilot içerisindeki ana frontend ekranlarına hızlı erişim.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {featureCards.map((feature) => {
            const Icon = feature.icon;

            return (
              <Card key={feature.title}>
                <CardContent className="space-y-5 p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                      <Icon className="h-6 w-6 text-muted-foreground" />
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold">
                        {feature.title}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={feature.href}
                    className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium transition hover:bg-muted"
                  >
                    {feature.actionLabel}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Son Frontend Geliştirmeleri</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div
                key={activity.title}
                className="flex gap-3 rounded-lg border bg-muted/30 p-4"
              >
                <div className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />

                <div>
                  <p className="text-sm font-medium">{activity.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {activity.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}