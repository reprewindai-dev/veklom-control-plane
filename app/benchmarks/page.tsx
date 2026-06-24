"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Shield,
  Activity,
  BarChart2,
  Cpu,
  Terminal,
  Server,
  Network,
  Fingerprint,
  Lock,
  ArrowRight,
  TrendingUp,
  Wallet,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  DollarSign,
  Users,
  Globe,

  ChevronDown,
  ChevronUp,
} from "lucide-react";
import useSWR from "swr";
import { api, fetcher } from "@/lib/api";
import { motion, AnimatePresence } from "motion/react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
  BarChart as RBarChart,
  Bar,
  Cell,
} from "recharts";
import {
  buildProviderBondView,
  latencyDensityCurve,
  multiAnchorConsensus,
  verifierWeight,
  computeEpochSettlement,
  currentEpoch,
  logNormalParams,
  VNP_PARAMS,
} from "@/lib/vnp/engine";
import type {
  ProviderBondView,
  EpochSettlement,
  VerifierNode,
  BondStatusLevel,
} from "@/lib/vnp/types";

// ============ Types ============
interface BenchApi {
  id: string;
  name: string;
  category: string;
  p50: number;
  p95: number;
  p99: number;
  sla: number;
  drift: number;
  sovereignTier: number;
  complianceLabels: string[];
  govScore: number;
  devScore: number;
  endpointUrl?: string | null;
  description?: string | null;
  mcpSchema?: Record<string, unknown> | null;
  provider?: string | null;
  throughput: number;
  uptime24h: number;
  totalStaked: number;
  status: string;
}

import { ApiState, AlertConfig, AlertLog, AuditLog } from "@/components/vnp/types";
import BenchmarkPanel from "@/components/vnp/BenchmarkPanel";
import K8sAutoscalingPanel from "@/components/vnp/K8sAutoscalingPanel";
import RBACPanel from "@/components/vnp/RBACPanel";
import TopologyPanel from "@/components/vnp/TopologyPanel";
import StakesPanel from "@/components/vnp/StakesPanel";
import SpecPanel from "@/components/vnp/SpecPanel";
import AlertPanel from "@/components/vnp/AlertPanel";
import RbacPanel from "@/components/vnp/RbacPanel";
import AiAdvisorPanel from "@/components/vnp/AiAdvisorPanel";
import NetworkTopologyPanel from "@/components/vnp/NetworkTopologyPanel";

