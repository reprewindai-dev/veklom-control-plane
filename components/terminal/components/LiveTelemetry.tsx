"use client";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TelemetryTick } from '../types';
import { Radio, AlertCircle, RefreshCw, Layers, ShieldCheck, Zap, Database, Play } from 'lucide-react';

interface LiveTelemetryProps {
  logs: TelemetryTick[];
  metrics: {
    throughput: number;
    attestationRate: number;
    gasSaved: number;
    activeQueue: number;
    uptime: string;
    totalExecutions: number;
  };
  onTriggerManualOverride: (intent: string, policy: string) => void;
}

import { useRef, useEffect } from 'react';
export default function LiveTelemetry({ logs, metrics, onTriggerManualOverride }: LiveTelemetryProps) {
  const [overrideIntent, setOverrideIntent] = useState('');
  const [overridePolicy, setOverridePolicy] = useState('SEC-GAS-LIMIT-MAX');
  const [triggerCount, setTriggerCount] = useState(0);

  const handleManualTrigger = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideIntent.trim()) return;

    onTriggerManualOverride(overrideIntent, overridePolicy);
    setOverrideIntent('');
    setTriggerCount(p => p + 1);

    // Visual trigger feedback
    const btn = document.getElementById('triggerBtn');
    if (btn) {
      btn.classList.add('bg-matrix-emerald');
      setTimeout(() => {
        btn.classList.remove('bg-matrix-emerald');
      }, 1000);
    }
  };

  const logEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getLogColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-matrix-emerald';
      case 'warn': return 'text-hazard-amber';
      case 'error': return 'text-laser-red';
      default: return 'text-[#ffffffb3]';
    }
  };

  return (
    <div className="w-full flex flex-col font-mono text-xs select-none bg-[#030303]">
      
      {/* 1. Top Panel: High-Density Real-Time Telemetry Gauges */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 p-4 border-b border-white/10 bg-black/40">
        
        <div className="p-3 rounded-none border border-white/5 bg-[#0A0A0C]">
          <span className="text-white/30 block text-[9px] uppercase tracking-wider flex items-center gap-1">
            <Radio className="w-3 h-3 text-electric-cyan" /> Network Throughput
          </span>
          <span className="text-white text-sm font-bold text-glow-cyan">{metrics.throughput} KB/S</span>
          <div className="text-[8.5px] text-[#ffffff26] mt-0.5 truncate">Active multiplexer channels</div>
        </div>

        <div className="p-3 rounded-none border border-white/5 bg-[#0A0A0C]">
          <span className="text-white/30 block text-[9px] uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-matrix-emerald" /> Attestation Rate
          </span>
          <span className="text-[#00FF66] text-sm font-bold text-glow-emerald">{metrics.attestationRate}%</span>
          <div className="text-[8.5px] text-[#ffffff26] mt-0.5">Gas arbitrage proof checks</div>
        </div>

        <div className="p-3 rounded-none border border-white/5 bg-[#0A0A0C]">
          <span className="text-white/30 block text-[9px] uppercase tracking-wider flex items-center gap-1">
            <Zap className="w-3 h-3 text-hazard-amber" /> Gas Saved En Route
          </span>
          <span className="text-white text-sm font-bold">{metrics.gasSaved.toLocaleString()} Gwei</span>
          <div className="text-[8.5px] text-[#ffffff26] mt-0.5">Optimizer compile bypass</div>
        </div>

        <div className="p-3 rounded-none border border-white/5 bg-[#0A0A0C]">
          <span className="text-white/30 block text-[9px] uppercase tracking-wider flex items-center gap-1">
            <Layers className="w-3 h-3 text-white/50" /> Active Exec Queue
          </span>
          <span className="text-electric-cyan text-sm font-bold">{metrics.activeQueue} Pending</span>
          <div className="text-[8.5px] text-[#ffffff26] mt-0.5">Swarm multiplex queues</div>
        </div>

        <div className="p-3 rounded-none border border-white/5 bg-[#0A0A0C]">
          <span className="text-white/30 block text-[9px] uppercase tracking-wider flex items-center gap-1">
            <Database className="w-3 h-3 text-white/50" /> Total Executed
          </span>
          <span className="text-white text-sm font-bold">{metrics.totalExecutions.toLocaleString()}</span>
          <div className="text-[8.5px] text-[#ffffff26] mt-0.5">State roots finalized</div>
        </div>

        <div className="p-3 rounded-none border border-white/5 bg-[#0A0A0C]">
          <span className="text-white/30 block text-[9px] uppercase tracking-wider flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-[#555]" /> Core Uptime
          </span>
          <span className="text-white/80 text-sm font-bold">{metrics.uptime}</span>
          <div className="text-[8.5px] text-[#ffffff26] mt-0.5">Control plane cluster online</div>
        </div>

      </div>

      {/* 2. Split Screen Footer: Terminal console output & manual trigger interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 flex-grow bg-black/20">
        
        {/* Terminal Streams System panel */}
        <div className="lg:col-span-8 flex flex-col h-60 relative group">
          <div className="flex items-center justify-between text-[10px] text-white/40 uppercase tracking-widest font-black mb-1.5 pb-1 border-b border-white/10">
            <span>MCP IO SYSCON STREAM & cAPI CLI</span>
            <span className="flex items-center gap-1 text-matrix-emerald">
              <span className="w-1.5 h-1.5 bg-matrix-emerald animate-pulse" /> LIVE STREAMING
            </span>
          </div>

          <div
            id="terminal-container"
            className="flex-grow bg-[#040406] border border-white/10 rounded-none p-3 font-mono text-[10.5px] leading-relaxed overflow-y-auto space-y-2 selection:bg-electric-cyan/20 selector-all flex flex-col"
          >
            <AnimatePresence initial={false}>
              {[...logs].reverse().map((log) => (
                <motion.div
                  key={`${log.timestamp}-${log.message}`}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start gap-2.5 hover:bg-white/[0.02]"
                >
                  <span className="text-white/20 select-none">[{log.timestamp.substring(11, 19)}]</span>
                  <span className="text-electric-cyan font-bold select-none min-w-[70px] uppercase shrink-0">
                    [{log.source}]
                  </span>
                  <span className={`${getLogColor(log.type)} tracking-tight break-all font-sans text-xs`}>
                    {log.message}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
            <div className="flex items-center mt-2 group focus-within:ring-0">
                <span className="text-electric-cyan font-bold select-none min-w-[70px] uppercase shrink-0">
                  [USER-CLI] &gt;
                </span>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const input = e.currentTarget.elements.namedItem('cli-input') as HTMLInputElement;
                    const val = input.value.trim();
                    if (!val) return;

                    // Simple CLI parsing simulation
                    let responseMsg = '';
                    const lowerVal = val.toLowerCase();
                    if (lowerVal.startsWith('capi')) {
                      responseMsg = `cAPI Interface activated for command: ${val}. Connecting to veklom-byos-backend...`;
                    } else if (lowerVal.startsWith('veklom')) {
                      responseMsg = `Veklom Backend: Evaluating deterministic routing request...`;
                    } else if (lowerVal.startsWith('cappo')) {
                      responseMsg = `CAPPO Runtime: Triggering PGL governed execution & ExecutionIdentityV1 validation...`;
                    } else if (lowerVal.startsWith('exec') || lowerVal.startsWith('/v1/exec')) {
                      responseMsg = `Dispatching manual intent via CLI.`;
                      onTriggerManualOverride(val, overridePolicy);
                    } else if (lowerVal === 'help') {
                      responseMsg = `Supported commands: capi <cmd>, veklom <cmd>, cappo <cmd>, exec <intent>`;
                    } else {
                      responseMsg = `Command not recognized. Type 'help' for available CLI commands.`;
                    }

                    input.value = '';

                    window.dispatchEvent(new CustomEvent('cli-command', { detail: { command: val, response: responseMsg } }));
                  }}
                  className="w-full flex-grow flex"
                >
                  <input
                    id="cli-input"
                    name="cli-input"
                    type="text"
                    autoComplete="off"
                    className="w-full bg-transparent border-none text-white focus:outline-none font-sans text-xs tracking-tight ml-2"
                    placeholder="Enter cAPI / veklom / cappo command..."
                  />
                </form>
            </div>
            <div ref={logEndRef} />
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col justify-between h-60 border border-white/10 rounded-none p-4 bg-[#0A0A0C]">
          <div>
            <div className="text-[10px] text-white/45 font-black uppercase tracking-widest mb-1.5">
              MANUAL PILOT INJECTION
            </div>
            
            <form onSubmit={handleManualTrigger} className="space-y-3">
              <div>
                <label className="text-[9px] uppercase tracking-wider text-white/30 block mb-1">
                  Manual Swarm Execution Intent
                </label>
                <input
                  type="text"
                  placeholder="E.g., Flush secondary caches and reboot root VM."
                  value={overrideIntent}
                  onChange={(e) => setOverrideIntent(e.target.value)}
                  className="w-full bg-black border border-white/15 rounded-none p-2 text-xs text-white placeholder-white/20 focus:border-electric-cyan/50 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[9px] uppercase tracking-wider text-white/30 block mb-1">
                  Governance Policy Sandbox
                </label>
                <select
                  value={overridePolicy}
                  onChange={(e) => setOverridePolicy(e.target.value)}
                  className="w-full bg-black border border-white/15 rounded-none p-1.5 text-xs text-white/80 focus:outline-none"
                >
                  <option value="SEC-GAS-LIMIT-MAX">SEC-GAS-LIMIT-MAX (2.4 Gwei est limit)</option>
                  <option value="SEC-REENTRANCY-01">SEC-REENTRANCY-01 (Strict execution depth)</option>
                  <option value="SYS-MEM-BOUNDS-4G">SYS-MEM-BOUNDS-4G (Hardware sandbox bound)</option>
                  <option value="GOV-QUORUM-65P">GOV-QUORUM-65P (Vesting quota thresholds)</option>
                </select>
              </div>

              <button
                id="triggerBtn"
                type="submit"
                className="w-full py-2 bg-white/[0.01] hover:bg-white/[0.04] border border-white/10 rounded-none text-white flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-widest transition-all duration-300 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 text-glow-emerald" />
                Trigger Manual Override
              </button>
            </form>
          </div>

          <div className="text-[9px] leading-snug text-white/25 italic border-t border-white/5 pt-2">
            *Override forces deep enclavement calculations inside the Run Spine timeline.
          </div>
        </div>

      </div>

    </div>
  );
}
