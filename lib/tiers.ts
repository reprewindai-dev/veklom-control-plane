// Tier model — mapped from the Veklom build plan (Free / Starter / Pro / Sovereign / Enterprise).
// Used to gate modules in the Control Plane.

export type Tier = "free" | "starter" | "pro" | "sovereign" | "enterprise";

export const TIER_RANK: Record<Tier, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  sovereign: 3,
  enterprise: 4,
};

export const TIER_LABEL: Record<Tier, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  sovereign: "Sovereign",
  enterprise: "Enterprise",
};

export const TIER_PRICE: Record<Tier, string> = {
  free: "$0",
  starter: "$7.5K",
  pro: "$18K",
  sovereign: "Custom",
  enterprise: "$45K",
};

export function meetsTier(current: Tier | undefined, required: Tier): boolean {
  if (!current) return false;
  return TIER_RANK[current] >= TIER_RANK[required];
}

export function normalizeTier(raw: unknown): Tier {
  const s = String(raw ?? "free").toLowerCase();
  if (s.includes("enterprise")) return "enterprise";
  if (s.includes("sovereign")) return "sovereign";
  if (s.includes("pro")) return "pro";
  if (s.includes("starter") || s.includes("basic")) return "starter";
  return "free";
}
