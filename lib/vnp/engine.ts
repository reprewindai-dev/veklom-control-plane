/**
 * VNP Stakes Engine — Core computation engine.
 *
 * Implements the cryptoeconomic primitives described in the VNP design:
 *   - Continuous slashing function: Penalty(t) = lambda * (|S_o(t) - S_p| - k*sigma(t))
 *   - KDE consensus (Gaussian kernel, Silverman bandwidth)
 *   - EWMA historical anchor
 *   - Multi-anchor consensus: S_final = w1*S_KDE + w2*S_historical + w3*S_shadow
 *   - Verifier weighting: W_i = Stake_i * log(Reputation_i + 1) * Diversity_i
 *   - Rolling reputation with time-decay
 *   - Log-normal latency distribution reconstruction from percentiles
 */

import type {
  DeviationResult,
  KDEResult,
  ConsensusResult,
  EpochSettlement,
  ProviderBondView,
  BondStatusLevel,
} from "./types";

// ============ PROTOCOL PARAMETERS ============

export const VNP_PARAMS = {
  /** Tolerance multiplier (penalty triggers when deviation > k * sigma) */
  k: 3,
  /** Slashing rate coefficient (USDC per ms of excess deviation) */
  lambda: 2.0,
  /** Epoch duration in milliseconds (1 hour) */
  epochDurationMs: 3_600_000,
  /** Minimum samples for a valid measurement batch */
  minSamples: 100,
  /** Minimum bond in USDC */
  minBondUsdc: 1_000,
  /** Tier A challenge stake range (USDC) */
  challengeTierA: { min: 5, max: 50 },
  /** Tier B challenge stake range (USDC) */
  challengeTierB: { min: 100, max: 5_000 },
  /** Multi-anchor consensus weights */
  consensusWeights: { kde: 0.5, historical: 0.3, shadow: 0.2 },
  /** Per-epoch reputation decay factor */
  reputationDecay: 0.95,
  /** Reputation window in epochs (~30 days at 1h epochs) */
  reputationWindow: 720,
  /** EWMA smoothing factor (long half-life for historical anchor) */
  ewmaAlpha: 0.05,
  /** Platform fee rate on stakes */
  platformFeeRate: 0.025,
};

// ============ DEVIATION & PENALTY ============

export function computeDeviation(
  targetP95Ms: number,
  observedP95Ms: number,
  sigmaMs: number,
  k: number = VNP_PARAMS.k,
): DeviationResult {
  const deviationMs = Math.abs(observedP95Ms - targetP95Ms);
  const toleranceMs = k * Math.max(sigmaMs, 0.1);
  const excessMs = Math.max(0, deviationMs - toleranceMs);
  const penaltyUsdc = excessMs > 0
    ? VNP_PARAMS.lambda * excessMs
    : 0;
  return { deviationMs, toleranceMs, excessMs, penaltyUsdc };
}

export function bondStatusFromDeviation(d: DeviationResult): BondStatusLevel {
  if (d.excessMs === 0 && d.deviationMs < d.toleranceMs * 0.5) return "healthy";
  if (d.excessMs === 0) return "warning";
  if (d.penaltyUsdc < 100) return "breaching";
  return "critical";
}

// ============ STATISTICAL HELPERS ============

function mean(data: number[]): number {
  if (data.length === 0) return 0;
  return data.reduce((a, b) => a + b, 0) / data.length;
}

function stddev(data: number[]): number {
  const n = data.length;
  if (n < 2) return 0;
  const m = mean(data);
  const variance = data.reduce((sum, x) => sum + (x - m) ** 2, 0) / (n - 1);
  return Math.sqrt(variance);
}

function percentile(sorted: number[], p: number): number {
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi || hi >= sorted.length) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function iqr(data: number[]): number {
  const sorted = [...data].sort((a, b) => a - b);
  return percentile(sorted, 75) - percentile(sorted, 25);
}

// ============ KDE CONSENSUS ============

function gaussianKernel(u: number): number {
  return Math.exp(-0.5 * u * u) / Math.sqrt(2 * Math.PI);
}

