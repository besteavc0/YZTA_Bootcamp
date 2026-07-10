import { Badge } from "@/components/ui/badge";
import type { SourceInfo } from "@/types";

type SourceBadgeProps = {
  sources?: SourceInfo[];
};

export function SourceBadge({ sources }: SourceBadgeProps) {
  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {sources.map((source, index) => (
        <Badge key={`${source.table}-${index}`} variant="secondary">
          Kaynak: {source.table}
          {source.filters ? ` (${source.filters})` : ""}
        </Badge>
      ))}
    </div>
  );
}