import type { Tier } from "./tiers";

export interface ModuleDef {
  slug: string;
  label: string;
  href: string;
  group: "overview" | "build" | "marketplace" | "run" | "insights" | "govern" | "workspace" | "admin";
  minTier: Tier;
  description: string;
  icon: string;
  sidebar?: boolean;
}

// All pages remain indexed here for command search and deep links.
// Only sidebar=true modules appear in the primary rail.
export const MODULES: ModuleDef[] = [
  // 1. 🌐 Control Node (Dashboard)
  { slug: "dashboard", label: "Control Node", href: "/dashboard", group: "overview", minTier: "starter", description: "Workspace health, activity, spend, routing, policy, and audit summary.", icon: "LayoutDashboard", sidebar: true },
  { slug: "spine", label: "Asset Spine", href: "/spine", group: "overview", minTier: "starter", description: "The governed control-plane spine.", icon: "GitBranch", sidebar: false },

  // 2. ⚡ Build & Pipelines
  { slug: "pipelines", label: "Pipelines & GPC", href: "/pipelines", group: "build", minTier: "pro", description: "Visual builder for governed inference chains, tools, routing, and evidence.", icon: "Workflow", sidebar: true },
  { slug: "gpc", label: "Plan Compiler", href: "/gpc", group: "build", minTier: "pro", description: "Compile intent into deterministic plans.", icon: "GitBranch", sidebar: false },

  // 3. 🧪 Run & Playground
  { slug: "playground", label: "Playground", href: "/playground", group: "run", minTier: "free", description: "Side-by-side model comparison with Markdown rendering, cost prediction, and circuit breaker status.", icon: "FlaskConical", sidebar: true },
  { slug: "runtime", label: "Runtime Enforcement", href: "/runtime", group: "run", minTier: "free", description: "7-step deterministic execution pipeline with agent builder and cryptographic evidence ledger.", icon: "Terminal", sidebar: true },
  { slug: "deployments", label: "Deployments", href: "/deployments", group: "run", minTier: "pro", description: "BYOS deployment tracking.", icon: "Server", sidebar: false },
  { slug: "routing", label: "Smart Routing", href: "/routing", group: "run", minTier: "pro", description: "Provider routing rules.", icon: "Network", sidebar: false },
  { slug: "autonomous", label: "Autonomous Jobs", href: "/autonomous", group: "run", minTier: "pro", description: "Execute and monitor autonomous runs.", icon: "Bot", sidebar: false },

  // 4. 📊 API Benchmarks & Trust Rankings
  { slug: "benchmarks", label: "API Trust Rankings", href: "/benchmarks", group: "marketplace", minTier: "free", description: "Sovereign-compliance API trust rankings and Polymarket-style SLA prediction markets.", icon: "ActivitySquare", sidebar: true },
  { slug: "benchmarks-arena", label: "Authority Arena", href: "/benchmarks/arena", group: "marketplace", minTier: "free", description: "Interactive agent character creator and consensus pipeline playground.", icon: "Gamepad2", sidebar: false },
  { slug: "benchmarks-discovery", label: "Veklom Discovery", href: "/benchmarks/discovery", group: "marketplace", minTier: "free", description: "x402 payments, ACP agents, Base MCP wallet, ENS resolution, on-chain reputation ledger.", icon: "Globe2", sidebar: false },
  { slug: "benchmarks-runtime-lab", label: "Gateway Trust Contract Lab", href: "/benchmarks/runtime-lab", group: "marketplace", minTier: "free", description: "7-step deterministic pipeline, EAT token signing, policy presets, and cryptographic evidence ledger.", icon: "ShieldCheck", sidebar: false },
  { slug: "routing-live", label: "Fault Matrix + SLO-Gate", href: "/routing/live", group: "run", minTier: "free", description: "Chaos injection, Ollama→Groq→Gemini fallback drill, gradient field routing.", icon: "Activity", sidebar: false },
  { slug: "governance-registry", label: "Sovereign Operator Registry", href: "/governance/registry", group: "govern", minTier: "starter", description: "Immutable trust index, telemetry event publishing, chronological operator history.", icon: "Database", sidebar: false },
  { slug: "vendor-listings", label: "My APIs", href: "/benchmarks/listings", group: "marketplace", minTier: "starter", description: "Submit and manage benchmarked APIs.", icon: "BarChart", sidebar: false },


  // 5. ⚖️ Governance & Security
  { slug: "governance", label: "Governance & Identity", href: "/governance", group: "govern", minTier: "starter", description: "Operator trust score, rank progression, immutable event ledger, and identity verification.", icon: "Scale", sidebar: true },
  { slug: "audit", label: "Audit Log", href: "/audit", group: "govern", minTier: "pro", description: "Tamper-evident audit trail.", icon: "FileSearch", sidebar: false },
  { slug: "compliance", label: "Compliance", href: "/compliance", group: "govern", minTier: "sovereign", description: "Frameworks and evidence packages.", icon: "ShieldCheck", sidebar: false },
  { slug: "security", label: "Security Center", href: "/security", group: "govern", minTier: "sovereign", description: "Alerts and vault.", icon: "Shield", sidebar: false },
  { slug: "locker", label: "Locker Security", href: "/locker", group: "govern", minTier: "sovereign", description: "Controls and monitoring.", icon: "Lock", sidebar: false },
  { slug: "content-safety", label: "Content Safety", href: "/content-safety", group: "govern", minTier: "pro", description: "Scanning and age-verification.", icon: "ShieldAlert", sidebar: false },
  { slug: "privacy", label: "Privacy Controls", href: "/privacy", group: "govern", minTier: "sovereign", description: "Data residency.", icon: "EyeOff", sidebar: false },
  { slug: "kill-switch", label: "Kill Switch", href: "/kill-switch", group: "govern", minTier: "sovereign", description: "Halt execution.", icon: "PowerOff", sidebar: false },

  // 6. ⚙️ Workspace
  { slug: "workspace", label: "Workspace Treasury", href: "/workspace", group: "workspace", minTier: "starter", description: "Team, access, API keys, models, billing, and budget controls.", icon: "Settings", sidebar: true },
  { slug: "team", label: "Team & RBAC", href: "/team", group: "workspace", minTier: "pro", description: "Members and roles.", icon: "Users", sidebar: false },
  { slug: "api-keys", label: "API Keys", href: "/api-keys", group: "workspace", minTier: "starter", description: "Issue and rotate keys.", icon: "KeyRound", sidebar: false },
  { slug: "webhooks", label: "Webhooks", href: "/webhooks", group: "workspace", minTier: "pro", description: "Alert endpoints.", icon: "Webhook", sidebar: false },
  { slug: "wallet", label: "Token Wallet", href: "/wallet", group: "workspace", minTier: "starter", description: "Balance and top-ups.", icon: "Wallet", sidebar: false },
  { slug: "billing", label: "Billing", href: "/billing", group: "workspace", minTier: "starter", description: "Invoices and breakdown.", icon: "Receipt", sidebar: false },
  { slug: "budget", label: "Budget Caps", href: "/budget", group: "workspace", minTier: "pro", description: "Caps and forecasts.", icon: "Gauge", sidebar: false },
  { slug: "subscriptions", label: "Subscription", href: "/subscriptions", group: "workspace", minTier: "free", description: "Current plan.", icon: "CreditCard", sidebar: false },

  // Legacy Insights (hidden from sidebar, accessed via Dashboard now)
  { slug: "insights", label: "Insights", href: "/insights", group: "insights", minTier: "pro", description: "Proactive pulse.", icon: "Activity", sidebar: false },
  { slug: "usage", label: "Usage Analytics", href: "/usage", group: "insights", minTier: "pro", description: "Cost and throughput.", icon: "BarChart3", sidebar: false },
  { slug: "status", label: "System Status", href: "/status", group: "insights", minTier: "free", description: "Platform health.", icon: "HeartPulse", sidebar: false },

  // Admin
  { slug: "admin", label: "Global Admin", href: "/admin", group: "admin", minTier: "enterprise", description: "Workspaces, users, and billing reconciliation for superusers.", icon: "ShieldQuestion", sidebar: true },
];

export function modulesByGroup() {
  const groups: Record<string, ModuleDef[]> = {};
  for (const m of MODULES.filter((mod) => mod.sidebar)) (groups[m.group] ||= []).push(m);
  return groups;
}
