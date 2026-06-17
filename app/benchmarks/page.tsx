'use client';

import React, { useState, useMemo } from 'react';
import {
  Search, Shield, Zap, Lock, ChevronDown, Activity,
  BarChart2, FileCode, CheckCircle2, Globe2, ShieldCheck, Gamepad2, Layers,
  Cpu, Loader2, TrendingUp, AlertTriangle, Terminal, Coins
} from 'lucide-react';
import Link from 'next/link';
import useSWR from 'swr';
import { fetcher, api, getToken } from '@/lib/api';

// ============ Types (mirror backend /benchmarks contract) ============
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

interface ProbeLog {
  id: string;
  timestamp: string;
  source: string;
  type: string;
  message: string;
}

interface Pillars {
  security: number;
  performance: number;
  compliance: number;
  trust: number;
}

// ============ Derivations from real backend fields ============
const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(n)));

function pillarsFor(a: BenchApi): Pillars {
  const security = clamp(a.govScore);
  const performance = clamp(a.devScore);
  const compliance = clamp(70 + (4 - a.sovereignTier) * 7 + (a.complianceLabels?.length ?? 0) * 3);
  const trust = Math.round(((security + performance + compliance) / 3) * 10);
  return { security, performance, compliance, trust };
}

const fmtUSD = (n: number) =>
  '$' + Math.round(n).toLocaleString('en-US');
const fmtPct = (n: number) => `${n.toFixed(2)}%`;
const fmtMs = (n: number) => `${n.toFixed(1)}ms`;
const fmtNum = (n: number) => Math.round(n).toLocaleString('en-US');

function statusTone(status: string): string {
  const s = (status || '').toLowerCase();
  if (s.includes('excellent') || s.includes('healthy')) return 'emerald';
  if (s.includes('degrad') || s.includes('warn')) return 'amber';
  if (s.includes('crit') || s.includes('fail')) return 'rose';
  return 'slate';
}

