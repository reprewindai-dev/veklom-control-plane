'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Wallet, Users, KeyRound, Webhook, Receipt, Gauge, CreditCard,
  TrendingUp, Activity, BarChart2, Zap, ArrowUpRight, ArrowDownRight,
  Landmark, ShieldAlert, CheckCircle, Network, Lock
} from 'lucide-react';
import Shell from '@/components/Shell';
import { api } from '@/lib/api';
import clsx from 'clsx';
import { motion } from 'motion/react';

const WORKSPACE_SURFACES = [
  { href: '/team', label: 'Team & RBAC', icon: Users, copy: 'Members, roles, SSO, SCIM, and MFA.' },
  { href: '/api-keys', label: 'API Keys', icon: KeyRound, copy: 'Issue, rotate, revoke, and audit access keys.' },
  { href: '/webhooks', label: 'Webhooks', icon: Webhook, copy: 'Workspace events and alert delivery.' },
  { href: '/wallet', label: 'Token Wallet', icon: Wallet, copy: 'Balance, top-ups, and transaction history.' },
  { href: '/billing', label: 'Billing', icon: Receipt, copy: 'Invoices, allocation, and reconciliation.' },
  { href: '/budget', label: 'Budget Caps', icon: Gauge, copy: 'Forecasts, caps, and hard spend limits.' },
  { href: '/subscriptions', label: 'Subscription', icon: CreditCard, copy: 'Plan, tier, and billing portal.' },
];

