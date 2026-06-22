"use client";

import type { VNPDimensionScore } from "@/lib/vnp/types";
import { VNP_DIMENSIONS, gradeForScore } from "@/lib/vnp/constants";

interface DimensionBreakdownProps {
  dimensions: VNPDimensionScore[];
}

export default function DimensionBreakdown({ dimensions }: DimensionBreakdownProps) {
  return (
    <div className="space-y-2">
      {VNP_DIMENSIONS.map((def) => {
        const dim = dimensions.find((d) => d.id === def.id);
        if (!dim) return null;
        const band = gradeForScore(dim.normalized);

        return (
          <div
            key={def.id}
            className="flex items-center gap-3 p-3 rounded-lg border border-[#242424] bg-[#0A0A0A]/50 hover:border-[#333333] transition-colors"
          >
            {/* Label */}
            <div className="w-44 shrink-0">
              <div className="text-[11px] font-medium text-[#E6E6E9]">{def.label}</div>
              <div className="text-[9px] text-[#6E6E73] mt-0.5">
                Weight: {(def.weight * 100).toFixed(0)}% &middot; {def.unit}
              </div>
            </div>

            {/* Bar */}
            <div className="flex-1">
              <div className="h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${dim.normalized}%`,
                    background: `linear-gradient(90deg, ${band.color}88, ${band.color})`,
                  }}
                />
              </div>
            </div>

            {/* Normalized score */}
            <span
              className="text-sm font-mono tabular-nums w-12 text-right"
              style={{ color: band.color }}
            >
              {dim.normalized.toFixed(1)}
            </span>

            {/* Raw value */}
            <span className="text-[10px] font-mono text-[#6E6E73] w-20 text-right">
              {formatRaw(dim.raw, def.unit)}
            </span>

            {/* Weighted contribution */}
            <span className="text-[10px] font-mono text-[#A1A1A6] w-10 text-right">
              +{dim.weighted.toFixed(1)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function formatRaw(value: number, unit: string): string {
  switch (unit) {
    case "ms":
      return `${value.toFixed(0)}ms`;
    case "%":
      return `${value.toFixed(2)}%`;
    case "req/s":
      return `${value.toFixed(0)} rps`;
    case "score":
      return `${value.toFixed(0)}/100`;
    default:
      return String(value);
  }
}
