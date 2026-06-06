"use client";

import { ReactNode, useMemo, useState } from "react";
import Link from "next/link";
import Shell from "@/components/Shell";
import { useApi } from "@/hooks/useApi";
import { Button } from "@/components/ui";
import { KV, ModuleHeader, Pill, SectionCard } from "@/components/telemetry";
import { API_BASE } from "@/lib/api";
import {
  Activity,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Code2,
  Database,
  Download,
  ExternalLink,
  FileCheck2,
  GitBranch,
  Package,
  Play,
  Server,
  ShieldCheck,
  Store,
  Terminal,
  XCircle,
} from "lucide-react";

type Tone = "green" | "amber" | "red" | "cyan" | "violet" | "neutral";
type StageId = "source" | "risk" | "wrapper" | "listing" | "install" | "deploy" | "runtime" | "evidence";

interface StageDef {
  id: StageId;
  label: string;
  shortLabel: string;
  blurb: string;
  icon: any;
  route?: string;
  primaryAction: string;
  href?: string;
  externalHref?: string;
  proofRoute?: string;
}

interface StageState {
  tone: Tone;
  label: string;
  count?: number | null;
  summary: Array<{ k: string; v: ReactNode }>;
  events: string[];
  evidence: Array<{ k: string; v: ReactNode }>;
  raw: unknown;
  loading?: boolean;
  error?: string;
}

const STAGES: StageDef[] = [
  {
    id: "source",
    label: "Connected Source",
    shortLabel: "Source",
    blurb: "Connect and select the repository that becomes the governed source of the asset.",
    icon: GitBranch,
    route: "/api/v1/auth/github/status",
    proofRoute: "/api/v1/auth/github/repos",
    primaryAction: "Connect source",
    externalHref: "/api/v1/auth/github/login",
  },
  {
    id: "risk",
    label: "Repo Risk Gate",
    shortLabel: "Risk",
    blurb: "Review source risk before anything is trusted, packaged, listed, or deployed.",
    icon: ShieldCheck,
    route: "/api/v1/repo-risk-gate/runs",
    proofRoute: "/api/v1/repo-risk-gate/runs/{run_id}/ledger",
    primaryAction: "Run review",
    href: "/deployments",
  },
  {
    id: "wrapper",
    label: "Asset Wrapper",
    shortLabel: "Wrapper",
    blurb: "Compile intent into a deterministic governed plan with policy and proof metadata.",
    icon: Package,
    route: "/api/v1/gpc/stats",
    proofRoute: "/api/v1/gpc/observability/signals",
    primaryAction: "Compile plan",
    href: "/gpc",
  },
  {
    id: "listing",
    label: "Marketplace Asset",
    shortLabel: "Listing",
    blurb: "Publish the wrapped asset so it becomes visible, priced, installable, and auditable.",
    icon: Store,
    route: "/api/v1/marketplace/listings",
    proofRoute: "/api/v1/marketplace/listings/{listing_id}/datasheet",
    primaryAction: "Publish listing",
    href: "/marketplace",
  },
  {
    id: "install",
    label: "Workspace Install",
    shortLabel: "Install",
    blurb: "Install approved marketplace assets into the active workspace with tenant context.",
    icon: Download,
    route: "/api/v1/marketplace/installed",
    proofRoute: "/api/v1/workspace/providers",
    primaryAction: "Install asset",
    href: "/marketplace",
  },
  {
    id: "deploy",
    label: "Deployment",
    shortLabel: "Deploy",
    blurb: "Create the workspace-specific running instance, endpoint, code package, and webhooks.",
    icon: Server,
    route: "/api/v1/deployments",
    proofRoute: "/api/v1/deployments/{deployment_id}/webhooks",
    primaryAction: "Deploy instance",
    href: "/deployments",
  },
  {
    id: "runtime",
    label: "Terminal Runtime",
    shortLabel: "Runtime",
    blurb: "Open the governed runtime surface where deployed assets are exercised and observed.",
    icon: Terminal,
    route: "/api/v1/platform/pulse/stream",
    proofRoute: "/api/v1/exec",
    primaryAction: "Open runtime",
    href: "/playground",
  },
  {
    id: "evidence",
    label: "Evidence Ledger",
    shortLabel: "Evidence",
    blurb: "Export proof of source, review, packaging, listing, installation, deployment, and runtime use.",
    icon: FileCheck2,
    route: "/api/v1/audit/logs",
    proofRoute: "/api/v1/evidence/create",
    primaryAction: "Export evidence",
    href: "/audit",
  },
];

