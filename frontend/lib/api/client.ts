import type { ErrorResponse } from "@/types";

export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "");
  }
  if (typeof window !== "undefined" && window.location.hostname) {
    return `http://${window.location.hostname}:8080`;
  }
  return "http://localhost:8080";
}

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "http://localhost:8080";

export class ApiClientError extends Error {
  readonly status: number;
  readonly data?: ErrorResponse;

  constructor(status: number, message: string, data?: ErrorResponse) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.data = data;
  }
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  const headers = new Headers(options.headers);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData: ErrorResponse | undefined;
    let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;

    try {
      errorData = (await response.json()) as ErrorResponse;
      if (errorData?.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // Body is not JSON (e.g. proxy HTML error or empty response)
    }

    throw new ApiClientError(response.status, errorMessage, errorData);
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}
