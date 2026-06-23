/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Delegate } from '../types';
import { Users, Send, AlertTriangle } from 'lucide-react';

interface CouncilMatrixProps {
  delegates: Delegate[];
  onVotePropose?: (proposalName: string) => void;
}

export default function CouncilMatrix({ delegates, onVotePropose }: CouncilMatrixProps) {
  const [activeMotion, setActiveMotion] = useState<string>('SYS-UPDATE-V5.0.3: Allocate Swarm validators to high-priority ZK proof pipeline.');
  const [proposedMotionText, setProposedMotionText] = useState('');
  const [isSealing, setIsSealing] = useState(false);
  const [motionStatus, setMotionStatus] = useState<'voting' | 'sealed' | 'rejected'>('voting');

  // Calculate real-time weights and votes
  const voteAnalysis = useMemo(() => {
    let yeaWeights = 0;
    let nayWeights = 0;
    let abstainWeights = 0;
    let pendingWeights = 0;
    let totalWeight = 0;

    delegates.forEach(d => {
      totalWeight += d.weight;
      if (d.vote === 'yea') yeaWeights += d.weight;
      else if (d.vote === 'nay') nayWeights += d.weight;
      else if (d.vote === 'abstain' || d.vote === 'absustain' as any) abstainWeights += d.weight;
      else pendingWeights += d.weight;
    });

    const yeaPercentage = totalWeight > 0 ? (yeaWeights / totalWeight) * 100 : 0;
    const isQuorumPassed = yeaPercentage >= 65;

    return {
      yeaWeights,
      nayWeights,
      abstainWeights,
      pendingWeights,
      totalWeight,
      yeaPercentage,
      isQuorumPassed
    };
  }, [delegates]);

  const handleProposeMotion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposedMotionText.trim()) return;

    setMotionStatus('voting');
    setIsSealing(true);
    if (onVotePropose) {
      onVotePropose(proposedMotionText);
    }
    setActiveMotion(proposedMotionText);
    setProposedMotionText('');

    setTimeout(() => {
      setIsSealing(false);
    }, 1200);
  };

  // Helper colors for delegates
  const getVoteColor = (vote: string) => {
    switch (vote) {
      case 'yea': return 'text-matrix-emerald border-matrix-emerald/30 bg-matrix-emerald/10';
      case 'nay': return 'text-laser-red border-laser-red/30 bg-laser-red/10';
      case 'abstain':
      case 'absustain' as any: 
        return 'text-hazard-amber border-hazard-amber/30 bg-hazard-amber/10';
      default: return 'text-electric-cyan border-electric-cyan/20 bg-electric-cyan/5';
    }
  };

  return (
    <div className="w-full h-full p-6 bg-void-black grid-overlay select-none overflow-y-auto font-mono">
      
      {/* Page Header */}
      <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <span className="text-[10px] text-electric-cyan tracking-widest font-black uppercase">Consensus Oversight Unit</span>
          <h2 className="text-white text-base font-bold font-sans tracking-tight">Council Committee Matrix</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-none bg-white/[0.01] border border-white/5 text-[10px] text-white/50 leading-relaxed max-w-sm">
            <span className="text-hazard-amber font-bold uppercase block font-sans">• QUORUM THRESHOLD: 65% YEA VOTE WEIGHT</span>
            ArbiterOS requires structural quorum representation to seal state ledger paths.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN (8 cols): Interactive Delegates Matrix Heat Grid */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Active Motion Monitor Box */}
          <div className="p-4 rounded-none border border-white/10 bg-black/60 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 text-[9px] uppercase font-bold text-white/30 tracking-tight">PROPOSAL STATE</div>
            <div className="text-[9px] text-electric-cyan tracking-wider font-bold mb-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-electric-cyan animate-pulse-glow" /> ACTIVE LEGISLATIVE MOTION
            </div>
            <p className="text-white font-sans text-xs font-bold leading-normal mb-3 max-w-xl">
              &quot;{activeMotion}&quot;
            </p>

            {/* Matrix Liquid Quorum Progress Bar */}
            <div className="space-y-1.5 font-mono">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-white/40 uppercase">Consensus Weight:</span>
                <span className={voteAnalysis.isQuorumPassed ? 'text-matrix-emerald font-semibold' : 'text-hazard-amber'}>
                  {voteAnalysis.yeaPercentage.toFixed(1)}% ({voteAnalysis.yeaWeights} / {voteAnalysis.totalWeight} units)
                </span>
              </div>

              {/* Progress Container */}
              <div className="relative w-full h-8 bg-void-black border border-white/15 rounded-none overflow-hidden flex items-center justify-between px-3">
                
                {/* Liquid animation overlay matching vote scale percentage */}
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: `${voteAnalysis.yeaPercentage}%` }}
                  transition={{ type: 'spring', damping: 20 }}
                  className={`absolute left-0 top-0 h-full opacity-35 ${
                    voteAnalysis.isQuorumPassed 
                      ? 'bg-gradient-to-r from-matrix-emerald/50 to-matrix-emerald animate-liquid-fill' 
                      : 'bg-gradient-to-r from-hazard-amber/35 to-hazard-amber animate-fast-pulse'
                  }`}
                  style={{ backgroundSize: '200% 100%' }}
                />

                {/* Minimum Quorum marker line at 65% bounds */}
                <div 
                  className="absolute bottom-0 top-0 w-[2px] bg-red-500/60 z-10 hover:opacity-100 opacity-60" 
                  style={{ left: '65%' }}
                  title="65% Quorum Threshold"
                />

                {/* Informative Label centering overlay */}
                <span className="text-[10px] text-white/80 font-bold tracking-wider z-10 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-white/50" /> 
                  Representative weights: YEA percentage: {voteAnalysis.yeaPercentage.toFixed(0)}%
                </span>

                <span className={`text-[10px] font-black z-10 uppercase px-2 py-0.5 rounded-none ${
                   voteAnalysis.isQuorumPassed 
                     ? 'text-matrix-emerald bg-matrix-emerald/10 border border-matrix-emerald/20 animate-pulse-glow border-solid' 
                     : 'text-hazard-amber bg-hazard-amber/10 border border-hazard-amber/20'
                 }`}>
                  {voteAnalysis.isQuorumPassed ? '✓ QUORUM SECURE' : '⚠ WAITING STATE'}
                </span>
              </div>
            </div>
          </div>

          {/* 5 Main delegate cards heat grid layout */}
          <div>
            <div className="text-[10px] uppercase text-white/40 tracking-widest font-black mb-3">CONGOV REPRESENTATIVE MATRIX DELEGATES</div>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {delegates.map((delegate) => {
                const voteStyle = getVoteColor(delegate.vote);
                return (
                  <motion.div
                    key={delegate.id}
                    layout
                    className="p-3.5 rounded-none border border-white/5 bg-white/[0.02] flex flex-col justify-between space-y-4 hover:border-white/10 hover:bg-[#00E5FF]/5 transition-colors"
                  >
                    <div>
                      {/* Department indicator */}
                      <span className="text-[9px] uppercase tracking-wider text-white/30 block mb-0.5">
                        {delegate.department}
                      </span>
                      <h4 className="text-white text-xs font-bold font-sans leading-snug tracking-tight truncate">
                        {delegate.name}
                      </h4>
                      <div className="text-[8.5px] text-[#ffffff33] font-mono mt-0.5 truncate select-none">
                        Ref: {delegate.id}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-[10px] flex justify-between">
                        <span className="text-white/40">Veto Weight:</span>
                        <strong className="text-white font-mono">{delegate.weight}%</strong>
                      </div>
                      <div className="w-full bg-white/5 h-1 rounded-none overflow-hidden">
                        <div className="bg-electric-cyan h-full" style={{ width: `${delegate.influence}%` }} />
                      </div>
                    </div>

                    {/* Vote ballot chip representation */}
                    <div className={`p-1.5 rounded-none border text-center text-[10px] font-bold uppercase ${voteStyle}`}>
                      {delegate.vote === 'abstain' ? 'ABSTAIN' : delegate.vote}
                    </div>

                    <div className="text-[8px] text-white/20 font-mono text-center truncate">
                      Last attestation: {delegate.lastAttestation}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN (4 cols): Propose new motion engine */}
        <div className="lg:col-span-4 space-y-4.5">
          
          {/* Propose Form block */}
          <div className="p-4 rounded-none border border-white/10 bg-black/60 flex flex-col justify-between">
            <div>
              <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">COUNCIL OVERRIDE CENTER</div>
              <h3 className="text-white text-xs font-bold font-sans mb-3 select-none">Draft Radical Policy Motion</h3>
              <p className="text-[11px] text-white/50 leading-relaxed mb-4">
                Propose a new state update vector. Submitting the motion forces delegates to evaluate parameters and update weight allocations in real-time.
              </p>

              <form onSubmit={handleProposeMotion} className="space-y-3 font-mono">
                <div>
                  <label className="text-[9px] uppercase tracking-wider text-white/30 block mb-1">PROPOSAL DESCRIPTION</label>
                  <textarea
                    rows={3}
                    placeholder="E.g., Allocate Swarm nodes to optimize cross-chain gas schedules."
                    value={proposedMotionText}
                    onChange={(e) => setProposedMotionText(e.target.value)}
                    className="w-full bg-void-black border border-white/[0.08] rounded-none p-2 text-xs text-white/90 placeholder-white/25 focus:border-electric-cyan/40 focus:outline-none focus:ring-1 focus:ring-electric-cyan/35 leading-normal"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSealing}
                  className="w-full py-2.5 px-3 bg-electric-cyan text-void-black text-[10.5px] font-bold border border-transparent rounded-none hover:bg-electric-cyan/90 transition-colors flex items-center justify-center gap-2 tracking-widest uppercase disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSealing ? 'INJECTING ON COUNCIL BUS...' : 'Incept Legislative Motion'}
                </button>
              </form>
            </div>
          </div>

          {/* Legislative rules banner help */}
          <div className="p-4.5 rounded-none border border-[#ff003c]/20 bg-black/40 space-y-3.5 font-mono text-[11px] leading-relaxed">
            <h5 className="flex items-center gap-1.5 font-bold text-laser-red text-[11px] uppercase tracking-widest animate-pulse">
              <AlertTriangle className="w-4 h-4 text-laser-red" /> ArbiterOS Securitas
            </h5>
            <p className="text-white/60">
              Council votes represent state-root validator enclaves. Under catastrophic rollback threats, a direct Veto triggers complete consensus lockout (RED ALARM).
            </p>
            <div className="text-[9.5px] text-white/30 leading-snug">
              *All voting weights represent actual staking bounds computed under SEKED sandboxes.
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
