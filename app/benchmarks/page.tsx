"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Shield,
  BarChart2,
  Cpu,
  Network,
  Fingerprint,
  BookOpen,
  Award,
} from "lucide-react";
import useSWR from "swr";
import { fetcher } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

import Shell from "@/components/Shell";
import TierGate from "@/components/TierGate";
import TriageTelemetry from "@/components/telemetry/TriageTelemetry";

import type { BenchmarkApiEntry } from "@/lib/vnp/types";
import type { ApiState } from "@/components/vnp/types";
import { computeLeaderboard } from "@/lib/vnp/scoring";

// Dynamically import premium components with ssr: false to prevent hydration mismatches
const BenchmarkPanel = dynamic(() => import("@/components/vnp/BenchmarkPanel"), { ssr: false });
const PGLIdentityLayer = dynamic(() => import("@/components/vnp/PGLIdentityLayer"), { ssr: false });
const ConsensusVisualization = dynamic(() => import("@/components/vnp/ConsensusVisualization"), { ssr: false });
const MethodologyPanel = dynamic(() => import("@/components/vnp/MethodologyPanel"), { ssr: false });
const ProviderIntelPanel = dynamic(() => import("@/components/vnp/ProviderIntelPanel"), { ssr: false });
const CertifyPanel = dynamic(() => import("@/components/vnp/CertifyPanel"), { ssr: false });

const generateSHA = () =>
  Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");

const fmtMs = (n: number) => `${n.toFixed(1)}ms`;

// Helper mapper to transform raw API responses from backend to ApiState type for BenchmarkPanel
const mapToApiState = (api: BenchmarkApiEntry): ApiState => {
  return {
    id: api.id,
    name: api.name,
    endpoint: api.endpointUrl || `https://api.veklom.com/api/v1/benchmarks/${api.id}`,
    version: "v1.0.0",
    compositeScore: api.govScore || 85,
    x402Ready: api.complianceLabels.includes("x402"),
    stabilityRating: api.uptime24h > 99.9 ? "AAA" : api.uptime24h > 99.5 ? "AA" : "A",
    regions: {
      "us-east": {
        p50: api.p50,
        p95: api.p95,
        p99: api.p99,
        errorRate: api.drift * 0.01,
        uptime: api.uptime24h,
        throughput: api.throughput * 0.45,
      },
      "us-west": {
        p50: api.p50 * 1.04,
        p95: api.p95 * 1.05,
        p99: api.p99 * 1.06,
        errorRate: api.drift * 0.01 * 1.05,
        uptime: api.uptime24h * 0.999,
        throughput: api.throughput * 0.25,
      },
      "eu-west": {
        p50: api.p50 * 1.15,
        p95: api.p95 * 1.16,
        p99: api.p99 * 1.18,
        errorRate: api.drift * 0.01 * 1.1,
        uptime: api.uptime24h * 0.998,
        throughput: api.throughput * 0.2,
      },
      "ap-southeast": {
        p50: api.p50 * 1.3,
        p95: api.p95 * 1.32,
        p99: api.p99 * 1.35,
        errorRate: api.drift * 0.01 * 1.2,
        uptime: api.uptime24h * 0.995,
        throughput: api.throughput * 0.08,
      },
      "ap-northeast": {
        p50: api.p50 * 1.35,
        p95: api.p95 * 1.38,
        p99: api.p99 * 1.4,
        errorRate: api.drift * 0.01 * 1.25,
        uptime: api.uptime24h * 0.996,
        throughput: api.throughput * 0.02,
      },
    },
  };
};

// ============ M2M Terminal Component ============
function M2MTerminal({ apis }: { apis: BenchmarkApiEntry[] }) {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    if (apis.length === 0) return;
    const interval = setInterval(() => {
      const api = apis[Math.floor(Math.random() * apis.length)];
      if (!api) return;
      const types = ["MEASUREMENT", "ANCHOR", "SCORE UPDATE"];
      const type = types[Math.floor(Math.random() * types.length)];
      const id = generateSHA().substring(0, 16);
      const text = type === "MEASUREMENT"
        ? `Latency probe for ${api.name} from eu-west-1: ${fmtMs(api.p95 + Math.random() * 10)}`
        : type === "ANCHOR"
        ? `Re-anchoring ${api.id} to Base L2: 0x${generateSHA().substring(0, 12)}`
        : `Consensus reached for ${api.name}. New stability score: ${api.uptime24h.toFixed(2)}%`;

      setLogs((prev) => [{ id, type, text }, ...prev].slice(0, 25));
    }, 2000);
    return () => clearInterval(interval);
  }, [apis]);

  return (
    <div className="flex flex-col h-full font-mono text-[11px] p-5">
      <div className="flex items-center justify-between mb-6">
        <span className="text-[10px] font-bold text-white tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          VNP MEASUREMENT FEED
        </span>
        <span className="text-[9px] text-[#A1A1A6]">LIVE_SYNC</span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        <AnimatePresence initial={false}>
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-3 bg-[#0d121c]/40 border border-[#1A1A1A] rounded-lg space-y-1"
            >
              <div className="flex items-center justify-between text-[8px] border-b border-[#1A1A1A] pb-1 mb-1">
                <span className="text-[#A1A1A6]">Hash: {log.id}</span>
                <span className={`px-1 rounded border ${
                  log.type === "MEASUREMENT" ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" :
                  log.type === "ANCHOR" ? "text-blue-400 border-blue-500/30 bg-blue-500/10" :
                  "text-indigo-400 border-indigo-500/30 bg-indigo-500/10"
                }`}>
                  {log.type}
                </span>
              </div>
              <p className="text-slate-300 leading-tight break-all">{log.text}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div className="mt-4 pt-4 border-t border-[#1A1A1A] text-[9px] text-[#A1A1A6] flex justify-between uppercase font-bold">
        <span>Target: Base L2</span>
        <span>v2.1.0-sovereign</span>
      </div>
    </div>
  );
}

