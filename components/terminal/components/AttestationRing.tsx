import React from 'react';
import { motion } from 'motion/react';
import { Activity, AlertTriangle, Lock } from 'lucide-react';

interface AttestationRingProps {
  isCompleted: boolean;
  isFailed: boolean;
  isRunning: boolean;
}

export default function AttestationRing({
  isCompleted,
  isFailed,
  isRunning,
}: AttestationRingProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 border border-white/10 bg-[#0A0A0C] rounded-none max-w-sm w-full relative">
      <div className="absolute top-4 left-4 font-mono text-[9px] text-white/30 tracking-widest uppercase">
        ATTESTATION CORE COUPLER
      </div>

      <div className="relative w-64 h-64 flex items-center justify-center my-6">
        {/* Layer 1 Ring: SEKED Enclave Integrity checking (Outer ring) */}
        <motion.svg
          className="absolute inset-0 w-full h-full"
          style={{ originX: '128px', originY: '128px' }}
          animate={
            isCompleted
              ? {
                  rotate: 270, // -90 offset + 360 rotation to snap!
                  scale: 1,
                }
              : isRunning
              ? {
                  rotate: [0, 360],
                  scale: 1,
                }
              : {
                  rotate: -90,
                  scale: 1,
                }
          }
          transition={
            isCompleted
              ? {
                  rotate: { type: 'spring', stiffness: 225, damping: 13 },
                }
              : isRunning
              ? {
                  rotate: { repeat: Infinity, duration: 10, ease: 'linear' },
                }
              : {
                  duration: 0.3,
                }
          }
        >
          <motion.circle
            cx="128"
            cy="128"
            animate={
              isCompleted
                ? {
                    r: 102,
                    strokeWidth: 3.5,
                    strokeDashoffset: 0,
                    strokeOpacity: 0.95,
                    stroke: '#00FF66',
                  }
                : {
                    r: 110,
                    strokeWidth: 2,
                    strokeDashoffset: isFailed ? 350 : 200,
                    strokeOpacity: 0.5,
                    stroke: isFailed ? '#FF003C' : isRunning ? '#00E5FF' : '#222',
                  }
            }
            transition={{
              type: 'spring',
              stiffness: 225,
              damping: 13,
            }}
            className="fill-none transition-colors duration-550"
            strokeDasharray="690"
          />
        </motion.svg>

        {/* Layer 2 Ring: ArbiterOS Governance verification (Middle ring) */}
        <motion.svg
          className="absolute inset-0 w-full h-full"
          style={{ originX: '128px', originY: '128px' }}
          animate={
            isCompleted
              ? {
                  rotate: 405, // 45 offset + 360 rot
                  scale: 1,
                }
              : isRunning
              ? {
                  rotate: [360, 0],
                  scale: 1,
                }
              : {
                  rotate: 45,
                  scale: 1,
                }
          }
          transition={
            isCompleted
              ? {
                  rotate: { type: 'spring', stiffness: 225, damping: 13 },
                }
              : isRunning
              ? {
                  rotate: { repeat: Infinity, duration: 7, ease: 'linear' },
                }
              : {
                  duration: 0.3,
                }
          }
        >
          <motion.circle
            cx="128"
            cy="128"
            animate={
              isCompleted
                ? {
                    r: 90,
                    strokeWidth: 3.5,
                    strokeDashoffset: 0,
                    strokeOpacity: 0.85,
                    stroke: '#00FF66',
                  }
                : {
                    r: 90,
                    strokeWidth: 2,
                    strokeDashoffset: 150,
                    strokeOpacity: 0.5,
                    stroke: isFailed ? '#FF003C' : isRunning ? '#FFAB00' : '#222',
                  }
            }
            transition={{
              type: 'spring',
              stiffness: 225,
              damping: 13,
            }}
            className="fill-none transition-colors duration-550"
            strokeDasharray="565"
          />
        </motion.svg>

        {/* Layer 3 Ring: ConvergeOS Consensus matching (Inner ring) */}
        <motion.svg
          className="absolute inset-0 w-full h-full"
          style={{ originX: '128px', originY: '128px' }}
          animate={
            isCompleted
              ? {
                  rotate: 360, // 0 offset + 360 rot
                  scale: 1,
                }
              : isRunning
              ? {
                  rotate: [0, 360],
                  scale: 1,
                }
              : {
                  rotate: 0,
                  scale: 1,
                }
          }
          transition={
            isCompleted
              ? {
                  rotate: { type: 'spring', stiffness: 225, damping: 13 },
                }
              : isRunning
              ? {
                  rotate: { repeat: Infinity, duration: 4, ease: 'linear' },
                }
              : {
                  duration: 0.3,
                }
          }
        >
          <motion.circle
            cx="128"
            cy="128"
            animate={
              isCompleted
                ? {
                    r: 78,
                    strokeWidth: 3.5,
                    strokeDashoffset: 0,
                    strokeOpacity: 0.75,
                    stroke: '#00FF66',
                  }
                : {
                    r: 70,
                    strokeWidth: 2,
                    strokeDashoffset: 220,
                    strokeOpacity: 0.5,
                    stroke: isFailed ? '#FF003C' : isRunning ? '#00FF66' : '#222',
                  }
            }
            transition={{
              type: 'spring',
              stiffness: 225,
              damping: 13,
            }}
            className="fill-none transition-colors duration-550"
            strokeDasharray="440"
          />
        </motion.svg>

        {/* Core Lock State Lock Padlock SVG Centered */}
        <motion.div
          animate={
            isCompleted
              ? {
                  scale: [1, 1.25, 0.95, 1],
                  borderColor: 'rgba(0, 255, 102, 0.3)',
                  boxShadow: '0 0 25px rgba(0, 255, 102, 0.35)',
                }
              : isFailed
              ? {
                  scale: 1,
                  rotate: [0, 10, -10, 0],
                  borderColor: 'rgba(255, 0, 60, 0.3)',
                  boxShadow: '0 0 15px rgba(255, 0, 60, 0.1)',
                }
              : {
                  scale: 1,
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 0 0px rgba(0,0,0,0)',
                }
          }
          transition={
            isCompleted
              ? {
                  scale: { duration: 0.45, ease: 'easeOut' },
                  default: { duration: 0.3 },
                }
              : { duration: 0.3 }
          }
          className="absolute flex flex-col items-center justify-center p-4 rounded-none bg-black border"
        >
          {isCompleted ? (
            <Lock className="w-8 h-8 text-matrix-emerald animate-pulse" />
          ) : isFailed ? (
            <AlertTriangle className="w-8 h-8 text-laser-red" />
          ) : isRunning ? (
            <Activity
              className="w-8 h-8 text-electric-cyan animate-spin"
              style={{ animationDuration: '3s' }}
            />
          ) : (
            <Lock className="w-8 h-8 text-white/30" />
          )}
        </motion.div>
      </div>

      {/* Validation Checklist UI representation */}
      <div className="w-full space-y-2 border-t border-white/10 pt-4.5 font-mono text-[11px]">
        <div className="flex items-center justify-between text-white/60 font-medium">
          <span className="flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 ${
                isCompleted
                  ? 'bg-matrix-emerald'
                  : isFailed
                  ? 'bg-laser-red'
                  : 'bg-electric-cyan animate-pulse'
              }`}
            />
            1. SEKED ENCLAVEMENT Check
          </span>
          <strong
            className={
              isCompleted
                ? 'text-matrix-emerald'
                : isFailed
                ? 'text-laser-red'
                : 'text-electric-cyan'
            }
          >
            {isCompleted ? 'PASSED' : isFailed ? 'REVOKED' : 'EVALUATING'}
          </strong>
        </div>

        <div className="flex items-center justify-between text-white/60 font-medium">
          <span className="flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 ${
                isCompleted
                  ? 'bg-matrix-emerald'
                  : isFailed
                  ? 'bg-laser-red'
                  : 'bg-electric-cyan animate-pulse'
              }`}
            />
            2. ArbiterOS Policy Match
          </span>
          <strong
            className={
              isCompleted
                ? 'text-matrix-emerald'
                : isFailed
                ? 'text-laser-red'
                : 'text-electric-cyan'
            }
          >
            {isCompleted ? 'PASSED' : isFailed ? 'VIOLATED' : 'EVALUATING'}
          </strong>
        </div>

        <div className="flex items-center justify-between text-white/60 font-medium">
          <span className="flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 ${
                isCompleted
                  ? 'bg-matrix-emerald'
                  : isFailed
                  ? 'bg-laser-red'
                  : 'bg-electric-cyan animate-pulse'
              }`}
            />
            3. ConvergeOS State Seal
          </span>
          <strong
            className={
              isCompleted
                ? 'text-matrix-emerald'
                : isFailed
                ? 'text-laser-red'
                : 'text-electric-cyan'
            }
          >
            {isCompleted ? 'SEALED' : isFailed ? 'ABORTED' : 'SEALING'}
          </strong>
        </div>
      </div>

      <div className="mt-4 p-2 bg-white/[0.01] border border-white/5 rounded-none w-full text-center text-[10px] text-white/40 uppercase font-black">
        {isCompleted && (
          <span className="text-matrix-emerald text-glow-emerald font-bold">
            ● COUPLER SECURELY LOCKED
          </span>
        )}
        {isFailed && (
          <span className="text-laser-red text-glow-red font-bold">
            ● COUPLER STATE ABORTED
          </span>
        )}
        {isRunning && (
          <span className="text-electric-cyan font-bold tracking-widest animate-pulse">
            ● SECURING ENCLAVE LOCKS...
          </span>
        )}
      </div>
    </div>
  );
}
