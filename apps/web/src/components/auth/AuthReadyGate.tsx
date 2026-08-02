"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function normalizeApiUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, "");

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

const API_URL = normalizeApiUrl(RAW_API_URL);

type AuthReadyGateProps = {
  children: ReactNode;
};

export function AuthReadyGate({ children }: AuthReadyGateProps) {
  const router = useRouter();
  const { isLoaded, isSignedIn, getToken } = useAuth();

  const [isApiReady, setIsApiReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function syncUserWithApi() {
      if (!isLoaded) {
        return;
      }

      if (!isSignedIn) {
        setIsApiReady(false);
        router.replace("/login");
        return;
      }

      setIsApiReady(false);
      setErrorMessage(null);

      try {
        const token = await getToken();

        if (!token) {
          throw new Error("Clerk token alınamadı.");
        }

        const response = await fetch(`${API_URL}/api/v1/auth/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || "API kullanıcı senkronizasyonu başarısız oldu.");
        }

        if (isMounted) {
          setIsApiReady(true);
        }
      } catch (error) {
        console.error("Auth/API sync failed:", error);

        if (isMounted) {
          setErrorMessage(
            "Oturum hazırlanamadı. Lütfen sayfayı yenileyip tekrar deneyin."
          );
        }
      }
    }

    void syncUserWithApi();

    return () => {
      isMounted = false;
    };
  }, [getToken, isLoaded, isSignedIn, router]);

  if (!isLoaded || !isSignedIn || !isApiReady) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-lg border bg-background p-6 text-center shadow-sm">
          <p className="text-sm font-medium">Oturum hazırlanıyor...</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Kullanıcı bilgileri API ile eşleştiriliyor.
          </p>

          {errorMessage ? (
            <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {errorMessage}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}