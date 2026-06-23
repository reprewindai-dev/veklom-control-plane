/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { VeklomRun, SpineStep } from '../types';
import { ShieldCheck, Database, Key, HelpCircle, ChevronRight, CheckCircle2, Play, Copy, Activity } from 'lucide-react';
import { useLockSound } from '../hooks/useLockSound';
import AttestationRing from './AttestationRing';

interface RunSpineProps {
  runs: VeklomRun[];
  selectedRunId: string | null;
  onSelectRun: (id: string) => void;
}

export default function RunSpine({ runs, selectedRunId, onSelectRun }: RunSpineProps) {
  // Grab the selected run or default to the first one
  const selectedRun = runs.find(r => r.id === selectedRunId) || runs[0];

  const stepsDetails = [
    { name: 'Intent' as SpineStep, icon: HelpCircle, color: '#00E5FF', label: 'EVAL_INTENT' },
    { name: 'Plan' as SpineStep, icon: Activity, color: '#00E5FF', label: 'GEN_SEQUENCE' },
    { name: 'ArbiterOS' as SpineStep, icon: ShieldCheck, color: '#FFAB00', label: 'GOV_ARBITER_POLICY' },
    { name: 'Redis Lua' as SpineStep, icon: Database, color: '#FFAB00', label: 'LUA_STATE_LOCK' },
    { name: 'Attestation' as SpineStep, icon: Key, color: '#00FF66', label: 'STATE_ATTEST_SEAL' },
  ];

  // Helper check for attestation states
  const isCompleted = selectedRun.status === 'completed';
  const isFailed = selectedRun.status === 'failed';
  const isRunning = selectedRun.status === 'running';

  const [lastCommittedId, setLastCommittedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const playLockSound = useLockSound();

  useEffect(() => {
    if (isCompleted && selectedRun.id !== lastCommittedId) {
      setLastCommittedId(selectedRun.id);
      playLockSound();
    }
  }, [selectedRun.id, isCompleted, lastCommittedId]);

  return (
    <div className="w-full h-full flex bg-[#030303] select-none">
      
      {/* LEFT PANEL: Dense Runs Tick Ledger List */}
      <div className="w-80 h-full border-r border-white/10 bg-black flex flex-col justify-between shrink-0 font-mono">
        <div className="p-3.5 border-b border-white/10 bg-black/60">
          <div className="text-[10px] text-white/40 uppercase tracking-widest font-black mb-1">PROOFS LEDGER FEED</div>
          <div className="text-white text-xs font-bold font-sans">VeklomRun Proof Pipelines</div>
        </div>

        <div className="flex-grow overflow-y-auto divide-y divide-white/5 max-h-[calc(100vh-100px)]">
          {runs.map((run) => {
            const isSel = run.id === selectedRun.id;
            return (
              <button
                key={run.id}
                onClick={() => onSelectRun(run.id)}
                className={`w-full p-3.5 text-left transition-all duration-200 block border-l-2 relative cursor-pointer ${
                  isSel ? 'bg-white/[0.03] border-l-electric-cyan' : 'border-l-transparent hover:bg-white/[0.015]'
                }`}
                style={{ contentVisibility: 'auto' }}
              >
                <div className="flex items-center justify-between text-[10px] mb-1.5 string-content">
                  <span className="text-white font-bold">{run.id}</span>
                  <span className={`px-1.5 py-0.5 rounded-none text-[8.5px] uppercase font-bold flex items-center gap-1 ${
                    run.status === 'completed' ? 'text-matrix-emerald bg-matrix-emerald/10 border border-matrix-emerald/20' :
                    run.status === 'failed' ? 'text-laser-red bg-laser-red/10 border border-laser-red/20' :
                    'text-electric-cyan bg-electric-cyan/10 border border-electric-cyan/20 animate-pulse'
                  }`}>
                    {run.status === 'running' && <span className="w-1 h-1 bg-electric-cyan animate-ping" />}
                    {run.status}
                  </span>
                </div>
                
                <h4 className="text-white/80 font-sans text-xs line-clamp-2 leading-relaxed mb-2 tracking-tight">
                  {run.intent}
                </h4>

                <div className="flex items-center justify-between text-[9px] text-white/35 font-mono">
                  <span>{run.duration}</span>
                  <span>{run.timestamp.substring(11, 19)}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT PANEL: Cinematic PGL Proof Spine & Attestation Ring */}
      <div className="flex-grow h-full flex flex-col md:flex-row p-6 overflow-y-auto max-h-full font-mono gap-6 justify-center items-center">
        
        {/* Detail Pipeline timelines */}
        <div className="w-full max-w-lg space-y-4">
          <div className="mb-2">
            <div className="group/id flex items-center gap-2.5 mb-1.5 min-h-[18px]">
              <span className={`text-[10px] tracking-widest uppercase font-bold transition-all duration-300 ${
                copiedId ? 'text-matrix-emerald font-extrabold animate-pulse' : 'text-electric-cyan'
              }`}>
                {selectedRun.id} <span className="text-white/40 font-normal">• PGL CONVENIENCE TRAIL</span>
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedRun.id);
                  setCopiedId(true);
                  setTimeout(() => setCopiedId(false), 1500);
                }}
                className="opacity-0 group-hover/id:opacity-100 transition-opacity duration-200 bg-white/5 hover:bg-white/10 border border-white/10 px-1.5 py-0.5 text-[8px] tracking-widest text-white/80 uppercase font-mono cursor-pointer flex items-center gap-1 select-none"
                title="Copy Run ID"
              >
                <Copy className="w-2.5 h-2.5" />
                Copy ID
              </button>
            </div>
            <h2 className="text-white text-base font-bold font-sans tracking-tight mb-2 leading-snug">
              {selectedRun.intent}
            </h2>
            <div className="flex gap-4 text-[10px] text-white/50 border-b border-white/10 pb-3.5">
              <span>Duration: <strong className="text-white">{selectedRun.duration}</strong></span>
              <span>Evidence hashes: <strong className="text-matrix-emerald">{selectedRun.evidenceCount} Sealed</strong></span>
              <span>Consensus Slot: <strong className="text-white">#{selectedRun.hash.substring(3, 10)}</strong></span>
            </div>
          </div>

          {/* Spine Steps */}
          <div className="relative pl-7 space-y-5">
            {/* Timeline backbone trail wire */}
            <div className="absolute left-2.5 top-2.5 bottom-2.5 w-[2px] bg-white/[0.05]" />
            {/* Glowing active wire overlays */}
            <div 
              className="absolute left-2.5 top-2.5 bg-gradient-to-b from-electric-cyan to-matrix-emerald w-[2px] transition-all duration-500" 
              style={{
                height: `${
                  selectedRun.currentStep === 'Intent' ? '0%' :
                  selectedRun.currentStep === 'Plan' ? '25%' :
                  selectedRun.currentStep === 'ArbiterOS' ? '50%' :
                  selectedRun.currentStep === 'Redis Lua' ? '75%' : '100%'
                }`
              }}
            />

            {stepsDetails.map((step, idx) => {
              const runStepObj = selectedRun.steps.find(s => s.name === step.name) || selectedRun.steps[idx];
              const isStepCompleted = runStepObj.status === 'completed';
              const isStepActive = runStepObj.status === 'active';
              const isStepFailed = runStepObj.status === 'failed';
              const StepIcon = step.icon;

              return (
                <motion.div
                  key={step.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`relative p-3.5 rounded-none border ${
                    isStepActive ? 'bg-black/60 border-electric-cyan/40 shadow-[0_0_15px_rgba(0,229,255,0.04)]' :
                    isStepFailed ? 'bg-laser-red/[0.03] border-laser-red/40' :
                    isStepCompleted ? 'bg-[#0A0A0C] border-white/5' : 'bg-transparent border-white/[0.02] opacity-40'
                  }`}
                >
                  {/* Spine core pin circle */}
                  <div
                    className={`absolute -left-[24px] top-4.5 w-3 h-3 rounded-none border-2 transition-all duration-300 flex items-center justify-center ${
                      isStepFailed ? 'bg-laser-red border-laser-red shadow-[0_0_8px_#ff003c]' :
                      isStepCompleted ? 'bg-matrix-emerald border-matrix-emerald shadow-[0_0_8px_#00ff66]' :
                      isStepActive ? 'bg-electric-cyan border-electric-cyan shadow-[0_0_8px_#00e5ff] scale-110' :
                      'bg-black border-white/20'
                    }`}
                  >
                    {isStepCompleted && <div className="w-1 h-1 bg-black" />}
                  </div>

                  <div className="flex items-center justify-between text-[10px] mb-1 font-mono tracking-wider">
                    <span className="text-white/40 uppercase">{step.label}</span>
                    <span className={`font-bold uppercase ${
                      isStepFailed ? 'text-laser-red-glow text-laser-red' :
                      isStepCompleted ? 'text-matrix-emerald' :
                      isStepActive ? 'text-electric-cyan animate-pulse' : 'text-white/20'
                    }`}>
                      {runStepObj.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-1.5">
                    <StepIcon className={`w-3.5 h-3.5 ${
                      isStepFailed ? 'text-laser-red' :
                      isStepCompleted ? 'text-matrix-emerald' :
                      isStepActive ? 'text-electric-cyan' : 'text-white/30'
                    }`} />
                    <h5 className="text-white font-sans text-xs font-bold tracking-tight">{step.name}</h5>
                  </div>

                  <p className="text-[11px] text-white/60 leading-normal font-sans">
                    {runStepObj.details}
                  </p>

                  {runStepObj.hash && (
                    <div className="mt-2 text-[9px] text-[#ffffff33] font-mono select-all truncate break-all selection:bg-electric-cyan/20 selector-all">
                      Hash Seal: {runStepObj.hash}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Cinematic SVG 3-layer Lock Attestation Ring */}
        <AttestationRing
          isCompleted={isCompleted}
          isFailed={isFailed}
          isRunning={isRunning}
        />

      </div>

    </div>
  );
}
