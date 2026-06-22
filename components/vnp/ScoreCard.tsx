"use client";

import { Server, ExternalLink } from "lucide-react";
import type { VNPScore } from "@/lib/vnp/types";
import { gradeForScore } from "@/lib/vnp/constants";
import DimensionRadar from "./DimensionRadar";
import GradeBadge from "./GradeBadge";
import ConfidenceBadge from "./ConfidenceBadge";
import RegionalBreakdown from "./RegionalBreakdown";
import ProvenanceChain from "./ProvenanceChain";
import Link from "next/link";

interface ScoreCardProps {
  score: VNPScore;
}

export default function ScoreCard({ score }: ScoreCardProps) {
  const band = gradeForScore(score.composite);

  return (
    <div
      className="bg-[#0D0D0D] border border-[#242424] rounded-xl p-5 hover:border-opacity-60 transition-all group relative overflow-hidden"
      style={{ borderColor: `${band.borderColor}` }}
    >
      {/* Background accent */}
      <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity pointer-events-none">
        <Server className="w-28 h-28" style={{ color: band.color }} />
      </div>

      {/* Header: Name + Grade */}
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="min-w-0 flex-1">
          <Link
            href={`/benchmarks/${score.apiId}`}
            className="text-lg font-semibold text-white hover:text-[#FFC94D] transition-colors truncate block"
          >
            {score.apiName}
          </Link>
          <div className="text-[10px] font-mono text-[#6E6E73] uppercase tracking-widest mt-0.5">
            {score.provider} &middot; {score.category}
          </div>
        </div>
        <GradeBadge grade={score.grade} composite={score.composite} size="md" />
      </div>

      {/* Radar chart */}
      <div className="w-full relative z-10 mb-3">
        <DimensionRadar
          dimensions={score.dimensions}
          height={180}
          accentColor={band.color}
        />
      </div>

      {/* Dimension grid — top 4 dimensions */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4 relative z-10">
        {score.dimensions.slice(0, 4).map((dim) => (
          <div key={dim.id}>
            <div className="text-[9px] font-mono text-[#6E6E73] uppercase tracking-wider">
              {dim.label}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-mono tabular-nums text-[#E6E6E9]">
                {dim.normalized.toFixed(1)}
              </span>
              <span className="text-[9px] text-[#6E6E73]">/ 100</span>
            </div>
          </div>
        ))}
      </div>

      {/* Regional mini-bars */}
      <div className="mb-4 relative z-10">
        <RegionalBreakdown regions={score.regions} compact />
      </div>

      {/* Footer: confidence + provenance + link */}
      <div className="pt-3 border-t border-[#242424] flex items-center justify-between relative z-10">
        <ConfidenceBadge confidence={score.confidence} />
        <ProvenanceChain provenance={score.provenance} compact />
      </div>

      {/* Detail link */}
      <Link
        href={`/benchmarks/${score.apiId}`}
        className="mt-3 flex items-center gap-1.5 text-[10px] font-mono text-[#FFB800]/60 hover:text-[#FFB800] uppercase tracking-widest transition-colors relative z-10"
      >
        Full Report <ExternalLink className="w-3 h-3" />
      </Link>
    </div>
  );
}
