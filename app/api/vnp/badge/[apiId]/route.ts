import { NextRequest, NextResponse } from "next/server";
import type { BenchmarkApiEntry } from "@/lib/vnp/types";
import { computeVNPScore } from "@/lib/vnp/scoring";
import { gradeForScore } from "@/lib/vnp/constants";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

function renderBadgeSvg(
  apiName: string,
  grade: string,
  composite: number,
  color: string,
  bgColor: string,
  borderColor: string
): string {
  const labelWidth = 80;
  const valueWidth = 110;
  const totalWidth = labelWidth + valueWidth;
  const height = 28;
  const displayText = `${grade} ${composite.toFixed(1)}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}" viewBox="0 0 ${totalWidth} ${height}">
  <title>VNP Score: ${displayText} — ${apiName}</title>
  <rect width="${labelWidth}" height="${height}" rx="4" fill="#1A1A1A"/>
  <rect x="${labelWidth}" width="${valueWidth}" height="${height}" rx="4" fill="${bgColor}" stroke="${borderColor}" stroke-width="0.5"/>
  <rect x="${labelWidth - 4}" width="8" height="${height}" fill="${bgColor}"/>
  <text x="${labelWidth / 2}" y="${height / 2 + 4}" fill="#A1A1A6" text-anchor="middle" font-size="10" font-family="ui-monospace,SFMono-Regular,monospace" font-weight="600">VNP Score</text>
  <text x="${labelWidth + valueWidth / 2}" y="${height / 2 + 4}" fill="${color}" text-anchor="middle" font-size="11" font-family="ui-monospace,SFMono-Regular,monospace" font-weight="700">${displayText}</text>
</svg>`;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { apiId: string } }
) {
  const { apiId } = params;

  try {
    const res = await fetch(`${API_BASE}/api/v1/benchmarks/leaderboard`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return new NextResponse(
        renderBadgeSvg("unknown", "—", 0, "#6E6E73", "rgba(110,110,115,0.1)", "rgba(110,110,115,0.2)"),
        {
          status: 200,
          headers: {
            "Content-Type": "image/svg+xml",
            "Cache-Control": "public, max-age=60, s-maxage=300",
          },
        }
      );
    }

    const apis: BenchmarkApiEntry[] = await res.json();
    const apiEntry = apis.find((a) => a.id === apiId);

    if (!apiEntry) {
      return new NextResponse(
        renderBadgeSvg("not found", "N/A", 0, "#FF5C6C", "rgba(255,92,108,0.1)", "rgba(255,92,108,0.2)"),
        {
          status: 200,
          headers: {
            "Content-Type": "image/svg+xml",
            "Cache-Control": "public, max-age=60, s-maxage=60",
          },
        }
      );
    }

    const score = computeVNPScore(apiEntry);
    const band = gradeForScore(score.composite);

    return new NextResponse(
      renderBadgeSvg(
        score.apiName,
        score.grade,
        score.composite,
        band.color,
        band.bgColor,
        band.borderColor
      ),
      {
        status: 200,
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "public, max-age=300, s-maxage=600",
        },
      }
    );
  } catch (err) {
    return new NextResponse(
      renderBadgeSvg("error", "ERR", 0, "#FF5C6C", "rgba(255,92,108,0.1)", "rgba(255,92,108,0.2)"),
      {
        status: 200,
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "no-cache",
        },
      }
    );
  }
}
