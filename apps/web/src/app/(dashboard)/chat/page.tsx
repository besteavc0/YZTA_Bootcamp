import { ChatHistoryPanel } from "@/components/chat/ChatHistoryPanel";
import { ChatWindow } from "@/components/chat/ChatWindow";

export default function ChatPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Asistan</h1>
        <p className="mt-2 text-muted-foreground">
          ERP verilerine doğal dille soru sor ve kaynaklı yanıtlar al.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <ChatWindow />
        <ChatHistoryPanel />
      </div>
    </section>
  );
}