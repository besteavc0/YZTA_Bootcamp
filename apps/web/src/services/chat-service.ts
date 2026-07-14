import { apiFetch } from "@/lib/api";
import type { ChatHistoryPair, ChatMessage, SourceInfo } from "@/types";

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

const mockChatHistoryPairs: ChatHistoryPair[] = [
  {
    id: "history-1",
    question: "Bu ay toplam satış tutarı ne kadar?",
    answer:
      "Bu ay toplam satış tutarı demo verilerine göre 245.000 TL olarak hesaplandı.",
    sqlQuery:
      "SELECT SUM(total_amount) FROM canonical_orders WHERE tenant_id = :tenant_id AND order_date >= date_trunc('month', CURRENT_DATE) LIMIT 100;",
    sources: [
      {
        table: "canonical_orders",
        filters: "bu ay, tenant_id=demo",
      },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: "history-2",
    question: "Kritik stok seviyesinin altındaki ürünler hangileri?",
    answer:
      "Demo verilerine göre kritik stok seviyesinin altında 3 ürün bulunuyor.",
    sqlQuery:
      "SELECT product_name, quantity, reorder_level FROM canonical_inventory WHERE tenant_id = :tenant_id AND quantity < reorder_level LIMIT 100;",
    sources: [
      {
        table: "canonical_inventory",
        filters: "quantity < reorder_level",
      },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "history-3",
    question: "En yüksek tutarlı 3 sipariş hangileri?",
    answer:
      "En yüksek tutarlı 3 sipariş sırasıyla ORD-1042, ORD-1018 ve ORD-1091 olarak listelendi.",
    sqlQuery:
      "SELECT external_id, total_amount FROM canonical_orders WHERE tenant_id = :tenant_id ORDER BY total_amount DESC LIMIT 3;",
    sources: [
      {
        table: "canonical_orders",
        filters: "en yüksek 3 sipariş",
      },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
];

export async function getChatHistoryPairs(
  offset = 0,
  limit = 5,
  token?: string | null
): Promise<{
  items: ChatHistoryPair[];
  hasMore: boolean;
}> {
  if (useMockChat) {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const items = mockChatHistoryPairs.slice(offset, offset + limit);

    return {
      items,
      hasMore: offset + limit < mockChatHistoryPairs.length,
    };
  }

  return apiFetch<{
    items: ChatHistoryPair[];
    hasMore: boolean;
  }>(`/api/v1/chat/history?offset=${offset}&limit=${limit}`, {
    token,
    method: "GET",
  });
}