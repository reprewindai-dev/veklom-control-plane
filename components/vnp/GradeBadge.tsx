"use client";

import type { VNPGrade } from "@/lib/vnp/types";
import { gradeForScore } from "@/lib/vnp/constants";

interface GradeBadgeProps {
  grade: VNPGrade;
  composite: number;
  size?: "sm" | "md" | "lg";
}

export default function GradeBadge({ grade, composite, size = "md" }: GradeBadgeProps) {
  const band = gradeForScore(composite);

  const sizes = {
    sm: { badge: "text-xs px-1.5 py-0.5", score: "text-lg" },
    md: { badge: "text-sm px-2 py-0.5", score: "text-3xl" },
    lg: { badge: "text-lg px-3 py-1", score: "text-5xl" },
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <span
        className={`font-mono font-bold tracking-widest rounded ${sizes[size].badge}`}
        style={{
          color: band.color,
          backgroundColor: band.bgColor,
          border: `1px solid ${band.borderColor}`,
        }}
      >
        {grade}
      </span>
      <span
        className={`font-light tabular-nums ${sizes[size].score}`}
        style={{ color: band.color }}
      >
        {composite.toFixed(1)}
      </span>
    </div>
  );
}