function listOf(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.runs)) return data.runs;
  if (Array.isArray(data?.listings)) return data.listings;
  if (Array.isArray(data?.installed)) return data.installed;
  if (Array.isArray(data?.deployments)) return data.deployments;
  if (Array.isArray(data?.logs)) return data.logs;
  return [];
}

function value(data: any, keys: string[], fallback: ReactNode = "Not reported"): ReactNode {
  for (const k of keys) {
    const v = data?.[k];
    if (v !== undefined && v !== null && v !== "") return typeof v === "boolean" ? (v ? "Yes" : "No") : String(v);
  }
  return fallback;
}

function countData(data: any): number | null {
  if (!data) return null;
  if (Array.isArray(data)) return data.length;
  if (typeof data.connected === "boolean") return data.connected ? 1 : 0;
  for (const key of ["count", "total", "plans_total", "runs_total", "listings_total", "deployments_total", "audit_entries"]) {
    if (typeof data[key] === "number") return data[key];
  }
  const list = listOf(data);
  return list.length ? list.length : null;
}

function deriveStatus(data: any, error?: unknown, manual = false): Pick<StageState, "tone" | "label" | "count"> {
  if (manual) return { tone: "cyan", label: "Manual step", count: null };
  if (error) return { tone: "amber", label: "Needs proof", count: null };
  if (!data) return { tone: "neutral", label: "Not started", count: null };
  const count = countData(data);
  if (count !== null) return count > 0 ? { tone: "green", label: "Verified", count } : { tone: "neutral", label: "Not started", count };
  return { tone: "cyan", label: "Present", count: null };
}

function firstItem(data: any): any {
  return listOf(data)[0] || data || {};
}

function latestItem(data: any): any {
  const items = listOf(data);
  return items[0] || data || {};
}

function formatTime(v: any): string {
  if (!v) return "No timestamp";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString();
}

