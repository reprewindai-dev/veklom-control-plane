'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, Shield, Zap, Lock, ChevronDown, ChevronRight, Activity, 
  BarChart2, FileCode, CheckCircle2, Server, Globe2, ShieldCheck, Gamepad2, Layers
} from 'lucide-react';
import Link from 'next/link';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';

// Mock Data
const STATS = {
  apis_tracked: 6,
  avg_sla: '99.85%',
  avg_trust_score: '881/1000',
  total_staked: '$115,550',
  tier_1_certified: 3
};

const STRIPE_API = {
  id: 'stripe-intents',
  name: 'Stripe Payment Intents',
  provider: 'Stripe Inc. - payments',
  tier: 'TIER-1',
  status: 'EXCELLENT',
  trust_score: 962,
  badges: ['PCI-DSS L1', 'OWASP PASS', 'SOC 2 TYPE II', 'NIST SP 800-228'],
  scores: {
    security: 98,
    performance: 97,
    compliance: 94
  },
  metrics: {
    sla: '100.06%',
    p50: '38.1ms',
    throughput: '14,200/s',
    staked: '$24,500'
  },
  performance: {
    p50: '38.1ms',
    p95: '94.0ms',
    p99: '184.1ms',
    drift: '0.0100',
    uptime: '100.14%',
    throughput: '14,200/s'
  },
  description: 'Create and manage payment intents for online transactions. PCI-DSS Level 1 compliance, full 3D Secure support, and webhooks for asynchronous status updates.',
  schema: `{\n  "name": "stripe_create_payment_intent",\n  "description": "Creates a PaymentIntent object representing a customer intent to pay.",\n  "inputSchema": {\n    "type": "object",\n    "properties": {\n      "amount": {\n        "type": "integer",\n        "description": "Amount in smallest currency unit (cents)."\n      },\n      "currency": {\n        "type": "string",\n        "description": "Three-letter ISO currency code.",\n        "default": "usd"\n      }\n    }\n  }\n}`
};

const BENCHMARK_MODULES = [
  { href: '/benchmarks/arena', label: 'Authority Arena', desc: 'Agent Character Creator, compliance scenarios, pipeline sandbox', icon: Gamepad2, badge: 'SANDBOX', color: 'violet' },
  { href: '/benchmarks/discovery', label: 'Veklom Discovery', desc: 'x402 payments, ACP agents, Base MCP wallet, ENS resolution', icon: Globe2, badge: 'WEB3', color: 'cyan' },
  { href: '/benchmarks/runtime-lab', label: 'Gateway Trust Contract', desc: '7-step pipeline, EAT token signing, policy presets, evidence ledger', icon: ShieldCheck, badge: 'LAB', color: 'emerald' },
  { href: '/routing/live', label: 'Fault Matrix + SLO-Gate', desc: 'Chaos injection, Ollama -> Groq -> Gemini fallback drill, gradient routing', icon: Activity, badge: 'LIVE', color: 'amber' },
];

