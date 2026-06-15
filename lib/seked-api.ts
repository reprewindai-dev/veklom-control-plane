// SEKED Control Plane API Client
// Based on SEKED v1.0 specification - human state measurement language

import { api, apiUrl } from "./api";
import type {
  SekedMeasurement,
  SekedRatios,
  SekedDirective,
  SekedState,
  SekedPolicy,
  PolicyResponse,
  DecisionRequest,
  DecisionResponse,
  Proof,
  HealthStatus,
  AuthorityRun,
  EvidencePack
} from "../types/seked";

// SEKED v1.0 constants
const SEKED_SPECIFICATION_VERSION = "1.0";
const SEKED_CANONICAL_FINGERPRINT = "038f8464884a556fbee43972b27cbdfd08d3b522e644c0c644ad1b2ded82fcc7";

// SEKED endpoints - these will be proxied through the Veklom backend
const SEKED_BASE = "/api/v1/seked";

// SEKED Measurement Engine
export async function calculateSekedRatios(measurement: SekedMeasurement): Promise<SekedRatios> {
  return api<SekedRatios>(`${SEKED_BASE}/calculate`, {
    method: "POST",
    body: measurement,
  });
}

export async function getDirective(ratio: number): Promise<SekedDirective> {
  return api<SekedDirective>(`${SEKED_BASE}/directive/${ratio}`);
}

export async function createSekedState(measurement: SekedMeasurement): Promise<SekedState> {
  return api<SekedState>(`${SEKED_BASE}/state`, {
    method: "POST",
    body: measurement,
  });
}

export async function verifySekedState(state: SekedState): Promise<{ valid: boolean; fingerprint: string }> {
  return api<{ valid: boolean; fingerprint: string }>(`${SEKED_BASE}/verify`, {
    method: "POST",
    body: state,
  });
}

// Policy Management
export async function createPolicy(policy: Omit<SekedPolicy, "created_at" | "updated_at">): Promise<PolicyResponse> {
  return api<PolicyResponse>(`${SEKED_BASE}/policies`, {
    method: "POST",
    body: policy,
  });
}

export async function getPolicies(): Promise<SekedPolicy[]> {
  return api<SekedPolicy[]>(`${SEKED_BASE}/policies`);
}

export async function getPolicy(policyId: string): Promise<SekedPolicy> {
  return api<SekedPolicy>(`${SEKED_BASE}/policies/${policyId}`);
}

export async function updatePolicy(policyId: string, policy: Partial<SekedPolicy>): Promise<PolicyResponse> {
  return api<PolicyResponse>(`${SEKED_BASE}/policies/${policyId}`, {
    method: "PUT",
    body: policy,
  });
}

export async function deletePolicy(policyId: string): Promise<{ status: "deleted" }> {
  return api<{ status: "deleted" }>(`${SEKED_BASE}/policies/${policyId}`, {
    method: "DELETE",
  });
}

// Decision Engine
export async function createDecision(request: DecisionRequest): Promise<DecisionResponse> {
  return api<DecisionResponse>(`${SEKED_BASE}/decision`, {
    method: "POST",
    body: request,
  });
}

export async function getProofs(): Promise<Proof[]> {
  return api<Proof[]>(`${SEKED_BASE}/proofs`);
}

export async function getProof(proofId: string): Promise<Proof> {
  return api<Proof>(`${SEKED_BASE}/proofs/${proofId}`);
}

export async function getProofsByJob(jobId: string): Promise<Proof[]> {
  return api<Proof[]>(`${SEKED_BASE}/proofs?job_id=${jobId}`);
}

export async function getHealthStatus(): Promise<HealthStatus> {
  return api<HealthStatus>(`${SEKED_BASE}/health`);
}

// Authority Run endpoints
export async function createAuthorityRun(request: DecisionRequest): Promise<AuthorityRun> {
  return api<AuthorityRun>(`${SEKED_BASE}/authority-runs`, {
    method: "POST",
    body: request,
  });
}

export async function getAuthorityRuns(): Promise<AuthorityRun[]> {
  return api<AuthorityRun[]>(`${SEKED_BASE}/authority-runs`);
}

export async function getAuthorityRun(runId: string): Promise<AuthorityRun> {
  return api<AuthorityRun>(`${SEKED_BASE}/authority-runs/${runId}`);
}

export async function approveAuthorityRun(runId: string): Promise<AuthorityRun> {
  return api<AuthorityRun>(`${SEKED_BASE}/authority-runs/${runId}/approve`, {
    method: "POST",
  });
}

export async function rejectAuthorityRun(runId: string, reason?: string): Promise<AuthorityRun> {
  return api<AuthorityRun>(`${SEKED_BASE}/authority-runs/${runId}/reject`, {
    method: "POST",
    body: { reason },
  });
}

// Evidence Pack endpoints
export async function getEvidencePack(runId: string): Promise<EvidencePack> {
  return api<EvidencePack>(`${SEKED_BASE}/evidence-packs/${runId}`);
}

export async function verifyEvidencePack(runId: string): Promise<EvidencePack> {
  return api<EvidencePack>(`${SEKED_BASE}/evidence-packs/${runId}/verify`, {
    method: "POST",
  });
}

export async function downloadEvidencePack(runId: string): Promise<Blob> {
  const response = await fetch(apiUrl(`${SEKED_BASE}/evidence-packs/${runId}/download`), {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("veklom.access_token")}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to download evidence pack: ${response.statusText}`);
  }
  
  return response.blob();
}
