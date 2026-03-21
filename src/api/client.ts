const API_BASE = import.meta.env.VITE_API_BASE || "https://api.run402.com";
const ANON_KEY = import.meta.env.VITE_ANON_KEY || "";

function getStoredToken(): string | null {
  try {
    const session = localStorage.getItem("skmeld_session");
    if (!session) return null;
    return JSON.parse(session).access_token || null;
  } catch {
    return null;
  }
}

export async function apiGet<T = unknown>(path: string, options?: { auth?: boolean }): Promise<T> {
  const headers: Record<string, string> = { apikey: ANON_KEY };
  const token = getStoredToken();
  if (token && options?.auth !== false) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `API error ${res.status}`);
  }
  return res.json();
}

export async function apiPost<T = unknown>(path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {
    apikey: ANON_KEY,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
  const token = getStoredToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const respBody = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(respBody.error || `API error ${res.status}`);
  }
  return res.json();
}

export async function apiPatch<T = unknown>(path: string, body: unknown): Promise<T> {
  const headers: Record<string, string> = {
    apikey: ANON_KEY,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
  const token = getStoredToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const respBody = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(respBody.error || `API error ${res.status}`);
  }
  return res.json();
}

export async function apiDelete(path: string): Promise<void> {
  const headers: Record<string, string> = { apikey: ANON_KEY };
  const token = getStoredToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { method: "DELETE", headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `API error ${res.status}`);
  }
}

export async function invokeFunction<T = unknown>(name: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {
    apikey: ANON_KEY,
    "Content-Type": "application/json",
  };
  const token = getStoredToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}/functions/v1/${name}`, {
    method: "POST",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const respBody = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(respBody.error || `Function error ${res.status}`);
  }
  return res.json();
}

export { API_BASE, ANON_KEY };