export default function BenchmarksPremium() {
  const [activeTab, setActiveTab] = useState('trust');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: lbData, error: lbError } = useSWR('/api/v1/benchmarks/leaderboard', fetcher, {
    refreshInterval: (data) => lbError ? 0 : 8000
  });

  const apis = lbData?.apis || [];
  
  const avgTrust = apis.length > 0 
    ? Math.round(apis.filter((a: any) => a.vabp && typeof a.vabp.trust_score === 'number').reduce((s: number, a: any) => s + a.vabp.trust_score, 0) / apis.filter((a: any) => a.vabp && typeof a.vabp.trust_score === 'number').length)
    : 0;

  return (
    <div className="min-h-screen bg-[#0A0D14] text-slate-300 font-sans p-6 overflow-x-hidden selection:bg-emerald-500/30">
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 bg-slate-800/50 border border-slate-700/50 px-2 py-0.5 rounded-full uppercase">
              API BENCHMARKS
            </span>
          </div>
          
          <h1 className="text-[2.5rem] leading-tight font-bold text-white tracking-tight">
            Veklom API Benchmarking Protocol
          </h1>
          
          <p className="text-[15px] text-slate-400 max-w-3xl leading-relaxed">
            VABP-certified trust leaderboard with 3-pillar scoring (Security, Performance, Compliance), MCP schema inspection, Gemini-powered compilation, and SLA staking markets.
          </p>

          <div className="flex items-center gap-3 pt-2">
            <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
            <span className="text-[11px] font-mono font-bold tracking-widest text-slate-300 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-full uppercase">
              6 APIS TRACKED
            </span>
            <span className="text-[11px] font-mono font-bold tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full uppercase">
              4 ACTIVE MARKETS
            </span>
            <span className="text-[11px] font-mono font-bold tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full uppercase">
              AVG TRUST: 881/1000
            </span>
          </div>
        </div>

        {/* Sub-module links integrated natively */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 mb-8">
          {BENCHMARK_MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.href}
                href={mod.href}
                className="group flex flex-col gap-3 p-4 bg-[#11151C] hover:bg-[#1A202A] border border-[#1E2430] hover:border-[#2A3441] rounded-xl transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg bg-${mod.color}-500/10 border border-${mod.color}-500/20`}>
                    <Icon className={`w-4 h-4 text-${mod.color}-400`} />
                  </div>
                  <span className={`text-[9px] font-mono font-bold text-${mod.color}-400 bg-${mod.color}-500/10 border border-${mod.color}-500/20 px-1.5 py-0.5 rounded-full tracking-widest`}>
                    {mod.badge}
                  </span>
                </div>
                <div>
                  <h3 className="text-white text-sm font-semibold group-hover:text-white transition">{mod.label}</h3>
                  <p className="text-slate-500 text-xs mt-1 leading-relaxed line-clamp-2">{mod.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#1E2430] mt-8">
          {[
            { id: 'trust', label: 'Trust Leaderboard', icon: Shield },
            { id: 'consensus', label: 'Consensus Blueprint', icon: Layers },
            { id: 'staking', label: 'Staking Pit', icon: BarChart2 }
          ].map(tab => {
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

        {/* Search Bar */}
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

        {/* Top Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'APIS TRACKED', value: apis.length > 0 ? apis.length : STATS.apis_tracked },
            { label: 'AVG SLA', value: STATS.avg_sla, color: 'text-emerald-400' },
            { label: 'AVG TRUST SCORE', value: avgTrust > 0 ? `${avgTrust}/1000` : STATS.avg_trust_score, color: 'text-amber-400' },
            { label: 'TOTAL STAKED', value: STATS.total_staked, color: 'text-amber-400' },
            { label: 'TIER-1 CERTIFIED', value: STATS.tier_1_certified, color: 'text-emerald-400' },
          ].map((stat, i) => (
            <div key={i} className="bg-[#11151C] border border-[#1E2430] rounded-xl p-5">
              <h4 className="text-[10px] font-mono font-bold text-slate-500 tracking-wider mb-2">{stat.label}</h4>
              <p className={`text-2xl font-bold ${stat.color || 'text-white'}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Highlighted Leaderboard Item (Stripe Example) */}
        <div className="bg-[#11151C] border border-[#1E2430] rounded-xl overflow-hidden shadow-2xl shadow-black/50">
          
          {/* Header Row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between p-6 border-b border-[#1E2430] gap-6">
            <div className="flex items-center gap-5">
              <span className="text-slate-500 font-mono text-sm font-bold">#1</span>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-xl font-bold text-white">{STRIPE_API.name}</h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {STRIPE_API.tier}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {STRIPE_API.status}
                  </span>
                </div>
                <p className="text-sm text-slate-400">{STRIPE_API.provider}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {STRIPE_API.badges.map(badge => (
                    <span key={badge} className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#1A202A] border border-[#2A3441] text-[10px] font-mono font-bold text-amber-100/70">
                      <Lock className="w-3 h-3 text-amber-500/70" />
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-8 pl-14 lg:pl-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full border-[3px] border-emerald-500 flex items-center justify-center bg-[#0A0D14]">
                  <span className="text-emerald-400 font-bold text-sm">{STRIPE_API.trust_score}</span>
                </div>
              </div>
              
              <div className="flex gap-8">
                <div>
                  <p className="text-[10px] font-mono font-bold text-slate-500 mb-1">SLA</p>
                  <p className="text-sm font-bold text-white">{STRIPE_API.metrics.sla}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono font-bold text-slate-500 mb-1">P50</p>
                  <p className="text-sm font-bold text-white">{STRIPE_API.metrics.p50}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono font-bold text-slate-500 mb-1">THROUGHPUT</p>
                  <p className="text-sm font-bold text-white">{STRIPE_API.metrics.throughput}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono font-bold text-slate-500 mb-1">STAKED</p>
                  <p className="text-sm font-bold text-amber-400">{STRIPE_API.metrics.staked}</p>
                </div>
              </div>
              
              <button className="w-8 h-8 rounded bg-[#1A202A] border border-[#2A3441] flex items-center justify-center hover:bg-[#2A3441] transition-colors ml-4">
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Details Section */}
          <div className="p-6 grid grid-cols-1 xl:grid-cols-12 gap-8">
            
            {/* Left Column */}
            <div className="xl:col-span-5 space-y-8">
              
              {/* Trust Score Breakdowns */}
              <div className="flex gap-6 items-center">
                <div className="w-24 h-24 rounded-full border-[4px] border-emerald-500 flex flex-col items-center justify-center bg-[#0A0D14] flex-shrink-0 relative shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                  <span className="text-[9px] font-mono text-slate-400 absolute top-3">VABP TRUST SCORE</span>
                  <span className="text-3xl font-black text-emerald-400 mt-2">{STRIPE_API.trust_score}</span>
                  <span className="text-[10px] font-mono text-slate-500">/1000</span>
                </div>
                
                <div className="flex-1 space-y-4">
                  {[
                    { label: 'SECURITY & VULNERABILITY', icon: Shield, score: STRIPE_API.scores.security },
                    { label: 'PERFORMANCE & RELIABILITY', icon: Zap, score: STRIPE_API.scores.performance },
                    { label: 'DATA COMPLIANCE & PRIVACY', icon: CheckCircle2, score: STRIPE_API.scores.compliance }
                  ].map((item, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] font-mono font-bold text-slate-400">
                        <span className="flex items-center gap-1.5 uppercase">
                          <item.icon className="w-3.5 h-3.5" />
                          {item.label}
                        </span>
                        <span className="text-emerald-400">{item.score}/100</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#1A202A] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full" 
                          style={{ width: `${item.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="bg-[#1A202A]/50 border border-[#2A3441]/50 rounded-xl p-5">
                <p className="text-sm text-slate-300 leading-relaxed">
                  {STRIPE_API.description}
                </p>
              </div>

              {/* Performance Metrics Grid */}
              <div>
                <h4 className="text-[11px] font-mono font-bold text-slate-500 mb-4 flex items-center gap-2 uppercase tracking-wider">
                  <Activity className="w-4 h-4" />
                  Performance Metrics
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'P50 LATENCY', value: STRIPE_API.performance.p50 },
                    { label: 'P95 LATENCY', value: STRIPE_API.performance.p95 },
                    { label: 'P99 LATENCY', value: STRIPE_API.performance.p99 },
                    { label: 'DRIFT INDEX', value: STRIPE_API.performance.drift },
                    { label: 'UPTIME (24H)', value: STRIPE_API.performance.uptime },
                    { label: 'THROUGHPUT', value: STRIPE_API.performance.throughput },
                  ].map((m, i) => (
                    <div key={i} className="bg-[#1A202A] border border-[#2A3441] rounded-lg p-4">
                      <p className="text-[10px] font-mono font-bold text-slate-500 mb-1">{m.label}</p>
                      <p className="text-lg font-bold text-white">{m.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column (Schema) */}
            <div className="xl:col-span-7 flex flex-col min-h-0 h-full">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[11px] font-mono font-bold text-slate-500 flex items-center gap-2 uppercase tracking-wider">
                  <FileCode className="w-4 h-4" />
                  Unified REST Schema Specification (MCP)
                </h4>
                <div className="flex gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#1A202A] text-slate-400 border border-[#2A3441]">JSON</span>
                </div>
              </div>
              
              <div className="flex-1 bg-[#0A0D14] border border-[#1E2430] rounded-xl overflow-hidden relative">
                {/* Code Window Header */}
                <div className="bg-[#11151C] border-b border-[#1E2430] px-4 py-2 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                  </div>
                </div>
                {/* Code Body */}
                <pre className="p-6 text-[13px] font-mono text-slate-300 overflow-auto h-[480px] custom-scrollbar">
                  <code dangerouslySetInnerHTML={{ 
                    __html: STRIPE_API.schema
                      .replace(new RegExp('"([^"]+)":', 'g'), '<span class="text-blue-400">"$1"</span>:')
                      .replace(new RegExp(': "([^"]+)"', 'g'), ': <span class="text-emerald-400">"$1"</span>')
                      .replace(new RegExp('[{}[\\\\]]', 'g'), '<span class="text-slate-500">$&</span>')
                  }} />
                </pre>
              </div>
            </div>

          </div>
        </div>
        
      </div>
      
      {/* Scrollbar styles to match the dark theme */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0A0D14;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1E2430;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #2A3441;
        }
      `}} />
    </div>
  );
}
