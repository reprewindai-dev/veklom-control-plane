// @ts-nocheck
"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  Activity, 
  TrendingUp, 
  Coins, 
  Shield, 
  Play, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Cpu, 
  Sliders, 
  Gamepad2, 
  Share2, 
  Search, 
  ArrowUpRight, 
  Lock, 
  Unlock, 
  FileSearch,
  DollarSign,
  ChevronRight,
  TrendingDown,
  BookOpen,
  Terminal,
  Code,
  ArrowRight,
  UploadCloud
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

// ============ TYPES ============
interface BenchmarkAPI {
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
  endpointUrl?: string;
  description?: string;
  mcpSchema?: any;
  provider?: string;
  throughput?: number;
  uptime24h?: number;
  totalStaked?: number;
  status?: string;
  rating?: number;
}

interface StakingMarket {
  id: string;
  title: string;
  category: "Latency" | "Schema Drift" | "SLA Success";
  yesPrice: number; // in cents
  noPrice: number; // in cents
  volume: number; // in $VEK
  poolYes: number;
  poolNo: number;
  resolutionDate: string;
  targetApi: string;
  resolved: boolean;
  outcome?: "YES" | "NO";
}

interface ProbeLog {
  id: string;
  timestamp: string;
  source: string;
  type: "info" | "success" | "warning" | "error";
  message: string;
}

