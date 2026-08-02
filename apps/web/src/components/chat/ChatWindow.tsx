"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { SendHorizontal, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ChatMessage } from "@/types";
import {
  clearChatHistory,
  getChatHistory,
  sendChatMessage,
} from "@/services/chat-service";

import { MessageBubble } from "./MessageBubble";
import { SuggestedQuestions } from "./SuggestedQuestions";
import { TypingIndicator } from "./TypingIndicator";

function createMessageId(prefix: string) {
  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function ChatWindow() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isClearingHistory, setIsClearingHistory] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadHistory() {
      if (!isLoaded) {
        return;
      }

      if (!isSignedIn) {
        setIsLoadingHistory(false);
        return;
      }

      try {
        setIsLoadingHistory(true);
        setErrorMessage(null);

        const token = await getToken();

        if (!token) {
          throw new Error("Token alınamadı.");
        }

        const history = await getChatHistory(token);

        if (isMounted) {
          setMessages(history);
        }
      } catch {
        if (isMounted) {
          setErrorMessage("Sohbet geçmişi yüklenirken bir hata oluştu.");
        }
      } finally {
        if (isMounted) {
          setIsLoadingHistory(false);
        }
      }
    }

    void loadHistory();

    return () => {
      isMounted = false;
    };
  }, [getToken, isLoaded, isSignedIn]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  async function handleClearChatHistory() {
    if (messages.length === 0) {
      return;
    }

    const shouldClear = window.confirm(
      "Sohbet geçmişinizi temizlemek istediğinizden emin misiniz?"
    );

    if (!shouldClear) {
      return;
    }

    setIsClearingHistory(true);
    setErrorMessage(null);

    try {
      const token = await getToken();

      if (!token) {
        throw new Error("Token alınamadı.");
      }

      await clearChatHistory(token);

      setMessages([]);
      setQuestion("");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Sohbet geçmişi temizlenirken bir hata oluştu."
      );
    } finally {
      setIsClearingHistory(false);
    }
  }

  async function sendQuestion(questionText: string) {
    if (!isLoaded || !isSignedIn) {
      setErrorMessage("Mesaj göndermek için giriş yapmalısın.");
      return;
    }

    const trimmedQuestion = questionText.trim();

    if (!trimmedQuestion || isSending || isLoadingHistory) {
      return;
    }

    const token = await getToken();

    if (!token) {
      setErrorMessage("Oturum bilgisi alınamadı. Lütfen tekrar giriş yap.");
      return;
    }

    const userMessage: ChatMessage = {
      id: createMessageId("user"),
      role: "user",
      content: trimmedQuestion,
      createdAt: new Date().toISOString(),
    };

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setQuestion("");
    setIsSending(true);
    setErrorMessage(null);

    try {
      const response = await sendChatMessage(trimmedQuestion, token);

      const assistantMessage: ChatMessage = {
        id: createMessageId("assistant"),
        role: "assistant",
        content: response.answer,
        sqlQuery: response.sqlQuery,
        sources: response.sources,
        createdAt: new Date().toISOString(),
      };

      setMessages((currentMessages) => [
        ...currentMessages,
        assistantMessage,
      ]);
    } catch {
      setErrorMessage("Bir hata oluştu, lütfen tekrar deneyin.");
    } finally {
      setIsSending(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendQuestion(question);
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col rounded-xl border bg-background">
      <div className="flex items-start justify-between gap-4 border-b px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold">ERPilot AI Asistan</h2>
          <p className="text-sm text-muted-foreground">
            ERP verilerin hakkında Türkçe soru sor.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={
            isLoadingHistory ||
            isSending ||
            isClearingHistory ||
            messages.length === 0
          }
          onClick={handleClearChatHistory}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {isClearingHistory ? "Temizleniyor..." : "Sohbeti Temizle"}
        </Button>
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

        {!isLoadingHistory && messages.length === 0 && (
          <SuggestedQuestions
            disabled={isSending}
            onSelectQuestion={(selectedQuestion) => {
              void sendQuestion(selectedQuestion);
            }}
          />
        )}

        {isSending && <TypingIndicator />}

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
          disabled={isSending || isLoadingHistory || isClearingHistory}
        />

        <Button
          type="submit"
          disabled={
            isSending ||
            isLoadingHistory ||
            isClearingHistory ||
            !question.trim()
          }
        >
          <SendHorizontal className="mr-2 h-4 w-4" />
          Gönder
        </Button>
      </form>
    </div>
  );
}