/** Silverman's rule of thumb for bandwidth selection */
function silvermanBandwidth(data: number[]): number {
  const n = data.length;
  if (n < 2) return 1;
  const s = stddev(data);
  const q = iqr(data);
  const spread = Math.min(s, q / 1.34);
  return 0.9 * Math.max(spread, 0.1) * Math.pow(n, -0.2);
}

/** Compute KDE from raw measurement data points. */
export function computeKDE(data: number[], numPoints: number = 200): KDEResult {
  if (data.length === 0) return { mode: 0, bandwidth: 1, points: [], density: [] };
  if (data.length === 1) return { mode: data[0], bandwidth: 1, points: [data[0]], density: [1] };

  const bandwidth = silvermanBandwidth(data);
  const sorted = [...data].sort((a, b) => a - b);
  const margin = bandwidth * 3;
  const lo = sorted[0] - margin;
  const hi = sorted[sorted.length - 1] + margin;
  const step = (hi - lo) / (numPoints - 1);

  const points: number[] = [];
  const density: number[] = [];
  let maxD = 0;
  let modeIdx = 0;

  for (let i = 0; i < numPoints; i++) {
    const x = lo + i * step;
    points.push(x);
    let d = 0;
    for (const xi of data) {
      d += gaussianKernel((x - xi) / bandwidth);
    }
    d /= data.length * bandwidth;
    density.push(d);
    if (d > maxD) {
      maxD = d;
      modeIdx = i;
    }
  }

  return { mode: points[modeIdx], bandwidth, points, density };
}

// ============ LOG-NORMAL DISTRIBUTION ============

/**
 * Reconstruct a latency distribution from percentile summaries.
 * Latency follows log-normal: if X ~ LogNormal(mu, sigma^2),
 *   P50 = e^mu,  P95 = e^(mu + 1.645*sigma),  P99 = e^(mu + 2.326*sigma)
 */
export function logNormalParams(p50: number, p95: number): { mu: number; sigma: number } {
  const mu = Math.log(Math.max(1, p50));
  const sigma = Math.max(0.01, (Math.log(Math.max(1, p95)) - mu) / 1.645);
  return { mu, sigma };
}

