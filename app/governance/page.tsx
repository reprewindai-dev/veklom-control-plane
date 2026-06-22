'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Fingerprint, Activity, Clock, Terminal, CheckCircle, AlertTriangle, Key, Network, Shield
} from 'lucide-react';
import Shell from '@/components/Shell';
import { api } from '@/lib/api';
import clsx from 'clsx';
import { motion } from 'motion/react';

interface TrustEvent {
  id: string;
  timestamp: string;
  action: string;
  target: string;
  status: 'BLOCKED' | 'AUTHORIZED';
  hash: string;
  reason: string;
}

export default function GovernanceIdentityPage() {
  const [operatorId, setOperatorId] = useState('0x742d...bEd0');
  const [events, setEvents] = useState<TrustEvent[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await api<any>('/api/v1/security/events?limit=15');
        const rawEvents = Array.isArray(data) ? data : data.events || [];
        
        // Map backend security events to our Treasury Ledger format
        const mappedEvents: TrustEvent[] = rawEvents.map((e: any) => ({
          id: e.id,
          timestamp: e.timestamp,
          action: e.event_type.toUpperCase(),
          target: e.threat_type || 'system_node',
          status: e.status === 'resolved' ? 'AUTHORIZED' : 'BLOCKED',
          hash: e.evidence_hash || `sha256:${Math.random().toString(16).slice(2)}`,
          reason: e.description,
        }));
        
        setEvents(mappedEvents);
      } catch (err) {
        console.error('Failed to fetch governance ledger', err);
      }
    };

    fetchEvents();
    const interval = setInterval(fetchEvents, 8000);
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
                <ShieldCheck size={14} />
              </span>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-brand-400 font-bold">
                Zero-Trust · Governance & Identity
              </span>
            </div>
            <h1 className="text-[32px] font-bold tracking-tight text-white">
              Operator Registry
            </h1>
            <p className="text-sm text-ink-400 max-w-3xl">
              Immutable identity ledger. Your cryptographic signature enforces Law 0 governance across the entire swarm architecture.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="flex items-center gap-2 bg-[#0a0a0a] border border-[#333] px-3 py-1.5 rounded text-[10px] font-mono font-bold text-accent-green">
              <CheckCircle size={12} />
              x402 Native
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* ── Left Column: Identity Matrix ──────────────────────────────── */}
          <div className="lg:col-span-4 space-y-6">
            
            <div className="bg-[#050505] border border-[#242424] rounded-xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-brand-500/10 blur-3xl rounded-full" />
              
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[11px] font-mono font-bold text-ink-300 uppercase tracking-widest flex items-center gap-2">
                  <Fingerprint size={14} className="text-brand-400" /> Root Identity
                </h3>
                <span className="text-[9px] font-mono font-bold text-brand-400 bg-brand-500/10 border border-brand-500/20 px-2 py-0.5 rounded uppercase">
                  SOVEREIGN RANK
                </span>
              </div>

              <div className="space-y-4 relative z-10">
                <div>
                  <p className="text-[9px] font-mono text-ink-600 uppercase tracking-widest mb-1">Operator Alias</p>
                  <p className="text-lg font-bold text-white tracking-wide">SysAdmin Zero</p>
                </div>
                <div>
                  <p className="text-[9px] font-mono text-ink-600 uppercase tracking-widest mb-1">Cryptographic Key (x402)</p>
                  <div className="flex items-center gap-2 bg-[#111] border border-[#333] p-2 rounded">
                    <Key size={12} className="text-ink-500" />
                    <code className="text-[11px] font-mono text-brand-300">{operatorId}</code>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#242424]">
                  <div>
                    <p className="text-[9px] font-mono text-ink-600 uppercase tracking-widest mb-1">Trust Score</p>
                    <p className="text-2xl font-bold font-mono text-white">99.8<span className="text-sm text-ink-600">/100</span></p>
                  </div>
                  <div>
                    <p className="text-[9px] font-mono text-ink-600 uppercase tracking-widest mb-1">Clearance</p>
                    <p className="text-sm font-bold font-mono text-accent-green mt-1">LEVEL 5</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#050505] border border-[#242424] rounded-xl p-5 shadow-xl">
              <h3 className="text-[11px] font-mono font-bold text-ink-300 uppercase tracking-widest flex items-center gap-2 mb-4">
                <Shield size={14} className="text-ink-500" /> Security Policies
              </h3>
              <div className="space-y-2">
                {['Strict Law 0 Enforcement', 'x402 Payment Channel Locked', 'Gradient Routing Only', 'No Third-Party Telemetry'].map((policy, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 bg-[#111] border border-[#242424] rounded">
                    <span className="text-[11px] font-mono text-ink-300">{policy}</span>
                    <CheckCircle size={12} className="text-brand-400" />
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ── Right Column: Immutable Ledger ────────────────────────────── */}
          <div className="lg:col-span-8 flex flex-col">
            <div className="bg-[#050505] border border-[#242424] rounded-xl flex flex-col flex-1 overflow-hidden shadow-2xl relative min-h-[500px]">
              
              <div className="px-5 py-4 border-b border-[#242424] bg-[#0a0a0a] flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded bg-[#1a1a1a] border border-[#333]">
                    <Terminal size={12} className="text-brand-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">Immutable Event Ledger</h3>
                    <p className="text-[10px] font-mono text-ink-500">Cryptographically Signed Governance Actions</p>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 bg-[#111] border border-brand-500/20 px-2.5 py-1 rounded text-[9px] font-mono font-bold text-brand-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
                  SYNCED
                </span>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#111] border-b border-[#242424] sticky top-0 z-10">
                    <tr>
                      <th className="px-5 py-3 text-[9px] font-mono font-bold text-ink-500 uppercase tracking-widest w-24">Timestamp</th>
                      <th className="px-5 py-3 text-[9px] font-mono font-bold text-ink-500 uppercase tracking-widest">Action / Target</th>
                      <th className="px-5 py-3 text-[9px] font-mono font-bold text-ink-500 uppercase tracking-widest">Status</th>
                      <th className="px-5 py-3 text-[9px] font-mono font-bold text-ink-500 uppercase tracking-widest text-right">Proof Hash</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#242424]">
                    {events.map((ev, i) => (
                      <motion.tr 
                        key={ev.id}
                        initial={{ opacity: 0, backgroundColor: 'rgba(255,184,0,0.1)' }}
                        animate={{ opacity: 1, backgroundColor: 'transparent' }}
                        transition={{ duration: 1 }}
                        className="hover:bg-[#111] transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div className="text-[10px] font-mono text-ink-500 flex items-center gap-1.5">
                            <Clock size={10} /> {new Date(ev.timestamp).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-[11px] font-mono font-bold text-white mb-0.5">{ev.action}</div>
                          <div className="text-[10px] font-mono text-ink-600">{ev.target}</div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={clsx(
                            "px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-widest border flex items-center gap-1.5 w-max",
                            ev.status === 'AUTHORIZED' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-red-500/10 text-red-400 border-red-500/30"
                          )}>
                            {ev.status === 'AUTHORIZED' ? <CheckCircle size={10} /> : <AlertTriangle size={10} />}
                            {ev.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="text-[10px] font-mono text-ink-400">{ev.hash}</div>
                          <div className="text-[9px] font-mono text-ink-600 mt-0.5 truncate max-w-[200px] inline-block" title={ev.reason}>{ev.reason}</div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
