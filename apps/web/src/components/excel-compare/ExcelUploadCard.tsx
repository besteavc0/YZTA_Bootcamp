"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, Info, UploadCloud } from "lucide-react";

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

const ENTITY_TEMPLATES: Record<
  ExcelEntityType,
  {
    title: string;
    description: string;
    columns: string[];
    csv: string;
    fileName: string;
  }
> = {
  orders: {
    title: "Siparişler",
    description:
      "Sipariş dosyasını ERPilot'taki mevcut sipariş kayıtlarıyla karşılaştırır.",
    columns: [
      "external_id",
      "customer_external_id",
      "order_date",
      "total_amount",
      "status",
    ],
    fileName: "orders-template.csv",
    csv: `external_id,customer_external_id,order_date,total_amount,status
ORD-VIDEO-001,CUST-VIDEO-001,2026-08-03,42500,completed
ORD-VIDEO-999,CUST-VIDEO-003,2026-08-20,99999,completed`,
  },
  customers: {
    title: "Müşteriler",
    description:
      "Müşteri dosyasını ERPilot'taki mevcut müşteri kayıtlarıyla karşılaştırır.",
    columns: ["external_id", "name", "city", "segment"],
    fileName: "customers-template.csv",
    csv: `external_id,name,city,segment
CUST-VIDEO-001,Aktek Holding,Istanbul,Kurumsal
CUST-VIDEO-999,Yeni Demo Musteri,Ankara,KOBI`,
  },
  inventory: {
    title: "Stok",
    description:
      "Stok dosyasını ERPilot'taki mevcut stok kayıtlarıyla karşılaştırır.",
    columns: [
      "external_id",
      "product_name",
      "warehouse",
      "quantity",
      "reorder_level",
    ],
    fileName: "inventory-template.csv",
    csv: `external_id,product_name,warehouse,quantity,reorder_level
PRD-VIDEO-001,SAP Lisans Paketi,Istanbul Depo,42,10
PRD-VIDEO-999,Yeni Demo Urun,Istanbul Depo,50,10`,
  },
};

function downloadCsvTemplate(entityType: ExcelEntityType) {
  const template = ENTITY_TEMPLATES[entityType];

  const csvContent = `\ufeff${template.csv}`;

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = template.fileName;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

function isSupportedExcelFile(file: File) {
  const fileName = file.name.toLowerCase();

  return fileName.endsWith(".xlsx") || fileName.endsWith(".csv");
}

export function ExcelUploadCard({
  selectedFile,
  entityType,
  isLoading,
  onFileChange,
  onEntityTypeChange,
  onCompare,
}: ExcelUploadCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileWarning, setFileWarning] = useState<string | null>(null);

  const selectedTemplate = ENTITY_TEMPLATES[entityType];

  function handleSelectedFile(file: File | null) {
    setFileWarning(null);

    if (!file) {
      onFileChange(null);
      return;
    }

    if (!isSupportedExcelFile(file)) {
      setFileWarning("Sadece .csv veya .xlsx dosyası yükleyebilirsiniz.");
      onFileChange(null);
      return;
    }

    if (file.name.toLowerCase().endsWith(".csv")) {
      setFileWarning(
        "CSV dosyası kullanıyorsanız dosyayı CSV UTF-8 formatında kaydettiğinizden emin olun."
      );
    }

    onFileChange(file);
  }

  function handleDrop(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0] ?? null;
    handleSelectedFile(file);
  }

  return (
    <Card>
      <CardContent className="space-y-5 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
            <UploadCloud className="h-6 w-6 text-muted-foreground" />
          </div>

          <div>
            <h2 className="text-lg font-semibold">Excel Dosyası Yükle</h2>
            <p className="text-sm text-muted-foreground">
              ERP kayıtlarıyla karşılaştırmak için CSV UTF-8 veya XLSX dosyası
              seç ya da sürükle-bırak.
            </p>
          </div>
        </div>

        <label className="space-y-2 text-sm">
          <span className="font-medium">Karşılaştırılacak Veri Tipi</span>
          <select
            value={entityType}
            onChange={(event) => {
              setFileWarning(null);
              onEntityTypeChange(event.target.value as ExcelEntityType);
            }}
            className="w-full rounded-md border bg-background px-3 py-2"
          >
            <option value="orders">Siparişler</option>
            <option value="customers">Müşteriler</option>
            <option value="inventory">Stok</option>
          </select>
        </label>

        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-4 w-4 text-muted-foreground" />

            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold">
                  {selectedTemplate.title} dosya şablonu
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedTemplate.description}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Zorunlu kolonlar
                </p>

                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedTemplate.columns.map((column) => (
                    <span
                      key={column}
                      className="rounded-md border bg-background px-2 py-1 font-mono text-xs"
                    >
                      {column}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-md border bg-background p-3">
                <p className="text-xs text-muted-foreground">
                  Dosyanın ilk satırı kolon başlıklarını içermelidir. CSV
                  kullanıyorsanız dosyayı mutlaka{" "}
                  <span className="font-medium text-foreground">
                    CSV UTF-8
                  </span>{" "}
                  formatında kaydedin.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => downloadCsvTemplate(entityType)}
              >
                <Download className="mr-2 h-4 w-4" />
                Örnek CSV Şablonu İndir
              </Button>
            </div>
          </div>
        </div>

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
            Desteklenen formatlar: .csv, .xlsx
          </span>

          <input
            type="file"
            accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              handleSelectedFile(file);
            }}
          />
        </label>

        {fileWarning ? (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900">
            {fileWarning}
          </div>
        ) : null}

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