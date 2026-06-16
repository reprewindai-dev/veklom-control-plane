// @ts-nocheck
"use client";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PGLCertificate {
  certificate_id: string;
  genome_hash: string;
  constitution_hash: string;
  plan_hash: string;
  output_hash: string;
  outcome_hash: string;
  type: "PRE" | "POST";
  timestamp: string;
}

export interface ExecutionIdentityV1 {
  execution_id: string;
  pgl_pre_certificate_id: string;
  pgl_post_certificate_id?: string;
  genome_hash: string;
  constitution_hash: string;
  plan_hash: string;
  tool_manifest_hash: string;
  delegation_chain_hash: string;
  input_hash: string;
  seked_attestation_hash: string;
  directive: string;
  risk_tier: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  budget_approved_cents: number;
  budget_reserve_cents?: number;
  delegation_depth: number;
  ttl_seconds: number;
  expires_at: string;
  scope: {
    tools: string[];
    endpoints: string[];
  };
  human_attestation_hash: string;
  ai_attestation_hash: string;
  execution_attestation_hash: string;
  issuer: string;
  issued_at: string;
  signature: string;
  hash: string;
}

export interface LedgerBlock {
  index: number;
  timestamp: string;
  intent: string; // it
  justification: string; // Jt
  state_entropy: number; // Et
  action: string; // aexec,t
  current_hash: string; // H(ct)
  previous_hash: string; // H(Ct-1)
  combined_hash: string; // Ct = H(it + Jt + Et + action + H(ct) + H(Ct-1))
}

export interface CompiledStep {
  name: string;
  description: string;
  toolRequired: string;
  costEstimateCents: number;
}

export interface CompiledPlan {
  id: string;
  rawIntent: string;
  justification: string;
  steps: CompiledStep[];
  potentialRisks: string[];
  estimatedCostCents: number;
  detectedPolicies: string[]; // HIPAA, GDPR, PCI-DSS, SOC2, etc.
}

export interface MicropaymentInvoice {
  invoiceId: string;
  amountCents: number;
  amountUSDC: number;
  timestamp: string;
  status: "PENDING" | "PAID" | "EXPIRED";
}

export interface SovereignRoute {
  model: string;
  weight: number;
  entropy: number;
  successRate: number;
  latency: number;
  profile: string;
}

