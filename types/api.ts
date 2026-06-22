// Lightweight types matching the Veklom VCB API responses we consume.
// Permissive — backend evolves; we render whatever extra fields show up.

export interface Me {
  id: string;
  email: string;
  name?: string;
  role?: string;
  org_id?: string;
  org_name?: string;
  is_superuser?: boolean;
  tier?: string;
  [k: string]: unknown;
}

export interface Subscription {
  plan?: string;
  tier?: string;
  status?: string;
  current_period_end?: string;
  [k: string]: unknown;
}

export interface WalletBalance {
  balance?: number;
  currency?: string;
  tokens?: number;
  [k: string]: unknown;
}

export interface AuditEntry {
  id: string;
  ts?: string;
  actor?: string;
  action?: string;
  resource?: string;
  result?: string;
  [k: string]: unknown;
}

export interface ListEnvelope<T> {
  items?: T[];
  data?: T[];
  results?: T[];
  total?: number;
  [k: string]: unknown;
}

export function unwrapList<T>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[];
  if (r && typeof r === "object") {
    const o = r as ListEnvelope<T>;
    return (o.items || o.data || o.results || []) as T[];
  }
  return [];
}

export interface TeamMember {
  id: string;
  email: string;
  name?: string;
  role?: string;
  mfa?: boolean;
  lastActive?: string;
  status?: string;
  [k: string]: unknown;
}

export interface TeamRole {
  id: string;
  name?: string;
  description?: string;
  permissions?: string[];
  [k: string]: unknown;
}

export interface SsoStatus {
  enabled?: boolean;
  configured?: boolean;
  [k: string]: unknown;
}

export interface ScimStatus {
  scim_enabled?: boolean;
  configured?: boolean;
  [k: string]: unknown;
}

export interface MfaStatus {
  enforcement?: string;
  total_members?: number;
  mfa_compliance_percent?: number;
  mfa_enabled_count?: number;
  grace_period_hours?: number;
  [k: string]: unknown;
}