function buildStageState(id: StageId, data: any, error?: unknown, loading?: boolean): StageState {
  const status = deriveStatus(data, error, id === "runtime" && !data);
  const item = latestItem(data);
  const list = listOf(data);
  const baseEvidence = [
    { k: "Live route", v: STAGES.find((s) => s.id === id)?.route || "Manual runtime surface" },
    { k: "Proof route", v: STAGES.find((s) => s.id === id)?.proofRoute || "Stage proof not declared" },
    { k: "Proof state", v: status.label },
  ];
  const commonEvents = list.slice(0, 4).map((row, i) => {
    const label = row?.name || row?.event || row?.action || row?.status || row?.id || `${STAGES.find((s) => s.id === id)?.label} record ${i + 1}`;
    return `${label} - ${formatTime(row?.created_at || row?.timestamp || row?.updated_at)}`;
  });

  if (id === "source") {
    const connected = Boolean(data?.connected || data?.github_connected || data?.status === "connected");
    return {
      ...status,
      tone: connected ? "green" : status.tone,
      label: connected ? "Verified" : status.label,
      loading,
      error: error ? String(error) : undefined,
      summary: [
        { k: "GitHub connection", v: connected ? "Connected" : value(data, ["status"], "Not connected") },
        { k: "Selected repo", v: value(data, ["selected_repo", "repo", "repository", "full_name"]) },
        { k: "Last sync", v: value(data, ["last_sync", "updated_at", "created_at"], "No sync proof") },
      ],
      events: commonEvents.length ? commonEvents : ["GitHub OAuth status is the current source proof."],
      evidence: baseEvidence,
      raw: data,
    };
  }

  if (id === "risk") {
    return {
      ...status,
      loading,
      error: error ? String(error) : undefined,
      summary: [
        { k: "Latest run", v: value(item, ["id", "run_id"]) },
        { k: "Decision", v: value(item, ["decision", "status", "outcome"]) },
        { k: "Risk score", v: value(item, ["risk_score", "score", "max_risk_score"]) },
      ],
      events: commonEvents.length ? commonEvents : ["Risk events appear here after a run is created."],
      evidence: [...baseEvidence, { k: "Ledger", v: value(item, ["ledger_hash", "hash", "chain_hash"], "Needs run ledger proof") }],
      raw: data,
    };
  }

  if (id === "wrapper") {
    return {
      ...status,
      loading,
      error: error ? String(error) : undefined,
      summary: [
        { k: "Plans", v: value(data, ["plans_total", "plans", "count"], status.count ?? "Not reported") },
        { k: "Runs", v: value(data, ["runs_total", "runs"], "Not reported") },
        { k: "Signals", v: value(data, ["signals_total", "observability_signals"], "Route available after compile") },
      ],
      events: commonEvents.length ? commonEvents : ["GPC compile activity appears here after intent is converted to plan."],
      evidence: [...baseEvidence, { k: "Decision frame", v: value(data, ["latest_hash", "proof_hash", "decision_hash"], "Awaiting compile proof") }],
      raw: data,
    };
  }

  if (id === "listing") {
    return {
      ...status,
      loading,
      error: error ? String(error) : undefined,
      summary: [
        { k: "Listings", v: status.count ?? "Not reported" },
        { k: "Latest asset", v: value(item, ["name", "title", "slug", "id"]) },
        { k: "Visibility", v: value(item, ["visibility", "status", "state"]) },
      ],
      events: commonEvents.length ? commonEvents : ["Marketplace publish and review activity appears here."],
      evidence: [...baseEvidence, { k: "Datasheet", v: value(item, ["datasheet_hash", "datasheet_url"], "Available after listing selection") }],
      raw: data,
    };
  }

  if (id === "install") {
    return {
      ...status,
      loading,
      error: error ? String(error) : undefined,
      summary: [
        { k: "Installed assets", v: status.count ?? "Not reported" },
        { k: "Latest install", v: value(item, ["name", "listing_name", "asset_id", "id"]) },
        { k: "Workspace binding", v: value(item, ["workspace_id", "tenant_id", "org_id"]) },
      ],
      events: commonEvents.length ? commonEvents : ["Workspace install events appear after an asset is installed."],
      evidence: [...baseEvidence, { k: "Provider wiring", v: value(item, ["provider", "provider_id", "model_id"], "Needs workspace provider proof") }],
      raw: data,
    };
  }

  if (id === "deploy") {
    return {
      ...status,
      loading,
      error: error ? String(error) : undefined,
      summary: [
        { k: "Deployments", v: status.count ?? "Not reported" },
        { k: "Latest deployment", v: value(item, ["name", "deployment_id", "id"]) },
        { k: "Endpoint", v: value(item, ["endpoint_url", "url", "endpoint"], "No endpoint reported") },
      ],
      events: commonEvents.length ? commonEvents : ["Deployment lifecycle events appear after deploy, pause, resume, or webhook changes."],
      evidence: [...baseEvidence, { k: "Runtime health", v: value(item, ["health", "status", "state"], "Needs deployment proof") }],
      raw: data,
    };
  }

  if (id === "runtime") {
    return {
      ...status,
      loading,
      error: error ? String(error) : undefined,
      summary: [
        { k: "Runtime entry", v: "Playground and terminal surfaces" },
        { k: "Execution API", v: "/api/v1/exec" },
        { k: "Pulse stream", v: error ? "Needs proof" : value(data, ["status", "state"], data ? "Present" : "Manual step") },
      ],
      events: commonEvents.length ? commonEvents : ["Runtime command and pulse events appear after execution."],
      evidence: [...baseEvidence, { k: "Audit expectation", v: "Every execution must produce audit evidence" }],
      raw: data || { runtime: "manual", exec_route: "/api/v1/exec" },
    };
  }

  return {
    ...status,
    loading,
    error: error ? String(error) : undefined,
    summary: [
      { k: "Audit entries", v: status.count ?? "Not reported" },
      { k: "Latest log", v: value(item, ["id", "log_id", "request_id"]) },
      { k: "Verification", v: value(item, ["verified", "status", "chain_valid"], "Use audit verify route") },
    ],
    events: commonEvents.length ? commonEvents : ["Audit, compliance, and evidence exports appear here."],
    evidence: [...baseEvidence, { k: "Export", v: "Evidence pack available from audit surface" }],
    raw: data,
  };
}

function ActionButton({ stage }: { stage: StageDef }) {
  if (stage.externalHref) {
    return (
      <a href={`${API_BASE}${stage.externalHref}`}>
        <Button><ExternalLink size={14} /> {stage.primaryAction}</Button>
      </a>
    );
  }
  if (stage.href) {
    return (
      <Link href={stage.href}>
        <Button><ChevronRight size={14} /> {stage.primaryAction}</Button>
      </Link>
    );
  }
  return null;
}

function StatusIcon({ tone }: { tone: Tone }) {
  if (tone === "green") return <CheckCircle2 size={16} className="text-accent-green" />;
  if (tone === "red") return <XCircle size={16} className="text-accent-red" />;
  if (tone === "amber") return <Clock3 size={16} className="text-brand-400" />;
  return <Activity size={16} className="text-ink-500" />;
}

