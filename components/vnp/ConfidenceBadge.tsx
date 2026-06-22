"use client";

import type { VNPConfidence } from "@/lib/vnp/types";

const LEVEL_STYLES = {
  high: { label: "HIGH", color: "#3EE7A2", bg: "rgba(62,231,162,0.1)", border: "rgba(62,231,162,0.25)" },
  medium: { label: "MEDIUM", color: "#FFB800", bg: "rgba(255,184,0,0.1)", border: "rgba(255,184,0,0.25)" },
  low: { label: "LOW", color: "#FF9F43", bg: "rgba(255,159,67,0.1)", border: "rgba(255,159,67,0.25)" },
  provisional: { label: "PROVISIONAL", color: "#FF5C6C", bg: "rgba(255,92,108,0.1)", border: "rgba(255,92,108,0.25)" },
} as const;

interface ConfidenceBadgeProps {
  confidence: VNPConfidence;
  showDetail?: boolean;
}

export default function ConfidenceBadge({ confidence, showDetail = false }: ConfidenceBadgeProps) {
  const style = LEVEL_STYLES[confidence.level];

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <span
        className="inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest font-mono"
        style={{
          color: style.color,
          backgroundColor: style.bg,
          borderColor: style.border,
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: style.color }}
        />
        {style.label}
      </span>
      {showDetail && (
        <span className="text-[10px] text-[#6E6E73] font-mono">
          {confidence.sampleCount.toLocaleString()} samples &middot; &plusmn;{confidence.marginOfError}
        </span>
      )}
    </div>
  );
}
