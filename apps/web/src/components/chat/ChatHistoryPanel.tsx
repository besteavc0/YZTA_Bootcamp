"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { ChevronDown, Database } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChatHistoryPair } from "@/types";
import { getChatHistoryPairs } from "@/services/chat-service";

const PAGE_SIZE = 5;

export function ChatHistoryPanel() {
  const { getToken } = useAuth();
  const { user } = useUser();

  const [items, setItems] = useState<ChatHistoryPair[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [expandedSqlId, setExpandedSqlId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const role = user?.publicMetadata?.role ?? "user";
  const isAdmin = role === "admin";

  async function loadHistory(nextOffset = 0) {
    try {
      setIsLoading(true);

      const token = await getToken();
      const response = await getChatHistoryPairs(nextOffset, PAGE_SIZE, token);

      setItems((currentItems) =>
        nextOffset === 0
          ? response.items
          : [...currentItems, ...response.items]
      );

      setOffset(nextOffset + PAGE_SIZE);
      setHasMore(response.hasMore);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadHistory(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className="h-[calc(100vh-8rem)] overflow-hidden">
      <CardHeader className="border-b">
        <CardTitle className="text-base">Sohbet Geçmişi</CardTitle>
      </CardHeader>

      <CardContent className="h-full space-y-4 overflow-y-auto p-4">
        {items.length === 0 && !isLoading && (
          <p className="text-sm text-muted-foreground">
            Henüz geçmiş sohbet bulunmuyor.
          </p>
        )}

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

              {isAdmin && item.sqlQuery && (
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

                  {isSqlExpanded && (
                    <pre className="mt-2 overflow-x-auto rounded-md bg-muted p-3 text-xs">
                      <code>{item.sqlQuery}</code>
                    </pre>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <p className="text-sm text-muted-foreground">
            Sohbet geçmişi yükleniyor...
          </p>
        )}

        {hasMore && (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={isLoading}
            onClick={() => {
              void loadHistory(offset);
            }}
          >
            <ChevronDown className="mr-2 h-4 w-4" />
            Daha fazla yükle
          </Button>
        )}
      </CardContent>
    </Card>
  );
}