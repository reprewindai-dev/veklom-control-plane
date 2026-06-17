'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { TrendingUp, ArrowUp, ArrowDown, Zap, Lock, ChevronRight, X, Gamepad2, Globe2, ShieldCheck, Activity } from 'lucide-react';

const BENCHMARK_MODULES = [
  { href: '/benchmarks/arena', label: 'Authority Arena', desc: 'Agent Character Creator, compliance scenarios, pipeline sandbox', icon: Gamepad2, badge: 'SANDBOX', color: 'violet' },
  { href: '/benchmarks/discovery', label: 'Veklom Discovery', desc: 'x402 payments, ACP agents, Base MCP wallet, ENS resolution', icon: Globe2, badge: 'WEB3', color: 'cyan' },
  { href: '/benchmarks/runtime-lab', label: 'Gateway Trust Contract', desc: '7-step pipeline, EAT token signing, policy presets, evidence ledger', icon: ShieldCheck, badge: 'LAB', color: 'emerald' },
  { href: '/routing/live', label: 'Fault Matrix + SLO-Gate', desc: 'Chaos injection, Ollama→Groq→Gemini fallback drill, gradient routing', icon: Activity, badge: 'LIVE', color: 'amber' },
];

interface APIMetrics {
  id: string;
  name: string;
  provider: string;
  latency_p50: number;
  latency_p95: number;
  latency_p99: number;
  sla_success_percent: number;
  drift_index: number;
  trust_score: number;
  sovereign_tier: string;
  staked_amount: number;
  category: string;
}

interface StakingPool {
  id: string;
  api_id: string;
  api_name: string;
  yes_price: number; // cents
  no_price: number;
  yes_volume: number;
  no_volume: number;
  target_resolution_date: string;
  status: 'open' | 'closed' | 'resolved';
}

interface OracleLog {
  id: string;
  timestamp: string;
  api_name: string;
  latency_ms: number;
  success: boolean;
  message: string;
}