// ============ Main Page Content ============
function BenchmarksPageContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as "trust" | "pgl" | "consensus" | "provider" | "certify" | "methodology") || "trust";
  const [activeTab, setActiveTab] = useState<"trust" | "pgl" | "consensus" | "provider" | "certify" | "methodology">(initialTab);

  const { data: lbData, isLoading: lbLoading, mutate: mutateLb } = useSWR<BenchmarkApiEntry[]>(
    "/api/v1/benchmarks/leaderboard",
    fetcher,
    { refreshInterval: 8000 },
  );

  const [blockAnchored, setBlockAnchored] = useState<number>(45912803);
  const [trustBeacon, setTrustBeacon] = useState<string>("0x8f2cdbcde92d84711ac8f9219dbb38a4a5817d91");

  useEffect(() => {
    const interval = setInterval(() => {
      setBlockAnchored(prev => prev + 1);
      setTrustBeacon("0x" + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(""));
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  const apis = useMemo(() => {
    return Array.isArray(lbData) ? lbData : [];
  }, [lbData]);

  const scores = useMemo(() => {
    return computeLeaderboard(apis);
  }, [apis]);

  const apiStates = useMemo<ApiState[]>(() => {
    return apis.map(mapToApiState);
  }, [apis]);

  if (lbLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center font-mono">
        <Cpu className="w-12 h-12 text-[#FFB800] animate-pulse mb-6" />
        <div className="text-[#FFB800] tracking-widest text-sm uppercase">INITIALIZING NEXUS PROTOCOL...</div>
      </div>
    );
  }

  return (
    <Shell>
      <TierGate required="starter" feature="VNP Benchmarks">
        <div className="flex flex-col xl:flex-row h-full bg-[#0A0A0A] text-white font-sans overflow-hidden selection:bg-[#FFB800]/30 -m-6 min-h-[calc(100vh-3.5rem)]">
          {/* Left Panel: PGL Terminal */}
          <div className="hidden xl:flex flex-col w-[350px] border-r border-[#1A1A1A] bg-[#050505] z-10 shrink-0">
            <M2MTerminal apis={apis} />
          </div>

          {/* Right Panel: Interactive Console */}
          <div className="flex-1 flex flex-col h-full overflow-hidden relative">
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#FFB800]/5 rounded-full blur-[150px] pointer-events-none" />

            {/* Header */}
            <header className="px-8 py-10 border-b border-[#1A1A1A] relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-2 py-0.5 rounded-sm bg-[#FFB800] text-black font-mono text-[10px] font-bold tracking-widest uppercase">CORE MODULE</span>
                <span className="text-[#A1A1A6] font-mono text-xs uppercase tracking-widest">v2.1.0-sovereign</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-medium tracking-tight mb-3">Veklom Nexus Protocol</h1>
              <p className="text-[#A1A1A6] max-w-2xl text-sm leading-relaxed">
                The mathematically undisputable trust and capability router. APIs are benchmarked,
                cryptographically verified, and continuously evaluated for sovereign deployment.
              </p>

              <div className="flex flex-wrap gap-1 mt-10 p-1 bg-[#111111] border border-[#1A1A1A] rounded-lg w-fit">
                {[
                  { id: "trust", label: "Trust Node Matrix", icon: Shield },
                  { id: "pgl", label: "PGL Identity Layer", icon: Fingerprint },
                  { id: "consensus", label: "Consensus Vector", icon: Network },
                  { id: "provider", label: "Provider Intel", icon: Cpu },
                  { id: "certify", label: "Certify & Badges", icon: Award },
                  { id: "methodology", label: "Methodology", icon: BookOpen },
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

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-8 custom-scrollbar relative z-10">
              <AnimatePresence mode="wait">
                {activeTab === "trust" && (
                  <motion.div
                    key="trust"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <BenchmarkPanel
                      apis={apiStates}
                      trustBeacon={trustBeacon}
                      blockAnchored={blockAnchored}
                      onRefreshTelemetry={() => mutateLb()}
                    />
                    <TriageTelemetry context="benchmarks" />
                  </motion.div>
                )}

                {activeTab === "pgl" && (
                  <motion.div
                    key="pgl"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <PGLIdentityLayer scores={scores} />
                  </motion.div>
                )}

                {activeTab === "consensus" && (
                  <motion.div
                    key="consensus"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <ConsensusVisualization scores={scores} />
                  </motion.div>
                )}

                {activeTab === "provider" && (
                  <motion.div
                    key="provider"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <ProviderIntelPanel apis={apis} />
                  </motion.div>
                )}

                {activeTab === "certify" && (
                  <motion.div
                    key="certify"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <CertifyPanel apis={apis} />
                  </motion.div>
                )}

                {activeTab === "methodology" && (
                  <motion.div
                    key="methodology"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <MethodologyPanel />
                  </motion.div>
                )}
              </AnimatePresence>
            </main>
          </div>
        </div>
      </TierGate>
    </Shell>
  );
}

export default function BenchmarksPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center font-mono">
        <Cpu className="w-12 h-12 text-[#FFB800] animate-pulse mb-6" />
        <div className="text-[#FFB800] tracking-widest text-sm uppercase">INITIALIZING NEXUS PROTOCOL...</div>
      </div>
    }>
      <BenchmarksPageContent />
    </Suspense>
  );
}

