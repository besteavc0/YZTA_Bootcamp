"use client";

import { useState } from "react";
import { FileSpreadsheet, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ExcelEntityType } from "@/services/excel-compare-service";

type ExcelUploadCardProps = {
  selectedFile: File | null;
  entityType: ExcelEntityType;
  isLoading: boolean;
  onFileChange: (file: File | null) => void;
  onEntityTypeChange: (entityType: ExcelEntityType) => void;
  onCompare: () => void;
};

export function ExcelUploadCard({
  selectedFile,
  entityType,
  isLoading,
  onFileChange,
  onEntityTypeChange,
  onCompare,
}: ExcelUploadCardProps) {
  const [isDragging, setIsDragging] = useState(false);

  function handleDrop(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0] ?? null;

    if (!file) {
      return;
    }

    const isSupportedFile =
      file.name.toLowerCase().endsWith(".xlsx") ||
      file.name.toLowerCase().endsWith(".csv");

    if (isSupportedFile) {
      onFileChange(file);
    }
  }

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
              ERP kayıtlarıyla karşılaştırmak için .xlsx veya .csv dosyası seç
              ya da sürükle-bırak.
            </p>
          </div>
        </div>

        <label className="space-y-2 text-sm">
          <span className="font-medium">Karşılaştırılacak Veri Tipi</span>
          <select
            value={entityType}
            onChange={(event) =>
              onEntityTypeChange(event.target.value as ExcelEntityType)
            }
            className="w-full rounded-md border bg-background px-3 py-2"
          >
            <option value="orders">Siparişler</option>
            <option value="customers">Müşteriler</option>
            <option value="inventory">Stok</option>
          </select>
        </label>

        <label
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center transition ${
            isDragging ? "bg-muted" : "hover:bg-muted/40"
          }`}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <FileSpreadsheet className="mb-3 h-8 w-8 text-muted-foreground" />
          <span className="text-sm font-medium">
            Dosya seçmek için tıkla veya buraya sürükle
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