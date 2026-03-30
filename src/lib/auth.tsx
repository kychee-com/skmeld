import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { API_BASE, ANON_KEY, apiGet, registerSessionExpiredCallback } from "../api/client";

interface User {
  id: string;
  email: string;
}

interface Profile {
  user_id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role_key: string;
  is_active: boolean;
}

interface Session {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: User;
}

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<{ id: string }>;
  loginWithGoogle: () => Promise<void>;
  handleOAuthCallback: () => Promise<boolean>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

// --- PKCE Helpers ---

function generatePKCEVerifier(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function generatePKCEChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

const AuthContext = createContext<AuthContextValue | null>(null);
const SESSION_KEY = "skmeld_session";
const SESSION_TS_KEY = "skmeld_session_ts"; // epoch ms when session was stored
const REFRESH_BUFFER_S = 300; // refresh 5 minutes before expiry

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Helpers ---

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const forceLogout = useCallback(() => {
    clearRefreshTimer();
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_TS_KEY);
    setUser(null);
    setProfile(null);
    window.location.href = "/login?expired=true";
  }, [clearRefreshTimer]);

  const storeSession = useCallback((session: Session) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    localStorage.setItem(SESSION_TS_KEY, String(Date.now()));
  }, []);

  // --- Token refresh ---

  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return false;
      const session: Session = JSON.parse(raw);
      if (!session.refresh_token) return false;

      const res = await fetch(`${API_BASE}/auth/v1/token?grant_type=refresh_token`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: ANON_KEY },
        body: JSON.stringify({ refresh_token: session.refresh_token }),
      });

      if (!res.ok) return false;

      const newSession: Session = await res.json();
      storeSession(newSession);
      setUser(newSession.user);
      return true;
    } catch {
      return false;
    }
  }, [storeSession]);

  const scheduleRefresh = useCallback((expiresInS: number) => {
    clearRefreshTimer();
    const delayMs = Math.max((expiresInS - REFRESH_BUFFER_S) * 1000, 10_000); // at least 10s
    refreshTimerRef.current = setTimeout(async () => {
      const ok = await refreshSession();
      if (ok) {
        // Re-read the new expires_in from the stored session
        try {
          const raw = localStorage.getItem(SESSION_KEY);
          if (raw) {
            const s: Session = JSON.parse(raw);
            scheduleRefresh(s.expires_in);
          }
        } catch { /* ignore */ }
      } else {
        forceLogout();
      }
    }, delayMs);
  }, [clearRefreshTimer, refreshSession, forceLogout]);

  // --- Register callback for client.ts 401 handling ---

  useEffect(() => {
    registerSessionExpiredCallback(forceLogout);
  }, [forceLogout]);

  // --- Load profile ---

  const loadProfile = useCallback(async () => {
    try {
      const profiles = await apiGet<Profile[]>("/rest/v1/profiles?user_id=eq." + user?.id);
      if (profiles.length > 0) {
        setProfile(profiles[0]);
      }
    } catch {
      // Profile might not exist yet (invite not redeemed)
    }
  }, [user?.id]);

  // --- Initialize from localStorage ---

  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      try {
        const session: Session = JSON.parse(stored);
        setUser(session.user);

        // Calculate remaining TTL
        const storedAt = Number(localStorage.getItem(SESSION_TS_KEY) || "0");
        const elapsedS = storedAt ? (Date.now() - storedAt) / 1000 : session.expires_in;
        const remainingS = session.expires_in - elapsedS;

        if (remainingS > REFRESH_BUFFER_S) {
          // Token still valid — schedule proactive refresh
          scheduleRefresh(remainingS);
        } else {
          // Token expired or about to expire — refresh immediately
          refreshSession().then((ok) => {
            if (ok) {
              try {
                const raw = localStorage.getItem(SESSION_KEY);
                if (raw) {
                  const s: Session = JSON.parse(raw);
                  setUser(s.user);
                  scheduleRefresh(s.expires_in);
                }
              } catch { /* ignore */ }
            } else {
              // Can't refresh — clear session, redirect to login
              localStorage.removeItem(SESSION_KEY);
              localStorage.removeItem(SESSION_TS_KEY);
              setUser(null);
              // Don't force redirect here — let ProtectedRoute handle it
              // But set a flag so login shows expired message
              if (window.location.pathname !== "/login") {
                window.location.href = "/login?expired=true";
              }
            }
          });
        }
      } catch {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(SESSION_TS_KEY);
      }
    }
    setLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user, loadProfile]);

  // --- Actions ---

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/v1/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: ANON_KEY },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Login failed");
    }
    const session: Session = await res.json();
    storeSession(session);
    setUser(session.user);
    scheduleRefresh(session.expires_in);
  };

  const signup = async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/v1/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: ANON_KEY },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Signup failed");
    }
    return res.json();
  };

  const loginWithGoogle = async () => {
    const verifier = generatePKCEVerifier();
    const challenge = await generatePKCEChallenge(verifier);
    sessionStorage.setItem("pkce_verifier", verifier);

    const res = await fetch(`${API_BASE}/auth/v1/oauth/google/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: ANON_KEY },
      body: JSON.stringify({
        redirect_url: window.location.origin + "/login",
        mode: "redirect",
        code_challenge: challenge,
        code_challenge_method: "S256",
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Failed to start Google sign-in");
    }
    const { authorization_url } = await res.json();
    window.location.href = authorization_url;
  };

  const handleOAuthCallback = async (): Promise<boolean> => {
    const params = new URLSearchParams(window.location.hash.substring(1));
    const code = params.get("code");
    if (!code) return false;

    // Clean the URL hash immediately
    window.history.replaceState(null, "", window.location.pathname + window.location.search);

    const verifier = sessionStorage.getItem("pkce_verifier");
    sessionStorage.removeItem("pkce_verifier");

    const res = await fetch(`${API_BASE}/auth/v1/token?grant_type=authorization_code`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: ANON_KEY },
      body: JSON.stringify({ code, code_verifier: verifier }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const errMsg = body.error || "Google sign-in failed";
      if (errMsg.includes("account_exists")) {
        throw new Error("An account with this email already exists. Please sign in with your email and password.");
      }
      throw new Error(errMsg);
    }

    const session: Session = await res.json();
    storeSession(session);
    setUser(session.user);
    scheduleRefresh(session.expires_in);
    return true;
  };

  const logout = () => {
    clearRefreshTimer();
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_TS_KEY);
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    await loadProfile();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, signup, loginWithGoogle, handleOAuthCallback, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
