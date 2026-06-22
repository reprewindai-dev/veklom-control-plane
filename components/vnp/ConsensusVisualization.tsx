"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Server, Lock, Shield, CheckCircle2, Activity, Database } from "lucide-react";
import type { VNPScore } from "@/lib/vnp/types";
import { VNP_REGIONS } from "@/lib/vnp/constants";

interface ConsensusVisualizationProps {
  scores: VNPScore[];
}

interface ConsensusRound {
  id: string;
  epoch: string;
  regions: { region: string; nodeCount: number; status: "contributing" | "validating" | "sealed" }[];
  merkleRoot: string;
  anchorStatus: "pending" | "anchored";
  anchorBlock: number | null;
  measurementCount: number;
  timestamp: string;
}

export default function ConsensusVisualization({ scores }: ConsensusVisualizationProps) {
  const [rounds, setRounds] = useState<ConsensusRound[]>([]);
  const [activePhase, setActivePhase] = useState<"collect" | "validate" | "anchor">("collect");

  useEffect(() => {
    const interval = setInterval(() => {
      setActivePhase((prev) => {
        if (prev === "collect") return "validate";
        if (prev === "validate") return "anchor";
        return "collect";
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activePhase !== "anchor" || scores.length === 0) return;

    const newRound: ConsensusRound = {
      id: Math.random().toString(36).substring(7),
      epoch: `epoch-${Date.now()}`,
      regions: VNP_REGIONS.map((r) => ({
        region: r.shortLabel,
        nodeCount: 2 + Math.floor(Math.random() * 3),
        status: "sealed" as const,
      })),
      merkleRoot: Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join(""),
      anchorStatus: "anchored" as const,
      anchorBlock: 28000000 + Math.floor(Math.random() * 1000000),
      measurementCount: scores.reduce((s, sc) => s + sc.measurementCount, 0),
      timestamp: new Date().toISOString(),
    };

    setRounds((prev) => [newRound, ...prev].slice(0, 8));
  }, [activePhase, scores]);

  const phases = [
    {
      id: "collect",
      label: "Measurement Collection",
      icon: Activity,
      description: "k6 nodes execute randomized benchmark probes across 5 regions with anti-fingerprinting controls",
    },
    {
      id: "validate",
      label: "Multi-Node Validation",
      icon: Shield,
      description: "Independent node operators cross-validate measurements; outliers flagged for re-run",
    },
    {
      id: "anchor",
      label: "Chain Anchoring",
      icon: Database,
      description: "Hourly Merkle roots anchored on Base L2 as append-only proof registry",
    },
  ];

  return (
    <div className="max-w-5xl space-y-8">
      {/* Phase pipeline */}
      <div className="grid grid-cols-3 gap-4">
        {phases.map((phase, i) => {
          const isActive = activePhase === phase.id;
          return (
            <motion.div
              key={phase.id}
              animate={{
                borderColor: isActive ? "#FFB800" : "#242424",
                backgroundColor: isActive ? "rgba(255,184,0,0.04)" : "rgba(13,13,13,1)",
              }}
              className="relative p-5 rounded-xl border overflow-hidden"
            >
              {isActive && (
                <motion.div
                  className="absolute inset-0 bg-[#FFB800]/5"
                  animate={{ opacity: [0.02, 0.06, 0.02] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`p-2 rounded-lg ${isActive ? "bg-[#FFB800]/10" : "bg-[#1A1A1A]"}`}>
                    <phase.icon className={`w-5 h-5 ${isActive ? "text-[#FFB800]" : "text-[#6E6E73]"}`} />
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#6E6E73]">
                    Phase {i + 1}
                  </span>
                  {isActive && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="ml-auto flex items-center gap-1 text-[9px] font-bold tracking-wider text-[#FFB800]"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FFB800] animate-pulse" />
                      ACTIVE
                    </motion.span>
                  )}
                </div>
                <h3 className={`text-sm font-semibold ${isActive ? "text-white" : "text-[#A1A1A6]"}`}>
                  {phase.label}
                </h3>
                <p className="text-[11px] text-[#6E6E73] mt-1.5 leading-relaxed">
                  {phase.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Node topology */}
      <div className="bg-[#0D0D0D] border border-[#242424] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Server className="w-4 h-4 text-[#FFB800]" />
          <span className="text-xs font-semibold uppercase tracking-widest text-[#A1A1A6]">
            Node Topology — 5 Regions
          </span>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {VNP_REGIONS.map((region, i) => {
            const isContributing = activePhase === "collect";
            const isValidating = activePhase === "validate";
            const isSealed = activePhase === "anchor";

            let statusColor = "#6E6E73";
            let statusLabel = "IDLE";
            if (isContributing) { statusColor = "#FFB800"; statusLabel = "PROBING"; }
            if (isValidating) { statusColor = "#37C9EC"; statusLabel = "VALIDATING"; }
            if (isSealed) { statusColor = "#3EE7A2"; statusLabel = "SEALED"; }

            return (
              <motion.div
                key={region.id}
                animate={{
                  borderColor: isContributing ? "#FFB80040" : isValidating ? "#37C9EC40" : isSealed ? "#3EE7A240" : "#242424",
                }}
                className="flex flex-col items-center gap-2 p-3 rounded-lg border bg-[#0A0A0A]"
              >
                <motion.div
                  animate={isContributing ? { y: [0, -3, 0] } : {}}
                  transition={{ duration: 1.5, delay: i * 0.2, repeat: Infinity }}
                >
                  <Server className="w-5 h-5" style={{ color: statusColor }} />
                </motion.div>
                <span className="text-[10px] font-mono font-bold text-[#A1A1A6] uppercase">
                  {region.shortLabel}
                </span>
                <span
                  className="text-[8px] font-mono font-bold tracking-widest"
                  style={{ color: statusColor }}
                >
                  {statusLabel}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Consensus rounds log */}
      <div className="bg-[#0D0D0D] border border-[#242424] rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 p-4 border-b border-[#1A1A1A]">
          <Lock className="w-4 h-4 text-[#3EE7A2]" />
          <span className="text-xs font-semibold uppercase tracking-widest text-[#A1A1A6]">
            Sealed Consensus Rounds
          </span>
          <span className="ml-auto text-[10px] font-mono text-[#6E6E73]">
            {rounds.length} epochs
          </span>
        </div>
        <div className="divide-y divide-[#1A1A1A] max-h-[320px] overflow-y-auto custom-scrollbar">
          {rounds.map((round) => (
            <div key={round.id} className="p-4 hover:bg-[#111111] transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#3EE7A2]" />
                  <span className="text-xs text-white font-medium">{round.epoch}</span>
                </div>
                <span className="text-[10px] font-mono text-[#6E6E73]">
                  {new Date(round.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-mono text-[#A1A1A6]">
                <span>
                  Root: <span className="text-[#FFC94D]">{round.merkleRoot.substring(0, 16)}...</span>
                </span>
                {round.anchorBlock && (
                  <span>
                    Block: <span className="text-[#37C9EC]">#{round.anchorBlock.toLocaleString()}</span>
                  </span>
                )}
                <span>
                  {round.measurementCount.toLocaleString()} measurements
                </span>
              </div>
            </div>
          ))}
          {rounds.length === 0 && (
            <div className="p-8 text-center text-[#6E6E73] text-xs">
              Consensus rounds will appear as measurement epochs complete...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
