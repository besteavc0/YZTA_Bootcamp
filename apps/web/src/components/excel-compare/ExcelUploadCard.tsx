"use client";

import { FileSpreadsheet, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type ExcelUploadCardProps = {
  selectedFile: File | null;
  isLoading: boolean;
  onFileChange: (file: File | null) => void;
  onCompare: () => void;
};

export function ExcelUploadCard({
  selectedFile,
  isLoading,
  onFileChange,
  onCompare,
}: ExcelUploadCardProps) {
  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
            <UploadCloud className="h-6 w-6 text-muted-foreground" />
          </div>

          <div>
            <h2 className="text-lg font-semibold">Excel Dosyası Yükle</h2>
            <p className="text-sm text-muted-foreground">
              ERP kayıtlarıyla karşılaştırmak için .xlsx veya .csv dosyası seç.
            </p>
          </div>
        </div>

        <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center transition hover:bg-muted/40">
          <FileSpreadsheet className="mb-3 h-8 w-8 text-muted-foreground" />
          <span className="text-sm font-medium">
            Dosya seçmek için tıkla
          </span>
          <span className="mt-1 text-xs text-muted-foreground">
            Desteklenen formatlar: .xlsx, .csv
          </span>

          <input
            type="file"
            accept=".xlsx,.csv"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              onFileChange(file);
            }}
          />
        </label>

        {selectedFile ? (
          <div className="rounded-lg border bg-muted/40 p-3 text-sm">
            <p className="font-medium">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
        ) : null}

        <Button
          type="button"
          disabled={!selectedFile || isLoading}
          onClick={onCompare}
        >
          {isLoading ? "Karşılaştırılıyor..." : "Karşılaştır"}
        </Button>
      </CardContent>
    </Card>
  );
}