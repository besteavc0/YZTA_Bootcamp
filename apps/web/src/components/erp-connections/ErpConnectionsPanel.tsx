"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";

import {
  getErpConnections,
  testErpConnection,
  type ErpConnection,
  type TestErpConnectionResponse,
} from "@/services/erp-connection-service";

import { ErpConnectionCard } from "./ErpConnectionCard";
import { ErpConnectionSummaryCards } from "./ErpConnectionSummaryCards";

export function ErpConnectionsPanel() {
  const { getToken } = useAuth();

  const [connections, setConnections] = useState<ErpConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [testingConnectionId, setTestingConnectionId] = useState<string | null>(
    null
  );
  const [testResult, setTestResult] =
    useState<TestErpConnectionResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
  }, [getToken]);

  async function handleTestConnection(connectionId: string) {
    setTestingConnectionId(connectionId);
    setTestResult(null);
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

      {testResult ? (
        <div className="rounded-lg border bg-muted/30 p-4 text-sm">
          <p className="font-medium">Bağlantı Test Sonucu</p>
          <p className="mt-1 text-muted-foreground">{testResult.message}</p>
        </div>
      ) : null}

      <ErpConnectionSummaryCards connections={connections} />

      {connections.length > 0 ? (
        <div className="grid gap-4">
          {connections.map((connection) => (
            <ErpConnectionCard
              key={connection.id}
              connection={connection}
              isTesting={testingConnectionId === connection.id}
              onTestConnection={handleTestConnection}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Henüz ERP bağlantısı tanımlanmadı.
        </div>
      )}
    </div>
  );
}