// Production-safe class maps (avoid dynamic Tailwind class names that get purged)
const TONE: Record<string, { text: string; bg: string; border: string; bar: string; ring: string }> = {
  emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', bar: 'bg-emerald-500', ring: 'border-emerald-500' },
  amber: { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', bar: 'bg-amber-500', ring: 'border-amber-500' },
  rose: { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', bar: 'bg-rose-500', ring: 'border-rose-500' },
  slate: { text: 'text-slate-300', bg: 'bg-slate-700/30', border: 'border-slate-600/40', bar: 'bg-slate-500', ring: 'border-slate-500' },
  violet: { text: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20', bar: 'bg-violet-500', ring: 'border-violet-500' },
  cyan: { text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', bar: 'bg-cyan-500', ring: 'border-cyan-500' },
  blue: { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', bar: 'bg-blue-500', ring: 'border-blue-500' },
};

const BENCHMARK_MODULES = [
  { href: '/benchmarks/arena', label: 'Authority Arena', desc: 'Agent Character Creator, compliance scenarios, pipeline sandbox', icon: Gamepad2, badge: 'SANDBOX', tone: 'violet' },
  { href: '/benchmarks/discovery', label: 'Veklom Discovery', desc: 'x402 payments, ACP agents, Base MCP wallet, ENS resolution', icon: Globe2, badge: 'WEB3', tone: 'cyan' },
  { href: '/benchmarks/runtime-lab', label: 'Gateway Trust Contract', desc: '7-step pipeline, EAT token signing, policy presets, evidence ledger', icon: ShieldCheck, badge: 'LAB', tone: 'emerald' },
  { href: '/routing/live', label: 'Fault Matrix + SLO-Gate', desc: 'Chaos injection, Ollama -> Groq -> Gemini fallback drill, gradient routing', icon: Activity, badge: 'LIVE', tone: 'amber' },
];

function highlightJson(obj: unknown): string {
  const raw = JSON.stringify(obj ?? {}, null, 2);
  const esc = raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return esc
    .replace(/("(?:\\.|[^"\\])*")(\s*:)/g, '<span class="text-blue-400">$1</span>$2')
    .replace(/:\s*("(?:\\.|[^"\\])*")/g, ': <span class="text-emerald-400">$1</span>')
    .replace(/:\s*(-?\d+(?:\.\d+)?)/g, ': <span class="text-amber-300">$1</span>')
    .replace(/:\s*(true|false|null)/g, ': <span class="text-violet-400">$1</span>');
}

// ============ Page ============
export default function IronGridBenchmark() {
  const [activeTab, setActiveTab] = useState<'trust' | 'consensus' | 'staking'>('trust');
  const [searchQuery, setSearchQuery] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: lbData, error: lbError, isLoading: lbLoading } = useSWR<BenchApi[]>(
    '/api/v1/benchmarks/leaderboard',
    fetcher,
    { refreshInterval: 8000 }
  );
  const { data: marketData } = useSWR<StakingMarket[]>('/api/v1/benchmarks/staking/markets', fetcher, { refreshInterval: 10000 });

  const apis = useMemo(() => {
    const list = Array.isArray(lbData) ? lbData : [];
    return [...list]
      .map((a) => ({ api: a, pillars: pillarsFor(a) }))
      .sort((x, y) => y.pillars.trust - x.pillars.trust);
  }, [lbData]);

  const markets = Array.isArray(marketData) ? marketData : [];
  const activeMarkets = markets.filter((m) => !m.resolved).length;

  const stats = useMemo(() => {
    if (apis.length === 0) {
      return { tracked: 0, avgSla: '—', avgTrust: '—', totalStaked: '—', tier1: 0 };
    }
    const avgSla = apis.reduce((s, x) => s + x.api.sla, 0) / apis.length;
    const avgTrust = Math.round(apis.reduce((s, x) => s + x.pillars.trust, 0) / apis.length);
    const totalStaked = apis.reduce((s, x) => s + (x.api.totalStaked || 0), 0);
    const tier1 = apis.filter((x) => x.api.sovereignTier === 1).length;
    return {
      tracked: apis.length,
      avgSla: fmtPct(avgSla),
      avgTrust: `${avgTrust}/1000`,
      totalStaked: fmtUSD(totalStaked),
      tier1,
    };
  }, [apis]);

  const filtered = apis.filter(({ api: a }) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q) ||
      (a.provider || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#0A0D14] text-slate-300 font-sans p-6 overflow-x-hidden selection:bg-emerald-500/30">
      <div className="max-w-[1400px] mx-auto space-y-8">

        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 bg-slate-800/50 border border-slate-700/50 px-2 py-0.5 rounded-full uppercase">
              IronGrid Benchmark
            </span>
          </div>

          <h1 className="text-[2.5rem] leading-tight font-bold text-white tracking-tight">
            Veklom IronGrid Benchmark
          </h1>

          <p className="text-[15px] text-slate-400 max-w-3xl leading-relaxed">
            VABP-certified trust leaderboard with 3-pillar scoring (Security, Performance, Compliance),
            MCP schema inspection, Gemini-powered compilation, and SLA staking markets.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {lbError ? 'OFFLINE' : 'LIVE'}
            </span>
            <span className="text-[11px] font-mono font-bold tracking-widest text-slate-300 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-full uppercase">
              {stats.tracked} APIS TRACKED
            </span>
            <span className="text-[11px] font-mono font-bold tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full uppercase">
              {activeMarkets} ACTIVE MARKETS
            </span>
            <span className="text-[11px] font-mono font-bold tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full uppercase">
              AVG TRUST: {stats.avgTrust}
            </span>
          </div>
        </div>

        {/* Sub-module links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 mb-8">
          {BENCHMARK_MODULES.map((mod) => {
            const Icon = mod.icon;
            const t = TONE[mod.tone];
            return (
              <Link
                key={mod.href}
                href={mod.href}
                className="group flex flex-col gap-3 p-4 bg-[#11151C] hover:bg-[#1A202A] border border-[#1E2430] hover:border-[#2A3441] rounded-xl transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${t.bg} border ${t.border}`}>
                    <Icon className={`w-4 h-4 ${t.text}`} />
                  </div>
                  <span className={`text-[9px] font-mono font-bold ${t.text} ${t.bg} border ${t.border} px-1.5 py-0.5 rounded-full tracking-widest`}>
                    {mod.badge}
                  </span>
                </div>
                <div>
                  <h3 className="text-white text-sm font-semibold transition">{mod.label}</h3>
                  <p className="text-slate-500 text-xs mt-1 leading-relaxed line-clamp-2">{mod.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#1E2430] mt-8">
          {([
            { id: 'trust', label: 'Trust Leaderboard', icon: Shield },
            { id: 'consensus', label: 'Consensus Blueprint', icon: Layers },
            { id: 'staking', label: 'Staking Pit', icon: BarChart2 },
          ] as const).map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-[13px] font-semibold tracking-wide transition-colors ${
                  activeTab === tab.id
                    ? 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-500/5'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
                }`}
              >
                <TabIcon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'trust' && (
          <TrustLeaderboard
            stats={stats}
            apis={filtered}
            allCount={apis.length}
            loading={lbLoading}
            error={!!lbError}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            expanded={expanded}
            setExpanded={setExpanded}
          />
        )}

        {activeTab === 'consensus' && <ConsensusBlueprint />}

        {activeTab === 'staking' && <StakingPit markets={markets} />}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #0A0D14; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1E2430; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #2A3441; }
      `}} />
    </div>
  );
}

// ============ Trust Leaderboard ============
function TrustLeaderboard({
  stats, apis, allCount, loading, error, searchQuery, setSearchQuery, expanded, setExpanded,
}: {
  stats: { tracked: number; avgSla: string; avgTrust: string; totalStaked: string; tier1: number };
  apis: { api: BenchApi; pillars: Pillars }[];
  allCount: number;
  loading: boolean;
  error: boolean;
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  expanded: string | null;
  setExpanded: (s: string | null) => void;
}) {
  return (
    <div className="space-y-8">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search APIs by name, category, or provider..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#11151C] border border-amber-500/30 focus:border-amber-500 rounded-lg py-3.5 pl-11 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-colors"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'APIS TRACKED', value: stats.tracked, color: 'text-white' },
          { label: 'AVG SLA', value: stats.avgSla, color: 'text-emerald-400' },
          { label: 'AVG TRUST SCORE', value: stats.avgTrust, color: 'text-amber-400' },
          { label: 'TOTAL STAKED', value: stats.totalStaked, color: 'text-amber-400' },
          { label: 'TIER-1 CERTIFIED', value: stats.tier1, color: 'text-emerald-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-[#11151C] border border-[#1E2430] rounded-xl p-5">
            <h4 className="text-[10px] font-mono font-bold text-slate-500 tracking-wider mb-2">{stat.label}</h4>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* States */}
      {error && (
        <div className="flex items-center gap-3 bg-rose-500/5 border border-rose-500/20 rounded-xl p-5 text-rose-300 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          Live leaderboard unavailable — could not reach the benchmark API. Retrying automatically.
        </div>
      )}
      {!error && loading && allCount === 0 && (
        <div className="flex items-center gap-3 text-slate-500 text-sm p-6">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading live trust leaderboard…
        </div>
      )}
      {!error && !loading && apis.length === 0 && (
        <div className="text-slate-500 text-sm p-6 border border-[#1E2430] rounded-xl bg-[#11151C]">
          No APIs match “{searchQuery}”.
        </div>
      )}

      {/* Rows */}
      <div className="space-y-4">
        {apis.map(({ api: a, pillars }, idx) => (
          <LeaderboardRow
            key={a.id}
            rank={idx + 1}
            api={a}
            pillars={pillars}
            open={expanded === a.id}
            onToggle={() => setExpanded(expanded === a.id ? null : a.id)}
          />
        ))}
      </div>
    </div>
  );
}

function LeaderboardRow({
  rank, api: a, pillars, open, onToggle,
}: { rank: number; api: BenchApi; pillars: Pillars; open: boolean; onToggle: () => void }) {
  const tone = TONE[statusTone(a.status)];
  return (
    <div className="bg-[#11151C] border border-[#1E2430] rounded-xl overflow-hidden shadow-2xl shadow-black/40">
      {/* Header row */}
      <button onClick={onToggle} className="w-full text-left">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between p-6 gap-6 hover:bg-white/[0.015] transition-colors">
          <div className="flex items-center gap-5">
            <span className="text-slate-500 font-mono text-sm font-bold w-6">#{rank}</span>
            <div className={`w-12 h-12 rounded-xl ${tone.bg} border ${tone.border} flex items-center justify-center flex-shrink-0`}>
              <Zap className={`w-6 h-6 ${tone.text}`} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h2 className="text-xl font-bold text-white">{a.name}</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  TIER-{a.sovereignTier}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${tone.bg} ${tone.text} border ${tone.border} uppercase`}>
                  {a.status}
                </span>
              </div>
              <p className="text-sm text-slate-400">{a.provider || a.category}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {(a.complianceLabels || []).map((badge) => (
                  <span key={badge} className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#1A202A] border border-[#2A3441] text-[10px] font-mono font-bold text-amber-100/70">
                    <Lock className="w-3 h-3 text-amber-500/70" />
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-8 pl-14 lg:pl-0">
            <div className={`w-12 h-12 rounded-full border-[3px] ${tone.ring} flex items-center justify-center bg-[#0A0D14] flex-shrink-0`}>
              <span className={`${tone.text} font-bold text-sm`}>{pillars.trust}</span>
            </div>
            <div className="hidden md:flex gap-8">
              <Metric label="SLA" value={fmtPct(a.sla)} />
              <Metric label="P50" value={fmtMs(a.p50)} />
              <Metric label="THROUGHPUT" value={`${fmtNum(a.throughput)}/s`} />
              <Metric label="STAKED" value={fmtUSD(a.totalStaked)} accent />
            </div>
            <span className="w-8 h-8 rounded bg-[#1A202A] border border-[#2A3441] flex items-center justify-center">
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </span>
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="p-6 pt-0 grid grid-cols-1 xl:grid-cols-12 gap-8 border-t border-[#1E2430]">
          <div className="xl:col-span-5 space-y-8 pt-6">
            <div className="flex gap-6 items-center">
              <div className={`w-24 h-24 rounded-full border-[4px] ${tone.ring} flex flex-col items-center justify-center bg-[#0A0D14] flex-shrink-0 relative shadow-[0_0_20px_rgba(16,185,129,0.2)]`}>
                <span className="text-[9px] font-mono text-slate-400 absolute top-3">VABP TRUST</span>
                <span className={`text-3xl font-black ${tone.text} mt-2`}>{pillars.trust}</span>
                <span className="text-[10px] font-mono text-slate-500">/1000</span>
              </div>
              <div className="flex-1 space-y-4">
                <PillarBar label="SECURITY & VULNERABILITY" icon={Shield} score={pillars.security} />
                <PillarBar label="PERFORMANCE & RELIABILITY" icon={Zap} score={pillars.performance} />
                <PillarBar label="DATA COMPLIANCE & PRIVACY" icon={CheckCircle2} score={pillars.compliance} />
              </div>
            </div>

            {a.description && (
              <div className="bg-[#1A202A]/50 border border-[#2A3441]/50 rounded-xl p-5">
                <p className="text-sm text-slate-300 leading-relaxed">{a.description}</p>
              </div>
            )}

            <div>
              <h4 className="text-[11px] font-mono font-bold text-slate-500 mb-4 flex items-center gap-2 uppercase tracking-wider">
                <Activity className="w-4 h-4" /> Performance Metrics
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <PerfCell label="P50 LATENCY" value={fmtMs(a.p50)} />
                <PerfCell label="P95 LATENCY" value={fmtMs(a.p95)} />
                <PerfCell label="P99 LATENCY" value={fmtMs(a.p99)} />
                <PerfCell label="DRIFT INDEX" value={a.drift.toFixed(4)} />
                <PerfCell label="UPTIME (24H)" value={fmtPct(a.uptime24h)} />
                <PerfCell label="THROUGHPUT" value={`${fmtNum(a.throughput)}/s`} />
              </div>
            </div>
          </div>

          <div className="xl:col-span-7 flex flex-col min-h-0 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[11px] font-mono font-bold text-slate-500 flex items-center gap-2 uppercase tracking-wider">
                <FileCode className="w-4 h-4" /> Unified REST Schema Specification (MCP)
              </h4>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#1A202A] text-slate-400 border border-[#2A3441]">JSON</span>
            </div>
            <div className="flex-1 bg-[#0A0D14] border border-[#1E2430] rounded-xl overflow-hidden relative">
              <div className="bg-[#11151C] border-b border-[#1E2430] px-4 py-2 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                </div>
                {a.endpointUrl && <span className="text-[10px] font-mono text-slate-500 ml-2 truncate">{a.endpointUrl}</span>}
              </div>
              <pre className="p-6 text-[13px] font-mono text-slate-300 overflow-auto max-h-[480px] custom-scrollbar">
                <code dangerouslySetInnerHTML={{ __html: highlightJson(a.mcpSchema) }} />
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-mono font-bold text-slate-500 mb-1">{label}</p>
      <p className={`text-sm font-bold ${accent ? 'text-amber-400' : 'text-white'}`}>{value}</p>
    </div>
  );
}

function PerfCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#1A202A] border border-[#2A3441] rounded-lg p-4">
      <p className="text-[10px] font-mono font-bold text-slate-500 mb-1">{label}</p>
      <p className="text-lg font-bold text-white">{value}</p>
    </div>
  );
}

function PillarBar({ label, icon: Icon, score }: { label: string; icon: React.ComponentType<{ className?: string }>; score: number }) {
  const tone = score >= 90 ? TONE.emerald : score >= 75 ? TONE.amber : TONE.rose;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-[10px] font-mono font-bold text-slate-400">
        <span className="flex items-center gap-1.5 uppercase">
          <Icon className="w-3.5 h-3.5" />
          {label}
        </span>
        <span className={tone.text}>{score}/100</span>
      </div>
      <div className="h-1.5 w-full bg-[#1A202A] rounded-full overflow-hidden">
        <div className={`h-full ${tone.bar} rounded-full transition-all`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

// ============ Consensus Blueprint (Gemini compiler + probe feed) ============
interface CompileResult {
  apiName?: string;
  category?: string;
  version?: string;
  restEndpoint?: string;
  schemaType?: string;
  mcpToolDefinition?: Record<string, unknown>;
  syntheticVerificationResult?: {
    latencyMs?: number;
    driftScore?: number;
    uniquenessFactor?: number;
    comprehensionScore?: number;
    aiFeedback?: string;
  };
}

function ConsensusBlueprint() {
  const [codeText, setCodeText] = useState('');
  const [apiName, setApiName] = useState('');
  const [category, setCategory] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<CompileResult | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const { data: logs } = useSWR<ProbeLog[]>('/api/v1/benchmarks/logs', fetcher, { refreshInterval: 6000 });
  const feed = Array.isArray(logs) ? logs : [];

  async function compile() {
    setErr(null);
    setResult(null);
    if (!codeText.trim()) {
      setErr('Paste API documentation, a Swagger fragment, or code to compile.');
      return;
    }
    if (!getToken()) {
      setErr('Sign in to run the Gemini schema compiler — this is an authenticated, governed action.');
      return;
    }
    setBusy(true);
    try {
      const res = await api<CompileResult>('/api/v1/benchmarks/compile', {
        method: 'POST',
        body: { codeText, apiName: apiName || undefined, category: category || undefined },
      });
      setResult(res);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Compilation failed.');
    } finally {
      setBusy(false);
    }
  }

  const v = result?.syntheticVerificationResult;
  const logTone = (t: string) =>
    t === 'success' ? 'text-emerald-400' : t === 'warning' ? 'text-amber-400' : t === 'error' ? 'text-rose-400' : 'text-slate-400';

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      {/* Compiler */}
      <div className="xl:col-span-7 space-y-4">
        <div className="bg-[#11151C] border border-[#1E2430] rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <h3 className="text-white font-semibold text-sm">Gemini MCPAPI Schema Compiler</h3>
            <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full tracking-widest ml-auto">GEMINI 2.5</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Paste REST docs, an OpenAPI/Swagger fragment, or code. The compiler emits a unified MCPAPI spec
            (REST + Model Context Protocol tool definition) and a synthetic verification verdict, then publishes
            it to the live trust leaderboard.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              value={apiName}
              onChange={(e) => setApiName(e.target.value)}
              placeholder="API name (optional)"
              className="bg-[#0A0D14] border border-[#1E2430] focus:border-emerald-500/50 rounded-lg py-2.5 px-3 text-sm text-white placeholder-slate-600 outline-none"
            />
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Category (optional)"
              className="bg-[#0A0D14] border border-[#1E2430] focus:border-emerald-500/50 rounded-lg py-2.5 px-3 text-sm text-white placeholder-slate-600 outline-none"
            />
          </div>
          <textarea
            value={codeText}
            onChange={(e) => setCodeText(e.target.value)}
            placeholder="Paste API documentation, Swagger/OpenAPI, or code here..."
            rows={10}
            className="w-full bg-[#0A0D14] border border-[#1E2430] focus:border-emerald-500/50 rounded-lg py-3 px-4 text-[13px] font-mono text-slate-200 placeholder-slate-600 outline-none resize-y custom-scrollbar"
          />
          {err && (
            <div className="flex items-center gap-2 text-rose-300 text-xs bg-rose-500/5 border border-rose-500/20 rounded-lg p-3">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> {err}
            </div>
          )}
          <button
            onClick={compile}
            disabled={busy}
            className="flex items-center justify-center gap-2 w-full bg-emerald-500/15 hover:bg-emerald-500/25 disabled:opacity-50 text-emerald-300 border border-emerald-500/30 rounded-lg py-3 text-sm font-semibold transition-colors"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
            {busy ? 'Compiling via Gemini…' : 'Compile to MCPAPI & Publish'}
          </button>
        </div>

        {result && (
          <div className="bg-[#11151C] border border-[#1E2430] rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-[#1E2430] flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">Compiled MCPAPI</span>
              <span className="text-[10px] font-mono text-emerald-400">{result.schemaType} · {result.version}</span>
            </div>
            {v && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 border-b border-[#1E2430]">
                <PerfCell label="LATENCY" value={`${v.latencyMs ?? '—'}ms`} />
                <PerfCell label="DRIFT" value={`${v.driftScore ?? '—'}`} />
                <PerfCell label="UNIQUENESS" value={`${v.uniquenessFactor ?? '—'}`} />
                <PerfCell label="COMPREHENSION" value={`${v.comprehensionScore ?? '—'}/100`} />
              </div>
            )}
            {v?.aiFeedback && (
              <div className="px-5 py-4 border-b border-[#1E2430] text-xs text-slate-400 leading-relaxed">
                <span className="text-slate-500 font-mono uppercase text-[10px]">AI Feedback · </span>{v.aiFeedback}
              </div>
            )}
            <pre className="p-5 text-[12px] font-mono text-slate-300 overflow-auto max-h-[360px] custom-scrollbar">
              <code dangerouslySetInnerHTML={{ __html: highlightJson(result.mcpToolDefinition ?? result) }} />
            </pre>
          </div>
        )}
      </div>

      {/* Probe feed */}
      <div className="xl:col-span-5">
        <div className="bg-[#0A0D14] border border-[#1E2430] rounded-xl overflow-hidden h-full">
          <div className="bg-[#11151C] border-b border-[#1E2430] px-4 py-3 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider">Consensus Log Feed</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-auto" />
          </div>
          <div className="p-4 space-y-2 overflow-auto max-h-[640px] custom-scrollbar font-mono text-[12px]">
            {feed.length === 0 && <p className="text-slate-600">Awaiting synthetic probe telemetry…</p>}
            {feed.map((log) => (
              <div key={log.id} className="flex gap-2 leading-relaxed">
                <span className="text-slate-600 flex-shrink-0">{log.timestamp}</span>
                <span className={`flex-shrink-0 font-bold ${logTone(log.type)}`}>[{log.source}]</span>
                <span className="text-slate-400">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ Staking Pit ============
function StakingPit({ markets }: { markets: StakingMarket[] }) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ id: string; text: string; ok: boolean } | null>(null);

  async function stake(market: StakingMarket, outcome: 'YES' | 'NO') {
    setMsg(null);
    if (!getToken()) {
      setMsg({ id: market.id, text: 'Sign in to place a governed SLA stake.', ok: false });
      return;
    }
    setBusyId(market.id + outcome);
    try {
      await api('/api/v1/benchmarks/staking/stake', {
        method: 'POST',
        body: { market_id: market.id, outcome, amount: 100 },
      });
      setMsg({ id: market.id, text: `Staked 100 on ${outcome}.`, ok: true });
    } catch (e) {
      setMsg({ id: market.id, text: e instanceof Error ? e.message : 'Stake failed.', ok: false });
    } finally {
      setBusyId(null);
    }
  }

  if (markets.length === 0) {
    return (
      <div className="flex items-center gap-3 text-slate-500 text-sm p-6 border border-[#1E2430] rounded-xl bg-[#11151C]">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading SLA staking markets…
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {markets.map((m) => {
        const total = m.poolYes + m.poolNo || 1;
        const yesPct = Math.round((m.poolYes / total) * 100);
        return (
          <div key={m.id} className="bg-[#11151C] border border-[#1E2430] rounded-xl p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-widest">
                  {m.category}
                </span>
                <h3 className="text-white font-semibold text-sm mt-3 leading-snug">{m.title}</h3>
                <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5">
                  <Coins className="w-3 h-3" /> {m.targetApi} · resolves {m.resolutionDate}
                </p>
              </div>
              {m.resolved ? (
                <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-700/30 border border-slate-600/40 px-2 py-0.5 rounded-full">RESOLVED</span>
              ) : (
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">OPEN</span>
              )}
            </div>

            <div className="h-2 w-full bg-rose-500/30 rounded-full overflow-hidden flex">
              <div className="h-full bg-emerald-500" style={{ width: `${yesPct}%` }} />
            </div>
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-emerald-400">YES {m.yesPrice}¢ · {yesPct}%</span>
              <span className="text-slate-500 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Vol {fmtUSD(m.volume)}</span>
              <span className="text-rose-400">NO {m.noPrice}¢ · {100 - yesPct}%</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => stake(m, 'YES')}
                disabled={m.resolved || busyId === m.id + 'YES'}
                className="flex items-center justify-center gap-2 bg-emerald-500/15 hover:bg-emerald-500/25 disabled:opacity-40 text-emerald-300 border border-emerald-500/30 rounded-lg py-2.5 text-sm font-semibold transition-colors"
              >
                {busyId === m.id + 'YES' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Stake YES
              </button>
              <button
                onClick={() => stake(m, 'NO')}
                disabled={m.resolved || busyId === m.id + 'NO'}
                className="flex items-center justify-center gap-2 bg-rose-500/15 hover:bg-rose-500/25 disabled:opacity-40 text-rose-300 border border-rose-500/30 rounded-lg py-2.5 text-sm font-semibold transition-colors"
              >
                {busyId === m.id + 'NO' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Stake NO
              </button>
            </div>
            {msg && msg.id === m.id && (
              <p className={`text-xs ${msg.ok ? 'text-emerald-400' : 'text-rose-300'}`}>{msg.text}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
