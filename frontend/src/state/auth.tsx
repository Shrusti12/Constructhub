import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../utils/api";

export type Role = "company" | "client";

export type User = {
  id: number;
  email: string;
  name: string;
  phone: string;
  role: Role;
  created_at: string;
};

type AuthState = {
  token: string | null;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: { name: string; phone: string; email: string; password: string; role: Role }) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

const TOKEN_KEY = "constructhub_token";
const WELCOME_KEY = "constructhub_welcome_shown";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(WELCOME_KEY);
    setToken(null);
    setUser(null);
  };

  const refreshMe = async () => {
    if (!token) {
      setUser(null);
      return;
    }
    const me = await api.get<User>("/me", token);
    setUser(me);
  };

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.post<{ access_token: string }>("/auth/login", { email, password });
    localStorage.setItem(TOKEN_KEY, res.access_token);
    setToken(res.access_token);
    // Fetch user immediately to avoid UI ambiguity after login.
    const me = await api.get<User>("/me", res.access_token);
    setUser(me);
    return me;
  };

  const register = async (payload: { name: string; phone: string; email: string; password: string; role: Role }) => {
    await api.post("/auth/register", payload);
    await login(payload.email, payload.password);
  };

  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        if (token) {
          await refreshMe();
        }
      } finally {
        if (!canceled) setLoading(false);
      }
    })();
    return () => {
      canceled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let canceled = false;
    (async () => {
      if (!token) return;
      try {
        await refreshMe();
      } catch {
        if (!canceled) logout();
      }
    })();
    return () => {
      canceled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const value = useMemo<AuthState>(
    () => ({ token, user, loading, login, register, logout, refreshMe }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("AuthProvider missing");
  return ctx;
}
