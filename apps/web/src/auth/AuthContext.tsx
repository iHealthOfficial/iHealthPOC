import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type AuthUser = {
  id: string;
  email: string;
  role: "user" | "admin";
  displayName?: string;
  linkedPatientId?: string;
};

const TOKEN_KEY = "ihealth-auth-token-v1";

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isHydrating: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  linkPatient: (patientId: string | null) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setUser(null);
      return;
    }
    const res = await fetch("/api/auth/me", { headers: authHeaders(token) });
    const data = (await res.json()) as { error?: string; user?: AuthUser };
    if (!res.ok || !data.user) {
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
      return;
    }
    setUser(data.user);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setIsHydrating(false);
      return;
    }
    void (async () => {
      try {
        await refreshUser();
      } catch {
        localStorage.removeItem(TOKEN_KEY);
      } finally {
        setIsHydrating(false);
      }
    })();
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = (await res.json()) as { error?: string; token?: string; user?: AuthUser };
    if (!res.ok) throw new Error(data.error || "Sign in failed");
    if (!data.token || !data.user) throw new Error("Invalid response from server");
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
  }, []);

  const register = useCallback(async (email: string, password: string, displayName?: string) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, displayName: displayName || undefined }),
    });
    const data = (await res.json()) as { error?: string; token?: string; user?: AuthUser };
    if (!res.ok) throw new Error(data.error || "Could not create account");
    if (!data.token || !data.user) throw new Error("Invalid response from server");
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  const linkPatient = useCallback(async (patientId: string | null) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) throw new Error("Not signed in");
    const res = await fetch("/api/me/linked-patient", {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders(token) },
      body: JSON.stringify({ patientId }),
    });
    const data = (await res.json()) as { error?: string; user?: AuthUser };
    if (!res.ok) throw new Error(data.error || "Could not update patient link");
    if (!data.user) throw new Error("Invalid response");
    setUser(data.user);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isHydrating,
      login,
      register,
      logout,
      refreshUser,
      linkPatient,
    }),
    [user, isHydrating, login, register, logout, refreshUser, linkPatient],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
