"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Shield,
  Activity,
  BarChart2,
  Layers,
  Cpu,
  Terminal,
  Server,
  Network,
  Fingerprint,
  Lock,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import useSWR from "swr";
import { fetcher } from "@/lib/api";
import { motion, AnimatePresence } from "motion/react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

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

interface StakingMarket {
  id: string;
  title: string;
  category: string;
  yesPrice: number;
  noPrice: number;
  volume: number;
  poolYes: number;
  poolNo: number;
  resolutionDate: string;
  targetApi: string;
  resolved: boolean;
  outcome?: string | null;
}

// ============ Utilities ============
const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(n)));

function pillarsFor(a: BenchApi) {
  const security = clamp(a.govScore);
  const performance = clamp(a.devScore);
  const compliance = clamp(70 + (4 - a.sovereignTier) * 7 + (a.complianceLabels?.length ?? 0) * 3);
  const trust = Math.round(((security + performance + compliance) / 3) * 10);
  return { security, performance, compliance, trust };
}

const fmtUSD = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
const fmtPct = (n: number) => `${n.toFixed(2)}%`;
const fmtMs = (n: number) => `${n.toFixed(1)}ms`;

// ============ Mock M2M Terminal Data ============
const generateSHA = () =>
  Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");

function M2MTerminal({ apis }: { apis: BenchApi[] }) {
  const [logs, setLogs] = useState<{ id: string; hash: string; msg: string; type: string }[]>([]);

  useEffect(() => {
    if (!apis || apis.length === 0) return;
    const interval = setInterval(() => {
      const target = apis[Math.floor(Math.random() * apis.length)];
      const type = Math.random() > 0.7 ? "GOV_CHECK" : "ROUTE_EVAL";
      const hash = generateSHA();
      const newLog = {
        id: Math.random().toString(36).substring(7),
        hash: hash.substring(0, 16) + "...",
        type,
        msg: `[${target.name}] ${type === "GOV_CHECK" ? "Trust verification passed" : "Capability route established"}`,
      };
      setLogs((prev) => [newLog, ...prev].slice(0, 30));
    }, 1500);
    return () => clearInterval(interval);
  }, [apis]);

  return (
    <div className="h-full flex flex-col font-mono text-xs">
      <div className="flex items-center gap-2 p-4 border-b border-[#1A1A1A] bg-[#050505]">
        <Terminal className="w-4 h-4 text-[#FFB800]" />
        <span className="text-[#A1A1A6] font-semibold tracking-widest uppercase">
          PGL Immutable Feed
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#FFB800] animate-pulse" />
          <span className="text-[#FFB800] tracking-widest">LIVE</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0A0A0A] custom-scrollbar">
        <AnimatePresence>
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="group"
            >
              <div className="text-[#A1A1A6] opacity-50 mb-0.5">
                <Fingerprint className="w-3 h-3 inline mr-1" />
                {log.hash}
              </div>
              <div className="flex items-start gap-2">
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] uppercase tracking-widest ${
                    log.type === "GOV_CHECK"
                      ? "bg-[#FFB800]/10 text-[#FFB800] border border-[#FFB800]/20"
                      : "bg-[#FFFFFF]/5 text-[#FFFFFF] border border-[#FFFFFF]/10"
                  }`}
                >
                  {log.type}
                </span>
                <span className="text-white/80 mt-0.5">{log.msg}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {logs.length === 0 && (
          <div className="text-[#A1A1A6] opacity-50 text-center mt-10">Awaiting M2M Handshakes...</div>
        )}
      </div>
      <div className="p-4 border-t border-[#1A1A1A] bg-[#050505]">
        <div className="flex justify-between items-center text-[#A1A1A6]">
          <span>Crypto-State: SECURE</span>
          <span>SHA-256</span>
        </div>
      </div>
    </div>
  );
}

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// ============ Page ============
function NexusConsoleInner() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as "trust" | "staking" | "consensus") || "trust";
  const [activeTab, setActiveTab] = useState<"trust" | "staking" | "consensus">(initialTab);

  // Sync state if URL changes directly
  useEffect(() => {
    const tab = searchParams.get("tab") as "trust" | "staking" | "consensus";
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const { data: lbData, isLoading: lbLoading } = useSWR<BenchApi[]>(
    "/api/v1/benchmarks/leaderboard",
    fetcher,
    { refreshInterval: 8000 }
  );
  const { data: marketData } = useSWR<StakingMarket[]>(
    "/api/v1/benchmarks/staking/markets",
    fetcher,
    { refreshInterval: 10000 }
  );

  const apis = useMemo(() => {
    const list = Array.isArray(lbData) ? lbData : [];
    return [...list]
      .map((a) => ({ api: a, pillars: pillarsFor(a) }))
      .sort((x, y) => y.pillars.trust - x.pillars.trust);
  }, [lbData]);

  const markets = Array.isArray(marketData) ? marketData : [];

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
        {/* Subtle background glow */}
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

          {/* Navigation Tabs */}
          <div className="flex gap-1 mt-10 p-1 bg-[#111111] border border-[#1A1A1A] rounded-lg w-fit">
            {[
              { id: "trust", label: "Trust Node Matrix", icon: Shield },
              { id: "staking", label: "Staking Protocol", icon: BarChart2 },
              { id: "consensus", label: "Consensus Vector", icon: Network },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
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

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar relative z-10">
          <AnimatePresence mode="wait">
            {activeTab === "trust" && (
              <motion.div
                key="trust"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {apis.map(({ api, pillars }) => (
                  <div
                    key={api.id}
                    className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-6 hover:border-[#FFB800]/30 transition-all group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Server className="w-32 h-32 text-[#FFB800]" />
                    </div>
                    
                    <div className="flex justify-between items-start mb-6 relative z-10">
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-1">{api.name}</h3>
                        <div className="text-xs font-mono text-[#A1A1A6] uppercase tracking-widest">
                          {api.provider || "Veklom Network"}
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="text-3xl font-light text-[#FFB800]">
                          {pillars.trust}
                        </div>
                        <div className="text-[10px] font-mono text-[#FFB800]/50 uppercase tracking-widest">
                          Trust Index
                        </div>
                      </div>
                    </div>

                    {/* Radar Chart for capability visualization */}
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
                            { subject: "SLA", A: api.sla, fullMark: 100 },
                          ]}
                        >
                          <PolarGrid stroke="#1A1A1A" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: "#A1A1A6", fontSize: 10 }} />
                          <Radar
                            name="Capabilities"
                            dataKey="A"
                            stroke="#FFB800"
                            strokeWidth={1.5}
                            fill="#FFB800"
                            fillOpacity={0.1}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
                      <div>
                        <div className="text-[10px] font-mono text-[#A1A1A6] uppercase mb-1">Latency p95</div>
                        <div className="text-sm">{fmtMs(api.p95)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono text-[#A1A1A6] uppercase mb-1">Throughput</div>
                        <div className="text-sm">{Math.round(api.throughput)} req/s</div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#1A1A1A] flex flex-wrap gap-2 relative z-10">
                      {api.complianceLabels.map((lbl) => (
                        <span
                          key={lbl}
                          className="px-2 py-1 bg-[#1A1A1A] border border-[#333333] text-[#A1A1A6] text-[10px] uppercase font-mono rounded"
                        >
                          {lbl}
                        </span>
                      ))}
                      <span className="px-2 py-1 bg-[#FFB800]/10 border border-[#FFB800]/20 text-[#FFB800] text-[10px] uppercase font-mono rounded">
                        Tier {api.sovereignTier}
                      </span>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === "staking" && (
              <motion.div
                key="staking"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-5xl"
              >
                <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl overflow-hidden">
                  <div className="grid grid-cols-12 gap-4 p-4 border-b border-[#1A1A1A] bg-[#111111] text-[10px] font-mono uppercase tracking-widest text-[#A1A1A6]">
                    <div className="col-span-4">Protocol Objective</div>
                    <div className="col-span-2 text-right">Pool Volume</div>
                    <div className="col-span-3 text-center">Depth (YES / NO)</div>
                    <div className="col-span-3 text-right">Execution Vector</div>
                  </div>
                  
                  <div className="divide-y divide-[#1A1A1A]">
                    {markets.map((market) => {
                      const totalPool = market.poolYes + market.poolNo;
                      const yesPct = totalPool > 0 ? (market.poolYes / totalPool) * 100 : 50;
                      
                      return (
                        <div key={market.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-[#111111] transition-colors">
                          <div className="col-span-4">
                            <div className="text-sm text-white font-medium mb-1">{market.title}</div>
                            <div className="text-[10px] font-mono text-[#A1A1A6]">
                              Resolution: {new Date(market.resolutionDate).toLocaleDateString()}
                            </div>
                          </div>
                          
                          <div className="col-span-2 text-right font-mono text-sm text-[#A1A1A6]">
                            {fmtUSD(market.volume)}
                          </div>
                          
                          <div className="col-span-3">
                            <div className="h-1.5 w-full bg-[#333333] rounded-full overflow-hidden flex">
                              <div className="h-full bg-emerald-500" style={{ width: `${yesPct}%` }} />
                              <div className="h-full bg-rose-500" style={{ width: `${100 - yesPct}%` }} />
                            </div>
                            <div className="flex justify-between mt-2 text-[10px] font-mono">
                              <span className="text-emerald-400">{yesPct.toFixed(1)}%</span>
                              <span className="text-rose-400">{(100 - yesPct).toFixed(1)}%</span>
                            </div>
                          </div>
                          
                          <div className="col-span-3 flex justify-end gap-2">
                            <button className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium rounded hover:bg-emerald-500/20 transition-all">
                              YES @ {(market.yesPrice / 100).toFixed(2)}
                            </button>
                            <button className="px-4 py-1.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium rounded hover:bg-rose-500/20 transition-all">
                              NO @ {(market.noPrice / 100).toFixed(2)}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "consensus" && (
              <motion.div
                key="consensus"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center justify-center py-20"
              >
                <div className="relative w-full max-w-3xl aspect-[2/1] border border-[#1A1A1A] rounded-2xl bg-[#0D0D0D] flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/cubes.png')] opacity-5" />
                  
                  <div className="flex items-center gap-12 relative z-10">
                    <div className="flex flex-col gap-4">
                      {[1, 2, 3].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
                          className="w-16 h-16 rounded-xl border border-[#333333] bg-[#111111] flex items-center justify-center shadow-lg"
                        >
                          <Server className="w-6 h-6 text-[#A1A1A6]" />
                        </motion.div>
                      ))}
                    </div>
                    
                    <ArrowRight className="w-8 h-8 text-[#FFB800] opacity-50" />
                    
                    <motion.div
                      animate={{ scale: [1, 1.05, 1], boxShadow: ["0 0 0px #FFB800", "0 0 30px #FFB800", "0 0 0px #FFB800"] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="w-32 h-32 rounded-full border-2 border-[#FFB800] bg-[#FFB800]/10 flex flex-col items-center justify-center backdrop-blur-md"
                    >
                      <Lock className="w-8 h-8 text-[#FFB800] mb-2" />
                      <span className="text-[10px] font-mono text-[#FFB800] uppercase tracking-widest">
                        Consensus
                      </span>
                    </motion.div>
                    
                    <ArrowRight className="w-8 h-8 text-[#FFB800] opacity-50" />
                    
                    <div className="w-16 h-16 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center">
                      <Activity className="w-6 h-6 text-emerald-400" />
                    </div>
                  </div>
                </div>
                
                <p className="mt-8 text-center text-[#A1A1A6] max-w-lg text-sm leading-relaxed">
                  The M2M Capability Router determines endpoint validity via multi-node consensus.
                  Results are hashed into the PGL immutable identity layer.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default function VeklomNexusProtocol() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center font-mono">
        <div className="text-[#FFB800] tracking-widest text-sm animate-pulse">
          INITIALIZING NEXUS PROTOCOL...
        </div>
      </div>
    }>
      <NexusConsoleInner />
    </Suspense>
  );
}
