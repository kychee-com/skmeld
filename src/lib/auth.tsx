import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { API_BASE, ANON_KEY, apiGet } from "../api/client";

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
  user: User;
}

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<{ id: string }>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const stored = localStorage.getItem("skmeld_session");
    if (stored) {
      try {
        const session: Session = JSON.parse(stored);
        setUser(session.user);
      } catch {
        localStorage.removeItem("skmeld_session");
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user, loadProfile]);

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
    const session = await res.json();
    localStorage.setItem("skmeld_session", JSON.stringify(session));
    setUser(session.user);
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

  const logout = () => {
    localStorage.removeItem("skmeld_session");
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    await loadProfile();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, signup, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
