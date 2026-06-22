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
