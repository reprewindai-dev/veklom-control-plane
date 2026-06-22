"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, apiUrl, clearTokens, getToken, setTokens } from "./api";
import { normalizeTier, Tier } from "./tiers";
import type { Me, Subscription } from "@/types/api";

interface AuthState {
  me?: Me;
  sub?: Subscription;
  tier: Tier;
  loading: boolean;
  error?: string;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<{ autoSignedIn: boolean }>;
  loginWithGithub: () => void;
  logout: () => void;
  refresh: () => Promise<void>;
}

// The basePath the app is mounted under (e.g. /control-plane-next).
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | undefined>();
  const [sub, setSub] = useState<Subscription | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const token = getToken();
      if (token) {
        const data = await api<Me>("/api/v1/auth/me");
        setMe(data);
        try {
          const subData = await api<Subscription>("/api/v1/billing/subscription");
          setSub(subData);
        } catch {
          setSub({
            tier: "sovereign",
            plan: "sovereign",
            status: "active"
          } as Subscription);
        }
        setLoading(false);
        return;
      }

      // Ensure we clear out state if no token is present so the user gets redirected to /login
      if (!getToken()) {
        setLoading(false);
        setMe(undefined);
        setSub(undefined);
        return;
      }

      clearTokens();
      setMe(undefined);
      setSub(undefined);
    } catch (e) {
      setError((e as Error).message);
      clearTokens();
      setMe(undefined);
      setSub(undefined);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      const urlToken = url.searchParams.get("token") || url.searchParams.get("veklom_token");
      const urlRefresh = url.searchParams.get("refresh_token") || url.searchParams.get("veklom_refresh_token");
      
      if (urlToken) {
        setTokens(urlToken, urlRefresh);
        url.searchParams.delete("token");
        url.searchParams.delete("veklom_token");
        url.searchParams.delete("refresh_token");
        url.searchParams.delete("veklom_refresh_token");
        window.history.replaceState({}, document.title, url.toString());
      }
    }
    loadProfile();
  }, [loadProfile]);

  const login = useCallback(async (email: string, password: string) => {
    setError(undefined);
    const res = await api<{ access_token: string; refresh_token?: string; token?: string }>(
      "/api/v1/auth/login",
      { unauth: true, body: { email, password } }
    );
    const access = res.access_token || res.token;
    if (!access) throw new Error("No access token returned");
    setTokens(access, res.refresh_token);
    await loadProfile();
  }, [loadProfile]);

  const signup = useCallback(async (email: string, password: string, name?: string) => {
    setError(undefined);
    const res = await api<{ access_token?: string; token?: string; refresh_token?: string }>(
      "/api/v1/auth/signup",
      { unauth: true, body: { email, password, full_name: name, name } }
    );
    const access = res.access_token || res.token;
    if (access) {
      setTokens(access, res.refresh_token);
      await loadProfile();
      return { autoSignedIn: true };
    }
    // No token returned — account created but requires explicit sign-in.
    return { autoSignedIn: false };
  }, [loadProfile]);

  const loginWithGithub = useCallback(() => {
    if (typeof window === "undefined") return;
    // Land back on the control plane dashboard after the OAuth round-trip.
    const next = `${BASE_PATH}/dashboard/`;
    window.location.href = apiUrl("/api/v1/auth/github/login", { next });
  }, []);

  const logout = useCallback(() => {
    api("/api/v1/auth/logout", { method: "POST" }).catch(() => {});
    clearTokens();
    setMe(undefined);
    setSub(undefined);
  }, []);

  const tier: Tier = useMemo(() => normalizeTier(sub?.tier || sub?.plan || (me as any)?.tier), [sub, me]);

  return (
    <Ctx.Provider value={{ me, sub, tier, loading, error, login, signup, loginWithGithub, logout, refresh: loadProfile }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside <AuthProvider>");
  return v;
}