export default function APIBenchmarksDashboard() {
  const [apis, setApis] = useState<BenchmarkAPI[]>([]);
  const [markets, setMarkets] = useState<StakingMarket[]>([]);
  const [logs, setLogs] = useState<ProbeLog[]>([]);
  const [vekBalance, setVekBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Weights for Slider: 0 = Dev First, 100 = Gov First
  const [weight, setWeight] = useState<number>(50); // 50% split
  
  // Search state
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  // UI Tabs: leaderboard, staking, or blueprint
  const [activeTab, setActiveTab] = useState<"leaderboard" | "staking" | "blueprint">("leaderboard");
  
  // Staking Drawer / Modal State
  const [selectedMarket, setSelectedMarket] = useState<StakingMarket | null>(null);
  const [betOutcome, setBetOutcome] = useState<"YES" | "NO">("YES");
  const [betAmount, setBetAmount] = useState<string>("500");
  const [payoutEstimate, setPayoutEstimate] = useState<number>(0);
  const [txSuccess, setTxSuccess] = useState<boolean>(false);
  const [txError, setTxError] = useState<string | null>(null);

  // Expandable Drawer State for API Inspection
  const [selectedApi, setSelectedApi] = useState<BenchmarkAPI | null>(null);

  // Gemini API Compiler State
  const [compilerCode, setCompilerCode] = useState<string>(
    `# Example Flask or Fast API endpoint code\n@app.post("/v1/payments")\ndef process_transaction(user_id: str, amount_usd: float):\n    """Charges the user and updates the sub-ledger under PCI compliance."""\n    return {"status": "success", "tx_id": "tx_abc123"}`
  );
  const [compilerName, setCompilerName] = useState<string>("My Payments Terminal");
  const [compilerCategory, setCompilerCategory] = useState<string>("Payment");
  const [compilerLoading, setCompilerLoading] = useState<boolean>(false);
  const [compileResult, setCompileResult] = useState<any>(null);
  const [compileError, setCompileError] = useState<string | null>(null);

  // Consensus Sandbox Score Evaluator state
  const [sandboxRegArch, setSandboxRegArch] = useState<string>("FedRAMP High / NIST");
  const [sandboxSovZone, setSandboxSovZone] = useState<string>("US-Federal Gov Node");
  const [sandboxNistKeys, setSandboxNistKeys] = useState<boolean>(true);
  const [sandboxResidency, setSandboxResidency] = useState<boolean>(true);
  const [sandboxLLMDiscoverability, setSandboxLLMDiscoverability] = useState<number>(95);
  const [sandboxLatencyTarget, setSandboxLatencyTarget] = useState<number>(30);

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Fetch real data from the backend
  const fetchData = async () => {
    try {
      const [apisRes, marketsRes, logsRes, balanceRes] = await Promise.all([
        fetch("/api/v1/benchmarks/leaderboard"),
        fetch("/api/v1/benchmarks/staking/markets"),
        fetch("/api/v1/benchmarks/logs"),
        fetch("/api/v1/billing/wallet/balance")
      ]);

      if (apisRes.ok) {
        const data = await apisRes.json();
        setApis(data);
      }
      if (marketsRes.ok) {
        const data = await marketsRes.json();
        setMarkets(data);
      }
      if (logsRes.ok) {
        const data = await logsRes.json();
        setLogs(data);
      }
      if (balanceRes.ok) {
        const data = await balanceRes.json();
        setVekBalance(data.balance_usd);
      }
    } catch (err) {
      console.error("Failed to fetch API benchmarks data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchData();
  }, []);

  // Poll data every 4 seconds to reflect backend updates and probe results
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Recalculate Ratings when weight or APIs change
  const scoredApis = React.useMemo(() => {
    const govRatio = weight / 100;
    const devRatio = 1 - govRatio;
    
    return apis.map(api => {
      const rating = Math.round((api.govScore * govRatio) + (api.devScore * devRatio));
      return { ...api, rating };
    }).sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }, [apis, weight]);

  // Filtered APIs based on search
  const filteredApis = React.useMemo(() => {
    return scoredApis.filter(api => 
      api.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      api.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (api.provider && api.provider.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [scoredApis, searchTerm]);

  // Calculate payout estimate when amount or market changes
  useEffect(() => {
    if (!selectedMarket) return;
    
    const amount = parseFloat(betAmount) || 0;
    if (amount <= 0) {
      setPayoutEstimate(0);
      return;
    }
    
    const price = betOutcome === "YES" ? selectedMarket.yesPrice : selectedMarket.noPrice;
    const shares = amount / (price / 100);
    setPayoutEstimate(Math.round(shares));
  }, [betAmount, betOutcome, selectedMarket]);
  
  // Calculate Sandbox Evaluator score and tier in real-time
  const sandboxResult = React.useMemo(() => {
    let score = 50;
    
    // NIST key bonus
    if (sandboxNistKeys) score += 10;
    
    // Residency compliance bonus
    if (sandboxResidency) score += 15;
    
    // LLM Discoverability addition (range 50-100, maps to 0-15 points)
    score += Math.round(((sandboxLLMDiscoverability - 50) / 50) * 15);
    
    // Latency target addition (lower is better, range 10-500ms)
    if (sandboxLatencyTarget <= 30) score += 10;
    else if (sandboxLatencyTarget <= 100) score += 7;
    else if (sandboxLatencyTarget <= 200) score += 4;
    else if (sandboxLatencyTarget <= 350) score += 2;
    
    // Regulatory architecture contribution
    if (sandboxRegArch === "FedRAMP High / NIST") score += 10;
    else if (sandboxRegArch === "GDPR Zero-Leak Enclave") score += 9;
    else if (sandboxRegArch === "HIPAA Protected Health") score += 8;
    else if (sandboxRegArch === "Canada Health Act (PIPEDA)") score += 8;

    // Sovereignty zone bonus
    if (sandboxSovZone === "US-Federal Gov Node") score += 5;
    else if (sandboxSovZone === "CA-Sovereign Central") score += 5;
    else if (sandboxSovZone === "EU-Dublin Enclave") score += 4;
    else if (sandboxSovZone === "Asia-Sovereign Tokyo") score += 4;
    
    // Cap score at 100
    score = Math.min(100, score);
    
    let tier = "Sovereign Tier Tier-3 (Standard)";
    let desc = "Approved for standard developer integration. Complies with basic regional schema guidelines.";
    if (score >= 90) {
      tier = "Sovereign Tier Tier-1 (Highly Approved)";
      desc = "Passes all strict security, regional residency, and FIPS-compliant encryption benchmarks. Approved for direct autonomous enterprise agent actions.";
    } else if (score >= 75) {
      tier = "Sovereign Tier Tier-2 (Moderate)";
      desc = "Approved for regulated operations. Meets GDPR/PIPEDA standards and has verified zero-shot LLM parameter mappings.";
    }
    
    return { score, tier, desc };
  }, [sandboxRegArch, sandboxSovZone, sandboxNistKeys, sandboxResidency, sandboxLLMDiscoverability, sandboxLatencyTarget]);

  const handlePlaceStake = async () => {
    if (!selectedMarket) return;

    try {
      const response = await fetch("/api/v1/benchmarks/staking/stake", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          marketId: selectedMarket.id,
          outcome: betOutcome,
          amount: parseFloat(betAmount),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setTxError(errorData.error || "Stake placement failed");
        return;
      }

      setTxSuccess(true);
      setTxError(null);
      fetchData();
    } catch (err) {
      console.error("Stake placement error:", err);
      setTxError("Unable to place stake at this time.");
    }
  };

  const handleCompileSchema = async () => {
    setCompilerLoading(true);
    setCompileError(null);
    setCompileResult(null);

    try {
      const response = await fetch("/api/v1/benchmarks/compile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: compilerName,
          category: compilerCategory,
          source: compilerCode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setCompileError(errorData.error || "Compilation failed");
        return;
      }

      const data = await response.json();
      setCompileResult(data);
    } catch (err) {
      console.error("Compilation error:", err);
      setCompileError("Failed to compile API schema.");
    } finally {
      setCompilerLoading(false);
    }
  };

  const scrollToLogs = () => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const complianceBadge = (label: string) => (
    <span className="inline-flex rounded-full bg-slate-800 px-2 py-1 text-[10px] uppercase tracking-[0.25em] text-slate-300 mr-2 mb-2">
      {label}
    </span>
  );

  const chartBar = (value: number, max = 100) => {
    const width = `${Math.min(100, Math.max(0, value))}%`;
    return (
      <div className="w-full rounded-full bg-slate-950/60 overflow-hidden h-2 mt-2">
        <div className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" style={{ width }} />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#05060A] text-white py-10 px-6 lg:px-12">
      <div className="mx-auto max-w-[1600px] space-y-8">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 shadow-xl shadow-slate-900/20 backdrop-blur">
              <Shield className="h-4 w-4 text-cyan-300" />
              VNP Trust Network
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.36em] text-cyan-300/80">Nexus Protocol</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Sovereign API Benchmark Dashboard
              </h1>
              <p className="mt-4 max-w-3xl text-slate-400 sm:text-lg">
                Live benchmark telemetry, SLA staking markets, and API Trust evidence for the Veklom sovereign runtime.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-slate-950/40">
              <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Vek Wallet</p>
              <p className="mt-3 text-3xl font-semibold text-white">${vekBalance.toFixed(2)}</p>
              <p className="mt-2 text-sm text-slate-400">Available for staking, sync, and governance operations.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-slate-950/40">
              <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Active Protocol</p>
              <p className="mt-3 text-3xl font-semibold text-white">VNP / PGL</p>
              <p className="mt-2 text-sm text-slate-400">Real-time trust scoring, audit proofs, and consensus-backed deployment readiness.</p>
            </div>
          </div>
        </header>

        <section className="grid gap-4 xl:grid-cols-[1.5fr_0.9fr]">
          <div className="space-y-4 rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-xl shadow-slate-950/30">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Benchmark view</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">API Trust leaderboards</h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setActiveTab("leaderboard")}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeTab === "leaderboard" ? "bg-cyan-400 text-slate-950" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}
                >
                  Leaderboard
                </button>
                <button
                  onClick={() => setActiveTab("staking")}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeTab === "staking" ? "bg-cyan-400 text-slate-950" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}
                >
                  Staking Markets
                </button>
                <button
                  onClick={() => setActiveTab("blueprint")}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeTab === "blueprint" ? "bg-cyan-400 text-slate-950" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}
                >
                  API Blueprint
                </button>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_0.4fr]">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-200">Leaderboard weight</p>
                    <p className="text-xs text-slate-500">Governance vs developer preference</p>
                  </div>
                  <p className="rounded-full bg-slate-800/80 px-3 py-1 text-xs uppercase tracking-[0.22em] text-slate-300">{weight}% Gov</p>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weight}
                  onChange={(event) => setWeight(Number(event.target.value))}
                  className="mt-4 w-full accent-cyan-400"
                />
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-sm font-semibold text-slate-200">Search APIs</p>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by API, provider, category"
                  className="mt-3 w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-4">
              {activeTab === "leaderboard" && (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-3xl bg-slate-900/80 p-4">
                      <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Trusted APIs</p>
                      <p className="mt-3 text-3xl font-semibold text-white">{filteredApis.length}</p>
                      <p className="mt-2 text-sm text-slate-400">Active APIs with live VNP scoring.</p>
                    </div>
                    <div className="rounded-3xl bg-slate-900/80 p-4">
                      <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Average SLA</p>
                      <p className="mt-3 text-3xl font-semibold text-white">{filteredApis.length ? `${Math.round(filteredApis.reduce((sum, api) => sum + api.sla, 0) / filteredApis.length)}%` : "—"}</p>
                      <p className="mt-2 text-sm text-slate-400">Aggregated VNP trust availability.</p>
                    </div>
                    <div className="rounded-3xl bg-slate-900/80 p-4">
                      <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Top Rating</p>
                      <p className="mt-3 text-3xl font-semibold text-white">{filteredApis.length ? Math.max(...filteredApis.map(api => api.rating || 0)) : 0}</p>
                      <p className="mt-2 text-sm text-slate-400">Composite score across governance and developer dimensions.</p>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80">
                    <div className="grid gap-3 border-b border-white/10 bg-slate-950/80 px-5 py-4 text-xs uppercase tracking-[0.22em] text-slate-500 sm:grid-cols-[3fr_1fr_1fr_1fr_0.5fr]">
                      <span>API</span>
                      <span>Governance</span>
                      <span>Developer</span>
                      <span>Rating</span>
                      <span>Status</span>
                    </div>
                    <div className="divide-y divide-white/5">
                      {loading ? (
                        <div className="p-6 text-slate-400">Loading leaderboard…</div>
                      ) : filteredApis.length ? (
                        filteredApis.map(api => (
                          <button
                            key={api.id}
                            onClick={() => setSelectedApi(api)}
                            className="w-full text-left px-5 py-4 transition hover:bg-white/5"
                          >
                            <div className="grid gap-3 sm:grid-cols-[3fr_1fr_1fr_1fr_0.5fr] items-center">
                              <div>
                                <p className="font-semibold text-white">{api.name}</p>
                                <p className="mt-1 text-sm text-slate-400">{api.provider} · {api.category}</p>
                              </div>
                              <div>
                                <p className="font-semibold text-cyan-300">{api.govScore}</p>
                                <p className="text-xs text-slate-500">Gov</p>
                              </div>
                              <div>
                                <p className="font-semibold text-violet-300">{api.devScore}</p>
                                <p className="text-xs text-slate-500">Dev</p>
                              </div>
                              <div>
                                <p className="font-semibold text-white">{api.rating}</p>
                                <p className="text-xs text-slate-500">Composite</p>
                              </div>
                              <div>
                                <span className={`inline-flex rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.2em] ${api.status === "active" ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-300"}`}>
                                  {api.status || "unknown"}
                                </span>
                              </div>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="p-6 text-slate-400">No APIs found for this query.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "staking" && (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-3xl bg-slate-900/80 p-4">
                      <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Staking markets</p>
                      <p className="mt-3 text-3xl font-semibold text-white">{markets.length}</p>
                      <p className="mt-2 text-sm text-slate-400">Open VNP markets for latency, schema drift, and SLA bets.</p>
                    </div>
                    <div className="rounded-3xl bg-slate-900/80 p-4">
                      <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Est. Pool Liquidity</p>
                      <p className="mt-3 text-3xl font-semibold text-white">{markets.reduce((sum, market) => sum + market.volume, 0).toFixed(0)} VEK</p>
                      <p className="mt-2 text-sm text-slate-400">Current stake pools across active VNP markets.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {markets.map(market => (
                      <div key={market.id} className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm uppercase tracking-[0.22em] text-slate-500">{market.category}</p>
                            <h3 className="mt-2 text-xl font-semibold text-white">{market.title}</h3>
                            <p className="mt-2 text-sm text-slate-400">Resolves on {market.resolutionDate} · {market.targetApi}</p>
                          </div>
                          <div className="inline-flex items-center gap-3 rounded-full bg-slate-950/80 px-4 py-2 text-sm text-slate-300">
                            <span className="font-semibold text-slate-100">YES {market.yesPrice / 100}</span>
                            <span className="text-slate-500">/</span>
                            <span className="font-semibold text-slate-100">NO {market.noPrice / 100}</span>
                          </div>
                        </div>
                        <div className="mt-4 grid gap-4 md:grid-cols-3">
                          <div className="rounded-3xl bg-slate-950/70 p-4">
                            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Volume</p>
                            <p className="mt-3 text-2xl font-semibold text-white">{market.volume.toFixed(0)} VEK</p>
                          </div>
                          <div className="rounded-3xl bg-slate-950/70 p-4">
                            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Yes Pool</p>
                            <p className="mt-3 text-2xl font-semibold text-emerald-300">{market.poolYes.toFixed(0)}</p>
                          </div>
                          <div className="rounded-3xl bg-slate-950/70 p-4">
                            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">No Pool</p>
                            <p className="mt-3 text-2xl font-semibold text-rose-300">{market.poolNo.toFixed(0)}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedMarket(market)}
                          className="mt-5 inline-flex items-center gap-2 rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                        >
                          Place stake
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "blueprint" && (
                <div className="space-y-4">
                  <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-sm uppercase tracking-[0.22em] text-slate-500">API expedition</p>
                        <h3 className="mt-2 text-2xl font-semibold text-white">Gemini schema compiler</h3>
                        <p className="mt-2 text-sm text-slate-400">Submit raw API code and generate a trusted MCP schema for leaderboard ingestion.</p>
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-full bg-slate-950/80 px-4 py-2 text-sm text-slate-300">
                        <BookOpen className="h-4 w-4" />
                        Developer preview
                      </div>
                    </div>
                    <div className="mt-4 grid gap-4 lg:grid-cols-3">
                      <div className="rounded-3xl bg-slate-950/70 p-4">
                        <label className="text-sm uppercase tracking-[0.22em] text-slate-500">Name</label>
                        <input
                          value={compilerName}
                          onChange={(event) => setCompilerName(event.target.value)}
                          className="mt-3 w-full rounded-3xl border border-slate-800 bg-slate-950/90 px-4 py-3 text-sm text-white outline-none"
                        />
                      </div>
                      <div className="rounded-3xl bg-slate-950/70 p-4">
                        <label className="text-sm uppercase tracking-[0.22em] text-slate-500">Category</label>
                        <input
                          value={compilerCategory}
                          onChange={(event) => setCompilerCategory(event.target.value)}
                          className="mt-3 w-full rounded-3xl border border-slate-800 bg-slate-950/90 px-4 py-3 text-sm text-white outline-none"
                        />
                      </div>
                      <div className="rounded-3xl bg-slate-950/70 p-4">
                        <label className="text-sm uppercase tracking-[0.22em] text-slate-500">Source</label>
                        <textarea
                          rows={6}
                          value={compilerCode}
                          onChange={(event) => setCompilerCode(event.target.value)}
                          className="mt-3 w-full rounded-3xl border border-slate-800 bg-slate-950/90 px-4 py-3 text-sm text-white outline-none"
                        />
                      </div>
                    </div>
                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <button
                        onClick={handleCompileSchema}
                        className="rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                        disabled={compilerLoading}
                      >
                        {compilerLoading ? "Compiling…" : "Compile API Blueprint"}
                      </button>
                      <p className="text-sm text-slate-400">Generates a readiness package for VNP leaderboard registration.</p>
                    </div>
                    {compileError && (
                      <div className="mt-4 rounded-3xl bg-rose-500/10 p-4 text-sm text-rose-200">{compileError}</div>
                    )}
                    {compileResult && (
                      <div className="mt-4 rounded-3xl bg-emerald-500/10 p-4 text-sm text-emerald-200">
                        Schema compiled successfully. Review the tool package and submit for leaderboard ingestion.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-xl shadow-slate-950/20">
              <div className="flex items-center gap-3 text-slate-300">
                <Activity className="h-5 w-5 text-cyan-300" />
                <p className="text-sm uppercase tracking-[0.28em]">Live pipeline</p>
              </div>
              <div className="mt-5 space-y-3">
                <div className="rounded-3xl bg-slate-900/80 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Consensus score</p>
                      <p className="mt-2 text-2xl font-semibold text-white">{sandboxResult.score}/100</p>
                    </div>
                    <div className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan-300">{sandboxResult.tier}</div>
                  </div>
                  <p className="mt-3 text-sm text-slate-400">{sandboxResult.desc}</p>
                </div>
                <div className="rounded-3xl bg-slate-900/80 p-4">
                  <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Sandbox configuration</p>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Regulatory architecture</label>
                      <select
                        value={sandboxRegArch}
                        onChange={(event) => setSandboxRegArch(event.target.value)}
                        className="mt-3 w-full rounded-3xl border border-slate-800 bg-slate-950/90 px-4 py-3 text-sm text-white outline-none"
                      >
                        <option>FedRAMP High / NIST</option>
                        <option>GDPR Zero-Leak Enclave</option>
                        <option>HIPAA Protected Health</option>
                        <option>Canada Health Act (PIPEDA)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Sovereign zone</label>
                      <select
                        value={sandboxSovZone}
                        onChange={(event) => setSandboxSovZone(event.target.value)}
                        className="mt-3 w-full rounded-3xl border border-slate-800 bg-slate-950/90 px-4 py-3 text-sm text-white outline-none"
                      >
                        <option>US-Federal Gov Node</option>
                        <option>CA-Sovereign Central</option>
                        <option>EU-Dublin Enclave</option>
                        <option>Asia-Sovereign Tokyo</option>
                      </select>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-xs uppercase tracking-[0.2em] text-slate-500">NIST keys</label>
                        <div className="mt-3 flex items-center gap-3">
                          <button
                            onClick={() => setSandboxNistKeys(true)}
                            className={`rounded-full px-3 py-2 text-sm ${sandboxNistKeys ? "bg-cyan-500 text-slate-950" : "bg-white/5 text-slate-300"}`}
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setSandboxNistKeys(false)}
                            className={`rounded-full px-3 py-2 text-sm ${!sandboxNistKeys ? "bg-cyan-500 text-slate-950" : "bg-white/5 text-slate-300"}`}
                          >
                            No
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Residency</label>
                        <div className="mt-3 flex items-center gap-3">
                          <button
                            onClick={() => setSandboxResidency(true)}
                            className={`rounded-full px-3 py-2 text-sm ${sandboxResidency ? "bg-cyan-500 text-slate-950" : "bg-white/5 text-slate-300"}`}
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setSandboxResidency(false)}
                            className={`rounded-full px-3 py-2 text-sm ${!sandboxResidency ? "bg-cyan-500 text-slate-950" : "bg-white/5 text-slate-300"}`}
                          >
                            No
                          </button>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-[0.2em] text-slate-500">LLM discoverability</label>
                      <input
                        type="range"
                        min="50"
                        max="100"
                        value={sandboxLLMDiscoverability}
                        onChange={(event) => setSandboxLLMDiscoverability(Number(event.target.value))}
                        className="mt-3 w-full accent-cyan-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Latency target (ms)</label>
                      <input
                        type="range"
                        min="10"
                        max="500"
                        value={sandboxLatencyTarget}
                        onChange={(event) => setSandboxLatencyTarget(Number(event.target.value))}
                        className="mt-3 w-full accent-cyan-400"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-xl shadow-slate-950/20">
              <div className="flex items-center gap-3 text-slate-300">
                <Play className="h-5 w-5 text-cyan-300" />
                <p className="text-sm uppercase tracking-[0.28em]">Operational alerts</p>
              </div>
              <div className="mt-5 space-y-4">
                <div className="rounded-3xl bg-slate-900/80 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Recent probe health</p>
                  <p className="mt-3 text-sm text-slate-400">All VNP probes are actively monitoring the trust network.</p>
                </div>
                <div className="rounded-3xl bg-slate-900/80 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Incident review</p>
                    <span className="rounded-full bg-rose-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-rose-300">4 unresolved</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-400">Open governance issues are available in the Incidents panel.</p>
                </div>
              </div>
            </div>
          </aside>
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-xl shadow-slate-950/30">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Evidence feed</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Live VNP probe logs</h2>
            </div>
            <button
              onClick={scrollToLogs}
              className="rounded-full bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            >
              Jump to latest
            </button>
          </div>
          <div className="mt-6 space-y-3">
            {logs.length ? logs.map(log => (
              <div key={log.id} className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{log.source}</p>
                    <p className="mt-1 text-xs text-slate-500">{new Date(log.timestamp).toLocaleString()}</p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.22em] ${log.type === "success" ? "bg-emerald-500/10 text-emerald-300" : log.type === "error" ? "bg-rose-500/10 text-rose-300" : log.type === "warning" ? "bg-amber-500/10 text-amber-300" : "bg-slate-700/10 text-slate-300"}`}>
                    {log.type}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-300">{log.message}</p>
              </div>
            )) : (
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 text-sm text-slate-400">No logs available yet.</div>
            )}
            <div ref={logsEndRef} />
          </div>
        </section>

        <AnimatePresence>
          {selectedMarket && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed inset-0 z-50 flex items-end justify-center p-6 sm:items-center"
            >
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setSelectedMarket(null)} />
              <div className="relative z-10 w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-950/95 p-6 shadow-2xl shadow-black/50">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Stake</p>
                    <h3 className="mt-2 text-2xl font-semibold text-white">{selectedMarket.title}</h3>
                  </div>
                  <button
                    onClick={() => setSelectedMarket(null)}
                    className="rounded-full bg-white/5 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10"
                  >
                    Close
                  </button>
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-slate-900/80 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Outcome</p>
                    <div className="mt-3 flex gap-3">
                      <button
                        onClick={() => setBetOutcome("YES")}
                        className={`rounded-full px-4 py-2 text-sm ${betOutcome === "YES" ? "bg-cyan-500 text-slate-950" : "bg-white/5 text-slate-300"}`}
                      >
                        YES
                      </button>
                      <button
                        onClick={() => setBetOutcome("NO")}
                        className={`rounded-full px-4 py-2 text-sm ${betOutcome === "NO" ? "bg-cyan-500 text-slate-950" : "bg-white/5 text-slate-300"}`}
                      >
                        NO
                      </button>
                    </div>
                  </div>
                  <div className="rounded-3xl bg-slate-900/80 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Amount</p>
                    <input
                      type="number"
                      value={betAmount}
                      onChange={(event) => setBetAmount(event.target.value)}
                      className="mt-3 w-full rounded-3xl border border-slate-800 bg-slate-950/90 px-4 py-3 text-sm text-white outline-none"
                    />
                  </div>
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-3xl bg-slate-900/80 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Estimated payout</p>
                    <p className="mt-3 text-2xl font-semibold text-white">{payoutEstimate} VEK</p>
                  </div>
                  <div className="rounded-3xl bg-slate-900/80 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Pool status</p>
                    <p className="mt-3 text-2xl font-semibold text-slate-200">{selectedMarket.resolved ? "Closed" : "Open"}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-900/80 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Market risk</p>
                    <p className="mt-3 text-2xl font-semibold text-slate-200">{selectedMarket.category}</p>
                  </div>
                </div>
                {txError && <div className="mt-4 rounded-3xl bg-rose-500/10 p-4 text-sm text-rose-200">{txError}</div>}
                {txSuccess && <div className="mt-4 rounded-3xl bg-emerald-500/10 p-4 text-sm text-emerald-200">Stake placed successfully.</div>}
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    onClick={handlePlaceStake}
                    className="rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                  >
                    Confirm stake
                  </button>
                  <button
                    onClick={() => setSelectedMarket(null)}
                    className="rounded-full bg-white/5 px-6 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
