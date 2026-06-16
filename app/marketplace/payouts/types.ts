// @ts-nocheck
"use client";
export enum JobStatus {
  RECEIVED = "RECEIVED",
  ADMITTED = "ADMITTED",
  RESERVED = "RESERVED",
  QUEUED = "QUEUED",
  RUNNING = "RUNNING",
  SUCCEEDED = "SUCCEEDED",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
  EXPIRED = "EXPIRED"
}

export interface SimTenant {
  tenantId: string;
  tier: "standard" | "premium" | "enterprise";
  complianceDomain: string;
  availableUsd: string; // precise decimal string
  reservedUsd: string;  // precise decimal string
  collectedUsd: string; // precise decimal string
  createdAt: number;
}

export interface SimJob {
  jobId: string;
  transactionId: string;
  tenantId: string;
  idempotencyKey: string;
  reservationId: string;
  status: JobStatus;
  payloadIntent: string;
  routeNodeId: string;
  routeRegion: string;
  complianceDomain: string;
  checksum: string;
  tokenBudget: number;
  maxBudgetUsd: string;    // decimal text (e.g. "150.000000")
  actualAmountUsd?: string; // decimal text
  attempts: number;
  maxAttempts: number;
  availableAt: number;     // epoch ms
  leaseToken: string | null;
  leaseExpiresAt: number | null; // epoch ms
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
  retryable: boolean | null;
  createdAt: number;
  updatedAt: number;
  finishedAt: number | null;
  latencyMs?: number;
}

export interface SimJobEvent {
  eventId: string;
  jobId: string;
  tenantId: string;
  eventType: string;
  fromStatus: JobStatus | null;
  toStatus: JobStatus | null;
  payload: string; // JSON text
  createdAt: number;
}

export interface SimAuditBlock {
  auditId: string;
  jobId: string;
  transactionId: string;
  tenantId: string;
  eventType: "FUNDS_RESERVED" | "JOB_DURABLY_QUEUED" | "LEASE_GRANTED" | "FUNDS_SETTLED" | "FUNDS_RELEASED" | "JOB_SUCCEEDED" | "JOB_FAILED";
  nodeId: string | null;
  amountUsd: string;
  checksum: string;
  payloadJson: string;
  createdAt: number;
}

export interface RedisStreamEntry {
  id: string; // stream id e.g. "1775432400000-0"
  fields: Record<string, string>;
}

