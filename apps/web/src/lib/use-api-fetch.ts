"use client";

import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/lib/api";

export function useApiFetch() {
  const { getToken } = useAuth();

  async function fetchWithAuth<TResponse>(
    path: string,
    options: RequestInit = {}
  ) {
    const token = await getToken();

    return apiFetch<TResponse>(path, {
      ...options,
      token,
    });
  }

  return { apiFetch: fetchWithAuth };
}