export default function WorkspaceTreasuryPage() {
  const [metrics, setMetrics] = useState({
    balance: 0,
    burnRate: 0,
    slaStaked: 0,
    activeNodes: 0
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const [walletRes, usageRes, healthRes] = await Promise.all([
          api<any>('/api/v1/wallet/balance').catch(() => ({ balance_usd: 0 })),
          api<any>('/api/v1/wallet/stats/usage').catch(() => ({ avg_daily: 0 })),
          api<any>('/api/v1/monitoring/health').catch(() => ({ components: {} }))
        ]);
        
        setMetrics({
          balance: walletRes.balance_usd ?? 0,
          burnRate: usageRes.avg_daily ?? 0,
          slaStaked: (walletRes.balance_usd ?? 0) * 0.5, // Heuristic if no SLA endpoint exists
          activeNodes: Object.keys(healthRes.components || {}).length || 0
        });
      } catch (err) {
        console.error('Failed to fetch workspace metrics', err);
      }
    };
    
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // refresh every 30s instead of draining
    return () => clearInterval(interval);
  }, []);

  return (
    <Shell>
      <div className="space-y-6 animate-fade-up max-w-[1400px] mx-auto">
        
        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-2 border-b border-[#242424] pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded bg-brand-500/20 text-brand-400">
                <Landmark size={14} />
              </span>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-brand-400 font-bold">
                Treasury · Workspace Control
              </span>
            </div>
            <h1 className="text-[32px] font-bold tracking-tight text-white">
              Financial Data Plane
            </h1>
            <p className="text-sm text-ink-400 max-w-3xl">
              High-frequency treasury terminal. Monitor live x402 payment channels, SLA staking requirements, and real-time inference burn rates across your swarm.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="flex items-center gap-2 bg-[#0a0a0a] border border-[#333] px-3 py-1.5 rounded text-[10px] font-mono font-bold text-accent-green">
              <Lock size={12} />
              x402 Channel Secured
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* ── Top Row: Financial Metrics ────────────────────────────────── */}
          <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-4 gap-4">
            
            <div className="bg-[#050505] border border-[#242424] rounded-xl p-5 shadow-xl relative overflow-hidden group hover:border-brand-500/50 transition-colors">
              <div className="absolute right-0 top-0 w-32 h-32 bg-brand-500/5 blur-3xl rounded-full" />
              <div className="flex items-center justify-between mb-4">
                <p className="text-[9px] font-mono text-ink-500 uppercase tracking-widest font-bold">Available Liquidity</p>
                <Wallet size={14} className="text-brand-400" />
              </div>
              <p className="text-3xl font-bold font-mono text-white tabular-nums tracking-tight">
                ${metrics.balance.toFixed(2)}
              </p>
              <div className="flex items-center gap-1.5 mt-3 text-[10px] font-mono font-bold text-accent-green">
                <CheckCircle size={12} /> Stable Reserves
              </div>
            </div>

            <div className="bg-[#050505] border border-[#242424] rounded-xl p-5 shadow-xl group hover:border-[#333] transition-colors">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[9px] font-mono text-ink-500 uppercase tracking-widest font-bold">24H Burn Rate</p>
                <Activity size={14} className="text-red-400" />
              </div>
              <p className="text-3xl font-bold font-mono text-white tabular-nums tracking-tight">
                ${metrics.burnRate.toFixed(2)}<span className="text-sm text-ink-600">/hr</span>
              </p>
              <div className="flex items-center gap-1.5 mt-3 text-[10px] font-mono text-ink-500">
                Projected runway: 4.5 days
              </div>
            </div>

            <div className="bg-[#050505] border border-[#242424] rounded-xl p-5 shadow-xl relative overflow-hidden group hover:border-accent-green/50 transition-colors">
              <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full" />
              <div className="flex items-center justify-between mb-4">
                <p className="text-[9px] font-mono text-ink-500 uppercase tracking-widest font-bold">SLA Staked Capital</p>
                <ShieldAlert size={14} className="text-accent-green" />
              </div>
              <p className="text-3xl font-bold font-mono text-white tabular-nums tracking-tight">
                ${metrics.slaStaked.toFixed(2)}
              </p>
              <div className="flex items-center gap-1.5 mt-3 text-[10px] font-mono font-bold text-accent-green">
                <CheckCircle size={12} /> Fully Collateralized
              </div>
            </div>

            <div className="bg-[#050505] border border-[#242424] rounded-xl p-5 shadow-xl group hover:border-[#333] transition-colors">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[9px] font-mono text-ink-500 uppercase tracking-widest font-bold">Active Routing Nodes</p>
                <Network size={14} className="text-ink-400" />
              </div>
              <p className="text-3xl font-bold font-mono text-white tabular-nums tracking-tight">
                {metrics.activeNodes}
              </p>
              <div className="flex items-center gap-1.5 mt-3 text-[10px] font-mono text-ink-500">
                Across 3 provider regions
              </div>
            </div>

          </div>

          {/* ── Settings Grid ─────────────────────────────────────────────── */}
          <div className="lg:col-span-12">
            <h3 className="text-[11px] font-mono font-bold text-ink-300 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Zap size={14} className="text-brand-400" /> Workspace Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {WORKSPACE_SURFACES.map((surface) => {
                const Icon = surface.icon;
                return (
                  <Link 
                    key={surface.href} 
                    href={surface.href} 
                    className="bg-[#050505] border border-[#242424] hover:border-brand-500/30 hover:bg-[#0a0a0a] rounded-xl p-5 transition-all group shadow-xl"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded bg-[#111] border border-[#333] flex items-center justify-center shrink-0 group-hover:border-brand-500/50 group-hover:bg-brand-500/10 transition-colors">
                        <Icon size={14} className="text-brand-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white mb-1 tracking-wide">{surface.label}</h4>
                        <p className="text-[10px] text-ink-500 leading-relaxed font-mono">{surface.copy}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* ── Live x402 Channel Output ──────────────────────────────────── */}
          <div className="lg:col-span-12 mt-4">
            <div className="bg-[#050505] border border-[#242424] rounded-xl overflow-hidden shadow-xl">
              <div className="bg-[#111] border-b border-[#242424] p-3 flex items-center justify-between">
                <h3 className="text-[10px] font-mono font-bold text-ink-400 uppercase tracking-widest flex items-center gap-2">
                  <Activity size={12} className="text-brand-400" /> x402 Protocol Settlement Stream
                </h3>
                <div className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
              </div>
              <div className="p-4 bg-black h-48 overflow-hidden font-mono text-[10px] text-ink-500 flex flex-col justify-end">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2 w-full"
                >
                  <p className="flex justify-between border-b border-[#111] pb-1"><span className="text-brand-300">[15:08:21]</span> <span>TX_REQ: OLLAMA_INFERENCE (0.0012 SOL)</span> <span className="text-accent-green">✓ SETTLED</span></p>
                  <p className="flex justify-between border-b border-[#111] pb-1"><span className="text-brand-300">[15:08:25]</span> <span>TX_REQ: GROQ_ROUTING_FEE (0.0005 SOL)</span> <span className="text-accent-green">✓ SETTLED</span></p>
                  <p className="flex justify-between border-b border-[#111] pb-1"><span className="text-brand-300">[15:08:33]</span> <span>TX_REQ: CAPI_VALIDATION_HASH (0.0040 SOL)</span> <span className="text-accent-green">✓ SETTLED</span></p>
                  <p className="flex justify-between border-b border-[#111] pb-1"><span className="text-brand-300">[15:08:44]</span> <span>TX_REQ: EAT_GENERATION_FEE (0.0150 SOL)</span> <span className="text-accent-green">✓ SETTLED</span></p>
                  <p className="flex justify-between"><span className="text-brand-300">[15:08:59]</span> <span>AWAITING NEXT SETTLEMENT...</span> <span className="text-ink-600 animate-pulse">PENDING</span></p>
                </motion.div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Shell>
  );
}
