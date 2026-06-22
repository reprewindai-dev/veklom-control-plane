/**
 * VNP v0.1 Constants — Dimension weights, thresholds, regions, and grading bands.
 *
 * The weighting is intentionally asymmetric per the locked methodology:
 * - p99 latency highest weight (outliers break agents)
 * - Error/correctness next (fast but wrong is unusable)
 * - x402/MPP included because VNP launches into a machine-payments ecosystem
 */

import type { VNPDimensionId, VNPGrade, VNPRegionId } from "./types";

// ---------------------------------------------------------------------------
// Dimension definitions with canonical weights (must sum to 1.0)
// ---------------------------------------------------------------------------
export interface DimensionDef {
  id: VNPDimensionId;
  label: string;
  shortLabel: string;
  weight: number;
  unit: string;
  description: string;
  /** "lower" = lower raw values are better (latency, error rate) */
  direction: "lower" | "higher";
}

export const VNP_DIMENSIONS: DimensionDef[] = [
  {
    id: "p99_latency",
    label: "p99 Latency",
    shortLabel: "p99",
    weight: 0.18,
    unit: "ms",
    description: "99th percentile response time. Outliers break agent pipelines.",
    direction: "lower",
  },
  {
    id: "error_rate",
    label: "Error Rate & Correctness",
    shortLabel: "Errors",
    weight: 0.15,
    unit: "%",
    description: "Percentage of responses with HTTP errors or malformed bodies.",
    direction: "lower",
  },
  {
    id: "availability",
    label: "Availability & Uptime",
    shortLabel: "Uptime",
    weight: 0.12,
    unit: "%",
    description: "Observed availability across measurement windows.",
    direction: "higher",
  },
  {
    id: "throughput",
    label: "Throughput & Capacity",
    shortLabel: "RPS",
    weight: 0.10,
    unit: "req/s",
    description: "Peak sustained request rate under load.",
    direction: "higher",
  },
  {
    id: "security",
    label: "Security Posture",
    shortLabel: "Security",
    weight: 0.10,
    unit: "score",
    description: "TLS configuration, security headers, CORS, CSP evaluation.",
    direction: "higher",
  },
  {
    id: "documentation",
    label: "Documentation Quality",
    shortLabel: "Docs",
    weight: 0.07,
    unit: "score",
    description: "OpenAPI spec completeness, examples, error documentation.",
    direction: "higher",
  },
  {
    id: "versioning",
    label: "Versioning Stability",
    shortLabel: "Version",
    weight: 0.07,
    unit: "score",
    description: "API version deprecation policy, breaking change frequency.",
    direction: "higher",
  },
  {
    id: "x402_compliance",
    label: "x402 / MPP Compliance",
    shortLabel: "x402",
    weight: 0.09,
    unit: "score",
    description: "Correct x402 payment flow, EIP-712 signatures, settlement verification.",
    direction: "higher",
  },
  {
    id: "rate_limit_transparency",
    label: "Rate Limit Transparency",
    shortLabel: "Limits",
    weight: 0.06,
    unit: "score",
    description: "Published rate limits, proper 429 responses, retry-after headers.",
    direction: "higher",
  },
  {
    id: "developer_experience",
    label: "Developer Experience (TTFC)",
    shortLabel: "DX",
    weight: 0.06,
    unit: "score",
    description: "Time-to-first-call, SDK quality, onboarding friction.",
    direction: "higher",
  },
];

// Verify weights sum to 1.0 at module load time
const WEIGHT_SUM = VNP_DIMENSIONS.reduce((s, d) => s + d.weight, 0);
if (Math.abs(WEIGHT_SUM - 1.0) > 0.001) {
  throw new Error(`VNP dimension weights must sum to 1.0, got ${WEIGHT_SUM}`);
}

