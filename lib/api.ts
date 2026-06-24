// Typed fetch client for the Veklom VCB API.
// Auth: JWT in `Authorization: Bearer <token>` header.
//
// API_BASE is intentionally empty by default so the control plane calls the
// SAME origin it is served from (e.g. https://veklom.com/api/v1/...). This
// avoids cross-origin CORS preflight on authenticated requests — the bug that
// caused the silent login loop when the app called https://api.veklom.com.

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

// Two key conventions exist on the veklom.com domain:
//  - the control plane's own keys (veklom.access_token / veklom.refresh_token)
//  - the keys the backend GitHub OAuth bridge writes (veklom_token / veklom_refresh_token)
// We read both and write both so email login and GitHub login share a session.
const TOKEN_KEYS = ["veklom.access_token", "veklom_token"];
const REFRESH_KEYS = ["veklom.refresh_token", "veklom_refresh_token"];

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  for (const k of TOKEN_KEYS) {
    const v = window.localStorage.getItem(k);
    if (v) return v;
  }
  return null;
}
export function setTokens(access: string, refresh?: string | null) {
  if (typeof window === "undefined") return;
  for (const k of TOKEN_KEYS) window.localStorage.setItem(k, access);
  if (refresh) for (const k of REFRESH_KEYS) window.localStorage.setItem(k, refresh);
}
export function clearTokens() {
  if (typeof window === "undefined") return;
  for (const k of [...TOKEN_KEYS, ...REFRESH_KEYS, "veklom_user"]) {
    window.localStorage.removeItem(k);
  }
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public body?: unknown) {
    super(message);
  }
}

export interface RequestOpts {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  /** When true, do not attach the Authorization header (used for /auth/login etc.). */
  unauth?: boolean;
  signal?: AbortSignal;
}

export function apiBaseUrl(): string {
  if (API_BASE) return API_BASE;
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "";
}

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

function buildUrl(path: string, query?: RequestOpts["query"]): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const base = apiBaseUrl() || origin;
  // If we are calling our own Next.js server, we must include the basePath so the rewrite rules apply
  const isSameOrigin = base === origin && !path.startsWith("http");
  const fullPath = isSameOrigin ? `${BASE_PATH}${path}` : path;
  
  const url = new URL(fullPath.startsWith("http") ? fullPath : `${base}${fullPath}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) {
        url.searchParams.set(k, String(v));
      }
    }
  }
  return url.toString();
}

export function apiUrl(path: string, query?: RequestOpts["query"]): string {
  return buildUrl(path, query);
}

export async function api<T>(path: string, opts: RequestOpts = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Accept": "application/json",
  };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (!opts.unauth) {
    const tok = getToken();
    if (tok) headers["Authorization"] = `Bearer ${tok}`;
  }

  const res = await fetch(buildUrl(path, opts.query), {
    method: opts.method ?? (opts.body !== undefined ? "POST" : "GET"),
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
    cache: "no-store",
  });

  const text = await res.text();
  const json = text ? safeJson(text) : undefined;
  if (!res.ok) {
    const msg =
      (json && (json.detail || json.message || json.error)) ||
      res.statusText ||
      `HTTP ${res.status}`;
      
    // Enterprise Hardening: Automatic PGL/Budget enforcement routing
    if (typeof window !== "undefined") {
      if (res.status === 402) {
        window.location.href = "/wallet";
      } else if (res.status === 403) {
        // Governance lock - redirect to Trust / Security center or login
        if (msg.toLowerCase().includes("token") || msg.toLowerCase().includes("auth")) {
          window.location.href = "/login";
        } else {
          window.location.href = "/governance";
        }
      }
    }

    throw new ApiError(res.status, String(msg), json);
  }
  return json as T;
}

function safeJson(t: string) {
  try { return JSON.parse(t); } catch { return t; }
}


// SWR fetcher
export const fetcher = <T,>(path: string) => api<T>(path);

export async function duelApi<T>(path: string, opts: RequestOpts = {}): Promise<T> {
  const DUEL_BASE = "https://veklom-agent-duel.vercel.app";
  const headers: Record<string, string> = {
    "Accept": "application/json",
  };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";

  const url = new URL(path.startsWith("http") ? path : `${DUEL_BASE}${path}`);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined && v !== null) {
        url.searchParams.set(k, String(v));
      }
    }
  }

  const res = await fetch(url.toString(), {
    method: opts.method ?? (opts.body !== undefined ? "POST" : "GET"),
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
    cache: "no-store",
  });

  const text = await res.text();
  const json = text ? safeJson(text) : undefined;
  if (!res.ok) {
    const msg =
      (json && (json.detail || json.message || json.error)) ||
      res.statusText ||
      `HTTP ${res.status}`;
    throw new ApiError(res.status, String(msg), json);
  }
  return json as T;
}
