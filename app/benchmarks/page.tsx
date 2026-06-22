"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import {
  Shield,
  Activity,
  BarChart2,
  Cpu,
  Network,
  Fingerprint,
  ArrowUpDown,
  Search,
  Filter,
  ExternalLink,
} from "lucide-react";
import useSWR from "swr";
import { fetcher } from "@/lib/api";
import { motion, AnimatePresence } from "motion/react";
import { useSearchParams } from "next/navigation";

import type { BenchmarkApiEntry, VNPScore } from "@/lib/vnp/types";
import { computeLeaderboard } from "@/lib/vnp/scoring";
import { VNP_DIMENSIONS, gradeForScore } from "@/lib/vnp/constants";
import { ScoreCard, MeasurementFeed, ConsensusVisualization } from "@/components/vnp";

// ============ Staking Types (preserved for Staking tab) ============
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

const fmtUSD = (n: number) => "$" + Math.round(n).toLocaleString("en-US");

// ============ Sort options for leaderboard ============
type SortKey = "composite" | "p99_latency" | "error_rate" | "availability" | "throughput" | "x402_compliance";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "composite", label: "VNP Composite" },
  { key: "p99_latency", label: "p99 Latency" },
  { key: "error_rate", label: "Error Rate" },
  { key: "availability", label: "Availability" },
  { key: "throughput", label: "Throughput" },
  { key: "x402_compliance", label: "x402 Compliance" },
];

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
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // Data fetching
  const { data: lbData, isLoading: lbLoading } = useSWR<BenchmarkApiEntry[]>(
    "/api/v1/benchmarks/leaderboard",
    fetcher,
    { refreshInterval: 8000 }
  );
  const { data: marketData } = useSWR<StakingMarket[]>(
    "/api/v1/benchmarks/staking/markets",
    fetcher,
    { refreshInterval: 10000 }
  );

  // VNP Scoring
  const [sortKey, setSortKey] = useState<SortKey>("composite");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const vnpScores = useMemo(() => {
    const list = Array.isArray(lbData) ? lbData : [];
    return computeLeaderboard(list);
  }, [lbData]);

  const categories = useMemo(() => {
    const cats = new Set(vnpScores.map((s) => s.category));
    return ["all", ...Array.from(cats).sort()];
  }, [vnpScores]);

  const filteredScores = useMemo(() => {
    let result = [...vnpScores];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.apiName.toLowerCase().includes(q) ||
          s.provider.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (categoryFilter !== "all") {
      result = result.filter((s) => s.category === categoryFilter);
    }

    // Sort
    result.sort((a, b) => {
      if (sortKey === "composite") return b.composite - a.composite;
      const dimA = a.dimensions.find((d) => d.id === sortKey);
      const dimB = b.dimensions.find((d) => d.id === sortKey);
      return (dimB?.normalized ?? 0) - (dimA?.normalized ?? 0);
    });

    return result;
  }, [vnpScores, searchQuery, categoryFilter, sortKey]);

  const markets = Array.isArray(marketData) ? marketData : [];

  // Aggregate stats
  const avgComposite = vnpScores.length > 0
    ? vnpScores.reduce((s, v) => s + v.composite, 0) / vnpScores.length
    : 0;
  const totalMeasurements = vnpScores.reduce((s, v) => s + v.measurementCount, 0);
  const apisWithHighConfidence = vnpScores.filter((s) => s.confidence.level === "high").length;

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
      {/* Left Panel: Measurement Feed */}
      <div className="hidden xl:flex flex-col w-[380px] border-r border-[#1A1A1A] bg-[#050505] z-10">
        <MeasurementFeed scores={vnpScores} />
      </div>

      {/* Right Panel: Interactive Console */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#FFB800]/5 rounded-full blur-[150px] pointer-events-none" />

        {/* Header */}
        <header className="px-8 py-8 border-b border-[#1A1A1A] relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="px-2 py-0.5 rounded-sm bg-[#FFB800] text-black font-mono text-[10px] font-bold tracking-widest uppercase">
              Core Module
            </span>
            <span className="text-[#A1A1A6] font-mono text-xs uppercase tracking-widest">
              v0.1.0-mainnet
            </span>
            <span className="flex items-center gap-1 text-[9px] font-bold tracking-wider text-[#3EE7A2] ml-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3EE7A2] animate-pulse" />
              LIVE
            </span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-medium tracking-tight mb-2">
            Veklom Nexus Protocol
          </h1>
          <p className="text-[#A1A1A6] max-w-3xl text-sm leading-relaxed">
            Open, community-governed API benchmark scoring for machine-consumable trust.
            10 dimensions, cryptographically anchored on Base L2, measured via k6 across 5 global regions.
          </p>

          {/* Stats bar */}
          <div className="flex items-center gap-6 mt-5 text-[10px] font-mono uppercase tracking-widest">
            <div>
              <span className="text-[#6E6E73]">APIs Scored</span>
              <span className="text-white ml-2">{vnpScores.length}</span>
            </div>
            <div className="w-px h-4 bg-[#242424]" />
            <div>
              <span className="text-[#6E6E73]">Avg Composite</span>
              <span className="text-[#FFB800] ml-2">{avgComposite.toFixed(1)}</span>
            </div>
            <div className="w-px h-4 bg-[#242424]" />
            <div>
              <span className="text-[#6E6E73]">Measurements</span>
              <span className="text-white ml-2">{totalMeasurements.toLocaleString()}</span>
            </div>
            <div className="w-px h-4 bg-[#242424]" />
            <div>
              <span className="text-[#6E6E73]">High Confidence</span>
              <span className="text-[#3EE7A2] ml-2">{apisWithHighConfidence}/{vnpScores.length}</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-1 mt-8 p-1 bg-[#111111] border border-[#1A1A1A] rounded-lg w-fit">
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

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar relative z-10">
          <AnimatePresence mode="wait">
            {/* ======== TRUST NODE MATRIX — VNP Leaderboard ======== */}
            {activeTab === "trust" && (
              <motion.div
                key="trust"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {/* Toolbar: search, filter, sort */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  {/* Search */}
                  <div className="flex items-center gap-2 rounded-lg border border-[#242424] bg-[#111111] px-3 h-9 flex-1 min-w-[200px] max-w-md focus-within:border-[#FFB800]/40 transition">
                    <Search className="w-4 h-4 text-[#6E6E73]" />
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search APIs, providers..."
                      className="flex-1 bg-transparent text-sm text-white placeholder:text-[#6E6E73] outline-none"
                    />
                  </div>

                  {/* Category filter */}
                  <div className="flex items-center gap-2 rounded-lg border border-[#242424] bg-[#111111] px-3 h-9">
                    <Filter className="w-3.5 h-3.5 text-[#6E6E73]" />
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="bg-transparent text-sm text-[#A1A1A6] outline-none cursor-pointer"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat} className="bg-[#111111]">
                          {cat === "all" ? "All Categories" : cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sort */}
                  <div className="flex items-center gap-2 rounded-lg border border-[#242424] bg-[#111111] px-3 h-9">
                    <ArrowUpDown className="w-3.5 h-3.5 text-[#6E6E73]" />
                    <select
                      value={sortKey}
                      onChange={(e) => setSortKey(e.target.value as SortKey)}
                      className="bg-transparent text-sm text-[#A1A1A6] outline-none cursor-pointer"
                    >
                      {SORT_OPTIONS.map((opt) => (
                        <option key={opt.key} value={opt.key} className="bg-[#111111]">
                          Sort: {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <span className="text-[10px] font-mono text-[#6E6E73] ml-auto">
                    {filteredScores.length} APIs
                  </span>
                </div>

                {/* Dimension legend */}
                <div className="flex flex-wrap items-center gap-3 mb-6 p-3 rounded-lg border border-[#1A1A1A] bg-[#0D0D0D]">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-[#6E6E73] mr-2">
                    10 Dimensions:
                  </span>
                  {VNP_DIMENSIONS.map((dim) => (
                    <span
                      key={dim.id}
                      className="text-[9px] font-mono text-[#A1A1A6] px-2 py-0.5 rounded border border-[#242424] bg-[#111111]"
                      title={`${dim.label} — Weight: ${(dim.weight * 100).toFixed(0)}%`}
                    >
                      {dim.shortLabel} <span className="text-[#6E6E73]">{(dim.weight * 100).toFixed(0)}%</span>
                    </span>
                  ))}
                </div>

                {/* Score cards grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-5">
                  {filteredScores.map((score) => (
                    <ScoreCard key={score.apiId} score={score} />
                  ))}
                </div>

                {filteredScores.length === 0 && (
                  <div className="text-center py-20 text-[#6E6E73]">
                    <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No APIs match your filters</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* ======== STAKING PROTOCOL ======== */}
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

                  {markets.length === 0 && (
                    <div className="p-10 text-center text-[#6E6E73] text-sm">
                      Staking markets will be available once VNP scoring is fully operational.
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ======== CONSENSUS VECTOR ======== */}
            {activeTab === "consensus" && (
              <motion.div
                key="consensus"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <ConsensusVisualization scores={vnpScores} />
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
