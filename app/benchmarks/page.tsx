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
        fetch("/api/benchmarks/leaderboard"),
        fetch("/api/benchmarks/staking/markets"),
        fetch("/api/benchmarks/logs"),
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
    
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) {
      setTxError("Please enter a valid amount.");
      return;
    }
    
    if (amount > vekBalance) {
      setTxError("Insufficient operating reserve balance.");
      return;
    }
    
    try {
      const response = await fetch("/api/benchmarks/staking/stake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          market_id: selectedMarket.id,
          outcome: betOutcome,
          amount: amount
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        setTxError(errorData.detail || "Transaction failed.");
        return;
      }

      const resData = await response.json();
      setVekBalance(resData.new_balance);
      
      // Update market metrics locally instantly
      setMarkets(prev => prev.map(m => {
        if (m.id === selectedMarket.id) {
          return {
            ...m,
            volume: resData.volume,
            yesPrice: resData.yesPrice,
            noPrice: resData.noPrice
          };
        }
        return m;
      }));
      
      setTxSuccess(true);
      setTxError(null);
      
      setTimeout(() => {
        setTxSuccess(false);
        setSelectedMarket(null);
        fetchData(); // reload complete backend state
      }, 1500);

    } catch (err) {
      setTxError("Failed to submit stake to backend.");
    }
  };

  const handleCompileAPI = async () => {
    if (!compilerCode.trim()) {
      setCompileError("Please enter raw API definitions or code to compile.");
      return;
    }
    
    setCompilerLoading(true);
    setCompileError(null);
    setCompileResult(null);

    try {
      const response = await fetch("/api/benchmarks/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codeText: compilerCode,
          apiName: compilerName,
          category: compilerCategory
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        setCompileError(errorData.detail || "Compilation request failed.");
        return;
      }

      const data = await response.json();
      setCompileResult(data);
      // Instantly trigger leaderboard pull to show new model
      fetchData();
    } catch (err) {
      setCompileError("Unable to establish connection with Gemini Compiler.");
    } finally {
      setCompilerLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 text-[#F3F4F6]">
      
      {/* Branding & Header Metrics */}
      <header className="rounded-xl border border-white/10 bg-white/[0.02] backdrop-blur-md p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2 text-white">
            VEKLOM API TRUST Rankings & SLA Pit
          </h1>
          <p className="text-xs text-ink-400 mt-1 uppercase tracking-wider font-mono">
            Pillar 6: API Observability rankings & synthetic-resolved prediction markets
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-lg px-4 py-2">
            <Coins className="h-4 w-4 text-brand-400" />
            <div className="text-right font-mono">
              <div className="text-[10px] text-ink-500 uppercase font-bold">Operating Reserve</div>
              <div className="text-sm font-bold text-brand-300">${vekBalance.toLocaleString()} USD</div>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-lg px-4 py-2">
            <Activity className="h-4 w-4 text-emerald-400 animate-pulse" />
            <div className="text-right font-mono">
              <div className="text-[10px] text-ink-500 uppercase font-bold">Oracle Status</div>
              <div className="text-xs font-bold text-emerald-400">ACTIVE (500 pings/s)</div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation & Actions Subbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex bg-white/[0.04] p-1 rounded-lg border border-white/10 self-start">
          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "leaderboard"
                ? "bg-brand-500/20 text-brand-300 border border-brand-500/30"
                : "text-ink-300 hover:text-white"
            }`}
          >
            <Sliders className="h-4 w-4" />
            API Trust Rankings
          </button>
          <button
            onClick={() => setActiveTab("staking")}
            className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "staking"
                ? "bg-brand-500/20 text-brand-300 border border-brand-500/30"
                : "text-ink-300 hover:text-white"
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            SLA Staking Pit
          </button>
          <button
            onClick={() => setActiveTab("blueprint")}
            className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "blueprint"
                ? "bg-brand-500/20 text-brand-300 border border-brand-500/30"
                : "text-ink-300 hover:text-white"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            Consensus Blueprint
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          <Link
            href="/benchmarks/arena"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/[0.05] border border-white/10 text-ink-200 hover:text-white hover:bg-white/[0.08] transition"
          >
            <Gamepad2 className="h-3.5 w-3.5" />
            Authority Arena
          </Link>
          <Link
            href="/benchmarks/discovery"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/[0.05] border border-white/10 text-ink-200 hover:text-white hover:bg-white/[0.08] transition"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Veklom Discovery
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center text-ink-400 font-mono text-xs flex flex-col items-center justify-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-t border-brand-500"></div>
          Retrieving real data streams from Veklom backend...
        </div>
      ) : (
        /* Main Workspace Grid */
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          
          {/* Left Column: Primary Tab Workspace (Spans 3 cols on desktop) */}
          <div className="xl:col-span-3 flex flex-col gap-6">
            
            {/* TAB 1: API TRUST RANKINGS */}
            {activeTab === "leaderboard" && (
              <div className="flex flex-col gap-6">
                
                {/* Sliders Rebalancing Panel */}
                <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5 flex flex-col gap-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Consolidated Rating Rebalancing</h2>
                      <p className="text-xs text-ink-400 mt-0.5 font-sans">Tweak the bias to adjust weights between Regulatory Compliance and Developer Performance metrics.</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-mono font-bold">
                      <span className={weight < 50 ? "text-cyan-400" : "text-ink-400"}>DEVELOPER FIRST ({100 - weight}%)</span>
                      <span className="text-ink-600">|</span>
                      <span className={weight > 50 ? "text-brand-300" : "text-ink-400"}>SOVEREIGN FIRST ({weight}%)</span>
                    </div>
                  </div>
                  
                  {/* Weight slider custom styling */}
                  <div className="relative py-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={weight}
                      onChange={(e) => setWeight(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-500"
                    />
                    <div className="flex justify-between text-[9px] text-ink-500 font-mono mt-1">
                      <span>Bias: Latency + SLA + Drift</span>
                      <span>Bias: FedRAMP + GDPR + PIPEDA</span>
                    </div>
                  </div>

                  {/* Search and Quick Filters bar */}
                  <div className="flex items-center gap-2 border-t border-white/5 pt-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-500" />
                      <input
                        type="text"
                        placeholder="Search API endpoints by name, provider, or category..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 hover:border-white/20 focus:border-brand-500/50 outline-none rounded-lg py-2 pl-9 pr-4 text-xs font-mono text-white placeholder-ink-500"
                      />
                    </div>
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 text-ink-300 hover:text-white px-2.5 py-2 rounded-lg text-xs font-mono transition cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                {/* API Cards Grid (Benchmark-Arena style) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredApis.map((api, idx) => (
                    <div
                      key={api.id}
                      className="bg-neutral-900/60 border border-white/5 backdrop-blur-md hover:border-brand-500/30 rounded-xl p-5 flex flex-col justify-between gap-4 group transition-all duration-300 relative overflow-hidden"
                    >
                      {/* Soft background glow based on rating */}
                      <div className={`absolute top-0 right-0 w-32 h-32 blur-[64px] rounded-full pointer-events-none opacity-20 transition-all ${
                        (api.rating || 0) >= 90 ? "bg-emerald-500" :
                        (api.rating || 0) >= 80 ? "bg-cyan-500" :
                        (api.rating || 0) >= 70 ? "bg-amber-500" :
                        "bg-red-500"
                      }`} />

                      <div className="flex flex-col gap-3 relative z-10">
                        {/* Header: Status Indicator & Category Badge */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className={`h-2 w-2 rounded-full relative flex`}>
                              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                                api.status === "excellent" ? "bg-emerald-400" :
                                api.status === "nominal" ? "bg-cyan-400" :
                                "bg-amber-500"
                              }`} />
                              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                                api.status === "excellent" ? "bg-emerald-500" :
                                api.status === "nominal" ? "bg-cyan-500" :
                                "bg-amber-500"
                              }`} />
                            </span>
                            <span className="text-[10px] text-ink-400 font-mono font-bold uppercase uppercase tracking-wider">
                              Rank #{idx + 1}
                            </span>
                          </div>
                          
                          <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                            api.category === "Payment" ? "bg-amber-400/10 text-amber-400 border border-amber-400/20" :
                            api.category === "Banking" ? "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20" :
                            api.category === "Registry" ? "bg-cyan-400/10 text-cyan-400 border border-cyan-400/20" :
                            api.category === "Infrastructure" ? "bg-purple-400/10 text-purple-400 border border-purple-400/20" :
                            "bg-pink-400/10 text-pink-400 border border-pink-400/20"
                          }`}>
                            {api.category}
                          </span>
                        </div>

                        {/* Title and Provider */}
                        <div className="flex flex-col">
                          <h3 className="text-sm font-bold text-white leading-snug group-hover:text-brand-300 transition-colors">
                            {api.name}
                          </h3>
                          <span className="text-[10px] text-ink-500 font-mono font-semibold mt-0.5">
                            By {api.provider || "Self-Published"}
                          </span>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 gap-2.5 border-t border-b border-white/5 py-3 font-mono text-[10px] text-ink-400">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-ink-500 uppercase text-[8px] font-bold">Latency P50/P95</span>
                            <span className="font-bold text-white text-[11px]">
                              {Math.round(api.p50)}ms <span className="text-ink-500">/</span> {Math.round(api.p95)}ms
                            </span>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-ink-500 uppercase text-[8px] font-bold">SLA Success</span>
                            <span className={`font-bold text-[11px] ${api.sla >= 99.9 ? "text-emerald-400" : "text-amber-400"}`}>
                              {api.sla.toFixed(2)}%
                            </span>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-ink-500 uppercase text-[8px] font-bold">Drift Index</span>
                            <span className={`font-bold text-[11px] ${api.drift < 1.0 ? "text-emerald-400" : "text-amber-400"}`}>
                              {api.drift.toFixed(2)}%
                            </span>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-ink-500 uppercase text-[8px] font-bold">Sovereign Tier</span>
                            <span className={`font-bold text-[11px] ${
                              api.sovereignTier === 1 ? "text-brand-300" :
                              api.sovereignTier === 2 ? "text-cyan-400" :
                              "text-ink-300"
                            }`}>
                              Tier-{api.sovereignTier}
                            </span>
                          </div>
                        </div>

                        {/* Compliance Labels tags */}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {api.complianceLabels.slice(0, 3).map(lbl => (
                            <span key={lbl} className="bg-white/5 border border-white/10 text-[8.5px] px-1.5 py-0.5 rounded font-mono text-ink-300">
                              {lbl}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Score Badge and Action */}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 relative z-10">
                        <div className="flex items-baseline gap-1">
                          <span className={`text-xl font-mono font-black ${
                            (api.rating || 0) >= 95 ? "text-emerald-400" :
                            (api.rating || 0) >= 90 ? "text-cyan-400" :
                            (api.rating || 0) >= 80 ? "text-amber-400" :
                            "text-red-400"
                          }`}>
                            {api.rating}
                          </span>
                          <span className="text-ink-600 text-[10px] font-mono">/100</span>
                        </div>

                        <button
                          onClick={() => setSelectedApi(api)}
                          className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-brand-300 hover:text-white transition cursor-pointer"
                        >
                          Inspect Schema
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredApis.length === 0 && (
                  <div className="py-16 text-center text-ink-500 font-mono text-xs border border-dashed border-white/10 rounded-xl">
                    No API endpoints matched your query. Try searching another category or compile a new one.
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: SLA STAKING PIT */}
            {activeTab === "staking" && (
              <div className="flex flex-col gap-6">
                
                {/* Markets Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {markets.map(market => (
                    <div 
                      key={market.id} 
                      className="bg-neutral-900/60 border border-white/5 backdrop-blur-md rounded-xl p-5 flex flex-col justify-between gap-4 hover:border-brand-500/30 transition-all group"
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider text-ink-300">
                            Pool #{market.id} · {market.category}
                          </span>
                          <span className="text-[10px] text-ink-400 font-mono">
                            Resolves: {market.resolutionDate}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-white leading-relaxed group-hover:text-brand-300 transition-colors">
                          {market.title}
                        </h3>
                        <p className="text-[10.5px] text-ink-500 font-mono mt-0.5">
                          Target API: <span className="text-white">{market.targetApi}</span>
                        </p>
                      </div>

                      <div className="border-t border-white/5 pt-4 flex flex-col gap-4">
                        {/* Price odds widgets */}
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => {
                              setSelectedMarket(market);
                              setBetOutcome("YES");
                            }}
                            className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 rounded-lg p-3 text-left transition flex items-center justify-between cursor-pointer animate-duration-300"
                          >
                            <div className="flex flex-col">
                              <span className="text-[10px] uppercase font-bold text-emerald-400">Bet YES</span>
                              <span className="text-xs text-ink-400 font-mono">Current price</span>
                            </div>
                            <span className="text-lg font-black font-mono text-emerald-400">{market.yesPrice}¢</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedMarket(market);
                              setBetOutcome("NO");
                            }}
                            className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 rounded-lg p-3 text-left transition flex items-center justify-between cursor-pointer"
                          >
                            <div className="flex flex-col">
                              <span className="text-[10px] uppercase font-bold text-red-400">Bet NO</span>
                              <span className="text-xs text-ink-400 font-mono">Current price</span>
                            </div>
                            <span className="text-lg font-black font-mono text-red-400">{market.noPrice}¢</span>
                          </button>
                        </div>

                        {/* Pool Volume and progress bar */}
                        <div className="flex flex-col gap-1 font-mono text-[9px] text-ink-500">
                          <div className="flex items-center justify-between">
                            <span>Pool Volume: <span className="text-white font-bold">${market.volume.toLocaleString()} USD</span></span>
                            <span className="text-emerald-400">{market.yesPrice}% YES Probability</span>
                          </div>
                          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden flex">
                            <div className="bg-emerald-500 h-full" style={{ width: `${market.yesPrice}%` }} />
                            <div className="bg-red-500 h-full" style={{ width: `${market.noPrice}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: CONSENSUS BLUEPRINT & COMPILER */}
            {activeTab === "blueprint" && (
              <div className="flex flex-col gap-6">
                
                {/* Header overview */}
                <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                  <div className="flex items-center gap-2.5 mb-2.5 text-brand-300">
                    <BookOpen className="h-5 w-5" />
                    <h2 className="text-base font-bold text-white uppercase tracking-wider font-mono">Sovereign & Developer Consensus Standards</h2>
                  </div>
                  <p className="text-xs text-ink-400 leading-relaxed max-w-3xl">
                    By combining the strict compliance requirements of state-level registries with the high velocity of developer-facing schemas, we establish a unified evaluation harness for high-impact production REST APIs and financial channels.
                  </p>
                </div>

                {/* Gemini AI API Schema Compiler Section */}
                <div className="bg-neutral-900/60 border border-white/5 rounded-xl p-6 flex flex-col gap-5">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-brand-400 animate-pulse" />
                      Gemini MCPAPI Compiler & Synthesis Node
                    </h3>
                    <p className="text-xs text-ink-400 mt-0.5">
                      Input raw API source code, Swagger definitions, or endpoint docs. Gemini will compile it into a joint REST & MCP tool schema and register it on the leaderboard.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                    
                    {/* Compiler Inputs */}
                    <div className="flex flex-col gap-4 bg-black/20 border border-white/5 p-4 rounded-xl">
                      <h4 className="text-xs font-mono font-bold text-ink-300 uppercase tracking-wider border-b border-white/5 pb-2">
                        Configure Spec Properties
                      </h4>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] font-mono text-ink-500 uppercase font-bold">API Endpoint Name</label>
                          <input
                            type="text"
                            value={compilerName}
                            onChange={(e) => setCompilerName(e.target.value)}
                            placeholder="e.g. My Ledger API"
                            className="bg-black/40 border border-white/10 hover:border-white/20 focus:border-brand-500/50 outline-none rounded-lg py-2 px-3 text-xs font-mono text-white placeholder-ink-600"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] font-mono text-ink-500 uppercase font-bold">Category</label>
                          <select
                            value={compilerCategory}
                            onChange={(e) => setCompilerCategory(e.target.value)}
                            className="bg-black/40 border border-white/10 hover:border-white/20 focus:border-brand-500/50 outline-none rounded-lg py-2 px-3 text-xs font-mono text-ink-200 cursor-pointer"
                          >
                            <option value="Payment">Payment</option>
                            <option value="Banking">Banking</option>
                            <option value="Registry">Registry</option>
                            <option value="Infrastructure">Infrastructure</option>
                            <option value="Healthcare">Healthcare</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-mono text-ink-500 uppercase font-bold">Raw Code / Spec Documentation</label>
                        <textarea
                          value={compilerCode}
                          onChange={(e) => setCompilerCode(e.target.value)}
                          rows={8}
                          className="w-full bg-black/50 border border-white/10 hover:border-white/20 focus:border-brand-500/50 outline-none rounded-lg p-3 text-xs font-mono text-brand-300 font-bold resize-none"
                          placeholder="Paste API code block, endpoint description, or parameters spec here..."
                        />
                      </div>

                      {compileError && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 shrink-0" />
                          {compileError}
                        </div>
                      )}

                      <button
                        onClick={handleCompileAPI}
                        disabled={compilerLoading}
                        className={`w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          compilerLoading
                            ? "bg-brand-500/20 text-brand-300 border border-brand-500/30 cursor-not-allowed"
                            : "bg-brand-500 hover:bg-brand-600 text-black"
                        }`}
                      >
                        {compilerLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-3.5 w-3.5 border-t-2 border-brand-400" />
                            COMPILING SCHEMA WITH GEMINI...
                          </>
                        ) : (
                          <>
                            <UploadCloud className="h-4 w-4" />
                            Compile & Register Endpoint
                          </>
                        )}
                      </button>
                    </div>

                    {/* Compiler Output */}
                    <div className="flex flex-col bg-black/40 border border-white/10 p-5 rounded-xl justify-between h-[390px]">
                      <div className="flex flex-col gap-3 h-full overflow-hidden">
                        <div className="flex items-center justify-between pb-2 border-b border-white/5">
                          <span className="text-[10px] font-mono font-bold text-ink-400 uppercase">Compiler Logs & Output</span>
                          <span className={`text-[8.5px] uppercase font-mono px-2 py-0.5 rounded ${
                            compileResult ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                            compilerLoading ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                            "bg-white/5 text-ink-500 border border-white/10"
                          }`}>
                            {compileResult ? "READY" : compilerLoading ? "COMPILING" : "IDLE"}
                          </span>
                        </div>

                        {/* Result Display */}
                        {compileResult ? (
                          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 scroll-thin" style={{ scrollbarWidth: "thin" }}>
                            
                            {/* Synthesis verification cards */}
                            <div className="grid grid-cols-4 gap-2 font-mono text-[9px] text-center">
                              <div className="bg-white/5 p-2 rounded border border-white/5">
                                <div className="text-ink-500 uppercase font-bold text-[7.5px]">Latency</div>
                                <div className="text-white font-black text-xs mt-0.5">{compileResult.syntheticVerificationResult?.latencyMs}ms</div>
                              </div>
                              <div className="bg-white/5 p-2 rounded border border-white/5">
                                <div className="text-ink-500 uppercase font-bold text-[7.5px]">Drift</div>
                                <div className="text-white font-black text-xs mt-0.5">{compileResult.syntheticVerificationResult?.driftScore}%</div>
                              </div>
                              <div className="bg-white/5 p-2 rounded border border-white/5">
                                <div className="text-ink-500 uppercase font-bold text-[7.5px]">Discoverable</div>
                                <div className="text-brand-300 font-black text-xs mt-0.5">{compileResult.syntheticVerificationResult?.uniquenessFactor}%</div>
                              </div>
                              <div className="bg-white/5 p-2 rounded border border-white/5">
                                <div className="text-ink-500 uppercase font-bold text-[7.5px]">Comprehension</div>
                                <div className="text-cyan-400 font-black text-xs mt-0.5">{compileResult.syntheticVerificationResult?.comprehensionScore}%</div>
                              </div>
                            </div>

                            {/* Feedbacks */}
                            <div className="bg-brand-500/[0.03] border border-brand-500/10 p-3 rounded-lg text-xs leading-relaxed text-ink-300 font-sans">
                              <span className="font-mono font-bold text-[10px] text-brand-300 uppercase block mb-1">AI Evaluation Analysis:</span>
                              {compileResult.syntheticVerificationResult?.aiFeedback}
                            </div>

                            {/* Schema pretty JSON */}
                            <div className="flex-1 flex flex-col gap-1 mt-1 font-mono text-[9.5px]">
                              <span className="text-[8px] text-ink-500 uppercase font-bold font-mono">Compiled Joint REST + MCP JSON Schema</span>
                              <pre className="bg-black/60 p-3 rounded-lg border border-white/5 text-cyan-400 overflow-x-auto text-[9px] select-all max-h-[160px] scroll-thin" style={{ scrollbarWidth: "thin" }}>
                                {JSON.stringify(compileResult.mcpToolDefinition, null, 2)}
                              </pre>
                            </div>
                          </div>
                        ) : compilerLoading ? (
                          <div className="flex-1 flex flex-col items-center justify-center text-center font-mono text-[10px] text-brand-300 gap-3">
                            <Terminal className="h-6 w-6 text-brand-400 animate-pulse" />
                            <div className="flex flex-col gap-1">
                              <span>Scanning AST / Parameter declarations...</span>
                              <span className="text-ink-500 text-[9px] animate-pulse">Running synthetic probe validation...</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 flex flex-col items-center justify-center text-center font-mono text-[10.5px] text-ink-500 gap-2">
                            <Code className="h-6 w-6 text-ink-600" />
                            <span>Awaiting source compilation code inputs...</span>
                          </div>
                        )}
                      </div>

                      {compileResult && (
                        <div className="mt-4 border-t border-white/5 pt-3 flex items-center justify-between text-[9px] font-mono text-emerald-400 font-semibold">
                          <span>✓ Dynamic Schema synthesised and registered.</span>
                          <span>Published to rankings.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Split Informational Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Sovereign Government Standard Panel */}
                  <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between pb-3 border-b border-white/5">
                      <span className="text-xs font-mono font-bold text-brand-400 uppercase tracking-wider">01. SOVEREIGN GOV FRAMEWORK</span>
                      <span className="bg-brand-500/10 text-brand-400 border border-brand-500/20 text-[9px] font-mono px-2 py-0.5 rounded">Compliance</span>
                    </div>

                    <div className="flex flex-col gap-3 text-xs text-ink-400 leading-relaxed">
                      <p>
                        Governments prioritize absolute reliability, local data residency, strict security parameters, and audit trails. Legacy SOAP services are heavily gated but historically slow.
                      </p>
                      <ul className="space-y-2.5 list-disc pl-4 font-mono text-[10.5px] text-ink-300">
                        <li><strong>Data Residency:</strong> Enforces regional sovereign boundaries (e.g. EU GDPR enclaves, Canada Central enclaves, FedRAMP US Gov Cloud enclaves).</li>
                        <li><strong>Crypto Standards:</strong> Enforces FIPS 140-3 cryptography, TLS 1.3 channels, and certified NIST-SP-800-53 keys.</li>
                        <li><strong>Regulatory Guardrails:</strong> Adheres to regional mandates such as the Treasury Board Directives, Canada Health Act, and FINTRAC Guideline 4.</li>
                      </ul>
                    </div>
                  </div>

                  {/* Fast-Paced Developer Standard Panel */}
                  <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between pb-3 border-b border-white/5">
                      <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">02. DEVELOPER VELOCITY</span>
                      <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[9px] font-mono px-2 py-0.5 rounded">Performance</span>
                    </div>

                    <div className="flex flex-col gap-3 text-xs text-ink-400 leading-relaxed">
                      <p>
                        Developers prioritize velocity, response latency, clear Swagger schemas, and zero-shot model binding. If a model cannot easily parse the endpoint, integration fails.
                      </p>
                      <ul className="space-y-2.5 list-disc pl-4 font-mono text-[10.5px] text-ink-300">
                        <li><strong>Low Latency targets:</strong> High-throughput REST API execution completing in under 30ms to preserve LLM token context timelines.</li>
                        <li><strong>Zero-Shot Binding:</strong> Semantic metadata parameters that query engines can cleanly interpret to compose custom integrations.</li>
                        <li><strong>Drift index immunization:</strong> Continuous synthetic checks that alert if parameters slide or schemas fail validation.</li>
                      </ul>
                    </div>
                  </div>

                </div>

                {/* Interactive Sandbox Auditor Checklist */}
                <div className="bg-white/[0.02] border border-white/10 rounded-xl p-6">
                  <div className="border-b border-white/5 pb-4 mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-brand-400 rounded-full animate-pulse" />
                        Interactive Consensus Sandbox Score Evaluator
                      </h3>
                      <p className="text-xs text-ink-400 mt-0.5">
                        Simulate how a custom endpoint compiles against our unified standards in real-time.
                      </p>
                    </div>
                    <span className="text-[10px] bg-black/40 text-brand-300 border border-white/10 font-mono px-2.5 py-1 rounded">
                      Standard: VEKAPI-V1-Draft
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Simulated Inputs Checklist */}
                    <div className="flex flex-col gap-4">
                      <h4 className="text-xs font-mono font-bold text-ink-300 uppercase tracking-wider">Configure Audit Parameters</h4>
                      
                      <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[9px] font-mono text-ink-500 uppercase font-bold">REGULATORY ARCHITECTURE</label>
                            <select
                              value={sandboxRegArch}
                              onChange={(e) => setSandboxRegArch(e.target.value)}
                              className="bg-black/40 border border-white/10 hover:border-white/20 focus:border-brand-500/50 outline-none rounded-lg py-2 px-3 text-xs font-mono text-ink-200 cursor-pointer"
                            >
                              <option value="FedRAMP High / NIST">FedRAMP High / NIST</option>
                              <option value="HIPAA Protected Health">HIPAA Protected Health</option>
                              <option value="GDPR Zero-Leak Enclave">GDPR Zero-Leak Enclave</option>
                              <option value="Canada Health Act (PIPEDA)">Canada Health Act (PIPEDA)</option>
                            </select>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[9px] font-mono text-ink-500 uppercase font-bold">SOVEREIGNTY ZONE</label>
                            <select
                              value={sandboxSovZone}
                              onChange={(e) => setSandboxSovZone(e.target.value)}
                              className="bg-black/40 border border-white/10 hover:border-white/20 focus:border-brand-500/50 outline-none rounded-lg py-2 px-3 text-xs font-mono text-ink-200 cursor-pointer"
                            >
                              <option value="US-Federal Gov Node">US-Federal Gov Node</option>
                              <option value="CA-Sovereign Central">CA-Sovereign Central</option>
                              <option value="EU-Dublin Enclave">EU-Dublin Enclave</option>
                              <option value="Asia-Sovereign Tokyo">Asia-Sovereign Tokyo</option>
                            </select>
                          </div>
                        </div>

                        {/* Toggle 1: NIST crypt signatures */}
                        <div className="flex items-center justify-between p-3.5 bg-black/20 rounded-xl border border-white/5">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-mono font-semibold text-white">Certified NIST Key signatures</span>
                            <span className="text-[10px] text-ink-500 font-sans leading-relaxed">Signatures verified by audited hardware security modules (HSM)</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={sandboxNistKeys}
                            onChange={(e) => setSandboxNistKeys(e.target.checked)}
                            className="w-4 h-4 rounded border-white/10 text-brand-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-brand-500 shrink-0"
                          />
                        </div>

                        {/* Toggle 2: Local region residency */}
                        <div className="flex items-center justify-between p-3.5 bg-black/20 rounded-xl border border-white/5">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-mono font-semibold text-white">Verify Strict Data Sovereignty Residency</span>
                            <span className="text-[10px] text-ink-500 font-sans leading-relaxed">Ensures consumer payloads never leave regional geographic boundaries</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={sandboxResidency}
                            onChange={(e) => setSandboxResidency(e.target.checked)}
                            className="w-4 h-4 rounded border-white/10 text-brand-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-brand-500 shrink-0"
                          />
                        </div>

                        {/* Slider 1: LLM Discoverability schema */}
                        <div className="p-3.5 bg-black/20 rounded-xl border border-white/5 flex flex-col gap-2">
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="text-ink-200">LLM Zero-Shot Tool Discoverability</span>
                            <span className="text-brand-300 font-bold">{sandboxLLMDiscoverability}%</span>
                          </div>
                          <input
                            type="range"
                            min="50"
                            max="100"
                            value={sandboxLLMDiscoverability}
                            onChange={(e) => setSandboxLLMDiscoverability(parseInt(e.target.value))}
                            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-500"
                          />
                          <div className="text-[9px] text-ink-500 font-sans">Elegance of semantic metadata that LLMs can parse without manual tuning.</div>
                        </div>

                        {/* Slider 2: Latency Goals */}
                        <div className="p-3.5 bg-black/20 rounded-xl border border-white/5 flex flex-col gap-2">
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="text-ink-200">Target Response Latency Goal</span>
                            <span className="text-cyan-400 font-bold">{sandboxLatencyTarget}ms</span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="500"
                            value={sandboxLatencyTarget}
                            onChange={(e) => setSandboxLatencyTarget(parseInt(e.target.value))}
                            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-500"
                          />
                          <div className="text-[9px] text-ink-500 font-sans">Lower average latency reduces agent execution times and prevents timeouts.</div>
                        </div>

                      </div>
                    </div>

                    {/* Result calculation panel */}
                    <div className="bg-black/40 rounded-xl border border-white/10 p-5 flex flex-col justify-between gap-6">
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between pb-2 border-b border-white/5">
                          <span className="text-[10px] font-mono font-bold text-ink-400 uppercase">Interactive Synthesis Result</span>
                          <span className="text-[9px] uppercase font-mono text-brand-300 bg-brand-500/10 border border-brand-500/20 px-2.5 py-0.5 rounded">CONSENSUS VERIFIED</span>
                        </div>

                        <div className="flex flex-col gap-4">
                          <div className="flex items-baseline justify-between">
                            <span className="text-xs text-ink-300 font-sans">Simulated Consensus Rating:</span>
                            <div className="text-right">
                              <span className="text-3xl font-mono font-black text-brand-300">{sandboxResult.score.toFixed(1)}</span>
                              <span className="text-ink-500 text-xs font-mono">/100</span>
                            </div>
                          </div>

                          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl flex flex-col gap-1.5">
                            <span className="text-[9px] font-mono text-ink-500 uppercase font-bold">CLASSIFICATION TIER</span>
                            <strong className="text-xs font-mono text-white tracking-wide">{sandboxResult.tier}</strong>
                            <p className="text-[10.5px] text-ink-400 font-sans leading-relaxed mt-1">
                              {sandboxResult.desc}
                            </p>
                          </div>

                          <div className="bg-brand-500/[0.03] border border-brand-500/10 p-4 rounded-xl text-xs text-ink-400 leading-relaxed">
                            To register and list an API endpoint on the official trust leaderboard, it must score at least a <strong className="text-white">70 Consolidated Rating</strong> under standard consensus rules.
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 border-t border-white/5 pt-4 flex items-center justify-between text-[10px] font-mono text-ink-500">
                        <span>Score formula: Dynamic Weighting Blend</span>
                        <span className="text-brand-300 font-bold">Consensus Standard Approved</span>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Right Column: Live Oracle Probe Feed (1 col) */}
          <div className="xl:col-span-1 flex flex-col gap-6">
            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5 flex flex-col gap-4 h-[580px]">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-brand-400 rounded-full animate-ping" />
                  Live Oracle Probes
                </h2>
                <p className="text-[10px] text-ink-500 mt-0.5">Real-time logs from Veklom synthetic validation nodes.</p>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-1 space-y-3 font-mono text-[10px] scroll-thin" style={{ scrollbarWidth: "thin" }}>
                <AnimatePresence initial={false}>
                  {logs.map(log => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border border-white/5 bg-black/20 p-2.5 rounded-lg flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between text-[8px] text-ink-500">
                        <span className="font-bold uppercase tracking-wider text-brand-300">{log.source}</span>
                        <span>{log.timestamp}</span>
                      </div>
                      <p className={`leading-relaxed text-[9.5px] ${
                        log.type === "success" ? "text-emerald-400" :
                        log.type === "warning" ? "text-amber-400" :
                        log.type === "error" ? "text-red-400" :
                        "text-ink-200"
                      }`}>
                        {log.message}
                      </p>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={logsEndRef} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STAKING DRAWER / MODAL SIDEBAR */}
      <AnimatePresence>
        {selectedMarket && (
          <div className="fixed inset-0 z-50 flex items-center justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMarket(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md h-full bg-[#111] border-l border-white/10 p-6 flex flex-col justify-between shadow-2xl z-10"
            >
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-ink-500 uppercase tracking-widest">SLA Staking Console</span>
                  <button 
                    onClick={() => setSelectedMarket(null)}
                    className="p-1 rounded-lg hover:bg-white/5 text-ink-400 hover:text-white transition"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="bg-brand-500/10 border border-brand-500/20 text-brand-300 text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded self-start">
                    Pool #{selectedMarket.id}
                  </span>
                  <h2 className="text-base font-bold text-white">{selectedMarket.title}</h2>
                  <p className="text-xs text-ink-400 mt-1 font-mono">
                    Resolves automatically from Veklom Oracle probes on <span className="text-white">{selectedMarket.resolutionDate}</span>.
                  </p>
                </div>

                {/* Outcome Toggle */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-mono text-ink-500 uppercase font-bold">Choose Outcome</label>
                  <div className="grid grid-cols-2 gap-2 bg-black/40 border border-white/10 p-1 rounded-lg">
                    <button
                      onClick={() => setBetOutcome("YES")}
                      className={`py-2 text-xs font-bold uppercase rounded-md transition cursor-pointer ${
                        betOutcome === "YES"
                          ? "bg-emerald-500 text-black"
                          : "text-emerald-400 hover:bg-white/5"
                      }`}
                    >
                      YES ({selectedMarket.yesPrice}¢)
                    </button>
                    <button
                      onClick={() => setBetOutcome("NO")}
                      className={`py-2 text-xs font-bold uppercase rounded-md transition cursor-pointer ${
                        betOutcome === "NO"
                          ? "bg-red-500 text-white"
                          : "text-red-400 hover:bg-white/5"
                      }`}
                    >
                      NO ({selectedMarket.noPrice}¢)
                    </button>
                  </div>
                </div>

                {/* Amount input */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-mono text-ink-500 uppercase font-bold">Staking Amount</label>
                    <span className="text-[10px] font-mono text-ink-400">
                      Balance: ${vekBalance.toLocaleString()} USD
                    </span>
                  </div>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-xs text-ink-500 font-mono">USD</span>
                    <input
                      type="number"
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 hover:border-white/20 focus:border-brand-500/50 outline-none rounded-lg py-2.5 pl-14 pr-4 text-sm font-mono text-brand-300 font-bold"
                    />
                  </div>
                  <div className="flex gap-1.5 mt-1">
                    {[50, 100, 250, 500].map(val => (
                      <button
                        key={val}
                        onClick={() => setBetAmount(val.toString())}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 rounded px-2.5 py-1 text-[10px] font-mono text-ink-300 hover:text-white transition cursor-pointer"
                      >
                        ${val}
                      </button>
                    ))}
                    <button
                      onClick={() => setBetAmount(vekBalance.toString())}
                      className="bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 rounded px-2.5 py-1 text-[10px] font-mono text-brand-300 hover:text-white transition cursor-pointer"
                    >
                      MAX
                    </button>
                  </div>
                </div>

                {/* Transaction details card */}
                <div className="bg-black/30 border border-white/5 rounded-lg p-4 font-mono text-xs flex flex-col gap-2.5 text-ink-300">
                  <div className="flex items-center justify-between">
                    <span>Outcome Price</span>
                    <span className="text-white font-bold">
                      {betOutcome === "YES" ? selectedMarket.yesPrice : selectedMarket.noPrice}¢
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Staked Amount</span>
                    <span className="text-white font-bold">${(parseFloat(betAmount) || 0).toLocaleString()} USD</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-white/5 pt-2 text-[13px]">
                    <span className="text-white">Estimated Payout</span>
                    <span className="text-emerald-400 font-bold">${payoutEstimate.toLocaleString()} USD</span>
                  </div>
                </div>

                {txError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    {txError}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4 border-t border-white/10 pt-4">
                <button
                  onClick={handlePlaceStake}
                  disabled={txSuccess}
                  className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    txSuccess
                      ? "bg-emerald-500 text-black"
                      : "bg-brand-500 hover:bg-brand-600 text-black"
                  }`}
                >
                  {txSuccess ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      STAKE SECURED
                    </>
                  ) : (
                    <>
                      <TrendingUp className="h-4 w-4" />
                      PLACE STAKE IN PIT (2.5% FEE)
                    </>
                  )}
                </button>
                <button
                  onClick={() => setSelectedMarket(null)}
                  className="w-full py-2.5 border border-white/10 hover:bg-white/5 rounded-xl text-xs font-semibold uppercase tracking-wider text-ink-300 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SCHEMA DETAIL INSPECT DRAWER */}
      <AnimatePresence>
        {selectedApi && (
          <div className="fixed inset-0 z-50 flex items-center justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedApi(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            {/* Wide Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 150 }}
              className="relative w-full max-w-4xl h-full bg-[#111] border-l border-white/10 p-6 flex flex-col justify-between shadow-2xl z-10"
            >
              <div className="flex flex-col gap-6 h-full overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-mono text-ink-500 uppercase tracking-widest">
                      Endpoint Inspector & Specification Panel
                    </span>
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                      {selectedApi.name}
                      <span className={`px-2 py-0.2 rounded text-[9px] font-mono font-bold uppercase ${
                        selectedApi.category === "Payment" ? "bg-amber-400/10 text-amber-400 border border-amber-400/20" :
                        selectedApi.category === "Banking" ? "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20" :
                        selectedApi.category === "Registry" ? "bg-cyan-400/10 text-cyan-400 border border-cyan-400/20" :
                        selectedApi.category === "Infrastructure" ? "bg-purple-400/10 text-purple-400 border border-purple-400/20" :
                        "bg-pink-400/10 text-pink-400 border border-pink-400/20"
                      }`}>
                        {selectedApi.category}
                      </span>
                    </h2>
                  </div>
                  <button 
                    onClick={() => setSelectedApi(null)}
                    className="p-1 rounded-lg hover:bg-white/5 text-ink-400 hover:text-white transition cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Two Column Content */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0 overflow-y-auto pr-1">
                  
                  {/* Left Column: Sovereignty & Audit Metrics */}
                  <div className="flex flex-col gap-4">
                    <div>
                      <h3 className="text-xs font-mono font-bold text-brand-300 uppercase tracking-wider mb-2">
                        Sovereignty & Audit Metadata
                      </h3>
                      <p className="text-xs text-ink-400 leading-relaxed font-sans">
                        {selectedApi.description || "Synthesised verification endpoint registered on the Veklom network."}
                      </p>
                    </div>

                    <div className="bg-black/30 border border-white/5 rounded-xl p-4 flex flex-col gap-3 font-mono text-xs">
                      <div className="flex justify-between">
                        <span className="text-ink-500">Provider:</span>
                        <span className="text-white font-bold">{selectedApi.provider || "Self-Published"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink-500">Status:</span>
                        <span className={`font-bold uppercase ${
                          selectedApi.status === "excellent" ? "text-emerald-400" :
                          selectedApi.status === "nominal" ? "text-cyan-400" :
                          "text-amber-500"
                        }`}>{selectedApi.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink-500">24h Uptime:</span>
                        <span className="text-white font-bold">{selectedApi.uptime24h || 99.9}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink-500">Throughput:</span>
                        <span className="text-white font-bold">{selectedApi.throughput?.toLocaleString() || 0} txn/s</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink-500">Total Staked:</span>
                        <span className="text-brand-300 font-bold">${selectedApi.totalStaked?.toLocaleString() || 0} USD</span>
                      </div>
                    </div>

                    {/* Sovereignty Compliance List */}
                    <div className="flex flex-col gap-2">
                      <h4 className="text-[10px] font-mono text-ink-500 uppercase font-bold">Sovereign Compliance Tiers</h4>
                      <div className="p-3.5 bg-black/40 border border-white/10 rounded-xl flex flex-col gap-2">
                        <strong className="text-xs text-brand-300 font-mono">
                          Sovereign Tier-{selectedApi.sovereignTier} Classification
                        </strong>
                        <p className="text-[10.5px] text-ink-400 font-sans leading-relaxed">
                          {selectedApi.sovereignTier === 1 && "Highly Gated: Mandates localized regional geographic enclaves, zero-shot LLM parameters reflection, and FIPS 140-3 HSM validation."}
                          {selectedApi.sovereignTier === 2 && "Regulated: Adheres to regional GDPR / PIPEDA guidelines. Zero data sharing or pipeline leaks detected."}
                          {selectedApi.sovereignTier === 3 && "Standard: Broad integration capabilities with standard TLS 1.3 encryption, subject to NIS regulations."}
                        </p>
                        
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {selectedApi.complianceLabels.map(lbl => (
                            <span key={lbl} className="bg-white/5 border border-white/10 text-[9px] px-2 py-0.5 rounded font-mono text-white">
                              {lbl}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Endpoint Target */}
                    <div className="flex flex-col gap-2">
                      <h4 className="text-[10px] font-mono text-ink-500 uppercase font-bold">API Target URL</h4>
                      <div className="p-3 bg-black/40 border border-white/10 rounded-xl font-mono text-xs text-white break-all select-all">
                        {selectedApi.endpointUrl || "https://api.veklom.local/v1/sandbox"}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Schema Specifications */}
                  <div className="flex flex-col gap-3 min-h-0">
                    <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                      UNIFIED MODEL CONTEXT PROTOCOL (MCP) SCHEMA
                    </h3>
                    
                    <div className="flex-1 bg-black/80 rounded-xl p-4 border border-white/10 overflow-auto font-mono text-[10.5px] text-cyan-400 scroll-thin" style={{ scrollbarWidth: "thin" }}>
                      <pre className="select-all">
                        {JSON.stringify(selectedApi.mcpSchema, null, 2)}
                      </pre>
                    </div>
                  </div>

                </div>

                {/* Footer Action */}
                <div className="border-t border-white/10 pt-4 flex justify-end shrink-0">
                  <button
                    onClick={() => setSelectedApi(null)}
                    className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider text-ink-300 transition cursor-pointer"
                  >
                    Close Inspector
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
