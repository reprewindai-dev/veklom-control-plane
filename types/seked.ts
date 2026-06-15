// SEKED Control Plane Types
// Based on SEKED v1.0 specification - human state measurement language

export interface SekedMeasurement {
  E: number; // Energy (0-9)
  R: number; // Resistance (0-9) 
  C: number; // Clarity (0-9)
  D: number; // Drive (0-9)
  S: number; // Stability (0-9)
  timestamp: string;
}

export interface SekedRatios {
  sigma: number; // σ = (E + D) / (R + 1) - Primary operational ratio
  ci: number;    // Cognitive Index = C / I (where I = 10 - R)
  si: number;    // Stability Index = S / 10
}

export interface SekedDirective {
  ratio: number;
  directive: string;
  action_type: "EXECUTE" | "PREPARE" | "CONSERVE" | "RECOVER" | "ESCALATE";
  confidence: number;
  reasoning: string;
}

export interface SekedState {
  id: string;
  measurement: SekedMeasurement;
  ratios: SekedRatios;
  directive: SekedDirective;
  fingerprint: string; // SHA-256 of the state
  created_at: string;
}

export interface SekedPolicy {
  name: string;
  sigma_threshold: number;
  ci_threshold: number;
  si_threshold: number;
  action_rules: Record<string, SekedDirective>;
  created_at?: string;
  updated_at?: string;
}

export interface PolicyResponse {
  status: "saved";
  policy_id: string;
}

export interface DecisionRequest {
  job_id: string;
  measurement: SekedMeasurement;
  context?: string;
  timestamp: string;
}

export interface DecisionResponse {
  action: "RUN" | "HOLD" | "BLOCK" | "RECOVER";
  delay_seconds: number;
  proof_id: string;
  seked_state: SekedState;
  policy_id?: string;
  engine_response?: any;
}

export interface Proof {
  id: string;
  job_id: string;
  timestamp: string;
  action: string;
  seked_state: SekedState;
  policy_id: string;
  engine_url: string;
  evidence?: Record<string, unknown>;
  created_at: string;
}

export interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  engine_url?: string;
  policies_count?: number;
  proofs_count?: number;
  specification_version: string;
  fingerprint: string;
}

export interface SekedConfig {
  engine_url: string;
  port: number;
  environment: "development" | "staging" | "production";
  specification_version: string;
  canonical_fingerprint: string;
}

export interface AuthorityRun {
  id: string;
  job_id: string;
  status: "pending" | "approved" | "rejected" | "executed";
  policy_id?: string;
  proof_id?: string;
  created_at: string;
  updated_at: string;
  decision?: DecisionResponse;
  execution_identity?: string;
  seked_state?: SekedState;
}

export interface EvidencePack {
  id: string;
  authority_run_id: string;
  proofs: Proof[];
  verification_status: "pending" | "verified" | "failed";
  created_at: string;
  verified_at?: string;
  specification_compliance: boolean;
}
