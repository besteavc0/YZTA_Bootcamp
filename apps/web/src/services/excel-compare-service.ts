export type ExcelCompareStatus = "matched" | "different" | "missing";

export type ExcelCompareResult = {
  id: string;
  rowNumber: number;
  sourceRef: string;
  fieldName: string;
  excelValue: string;
  erpValue: string;
  status: ExcelCompareStatus;
  note: string;
};

export type ExcelCompareSummary = {
  totalRows: number;
  matchedRows: number;
  differentRows: number;
  missingRows: number;
};

export type ExcelCompareResponse = {
  fileName: string;
  uploadedAt: string;
  summary: ExcelCompareSummary;
  results: ExcelCompareResult[];
};

type CompareExcelParams = {
  file: File;
  token?: string | null;
};

const useMockExcelCompare =
  process.env.NEXT_PUBLIC_USE_MOCK_EXCEL_COMPARE !== "false";

const mockResults: ExcelCompareResult[] = [
  {
    id: "cmp-001",
    rowNumber: 2,
    sourceRef: "INV-2026-001",
    fieldName: "Tutar",
    excelValue: "15.250,00 TRY",
    erpValue: "15.250,00 TRY",
    status: "matched",
    note: "Excel ve ERP değerleri eşleşiyor.",
  },
  {
    id: "cmp-002",
    rowNumber: 3,
    sourceRef: "INV-2026-002",
    fieldName: "Vade Tarihi",
    excelValue: "2026-07-25",
    erpValue: "2026-07-28",
    status: "different",
    note: "Vade tarihinde 3 günlük fark bulundu.",
  },
  {
    id: "cmp-003",
    rowNumber: 4,
    sourceRef: "INV-2026-003",
    fieldName: "Cari Kod",
    excelValue: "CR-1045",
    erpValue: "CR-1045",
    status: "matched",
    note: "Cari kod doğrulandı.",
  },
  {
    id: "cmp-004",
    rowNumber: 5,
    sourceRef: "INV-2026-004",
    fieldName: "Belge No",
    excelValue: "INV-2026-004",
    erpValue: "-",
    status: "missing",
    note: "Bu kayıt ERP tarafında bulunamadı.",
  },
  {
    id: "cmp-005",
    rowNumber: 6,
    sourceRef: "INV-2026-005",
    fieldName: "Tutar",
    excelValue: "8.700,00 TRY",
    erpValue: "8.970,00 TRY",
    status: "different",
    note: "Tutar alanında fark tespit edildi.",
  },
];

function getMockSummary(results: ExcelCompareResult[]): ExcelCompareSummary {
  return {
    totalRows: results.length,
    matchedRows: results.filter((item) => item.status === "matched").length,
    differentRows: results.filter((item) => item.status === "different").length,
    missingRows: results.filter((item) => item.status === "missing").length,
  };
}

export async function compareExcelFile({
  file,
  token,
}: CompareExcelParams): Promise<ExcelCompareResponse> {
  if (useMockExcelCompare) {
    await new Promise((resolve) => setTimeout(resolve, 700));

    return {
      fileName: file.name,
      uploadedAt: new Date().toISOString(),
      summary: getMockSummary(mockResults),
      results: mockResults,
    };
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/excel-compare", {
    method: "POST",
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Excel karşılaştırma işlemi başarısız oldu.");
  }

  return response.json();
}