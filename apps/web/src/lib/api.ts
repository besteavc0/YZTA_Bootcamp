const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function normalizeApiUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, "");

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

const API_URL = normalizeApiUrl(RAW_API_URL);

type ApiFetchOptions = RequestInit & {
  token?: string | null;
};

export async function apiFetch<TResponse>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<TResponse> {
  const { token, headers, ...restOptions } = options;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  const response = await fetch(`${API_URL}${normalizedPath}`, {
    ...restOptions,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

 if (!response.ok) {
  const errorBody = await response.text();

  throw new Error(
    `API request failed: ${response.status} - ${errorBody}`
  );
}

  return response.json() as Promise<TResponse>;
}