interface MCPToolSchema {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

const CATEGORIES = [
  'All',
  'Financial',
  'Government',
  'Healthcare',
  'Security',
  'Enterprise',
];

export default function BenchmarksPage() {
  const [apis, setApis] = useState<APIMetrics[]>([]);
  const [pools, setPools] = useState<StakingPool[]>([]);
  const [logs, setLogs] = useState<OracleLog[]>([]);

  const [govWeight, setGovWeight] = useState(50); // Gov 50%, Dev 50%
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'score' | 'latency' | 'drift' | 'staked'>('score');

  const [expandedApi, setExpandedApi] = useState<string | null>(null);
  const [selectedPool, setSelectedPool] = useState<StakingPool | null>(null);
  const [stakingAmount, setStakingAmount] = useState('');
  const [stakingChoice, setStakingChoice] = useState<'yes' | 'no'>('yes');
  const [walletBalance, setWalletBalance] = useState(5000); // $5000 VEK
  const [mcpSchema, setMcpSchema] = useState<MCPToolSchema | null>(null);

  const [loading, setLoading] = useState(true);

  // Fetch leaderboard
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch('http://api.veklom.com/api/v1/benchmarks/leaderboard');
        const data = await res.json();
        setApis(data.leaderboard || []);
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
        // Fallback demo data
        setApis(generateDemoAPIs());
      } finally {
        setLoading(false);
      }
    };

    const fetchPools = async () => {
      try {
        const res = await fetch('http://api.veklom.com/api/v1/benchmarks/staking/markets');
        const data = await res.json();
        setPools(data.markets || []);
      } catch (err) {
        console.error('Failed to fetch pools:', err);
        setPools(generateDemoPools());
      }
    };

    const fetchLogs = async () => {
      try {
        const res = await fetch('http://api.veklom.com/api/v1/benchmarks/logs');
        const data = await res.json();
        setLogs(data.logs || []);
      } catch (err) {
        console.error('Failed to fetch logs:', err);
        setLogs(generateDemoLogs());
      }
    };

    fetchLeaderboard();
    fetchPools();
    fetchLogs();

    const interval = setInterval(() => {
      fetchLeaderboard();
      fetchLogs();
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Fetch wallet balance
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const res = await fetch('http://api.veklom.com/api/v1/billing/wallet/balance');
        const data = await res.json();
        setWalletBalance(data.balance_usd || 5000);
      } catch (err) {
        console.error('Failed to fetch balance:', err);
      }
    };

    fetchBalance();
  }, []);

  // Recalculate trust scores based on gov/dev weights
  const scoredAPIs = useMemo(() => {
    return apis
      .map((api) => {
        const govScore = api.trust_score;
        const devScore = api.sla_success_percent / 100;
        const weighted =
          (govScore * (govWeight / 100) + devScore * ((100 - govWeight) / 100)) * 100;
        return { ...api, weighted_score: weighted };
      })
      .filter(
        (api) => selectedCategory === 'All' || api.category === selectedCategory
      )
      .sort((a, b) => {
        if (sortBy === 'score') return b.weighted_score - a.weighted_score;
        if (sortBy === 'latency') return a.latency_p50 - b.latency_p50;
        if (sortBy === 'drift') return a.drift_index - b.drift_index;
        if (sortBy === 'staked') return b.staked_amount - a.staked_amount;
        return 0;
      });
  }, [apis, govWeight, selectedCategory, sortBy]);

  // Handle staking
  const handleStake = async () => {
    if (!selectedPool || !stakingAmount) return;

    try {
      const res = await fetch(
        'http://api.veklom.com/api/v1/benchmarks/staking/stake',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pool_id: selectedPool.id,
            amount: parseFloat(stakingAmount),
            choice: stakingChoice,
          }),
        }
      );

      if (res.ok) {
        setWalletBalance(walletBalance - parseFloat(stakingAmount));
        setStakingAmount('');
        setSelectedPool(null);
        // Refresh pools
        const poolsRes = await fetch(
          'http://api.veklom.com/api/v1/benchmarks/staking/markets'
        );
        const poolsData = await poolsRes.json();
        setPools(poolsData.markets || []);
      } else {
        alert('Stake failed. Check your balance.');
      }
    } catch (err) {
      console.error('Staking error:', err);
      alert('Error placing stake.');
    }
  };

  // Fetch MCP schema for selected API
  const fetchMCPSchema = async (apiId: string) => {
    try {
      const res = await fetch(
        `http://api.veklom.com/api/v1/benchmarks/mcp-schema/${apiId}`
      );
      const data = await res.json();
      setMcpSchema(data);
    } catch (err) {
      console.error('Failed to fetch MCP schema:', err);
      setMcpSchema({
        name: 'MCP Tool Schema',
        description: 'Tool schema not available',
        input_schema: {},
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🏆 API TRUST LEADERBOARD
          </h1>
          <p className="text-slate-400">
            Real-time rankings powered by synthetic observability &amp; community staking
          </p>
          {/* Sub-module quick links */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
            {BENCHMARK_MODULES.map((mod) => {
              const Icon = mod.icon;
              return (
                <Link
                  key={mod.href}
                  href={mod.href}
                  className="group flex flex-col gap-2 p-4 bg-slate-800/60 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 rounded-xl transition-all"
                >
                  <div className="flex items-center justify-between">
                    <Icon className={`w-5 h-5 text-${mod.color}-400`} />
                    <span className={`text-[9px] font-mono font-bold text-${mod.color}-400 bg-${mod.color}-500/10 border border-${mod.color}-500/20 px-1.5 py-0.5 rounded-full tracking-widest`}>
                      {mod.badge}
                    </span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold group-hover:text-${mod.color}-300 transition">{mod.label}</p>
                    <p className="text-slate-400 text-xs mt-0.5 leading-tight">{mod.desc}</p>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 group-hover:text-slate-300 transition mt-auto">
                    Open <ChevronRight className="w-3 h-3" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Gov ↔ Dev Slider */}
        <div className="mb-8 bg-slate-800 border border-slate-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <label className="text-white font-semibold">Weighting Strategy</label>
            <span className="text-sm text-slate-400">
              {govWeight}% Gov / {100 - govWeight}% Dev
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400 w-16">Governance</span>
            <input
              type="range"
              min="0"
              max="100"
              value={govWeight}
              onChange={(e) => setGovWeight(parseInt(e.target.value))}
              className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-sm text-slate-400 w-16 text-right">Developer</span>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Drag to adjust how much weight is given to governance (trust/security) vs
            developer (performance/reliability) signals.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Filters */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h3 className="text-white font-semibold mb-4">Filters</h3>
              <div className="space-y-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left px-3 py-2 rounded transition ${
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-slate-700">
                <h4 className="text-white font-semibold mb-4 text-sm">Sort By</h4>
                <div className="space-y-2">
                  {[
                    { key: 'score', label: 'Trust Score' },
                    { key: 'latency', label: 'Latency (P50)' },
                    { key: 'drift', label: 'Drift Index' },
                    { key: 'staked', label: 'Staked Amount' },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() =>
                        setSortBy(opt.key as 'score' | 'latency' | 'drift' | 'staked')
                      }
                      className={`w-full text-left px-3 py-2 rounded transition text-sm ${
                        sortBy === opt.key
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
              <div className="bg-slate-900 px-6 py-4 border-b border-slate-700">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Leaderboard
                </h3>
              </div>
              <div className="divide-y divide-slate-700 max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-6 text-center text-slate-400">Loading...</div>
                ) : scoredAPIs.length === 0 ? (
                  <div className="p-6 text-center text-slate-400">No APIs found</div>
                ) : (
                  scoredAPIs.map((api, idx) => (
                    <div
                      key={api.id}
                      onClick={() => setExpandedApi(expandedApi === api.id ? null : api.id)}
                      className="p-6 hover:bg-slate-700 cursor-pointer transition"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl font-bold text-slate-500 w-8 text-center">
                            #{idx + 1}
                          </div>
                          <div>
                            <p className="text-white font-semibold">{api.name}</p>
                            <p className="text-xs text-slate-400">{api.provider}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-blue-400">
                            {api.weighted_score.toFixed(1)}
                          </p>
                          <p className="text-xs text-slate-400">Score</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div className="bg-slate-700 p-2 rounded">
                          <p className="text-slate-400 text-xs">P50 Latency</p>
                          <p className="text-white font-semibold">{api.latency_p50}ms</p>
                        </div>
                        <div className="bg-slate-700 p-2 rounded">
                          <p className="text-slate-400 text-xs">SLA Success</p>
                          <p className="text-white font-semibold">
                            {api.sla_success_percent.toFixed(1)}%
                          </p>
                        </div>
                        <div className="bg-slate-700 p-2 rounded">
                          <p className="text-slate-400 text-xs">Drift</p>
                          <p className="text-white font-semibold">
                            {api.drift_index.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      {expandedApi === api.id && (
                        <div className="mt-4 pt-4 border-t border-slate-600 space-y-3">
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Tier</p>
                            <p className="text-white">{api.sovereign_tier}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Staked Amount</p>
                            <p className="text-white">${api.staked_amount.toFixed(2)}</p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              fetchMCPSchema(api.id);
                            }}
                            className="w-full mt-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition"
                          >
                            View MCP Schema
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Stats Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Wallet */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Wallet
              </h4>
              <p className="text-3xl font-bold text-emerald-400">
                ${walletBalance.toFixed(2)}
              </p>
              <p className="text-xs text-slate-400 mt-2">VEK Available</p>
            </div>

            {/* Top API */}
            {scoredAPIs.length > 0 && (
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Top Performer
                </h4>
                <p className="text-white font-semibold">{scoredAPIs[0].name}</p>
                <p className="text-sm text-slate-400 mt-1">
                  {scoredAPIs[0].weighted_score.toFixed(1)} pts
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Oracle Feed & Staking */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Oracle Signal Feed */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 border-b border-slate-700">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Oracle Signal Feed
              </h3>
            </div>
            <div className="divide-y divide-slate-700 max-h-96 overflow-y-auto">
              {logs.slice(0, 20).map((log) => (
                <div key={log.id} className="px-6 py-4 hover:bg-slate-700 transition">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-white font-semibold text-sm">
                        {log.api_name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    <div
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        log.success
                          ? 'bg-emerald-900 text-emerald-300'
                          : 'bg-red-900 text-red-300'
                      }`}
                    >
                      {log.success ? 'OK' : 'FAIL'}
                    </div>
                  </div>
                  <p className="text-sm text-slate-400">{log.message}</p>
                  <p className="text-xs text-slate-500 mt-1">Latency: {log.latency_ms}ms</p>
                </div>
              ))}
            </div>
          </div>

          {/* Staking Pit */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 border-b border-slate-700">
              <h3 className="text-white font-semibold flex items-center gap-2">
                🎲 Staking Pit
              </h3>
            </div>
            <div className="divide-y divide-slate-700 max-h-96 overflow-y-auto">
              {pools.map((pool) => (
                <div
                  key={pool.id}
                  onClick={() => setSelectedPool(selectedPool?.id === pool.id ? null : pool)}
                  className="p-6 hover:bg-slate-700 cursor-pointer transition"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-white font-semibold">{pool.api_name}</p>
                      <p className="text-xs text-slate-400">{pool.status}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    <div className="bg-emerald-900 bg-opacity-30 border border-emerald-700 p-2 rounded">
                      <p className="text-emerald-300 text-xs">YES</p>
                      <p className="text-emerald-300 font-semibold">
                        ${(pool.yes_price / 100).toFixed(2)}
                      </p>
                      <p className="text-emerald-400 text-xs">${pool.yes_volume}</p>
                    </div>
                    <div className="bg-red-900 bg-opacity-30 border border-red-700 p-2 rounded">
                      <p className="text-red-300 text-xs">NO</p>
                      <p className="text-red-300 font-semibold">
                        ${(pool.no_price / 100).toFixed(2)}
                      </p>
                      <p className="text-red-400 text-xs">${pool.no_volume}</p>
                    </div>
                  </div>

                  {selectedPool?.id === pool.id && (
                    <div className="mt-4 pt-4 border-t border-slate-600 space-y-3">
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setStakingChoice('yes');
                          }}
                          className={`flex-1 py-2 rounded transition text-sm font-semibold ${
                            stakingChoice === 'yes'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}
                        >
                          👍 Stake YES
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setStakingChoice('no');
                          }}
                          className={`flex-1 py-2 rounded transition text-sm font-semibold ${
                            stakingChoice === 'no'
                              ? 'bg-red-600 text-white'
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}
                        >
                          👎 Stake NO
                        </button>
                      </div>
                      <input
                        type="number"
                        placeholder="Amount ($VEK)"
                        value={stakingAmount}
                        onChange={(e) => setStakingAmount(e.target.value)}
                        className="w-full p-2 bg-slate-700 text-white border border-slate-600 rounded focus:border-blue-500 focus:outline-none"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStake();
                        }}
                        disabled={
                          !stakingAmount ||
                          parseFloat(stakingAmount) > walletBalance
                        }
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white rounded transition font-semibold text-sm"
                      >
                        Place Stake
                      </button>
                      {stakingAmount &&
                        parseFloat(stakingAmount) > walletBalance && (
                          <p className="text-xs text-red-400">Insufficient balance</p>
                        )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MCP Schema Modal */}
        {mcpSchema && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setMcpSchema(null)}
          >
            <div
              className="bg-slate-800 border border-slate-700 rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-slate-900 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
                <h3 className="text-white font-semibold">{mcpSchema.name} Schema</h3>
                <button
                  onClick={() => setMcpSchema(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <p className="text-slate-300 mb-4">{mcpSchema.description}</p>
                <pre className="bg-slate-700 p-4 rounded overflow-x-auto text-sm text-slate-200">
                  {JSON.stringify(mcpSchema.input_schema, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Demo data generators (fallback)
function generateDemoAPIs(): APIMetrics[] {
  return [
    {
      id: '1',
      name: 'OpenRouter',
      provider: 'OpenAI',
      latency_p50: 145,
      latency_p95: 320,
      latency_p99: 450,
      sla_success_percent: 99.95,
      drift_index: 0.02,
      trust_score: 98,
      sovereign_tier: 'Apex',
      staked_amount: 45000,
      category: 'Financial',
    },
    {
      id: '2',
      name: 'Together AI',
      provider: 'Together',
      latency_p50: 280,
      latency_p95: 580,
      latency_p99: 920,
      sla_success_percent: 99.5,
      drift_index: 0.05,
      trust_score: 94,
      sovereign_tier: 'Trusted',
      staked_amount: 28000,
      category: 'Enterprise',
    },
    {
      id: '3',
      name: 'Groq Cloud',
      provider: 'Groq',
      latency_p50: 89,
      latency_p95: 150,
      latency_p99: 220,
      sla_success_percent: 99.2,
      drift_index: 0.08,
      trust_score: 92,
      sovereign_tier: 'Trusted',
      staked_amount: 15000,
      category: 'Healthcare',
    },
  ];
}

function generateDemoPools(): StakingPool[] {
  return [
    {
      id: '1',
      api_id: '1',
      api_name: 'OpenRouter',
      yes_price: 72,
      no_price: 28,
      yes_volume: 127500,
      no_volume: 45200,
      target_resolution_date: '2026-02-28',
      status: 'open',
    },
    {
      id: '2',
      api_id: '3',
      api_name: 'Groq Cloud',
      yes_price: 65,
      no_price: 35,
      yes_volume: 82000,
      no_volume: 54300,
      target_resolution_date: '2026-03-15',
      status: 'open',
    },
  ];
}

function generateDemoLogs(): OracleLog[] {
  return [
    {
      id: '1',
      timestamp: new Date().toISOString(),
      api_name: 'OpenRouter',
      latency_ms: 142,
      success: true,
      message: 'Probe OK. Latency stable.',
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 2000).toISOString(),
      api_name: 'Groq Cloud',
      latency_ms: 87,
      success: true,
      message: 'Probe OK. Cache hit.',
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 4000).toISOString(),
      api_name: 'Together AI',
      latency_ms: 285,
      success: true,
      message: 'Probe OK. Queue depth nominal.',
    },
  ];
}
