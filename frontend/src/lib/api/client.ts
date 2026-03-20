const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || "http://localhost:8000/api/v1";

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: HeadersInit;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = localStorage.getItem("access_token");
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    credentials: "include",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("access_token");
    }
    const message =
      typeof payload === "object" && payload && "detail" in payload
        ? String((payload as { detail: string }).detail)
        : `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" })
};

export { API_BASE_URL };