export function logNormalPDF(x: number, mu: number, sigma: number): number {
  if (x <= 0) return 0;
  const lnx = Math.log(x);
  return (1 / (x * sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-((lnx - mu) ** 2) / (2 * sigma ** 2));
}

export function logNormalMode(mu: number, sigma: number): number {
  return Math.exp(mu - sigma * sigma);
}

/**
 * Generate the density curve for a latency distribution inferred from
 * summary percentiles. Returns evaluation points and their densities,
 * plus the distribution mode.
 */
export function latencyDensityCurve(
  p50: number,
  p95: number,
  numPoints: number = 200,
): { mode: number; points: number[]; density: number[] } {
  const { mu, sigma } = logNormalParams(p50, p95);
  const mode = logNormalMode(mu, sigma);
  const lo = Math.max(0.1, mode * 0.2);
  const hi = p95 * 1.8;
  const step = (hi - lo) / (numPoints - 1);

  const points: number[] = [];
  const density: number[] = [];

  for (let i = 0; i < numPoints; i++) {
    const x = lo + i * step;
    points.push(Math.round(x * 10) / 10);
    density.push(logNormalPDF(x, mu, sigma));
  }

  return { mode, points, density };
}

// ============ EWMA ============

export function ewma(data: number[], alpha: number = VNP_PARAMS.ewmaAlpha): number {
  if (data.length === 0) return 0;
  let s = data[0];
  for (let i = 1; i < data.length; i++) {
    s = alpha * data[i] + (1 - alpha) * s;
  }
  return s;
}

// ============ MULTI-ANCHOR CONSENSUS ============

export function multiAnchorConsensus(
  kdeMode: number,
  historicalEwma: number,
  shadowProbe: number,
  weights = VNP_PARAMS.consensusWeights,
): ConsensusResult {
  const finalScore =
    weights.kde * kdeMode +
    weights.historical * historicalEwma +
    weights.shadow * shadowProbe;
  return { kdeMode, historicalEwma, shadowProbe, finalScore, weights };
}

// ============ VERIFIER WEIGHTING ============

/** W_i = Stake_i * log(Reputation_i + 1) * Diversity_i */
export function verifierWeight(stake: number, reputation: number, diversity: number): number {
  return stake * Math.log(Math.max(1, reputation) + 1) * diversity;
}

// ============ REPUTATION ============

export function rollingReputation(
  accuracyHistory: { epoch: number; accuracy: number }[],
  decay: number = VNP_PARAMS.reputationDecay,
  windowEpochs: number = VNP_PARAMS.reputationWindow,
): number {
  if (accuracyHistory.length === 0) return 0;
  const latestEpoch = Math.max(...accuracyHistory.map((e) => e.epoch));
  let score = 0;
  for (const entry of accuracyHistory) {
    const age = latestEpoch - entry.epoch;
    if (age > windowEpochs) continue;
    score += entry.accuracy * Math.pow(decay, age);
  }
  return score;
}

// ============ SIGMA ESTIMATION ============

/**
 * Estimate sigma from percentile data.
 * For a normal distribution: p95 = mean + 1.645*sigma, p99 = mean + 2.326*sigma
 * So sigma ~ (p99 - p95) / 0.681
 * For log-normal (latency), we estimate in log-space.
 */
export function estimateSigma(p50: number, p95: number, p99: number): number {
  if (p99 <= p95 || p95 <= 0) return p95 * 0.1;
  return (p99 - p95) / 0.681;
}

// ============ SETTLEMENT ============

export function computeEpochSettlement(
  apiId: string,
  apiName: string,
  targetP95Ms: number,
  observedP95Ms: number,
  sigmaMs: number,
  bondRemainingUsdc: number,
  epoch?: number,
): EpochSettlement {
  const deviation = computeDeviation(targetP95Ms, observedP95Ms, sigmaMs);
  const penalty = Math.min(deviation.penaltyUsdc, bondRemainingUsdc);
  const ep = epoch ?? Math.floor(Date.now() / VNP_PARAMS.epochDurationMs);

  return {
    apiId,
    apiName,
    epoch: ep,
    targetP95Ms,
    observedP95Ms,
    sigmaMs,
    deviationMs: deviation.deviationMs,
    toleranceMs: deviation.toleranceMs,
    excessMs: deviation.excessMs,
    penaltyUsdc: penalty,
    bondRemainingUsdc: bondRemainingUsdc - penalty,
    timestamp: Date.now(),
  };
}

// ============ PROVIDER BOND VIEW ============

export function buildProviderBondView(
  api: {
    id: string;
    name: string;
    provider?: string | null;
    p50: number;
    p95: number;
    p99: number;
    drift: number;
    totalStaked: number;
  },
): ProviderBondView {
  const targetP95Ms = api.p50;
  const observedP95Ms = api.p95;
  const sigmaMs = estimateSigma(api.p50, api.p95, api.p99);
  const deviation = computeDeviation(targetP95Ms, observedP95Ms, sigmaMs);

  const historicalP95 = api.p95 * (1 - api.drift * 0.01);
  const shadowP95 = api.p95 * (1 + (Math.random() * 0.02 - 0.01));
  const { mu, sigma } = logNormalParams(api.p50, api.p95);
  const kdeMode = logNormalMode(mu, sigma);

  const consensus = multiAnchorConsensus(kdeMode, historicalP95, shadowP95);

  return {
    apiId: api.id,
    name: api.name,
    provider: api.provider ?? "Unknown",
    targetP95Ms,
    observedP95Ms,
    sigmaMs,
    deviation,
    bondAmountUsdc: Math.max(api.totalStaked, VNP_PARAMS.minBondUsdc),
    slashedTotalUsdc: 0,
    penaltyRatePerEpoch: deviation.penaltyUsdc,
    status: bondStatusFromDeviation(deviation),
    consensus,
  };
}

// ============ CURRENT EPOCH ============

export function currentEpoch(): number {
  return Math.floor(Date.now() / VNP_PARAMS.epochDurationMs);
}

export function epochToDate(epoch: number): Date {
  return new Date(epoch * VNP_PARAMS.epochDurationMs);
}
