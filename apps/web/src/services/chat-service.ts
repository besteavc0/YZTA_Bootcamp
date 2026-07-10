import type { ChatMessage, SourceInfo } from "@/types";

export type SendChatMessageResponse = {
  answer: string;
  sqlQuery?: string | null;
  sources?: SourceInfo[];
};

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

export async function getMockChatHistory(): Promise<ChatMessage[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));

  return initialMockMessages;
}

export async function sendMockChatMessage(
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