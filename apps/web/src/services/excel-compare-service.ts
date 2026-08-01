export type ExcelCompareStatus = "matched" | "different" | "missing";

export type ExcelCompareStatusFilter = ExcelCompareStatus | "all";

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
  entityType: ExcelEntityType;
  token?: string | null;
};

type BackendExcelUploadResponse = {
  upload_id: string;
  filename: string;
  entity_type: string;
  row_count: number;
  detected_columns: string[];
  column_mapping: Record<string, string>;
};

type BackendCompareResponse = {
  upload_id: string;
  total_diffs: number;
  only_in_excel_count: number;
  only_in_erp_count: number;
  mismatch_count: number;
};

type BackendDiffResult = {
  id: string;
  diff_type: "only_in_excel" | "only_in_erp" | "mismatch" | string;
  external_id: string | null;
  excel_data: Record<string, unknown> | null;
  erp_data: Record<string, unknown> | null;
  created_at: string;
};

export type ExcelEntityType = "orders" | "customers" | "inventory";

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function normalizeApiUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, "");

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

const API_URL = normalizeApiUrl(RAW_API_URL);

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

async function readErrorMessage(response: Response) {
  try {
    const errorBody = await response.json();

    if (typeof errorBody.detail === "string") {
      return errorBody.detail;
    }

    return JSON.stringify(errorBody);
  } catch {
    return response.statusText;
  }
}

function stringifyValue(value: Record<string, unknown> | null) {
  if (!value) {
    return "-";
  }

  return JSON.stringify(value);
}

function mapDiffTypeToStatus(diffType: string): ExcelCompareStatus {
  if (diffType === "mismatch") {
    return "different";
  }

  return "missing";
}

function getDiffTypeLabel(diffType: string) {
  if (diffType === "mismatch") {
    return "Alan farkı";
  }

  if (diffType === "only_in_excel") {
    return "Sadece Excel";
  }

  if (diffType === "only_in_erp") {
    return "Sadece ERP";
  }

  return diffType;
}

function getDiffNote(diffType: string) {
  if (diffType === "mismatch") {
    return "Excel ve ERP verileri arasında alan farkı tespit edildi.";
  }

  if (diffType === "only_in_excel") {
    return "Bu kayıt Excel tarafında var, ERP tarafında bulunamadı.";
  }

  if (diffType === "only_in_erp") {
    return "Bu kayıt ERP tarafında var, Excel tarafında bulunamadı.";
  }

  return "Karşılaştırma sonucunda fark tespit edildi.";
}

function mapBackendDiffToResult(
  diff: BackendDiffResult,
  index: number
): ExcelCompareResult {
  return {
    id: diff.id,
    rowNumber: index + 2,
    sourceRef: diff.external_id ?? "-",
    fieldName: getDiffTypeLabel(diff.diff_type),
    excelValue: stringifyValue(diff.excel_data),
    erpValue: stringifyValue(diff.erp_data),
    status: mapDiffTypeToStatus(diff.diff_type),
    note: getDiffNote(diff.diff_type),
  };
}

async function uploadExcelFile(
  file: File,
  entityType: ExcelEntityType,
  token?: string | null
) {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("entity_type", entityType);

  const response = await fetch(`${API_URL}/api/v1/excel/upload`, {
    method: "POST",
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
    body: formData,
  });

  if (!response.ok) {
    const errorMessage = await readErrorMessage(response);
    throw new Error(`Excel upload başarısız oldu: ${errorMessage}`);
  }

  return response.json() as Promise<BackendExcelUploadResponse>;
}

async function compareUploadedExcel(uploadId: string, token?: string | null) {
  const response = await fetch(`${API_URL}/api/v1/excel/compare`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      upload_id: uploadId,
    }),
  });

  if (!response.ok) {
    const errorMessage = await readErrorMessage(response);
    throw new Error(`Excel compare başarısız oldu: ${errorMessage}`);
  }

  return response.json() as Promise<BackendCompareResponse>;
}

async function getExcelDiffs(uploadId: string, token?: string | null) {
  const response = await fetch(
    `${API_URL}/api/v1/excel/diffs/${uploadId}?limit=100&offset=0`,
    {
      method: "GET",
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : undefined,
    }
  );

  if (!response.ok) {
    const errorMessage = await readErrorMessage(response);
    throw new Error(`Excel diff sonuçları alınamadı: ${errorMessage}`);
  }

  return response.json() as Promise<BackendDiffResult[]>;
}

export async function compareExcelFile({
  file,
  entityType,
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

  const uploadResponse = await uploadExcelFile(file, entityType, token);

  const compareResponse = await compareUploadedExcel(
    uploadResponse.upload_id,
    token
  );

  const diffResponse = await getExcelDiffs(uploadResponse.upload_id, token);

  return {
    fileName: uploadResponse.filename,
    uploadedAt: new Date().toISOString(),
    summary: {
      totalRows: uploadResponse.row_count,
      matchedRows: Math.max(
        uploadResponse.row_count - compareResponse.total_diffs,
        0
      ),
      differentRows: compareResponse.mismatch_count,
      missingRows:
        compareResponse.only_in_excel_count +
        compareResponse.only_in_erp_count,
    },
    results: diffResponse.map(mapBackendDiffToResult),
  };
}