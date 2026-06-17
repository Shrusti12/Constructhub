const DEFAULT_BASE = "http://localhost:8000";

export function getBaseUrl(): string {
  const v = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined;
  return (v && v.trim()) || DEFAULT_BASE;
}

type ApiErrorPayload = { detail?: string } | string | null;

async function parseError(res: Response): Promise<string> {
  let data: ApiErrorPayload = null;
  try {
    data = await res.json();
  } catch {
    // ignore
  }
  if (typeof data === "string") return data;
  if (data && typeof data === "object" && "detail" in data && typeof (data as any).detail === "string") {
    return (data as any).detail;
  }
  return `${res.status} ${res.statusText}`.trim();
}

async function request<T>(
  path: string,
  opts: { method: string; body?: unknown; token?: string | null } = { method: "GET" }
): Promise<T> {
  const base = getBaseUrl();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;

  const res = await fetch(`${base}${path}`, {
    method: opts.method,
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  if (!res.ok) throw new Error(await parseError(res));
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string, token?: string | null) => request<T>(path, { method: "GET", token }),
  post: <T>(path: string, body?: unknown, token?: string | null) => request<T>(path, { method: "POST", body, token }),
  put: <T>(path: string, body?: unknown, token?: string | null) => request<T>(path, { method: "PUT", body, token }),
  del: <T>(path: string, token?: string | null) => request<T>(path, { method: "DELETE", token })
};
