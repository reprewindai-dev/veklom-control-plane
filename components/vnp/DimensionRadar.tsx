"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import type { VNPDimensionScore } from "@/lib/vnp/types";
import { VNP_DIMENSIONS } from "@/lib/vnp/constants";

interface DimensionRadarProps {
  dimensions: VNPDimensionScore[];
  height?: number;
  showLabels?: boolean;
  accentColor?: string;
}

export default function DimensionRadar({
  dimensions,
  height = 220,
  showLabels = true,
  accentColor = "#FFB800",
}: DimensionRadarProps) {
  const data = VNP_DIMENSIONS.map((def) => {
    const dim = dimensions.find((d) => d.id === def.id);
    return {
      subject: def.shortLabel,
      score: dim?.normalized ?? 0,
      fullMark: 100,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart cx="50%" cy="50%" outerRadius="72%" data={data}>
        <PolarGrid stroke="#242424" strokeDasharray="2 4" />
        {showLabels && (
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: "#A1A1A6", fontSize: 10, fontFamily: "monospace" }}
          />
        )}
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={false}
          axisLine={false}
        />
        <Radar
          name="VNP Score"
          dataKey="score"
          stroke={accentColor}
          strokeWidth={1.5}
          fill={accentColor}
          fillOpacity={0.12}
          dot={false}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
