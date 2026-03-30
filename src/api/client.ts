const _cfg = (window as unknown as { __SKMELD_CONFIG__?: { apiBase?: string; anonKey?: string } }).__SKMELD_CONFIG__;
const API_BASE = import.meta.env.VITE_API_BASE || _cfg?.apiBase || "https://api.run402.com";
const ANON_KEY = import.meta.env.VITE_ANON_KEY || _cfg?.anonKey || "";

// --- Session-expired callback (registered by auth.tsx to avoid circular imports) ---

let sessionExpiredCallback: (() => void) | null = null;

export function registerSessionExpiredCallback(cb: () => void) {
  sessionExpiredCallback = cb;
}

// --- Token refresh with deduplication ---

function getStoredSession() {
  try {
    const raw = localStorage.getItem("skmeld_session");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getStoredToken(): string | null {
  return getStoredSession()?.access_token || null;
}

let inflightRefresh: Promise<string | null> | null = null;

async function refreshToken(): Promise<string | null> {
  // Deduplicate: if a refresh is already in flight, reuse it
  if (inflightRefresh) return inflightRefresh;

  inflightRefresh = (async () => {
    try {
      const session = getStoredSession();
      if (!session?.refresh_token) return null;

      const res = await fetch(`${API_BASE}/auth/v1/token?grant_type=refresh_token`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: ANON_KEY },
        body: JSON.stringify({ refresh_token: session.refresh_token }),
      });

      if (!res.ok) return null;

      const newSession = await res.json();
      localStorage.setItem("skmeld_session", JSON.stringify(newSession));
      return newSession.access_token as string;
    } catch {
      return null;
    } finally {
      inflightRefresh = null;
    }
  })();

  return inflightRefresh;
}

// --- Core fetch wrapper with 401 interception ---

async function fetchWithAuth(url: string, init: RequestInit & { headers: Record<string, string> }): Promise<Response> {
  // Attach current token
  const token = getStoredToken();
  if (token) {
    init.headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, init);

  // On 401, attempt one refresh and retry
  if (res.status === 401 && token) {
    const newToken = await refreshToken();
    if (newToken) {
      init.headers["Authorization"] = `Bearer ${newToken}`;
      return fetch(url, init);
    }
    // Refresh failed — force logout
    if (sessionExpiredCallback) sessionExpiredCallback();
  }

  return res;
}

// --- Public API helpers ---

export async function apiGet<T = unknown>(path: string, options?: { auth?: boolean }): Promise<T> {
  const headers: Record<string, string> = { apikey: ANON_KEY };
  if (options?.auth === false) {
    // No auth — use raw fetch
    const res = await fetch(`${API_BASE}${path}`, { headers });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(body.error || `API error ${res.status}`);
    }
    return res.json();
  }
  const res = await fetchWithAuth(`${API_BASE}${path}`, { headers });
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
  const res = await fetchWithAuth(`${API_BASE}${path}`, {
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
  const res = await fetchWithAuth(`${API_BASE}${path}`, {
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
  const res = await fetchWithAuth(`${API_BASE}${path}`, { method: "DELETE", headers });
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
  const res = await fetchWithAuth(`${API_BASE}/functions/v1/${name}`, {
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