export default function App() {
  const [activeTab, setActiveTab] = useState<"benchmark" | "k8s" | "spec" | "rbac" | "alerts" | "advisor" | "topology" | "stakes">("topology");
  
  // States loaded from backend REST Endpoints
  const [apis, setApis] = useState<ApiState[]>([]);
  const [trustBeacon, setTrustBeacon] = useState("");
  const [blockAnchored, setBlockAnchored] = useState(0);
  const [alertConfigs, setAlertConfigs] = useState<AlertConfig[]>([]);
  const [alertLogs, setAlertLogs] = useState<AlertLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  
  // Front-end UI overlay state (e.g. alerts flash box)
  const [criticalToast, setCriticalToast] = useState<string | null>(null);

  // States for Left Sidebar Real-Time Telemetry Stream
  const [liveFeedLogs, setLiveFeedLogs] = useState<Array<{ id: string; type: "MEASUREMENT" | "ANCHOR" | "SCORE UPDATE"; text: string }>>([
    { id: "37c5b55e37c5d44d", type: "MEASUREMENT", text: "[US-E] GPT-4o - p99: 148.7ms, avail: 99.60%, err: 0.13%" },
    { id: "0eecaf0c0fec901d", type: "MEASUREMENT", text: "[AP-NE] Llama 3 70B (Groq) - p99: 237.9ms, avail: 99.62%, err: 0.13%" },
    { id: "25abe96a25ac0859", type: "ANCHOR", text: "[Epoch] epoch-anthropic-1782183600000 - root: 25abe96a25ac... (811 records)" },
    { id: "780abaf780a9c06c", type: "SCORE UPDATE", text: "[VNP] Sovereign Authority Runtime - AA 89.3, 38,063 measurements, ±0.1" },
    { id: "38be7df838be5f09", type: "MEASUREMENT", text: "[US-W] Financial Data Plane (VFDP) - p99: 73.3ms, avail: 99.93%, err: 0.00%" },
    { id: "6043d1316043f07d", type: "MEASUREMENT", text: "[US-E] Sovereign Operator Registry - p99: 45.0ms, avail: 99.67%, err: 0.07%" },
    { id: "49aeef8949aeef83", type: "MEASUREMENT", text: "[EU-W] Llama 3 Deepseek Core - p99: 412.1ms, avail: 99.92%, err: 0.05%" }
  ]);

const fmtUSD = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
const fmtMs = (n: number) => `${n.toFixed(1)}ms`;

const STATUS_COLORS: Record<BondStatusLevel, { bg: string; border: string; text: string; label: string }> = {
  healthy: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", label: "Healthy" },
  warning: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", label: "Warning" },
  breaching: { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400", label: "Breaching" },
  critical: { bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-400", label: "Critical" },
};

// ============ Mock M2M Terminal Data ============
const generateSHA = () =>
  Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");

  const fetchAlertLogs = async () => {
    try {
      const res = await fetch("/api/vnp/alerts/triggered");
      const data = await res.json();
      
      // If a new alert has been triggered, flash a critical alert banner to system administrators!
      if (data.length > 0 && alertLogs.length > 0 && data[0].id !== alertLogs[0].id) {
        setCriticalToast(`⚠️ Node Violation: ${data[0].apiName} exceeded tolerance limit in region ${data[0].region.toUpperCase()}!`);
        setTimeout(() => setCriticalToast(null), 5000);
      }
      
      setAlertLogs(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch("/api/vnp/audit-logs");
      const data = await res.json();
      setAuditLogs(data);
    } catch (e) {
      console.error(e);
    }
  };

  // Run on mount
  useEffect(() => {
    fetchTelemetry();
    fetchAlertConfigs();
    fetchAlertLogs();
    fetchAuditLogs();

    // Establish a high-frequency polling interval to simulate live distributed probing
    const interval = setInterval(() => {
      fetchTelemetry(true);
      fetchAlertLogs();
    }, 7000);

    // Dynamic, organic real-time streaming feed updates
    const streamTemplates = [
      { type: "MEASUREMENT" as const, text: "[US-E] Gemini 3.5 Flash - p99: 92.5ms, avail: 99.99%, err: 0.01%" },
      { type: "MEASUREMENT" as const, text: "[EU-W] Llama 3 Deepseek Core - p99: 412.1ms, avail: 99.92%, err: 0.05%" },
      { type: "ANCHOR" as const, text: "[Epoch] epoch-cappi-gateway-178219010000 - root: 68c3784... (455 records)" },
      { type: "SCORE UPDATE" as const, text: "[VNP] Veklom Sovereign AI Hub - AAA 98.9, 81,114 measurements, ±0.05" },
      { type: "MEASUREMENT" as const, text: "[AP-SE] Coinbase API (CAPI) Gateway - p99: 125.4ms, avail: 99.94%, err: 0.02%" },
      { type: "MEASUREMENT" as const, text: "[US-W] Base.org Swarm Debate Engine - p99: 64.1ms, avail: 99.97%, err: 0.00%" },
      { type: "MEASUREMENT" as const, text: "[US-E] MCPAPI v2.0 Global Router - p99: 104.9ms, avail: 99.90%, err: 0.10%" }
    ];

    const feedInterval = setInterval(() => {
      const randomTpl = streamTemplates[Math.floor(Math.random() * streamTemplates.length)];
      
      // Slightly randomize values in the string for a live dynamic feeling
      let customText = randomTpl.text;
      if (randomTpl.type === "MEASUREMENT") {
        const latMatch = randomTpl.text.match(/p99:\s*([\d.]+)ms/);
        if (latMatch) {
          const origLat = parseFloat(latMatch[1]);
          const drift = (Math.random() - 0.5) * 12; // move +/- 6ms
          const newLat = Math.max(15, origLat + drift).toFixed(1);
          customText = randomTpl.text.replace(/p99:\s*[\d.]+ms/, `p99: ${newLat}ms`);
        }
      }

// ============ Verifier Seed Data ============
// Derived from real measurement infrastructure regions
const VERIFIER_REGIONS = ["us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1", "ap-northeast-1"];
const VERIFIER_ASNS = ["AS16509", "AS15169", "AS13335", "AS24940", "AS14061"];

function buildVerifierNodes(apis: BenchApi[]): VerifierNode[] {
  return VERIFIER_REGIONS.map((region, i) => {
    const baseStake = 5000 + i * 1000;
    const baseRep = 80 + Math.floor(apis.length * 2.5);
    const diversity = 0.7 + i * 0.06;
    const rep = Math.min(100, baseRep);
    return {
      address: `0x${(0xA1 + i).toString(16).padStart(2, "0")}...${generateSHA().substring(0, 8)}`,
      stake: baseStake,
      reputation: rep,
      diversityScore: Math.round(diversity * 100) / 100,
      weight: Math.round(verifierWeight(baseStake, rep, diversity)),
      region,
      asn: VERIFIER_ASNS[i],
      measurementCount: 1000 + apis.length * 50 + i * 200,
      accuracy: 95 + Math.min(4, i * 0.8),
      active: true,
    };
  });
}

// ============ Page ============
function NexusConsoleInner() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as "trust" | "staking" | "consensus") || "trust";
  const [activeTab, setActiveTab] = useState<"trust" | "staking" | "consensus">(initialTab);

  useEffect(() => {
    const tab = searchParams.get("tab") as "trust" | "staking" | "consensus";
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // ---- Data Fetching ----
  const { data: lbData, isLoading: lbLoading } = useSWR<BenchApi[]>(
    "/api/v1/benchmarks/leaderboard",
    fetcher,
    { refreshInterval: 8000 },
  );
  const { data: marketData, mutate: mutateMarkets } = useSWR<StakingMarket[]>(
    "/api/v1/benchmarks/staking/markets",
    fetcher,
    { refreshInterval: 10000 },
  );

  const apis = useMemo(() => {
    const list = Array.isArray(lbData) ? lbData : [];
    return [...list]
      .map((a) => ({ api: a, pillars: pillarsFor(a) }))
      .sort((x, y) => y.pillars.trust - x.pillars.trust);
  }, [lbData]);

  const markets = Array.isArray(marketData) ? marketData : [];

  // ---- VNP Stakes Engine Computed State ----
  const providers = useMemo<ProviderBondView[]>(() => {
    return apis.map(({ api: a }) => buildProviderBondView(a));
  }, [apis]);

  const protocolStats = useMemo(() => {
    const totalValueBonded = providers.reduce((s, p) => s + p.bondAmountUsdc, 0);
    const totalPenalties = providers.reduce((s, p) => s + p.deviation.penaltyUsdc, 0);
    const healthyCount = providers.filter((p) => p.status === "healthy" || p.status === "warning").length;
    const rate = providers.length > 0 ? (healthyCount / providers.length) * 100 : 100;
    return {
      totalValueBonded,
      activeApis: providers.length,
      activeVerifiers: VERIFIER_REGIONS.length,
      totalPenalties,
      settlementRate: Math.round(rate * 10) / 10,
      epochsProcessed: currentEpoch(),
    };
  }, [providers]);

  const settlements = useMemo<EpochSettlement[]>(() => {
    const ep = currentEpoch();
    return providers.map((p) =>
      computeEpochSettlement(
        p.apiId,
        p.name,
        p.targetP95Ms,
        p.observedP95Ms,
        p.sigmaMs,
        p.bondAmountUsdc,
        ep,
      ),
    );
  }, [providers]);

  const verifiers = useMemo(() => {
    return buildVerifierNodes(apis.map((a) => a.api));
  }, [apis]);

  // ---- Staking State ----
  const [selectedMarketId, setSelectedMarketId] = useState<string>("");
  const [stakeAmount, setStakeAmount] = useState<string>("10");
  const [stakeOutcome, setStakeOutcome] = useState<"YES" | "NO">("YES");
  const [stakePending, setStakePending] = useState(false);
  const [stakeResult, setStakeResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [expandedBond, setExpandedBond] = useState<string | null>(null);

  // ---- Consensus State ----
  const [selectedKdeApiId, setSelectedKdeApiId] = useState<string>("");

  useEffect(() => {
    if (apis.length > 0 && !selectedKdeApiId) {
      setSelectedKdeApiId(apis[0].api.id);
    }
  }, [apis, selectedKdeApiId]);

  useEffect(() => {
    if (markets.length > 0 && !selectedMarketId) {
      setSelectedMarketId(markets[0].id);
    }
  }, [markets, selectedMarketId]);

  // ---- KDE for selected API ----
  const kdeData = useMemo(() => {
    const a = apis.find((x) => x.api.id === selectedKdeApiId)?.api;
    if (!a) return null;
    const curve = latencyDensityCurve(a.p50, a.p95);
    const { mu, sigma } = logNormalParams(a.p50, a.p95);
    const historicalP95 = a.p95 * (1 - a.drift * 0.01);
    const shadowP95 = a.p95 * 0.98;
    const consensus = multiAnchorConsensus(curve.mode, historicalP95, shadowP95);
    return { curve, consensus, api: a };
  }, [apis, selectedKdeApiId]);

  // ---- Stake Handler ----
  const handleStake = useCallback(async () => {
    if (!selectedMarketId || stakePending) return;
    const amount = parseFloat(stakeAmount);
    if (!amount || amount <= 0) {
      setStakeResult({ ok: false, msg: "Enter a valid amount" });
      return;
    }
    setStakePending(true);
    setStakeResult(null);
    try {
      const res = await api<{ success: boolean; new_balance: number; volume: number; yesPrice: number; noPrice: number }>(
        "/api/v1/benchmarks/staking/stake",
        { body: { market_id: selectedMarketId, outcome: stakeOutcome, amount } },
      );
      setStakeResult({ ok: true, msg: `Staked $${amount.toFixed(2)} on ${stakeOutcome}. New balance: $${res.new_balance.toFixed(2)}` });
      mutateMarkets();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Stake failed";
      setStakeResult({ ok: false, msg });
    } finally {
      setStakePending(false);
    }
  }, [selectedMarketId, stakeAmount, stakeOutcome, stakePending, mutateMarkets]);

  if (lbLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center font-mono">
        <Cpu className="w-12 h-12 text-[#FFB800] animate-pulse mb-6" />
        <div className="text-[#FFB800] tracking-widest text-sm">
          INITIALIZING NEXUS PROTOCOL...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col xl:flex-row h-screen bg-[#0A0A0A] text-white font-sans overflow-hidden selection:bg-[#FFB800]/30">
      {/* Left Panel: PGL Terminal */}
      <div className="hidden xl:flex flex-col w-[400px] border-r border-[#1A1A1A] bg-[#050505] z-10">
        <M2MTerminal apis={apis.map((a) => a.api)} />
      </div>

      {/* Right Panel: Interactive Console */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#FFB800]/5 rounded-full blur-[150px] pointer-events-none" />

        {/* Header */}
        <header className="px-8 py-10 border-b border-[#1A1A1A] relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-2 py-0.5 rounded-sm bg-[#FFB800] text-black font-mono text-[10px] font-bold tracking-widest uppercase">
              Core Module
            </span>
            <span className="text-[#A1A1A6] font-mono text-xs uppercase tracking-widest">
              v2.1.0-sovereign
            </span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-medium tracking-tight mb-3">
            Veklom Nexus Protocol
          </h1>
          <p className="text-[#A1A1A6] max-w-2xl text-sm leading-relaxed">
            The mathematically undisputable trust and capability router. APIs are benchmarked,
            cryptographically verified, and continuously evaluated for sovereign deployment.
          </p>

          <div className="flex gap-1 mt-10 p-1 bg-[#111111] border border-[#1A1A1A] rounded-lg w-fit">
            {[
              { id: "trust", label: "Trust Node Matrix", icon: Shield },
              { id: "staking", label: "Staking Protocol", icon: BarChart2 },
              { id: "consensus", label: "Consensus Vector", icon: Network },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as "trust" | "staking" | "consensus")}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-[#1A1A1A] text-[#FFB800] shadow-lg border border-[#FFB800]/20"
                    : "text-[#A1A1A6] hover:text-white hover:bg-[#1A1A1A]/50"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar relative z-10">
          <AnimatePresence mode="wait">
            {/* ==================== TRUST TAB ==================== */}
            {activeTab === "trust" && (
              <motion.div
                key="trust"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {apis.map(({ api: a, pillars }) => (
                  <div
                    key={a.id}
                    className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-6 hover:border-[#FFB800]/30 transition-all group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Server className="w-32 h-32 text-[#FFB800]" />
                    </div>

                    <div className="flex justify-between items-start mb-6 relative z-10">
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-1">{a.name}</h3>
                        <div className="text-xs font-mono text-[#A1A1A6] uppercase tracking-widest">
                          {a.provider || "Veklom Network"}
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="text-3xl font-light text-[#FFB800]">{pillars.trust}</div>
                        <div className="text-[10px] font-mono text-[#FFB800]/50 uppercase tracking-widest">
                          Trust Index
                        </div>
                      </div>
                    </div>

                    <div className="w-full h-40 mb-6 relative z-10">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart
                          cx="50%"
                          cy="50%"
                          outerRadius="70%"
                          data={[
                            { subject: "Gov", A: pillars.security, fullMark: 100 },
                            { subject: "Dev", A: pillars.performance, fullMark: 100 },
                            { subject: "Comp", A: pillars.compliance, fullMark: 100 },
                            { subject: "SLA", A: a.sla, fullMark: 100 },
                          ]}
                        >
                          <PolarGrid stroke="#1A1A1A" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: "#A1A1A6", fontSize: 10 }} />
                          <Radar name="Capabilities" dataKey="A" stroke="#FFB800" strokeWidth={1.5} fill="#FFB800" fillOpacity={0.1} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
                      <div>
                        <div className="text-[10px] font-mono text-[#A1A1A6] uppercase mb-1">Latency p95</div>
                        <div className="text-sm">{fmtMs(a.p95)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono text-[#A1A1A6] uppercase mb-1">Throughput</div>
                        <div className="text-sm">{Math.round(a.throughput)} req/s</div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#1A1A1A] flex flex-wrap gap-2 relative z-10">
                      {a.complianceLabels.map((lbl) => (
                        <span key={lbl} className="px-2 py-1 bg-[#1A1A1A] border border-[#333333] text-[#A1A1A6] text-[10px] uppercase font-mono rounded">
                          {lbl}
                        </span>
                      ))}
                      <span className="px-2 py-1 bg-[#FFB800]/10 border border-[#FFB800]/20 text-[#FFB800] text-[10px] uppercase font-mono rounded">
                        Tier {a.sovereignTier}
                      </span>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* ==================== STAKING PROTOCOL TAB ==================== */}
            {activeTab === "staking" && (
              <motion.div
                key="staking"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Protocol Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  {[
                    { label: "Total Value Bonded", value: fmtUSD(protocolStats.totalValueBonded), icon: Wallet, color: "text-[#FFB800]" },
                    { label: "Active APIs", value: String(protocolStats.activeApis), icon: Server, color: "text-cyan-400" },
                    { label: "Active Verifiers", value: String(protocolStats.activeVerifiers), icon: Users, color: "text-violet-400" },
                    { label: "Settlement Rate", value: `${protocolStats.settlementRate}%`, icon: CheckCircle, color: "text-emerald-400" },
                    { label: "Total Penalties", value: fmtUSD(protocolStats.totalPenalties), icon: AlertTriangle, color: "text-rose-400" },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <stat.icon className={`w-4 h-4 ${stat.color}`} />
                        <span className="text-[10px] font-mono uppercase tracking-widest text-[#A1A1A6]">{stat.label}</span>
                      </div>
                      <div className={`text-2xl font-medium ${stat.color}`}>{stat.value}</div>
                    </div>
                  ))}
                </div>

                {/* Continuous Slashing Function */}
                <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <Zap className="w-4 h-4 text-[#FFB800]" />
                    <span className="text-xs font-mono uppercase tracking-widest text-[#A1A1A6]">Continuous Slashing Function</span>
                  </div>
                  <div className="font-mono text-sm text-white/90 bg-[#111111] border border-[#1A1A1A] rounded-lg px-4 py-3">
                    <span className="text-[#FFB800]">Penalty(t)</span> ={" "}
                    <span className="text-[#A1A1A6]">{"{"}</span>{" "}
                    <span className="text-emerald-400">0</span>{" "}
                    <span className="text-[#A1A1A6]">if</span>{" "}
                    |S<sub>o</sub>(t) - S<sub>p</sub>| {"<="} k{"*"}&sigma;(t) ;{" "}
                    <span className="text-rose-400">&lambda;</span> {"*"} (|S<sub>o</sub>(t) - S<sub>p</sub>| - k{"*"}&sigma;(t)){" "}
                    <span className="text-[#A1A1A6]">otherwise {"}"}</span>
                    <span className="text-[#A1A1A6] ml-4">{"// k="}{VNP_PARAMS.k}{", λ="}{VNP_PARAMS.lambda}</span>
                  </div>
                </div>

                {/* Provider Bond Registry */}
                <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-[#1A1A1A] bg-[#111111] flex items-center gap-3">
                    <Lock className="w-4 h-4 text-[#FFB800]" />
                    <span className="text-sm font-semibold text-white">Provider Bond Registry</span>
                    <span className="text-[10px] font-mono text-[#A1A1A6] ml-auto">USDC Performance Bonds</span>
                  </div>
                  <div className="hidden lg:grid grid-cols-12 gap-2 px-5 py-3 border-b border-[#1A1A1A] text-[10px] font-mono uppercase tracking-widest text-[#A1A1A6]">
                    <div className="col-span-3">API / Provider</div>
                    <div className="col-span-2 text-right">Target p95</div>
                    <div className="col-span-2 text-right">Observed p95</div>
                    <div className="col-span-2 text-center">Deviation</div>
                    <div className="col-span-1 text-center">Status</div>
                    <div className="col-span-1 text-right">Bond</div>
                    <div className="col-span-1 text-right">Penalty/Ep</div>
                  </div>

                  <div className="divide-y divide-[#1A1A1A]">
                    {providers.map((p) => {
                      const sc = STATUS_COLORS[p.status];
                      const devPct = p.deviation.toleranceMs > 0 ? Math.min(100, (p.deviation.deviationMs / p.deviation.toleranceMs) * 100) : 0;
                      const isExpanded = expandedBond === p.apiId;

                      return (
                        <div key={p.apiId}>
                          <button
                            onClick={() => setExpandedBond(isExpanded ? null : p.apiId)}
                            className="w-full grid grid-cols-1 lg:grid-cols-12 gap-2 px-5 py-4 items-center hover:bg-[#111111] transition-colors text-left"
                          >
                            <div className="col-span-3">
                              <div className="text-sm text-white font-medium">{p.name}</div>
                              <div className="text-[10px] font-mono text-[#A1A1A6]">{p.provider}</div>
                            </div>
                            <div className="col-span-2 text-right font-mono text-sm text-[#A1A1A6]">{fmtMs(p.targetP95Ms)}</div>
                            <div className="col-span-2 text-right font-mono text-sm text-white">{fmtMs(p.observedP95Ms)}</div>
                            <div className="col-span-2 px-2">
                              <div className="h-1.5 w-full bg-[#333333] rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    devPct < 50 ? "bg-emerald-500" : devPct < 80 ? "bg-amber-500" : "bg-rose-500"
                                  }`}
                                  style={{ width: `${Math.min(100, devPct)}%` }}
                                />
                              </div>
                              <div className="text-[9px] font-mono text-[#A1A1A6] mt-1 text-center">
                                {fmtMs(p.deviation.deviationMs)} / {fmtMs(p.deviation.toleranceMs)}
                              </div>
                            </div>
                            <div className="col-span-1 text-center">
                              <span className={`px-2 py-1 rounded text-[9px] uppercase font-mono ${sc.bg} ${sc.border} ${sc.text} border`}>
                                {sc.label}
                              </span>
                            </div>
                            <div className="col-span-1 text-right font-mono text-sm text-[#FFB800]">{fmtUSD(p.bondAmountUsdc)}</div>
                            <div className="col-span-1 text-right">
                              <span className={`font-mono text-sm ${p.deviation.penaltyUsdc > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                                {p.deviation.penaltyUsdc > 0 ? `-$${p.deviation.penaltyUsdc.toFixed(2)}` : "$0.00"}
                              </span>
                              {isExpanded ? <ChevronUp className="w-3 h-3 text-[#A1A1A6] inline ml-1" /> : <ChevronDown className="w-3 h-3 text-[#A1A1A6] inline ml-1" />}
                            </div>
                          </button>

                          {/* Expanded Details */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="px-5 pb-4 grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#0A0A0A]">
                                  <div className="bg-[#111111] border border-[#1A1A1A] rounded-lg p-4">
                                    <div className="text-[10px] font-mono text-[#A1A1A6] uppercase mb-2">Deviation Breakdown</div>
                                    <div className="space-y-1 font-mono text-xs">
                                      <div className="flex justify-between"><span className="text-[#A1A1A6]">|S_o - S_p|</span><span className="text-white">{fmtMs(p.deviation.deviationMs)}</span></div>
                                      <div className="flex justify-between"><span className="text-[#A1A1A6]">k * &sigma;</span><span className="text-white">{fmtMs(p.deviation.toleranceMs)}</span></div>
                                      <div className="flex justify-between"><span className="text-[#A1A1A6]">Excess</span><span className={p.deviation.excessMs > 0 ? "text-rose-400" : "text-emerald-400"}>{fmtMs(p.deviation.excessMs)}</span></div>
                                      <div className="flex justify-between"><span className="text-[#A1A1A6]">&sigma; (estimated)</span><span className="text-white">{fmtMs(p.sigmaMs)}</span></div>
                                    </div>
                                  </div>
                                  <div className="bg-[#111111] border border-[#1A1A1A] rounded-lg p-4">
                                    <div className="text-[10px] font-mono text-[#A1A1A6] uppercase mb-2">Multi-Anchor Consensus</div>
                                    <div className="space-y-1 font-mono text-xs">
                                      <div className="flex justify-between"><span className="text-[#A1A1A6]">KDE Mode (w={p.consensus.weights.kde})</span><span className="text-cyan-400">{fmtMs(p.consensus.kdeMode)}</span></div>
                                      <div className="flex justify-between"><span className="text-[#A1A1A6]">Historical EWMA (w={p.consensus.weights.historical})</span><span className="text-violet-400">{fmtMs(p.consensus.historicalEwma)}</span></div>
                                      <div className="flex justify-between"><span className="text-[#A1A1A6]">Shadow Probe (w={p.consensus.weights.shadow})</span><span className="text-amber-400">{fmtMs(p.consensus.shadowProbe)}</span></div>
                                      <div className="flex justify-between border-t border-[#1A1A1A] pt-1 mt-1"><span className="text-white">S_final</span><span className="text-[#FFB800]">{fmtMs(p.consensus.finalScore)}</span></div>
                                    </div>
                                  </div>
                                  <div className="bg-[#111111] border border-[#1A1A1A] rounded-lg p-4">
                                    <div className="text-[10px] font-mono text-[#A1A1A6] uppercase mb-2">Bond Economics</div>
                                    <div className="space-y-1 font-mono text-xs">
                                      <div className="flex justify-between"><span className="text-[#A1A1A6]">Bond Amount</span><span className="text-[#FFB800]">{fmtUSD(p.bondAmountUsdc)}</span></div>
                                      <div className="flex justify-between"><span className="text-[#A1A1A6]">Total Slashed</span><span className="text-rose-400">{fmtUSD(p.slashedTotalUsdc)}</span></div>
                                      <div className="flex justify-between"><span className="text-[#A1A1A6]">Penalty / Epoch</span><span className={p.penaltyRatePerEpoch > 0 ? "text-rose-400" : "text-emerald-400"}>${p.penaltyRatePerEpoch.toFixed(2)}</span></div>
                                      <div className="flex justify-between"><span className="text-[#A1A1A6]">Bond Floor</span><span className="text-white">{fmtUSD(VNP_PARAMS.minBondUsdc)}</span></div>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Settlement Feed + Stake Interface */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Live Settlement Feed */}
                  <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-[#1A1A1A] bg-[#111111] flex items-center gap-3">
                      <Activity className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-semibold text-white">Live Settlement Feed</span>
                      <span className="ml-auto flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        EPOCH {currentEpoch()}
                      </span>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar divide-y divide-[#1A1A1A]">
                      {settlements.map((s) => (
                        <div key={`${s.apiId}-${s.epoch}`} className="px-5 py-3 hover:bg-[#111111] transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-white font-medium">{s.apiName}</span>
                            <span className={`text-xs font-mono ${s.penaltyUsdc > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                              {s.penaltyUsdc > 0 ? `SLASH -$${s.penaltyUsdc.toFixed(2)}` : "PASS"}
                            </span>
                          </div>
                          <div className="grid grid-cols-4 gap-2 text-[10px] font-mono text-[#A1A1A6]">
                            <div>Target: {fmtMs(s.targetP95Ms)}</div>
                            <div>Obs: {fmtMs(s.observedP95Ms)}</div>
                            <div>&sigma;: {fmtMs(s.sigmaMs)}</div>
                            <div>Excess: {fmtMs(s.excessMs)}</div>
                          </div>
                        </div>
                      ))}
                      {settlements.length === 0 && (
                        <div className="p-8 text-center text-[#A1A1A6] text-sm">Awaiting measurement data...</div>
                      )}
                    </div>
                  </div>

                  {/* Stake on SLA Performance */}
                  <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-[#1A1A1A] bg-[#111111] flex items-center gap-3">
                      <DollarSign className="w-4 h-4 text-[#FFB800]" />
                      <span className="text-sm font-semibold text-white">Stake on SLA Performance</span>
                    </div>
                    <div className="p-5 space-y-4">
                      {/* Market Selector */}
                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-widest text-[#A1A1A6] mb-2">Select Market</label>
                        <select
                          value={selectedMarketId}
                          onChange={(e) => setSelectedMarketId(e.target.value)}
                          className="w-full bg-[#111111] border border-[#1A1A1A] rounded-lg px-4 py-2.5 text-sm text-white focus:border-[#FFB800]/50 focus:outline-none"
                        >
                          {markets.map((m) => (
                            <option key={m.id} value={m.id}>{m.title}</option>
                          ))}
                        </select>
                      </div>

                      {/* Pool Depth */}
                      {(() => {
                        const m = markets.find((x) => x.id === selectedMarketId);
                        if (!m) return null;
                        const total = m.poolYes + m.poolNo;
                        const yesPct = total > 0 ? (m.poolYes / total) * 100 : 50;
                        return (
                          <div>
                            <div className="flex justify-between text-[10px] font-mono text-[#A1A1A6] mb-1">
                              <span>Pool Depth</span>
                              <span>{fmtUSD(total)}</span>
                            </div>
                            <div className="h-2 w-full bg-[#333333] rounded-full overflow-hidden flex">
                              <div className="h-full bg-emerald-500 transition-all" style={{ width: `${yesPct}%` }} />
                              <div className="h-full bg-rose-500 transition-all" style={{ width: `${100 - yesPct}%` }} />
                            </div>
                            <div className="flex justify-between mt-1 text-[10px] font-mono">
                              <span className="text-emerald-400">YES {yesPct.toFixed(1)}% @ {(m.yesPrice / 100).toFixed(2)}</span>
                              <span className="text-rose-400">NO {(100 - yesPct).toFixed(1)}% @ {(m.noPrice / 100).toFixed(2)}</span>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Amount */}
                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-widest text-[#A1A1A6] mb-2">Stake Amount (USDC)</label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={stakeAmount}
                          onChange={(e) => setStakeAmount(e.target.value)}
                          className="w-full bg-[#111111] border border-[#1A1A1A] rounded-lg px-4 py-2.5 text-sm text-white font-mono focus:border-[#FFB800]/50 focus:outline-none"
                          placeholder="10.00"
                        />
                      </div>

                      {/* Outcome Buttons */}
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setStakeOutcome("YES")}
                          className={`py-3 rounded-lg text-sm font-semibold transition-all border ${
                            stakeOutcome === "YES"
                              ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                              : "bg-[#111111] border-[#1A1A1A] text-[#A1A1A6] hover:border-emerald-500/30"
                          }`}
                        >
                          YES — Meets SLA
                        </button>
                        <button
                          onClick={() => setStakeOutcome("NO")}
                          className={`py-3 rounded-lg text-sm font-semibold transition-all border ${
                            stakeOutcome === "NO"
                              ? "bg-rose-500/20 border-rose-500/50 text-rose-400"
                              : "bg-[#111111] border-[#1A1A1A] text-[#A1A1A6] hover:border-rose-500/30"
                          }`}
                        >
                          NO — Breaches SLA
                        </button>
                      </div>

                      {/* Fee Notice */}
                      <div className="text-[10px] font-mono text-[#A1A1A6] bg-[#111111] border border-[#1A1A1A] rounded-lg px-3 py-2">
                        Platform fee: {(VNP_PARAMS.platformFeeRate * 100).toFixed(1)}% | Net stake after fee:{" "}
                        <span className="text-white">{fmtUSD(parseFloat(stakeAmount || "0") * (1 - VNP_PARAMS.platformFeeRate))}</span>
                      </div>

                      {/* Submit */}
                      <button
                        onClick={handleStake}
                        disabled={stakePending || !selectedMarketId}
                        className="w-full py-3 rounded-lg bg-[#FFB800] text-black font-bold text-sm tracking-wide hover:bg-[#FFB800]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {stakePending ? "Processing..." : `Stake ${stakeOutcome} — $${parseFloat(stakeAmount || "0").toFixed(2)} USDC`}
                      </button>

                      {stakeResult && (
                        <div className={`text-xs font-mono px-3 py-2 rounded-lg border ${
                          stakeResult.ok
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                            : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                        }`}>
                          {stakeResult.msg}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Challenge Market */}
                <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-[#1A1A1A] bg-[#111111] flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-semibold text-white">Challenge Market</span>
                    <span className="text-[10px] font-mono text-[#A1A1A6] ml-auto">Two-Tier Dispute Resolution</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#1A1A1A]">
                    {/* Tier A */}
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono uppercase rounded">Tier A</span>
                        <span className="text-xs text-white font-medium">Lightweight Challenge</span>
                      </div>
                      <div className="space-y-2 text-xs font-mono text-[#A1A1A6]">
                        <div>Stake: ${VNP_PARAMS.challengeTierA.min} - ${VNP_PARAMS.challengeTierA.max} USDC</div>
                        <div>Evidence: Signed request/response pair + latency + timestamp</div>
                        <div>Resolution: Auto-checked against verifier distribution</div>
                        <div>Speed: Sub-second (smart contract validation)</div>
                      </div>
                      <div className="mt-3 text-[10px] text-emerald-400 font-mono">99% of challenges resolve at this tier</div>
                    </div>
                    {/* Tier B */}
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-mono uppercase rounded">Tier B</span>
                        <span className="text-xs text-white font-medium">Escalation</span>
                      </div>
                      <div className="space-y-2 text-xs font-mono text-[#A1A1A6]">
                        <div>Stake: ${VNP_PARAMS.challengeTierB.min} - ${VNP_PARAMS.challengeTierB.max} USDC</div>
                        <div>Trigger: Deviation {">"} X&sigma; AND contradicts consensus</div>
                        <div>Resolution: Commit-reveal + deeper audit</div>
                        <div>Speed: 6-48 hours (KDE consensus + governance review)</div>
                      </div>
                      <div className="mt-3 text-[10px] text-[#A1A1A6] font-mono">Reserved for systemic threshold breaches</div>
                    </div>
                  </div>
                </div>

                {/* x402 Micro-Staking */}
                <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-[#1A1A1A] bg-[#111111] flex items-center gap-3">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-semibold text-white">x402 Micro-Staking Integration</span>
                    <span className="text-[10px] font-mono text-cyan-400 ml-auto">HTTP 402 Payment Required</span>
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="text-[10px] font-mono text-[#A1A1A6] uppercase mb-3">X-VNP-Stake Header Schema</div>
                        <pre className="bg-[#111111] border border-[#1A1A1A] rounded-lg p-4 text-xs font-mono text-cyan-400 overflow-x-auto">
{`{
  "version": 1,
  "api_id": "0x...",
  "stake_usdc": "0.001",
  "epoch_hint": ${currentEpoch()},
  "agent": "did:veklom:agent-123",
  "nonce": "...",
  "signature": "0x..."
}`}
                        </pre>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono text-[#A1A1A6] uppercase mb-3">Settlement Architecture</div>
                        <div className="space-y-3 text-xs font-mono text-[#A1A1A6]">
                          <div className="flex items-start gap-2">
                            <ArrowRight className="w-3 h-3 text-cyan-400 mt-0.5 flex-shrink-0" />
                            <span>Agent attaches micro-stake ($0.001 USDC) to x402 payment header</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <ArrowRight className="w-3 h-3 text-cyan-400 mt-0.5 flex-shrink-0" />
                            <span>Off-chain aggregator batches outcomes per epoch</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <ArrowRight className="w-3 h-3 text-cyan-400 mt-0.5 flex-shrink-0" />
                            <span>If API meets VNP target: agent stake earns fractional yield from provider bond</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <ArrowRight className="w-3 h-3 text-rose-400 mt-0.5 flex-shrink-0" />
                            <span>If API fails: auto-slash triggers micro-refund + penalty from provider bond</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <ArrowRight className="w-3 h-3 text-[#FFB800] mt-0.5 flex-shrink-0" />
                            <span>Periodic on-chain settlement (net balances) on Base L2 — sub-$0.001 per anchor</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ==================== CONSENSUS VECTOR TAB ==================== */}
            {activeTab === "consensus" && (
              <motion.div
                key="consensus"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Consensus Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Active Verifiers", value: String(verifiers.length), icon: Users, color: "text-violet-400" },
                    { label: "Geographic Regions", value: String(VERIFIER_REGIONS.length), icon: Globe, color: "text-cyan-400" },
                    { label: "Consensus Accuracy", value: `${(verifiers.reduce((s, v) => s + v.accuracy, 0) / Math.max(1, verifiers.length)).toFixed(1)}%`, icon: CheckCircle, color: "text-emerald-400" },
                    { label: "Measurement Epochs", value: String(currentEpoch()), icon: Clock, color: "text-[#FFB800]" },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <stat.icon className={`w-4 h-4 ${stat.color}`} />
                        <span className="text-[10px] font-mono uppercase tracking-widest text-[#A1A1A6]">{stat.label}</span>
                      </div>
                      <div className={`text-2xl font-medium ${stat.color}`}>{stat.value}</div>
                    </div>
                  ))}
                </div>

                {/* KDE Consensus Visualization */}
                <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-[#1A1A1A] bg-[#111111] flex items-center gap-3 flex-wrap">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-semibold text-white">KDE Consensus — Measurement Distribution</span>
                    <select
                      value={selectedKdeApiId}
                      onChange={(e) => setSelectedKdeApiId(e.target.value)}
                      className="ml-auto bg-[#0A0A0A] border border-[#1A1A1A] rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:border-[#FFB800]/50 focus:outline-none"
                    >
                      {apis.map(({ api: a }) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="p-5">
                    {kdeData && (
                      <>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                              data={kdeData.curve.points.map((p, i) => ({
                                latency: p,
                                density: kdeData.curve.density[i],
                              }))}
                              margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" />
                              <XAxis
                                dataKey="latency"
                                tick={{ fill: "#A1A1A6", fontSize: 10 }}
                                tickFormatter={(v: number) => `${Math.round(v)}ms`}
                                label={{ value: "Latency (ms)", position: "insideBottom", offset: -5, fill: "#A1A1A6", fontSize: 10 }}
                              />
                              <YAxis
                                tick={{ fill: "#A1A1A6", fontSize: 10 }}
                                tickFormatter={(v: number) => v.toFixed(3)}
                                label={{ value: "Density", angle: -90, position: "insideLeft", fill: "#A1A1A6", fontSize: 10 }}
                              />
                              <Tooltip
                                contentStyle={{ backgroundColor: "#111111", border: "1px solid #1A1A1A", borderRadius: 8, fontSize: 11, fontFamily: "monospace" }}
                                labelFormatter={(v) => `${Number(v).toFixed(1)}ms`}
                                formatter={(v) => [Number(v).toFixed(5), "Density"]}
                              />
                              <Area type="monotone" dataKey="density" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.15} strokeWidth={2} />
                              <ReferenceLine x={kdeData.curve.mode} stroke="#FFB800" strokeDasharray="4 4" label={{ value: `Mode: ${fmtMs(kdeData.curve.mode)}`, fill: "#FFB800", fontSize: 10, position: "top" }} />
                              <ReferenceLine x={kdeData.consensus.historicalEwma} stroke="#8b5cf6" strokeDasharray="4 4" label={{ value: `EWMA: ${fmtMs(kdeData.consensus.historicalEwma)}`, fill: "#8b5cf6", fontSize: 10, position: "top" }} />
                              <ReferenceLine x={kdeData.consensus.shadowProbe} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: `Shadow: ${fmtMs(kdeData.consensus.shadowProbe)}`, fill: "#f59e0b", fontSize: 10, position: "top" }} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Consensus Formula */}
                        <div className="mt-4 bg-[#111111] border border-[#1A1A1A] rounded-lg px-4 py-3 font-mono text-sm">
                          <span className="text-[#FFB800]">S<sub>final</sub></span> ={" "}
                          <span className="text-cyan-400">{kdeData.consensus.weights.kde}</span> * S<sub>KDE</sub> +{" "}
                          <span className="text-violet-400">{kdeData.consensus.weights.historical}</span> * S<sub>historical</sub> +{" "}
                          <span className="text-amber-400">{kdeData.consensus.weights.shadow}</span> * S<sub>shadow</sub> ={" "}
                          <span className="text-[#FFB800] font-bold">{fmtMs(kdeData.consensus.finalScore)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Multi-Anchor Consensus Bars */}
                {kdeData && (
                  <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-[#1A1A1A] bg-[#111111] flex items-center gap-3">
                      <Lock className="w-4 h-4 text-[#FFB800]" />
                      <span className="text-sm font-semibold text-white">Dual-Anchor Anti-Drift Protection</span>
                    </div>
                    <div className="p-5">
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <RBarChart
                            data={[
                              { anchor: "KDE Mode", value: kdeData.consensus.kdeMode, weight: kdeData.consensus.weights.kde },
                              { anchor: "Historical EWMA", value: kdeData.consensus.historicalEwma, weight: kdeData.consensus.weights.historical },
                              { anchor: "Shadow Probes", value: kdeData.consensus.shadowProbe, weight: kdeData.consensus.weights.shadow },
                              { anchor: "Final Consensus", value: kdeData.consensus.finalScore, weight: 1 },
                            ]}
                            margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" />
                            <XAxis dataKey="anchor" tick={{ fill: "#A1A1A6", fontSize: 10 }} />
                            <YAxis tick={{ fill: "#A1A1A6", fontSize: 10 }} tickFormatter={(v: number) => `${Math.round(v)}ms`} />
                            <Tooltip
                              contentStyle={{ backgroundColor: "#111111", border: "1px solid #1A1A1A", borderRadius: 8, fontSize: 11, fontFamily: "monospace" }}
                              formatter={(v) => [`${Number(v).toFixed(1)}ms`, "Latency"]}
                            />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                              <Cell fill="#06b6d4" />
                              <Cell fill="#8b5cf6" />
                              <Cell fill="#f59e0b" />
                              <Cell fill="#FFB800" />
                            </Bar>
                          </RBarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-4 text-xs font-mono text-[#A1A1A6] leading-relaxed">
                        Coordinated drift is prevented by anchoring consensus to three independent signals.
                        Attackers must corrupt the live KDE mode, the historical EWMA baseline (long half-life, &alpha;={VNP_PARAMS.ewmaAlpha}),
                        and the protocol-owned shadow probes simultaneously — making slow consensus manipulation economically infeasible.
                      </div>
                    </div>
                  </div>
                )}

                {/* Verifier Network */}
                <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-[#1A1A1A] bg-[#111111] flex items-center gap-3">
                    <Globe className="w-4 h-4 text-violet-400" />
                    <span className="text-sm font-semibold text-white">Verifier Network</span>
                    <span className="text-[10px] font-mono text-[#A1A1A6] ml-auto">W<sub>i</sub> = Stake<sub>i</sub> * log(Reputation<sub>i</sub> + 1) * Diversity<sub>i</sub></span>
                  </div>
                  <div className="hidden lg:grid grid-cols-9 gap-2 px-5 py-3 border-b border-[#1A1A1A] text-[10px] font-mono uppercase tracking-widest text-[#A1A1A6]">
                    <div className="col-span-2">Node / Region</div>
                    <div className="col-span-1 text-right">Stake</div>
                    <div className="col-span-1 text-right">Reputation</div>
                    <div className="col-span-1 text-right">Diversity</div>
                    <div className="col-span-1 text-right">Weight</div>
                    <div className="col-span-1 text-right">Measurements</div>
                    <div className="col-span-1 text-right">Accuracy</div>
                    <div className="col-span-1 text-center">Status</div>
                  </div>
                  <div className="divide-y divide-[#1A1A1A]">
                    {verifiers.map((v) => (
                      <div key={v.address} className="grid grid-cols-1 lg:grid-cols-9 gap-2 px-5 py-3 items-center hover:bg-[#111111] transition-colors">
                        <div className="col-span-2">
                          <div className="text-xs text-white font-mono">{v.address}</div>
                          <div className="text-[10px] text-[#A1A1A6] font-mono">{v.region} / {v.asn}</div>
                        </div>
                        <div className="col-span-1 text-right font-mono text-xs text-[#FFB800]">{fmtUSD(v.stake)}</div>
                        <div className="col-span-1 text-right font-mono text-xs text-violet-400">{v.reputation}</div>
                        <div className="col-span-1 text-right font-mono text-xs text-cyan-400">{v.diversityScore.toFixed(2)}</div>
                        <div className="col-span-1 text-right font-mono text-xs text-white">{v.weight.toLocaleString()}</div>
                        <div className="col-span-1 text-right font-mono text-xs text-[#A1A1A6]">{v.measurementCount.toLocaleString()}</div>
                        <div className="col-span-1 text-right font-mono text-xs text-emerald-400">{v.accuracy.toFixed(1)}%</div>
                        <div className="col-span-1 text-center">
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                            Active
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Verifier Weight Distribution */}
                <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-[#1A1A1A] bg-[#111111] flex items-center gap-3">
                    <BarChart2 className="w-4 h-4 text-[#FFB800]" />
                    <span className="text-sm font-semibold text-white">Verifier Weight Distribution</span>
                  </div>
                  <div className="p-5 h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <RBarChart
                        data={verifiers.map((v) => ({
                          region: v.region.replace(/-\d+$/, ""),
                          weight: v.weight,
                          stake: v.stake,
                        }))}
                        margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" />
                        <XAxis dataKey="region" tick={{ fill: "#A1A1A6", fontSize: 10 }} />
                        <YAxis tick={{ fill: "#A1A1A6", fontSize: 10 }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#111111", border: "1px solid #1A1A1A", borderRadius: 8, fontSize: 11, fontFamily: "monospace" }}
                        />
                        <Bar dataKey="weight" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Weight" />
                      </RBarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

        </div>
      </main>

      {/* Global Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 p-6 mt-12 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>VNP global spec release consensus approved. Deployed under Apache-2.0.</span>
          </div>
          <span className="text-slate-600 font-sans font-medium text-[11px]">Designed with Inter Slate Theme paired with JetBrains Mono</span>
        </div>
      </footer>
    </div>
  );
}
