import { CalendarDays, Sparkles } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailyDigest } from "@/services/digest-service";

type DigestCardProps = {
  digest: DailyDigest;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "full",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function DigestCard({ digest }: DigestCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Günlük Yönetici Özeti
            </CardTitle>

            <p className="mt-2 flex items-center text-sm text-muted-foreground">
              <CalendarDays className="mr-2 h-4 w-4" />
              {formatDate(digest.date)}
            </p>
          </div>

          <div className="rounded-full border bg-muted px-3 py-1 text-xs text-muted-foreground">
            Oluşturulma: {formatDateTime(digest.generatedAt)}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <p className="leading-7 text-muted-foreground">{digest.summary}</p>
      </CardContent>
    </Card>
  );
}