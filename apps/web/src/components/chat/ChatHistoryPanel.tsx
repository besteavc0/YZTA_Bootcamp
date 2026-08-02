"use client";

import { useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ChevronDown, Database } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getChatHistoryPairs } from "@/services/chat-service";

const PAGE_SIZE = 5;

export function ChatHistoryPanel() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  const [expandedSqlId, setExpandedSqlId] = useState<string | null>(null);

  const role = user?.publicMetadata?.role ?? "user";
  const isAdmin = role === "admin";

  const historyQuery = useInfiniteQuery({
    queryKey: ["chat-history-pairs"],
    enabled: isLoaded && Boolean(isSignedIn),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const token = await getToken();

      return getChatHistoryPairs(pageParam, PAGE_SIZE, token);
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) {
        return undefined;
      }

      return allPages.length * PAGE_SIZE;
    },
  });

  const items = historyQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const isInitialLoading = historyQuery.isLoading;
  const isLoadingMore = historyQuery.isFetchingNextPage;

  return (
    <Card className="h-[calc(100vh-8rem)] overflow-hidden">
      <CardHeader className="border-b">
        <CardTitle className="text-base">Sohbet Geçmişi</CardTitle>
      </CardHeader>

      <CardContent className="h-full space-y-4 overflow-y-auto p-4">
        {historyQuery.isError ? (
          <p className="text-sm text-destructive">
            Sohbet geçmişi yüklenirken bir hata oluştu.
          </p>
        ) : null}

        {items.length === 0 && !isInitialLoading && !historyQuery.isError ? (
          <p className="text-sm text-muted-foreground">
            Henüz geçmiş sohbet bulunmuyor.
          </p>
        ) : null}

        {items.map((item) => {
          const isSqlExpanded = expandedSqlId === item.id;

          return (
            <div key={item.id} className="rounded-lg border p-3">
              <p className="text-sm font-medium">{item.question}</p>

              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                {item.answer}
              </p>

              <p className="mt-2 text-xs text-muted-foreground">
                {new Date(item.createdAt).toLocaleString("tr-TR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>

              {isAdmin && item.sqlQuery ? (
                <div className="mt-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="px-0"
                    onClick={() =>
                      setExpandedSqlId(isSqlExpanded ? null : item.id)
                    }
                  >
                    <Database className="mr-2 h-4 w-4" />
                    {isSqlExpanded ? "SQL’i gizle" : "SQL’i göster"}
                  </Button>

                  {isSqlExpanded ? (
                    <pre className="mt-2 overflow-x-auto rounded-md bg-muted p-3 text-xs">
                      <code>{item.sqlQuery}</code>
                    </pre>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}

        {isInitialLoading ? (
          <p className="text-sm text-muted-foreground">
            Sohbet geçmişi yükleniyor...
          </p>
        ) : null}

        {historyQuery.hasNextPage ? (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={isLoadingMore}
            onClick={() => {
              void historyQuery.fetchNextPage();
            }}
          >
            <ChevronDown className="mr-2 h-4 w-4" />
            {isLoadingMore ? "Yükleniyor..." : "Daha fazla yükle"}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}