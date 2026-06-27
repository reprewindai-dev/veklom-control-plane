/**
 * VNP Stakes Engine — Core type definitions.
 *
 * Maps to the on-chain contract interfaces (VNPRegistry, VNPBondEscrow,
 * VNPMeasurementOracle, VNPSettlement, VNPChallenge, VNPReputation) and
 * the off-chain event schemas described in the VNP design documents.
 */

// ============ Registry & Bond ============

export interface ApiConfig {
  apiId: string;
  provider: string;
  name: string;
  targetP95Ms: number;
  bondAmountUsdc: number;
  active: boolean;
  createdAt: number;
}

export interface Bond {
  apiId: string;
  provider: string;
  amount: number;
  lockedAt: number;
  active: boolean;
  slashedTotal: number;
}

// ============ Measurement ============

export interface MeasurementBatch {
  apiId: string;
  epoch: number;
  p50Ms: number;
  p90Ms: number;
  p95Ms: number;
  p99Ms: number;
  sigmaMs: number;
  sampleCount: number;
  anchors: {
    historicalP95Ms: number;
    shadowP95Ms: number;
    anchorsHash: string;
  };
  verifierCommittee: {
    submitter: string;
    members: string[];
    attestation: string;
  };
}

// ============ Deviation & Settlement ============

export interface DeviationResult {
  deviationMs: number;
  toleranceMs: number;
  excessMs: number;
  penaltyUsdc: number;
}

export interface EpochSettlement {
  apiId: string;
  apiName: string;
  epoch: number;
  targetP95Ms: number;
  observedP95Ms: number;
  sigmaMs: number;
  deviationMs: number;
  toleranceMs: number;
  excessMs: number;
  penaltyUsdc: number;
  bondRemainingUsdc: number;
  timestamp: number;
}

// ============ Verifier Network ============

export interface VerifierNode {
  address: string;
  stake: number;
  reputation: number;
  diversityScore: number;
  weight: number;
  region: string;
  asn: string;
  measurementCount: number;
  accuracy: number;
  active: boolean;
}

// ============ Challenge ============

export type ChallengeStatus = "pending" | "accepted" | "rejected" | "resolved";
export type ChallengeTier = "A" | "B";

export interface Challenge {
  id: string;
  apiId: string;
  apiName: string;
  challenger: string;
  epoch: number;
  stake: number;
  status: ChallengeStatus;
  evidenceHash: string;
  tier: ChallengeTier;
  createdAt: number;
}

// ============ Protocol Stats ============

export interface ProtocolStats {
  totalValueBonded: number;
  activeApis: number;
  activeVerifiers: number;
  totalPenalties: number;
  settlementRate: number;
  epochsProcessed: number;
}

// ============ KDE & Consensus ============

export interface KDEResult {
  mode: number;
  bandwidth: number;
  points: number[];
  density: number[];
}

export interface ConsensusResult {
  kdeMode: number;
  historicalEwma: number;
  shadowProbe: number;
  finalScore: number;
  weights: { kde: number; historical: number; shadow: number };
}

// ============ Provider Bond View ============

export type BondStatusLevel = "healthy" | "warning" | "breaching" | "critical";

export interface ProviderBondView {
  apiId: string;
  name: string;
  provider: string;
  targetP95Ms: number;
  observedP95Ms: number;
  sigmaMs: number;
  deviation: DeviationResult;
  bondAmountUsdc: number;
  slashedTotalUsdc: number;
  penaltyRatePerEpoch: number;
  status: BondStatusLevel;
  consensus: ConsensusResult;
}

// ============ x402 Micro-Stake ============

export interface MicroStakeHeader {
  version: number;
  apiId: string;
  stakeUsdc: number;
  epochHint: number;
  agent: string;
  nonce: string;
  signature: string;
}

/**
 * Veklom Nexus Protocol (VNP) v0.1 — Core Type Definitions
 *
 * Aligned to the locked VNP Methodology Specification v0.1.
 * These types model the 10-dimension scoring system, measurement records,
 * provenance chain, and regional breakdown used across the VNP surface.
 */

// ---------------------------------------------------------------------------
// Dimension identifiers — the 10 canonical VNP measurement dimensions
// ---------------------------------------------------------------------------
export type VNPDimensionId =
  | "p99_latency"
  | "error_rate"
  | "availability"
  | "throughput"
  | "security"
  | "documentation"
  | "versioning"
  | "x402_compliance"
  | "rate_limit_transparency"
  | "developer_experience";

// ---------------------------------------------------------------------------
// Single dimension score
// ---------------------------------------------------------------------------
export interface VNPDimensionScore {
  id: VNPDimensionId;
  label: string;
  /** Raw measured value (unit depends on dimension) */
  raw: number;
  /** Normalized 0-100 score */
  normalized: number;
  /** Weight applied for composite (0..1, sums to 1.0 across all dimensions) */
  weight: number;
  /** Weighted contribution to composite = normalized * weight */
  weighted: number;
}

