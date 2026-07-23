"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bot,
  CalendarDays,
  ClipboardList,
  Database,
  FileSpreadsheet,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getLatestDigest,
  type DailyDigest,
} from "@/services/digest-service";

import { getAnomalies } from "@/services/anomaly-service";

type DashboardAnomaly = Awaited<
  ReturnType<typeof getAnomalies>
>["items"][number];

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "full",
  }).format(value);
}

const featureCards = [
  {
    title: "AI Chat",
    description:
      "ERP verileri hakkında doğal dilde soru sor ve kaynaklı yanıtlar al.",
    href: "/chat",
    icon: Bot,
    actionLabel: "Chat ekranına git",
  },
  {
    title: "Anomali Paneli",
    description:
      "Olağandışı ERP kayıtlarını severity ve çözüm durumuna göre takip et.",
    href: "/anomalies",
    icon: AlertTriangle,
    actionLabel: "Anomalileri incele",
  },
  {
    title: "Excel Karşılaştırma",
    description:
      "Excel veya CSV dosyalarını ERP kayıtlarıyla karşılaştır.",
    href: "/excel-compare",
    icon: FileSpreadsheet,
    actionLabel: "Karşılaştırma yap",
  },
  {
    title: "Günlük Özet",
    description:
      "ERP verilerinden oluşturulan sabah yönetici özetini görüntüle.",
    href: "/digest",
    icon: ClipboardList,
    actionLabel: "Özeti aç",
  },
];

const adminCards = [
  {
    title: "Audit Logları",
    description:
      "Kritik kullanıcı aksiyonlarını, erişim denemelerini ve sistem olaylarını incele.",
    href: "/admin/audit",
    icon: ShieldCheck,
    actionLabel: "Logları görüntüle",
  },
  {
    title: "Kullanıcı Yönetimi",
    description:
      "Kullanıcı rollerini ve aktif/pasif erişim durumlarını yönet.",
    href: "/settings/users",
    icon: Users,
    actionLabel: "Kullanıcıları yönet",
  },
  {
    title: "ERP Bağlantıları",
    description:
      "SAP, Logo ve Mikro gibi ERP bağlantılarının durumunu kontrol et.",
    href: "/erp-connections",
    icon: Database,
    actionLabel: "Bağlantıları aç",
  },
];

export function DashboardOverviewPanel() {
  const { getToken } = useAuth();
  const { user, isLoaded } = useUser();

  const [digest, setDigest] = useState<DailyDigest | null>(null);
 const [openAnomalies, setOpenAnomalies] = useState<DashboardAnomaly[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const role = user?.publicMetadata?.role ?? "user";
  const isAdmin = role === "admin";

  const displayName =
    user?.firstName ||
    user?.primaryEmailAddress?.emailAddress ||
    "ERPilot kullanıcısı";

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    let isMounted = true;

    async function fetchDashboardData() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const token = await getToken();

        const [digestResponse, anomaliesResponse] = await Promise.all([
          getLatestDigest({ token }),
          getAnomalies({
            severity: "all",
            status: "open",
            token,
          }),
        ]);

        if (isMounted) {
          setDigest(digestResponse);
          setOpenAnomalies(anomaliesResponse.items);
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Dashboard verileri yüklenirken beklenmeyen bir hata oluştu.";

        if (isMounted) {
          setErrorMessage(message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, [getToken, isLoaded]);

  if (!isLoaded || isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-48 animate-pulse rounded-2xl bg-muted" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="h-28 animate-pulse rounded-lg bg-muted" />
          <div className="h-28 animate-pulse rounded-lg bg-muted" />
          <div className="h-28 animate-pulse rounded-lg bg-muted" />
          <div className="h-28 animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="h-72 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  const highRiskAnomalyCount = openAnomalies.filter(
    (anomaly) => anomaly.severity === "high"
  ).length;

  const overviewStats = [
    {
      title: "Açık Anomali",
      value: String(openAnomalies.length),
      description: "Çözüm bekleyen toplam kayıt",
      icon: AlertTriangle,
    },
    {
      title: "Yüksek Risk",
      value: String(highRiskAnomalyCount),
      description: "Öncelikli incelenmesi gereken kayıt",
      icon: ShieldCheck,
    },
    {
      title: "Günlük Özet",
      value: digest ? "Hazır" : "Yok",
      description: digest
        ? "Bugünün digest kaydı oluşturuldu"
        : "Bugün için digest bulunamadı",
      icon: ClipboardList,
    },
    {
      title: "Aktif Modül",
      value: "7",
      description: "Chat, Anomali, Excel, Digest ve Admin UI",
      icon: Activity,
    },
  ];

  return (
    <section className="space-y-8">
      {errorMessage ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center rounded-full border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              ERPilot Dashboard
            </div>

            <h1 className="text-3xl font-bold tracking-tight">
              Hoş geldin, {displayName}
            </h1>

            <p className="mt-3 flex items-center text-sm text-muted-foreground">
              <CalendarDays className="mr-2 h-4 w-4" />
              {formatDate(new Date())}
            </p>

            <p className="mt-4 text-muted-foreground">
              ERPilot üzerinde chat, anomali, Excel karşılaştırma, günlük özet ve
              admin yönetim ekranlarına tek yerden erişebilirsin.
            </p>
          </div>

          <Link
            href="/digest"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            Günlük Özeti Aç
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>

      {digest ? (
        <Card>
          <CardHeader>
            <CardTitle>Bugünün Yönetici Özeti</CardTitle>
          </CardHeader>

          <CardContent>
            <p className="leading-7 text-muted-foreground">{digest.summary}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          Bugün için oluşturulmuş günlük özet bulunmuyor.
        </div>
      )}

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
          <h2 className="text-xl font-semibold">Ana Modüller</h2>
          <p className="text-sm text-muted-foreground">
            Sprint 2 ve Sprint 3 kapsamında tamamlanan temel frontend ekranları.
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

      {isAdmin ? (
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Admin Kısayolları</h2>
            <p className="text-sm text-muted-foreground">
              Sadece admin kullanıcılar için yönetim ekranları.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {adminCards.map((adminCard) => {
              const Icon = adminCard.icon;

              return (
                <Card key={adminCard.title}>
                  <CardContent className="space-y-5 p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                        <Icon className="h-6 w-6 text-muted-foreground" />
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold">
                          {adminCard.title}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {adminCard.description}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={adminCard.href}
                      className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium transition hover:bg-muted"
                    >
                      {adminCard.actionLabel}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : null}

      {openAnomalies.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Aksiyon Bekleyen Anomaliler</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {openAnomalies.slice(0, 3).map((anomaly) => (
              <div
                key={anomaly.id}
                className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-sm font-medium">{anomaly.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {anomaly.description}
                  </p>
                </div>

                <Link
                  href="/anomalies"
                  className="text-sm font-medium text-primary"
                >
                  İncele
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          Şu anda çözüm bekleyen açık anomali bulunmuyor.
        </div>
      )}
    </section>
  );
}