// ---------------------------------------------------------------------------
// Grade bands — AAA down to D
// ---------------------------------------------------------------------------
export interface GradeBand {
  grade: VNPGrade;
  min: number;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const VNP_GRADE_BANDS: GradeBand[] = [
  { grade: "AAA", min: 95, color: "#3EE7A2", bgColor: "rgba(62,231,162,0.12)", borderColor: "rgba(62,231,162,0.3)" },
  { grade: "AA",  min: 90, color: "#3EE7A2", bgColor: "rgba(62,231,162,0.08)", borderColor: "rgba(62,231,162,0.2)" },
  { grade: "A",   min: 85, color: "#7fdcf0", bgColor: "rgba(55,201,236,0.1)",  borderColor: "rgba(55,201,236,0.25)" },
  { grade: "BBB", min: 80, color: "#7fdcf0", bgColor: "rgba(55,201,236,0.07)", borderColor: "rgba(55,201,236,0.18)" },
  { grade: "BB",  min: 75, color: "#FFB800", bgColor: "rgba(255,184,0,0.1)",   borderColor: "rgba(255,184,0,0.25)" },
  { grade: "B",   min: 70, color: "#FFB800", bgColor: "rgba(255,184,0,0.07)",  borderColor: "rgba(255,184,0,0.18)" },
  { grade: "CCC", min: 60, color: "#FF9F43", bgColor: "rgba(255,159,67,0.1)",  borderColor: "rgba(255,159,67,0.25)" },
  { grade: "CC",  min: 50, color: "#FF5C6C", bgColor: "rgba(255,92,108,0.1)",  borderColor: "rgba(255,92,108,0.25)" },
  { grade: "C",   min: 40, color: "#FF5C6C", bgColor: "rgba(255,92,108,0.07)", borderColor: "rgba(255,92,108,0.18)" },
  { grade: "D",   min: 0,  color: "#FF5C6C", bgColor: "rgba(255,92,108,0.05)", borderColor: "rgba(255,92,108,0.12)" },
];

export function gradeForScore(composite: number): GradeBand {
  for (const band of VNP_GRADE_BANDS) {
    if (composite >= band.min) return band;
  }
  return VNP_GRADE_BANDS[VNP_GRADE_BANDS.length - 1];
}

// ---------------------------------------------------------------------------
// Regions
// ---------------------------------------------------------------------------
export interface RegionDef {
  id: VNPRegionId;
  label: string;
  shortLabel: string;
  /** Approximate round-trip baseline in ms (for geographic normalization) */
  baselineRttMs: number;
}

export const VNP_REGIONS: RegionDef[] = [
  { id: "us-east",       label: "US East (Virginia)",       shortLabel: "US-E",  baselineRttMs: 0 },
  { id: "us-west",       label: "US West (Oregon)",         shortLabel: "US-W",  baselineRttMs: 65 },
  { id: "eu-west",       label: "EU West (Frankfurt)",      shortLabel: "EU-W",  baselineRttMs: 85 },
  { id: "ap-southeast",  label: "AP Southeast (Singapore)", shortLabel: "AP-SE", baselineRttMs: 230 },
  { id: "ap-northeast",  label: "AP Northeast (Tokyo)",     shortLabel: "AP-NE", baselineRttMs: 170 },
];

// ---------------------------------------------------------------------------
// Confidence thresholds
// ---------------------------------------------------------------------------
export const CONFIDENCE_THRESHOLDS = {
  /** Minimum measurements for "high" confidence */
  high: 1000,
  /** Minimum measurements for "medium" confidence */
  medium: 200,
  /** Minimum measurements for "low" confidence (below this = provisional) */
  low: 50,
} as const;

// ---------------------------------------------------------------------------
// Normalization reference points (used by scoring engine)
// ---------------------------------------------------------------------------
export const NORMALIZATION = {
  p99_latency: { ideal: 50, poor: 5000 },
  error_rate: { ideal: 0, poor: 10 },
  availability: { ideal: 100, poor: 95 },
  throughput: { ideal: 10000, poor: 10 },
  security: { ideal: 100, poor: 0 },
  documentation: { ideal: 100, poor: 0 },
  versioning: { ideal: 100, poor: 0 },
  x402_compliance: { ideal: 100, poor: 0 },
  rate_limit_transparency: { ideal: 100, poor: 0 },
  developer_experience: { ideal: 100, poor: 0 },
} as const;
