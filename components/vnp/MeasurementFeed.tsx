"use client";

import { useState, useEffect } from "react";
import { Terminal, Fingerprint, Shield, Database } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { VNPScore } from "@/lib/vnp/types";
import { VNP_REGIONS } from "@/lib/vnp/constants";

interface FeedEntry {
  id: string;
  hash: string;
  region: string;
  apiName: string;
  type: "MEASUREMENT" | "ANCHOR" | "SCORE_UPDATE" | "DISPUTE";
  message: string;
  timestamp: string;
}

interface MeasurementFeedProps {
  scores: VNPScore[];
}

function generateHash(): string {
  return Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");
}

export default function MeasurementFeed({ scores }: MeasurementFeedProps) {
  const [entries, setEntries] = useState<FeedEntry[]>([]);

  useEffect(() => {
    if (!scores || scores.length === 0) return;

    const interval = setInterval(() => {
      const target = scores[Math.floor(Math.random() * scores.length)];
      const region = VNP_REGIONS[Math.floor(Math.random() * VNP_REGIONS.length)];
      const rand = Math.random();

      let type: FeedEntry["type"];
      let message: string;

      if (rand < 0.6) {
        type = "MEASUREMENT";
        const latency = (50 + Math.random() * 200).toFixed(1);
        message = `[${region.shortLabel}] ${target.apiName} — p99: ${latency}ms, uptime: ${(99 + Math.random()).toFixed(2)}%`;
      } else if (rand < 0.8) {
        type = "SCORE_UPDATE";
        message = `[VNP] ${target.apiName} composite updated: ${target.composite.toFixed(1)} (${target.grade})`;
      } else if (rand < 0.95) {
        type = "ANCHOR";
        const block = 28000000 + Math.floor(Math.random() * 1000000);
        message = `[Base L2] Merkle root anchored at block #${block.toLocaleString()}`;
      } else {
        type = "DISPUTE";
        message = `[Tier 1] Automated re-run triggered for ${target.apiName} (variance check)`;
      }

      const entry: FeedEntry = {
        id: Math.random().toString(36).substring(7),
        hash: generateHash().substring(0, 16) + "...",
        region: region.shortLabel,
        apiName: target.apiName,
        type,
        message,
        timestamp: new Date().toISOString(),
      };

      setEntries((prev) => [entry, ...prev].slice(0, 40));
    }, 2000);

    return () => clearInterval(interval);
  }, [scores]);

  const typeStyles: Record<FeedEntry["type"], { bg: string; text: string; border: string }> = {
    MEASUREMENT: { bg: "bg-[#FFB800]/10", text: "text-[#FFB800]", border: "border-[#FFB800]/20" },
    ANCHOR: { bg: "bg-[#37C9EC]/10", text: "text-[#37C9EC]", border: "border-[#37C9EC]/20" },
    SCORE_UPDATE: { bg: "bg-[#3EE7A2]/10", text: "text-[#3EE7A2]", border: "border-[#3EE7A2]/20" },
    DISPUTE: { bg: "bg-[#FF5C6C]/10", text: "text-[#FF5C6C]", border: "border-[#FF5C6C]/20" },
  };

  return (
    <div className="h-full flex flex-col font-mono text-xs">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-[#1A1A1A] bg-[#050505]">
        <Terminal className="w-4 h-4 text-[#FFB800]" />
        <span className="text-[#A1A1A6] font-semibold tracking-widest uppercase text-[10px]">
          VNP Measurement Feed
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#3EE7A2] animate-pulse" />
          <span className="text-[#3EE7A2] tracking-widest text-[10px]">LIVE</span>
        </div>
      </div>

      {/* Entries */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-[#0A0A0A] custom-scrollbar">
        <AnimatePresence>
          {entries.map((entry) => {
            const style = typeStyles[entry.type];
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="group"
              >
                <div className="text-[#6E6E73] opacity-60 mb-0.5 flex items-center gap-1">
                  <Fingerprint className="w-3 h-3" />
                  <span>{entry.hash}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[8px] uppercase tracking-widest border ${style.bg} ${style.text} ${style.border}`}
                  >
                    {entry.type.replace("_", " ")}
                  </span>
                  <span className="text-white/80 mt-0.5 leading-relaxed">{entry.message}</span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {entries.length === 0 && (
          <div className="text-[#6E6E73] text-center mt-10 flex flex-col items-center gap-2">
            <Shield className="w-6 h-6 opacity-30" />
            <span>Awaiting measurement data...</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-[#1A1A1A] bg-[#050505]">
        <div className="flex justify-between items-center text-[#6E6E73] text-[10px]">
          <span className="flex items-center gap-1.5">
            <Database className="w-3 h-3" />
            <span>Anchoring: Base L2 (eip155:8453)</span>
          </span>
          <span>SHA-256 &middot; k6-vnp-0.1.3</span>
        </div>
      </div>
    </div>
  );
}
