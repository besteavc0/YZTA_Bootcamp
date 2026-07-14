import { Button } from "@/components/ui/button";

const suggestedQuestions = [
  "Bu ay toplam satış tutarı ne kadar?",
  "Kritik stok seviyesinin altındaki ürünler hangileri?",
  "En yüksek tutarlı 3 sipariş hangileri?",
  "İstanbul'daki müşterilerden bu hafta kaç sipariş geldi?",
];

type SuggestedQuestionsProps = {
  onSelectQuestion: (question: string) => void;
  disabled?: boolean;
};

export function SuggestedQuestions({
  onSelectQuestion,
  disabled = false,
}: SuggestedQuestionsProps) {
  return (
    <div className="rounded-xl border bg-muted/30 p-4">
      <p className="mb-3 text-sm font-medium">Örnek sorular</p>

      <div className="flex flex-wrap gap-2">
        {suggestedQuestions.map((question) => (
          <Button
            key={question}
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => onSelectQuestion(question)}
          >
            {question}
          </Button>
        ))}
      </div>
    </div>
  );
}