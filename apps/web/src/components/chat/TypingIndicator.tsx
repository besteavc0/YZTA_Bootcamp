export function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-2 rounded-2xl border bg-background px-4 py-3 text-sm text-muted-foreground shadow-sm">
        <span>Asistan yanıtlıyor</span>
        <span className="flex gap-1">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
        </span>
      </div>
    </div>
  );
}