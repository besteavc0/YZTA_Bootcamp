"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";

import {
  compareExcelFile,
  type ExcelCompareResponse,
} from "@/services/excel-compare-service";

import { ExcelCompareResultsTable } from "./ExcelCompareResultsTable";
import { ExcelCompareSummaryCards } from "./ExcelCompareSummaryCards";
import { ExcelUploadCard } from "./ExcelUploadCard";

export function ExcelComparePanel() {
  const { getToken } = useAuth();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [compareResult, setCompareResult] =
    useState<ExcelCompareResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
        token,
      });

      setCompareResult(response);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Excel karşılaştırma sırasında beklenmeyen bir hata oluştu.";

      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <ExcelUploadCard
        selectedFile={selectedFile}
        isLoading={isLoading}
        onFileChange={(file) => {
          setSelectedFile(file);
          setCompareResult(null);
          setErrorMessage(null);
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

          <ExcelCompareResultsTable results={compareResult.results} />
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