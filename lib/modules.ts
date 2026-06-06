import type { Tier } from "./tiers";

export interface ModuleDef {
  slug: string;
  label: string;
  href: string;
  group: "overview" | "build" | "marketplace" | "run" | "insights" | "govern" | "workspace" | "admin";
  minTier: Tier;
  description: string;
  icon: string; // lucide name
}

// Aligned to the Veklom governed-loop spine: Overview + Build / Marketplace / Run
// (outer surfaces) + Insights (proactive heartbeat) + Govern (prove) + Workspace.
// Nothing removed — every page preserved, regrouped by what the operator is doing.
export const MODULES: ModuleDef[] = [
  // OVERVIEW
  { slug: "dashboard", label: "Overview", href: "/dashboard", group: "overview", minTier: "starter", description: "Live workspace overview, health, and recent activity.", icon: "LayoutDashboard" },

  // BUILD — intent becomes a governed, packaged asset
  { slug: "gpc", label: "Plan Compiler (GPC)", href: "/gpc", group: "build", minTier: "pro", description: "Governed Plan Compiler — compile intent into deterministic, policy-checked execution plans.", icon: "GitBranch" },
  { slug: "pipelines", label: "Pipelines", href: "/pipelines", group: "build", minTier: "pro", description: "Visual builder for governed inference — chain models, retrieval, tools, routing.", icon: "Workflow" },

  // MARKETPLACE — distribution of wrapped assets
  { slug: "marketplace", label: "Marketplace", href: "/marketplace", group: "marketplace", minTier: "free", description: "Sovereign-ready assets, governed distribution — models, packs, connectors, managed services.", icon: "Store" },
  { slug: "vendor-listings", label: "My Listings", href: "/vendor/listings", group: "marketplace", minTier: "starter", description: "Submit, review, manage your marketplace listings.", icon: "Tags" },
  { slug: "vendor-onboarding", label: "Vendor Onboarding", href: "/vendor/onboarding", group: "marketplace", minTier: "starter", description: "Become a marketplace vendor.", icon: "Rocket" },
  { slug: "vendor-payouts", label: "Payouts", href: "/vendor/payouts", group: "marketplace", minTier: "starter", description: "Stripe Connect payouts and reconciliation.", icon: "Banknote" },
  { slug: "vendor-stripe", label: "Stripe Connect", href: "/vendor/stripe", group: "marketplace", minTier: "starter", description: "Connect onboarding & status.", icon: "Link2" },

  // RUN — deploy, execute, route, optimize
  { slug: "deployments", label: "Deployments", href: "/deployments", group: "run", minTier: "pro", description: "BYOS deployment tracking, endpoints, and integrations.", icon: "Server" },
  { slug: "playground", label: "Playground", href: "/playground", group: "run", minTier: "free", description: "Governed inference console — pick a model, run prompts, see routing/policy/cost per call.", icon: "FlaskConical" },
  { slug: "routing", label: "Smart Routing", href: "/routing", group: "run", minTier: "pro", description: "Provider routing rules, policies, economics.", icon: "Network" },
  { slug: "autonomous", label: "Autonomous Jobs", href: "/autonomous", group: "run", minTier: "pro", description: "Execute, monitor, override autonomous runs.", icon: "Bot" },

  // INSIGHTS — proactive heartbeat: signals, forecasts, golden state
  { slug: "insights", label: "Insights", href: "/insights", group: "insights", minTier: "pro", description: "Proactive heartbeat — pulse, signals, forecasts, and recommended actions.", icon: "Activity" },
  { slug: "usage", label: "Usage Analytics", href: "/usage", group: "insights", minTier: "pro", description: "Per-endpoint usage, cost, throughput.", icon: "BarChart3" },
  { slug: "status", label: "System Status", href: "/status", group: "insights", minTier: "free", description: "Live platform health, component status, uptime, and latency.", icon: "HeartPulse" },

  // GOVERN — prove & control
  { slug: "audit", label: "Audit Log", href: "/audit", group: "govern", minTier: "pro", description: "Tamper-evident audit trail and compliance reports.", icon: "FileSearch" },
  { slug: "compliance", label: "Compliance", href: "/compliance", group: "govern", minTier: "sovereign", description: "Frameworks, evidence packages, scheduled exports.", icon: "ShieldCheck" },
  { slug: "governance", label: "Governance", href: "/governance", group: "govern", minTier: "sovereign", description: "Zeno + Gladiator governance frames.", icon: "Scale" },
  { slug: "security", label: "Security Center", href: "/security", group: "govern", minTier: "sovereign", description: "Alerts, vault, governance frames.", icon: "Shield" },
  { slug: "locker", label: "Locker Security", href: "/locker", group: "govern", minTier: "sovereign", description: "Controls, monitoring, threats, users.", icon: "Lock" },
  { slug: "content-safety", label: "Content Safety", href: "/content-safety", group: "govern", minTier: "pro", description: "Scanning, age-verification.", icon: "ShieldAlert" },
  { slug: "privacy", label: "Privacy Controls", href: "/privacy", group: "govern", minTier: "sovereign", description: "Data residency, redaction, retention.", icon: "EyeOff" },
  { slug: "kill-switch", label: "Kill Switch", href: "/kill-switch", group: "govern", minTier: "sovereign", description: "Halt execution with audit proof.", icon: "PowerOff" },

  // WORKSPACE — tenancy, access, economics
  { slug: "workspace", label: "Workspace Settings", href: "/workspace", group: "workspace", minTier: "starter", description: "Models, providers, observability, integrations.", icon: "Settings" },
  { slug: "team", label: "Team & RBAC", href: "/team", group: "workspace", minTier: "pro", description: "Members, roles, SSO, SCIM, MFA.", icon: "Users" },
  { slug: "api-keys", label: "API Keys", href: "/api-keys", group: "workspace", minTier: "starter", description: "Issue, rotate, revoke keys.", icon: "KeyRound" },
  { slug: "webhooks", label: "Webhooks", href: "/webhooks", group: "workspace", minTier: "pro", description: "Alert and event webhook endpoints.", icon: "Webhook" },
  { slug: "wallet", label: "Token Wallet", href: "/wallet", group: "workspace", minTier: "starter", description: "Balance, top-ups, transactions.", icon: "Wallet" },
  { slug: "billing", label: "Billing", href: "/billing", group: "workspace", minTier: "starter", description: "Invoices, breakdown, allocation.", icon: "Receipt" },
  { slug: "budget", label: "Budget Caps", href: "/budget", group: "workspace", minTier: "pro", description: "Caps, forecasts, hard limits.", icon: "Gauge" },
  { slug: "subscriptions", label: "Subscription", href: "/subscriptions", group: "workspace", minTier: "free", description: "Current plan, change tier, billing portal.", icon: "CreditCard" },

  // ADMIN (superuser only)
  { slug: "admin", label: "Admin", href: "/admin", group: "admin", minTier: "enterprise", description: "Workspaces, users, billing recon (superuser).", icon: "ShieldQuestion" },
];

export function modulesByGroup() {
  const groups: Record<string, ModuleDef[]> = {};
  for (const m of MODULES) (groups[m.group] ||= []).push(m);
  return groups;
}
