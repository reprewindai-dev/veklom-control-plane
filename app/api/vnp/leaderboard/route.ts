import { NextResponse } from "next/server";
import type { BenchmarkApiEntry } from "@/lib/vnp/types";
import { computeLeaderboard } from "@/lib/vnp/scoring";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export async function GET() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/benchmarks/leaderboard`, {
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Upstream leaderboard unavailable", status: res.status },
        { status: 502 }
      );
    }

    const apis: BenchmarkApiEntry[] = await res.json();
    const leaderboard = computeLeaderboard(apis);

    return NextResponse.json({
      protocol: "VNP",
      version: "0.1.0",
      generatedAt: new Date().toISOString(),
      count: leaderboard.length,
      scores: leaderboard.map((s) => ({
        apiId: s.apiId,
        apiName: s.apiName,
        provider: s.provider,
        category: s.category,
        composite: s.composite,
        grade: s.grade,
        status: s.status,
        confidence: s.confidence,
        dimensions: s.dimensions.map((d) => ({
          id: d.id,
          label: d.label,
          normalized: d.normalized,
          weight: d.weight,
          weighted: d.weighted,
        })),
        lastMeasured: s.lastMeasured,
        measurementCount: s.measurementCount,
      })),
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to compute VNP leaderboard" },
      { status: 500 }
    );
  }
}
