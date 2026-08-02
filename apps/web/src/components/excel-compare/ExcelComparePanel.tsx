"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";

import { ExcelCompareFilters } from "./ExcelCompareFilters";
import { ExcelCompareResultsTable } from "./ExcelCompareResultsTable";
import { ExcelCompareSummaryCards } from "./ExcelCompareSummaryCards";
import { ExcelUploadCard } from "./ExcelUploadCard";

import {
  compareExcelFile,
  type ExcelCompareResponse,
  type ExcelCompareResult,
  type ExcelCompareStatusFilter,
  type ExcelEntityType,
} from "@/services/excel-compare-service";

function escapeCsvValue(value: string | number) {
  const stringValue = String(value);
  const escapedValue = stringValue.replace(/"/g, '""');

  return `"${escapedValue}"`;
}

function downloadCsv(results: ExcelCompareResult[], fileName: string) {
  const headers = [
    "Satır",
    "Referans",
    "Alan",
    "Excel Değeri",
    "ERP Değeri",
    "Durum",
    "Not",
  ];

  const rows = results.map((result) => [
    result.rowNumber,
    result.sourceRef,
    result.fieldName,
    result.excelValue,
    result.erpValue,
    result.status,
    result.note,
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map(escapeCsvValue).join(","))
    .join("\n");

  const blob = new Blob([`\uFEFF${csvContent}`], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

function getFriendlyExcelError(message: string) {
  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes("utf-8") ||
    normalizedMessage.includes("codec") ||
    normalizedMessage.includes("decode") ||
    normalizedMessage.includes("invalid continuation byte")
  ) {
    return "Dosya okunamadı. Lütfen CSV dosyasını CSV UTF-8 formatında kaydedip tekrar yükleyin. Excel kullanıyorsanız Farklı Kaydet > CSV UTF-8 seçeneğini kullanın.";
  }

  if (
    normalizedMessage.includes("eşleştirilemedi") ||
    normalizedMessage.includes("beklenen") ||
    normalizedMessage.includes("sütun") ||
    normalizedMessage.includes("kolon") ||
    normalizedMessage.includes("alanlar") ||
    normalizedMessage.includes("missing") ||
    normalizedMessage.includes("column") ||
    normalizedMessage.includes("required") ||
    normalizedMessage.includes("field")
  ) {
    return "Dosyadaki kolonlar seçili veri tipiyle uyumlu değil. Lütfen doğru veri tipini seçtiğinizden emin olun veya seçili veri tipi için örnek CSV şablonunu indirip aynı kolon yapısıyla tekrar deneyin.";
  }

  if (
    normalizedMessage.includes("unsupported") ||
    normalizedMessage.includes("format") ||
    normalizedMessage.includes("file type")
  ) {
    return "Dosya formatı desteklenmiyor. Lütfen .csv veya .xlsx formatında bir dosya yükleyin.";
  }

  if (
    normalizedMessage.includes("401") ||
    normalizedMessage.includes("unauthorized")
  ) {
    return "Oturum doğrulanamadı. Lütfen sayfayı yenileyip tekrar deneyin.";
  }

  if (
    normalizedMessage.includes("403") ||
    normalizedMessage.includes("forbidden")
  ) {
    return "Bu işlem için yetkiniz bulunmuyor. Lütfen kullanıcı rolünüzü kontrol edin.";
  }

  if (
    normalizedMessage.includes("failed to fetch") ||
    normalizedMessage.includes("network")
  ) {
    return "Sunucuya ulaşılamadı. Lütfen sayfayı yenileyip tekrar deneyin. Sorun devam ederse dosyanın CSV UTF-8 formatında olduğundan ve doğru şablonla yüklendiğinden emin olun.";
  }

  return (
    message ||
    "Excel karşılaştırma sırasında beklenmeyen bir hata oluştu. Lütfen dosya formatını ve seçili veri tipini kontrol edin."
  );
}
export function ExcelComparePanel() {
  const { getToken } = useAuth();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [entityType, setEntityType] = useState<ExcelEntityType>("orders");
  const [compareResult, setCompareResult] =
    useState<ExcelCompareResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<ExcelCompareStatusFilter>("all");
  const [onlyIssues, setOnlyIssues] = useState(false);

  async function handleCompare() {
    if (!selectedFile) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const token = await getToken();

      const response = await compareExcelFile({
        file: selectedFile,
        entityType,
        token,
      });

      setCompareResult(response);
        } catch (error) {
      console.error("Excel compare failed:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Excel karşılaştırma sırasında beklenmeyen bir hata oluştu.";

      setErrorMessage(getFriendlyExcelError(message));
    } finally {
      setIsLoading(false);
    }
  }

  const filteredResults = useMemo(() => {
    return (
      compareResult?.results.filter((result) => {
        const normalizedSearchQuery = searchQuery.trim().toLowerCase();

        const searchableText = [
          result.rowNumber,
          result.sourceRef,
          result.fieldName,
          result.excelValue,
          result.erpValue,
          result.status,
          result.note,
        ]
          .join(" ")
          .toLowerCase();

        const matchesSearch =
          normalizedSearchQuery.length === 0 ||
          searchableText.includes(normalizedSearchQuery);

        const matchesStatus =
          statusFilter === "all" || result.status === statusFilter;

        const matchesOnlyIssues =
          !onlyIssues ||
          result.status === "different" ||
          result.status === "missing";

        return matchesSearch && matchesStatus && matchesOnlyIssues;
      }) ?? []
    );
  }, [compareResult, searchQuery, statusFilter, onlyIssues]);

  function resetCompareState() {
    setCompareResult(null);
    setErrorMessage(null);
    setSearchQuery("");
    setStatusFilter("all");
    setOnlyIssues(false);
  }

  function handleExportCsv() {
    if (!compareResult || filteredResults.length === 0) {
      return;
    }

    const safeFileName = compareResult.fileName
      .replace(/\.[^/.]+$/, "")
      .replace(/\s+/g, "-")
      .toLowerCase();

    downloadCsv(filteredResults, `${safeFileName}-compare-results.csv`);
  }

  return (
    <div className="space-y-6">
      <ExcelUploadCard
        selectedFile={selectedFile}
        entityType={entityType}
        isLoading={isLoading}
        onFileChange={(file) => {
          setSelectedFile(file);
          resetCompareState();
        }}
          onEntityTypeChange={(nextEntityType) => {
          setEntityType(nextEntityType);
          setSelectedFile(null);
          resetCompareState();
        }}
        onCompare={handleCompare}
      />

      {errorMessage ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      {compareResult ? (
        <>
          <div className="rounded-lg border bg-muted/30 p-4 text-sm">
            <p>
              <span className="font-medium">Dosya:</span>{" "}
              {compareResult.fileName}
            </p>
            <p className="text-muted-foreground">
              Yüklenme zamanı:{" "}
              {new Intl.DateTimeFormat("tr-TR", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(compareResult.uploadedAt))}
            </p>
          </div>

          <ExcelCompareSummaryCards summary={compareResult.summary} />

          <ExcelCompareFilters
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            onlyIssues={onlyIssues}
            resultCount={filteredResults.length}
            totalCount={compareResult.results.length}
            onSearchChange={setSearchQuery}
            onStatusFilterChange={setStatusFilter}
            onOnlyIssuesChange={setOnlyIssues}
            onExportCsv={handleExportCsv}
          />

          <ExcelCompareResultsTable
            results={filteredResults}
            emptyMessage="Seçili filtrelere uygun karşılaştırma sonucu bulunamadı."
          />
        </>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Karşılaştırma sonucunu görmek için bir Excel veya CSV dosyası seçip
          “Karşılaştır” butonuna bas.
        </div>
      )}
    </div>
  );
}