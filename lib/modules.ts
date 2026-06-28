import type { Tier } from "./tiers";

export interface ModuleDef {
  slug: string;
  label: string;
  href: string;
  group: "overview" | "build" | "nexus" | "ecosystem" | "run" | "insights" | "govern" | "workspace" | "admin";
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
  { slug: "terminal", label: "Swarm Terminal", href: "/terminal", group: "run", minTier: "free", description: "Raw CLI and Swarm Map.", icon: "TerminalSquare", sidebar: true },
  { slug: "deployments", label: "Deployments", href: "/deployments", group: "run", minTier: "pro", description: "BYOS deployment tracking.", icon: "Server", sidebar: false },
  { slug: "routing", label: "Smart Routing", href: "/routing", group: "run", minTier: "pro", description: "Provider routing rules.", icon: "Network", sidebar: false },
  { slug: "autonomous", label: "Autonomous Jobs", href: "/autonomous", group: "run", minTier: "pro", description: "Execute and monitor autonomous runs.", icon: "Bot", sidebar: false },

  // 4. 📊 API Benchmarks & Trust Rankings
  { slug: "benchmarks", label: "Nexus Protocol", href: "/benchmarks", group: "nexus", minTier: "free", description: "VNP-certified API trust leaderboard and SLA staking markets.", icon: "ActivitySquare", sidebar: true },
  { slug: "vnp-incidents", label: "Incidents & Slashing", href: "/vnp-incidents", group: "nexus", minTier: "free", description: "Live SLA breaches, cryptographic evidence, and PGL dispute resolution.", icon: "ShieldAlert", sidebar: true },
  { slug: "benchmarks-pgl", label: "PGL Identity Layer", href: "/benchmarks?tab=pgl", group: "nexus", minTier: "free", description: "PGL Immutable Identity and M2M trust operations.", icon: "Fingerprint", sidebar: false },
  { slug: "benchmarks-trust", label: "Trust Node Matrix", href: "/benchmarks?tab=trust", group: "nexus", minTier: "free", description: "API Trust Leaderboard with 10-dimension scoring.", icon: "Shield", sidebar: false },
  { slug: "benchmarks-consensus", label: "Consensus Vector", href: "/benchmarks?tab=consensus", group: "nexus", minTier: "free", description: "Multi-node measurement consensus and epoch history.", icon: "Network", sidebar: false },
  { slug: "benchmarks-methodology", label: "Methodology", href: "/benchmarks?tab=methodology", group: "nexus", minTier: "free", description: "VNP scoring methodology, dimensions, and provenance spec.", icon: "BookOpen", sidebar: false },
  
  { slug: "benchmarks-arena", label: "Authority Arena", href: "/benchmarks/arena", group: "nexus", minTier: "free", description: "Interactive agent character creator and consensus pipeline playground.", icon: "Gamepad2", sidebar: false },
  { slug: "benchmarks-runtime-lab", label: "Gateway Trust Contract Lab", href: "/benchmarks/runtime-lab", group: "nexus", minTier: "free", description: "7-step deterministic pipeline, EAT token signing, policy presets, and cryptographic evidence ledger.", icon: "ShieldCheck", sidebar: false },

  // 4.5 🌐 Staking & Ecosystem
  { slug: "benchmarks-staking", label: "Staking Protocol", href: "/benchmarks?tab=staking", group: "ecosystem", minTier: "free", description: "SLA staking markets (pending Nexus Protocol completion).", icon: "BarChart2", sidebar: true },
  { slug: "agent-duel", label: "Agent Dual", href: "/agent-dual", group: "ecosystem", minTier: "free", description: "Multi-agent debate arena running on Base.", icon: "Swords", sidebar: true },
  { slug: "bingo", label: "BINGO 2060", href: "/bingo", group: "ecosystem", minTier: "free", description: "M2M Galactic Tournament.", icon: "Gamepad2", sidebar: true },
  { slug: "veklom-id", label: "Veklom ID", href: "https://veklom-id.vercel.app", group: "ecosystem", minTier: "free", description: "Decentralized Sovereign Operator Registry.", icon: "Fingerprint", sidebar: true },
  { slug: "benchmarks-discovery", label: "Veklom Discovery", href: "https://veklomdiscovery.vercel.app", group: "ecosystem", minTier: "free", description: "x402 payments, ACP agents, Base MCP wallet, ENS resolution, on-chain reputation ledger.", icon: "Globe2", sidebar: false },


  // 5. ⚖️ Governance & Security
  { slug: "governance", label: "Governance & Identity", href: "/governance", group: "govern", minTier: "starter", description: "Operator trust score, rank progression, immutable event ledger, and identity verification.", icon: "Scale", sidebar: true },
  { slug: "command-center", label: "Interlink", href: "/interlink", group: "govern", minTier: "free", description: "cAPI execution proofs and 9-phase ledger.", icon: "ShieldAlert", sidebar: true },
  { slug: "audit", label: "Audit Log", href: "/audit", group: "govern", minTier: "pro", description: "Tamper-evident audit trail.", icon: "FileSearch", sidebar: false },
  { slug: "compliance", label: "Compliance", href: "/compliance", group: "govern", minTier: "sovereign", description: "Frameworks and evidence packages.", icon: "ShieldCheck", sidebar: false },
  { slug: "security", label: "Security Center", href: "/security", group: "govern", minTier: "sovereign", description: "Alerts and vault.", icon: "Shield", sidebar: false },
  { slug: "locker", label: "Locker Security", href: "/locker", group: "govern", minTier: "sovereign", description: "Controls and monitoring.", icon: "Lock", sidebar: false },
  { slug: "content-safety", label: "Content Safety", href: "/content-safety", group: "govern", minTier: "pro", description: "Scanning and age-verification.", icon: "ShieldAlert", sidebar: false },
  { slug: "privacy", label: "Privacy Controls", href: "/privacy", group: "govern", minTier: "sovereign", description: "Data residency.", icon: "EyeOff", sidebar: false },
  { slug: "kill-switch", label: "Kill Switch", href: "/kill-switch", group: "govern", minTier: "sovereign", description: "Halt execution.", icon: "PowerOff", sidebar: false },
  { slug: "fault-matrix", label: "Fault Matrix", href: "/fault-matrix", group: "govern", minTier: "free", description: "Agentic Authority Runtime & Anomaly Detection", icon: "Activity", sidebar: true },

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
