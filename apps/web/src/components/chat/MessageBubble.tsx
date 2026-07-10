import ReactMarkdown from "react-markdown";
import { Bot, User } from "lucide-react";
import type { ChatMessage } from "@/types";
import { SourceBadge } from "./SourceBadge";

type MessageBubbleProps = {
  message: ChatMessage;
};

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={["flex gap-3", isUser ? "justify-end" : "justify-start"].join(" ")}>
      {!isUser && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Bot className="h-4 w-4" />
        </div>
      )}

      <div
        className={[
          "max-w-3xl rounded-2xl px-4 py-3 text-sm shadow-sm",
          isUser
            ? "bg-primary text-primary-foreground"
            : "border bg-background text-foreground",
        ].join(" ")}
      >
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>

        {!isUser && <SourceBadge sources={message.sources} />}

        <p
          className={[
            "mt-2 text-xs",
            isUser ? "text-primary-foreground/70" : "text-muted-foreground",
          ].join(" ")}
        >
          {new Date(message.createdAt).toLocaleTimeString("tr-TR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>

      {isUser && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}