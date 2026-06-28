import { NextResponse } from 'next/server';

// GET /api/vnp/badge/[apiId].svg — returns a live SVG badge
// Cache: 5 minutes. Embed anywhere: GitHub READMEs, docs, websites.

const GOLD_MIN   = 85;
const SILVER_MIN = 75;
const BRONZE_MIN = 60;

function tierFor(score: number) {
  if (score >= GOLD_MIN)   return { label: 'GOLD',   color: '#FFB800', text: '#000000' };
  if (score >= SILVER_MIN) return { label: 'SILVER', color: '#A1A1A6', text: '#000000' };
  if (score >= BRONZE_MIN) return { label: 'BRONZE', color: '#CD7F32', text: '#000000' };
  return                          { label: 'VNP',    color: '#333333', text: '#FFFFFF' };
}

function buildSVG(apiName: string, score: number): string {
  const tier = tierFor(score);
  const scoreText = score.toFixed(1);
  const leftWidth = 68;
  const rightWidth = 110;
  const totalWidth = leftWidth + rightWidth;
  const height = 24;

  // Truncate name to fit
  const name = apiName.length > 16 ? apiName.slice(0, 14) + '…' : apiName;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}" role="img" aria-label="${name}: VNP ${tier.label} ${scoreText}">
  <title>${name}: VNP ${tier.label} — Score ${scoreText}</title>
  <defs>
    <linearGradient id="lgrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${tier.color};stop-opacity:1"/>
      <stop offset="100%" style="stop-color:${tier.color};stop-opacity:0.85"/>
    </linearGradient>
    <clipPath id="r"><rect width="${totalWidth}" height="${height}" rx="4"/></clipPath>
  </defs>

  <g clip-path="url(#r)">
    <!-- Left: tier badge -->
    <rect width="${leftWidth}" height="${height}" fill="url(#lgrad)"/>
    <!-- Right: score panel -->
    <rect x="${leftWidth}" width="${rightWidth}" height="${height}" fill="#0D0D0D"/>
    <!-- Separator -->
    <rect x="${leftWidth}" width="1" height="${height}" fill="#000" opacity="0.3"/>

    <!-- Left text: VNP + tier -->
    <text x="8" y="10" font-family="monospace,DejaVu Sans Mono,sans-serif" font-size="7" font-weight="bold" fill="${tier.text}" opacity="0.7" letter-spacing="0.5">VNP</text>
    <text x="8" y="19" font-family="monospace,DejaVu Sans Mono,sans-serif" font-size="8" font-weight="bold" fill="${tier.text}">${tier.label}</text>

    <!-- Right text: api name + score -->
    <text x="${leftWidth + 8}" y="10" font-family="system-ui,sans-serif" font-size="7" fill="#7A7A7A">${name}</text>
    <text x="${leftWidth + 8}" y="19" font-family="monospace,DejaVu Sans Mono,sans-serif" font-size="9" font-weight="bold" fill="${tier.color}">${scoreText}</text>

    <!-- Score arc indicator (right edge) -->
    <circle cx="${totalWidth - 12}" cy="12" r="8" fill="none" stroke="#1F1F1F" stroke-width="1.5"/>
    <circle cx="${totalWidth - 12}" cy="12" r="8" fill="none" stroke="${tier.color}" stroke-width="1.5"
      stroke-dasharray="${(score / 100) * 50.3} 50.3"
      transform="rotate(-90 ${totalWidth - 12} 12)"/>
  </g>
</svg>`;
}

export async function GET(
  _request: Request,
  context: any
) {
  const params = await context.params;
  const { apiId } = params;

  // Strip .svg extension if present
  const cleanId = apiId.replace(/\.svg$/, '');

  let score = 0;
  let apiName = cleanId;

  try {
    // Fetch live score from the backend
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'https://api.veklom.com'}/api/v1/benchmarks/leaderboard`, {
      next: { revalidate: 300 }, // ISR: refresh every 5 min
    });

    if (res.ok) {
      const data: Array<{ id: string; name: string; govScore?: number }> = await res.json();
      const entry = data.find(d => d.id === cleanId);
      if (entry) {
        score = entry.govScore ?? 0;
        apiName = entry.name;
      }
    }
  } catch {
    // Fallback: return a badge showing "measuring…"
    score = 0;
    apiName = cleanId;
  }

  const svg = buildSVG(apiName, score);

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=600',
      'X-VNP-Api-Id': cleanId,
      'X-VNP-Score': score.toString(),
      'Access-Control-Allow-Origin': '*',
    },
  });
}
