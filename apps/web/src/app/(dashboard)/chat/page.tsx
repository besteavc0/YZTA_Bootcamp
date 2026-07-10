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

      <ChatWindow />
    </section>
  );
}