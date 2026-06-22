"use client";

import type { VNPRegionalScore } from "@/lib/vnp/types";
import { gradeForScore } from "@/lib/vnp/constants";

interface RegionalBreakdownProps {
  regions: VNPRegionalScore[];
  compact?: boolean;
}

export default function RegionalBreakdown({ regions, compact = false }: RegionalBreakdownProps) {
  if (compact) {
    return (
      <div className="flex gap-1.5">
        {regions.map((r) => {
          const band = gradeForScore(r.score);
          return (
            <div
              key={r.region}
              className="flex flex-col items-center gap-0.5 rounded-md px-2 py-1.5 border"
              style={{ borderColor: band.borderColor, backgroundColor: band.bgColor }}
            >
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#A1A1A6]">
                {r.region.replace("-", " ").split(" ").map(w => w[0]).join("").toUpperCase()}
              </span>
              <span className="text-xs font-mono tabular-nums" style={{ color: band.color }}>
                {r.score.toFixed(0)}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {regions.map((r) => {
        const band = gradeForScore(r.score);
        return (
          <div
            key={r.region}
            className="flex items-center gap-3 p-3 rounded-lg border"
            style={{ borderColor: "rgba(36,36,36,1)", backgroundColor: "rgba(10,10,10,0.5)" }}
          >
            {/* Region label */}
            <div className="w-24 shrink-0">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#A1A1A6]">
                {r.region}
              </div>
              <div className="text-[9px] text-[#6E6E73] mt-0.5">{r.label}</div>
            </div>

            {/* Score bar */}
            <div className="flex-1">
              <div className="h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${r.score}%`,
                    background: `linear-gradient(90deg, ${band.color}88, ${band.color})`,
                  }}
                />
              </div>
            </div>

            {/* Score value */}
            <span className="text-sm font-mono tabular-nums w-10 text-right" style={{ color: band.color }}>
              {r.score.toFixed(0)}
            </span>

            {/* Latency */}
            <div className="w-28 text-right">
              <div className="text-[10px] font-mono text-[#A1A1A6]">
                p99: {r.p99.toFixed(0)}ms
              </div>
              <div className="text-[9px] text-[#6E6E73]">
                p50: {r.p50.toFixed(0)}ms
              </div>
            </div>

            {/* Availability */}
            <div className="w-20 text-right">
              <div className="text-[10px] font-mono text-[#A1A1A6]">
                {r.availability.toFixed(2)}%
              </div>
              <div className="text-[9px] text-[#6E6E73]">
                {r.measurementCount} runs
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
