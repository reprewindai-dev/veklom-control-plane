"use client";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { VeklomRun } from '../types';
import { Search, ShieldAlert, Shield, FileSpreadsheet, Lock } from 'lucide-react';

interface DataGridProps {
  runs: VeklomRun[];
}

export default function DataGrid({ runs }: DataGridProps) {
  const [gridTab, setGridTab] = useState<'runs' | 'evidence'>('runs');
  const [search, setSearch] = useState('');
  const [policyFilter, setPolicyFilter] = useState<'ALL' | 'passed' | 'warning' | 'violated'>('ALL');

  // Tooltip tracking
  const [hoveredPolicyRowId, setHoveredPolicyRowId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Virtualized continuous scroll state
  const [visibleCount, setVisibleCount] = useState(25);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filter calculations
  const filteredRuns = useMemo(() => {
    return runs.filter(run => {
      const matchesSearch = run.id.toLowerCase().includes(search.toLowerCase()) || 
                            run.intent.toLowerCase().includes(search.toLowerCase()) ||
                            run.policyRule.toLowerCase().includes(search.toLowerCase()) ||
                            run.hash.toLowerCase().includes(search.toLowerCase());
      const matchesPolicy = policyFilter === 'ALL' || run.policyStatus === policyFilter;
      return matchesSearch && matchesPolicy;
    });
  }, [runs, search, policyFilter]);

  // Infinite Scroll intersection detection
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 100) {
      // Near bottom, expand load slice window representing virtual list extension
      setVisibleCount(prev => Math.min(filteredRuns.length, prev + 15));
    }
  };

  const visibleRunsSlice = useMemo(() => {
    return filteredRuns.slice(0, visibleCount);
  }, [filteredRuns, visibleCount]);

  // Adjust coordinates for Policy status chip hover tooltip
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    // Offset standard positions to render directly above cursor bounds
    setTooltipPos({
      x: e.clientX + 15,
      y: e.clientY - 15
    });
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#030303] select-none font-mono">
      
      {/* Search and Tab selectors */}
      <div className="p-4 border-b border-white/10 bg-black/80 backdrop-blur flex flex-wrap items-center justify-between gap-4 z-10 text-xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex bg-[#030303] rounded-none border border-white/15 overflow-hidden">
            <button
              onClick={() => {
                setGridTab('runs');
                setSearch('');
              }}
              className={`px-3 py-1.5 text-[11px] font-bold uppercase transition-all duration-200 rounded-none cursor-pointer ${
                gridTab === 'runs' ? 'bg-electric-cyan text-void-black font-extrabold' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              VeklomRuns Ledger
            </button>
            <button
              onClick={() => {
                setGridTab('evidence');
                setSearch('');
              }}
              className={`px-3 py-1.5 text-[11px] font-bold uppercase transition-all duration-200 rounded-none cursor-pointer ${
                gridTab === 'evidence' ? 'bg-electric-cyan text-void-black font-extrabold' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              Evidence Credentials ({runs.length})
            </button>
          </div>

          <div className="flex items-center gap-2 bg-[#0A0A0C] border border-white/10 rounded-none px-2.5 py-1">
            <Search className="w-3.5 h-3.5 text-white/35" />
            <input
              type="text"
              placeholder={gridTab === 'runs' ? "Search execution runs..." : "Query evidence registry..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none text-white focus:outline-none placeholder-white/20 font-mono text-xs w-48"
            />
          </div>
        </div>

        {gridTab === 'runs' && (
          <div className="flex items-center gap-2">
            <span className="text-white/40">POLICY FILTER:</span>
            <div className="flex rounded-none border border-white/10 overflow-hidden text-[10px]">
              {['ALL', 'passed', 'warning', 'violated'].map((st) => (
                <button
                  key={st}
                  onClick={() => setPolicyFilter(st as any)}
                  className={`px-2.5 py-1 font-bold uppercase transition-colors rounded-none cursor-pointer ${
                    policyFilter === st ? 'bg-white/10 text-white font-extrabold' : 'bg-transparent text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Primary Grid Container with row-dimming mouse groups */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-grow overflow-y-auto max-h-[calc(100vh-140px)] group/grid bg-[#030303]"
      >
        {gridTab === 'runs' ? (
          /* A: VEKLOMRUNS LEDGER */
          <div className="min-w-[800px] w-full border-collapse text-[11px]">
            {/* Header row */}
            <div className="sticky top-0 bg-[#0A0A0C] border-b border-white/15 p-3 flex text-white/40 font-bold uppercase text-[10px] tracking-widest z-10">
              <div className="w-[12%]">RUN ID</div>
              <div className="w-[12%]">STATUS</div>
              <div className="w-[33%]">INTENT PRE-VALIDATION</div>
              <div className="w-[18%]">POLICY EVALUATED</div>
              <div className="w-[13%]">DURATION</div>
              <div className="w-[12%] text-right font-sans">TIMESTAMP</div>
            </div>

            {/* List Body */}
            <div className="divide-y divide-white/[0.03]">
              {visibleRunsSlice.length === 0 ? (
                <div className="text-center py-10 text-white/20 uppercase font-bold italic">No matching running transactions inside proof pool.</div>
              ) : (
                visibleRunsSlice.map((run) => {
                  let badgeStyle = 'text-matrix-emerald border-matrix-emerald/35 bg-matrix-emerald/10';
                  if (run.status === 'failed') badgeStyle = 'text-laser-red border-laser-red/35 bg-laser-red/10';
                  if (run.status === 'running') badgeStyle = 'text-electric-cyan border-electric-cyan/35 bg-electric-cyan/10 animate-pulse';

                  let policyStyle = 'text-matrix-emerald/80 border-matrix-emerald/30';
                  if (run.policyStatus === 'warning') policyStyle = 'text-hazard-amber/80 border-hazard-amber/30';
                  if (run.policyStatus === 'violated') policyStyle = 'text-laser-red/80 border-laser-red/30';

                  return (
                    <div
                      key={run.id}
                      className="p-3 flex items-center transition-all duration-300 border-b border-white/[0.01] hover:bg-white/[0.02] cursor-default group-hover/grid:opacity-30 hover:!opacity-100 font-mono tracking-tight"
                      style={{ contentVisibility: 'auto' }}
                    >
                      {/* ID */}
                      <div className="w-[12%] text-white font-bold">{run.id}</div>
                      
                      {/* Status */}
                      <div className="w-[12%]">
                        <span className={`px-2 py-0.5 rounded-none text-[9.5px] uppercase font-bold border ${badgeStyle}`}>
                          {run.status}
                        </span>
                      </div>

                      {/* Intent */}
                      <div className="w-[33%] text-white/85 font-sans text-xs tracking-tight truncate pr-4" title={run.intent}>
                        {run.intent}
                      </div>

                      {/* Policy Status Chip with Hover Tooltip Trigger */}
                      <div className="w-[18%] relative">
                        <div
                          onMouseEnter={() => setHoveredPolicyRowId(run.id)}
                          onMouseLeave={() => setHoveredPolicyRowId(null)}
                          onMouseMove={handleMouseMove}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-none text-[9.5px] font-mono border bg-void-black/70 cursor-help ${policyStyle}`}
                        >
                          <Shield className="w-3 h-3 saturate-[0.8]" />
                          {run.policyRule}
                        </div>
                      </div>

                      {/* Duration */}
                      <div className="w-[13%] text-white/50">{run.duration}</div>

                      {/* Timestamp */}
                      <div className="w-[12%] text-right text-white/30 text-[10px]">
                        {run.timestamp.substring(11, 19)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          /* B: EVIDENCE CREDENTIALS FOR COMPLIANCE AUDITING */
          <div className="min-w-[800px] w-full border-collapse text-[11px]">
            {/* Header row */}
            <div className="sticky top-0 bg-[#0A0A0C] border-b border-white/15 p-3 flex text-white/40 font-bold uppercase text-[10px] tracking-widest z-10">
              <div className="w-[15%]">CREDENTIAL ID</div>
              <div className="w-[35%]">DELEGATIVE SEAL HASH</div>
              <div className="w-[12%]">FILE SECURED</div>
              <div className="w-[13%]">EVIDENCE CLASS</div>
              <div className="w-[13%]">ATTESTOR</div>
              <div className="w-[12%] text-right">SECURITY CHECK</div>
            </div>

            {/* List Body */}
            <div className="divide-y divide-white/[0.03]">
              {visibleRunsSlice.map((run, idx) => {
                return (
                  <div
                    key={`evidence-${run.id}`}
                    className="p-3.5 flex items-center transition-all duration-300 border-b border-white/[0.01] hover:bg-white/[0.02] cursor-default group-hover/grid:opacity-30 hover:!opacity-100 font-mono tracking-tight"
                    style={{ contentVisibility: 'auto' }}
                  >
                    {/* CRED ID */}
                    <div className="w-[15%] text-electric-cyan font-bold flex items-center gap-1.5">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-white/30" />
                      EVI-{String(1000 + idx).padStart(4, '0')}
                    </div>

                    {/* DELEGATIVE HASH */}
                    <div className="w-[35%] text-white/60 font-mono text-[10px] break-all truncate select-all pr-4 font-bold uppercase" title={run.hash}>
                      {run.hash}
                    </div>

                    {/* FILE SECURED */}
                    <div className="w-[12%] text-white/80">proof_encl.json</div>

                    {/* EVIDENCE CLASS */}
                    <div className="w-[13%] text-[#999]">
                      <span className="px-1.5 py-0.5 rounded-none bg-black border border-white/10">
                        ZKP_SIGN
                      </span>
                    </div>

                    {/* ATTESTOR */}
                    <div className="w-[13%] text-white/45 uppercase text-[10px] font-bold">SEKED Core 0</div>

                    {/* SECURITY CHECK */}
                    <div className="w-[12%] text-right flex items-center justify-end gap-1.5 text-matrix-emerald">
                      <Lock className="w-3.5 h-3.5" /> SECURE
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Floating Glassmorphic Tooltip showing Exact ArbiterOS Policy Rules */}
      <AnimatePresence>
        {hoveredPolicyRowId && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            style={{ 
              position: 'fixed', 
              left: tooltipPos.x, 
              top: tooltipPos.y,
              transform: 'translateY(-100%)' 
            }}
            className="z-50 max-w-sm p-3.5 rounded-none bg-black border border-white/15 shadow-[0_4px_25px_rgba(0,0,0,0.95)] leading-relaxed text-[11px] pointer-events-none"
          >
            {(() => {
              const run = runs.find(r => r.id === hoveredPolicyRowId);
              if (!run) return null;
              return (
                <div>
                  <div className="text-[10px] text-electric-cyan uppercase font-bold tracking-widest flex items-center gap-1 mb-1 border-b border-white/[0.06] pb-1">
                    <ShieldAlert className="w-3.5 h-3.5" /> ArbiterOS Securitas Rule Evaluation
                  </div>
                  <div className="text-white/40 uppercase mb-1">
                    Rule ID: <strong className="text-glow-cyan text-white">{run.policyRule}</strong>
                  </div>
                  <p className="text-white/80 leading-normal mb-1.5">
                    {run.policyDetails}
                  </p>
                  <div className="flex justify-between items-center text-[10.5px] mt-2">
                    <span className="text-white/30">Verification Integrity Score:</span>
                    <span className={`font-black ${
                      run.policyStatus === 'passed' ? 'text-matrix-emerald' : 
                      run.policyStatus === 'warning' ? 'text-hazard-amber' : 'text-laser-red'
                    }`}>
                      {run.policyStatus.toUpperCase()}
                    </span>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid count display footer */}
      <div className="p-2 border-t border-white/[0.04] bg-void-charcoal/[0.4] text-center text-[10px] text-white/30 font-mono tracking-widest uppercase flex justify-between px-4">
        <span>Ledger Status: Connected Live</span>
        <span>Showing {Math.min(filteredRuns.length, visibleRunsSlice.length)} of {filteredRuns.length} Proof Transactions</span>
      </div>

    </div>
  );
}
