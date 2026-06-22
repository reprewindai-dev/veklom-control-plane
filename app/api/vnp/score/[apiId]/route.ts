import { NextRequest, NextResponse } from "next/server";
import type { BenchmarkApiEntry } from "@/lib/vnp/types";
import { computeVNPScore } from "@/lib/vnp/scoring";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export async function GET(
  _request: NextRequest,
  { params }: { params: { apiId: string } }
) {
  const { apiId } = params;

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
    const apiEntry = apis.find((a) => a.id === apiId);

    if (!apiEntry) {
      return NextResponse.json(
        { error: "API not found", apiId },
        { status: 404 }
      );
    }

    const score = computeVNPScore(apiEntry);

    return NextResponse.json({
      protocol: "VNP",
      version: "0.1.0",
      generatedAt: new Date().toISOString(),
      score: {
        apiId: score.apiId,
        apiName: score.apiName,
        provider: score.provider,
        category: score.category,
        composite: score.composite,
        grade: score.grade,
        status: score.status,
        confidence: score.confidence,
        dimensions: score.dimensions,
        regions: score.regions,
        provenance: {
          epochId: score.provenance.epochId,
          merkleRoot: score.provenance.merkleRoot,
          chainAnchorTx: score.provenance.chainAnchorTx,
          chainAnchorBlock: score.provenance.chainAnchorBlock,
          harnessVersion: score.provenance.harnessVersion,
          scriptHash: score.provenance.scriptHash,
          nodeOperators: score.provenance.nodeOperators,
          measurementCount: score.provenance.measurementCount,
        },
        lastMeasured: score.lastMeasured,
        measurementCount: score.measurementCount,
      },
      _links: {
        badge: `/api/vnp/badge/${apiId}`,
        leaderboard: `/api/vnp/leaderboard`,
        detail: `/benchmarks/${apiId}`,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to compute VNP score" },
      { status: 500 }
    );
  }
}
