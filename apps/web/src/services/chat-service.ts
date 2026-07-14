import { apiFetch } from "@/lib/api";
import type { ChatMessage, SourceInfo } from "@/types";

export type SendChatMessageResponse = {
  answer: string;
  sqlQuery?: string | null;
  sources?: SourceInfo[];
};

type ChatApiResponse = {
  answer: string;
  sql_query?: string | null;
  sources?: SourceInfo[];
  created_at?: string;
};

type ChatHistoryApiResponse = {
  items: ChatMessage[];
};

const useMockChat = process.env.NEXT_PUBLIC_USE_MOCK_CHAT !== "false";

const initialMockMessages: ChatMessage[] = [
  {
    id: "welcome-message",
    role: "assistant",
    content:
      "Merhaba, ben ERPilot AI Asistanı. Bana satış, stok, müşteri veya sipariş verileriyle ilgili Türkçe soru sorabilirsin.",
    createdAt: new Date().toISOString(),
    sources: [],
  },
];

export async function getChatHistory(
  token?: string | null
): Promise<ChatMessage[]> {
  if (useMockChat) {
    return getMockChatHistory();
  }

  const response = await apiFetch<ChatHistoryApiResponse>(
    "/api/v1/chat/history",
    {
      token,
      method: "GET",
    }
  );

  return response.items;
}

export async function sendChatMessage(
  question: string,
  token?: string | null
): Promise<SendChatMessageResponse> {
  if (useMockChat) {
    return sendMockChatMessage(question);
  }

  const response = await apiFetch<ChatApiResponse>("/api/v1/chat", {
    token,
    method: "POST",
    body: JSON.stringify({ question }),
  });

  return {
    answer: response.answer,
    sqlQuery: response.sql_query ?? null,
    sources: response.sources ?? [],
  };
}

async function getMockChatHistory(): Promise<ChatMessage[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));

  return initialMockMessages;
}

async function sendMockChatMessage(
  question: string
): Promise<SendChatMessageResponse> {
  await new Promise((resolve) => setTimeout(resolve, 800));

  return {
    answer: `Mock cevap: "${question}" sorusu backend hazır olduğunda /api/v1/chat endpoint'ine gönderilecek ve gerçek ERP verisiyle cevaplanacak.`,
    sqlQuery: null,
    sources: [
      {
        table: "canonical_orders",
        filters: "tenant_id=demo, son 30 gün",
      },
    ],
  };
}