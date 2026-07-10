"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ChatMessage } from "@/types";
import { MessageBubble } from "./MessageBubble";

const mockMessages: ChatMessage[] = [
  {
    id: "1",
    role: "assistant",
    content:
      "Merhaba, ben ERPilot AI Asistanı. Bana satış, stok, müşteri veya sipariş verileriyle ilgili Türkçe soru sorabilirsin.",
    createdAt: new Date().toISOString(),
    sources: [],
  },
];

export function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages);
  const [question, setQuestion] = useState("");
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

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

    await new Promise((resolve) => setTimeout(resolve, 800));

    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content:
        "Mock cevap: Bu alan backend hazır olduğunda `/api/v1/chat` endpoint'inden gelen gerçek yanıtla doldurulacak.",
      createdAt: new Date().toISOString(),
      sources: [
        {
          table: "canonical_orders",
          filters: "tenant_id=demo, son 30 gün",
        },
      ],
    };

    setMessages((currentMessages) => [...currentMessages, assistantMessage]);
    setIsSending(false);
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
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {isSending && (
          <div className="flex justify-start">
            <div className="rounded-2xl border bg-background px-4 py-3 text-sm text-muted-foreground shadow-sm">
              Asistan yanıtlıyor...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3 border-t p-4">
        <Input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Örn: Bu ay toplam satış tutarı ne kadar?"
          disabled={isSending}
        />

        <Button type="submit" disabled={isSending || !question.trim()}>
          <SendHorizontal className="mr-2 h-4 w-4" />
          Gönder
        </Button>
      </form>
    </div>
  );
}