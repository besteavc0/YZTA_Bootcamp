"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { DailyDigest } from "@/services/digest-service";
import { getDigestByDate, getLatestDigest } from "@/services/digest-service";

import { DigestCard } from "./DigestCard";
import { DigestHighlights } from "./DigestHighlights";
import { DigestMetricCard } from "./DigestMetricCard";

function getTodayDateValue() {
  return new Date().toISOString().slice(0, 10);
}

export function DigestPanel() {
  const { getToken } = useAuth();

  const [selectedDate, setSelectedDate] = useState(getTodayDateValue);
  const [digest, setDigest] = useState<DailyDigest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchDigest() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const token = await getToken();

        const response =
          selectedDate === getTodayDateValue()
            ? await getLatestDigest({ token })
            : await getDigestByDate({
                date: selectedDate,
                token,
              });

        if (isMounted) {
          setDigest(response);
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Günlük özet yüklenirken beklenmeyen bir hata oluştu.";

        if (isMounted) {
          setErrorMessage(message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void fetchDigest();

    return () => {
      isMounted = false;
    };
  }, [getToken, selectedDate, refreshKey]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-40 animate-pulse rounded-lg bg-muted" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="h-32 animate-pulse rounded-lg bg-muted" />
          <div className="h-32 animate-pulse rounded-lg bg-muted" />
          <div className="h-32 animate-pulse rounded-lg bg-muted" />
          <div className="h-32 animate-pulse rounded-lg bg-muted" />
          <div className="h-32 animate-pulse rounded-lg bg-muted" />
          <div className="h-32 animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="h-56 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4">
        <div>
          <h2 className="text-sm font-medium">Özet Tarihi</h2>
          <p className="text-xs text-muted-foreground">
            Geçmiş günlere ait yönetici özetlerini görüntüle.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="h-10 rounded-md border bg-background px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
          />

          <Button
            type="button"
            variant="outline"
            onClick={() => setRefreshKey((currentValue) => currentValue + 1)}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Yenile
          </Button>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      {digest ? (
        <>
          <DigestCard digest={digest} />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {digest.metrics.map((metric) => (
              <DigestMetricCard key={metric.id} metric={metric} />
            ))}
          </div>

          <DigestHighlights highlights={digest.highlights} />
        </>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Seçili tarih için oluşturulmuş günlük özet bulunmuyor.
        </div>
      )}
    </div>
  );
}