function MetricStrip({ states }: { states: Record<StageId, StageState> }) {
  const verified = Object.values(states).filter((s) => s.tone === "green").length;
  const needsProof = Object.values(states).filter((s) => s.tone === "amber").length;
  const present = Object.values(states).filter((s) => s.tone === "cyan").length;
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
      <div className="card p-4">
        <div className="text-[10px] uppercase tracking-[0.16em] text-ink-500">Chain state</div>
        <div className="mt-2 text-xl font-semibold">{verified}/{STAGES.length} verified</div>
      </div>
      <div className="card p-4">
        <div className="text-[10px] uppercase tracking-[0.16em] text-ink-500">Needs proof</div>
        <div className="mt-2 text-xl font-semibold text-brand-400">{needsProof}</div>
      </div>
      <div className="card p-4">
        <div className="text-[10px] uppercase tracking-[0.16em] text-ink-500">Present/manual</div>
        <div className="mt-2 text-xl font-semibold text-[#7fdcf0]">{present}</div>
      </div>
      <div className="card p-4">
        <div className="text-[10px] uppercase tracking-[0.16em] text-ink-500">Doctrine</div>
        <div className="mt-2 text-sm font-semibold">Proactive, self-healing</div>
      </div>
    </div>
  );
}

function ProofTabs({ state }: { state: StageState }) {
  const [tab, setTab] = useState<"events" | "evidence" | "advanced">("events");
  return (
    <SectionCard
      label="Context"
      title="Trace context"
      actions={
        <div className="flex items-center gap-1 rounded-lg border border-border bg-white/[0.02] p-1">
          {(["events", "evidence", "advanced"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-2.5 py-1.5 rounded-md text-[11px] font-semibold uppercase tracking-wider transition ${
                tab === t ? "bg-brand-500/15 text-brand-400" : "text-ink-500 hover:text-ink-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      }
    >
      {tab === "events" && (
        <div className="space-y-2">
          {state.events.map((event, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg border border-border/70 bg-white/[0.02] px-3 py-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-400 shrink-0" />
              <span className="text-[12px] text-ink-300">{event}</span>
            </div>
          ))}
        </div>
      )}
      {tab === "evidence" && (
        <div className="space-y-1">
          {state.evidence.map((row) => <KV key={row.k} k={row.k} v={row.v} />)}
        </div>
      )}
      {tab === "advanced" && (
        <pre className="text-[11px] text-ink-400 bg-bg-900 border border-border rounded-lg p-3 overflow-auto max-h-72 whitespace-pre-wrap break-all">
          {JSON.stringify(state.raw ?? { status: state.label }, null, 2).slice(0, 2200)}
        </pre>
      )}
    </SectionCard>
  );
}

function StageRail({
  active,
  states,
  onSelect,
}: {
  active: StageId;
  states: Record<StageId, StageState>;
  onSelect: (id: StageId) => void;
}) {
  return (
    <div className="card p-3 lg:sticky lg:top-20">
      <div className="px-1 pb-3">
        <div className="text-[10px] uppercase tracking-[0.16em] text-ink-600">Asset spine</div>
        <div className="text-sm font-semibold mt-1">Start to proof</div>
      </div>
      <div className="space-y-1">
        {STAGES.map((stage, index) => {
          const Icon = stage.icon;
          const state = states[stage.id];
          const selected = active === stage.id;
          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => onSelect(stage.id)}
              className={`relative w-full text-left flex items-center gap-3 px-3 py-3 rounded-lg border transition ${
                selected ? "border-brand-500/60 bg-brand-500/[0.12]" : "border-transparent hover:border-border hover:bg-white/[0.03]"
              }`}
            >
              {index < STAGES.length - 1 && <span className="absolute left-[25px] top-[42px] h-[18px] w-px bg-border" />}
              <span className={`w-7 h-7 rounded-full grid place-items-center border shrink-0 ${
                selected ? "border-brand-500/50 bg-brand-500/15 text-brand-400" : "border-border bg-white/[0.02] text-ink-500"
              }`}>
                <Icon size={14} />
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block text-[12.5px] font-semibold truncate ${selected ? "text-ink-50" : "text-ink-200"}`}>{stage.label}</span>
                <span className="mt-1 flex items-center gap-1.5">
                  <StatusIcon tone={state.tone} />
                  <Pill tone={state.tone}>{state.label}{state.count ? ` - ${state.count}` : ""}</Pill>
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StageCanvas({ stage, state }: { stage: StageDef; state: StageState }) {
  const Icon = stage.icon;
  return (
    <div className="space-y-4">
      <SectionCard
        label={stage.shortLabel}
        title={
          <span className="flex items-center gap-2">
            <Icon size={16} className="text-brand-400" />
            {stage.label}
          </span>
        }
        actions={<ActionButton stage={stage} />}
      >
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-4">
          <div>
            <p className="text-[13px] leading-relaxed text-ink-400 max-w-3xl">{stage.blurb}</p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              {state.summary.map((row) => (
                <div key={row.k} className="rounded-lg border border-border bg-white/[0.02] p-3 min-w-0">
                  <div className="text-[10px] uppercase tracking-[0.14em] text-ink-600 truncate">{row.k}</div>
                  <div className="mt-1 text-[13px] text-ink-100 font-mono break-words">{row.v}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-bg-900/60 p-4">
            <div className="flex items-center gap-2">
              <StatusIcon tone={state.tone} />
              <Pill tone={state.tone}>{state.label}</Pill>
            </div>
            <div className="mt-4 space-y-1.5">
              <KV k="Primary route" v={stage.route || "Manual"} />
              <KV k="Action" v={stage.primaryAction} mono={false} />
              <KV k="Records" v={state.count ?? "Not counted"} />
            </div>
            {state.error && (
              <div className="mt-3 rounded-lg border border-brand-500/30 bg-brand-500/10 p-2 text-[11px] text-brand-300">
                Backend route is wired but this session has no proof yet.
              </div>
            )}
            {state.loading && <div className="mt-3 text-[12px] text-ink-500">Checking live route...</div>}
          </div>
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
        <ProofTabs state={state} />
        <SectionCard label="Controls" title="Related surfaces">
          <div className="space-y-2">
            <ControlLink href="/gpc" icon={<Code2 size={14} />} label="Plan compiler" />
            <ControlLink href="/deployments" icon={<Server size={14} />} label="Deployments" />
            <ControlLink href="/audit" icon={<Database size={14} />} label="Audit trail" />
            <ControlLink href="/playground" icon={<Play size={14} />} label="Runtime console" />
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function ControlLink({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <Link href={href} className="flex items-center justify-between rounded-lg border border-border bg-white/[0.02] px-3 py-2 text-[12px] text-ink-300 hover:border-brand-500/40 hover:text-ink-50 transition">
      <span className="flex items-center gap-2">{icon}{label}</span>
      <ChevronRight size={13} className="text-ink-600" />
    </Link>
  );
}

export default function ShipAssetPage() {
  const [active, setActive] = useState<StageId>("source");
  const source = useApi<any>("/api/v1/auth/github/status");
  const risk = useApi<any>("/api/v1/repo-risk-gate/runs");
  const wrapper = useApi<any>("/api/v1/gpc/stats");
  const listing = useApi<any>("/api/v1/marketplace/listings");
  const install = useApi<any>("/api/v1/marketplace/installed");
  const deploy = useApi<any>("/api/v1/deployments");
  const runtime = useApi<any>("/api/v1/platform/pulse/stream");
  const evidence = useApi<any>("/api/v1/audit/logs");

  const states = useMemo<Record<StageId, StageState>>(() => ({
    source: buildStageState("source", source.data, source.error, source.isLoading),
    risk: buildStageState("risk", risk.data, risk.error, risk.isLoading),
    wrapper: buildStageState("wrapper", wrapper.data, wrapper.error, wrapper.isLoading),
    listing: buildStageState("listing", listing.data, listing.error, listing.isLoading),
    install: buildStageState("install", install.data, install.error, install.isLoading),
    deploy: buildStageState("deploy", deploy.data, deploy.error, deploy.isLoading),
    runtime: buildStageState("runtime", runtime.data, runtime.error, runtime.isLoading),
    evidence: buildStageState("evidence", evidence.data, evidence.error, evidence.isLoading),
  }), [
    source.data, source.error, source.isLoading,
    risk.data, risk.error, risk.isLoading,
    wrapper.data, wrapper.error, wrapper.isLoading,
    listing.data, listing.error, listing.isLoading,
    install.data, install.error, install.isLoading,
    deploy.data, deploy.error, deploy.isLoading,
    runtime.data, runtime.error, runtime.isLoading,
    evidence.data, evidence.error, evidence.isLoading,
  ]);

  const activeStage = STAGES.find((s) => s.id === active) || STAGES[0];

  return (
    <Shell>
      <ModuleHeader
        breadcrumb="Operate / Ship Asset"
        title="Ship a governed asset"
        subtitle="The proactive, self-healing sovereign control plane spine: source to evidence, with live status and proof kept in the same operating surface."
        pills={
          <>
            {STAGES.map((stage) => <Pill key={stage.id} tone={states[stage.id].tone}>{stage.shortLabel}</Pill>)}
          </>
        }
      />

      <MetricStrip states={states} />

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
        <StageRail active={active} states={states} onSelect={setActive} />
        <StageCanvas stage={activeStage} state={states[activeStage.id]} />
      </div>
    </Shell>
  );
}
