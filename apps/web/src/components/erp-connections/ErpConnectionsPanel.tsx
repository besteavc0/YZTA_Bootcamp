"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { ErpSyncHistoryPanel } from "./ErpSyncHistoryPanel";

import {
  getErpConnections,
  getErpSyncRuns,
  syncErpConnection,
  testErpConnection,
  updateErpConnection,
  type ErpConnection,
  type ErpConnectionStatusFilter,
  type ErpProviderFilter,
  type ErpSyncRun,
  type TestErpConnectionResponse,
  type UpdateErpConnectionPayload,
} from "@/services/erp-connection-service";

import { ErpConnectionCard } from "./ErpConnectionCard";
import { ErpConnectionSummaryCards } from "./ErpConnectionSummaryCards";
import { ErpConnectionFilters } from "./ErpConnectionFilters";
import { ErpConnectionSettingsForm } from "./ErpConnectionSettingsForm";

export function ErpConnectionsPanel() {
  const { getToken } = useAuth();

  const [connections, setConnections] = useState<ErpConnection[]>([]);
const [isLoading, setIsLoading] = useState(true);

const [testingConnectionId, setTestingConnectionId] = useState<string | null>(
  null
);
const [syncingConnectionId, setSyncingConnectionId] = useState<string | null>(
  null
);

const [testResult, setTestResult] =
  useState<TestErpConnectionResponse | null>(null);
const [successMessage, setSuccessMessage] = useState<string | null>(null);
const [errorMessage, setErrorMessage] = useState<string | null>(null);

const [searchQuery, setSearchQuery] = useState("");
const [providerFilter, setProviderFilter] =
  useState<ErpProviderFilter>("all");
const [statusFilter, setStatusFilter] =
  useState<ErpConnectionStatusFilter>("all");
const [refreshKey, setRefreshKey] = useState(0);

const [editingConnectionId, setEditingConnectionId] = useState<string | null>(
  null
);
const [isSaving, setIsSaving] = useState(false);

const [selectedSyncConnectionId, setSelectedSyncConnectionId] = useState("");
const [syncRuns, setSyncRuns] = useState<ErpSyncRun[]>([]);
const [isLoadingSyncRuns, setIsLoadingSyncRuns] = useState(false);
const [syncHistoryErrorMessage, setSyncHistoryErrorMessage] = useState<
  string | null
>(null);

useEffect(() => {
  let isMounted = true;

  async function fetchConnections() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const token = await getToken();

      const response = await getErpConnections({
        token,
      });

      if (isMounted) {
        setConnections(response);
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "ERP bağlantıları yüklenirken beklenmeyen bir hata oluştu.";

      if (isMounted) {
        setErrorMessage(message);
      }
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  }

  void fetchConnections();

  return () => {
    isMounted = false;
  };
}, [getToken, refreshKey]);
async function handleLoadSyncRuns(connectionId = activeSyncConnectionId) {
  if (!connectionId) {
    return;
  }

  setIsLoadingSyncRuns(true);
  setSyncHistoryErrorMessage(null);

  try {
    const token = await getToken();

    const response = await getErpSyncRuns({
      connectionId,
      token,
    });

    setSyncRuns(response);
  } catch (error) {
    setSyncHistoryErrorMessage(
      error instanceof Error
        ? error.message
        : "Sync geçmişi yüklenirken bir hata oluştu."
    );
  } finally {
    setIsLoadingSyncRuns(false);
  }
}

  async function handleTestConnection(connectionId: string) {
    setTestingConnectionId(connectionId);
    setTestResult(null);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const token = await getToken();

      const response = await testErpConnection({
        connectionId,
        token,
      });

      setTestResult(response);

      setConnections((currentConnections) =>
        currentConnections.map((connection) =>
          connection.id === connectionId
            ? {
                ...connection,
                status: response.status,
                lastSyncAt:
                  response.status === "connected"
                    ? response.testedAt
                    : connection.lastSyncAt,
              }
            : connection
        )
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "ERP bağlantı testi sırasında beklenmeyen bir hata oluştu.";

      setErrorMessage(message);
    } finally {
      setTestingConnectionId(null);
    }
  }

async function handleSyncConnection(connectionId: string) {
  try {
    setSyncingConnectionId(connectionId);
    setErrorMessage(null);
    setSuccessMessage(null);

    const token = await getToken();

    const response = await syncErpConnection({
      connectionId,
      token,
    });

    setSuccessMessage(`${response.message} Task ID: ${response.taskId}`);

    setRefreshKey((currentValue) => currentValue + 1);
    await handleLoadSyncRuns(connectionId);
  } catch (error) {
    setErrorMessage(
      error instanceof Error
        ? error.message
        : "ERP sync işlemi başlatılırken bir hata oluştu."
    );
  } finally {
    setSyncingConnectionId(null);
  }
}

  async function handleSaveConnection(payload: UpdateErpConnectionPayload) {
    if (!editingConnectionId) {
      return;
    }

    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const token = await getToken();

      const response = await updateErpConnection({
        connectionId: editingConnectionId,
        payload,
        token,
      });

      setConnections((currentConnections) =>
        currentConnections.map((connection) =>
          connection.id === response.id ? response : connection
        )
      );

      setEditingConnectionId(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "ERP bağlantısı kaydedilirken beklenmeyen bir hata oluştu.";

      setErrorMessage(message);
    } finally {
      setIsSaving(false);
    }
  }

  const filteredConnections = connections.filter((connection) => {
    const normalizedSearchQuery = searchQuery.trim().toLowerCase();

    const searchableText = [
      connection.name,
      connection.description,
      connection.provider,
      connection.status,
      connection.host,
      connection.companyCode,
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch =
      normalizedSearchQuery.length === 0 ||
      searchableText.includes(normalizedSearchQuery);

    const matchesProvider =
      providerFilter === "all" || connection.provider === providerFilter;

    const matchesStatus =
      statusFilter === "all" || connection.status === statusFilter;

    return matchesSearch && matchesProvider && matchesStatus;
  });

  const editingConnection =
    connections.find((connection) => connection.id === editingConnectionId) ??
    null;

    const activeSyncConnectionId =
  selectedSyncConnectionId || connections[0]?.id || "";

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-28 animate-pulse rounded-lg bg-muted" />
        <div className="h-40 animate-pulse rounded-lg bg-muted" />
        <div className="h-40 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {errorMessage ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {successMessage}
        </div>
      ) : null}

      {testResult ? (
        <div className="rounded-lg border bg-muted/30 p-4 text-sm">
          <p className="font-medium">Bağlantı Test Sonucu</p>
          <p className="mt-1 text-muted-foreground">{testResult.message}</p>
        </div>
      ) : null}

      <ErpConnectionSummaryCards connections={connections} />

      <ErpConnectionFilters
        searchQuery={searchQuery}
        providerFilter={providerFilter}
        statusFilter={statusFilter}
        resultCount={filteredConnections.length}
        totalCount={connections.length}
        isRefreshing={isLoading}
        onSearchChange={setSearchQuery}
        onProviderFilterChange={setProviderFilter}
        onStatusFilterChange={setStatusFilter}
        onRefresh={() => setRefreshKey((currentValue) => currentValue + 1)}
      />

      {editingConnection ? (
        <ErpConnectionSettingsForm
          key={editingConnection.id}
          connection={editingConnection}
          isSaving={isSaving}
          onCancel={() => setEditingConnectionId(null)}
          onSave={handleSaveConnection}
        />
      ) : null}

      {filteredConnections.length > 0 ? (
        <div className="grid gap-4">
          {filteredConnections.map((connection) => (
            <ErpConnectionCard
  key={connection.id}
  connection={connection}
  isTesting={testingConnectionId === connection.id}
  isSyncing={syncingConnectionId === connection.id}
  onTestConnection={handleTestConnection}
  onSyncConnection={handleSyncConnection}
  onEditConnection={setEditingConnectionId}
/>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Seçili filtrelere uygun ERP bağlantısı bulunamadı.
        </div>
      )}
      {connections.length > 0 ? (
  <ErpSyncHistoryPanel
    connections={connections}
    selectedConnectionId={activeSyncConnectionId}
    syncRuns={syncRuns}
    isLoading={isLoadingSyncRuns}
    errorMessage={syncHistoryErrorMessage}
    onConnectionChange={(connectionId) => {
      setSelectedSyncConnectionId(connectionId);
      void handleLoadSyncRuns(connectionId);
    }}
    onRefresh={() => void handleLoadSyncRuns(activeSyncConnectionId)}
  />
) : null}
    </div>
  );
}