// ---------------------------------------------------------------------------
// VNP Composite Score — the full score for a single API
// ---------------------------------------------------------------------------
export interface VNPScore {
  apiId: string;
  apiName: string;
  provider: string;
  category: string;
  /** 0-100 composite score */
  composite: number;
  /** Letter grade: AAA, AA, A, BBB, BB, B, CCC, CC, C, D */
  grade: VNPGrade;
  /** Dimensional breakdown */
  dimensions: VNPDimensionScore[];
  /** Confidence level based on measurement count */
  confidence: VNPConfidence;
  /** Regional performance breakdown */
  regions: VNPRegionalScore[];
  /** Provenance metadata for the latest scoring epoch */
  provenance: VNPProvenance;
  /** Measurement freshness */
  lastMeasured: string;
  /** Total measurement count across all epochs */
  measurementCount: number;
  /** Status: active, provisional, disputed, suspended */
  status: VNPStatus;
}

export type VNPGrade = "AAA" | "AA" | "A" | "BBB" | "BB" | "B" | "CCC" | "CC" | "C" | "D";
export type VNPStatus = "active" | "provisional" | "disputed" | "suspended";

// ---------------------------------------------------------------------------
// Confidence interval
// ---------------------------------------------------------------------------
export interface VNPConfidence {
  level: "high" | "medium" | "low" | "provisional";
  /** Number of measurements in scoring window */
  sampleCount: number;
  /** 95% CI half-width on composite score */
  marginOfError: number;
  /** Minimum samples needed for "high" confidence */
  minForHigh: number;
}

// ---------------------------------------------------------------------------
// Regional performance
// ---------------------------------------------------------------------------
export type VNPRegionId = "us-east" | "us-west" | "eu-west" | "ap-southeast" | "ap-northeast";

export interface VNPRegionalScore {
  region: VNPRegionId;
  label: string;
  /** Regional composite score 0-100 */
  score: number;
  p50: number;
  p95: number;
  p99: number;
  p999: number;
  errorRate: number;
  availability: number;
  measurementCount: number;
  lastMeasured: string;
}

// ---------------------------------------------------------------------------
// Provenance — cryptographic proof metadata per scoring epoch
// ---------------------------------------------------------------------------
export interface VNPProvenance {
  /** Epoch identifier */
  epochId: string;
  /** ISO timestamp of epoch start */
  epochStart: string;
  /** ISO timestamp of epoch end */
  epochEnd: string;
  /** SHA-256 Merkle root of all measurements in this epoch */
  merkleRoot: string;
  /** Base L2 transaction hash anchoring this Merkle root */
  chainAnchorTx: string | null;
  /** Base L2 block number */
  chainAnchorBlock: number | null;
  /** Number of measurements in this epoch */
  measurementCount: number;
  /** Node operators that contributed measurements */
  nodeOperators: string[];
  /** k6 harness version used */
  harnessVersion: string;
  /** SHA-256 hash of the k6 test script */
  scriptHash: string;
}

// ---------------------------------------------------------------------------
// Individual measurement record (for detail views and feeds)
// ---------------------------------------------------------------------------
export interface VNPMeasurement {
  id: string;
  apiId: string;
  timestamp: string;
  region: VNPRegionId;
  nodeOperator: string;
  p50: number;
  p95: number;
  p99: number;
  p999: number;
  errorRate: number;
  validationFailureRate: number;
  uptimeObserved: boolean;
  peakRps: number;
  tlsVersion: string;
  securityHeaders: string[];
  harnessVersion: string;
  scriptHash: string;
  totalRequests: number;
  testDurationMs: number;
  nodeSignature: string;
  merkleRoot: string;
  chainAnchorTx: string | null;
}

// ---------------------------------------------------------------------------
// Dispute record
// ---------------------------------------------------------------------------
export interface VNPDispute {
  id: string;
  apiId: string;
  tier: 1 | 2 | 3;
  status: "open" | "reviewing" | "resolved_upheld" | "resolved_overturned" | "rejected";
  submittedAt: string;
  resolvedAt: string | null;
  summary: string;
  evidenceUrl: string | null;
}

// ---------------------------------------------------------------------------
// Leaderboard entry — what the backend returns from /api/v1/benchmarks/leaderboard
// ---------------------------------------------------------------------------
export interface BenchmarkApiEntry {
  id: string;
  name: string;
  category: string;
  p50: number;
  p95: number;
  p99: number;
  sla: number;
  drift: number;
  sovereignTier: number;
  complianceLabels: string[];
  govScore: number;
  devScore: number;
  endpointUrl?: string | null;
  description?: string | null;
  mcpSchema?: Record<string, unknown> | null;
  provider?: string | null;
  throughput: number;
  uptime24h: number;
  totalStaked: number;
  status: string;
}
