"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import useSWR from "swr";
import clsx from "clsx";
import Shell from "@/components/Shell";
import { fetcher } from "@/lib/api";
import {
  Network,
  ShieldAlert,
  Database,
  Cpu,
  FileText,
  Play,
  Square,
  RotateCcw,
  ChevronRight,
  AlertTriangle,
  Zap,
  Activity,
  Clock,
  GitBranch,
  CheckCircle2,
  Loader2,
  Code2,
  Gauge,
  Radio,
  ServerCrash,
  RefreshCw,
  HardDrive,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SimParameter {
  id: string;
  name: string;
  type: "slider";
  value: number;
  min: number;
  max: number;
  unit: string;
  description: string;
}

interface ScenarioStep {
  id: number;
  title: string;
  description: string;
  actor: string;
}

interface FaultScenario {
  id: string;
  name: string;
  severity: "critical" | "high" | "medium" | "low";
  shortImpact: string;
  immediateImpact: string;
  mitigationArchitecture: string;
  componentAffected: string;
  lockType: string;
  recoveryTtl: string;
  codeReference: string;
  parameters: SimParameter[];
  scenarioSteps: ScenarioStep[];
}

// ─── Fault Matrix Data ────────────────────────────────────────────────────────

const FAULT_MATRIX_DATA: FaultScenario[] = [
  {
    id: "worker-compute-lag",
    name: "Worker Compute Lag",
    severity: "high",
    shortImpact: "The initial thread loses its lock mid-flight. Another request claims the slot.",
    immediateImpact: "Execution outruns ROUTING_IDEMPOTENCY_TTL_SECONDS...",
    mitigationArchitecture: "The late-running thread triggers atomic LUA_COMPLETE_IF_MATCH...",
    componentAffected: "Worker Compute Cluster",
    lockType: "Atomic Mutex Lock (Redis TTL based)",
    recoveryTtl: "Dynamic IDEMPOTENCY_TTL",
    codeReference: `// Atomic LUA script running in Redis engine
const luaCompIfMatch = \`
  if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("set", KEYS[1], ARGV[2], "EX", ARGV[3])
  else
    return 0
  end
\`;`,
    parameters: [
      { id: "lag-duration", name: "Worker Compute Lag", type: "slider", value: 12000, min: 2000, max: 20000, unit: "ms", description: "Actual execution time of Worker Node compute loop." },
      { id: "idempotency-ttl", name: "ROUTING_IDEMPOTENCY_TTL_SECONDS", type: "slider", value: 5, min: 1, max: 15, unit: "s", description: "Duration before Redis releases the exclusive lock." },
    ],
    scenarioSteps: [
      { id: 1, title: "Compute Lock Acquisition", description: "Client submits task with UUID. Redis lock reserved with TTL.", actor: "Redis Lock Gate" },
      { id: 2, title: "CPU Pressure Peak", description: "Worker Node begins computation. Thread starvation slows processing.", actor: "Worker VM" },
      { id: 3, title: "Lock Natural Expiry", description: "Duration exceeds IDEMPOTENCY_TTL. Redis purges lock key.", actor: "Redis Lock Gate" },
      { id: 4, title: "Duplicate Lock Stolen", description: "Retry client finds lock vacant, re-registers with new token.", actor: "API Proxy" },
      { id: 5, title: "Late Result Commit", description: "Worker Node 01 finally finishes. Attempts write-back via LUA.", actor: "Worker VM" },
      { id: 6, title: "LUA_COMPLETE_IF_MATCH Rejection", description: "LUA checks: wrong token found. Rejects with 409 Conflict. Lock-stomping averted.", actor: "Redis Lock Gate" },
    ],
  },
  {
    id: "redis-node-outage",
    name: "Redis Node Outage",
    severity: "critical",
    shortImpact: "The proxy cannot acquire locks, read replays, or update routing targets.",
    immediateImpact: "The central Redis lock registry goes dark. All socket exceptions fire.",
    mitigationArchitecture: "Router catches SocketException, writes telemetry alert, initiates graceful failback.",
    componentAffected: "API Gateway & Redis Cluster",
    lockType: "No Lock (Degraded State)",
    recoveryTtl: "Immediate failback to standby queue",
    codeReference: `try:
    await lock_registry.acquire(client_uuid)
except SocketException as e:
    telemetry.alert_critical("Redis Node Down", e)
    return HTTP_500_Server_Error()
finally:
    await rust_router_pool.put(borrowed_router)`,
    parameters: [
      { id: "connection-timeout", name: "Socket Connection Timeout", type: "slider", value: 1500, min: 250, max: 5000, unit: "ms", description: "Network threshold before giving up on Redis connection." },
      { id: "retry-attempts", name: "Retry Attempt Limit", type: "slider", value: 3, min: 1, max: 5, unit: "tries", description: "Total connect attempts before raising fatal exception." },
    ],
    scenarioSteps: [
      { id: 1, title: "Incoming Request Dispatch", description: "API Proxy receives packet. Targets routing paths.", actor: "API Proxy" },
      { id: 2, title: "Socket Connection Failure", description: "Proxy attempts Redis connection. Unresponsive node. Timeout.", actor: "Redis Lock Gate" },
      { id: 3, title: "Retry Budget Depleted", description: "All pool exceptions unhandled. SocketException thrown.", actor: "API Proxy" },
      { id: 4, title: "Telemetry Alert Broadcast", description: "Catch block writes to high-priority metrics pipeline.", actor: "Audit Logger" },
      { id: 5, title: "Rust Router Reclamation", description: "Rust core router safely recycled into asyncio.Queue.", actor: "API Proxy" },
      { id: 6, title: "Clean Outage Handshake", description: "Gateway issues 500 to client with tracking ID.", actor: "API Proxy" },
    ],
  },
  {
    id: "async-client-retries",
    name: "Async Client Retries",
    severity: "medium",
    shortImpact: "The client fires duplicate payloads during bottlenecks.",
    immediateImpact: "Network jitter causes client retries, submitting identical UUIDs while computation runs.",
    mitigationArchitecture: "Duplicate checked at atomic cache.set NX gate. Lock claim fails instantly. 202 redirect issued.",
    componentAffected: "API Gateway Gatekeeper",
    lockType: "Atomic Key Locking (SET owner NX)",
    recoveryTtl: "Dynamic Tracking Status Redirect",
    codeReference: `// Atomic conditional set prevents race conditions
is_new_job = redis.set(f"job:{uuid}", "running", nx=True, ex=300)
if not is_new_job:
    return HTTP_202_Accepted(location=f"/api/status/{uuid}")`,
    parameters: [
      { id: "client-retry-interval", name: "Retry Trigger Latency", type: "slider", value: 1200, min: 500, max: 3000, unit: "ms", description: "Time at which client issues retry packets." },
      { id: "computation-weight", name: "Task Compute Weight", type: "slider", value: 3500, min: 1000, max: 8000, unit: "ms", description: "Time for background worker to complete the job." },
    ],
    scenarioSteps: [
      { id: 1, title: "Initial Request Registered", description: "Client submits job. Proxy acquires atomic lock. Status: RUNNING.", actor: "API Proxy" },
      { id: 2, title: "Active Computation Loop", description: "Worker VM fires heavy parsing computation thread.", actor: "Worker VM" },
      { id: 3, title: "Impatient Duplicate Attack", description: "Network delay crosses timeout. Client retransmits duplicate.", actor: "Client" },
      { id: 4, title: "Atomic Boundary Gate", description: "Secondary request hits proxy. SETNX check fires.", actor: "API Proxy" },
      { id: 5, title: "Duplicate Filter Interception", description: "Atomic check fails — key already exists. Execution aborted.", actor: "Redis Lock Gate" },
      { id: 6, title: "Graceful Redirect Mitigation", description: "Middleware redirects to job tracker. Returns 202 Accepted.", actor: "API Proxy" },
    ],
  },
  {
    id: "physical-node-crash",
    name: "Physical Worker Node Crash",
    severity: "high",
    shortImpact: "Active thread vanishes instantly. Rust instance unreturned.",
    immediateImpact: "Active worker container dies (OOM/node restart) inside calculation context.",
    mitigationArchitecture: "Lock remains protected in Redis with 60s TTL. After expiry, next client retry claims slot on healthy node.",
    componentAffected: "Worker Hypervisor Node",
    lockType: "Automatic Expiring Key-level Lease",
    recoveryTtl: "60s lock expiration",
    codeReference: `# Redis distributed lock with auto lease
lock_acquired = redis.set("worker_lease:tx_8854", "worker_node_4", nx=True, ex=60)
# Under fatal crash, key deleted in 60s by Redis cluster.`,
    parameters: [
      { id: "lock-lease-time", name: "Redis Key Lease Window (EX)", type: "slider", value: 60, min: 10, max: 120, unit: "s", description: "Duration before lock releases when heartbeats fail." },
      { id: "recovery-gap", name: "Container Spin-Up Gap", type: "slider", value: 15, min: 5, max: 30, unit: "s", description: "Time for K8s to boot a new worker VM." },
    ],
    scenarioSteps: [
      { id: 1, title: "Worker Allocation", description: "Proxy selects Worker Container 04 and assigns credentials.", actor: "API Proxy" },
      { id: 2, title: "Distributed Lock Lease", description: "Worker creates Redis lease with ex=60 TTL.", actor: "Redis Lock Gate" },
      { id: 3, title: "Absolute Hardware Failure", description: "Physical device suffers OOM crash. Process vanishes instantly.", actor: "Worker VM" },
      { id: 4, title: "Active Block Protected", description: "Redis holds lock index. Blocks corruption of semi-finished data.", actor: "Redis Lock Gate" },
      { id: 5, title: "Natural Lease Timeout", description: "Redis timer detects countdown hit zero. Lock deleted.", actor: "Redis Lock Gate" },
      { id: 6, title: "Healthy Node Failover", description: "Client retry finds vacant lock. Spins computation on healthy Worker 05.", actor: "API Proxy" },
    ],
  },
];

// ─── Mock data fallback ───────────────────────────────────────────────────────

const MOCK_TOPOLOGY = {
  total_routes: 847,
  active_models: 12,
  avg_latency_ms: 142,
  error_rate: 0.0031,
};

// ─── Topology nodes definition ────────────────────────────────────────────────

const TOPOLOGY_ACTORS = [
  { id: "Client", label: "Client Gateway", icon: Network },
  { id: "API Proxy", label: "Rust API Proxy", icon: ShieldAlert },
  { id: "Redis Lock Gate", label: "Redis Lock Gate", icon: Database },
  { id: "Worker VM", label: "Worker Knative VM", icon: Cpu },
  { id: "Audit Logger", label: "Telemetry Auditing", icon: FileText },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function severityConfig(severity: FaultScenario["severity"]) {
  switch (severity) {
    case "critical":
      return { label: "CRITICAL", bg: "bg-red-950/70", border: "border-red-700/60", text: "text-red-400", dot: "bg-red-400" };
    case "high":
      return { label: "HIGH", bg: "bg-orange-950/60", border: "border-orange-700/50", text: "text-orange-400", dot: "bg-orange-400" };
    case "medium":
      return { label: "MEDIUM", bg: "bg-yellow-950/50", border: "border-yellow-700/40", text: "text-yellow-400", dot: "bg-yellow-400" };
    case "low":
      return { label: "LOW", bg: "bg-blue-950/50", border: "border-blue-700/40", text: "text-blue-400", dot: "bg-blue-400" };
  }
}

function getActorIndex(actor: string): number {
  const idx = TOPOLOGY_ACTORS.findIndex((a) => a.id === actor);
  return idx >= 0 ? idx : 0;
}

function calcPrognosis(
  scenario: FaultScenario,
  params: Record<string, number>
): { label: string; detail: string; color: string } {
  if (scenario.id === "worker-compute-lag") {
    const lag = params["lag-duration"] ?? 12000;
    const ttl = (params["idempotency-ttl"] ?? 5) * 1000;
    const ratio = lag / ttl;
    if (ratio < 1.5) return { label: "STABLE", detail: "Lag within safe TTL margin — lock protected", color: "text-emerald-400" };
    if (ratio < 3) return { label: "DEGRADED", detail: "Lock expiry risk — LUA mitigation active", color: "text-yellow-400" };
    return { label: "CRITICAL RACE", detail: "Lock-stomping likely — immediate TTL adjustment required", color: "text-red-400" };
  }
  if (scenario.id === "redis-node-outage") {
    const timeout = params["connection-timeout"] ?? 1500;
    const retries = params["retry-attempts"] ?? 3;
    if (timeout < 500 && retries <= 2) return { label: "FAST FAILOVER", detail: "Aggressive detection — minimal downtime window", color: "text-emerald-400" };
    if (timeout > 3000) return { label: "SLOW DEGRADATION", detail: "High timeout budget — prolonged hang risk", color: "text-red-400" };
    return { label: "CONTROLLED OUTAGE", detail: "Standard failback sequence — 500 issued cleanly", color: "text-yellow-400" };
  }
  if (scenario.id === "async-client-retries") {
    const retryInterval = params["client-retry-interval"] ?? 1200;
    const computeWeight = params["computation-weight"] ?? 3500;
    if (retryInterval > computeWeight) return { label: "NO COLLISION", detail: "Retry fires after compute finishes — no duplication", color: "text-emerald-400" };
    return { label: "DUPLICATE INTERCEPTED", detail: "SETNX gate blocks retry — 202 redirect active", color: "text-brand-400" };
  }
  if (scenario.id === "physical-node-crash") {
    const lease = params["lock-lease-time"] ?? 60;
    const spinup = params["recovery-gap"] ?? 15;
    if (lease > spinup * 3) return { label: "SAFE RECOVERY", detail: "Lease window safely exceeds K8s spin-up — data protected", color: "text-emerald-400" };
    if (lease < spinup) return { label: "LEASE RACE CONDITION", detail: "New node may claim expired slot before spin-up completes", color: "text-red-400" };
    return { label: "NOMINAL RECOVERY", detail: "K8s failover within lease window — standard sequence", color: "text-yellow-400" };
  }
  return { label: "UNKNOWN", detail: "Prognosis unavailable", color: "text-ink-400" };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LiveBadge() {
  return (
    <span className="flex items-center gap-1.5 bg-[#151515] border border-[#242424] px-2.5 py-1 rounded text-[9px] font-mono font-bold text-brand-400">
      <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
      LIVE
    </span>
  );
}

function MetricStrip({ data }: { data: typeof MOCK_TOPOLOGY }) {
  const metrics = [
    { label: "Total Routes", value: data.total_routes.toLocaleString(), icon: GitBranch, color: "text-brand-400" },
    { label: "Active Models", value: String(data.active_models), icon: Cpu, color: "text-purple-400" },
    { label: "Avg Latency", value: `${data.avg_latency_ms} ms`, icon: Clock, color: "text-cyan-400" },
    { label: "Error Rate", value: `${(data.error_rate * 100).toFixed(2)}%`, icon: Activity, color: "text-emerald-400" },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {metrics.map((m) => {
        const Icon = m.icon;
        return (
          <div key={m.label} className="card p-3.5 flex items-center gap-3 hover:border-[#2e2e2e] transition-colors">
            <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.03] border border-[#242424]", m.color)}>
              <Icon size={14} />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-ink-600 uppercase tracking-widest font-medium">{m.label}</div>
              <div className={clsx("text-lg font-bold font-mono tabular-nums leading-none mt-0.5", m.color)}>{m.value}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SeverityBadge({ severity }: { severity: FaultScenario["severity"] }) {
  const cfg = severityConfig(severity);
  return (
    <span className={clsx("inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono font-bold border", cfg.bg, cfg.border, cfg.text)}>
      <span className={clsx("w-1 h-1 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

function FaultCard({
  scenario,
  isActive,
  onClick,
}: {
  scenario: FaultScenario;
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon =
    scenario.id === "redis-node-outage"
      ? ServerCrash
      : scenario.id === "async-client-retries"
      ? RefreshCw
      : scenario.id === "physical-node-crash"
      ? HardDrive
      : Zap;

  return (
    <button
      onClick={onClick}
      className={clsx(
        "w-full text-left p-4 rounded-xl border transition-all duration-200 group",
        isActive
          ? "bg-brand-500/[0.07] border-brand-500/40 shadow-[0_0_20px_rgba(255,184,0,0.06)]"
          : "bg-[#111111] border-[#242424] hover:bg-[#161616] hover:border-[#333333]"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div
          className={clsx(
            "w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 transition-colors",
            isActive
              ? "bg-brand-500/15 border-brand-500/40 text-brand-400"
              : "bg-white/[0.03] border-[#242424] text-ink-400 group-hover:text-ink-200"
          )}
        >
          <Icon size={14} />
        </div>
        <SeverityBadge severity={scenario.severity} />
      </div>
      <div
        className={clsx(
          "text-[13px] font-semibold leading-snug mb-1.5 transition-colors",
          isActive ? "text-brand-400" : "text-ink-200 group-hover:text-ink-50"
        )}
      >
        {scenario.name}
      </div>
      <p className="text-[11px] text-ink-600 leading-relaxed line-clamp-2">{scenario.shortImpact}</p>
      {isActive && (
        <div className="mt-2.5 flex items-center gap-1 text-[10px] text-brand-400 font-mono font-bold">
          <span className="w-1 h-1 rounded-full bg-brand-400 animate-pulse" />
          ACTIVE SCENARIO
        </div>
      )}
    </button>
  );
}

function TopologyMapDark({
  activeActor,
  simStatus,
  currentStep,
}: {
  activeActor: string;
  simStatus: "idle" | "running" | "done";
  currentStep: number;
}) {
  const activeIdx = getActorIndex(activeActor);

  return (
    <div className="rounded-xl border border-[#242424] bg-[#0D0D0D] p-5 relative overflow-hidden">
      {/* Ambient amber glow behind active node */}
      <div
        className="pointer-events-none absolute top-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-brand-500/10 blur-2xl transition-all duration-500"
        style={{ left: `${(activeIdx / 4) * 88 + 4}%` }}
      />

      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-[12px] font-semibold text-ink-200 tracking-tight">Active Topology Vector</h3>
          <p className="text-[10px] text-ink-600 font-mono mt-0.5">Routing Path &amp; Node Interaction Mapping</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={clsx(
              "w-2 h-2 rounded-full",
              simStatus === "running" ? "bg-brand-400 animate-pulse" : simStatus === "done" ? "bg-emerald-400" : "bg-[#333333]"
            )}
          />
          <span className="text-[10px] font-mono text-ink-500 uppercase tracking-wide">
            {simStatus === "running" ? "Simulating" : simStatus === "done" ? "Complete" : "Standby"}
          </span>
        </div>
      </div>

      <div className="relative">
        {/* Connection line */}
        <div className="absolute top-[22px] left-[9%] right-[9%] h-px bg-gradient-to-r from-[#242424] via-brand-500/20 to-[#242424]" />

        {/* Animated signal dot */}
        {simStatus === "running" && (
          <div
            className="absolute top-[18px] w-2 h-2 rounded-full bg-brand-400 shadow-[0_0_8px_rgba(255,184,0,0.8)] transition-all duration-500 z-10"
            style={{
              left: `calc(${(activeIdx / 4) * 82}% + 8%)`,
              transform: "translateX(-50%)",
            }}
          />
        )}

        <div className="relative grid grid-cols-5 gap-2 items-start justify-items-center">
          {TOPOLOGY_ACTORS.map((actor, idx) => {
            const isActive = actor.id === activeActor && simStatus === "running";
            const isPassed = simStatus === "running" && idx < activeIdx;
            const isDone = simStatus === "done";
            const ActorIcon = actor.icon;

            return (
              <div
                key={actor.id}
                className={clsx(
                  "flex flex-col items-center text-center transition-all duration-300",
                  isActive ? "scale-110" : isPassed || isDone ? "opacity-70" : "opacity-40"
                )}
              >
                <div
                  className={clsx(
                    "w-11 h-11 rounded-xl flex items-center justify-center border-2 transition-all duration-300",
                    isActive
                      ? "border-brand-500 bg-brand-500/15 text-brand-400 shadow-[0_0_16px_rgba(255,184,0,0.3)]"
                      : isPassed || isDone
                      ? "border-[#303030] bg-[#1A1A1A] text-ink-400"
                      : "border-[#242424] bg-[#111111] text-ink-600"
                  )}
                >
                  <ActorIcon size={16} />
                </div>
                <span
                  className={clsx(
                    "mt-2 text-[10px] font-medium leading-tight transition-colors",
                    isActive ? "text-brand-400 font-semibold" : "text-ink-500"
                  )}
                >
                  {actor.label}
                </span>
                <span className="text-[8px] font-mono text-ink-600 mt-0.5 uppercase">
                  Node [{String(idx + 1).padStart(2, "0")}]
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-[#1a1a1a] flex flex-wrap gap-3 items-center text-[10px] font-mono text-ink-600">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500/60" />
          API Entry Socket: 3000
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500/60" />
          Handshake Protocol: TCP Async
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60" />
          Validation: IEEE 754
        </span>
        {simStatus === "running" && (
          <span className="ml-auto flex items-center gap-1.5 text-brand-400">
            <Loader2 size={10} className="animate-spin" />
            Step {currentStep} / 6
          </span>
        )}
      </div>
    </div>
  );
}

function StepGrid({
  steps,
  activeStep,
  completedSteps,
  simStatus,
}: {
  steps: ScenarioStep[];
  activeStep: number;
  completedSteps: number[];
  simStatus: "idle" | "running" | "done";
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
      {steps.map((step) => {
        const isActive = step.id === activeStep && simStatus === "running";
        const isComplete = completedSteps.includes(step.id) && !isActive;

        return (
          <div
            key={step.id}
            className={clsx(
              "relative rounded-lg border p-3 transition-all duration-300",
              isActive
                ? "border-brand-500/60 bg-brand-500/[0.06] shadow-[0_0_12px_rgba(255,184,0,0.08)]"
                : isComplete
                ? "border-emerald-700/30 bg-emerald-950/20"
                : "border-[#242424] bg-[#0E0E0E]"
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className={clsx(
                  "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold font-mono border shrink-0",
                  isActive
                    ? "border-brand-500 bg-brand-500/20 text-brand-400"
                    : isComplete
                    ? "border-emerald-600/40 bg-emerald-950/50 text-emerald-400"
                    : "border-[#333333] bg-[#111111] text-ink-600"
                )}
              >
                {isComplete ? <CheckCircle2 size={10} /> : step.id}
              </div>
              {isActive && (
                <span className="text-[8px] font-mono font-bold text-brand-400 uppercase tracking-wider animate-pulse">
                  Active
                </span>
              )}
              {isComplete && (
                <span className="text-[8px] font-mono font-bold text-emerald-500 uppercase tracking-wider">
                  Done
                </span>
              )}
            </div>
            <h4
              className={clsx(
                "text-[11px] font-semibold leading-snug mb-1",
                isActive ? "text-brand-400" : isComplete ? "text-ink-300" : "text-ink-600"
              )}
            >
              {step.title}
            </h4>
            <p
              className={clsx(
                "text-[10px] leading-relaxed",
                isActive ? "text-ink-300" : isComplete ? "text-ink-500" : "text-ink-700"
              )}
            >
              {step.description}
            </p>
            <div
              className={clsx(
                "mt-2 text-[9px] font-mono font-bold uppercase tracking-wider",
                isActive ? "text-brand-500" : isComplete ? "text-emerald-600" : "text-ink-700"
              )}
            >
              &#8627; {step.actor}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SliderControl({
  param,
  value,
  onChange,
}: {
  param: SimParameter;
  value: number;
  onChange: (id: string, value: number) => void;
}) {
  const pct = ((value - param.min) / (param.max - param.min)) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[11px] text-ink-400 font-medium leading-snug max-w-[140px]">{param.name}</label>
        <span className="text-[11px] font-mono font-bold text-brand-400 shrink-0">
          {value}
          <span className="text-ink-600 font-normal"> {param.unit}</span>
        </span>
      </div>
      <input
        type="range"
        min={param.min}
        max={param.max}
        value={value}
        onChange={(e) => onChange(param.id, Number(e.target.value))}
        className="w-full h-1.5 appearance-none rounded-full outline-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #FFB800 0%, #FFB800 ${pct}%, #222222 ${pct}%, #222222 100%)`,
        }}
      />
      <p className="text-[10px] text-ink-700 leading-relaxed">{param.description}</p>
    </div>
  );
}

function CodeKernel({ code }: { code: string }) {
  return (
    <div className="rounded-xl overflow-hidden border border-[#242424]">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#0A0A0A] border-b border-[#1a1a1a]">
        <Code2 size={12} className="text-ink-600" />
        <span className="text-[10px] font-mono text-ink-600 uppercase tracking-widest">Mitigation Layout Kernel</span>
        <div className="ml-auto flex gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2a2a2a]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#2a2a2a]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#2a2a2a]" />
        </div>
      </div>
      <pre className="bg-black px-5 py-4 overflow-x-auto text-[11.5px] font-mono text-amber-300 leading-relaxed whitespace-pre">
        {code}
      </pre>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RoutingFaultMatrixPage() {
  const [selectedId, setSelectedId] = useState<string>(FAULT_MATRIX_DATA[0].id);
  const [paramValues, setParamValues] = useState<Record<string, number>>({});
  const [simStatus, setSimStatus] = useState<"idle" | "running" | "done">("idle");
  const [activeStep, setActiveStep] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [simSpeed, setSimSpeed] = useState<number>(1800);
  const simRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scenario = FAULT_MATRIX_DATA.find((s) => s.id === selectedId)!;

  // SWR — falls back to mock on error
  const { data: topologyData } = useSWR<typeof MOCK_TOPOLOGY>(
    "/api/v1/routing/topology",
    fetcher,
    { refreshInterval: 2000, fallbackData: MOCK_TOPOLOGY }
  );
  const metrics = topologyData ?? MOCK_TOPOLOGY;

  // Re-initialize params when scenario changes
  useEffect(() => {
    const init: Record<string, number> = {};
    scenario.parameters.forEach((p) => {
      init[p.id] = p.value;
    });
    setParamValues(init);
    resetSim();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const resetSim = useCallback(() => {
    if (simRef.current) clearTimeout(simRef.current);
    setSimStatus("idle");
    setActiveStep(0);
    setCompletedSteps([]);
  }, []);

  const runSim = useCallback(() => {
    if (simRef.current) clearTimeout(simRef.current);
    setCompletedSteps([]);
    setActiveStep(0);
    setSimStatus("running");

    const steps = scenario.scenarioSteps;
    const runStep = (idx: number) => {
      if (idx >= steps.length) {
        setSimStatus("done");
        setActiveStep(0);
        return;
      }
      setActiveStep(steps[idx].id);
      simRef.current = setTimeout(() => {
        setCompletedSteps((prev) => [...prev, steps[idx].id]);
        runStep(idx + 1);
      }, simSpeed);
    };
    runStep(0);
  }, [scenario.scenarioSteps, simSpeed]);

  const haltSim = useCallback(() => {
    if (simRef.current) clearTimeout(simRef.current);
    setSimStatus("idle");
  }, []);

  useEffect(() => () => { if (simRef.current) clearTimeout(simRef.current); }, []);

  const handleParam = (id: string, val: number) =>
    setParamValues((prev) => ({ ...prev, [id]: val }));

  const activeActor =
    simStatus === "running"
      ? (scenario.scenarioSteps.find((s) => s.id === activeStep)?.actor ?? "Client")
      : "Client";

  const prognosis = calcPrognosis(scenario, paramValues);

  const speedOptions = [
    { label: "0.5×", value: 3600 },
    { label: "1×", value: 1800 },
    { label: "2×", value: 900 },
    { label: "3×", value: 600 },
  ];

  return (
    <Shell>
      <div className="min-h-full">
        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-ink-600 mb-2 uppercase tracking-widest">
              <span>Operations</span>
              <ChevronRight size={10} />
              <span>Routing</span>
              <ChevronRight size={10} />
              <span className="text-brand-400">Fault Matrix</span>
            </div>
            <h1 className="text-2xl font-bold text-ink-50 tracking-tight">
              Routing{" "}
              <span className="text-brand-400">&amp;</span>{" "}
              Gradient Field Fault Matrix
            </h1>
            <p className="mt-1.5 text-sm text-ink-400 max-w-xl">
              Deterministic incident simulation for distributed lock, Redis outage, and worker fault scenarios. Step-by-step runbook walkthrough with parametric controls.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <LiveBadge />
            <span className="flex items-center gap-1.5 bg-[#151515] border border-[#242424] px-2.5 py-1 rounded text-[9px] font-mono font-bold text-purple-400">
              <Radio size={9} />
              FAULT MATRIX v2.4
            </span>
          </div>
        </div>

        {/* ── Live metrics strip ── */}
        <MetricStrip data={metrics} />

        {/* ── Main layout ── */}
        <div className="flex flex-col xl:flex-row gap-5">

          {/* ── LEFT RAIL: Fault scenario selector ── */}
          <div className="xl:w-[30%] xl:max-w-[340px] xl:shrink-0 space-y-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <h2 className="text-[11px] font-bold text-ink-400 uppercase tracking-[0.16em]">
                Fault Scenarios
              </h2>
              <span className="text-[10px] font-mono text-ink-700">{FAULT_MATRIX_DATA.length} scenarios</span>
            </div>

            {FAULT_MATRIX_DATA.map((sc) => (
              <FaultCard
                key={sc.id}
                scenario={sc}
                isActive={sc.id === selectedId}
                onClick={() => setSelectedId(sc.id)}
              />
            ))}

            {/* System Resiliency Forecast */}
            <div className="mt-2 rounded-xl border border-[#242424] bg-[#0D0D0D] p-4">
              <div className="flex items-center gap-2 mb-3">
                <Gauge size={13} className="text-brand-400" />
                <span className="text-[10px] font-bold text-ink-400 uppercase tracking-widest">
                  Resiliency Forecast
                </span>
              </div>
              <div className={clsx("text-base font-bold font-mono mb-1", prognosis.color)}>
                {prognosis.label}
              </div>
              <p className="text-[11px] text-ink-500 leading-relaxed">{prognosis.detail}</p>
              <div className="mt-3 pt-3 border-t border-[#1a1a1a] space-y-1.5">
                {[
                  { k: "Component", v: scenario.componentAffected },
                  { k: "Lock type", v: scenario.lockType },
                  { k: "Recovery TTL", v: scenario.recoveryTtl },
                ].map(({ k, v }) => (
                  <div key={k} className="text-[10px] text-ink-600">
                    <span className="text-ink-500">{k}:</span>{" "}
                    <span className="font-mono text-ink-400">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── MAIN WORKSPACE ── */}
          <div className="flex-1 min-w-0 space-y-5">
            {/* Scenario title bar + controls */}
            <div className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <SeverityBadge severity={scenario.severity} />
                <div className="min-w-0">
                  <h2 className="text-[15px] font-bold text-ink-50 leading-snug">{scenario.name}</h2>
                  <p className="text-[11px] text-ink-500 mt-0.5 leading-relaxed">{scenario.immediateImpact}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                {/* Speed */}
                <div className="flex items-center gap-0.5 bg-[#111111] border border-[#242424] rounded-lg p-1">
                  {speedOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSimSpeed(opt.value)}
                      className={clsx(
                        "px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors",
                        simSpeed === opt.value
                          ? "bg-brand-500/20 text-brand-400"
                          : "text-ink-600 hover:text-ink-400"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {/* Run / Halt */}
                {simStatus !== "running" ? (
                  <button
                    onClick={runSim}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-[12px] font-bold transition-colors shadow-[0_0_12px_rgba(255,184,0,0.2)]"
                  >
                    <Play size={12} fill="currentColor" />
                    {simStatus === "done" ? "Replay" : "Run Simulation"}
                  </button>
                ) : (
                  <button
                    onClick={haltSim}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-900/60 hover:bg-red-800/80 text-red-300 text-[12px] font-bold border border-red-700/40 transition-colors"
                  >
                    <Square size={12} fill="currentColor" />
                    Halt
                  </button>
                )}
                <button
                  onClick={resetSim}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1a1a1a] hover:bg-[#222222] text-ink-400 hover:text-ink-200 text-[12px] font-medium border border-[#242424] transition-colors"
                >
                  <RotateCcw size={12} />
                  Reset
                </button>
              </div>
            </div>

            {/* Active Topology Map */}
            <TopologyMapDark
              activeActor={activeActor}
              simStatus={simStatus}
              currentStep={activeStep}
            />

            {/* Steps + Parametric controls */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5">
              {/* Step sequence */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[11px] font-bold text-ink-400 uppercase tracking-[0.16em]">
                    Deterministic Incident Sequence
                  </h3>
                  {simStatus === "done" && (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                      <CheckCircle2 size={10} />
                      Sequence Complete
                    </span>
                  )}
                </div>
                <StepGrid
                  steps={scenario.scenarioSteps}
                  activeStep={activeStep}
                  completedSteps={completedSteps}
                  simStatus={simStatus}
                />
              </div>

              {/* Parametric Controls sidebar */}
              <div className="rounded-xl border border-[#242424] bg-[#0D0D0D] p-4 self-start">
                <div className="flex items-center gap-2 mb-4">
                  <Activity size={12} className="text-brand-400" />
                  <span className="text-[10px] font-bold text-ink-400 uppercase tracking-widest">
                    Parametric Controls
                  </span>
                </div>
                <div className="space-y-5">
                  {scenario.parameters.map((param) => (
                    <SliderControl
                      key={param.id}
                      param={param}
                      value={paramValues[param.id] ?? param.value}
                      onChange={handleParam}
                    />
                  ))}
                </div>

                <div className="mt-5 pt-4 border-t border-[#1a1a1a]">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={11} className="text-brand-400" />
                    <span className="text-[10px] font-bold text-ink-500 uppercase tracking-widest">
                      Mitigation
                    </span>
                  </div>
                  <p className="text-[10.5px] text-ink-600 leading-relaxed">
                    {scenario.mitigationArchitecture}
                  </p>
                </div>
              </div>
            </div>

            {/* Code kernel */}
            <CodeKernel code={scenario.codeReference} />
          </div>
        </div>
      </div>

      {/* Slider thumb polish */}
      <style jsx global>{`
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #FFB800;
          border: 2px solid #0A0A0A;
          box-shadow: 0 0 6px rgba(255,184,0,0.5);
          cursor: pointer;
          transition: box-shadow 0.15s;
        }
        input[type='range']::-webkit-slider-thumb:hover {
          box-shadow: 0 0 10px rgba(255,184,0,0.85);
        }
        input[type='range']::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #FFB800;
          border: 2px solid #0A0A0A;
          box-shadow: 0 0 6px rgba(255,184,0,0.5);
          cursor: pointer;
        }
      `}</style>
    </Shell>
  );
}
