export type UserRole = "admin" | "user" | "viewer";

export type SourceInfo = {
  table: string;
  filters: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sqlQuery?: string | null;
  sources?: SourceInfo[];
  createdAt: string;
};

export type AnomalySeverity = "low" | "medium" | "high";

export type AnomalyFinding = {
  id: string;
  title: string;
  description?: string | null;
  severity: AnomalySeverity;
  isResolved: boolean;
  detectedAt: string;
  metadata?: Record<string, unknown>;
};

export type DigestData = {
  id: string;
  digestDate: string;
  summaryText: string;
  metrics: Record<string, unknown>;
};

export type ERPConnection = {
  id: string;
  name: string;
  connectorType: "csv" | "logo" | "sap_b1" | "oracle";
  isActive: boolean;
  lastSyncAt?: string | null;
  lastSyncStatus?: string | null;
};

export type AuditLog = {
  id: string;
  userEmail?: string | null;
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  status: "success" | "denied" | "error";
  ipAddress?: string | null;
  createdAt: string;
  details?: Record<string, unknown>;
};

export type ChatHistoryPair = {
  id: string;
  question: string;
  answer: string;
  sqlQuery?: string | null;
  sources?: SourceInfo[];
  createdAt: string;
};