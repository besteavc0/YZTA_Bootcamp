"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ChatMessage } from "@/types";
import { getMockChatHistory, sendMockChatMessage } from "@/services/chat-service";
import { MessageBubble } from "./MessageBubble";

export function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function loadHistory() {
      try {
        setIsLoadingHistory(true);
        setErrorMessage(null);

        const history = await getMockChatHistory();
        setMessages(history);
      } catch {
        setErrorMessage("Sohbet geçmişi yüklenirken bir hata oluştu.");
      } finally {
        setIsLoadingHistory(false);
      }
    }

    void loadHistory();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || isSending) {
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmedQuestion,
      createdAt: new Date().toISOString(),
    };

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setQuestion("");
    setIsSending(true);
    setErrorMessage(null);

    try {
      const response = await sendMockChatMessage(trimmedQuestion);

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response.answer,
        sqlQuery: response.sqlQuery,
        sources: response.sources,
        createdAt: new Date().toISOString(),
      };

      setMessages((currentMessages) => [...currentMessages, assistantMessage]);
    } catch {
      setErrorMessage("Bir hata oluştu, lütfen tekrar deneyin.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col rounded-xl border bg-background">
      <div className="border-b px-6 py-4">
        <h2 className="text-lg font-semibold">ERPilot AI Asistan</h2>
        <p className="text-sm text-muted-foreground">
          ERP verilerin hakkında Türkçe soru sor.
        </p>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto p-6">
        {isLoadingHistory ? (
          <div className="text-sm text-muted-foreground">
            Sohbet geçmişi yükleniyor...
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}

        {isSending && (
          <div className="flex justify-start">
            <div className="rounded-2xl border bg-background px-4 py-3 text-sm text-muted-foreground shadow-sm">
              Asistan yanıtlıyor...
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3 border-t p-4">
        <Input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Örn: Bu ay toplam satış tutarı ne kadar?"
          disabled={isSending || isLoadingHistory}
        />

        <Button
          type="submit"
          disabled={isSending || isLoadingHistory || !question.trim()}
        >
          <SendHorizontal className="mr-2 h-4 w-4" />
          Gönder
        </Button>
      </form>
    </div>
  );
}