// @ts-nocheck
"use client";
import { Dispatch, SetStateAction } from "react";
import { JobStatus, SimTenant, SimJob, SimJobEvent, SimAuditBlock } from "../types";
import { PreciseDecimal } from "./math";

// Mock database utilities
export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

// Initial state generators
export function getInitialTenants(): SimTenant[] {
  return [
    {
      tenantId: "tenant_alpha_prime",
      tier: "enterprise",
      complianceDomain: "EU",
      availableUsd: "25000.000000",
      reservedUsd: "0.000000",
      collectedUsd: "0.000000",
      createdAt: Date.now() - 86400000 * 5,
    },
    {
      tenantId: "tenant_beta_capsule",
      tier: "premium",
      complianceDomain: "EU",
      availableUsd: "540.000000",
      reservedUsd: "0.000000",
      collectedUsd: "0.000000",
      createdAt: Date.now() - 86400000 * 2,
    },
    {
      tenantId: "tenant_gamma_zeta",
      tier: "standard",
      complianceDomain: "US",
      availableUsd: "85.500000",
      reservedUsd: "0.000000",
      collectedUsd: "0.000000",
      createdAt: Date.now() - 86400000 * 1,
    }
  ];
}

export const ROUTE_NODES = [
  { nodeId: "node-eu-west-1a", region: "eu-west-1", estimatedMs: 45, capacityClass: "tier-1-hyper" },
  { nodeId: "node-eu-west-1b", region: "eu-west-1", estimatedMs: 60, capacityClass: "tier-2-standard" },
  { nodeId: "node-us-east-1a", region: "us-east-1", estimatedMs: 82, capacityClass: "tier-1-hyper" },
];

export function getInitialJobs(): SimJob[] {
  const jobs: SimJob[] = [];
  const tenants = ["tenant_alpha_prime", "tenant_beta_capsule", "tenant_gamma_zeta"];
  const intents = ["aggregate_crossblock_liquidity", "settle_offramp_clearing", "verify_domain_compliance", "trigger_settlement_payout"];
  
  // Create 35 completed jobs distributed across the last 3 hours
  for (let i = 0; i < 35; i++) {
    const node = ROUTE_NODES[i % ROUTE_NODES.length];
    const baseEst = node.estimatedMs;
    // slightly randomize the latency based on index and some noise
    const latency = baseEst + Math.floor(Math.sin(i) * 12) + (i % 3 === 0 ? 3 : -2);
    const tenantId = tenants[i % tenants.length];
    const status = i === 12 || i === 28 ? JobStatus.FAILED : JobStatus.SUCCEEDED;
    const maxBudget = (10 + (i * i * 0.4)).toFixed(6);
    const actualCost = status === JobStatus.SUCCEEDED ? (parseFloat(maxBudget) * (0.6 + (i % 5)*0.08)).toFixed(6) : undefined;
    const timestamp = Date.now() - (35 - i) * 5 * 60 * 1000; // staggered by 5 mins

    jobs.push({
      jobId: `job-mock-sec-${1000 + i}`,
      transactionId: `tx-mock-${i}`,
      tenantId,
      idempotencyKey: `idem-mock-${i}`,
      reservationId: `resv-mock-${i}`,
      status,
      payloadIntent: intents[i % intents.length],
      routeNodeId: node.nodeId,
      routeRegion: node.region,
      complianceDomain: i % 2 === 0 ? "EU" : "US",
      checksum: `sha256_mock_${i}`,
      tokenBudget: 300 + i * 20,
      maxBudgetUsd: maxBudget,
      actualAmountUsd: actualCost,
      attempts: 1,
      maxAttempts: 10,
      availableAt: timestamp,
      leaseToken: null,
      leaseExpiresAt: null,
      lastErrorCode: status === JobStatus.FAILED ? "TimeoutError" : null,
      lastErrorMessage: status === JobStatus.FAILED ? "Network channel degradation simulated." : null,
      retryable: status === JobStatus.FAILED ? false : null,
      createdAt: timestamp,
      updatedAt: timestamp + 2500,
      finishedAt: timestamp + 2500,
      latencyMs: latency,
    });
  }
  return jobs.reverse();
}

export interface RedisReservation {
  reservationId: string;
  tenantId: string;
  transactionId: string;
  amountReserved: string; // precise decimal
  status: "RESERVED" | "SETTLED" | "RELEASED";
  createdAtMs: number;
  reason?: string;
}

export interface SimSystemState {
  tenants: SimTenant[];
  jobs: SimJob[];
  jobEvents: SimJobEvent[];
  auditBlocks: SimAuditBlock[];
  redisReservations: Record<string, RedisReservation>;
  idempotencyKeys: Record<string, string>; // key -> reservationId
  redisStream: { id: string; eventType: string; payload: string }[];
}

export function createSimulationManager(
  state: SimSystemState,
  setState: Dispatch<SetStateAction<SimSystemState>>,
  logMessage: (msg: string, type?: "info" | "success" | "warn" | "error" | "redis" | "postgres") => void
) {
  
  const appendAudit = (
    jobId: string,
    transactionId: string,
    tenantId: string,
    eventType: SimAuditBlock["eventType"],
    amountUsd: string,
    checksum: string,
    payload: any,
    nodeId: string | null = null
  ) => {
    const auditId = "aud_" + generateId();
    const payloadJson = JSON.stringify(payload);
    const now = Date.now();

    const newAudit: SimAuditBlock = {
      auditId,
      jobId,
      transactionId,
      tenantId,
      eventType,
      nodeId,
      amountUsd,
      checksum,
      payloadJson,
      createdAt: now,
    };

    // Append to Postgres audit table
    setState((prev) => {
      // Append to Redis Stream as well
      const streamId = `${now}-${prev.redisStream.length}`;
      return {
        ...prev,
        auditBlocks: [newAudit, ...prev.auditBlocks],
        redisStream: [
          { id: streamId, eventType, payload: payloadJson },
          ...prev.redisStream,
        ],
      };
    });

    logMessage(`[Audit Stream] Extracted ${eventType} into ledger log & Redis Stream`, "redis");
  };

  const executeGovernanceFlow = (params: {
    transactionId: string;
    tenantId: string;
    payloadIntent: string;
    tokenBudget: number;
    maxBudgetUsd: string;
    tenantTier: "standard" | "premium" | "enterprise";
    originX: number;
    originY: number;
    forceDatabaseCrash?: boolean; // toggle to test PostgresDurabilityFailed compensation
  }) => {
    const {
      transactionId,
      tenantId,
      payloadIntent,
      tokenBudget,
      maxBudgetUsd,
      tenantTier,
      originX,
      originY,
      forceDatabaseCrash
    } = params;

    logMessage(`[MCP Server] Intake execute_governed_workflow request: tx=${transactionId} tenant=${tenantId}`, "info");

    const checksumStr = "sha256_" + generateId().slice(0, 8); // simplified checksum simulation
    const idempotencyKey = "idem_" + generateId().slice(0, 12);

    // 1. SELECT NODE via Router
    const possibleNodes = ROUTE_NODES;
    const selectedNode = possibleNodes[Math.floor(Math.random() * possibleNodes.length)];
    logMessage(`[Router Client] Computed optimal node: ${selectedNode.nodeId} (${selectedNode.region}) - Est latency: ${selectedNode.estimatedMs}ms`, "info");

    // 2. REDIS RESERVE FUNDS
    let reservationId = "resv_" + generateUUID().replace(/-/g, "").slice(0, 24);
    let errorOccurred: string | null = null;

    setState((prev) => {
      // Find tenant
      const tenantIdx = prev.tenants.findIndex((t) => t.tenantId === tenantId);
      if (tenantIdx === -1) {
        errorOccurred = "TENANT_NOT_FOUND";
        return prev;
      }

      const tenant = prev.tenants[tenantIdx];
      const budgetDecimal = new PreciseDecimal(maxBudgetUsd);
      const availableDecimal = new PreciseDecimal(tenant.availableUsd);

      if (availableDecimal.isLessThan(budgetDecimal)) {
        errorOccurred = "INSUFFICIENT_FUNDS";
        return prev;
      }

      // Decrement Available, Increment Reserved
      const nextAvailable = availableDecimal.subtract(budgetDecimal).toString();
      const nextReserved = new PreciseDecimal(tenant.reservedUsd).add(budgetDecimal).toString();

      const updatedTenants = [...prev.tenants];
      updatedTenants[tenantIdx] = {
        ...tenant,
        availableUsd: nextAvailable,
        reservedUsd: nextReserved,
      };

      // Create reservation in Redis simulated state
      const nextReservations = { ...prev.redisReservations };
      nextReservations[reservationId] = {
        reservationId,
        tenantId,
        transactionId,
        amountReserved: maxBudgetUsd,
        status: "RESERVED",
        createdAtMs: Date.now(),
      };

      const nextIdempotencyKeys = { ...prev.idempotencyKeys };
      nextIdempotencyKeys[idempotencyKey] = reservationId;

      return {
        ...prev,
        tenants: updatedTenants,
        redisReservations: nextReservations,
        idempotencyKeys: nextIdempotencyKeys,
      };
    });

    if (errorOccurred === "INSUFFICIENT_FUNDS") {
      logMessage(`[Redis Ledg] Reserve FAILED: Insufficient Funds. Tenant: ${tenantId}, Requested: $${maxBudgetUsd}`, "error");
      throw new Error(`Insufficient funds: ${tenantId}`);
    } else if (errorOccurred === "TENANT_NOT_FOUND") {
      logMessage(`[Redis Ledg] Reserve FAILED: Tenant ${tenantId} not found`, "error");
      throw new Error(`Tenant not found: ${tenantId}`);
    }

    logMessage(`[Redis Ledg] Atomic LUA Reservation SUCCESS: reserved $${maxBudgetUsd} on ${reservationId}`, "success");
    
    // Emit reservation audit
    appendAudit(
      "N/A", // Job ID is not durably created yet, correct for admission pathway!
      transactionId,
      tenantId,
      "FUNDS_RESERVED",
      maxBudgetUsd,
      checksumStr,
      { reservationId, maxBudgetUsd, action: "reserve_funds" }
    );

    // 3. POSTGRES DURABILITY WRITE
    if (forceDatabaseCrash) {
      logMessage(`[CRITICAL] Simulating database write timeout/crash during Postgres intake process...`, "warn");
      // Compensation logic is run instantly!
      setState((prev) => {
        // Reverse reservation in Redis
        const nextReservations = { ...prev.redisReservations };
        if (nextReservations[reservationId]) {
          nextReservations[reservationId].status = "RELEASED";
          nextReservations[reservationId].reason = "POSTGRES_DURABILITY_FAILED";
        }

        // Return funds to Tenant available
        const tenantIdx = prev.tenants.findIndex((t) => t.tenantId === tenantId);
        const updatedTenants = [...prev.tenants];
        if (tenantIdx !== -1) {
          const tenant = updatedTenants[tenantIdx];
          const budgetDecimal = new PreciseDecimal(maxBudgetUsd);
          const currentAvailable = new PreciseDecimal(tenant.availableUsd);
          const currentReserved = new PreciseDecimal(tenant.reservedUsd);

          updatedTenants[tenantIdx] = {
            ...tenant,
            availableUsd: currentAvailable.add(budgetDecimal).toString(),
            reservedUsd: currentReserved.subtract(budgetDecimal).toString(),
          };
        }

        return {
          ...prev,
          tenants: updatedTenants,
          redisReservations: nextReservations,
        };
      });

      appendAudit(
        "N/A",
        transactionId,
        tenantId,
        "FUNDS_RELEASED",
        maxBudgetUsd,
        checksumStr,
        { reservationId, reason: "POSTGRES_DURABILITY_FAILED_COMPENSATION" }
      );

      logMessage(`[COMPENSATION] Dynamic funds recovery triggered. Reversed reservation ${reservationId} and restored $${maxBudgetUsd} back to ${tenantId} available balance. No leak detected!`, "success");
      throw new Error("DATABASE_CONGESTION: POSTGRES_DURABILITY_FAILED (Compensation Executed Successfully)");
    }

    // Normal Database Write
    const baseEstimated = selectedNode.estimatedMs;
    const simulatedLatency = baseEstimated + Math.floor(Math.random() * 15) - 7; // add small jitter (+/- 7ms)

    const nextJobId = generateUUID();
    const newJob: SimJob = {
      jobId: nextJobId,
      transactionId,
      tenantId,
      idempotencyKey,
      reservationId,
      status: JobStatus.QUEUED,
      payloadIntent,
      routeNodeId: selectedNode.nodeId,
      routeRegion: selectedNode.region,
      complianceDomain: "EU",
      checksum: checksumStr,
      tokenBudget,
      maxBudgetUsd,
      attempts: 0,
      maxAttempts: 10,
      availableAt: Date.now(),
      leaseToken: null,
      leaseExpiresAt: null,
      lastErrorCode: null,
      lastErrorMessage: null,
      retryable: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      finishedAt: null,
      latencyMs: simulatedLatency,
    };

    const newEvent: SimJobEvent = {
      eventId: "evt_" + generateId(),
      jobId: nextJobId,
      tenantId,
      eventType: "JOB_QUEUED",
      fromStatus: null,
      toStatus: JobStatus.QUEUED,
      payload: JSON.stringify({ reservation_id: reservationId }),
      createdAt: Date.now(),
    };

    setState((prev) => ({
      ...prev,
      jobs: [newJob, ...prev.jobs],
      jobEvents: [newEvent, ...prev.jobEvents],
    }));

    logMessage(`[Postgres DB] Durably queued job ${nextJobId.slice(0, 8)}... with Status: QUEUED`, "postgres");
    
    appendAudit(
      nextJobId,
      transactionId,
      tenantId,
      "JOB_DURABLY_QUEUED",
      maxBudgetUsd,
      checksumStr,
      { routeNodeId: selectedNode.nodeId, routeRegion: selectedNode.region }
    );

    return {
      status: "ADMITTED",
      jobId: nextJobId,
      reservationId,
      routeNodeId: selectedNode.nodeId,
      routeRegion: selectedNode.region,
      reservedAmountUsd: maxBudgetUsd,
      checksum: checksumStr,
      idempotencyKeyPrefix: idempotencyKey.slice(0, 16),
      statusVersion: "1.0.4",
      admittedAtEpochMs: Date.now(),
      complianceDomain: "EU",
    };
  };

  // 4. WORKER LEASE NEXT JOB
  const leaseNextJob = (workerId: string, leaseMs: number = 15000): SimJob | null => {
    let leasedJob: SimJob | null = null;

    setState((prev) => {
      // Find first job that is QUEUED, budget hasn't failed out, and availableAt <= now
      const now = Date.now();
      const jobIdx = prev.jobs.findIndex(
        (j) => j.status === JobStatus.QUEUED && j.availableAt <= now && j.attempts < j.maxAttempts
      );

      if (jobIdx === -1) return prev;

      const job = prev.jobs[jobIdx];
      const leaseToken = generateUUID();
      const nextLeaseExpires = now + leaseMs;

      leasedJob = {
        ...job,
        status: JobStatus.RUNNING,
        attempts: job.attempts + 1,
        leaseToken,
        leaseExpiresAt: nextLeaseExpires,
        updatedAt: now,
      };

      const nextEvents: SimJobEvent[] = [
        {
          eventId: "evt_" + generateId(),
          jobId: job.jobId,
          tenantId: job.tenantId,
          eventType: "JOB_LEASE_GRANTED",
          fromStatus: JobStatus.QUEUED,
          toStatus: JobStatus.RUNNING,
          payload: JSON.stringify({ workerId, leaseToken, expiresAt: nextLeaseExpires }),
          createdAt: now,
        },
        ...prev.jobEvents,
      ];

      const updatedJobs = [...prev.jobs];
      updatedJobs[jobIdx] = leasedJob;

      return {
        ...prev,
        jobs: updatedJobs,
        jobEvents: nextEvents,
      };
    });

    if (leasedJob) {
      const jobRef = leasedJob as SimJob;
      logMessage(`[Postgres DB] Worker ${workerId} acquired lease on ${jobRef.jobId.slice(0, 8)}... Token: ${jobRef.leaseToken?.slice(0, 8)}`, "postgres");
      appendAudit(
        jobRef.jobId,
        jobRef.transactionId,
        jobRef.tenantId,
        "LEASE_GRANTED",
        jobRef.maxBudgetUsd,
        jobRef.checksum,
        { leaseToken: jobRef.leaseToken, expiresAt: jobRef.leaseExpiresAt, workerId }
      );
    }

    return leasedJob;
  };

  // 5. WORKER SETTLEMENT (SUCCESS PATH)
  const settleJobSuccess = (params: {
    jobId: string;
    leaseToken: string;
    actualAmountUsd: string;
    outputRef: string;
  }) => {
    const { jobId, leaseToken, actualAmountUsd, outputRef } = params;
    let errorMsg: string | null = null;
    let details: any = null;

    setState((prev) => {
      const jobIdx = prev.jobs.findIndex((j) => j.jobId === jobId);
      if (jobIdx === -1) {
        errorMsg = "JOB_NOT_FOUND";
        return prev;
      }

      const job = prev.jobs[jobIdx];

      // CRITICAL ROW COUNT ASSERTION SIMULATION!!
      // Status update fails if lease_token doesn't match
      if (job.leaseToken !== leaseToken || job.status !== JobStatus.RUNNING) {
        errorMsg = "STALE_LEASE_OR_ALREADY_FINALIZED";
        return prev;
      }

      // Settle Redis funds: calculate refund
      const maxBudget = new PreciseDecimal(job.maxBudgetUsd);
      const actualCost = new PreciseDecimal(actualAmountUsd);

      if (actualCost.isGreaterThan(maxBudget)) {
        errorMsg = "ACTUAL_EXCEEDS_RESERVED";
        return prev;
      }

      const refund = maxBudget.subtract(actualCost);

      // Perform atomic moving
      const tenantIdx = prev.tenants.findIndex((t) => t.tenantId === job.tenantId);
      const updatedTenants = [...prev.tenants];
      if (tenantIdx !== -1) {
        const tenant = updatedTenants[tenantIdx];
        const currentReserved = new PreciseDecimal(tenant.reservedUsd);
        const currentCollected = new PreciseDecimal(tenant.collectedUsd);
        const currentAvailable = new PreciseDecimal(tenant.availableUsd);

        // Deduct from reserved
        const nextReserved = currentReserved.subtract(maxBudget).toString();
        // Add actual cost list to collected
        const nextCollected = currentCollected.add(actualCost).toString();
        // Return refund back to tenant available balance!
        const nextAvailable = currentAvailable.add(refund).toString();

        updatedTenants[tenantIdx] = {
          ...tenant,
          reservedUsd: nextReserved,
          collectedUsd: nextCollected,
          availableUsd: nextAvailable,
        };
      }

      // Settle reservation status in Redis
      const nextReservations = { ...prev.redisReservations };
      if (nextReservations[job.reservationId]) {
        nextReservations[job.reservationId].status = "SETTLED";
      }

      // Mark Job SUCCEEDED in durables DB
      const nextJob: SimJob = {
        ...job,
        status: JobStatus.SUCCEEDED,
        actualAmountUsd,
        leaseToken: null,
        leaseExpiresAt: null,
        finishedAt: Date.now(),
        updatedAt: Date.now(),
      };

      const updatedJobs = [...prev.jobs];
      updatedJobs[jobIdx] = nextJob;

      const nextEvents: SimJobEvent[] = [
        {
          eventId: "evt_" + generateId(),
          jobId,
          tenantId: job.tenantId,
          eventType: "JOB_SUCCEEDED",
          fromStatus: JobStatus.RUNNING,
          toStatus: JobStatus.SUCCEEDED,
          payload: JSON.stringify({ actual_amount_usd: actualAmountUsd, output_ref: outputRef, refund: refund.toString() }),
          createdAt: Date.now(),
        },
        ...prev.jobEvents,
      ];

      details = {
        tenantId: job.tenantId,
        transactionId: job.transactionId,
        reservationId: job.reservationId,
        refundAmount: refund.toString(),
        checksum: job.checksum,
      };

      return {
        ...prev,
        tenants: updatedTenants,
        redisReservations: nextReservations,
        jobs: updatedJobs,
        jobEvents: nextEvents,
      };
    });

    if (errorMsg) {
      logMessage(`[Postgres DB] mark_succeeded FAILED for job ${jobId.slice(0, 8)}... Cause: ${errorMsg}`, "error");
      throw new Error(errorMsg);
    }

    logMessage(`[Redis Ledg] Settle check: collected $${actualAmountUsd}, returned change $${details.refundAmount} to tenant available. Close Resv: ${details.reservationId}`, "redis");
    logMessage(`[Postgres DB] Success transaction committed: UPDATE 1 affected. Job ${jobId.slice(0, 8)} status -> SUCCEEDED`, "success");

    appendAudit(
      jobId,
      details.transactionId,
      details.tenantId,
      "FUNDS_SETTLED",
      actualAmountUsd,
      details.checksum,
      { reservationId: details.reservationId, actualAmountUsd, refund: details.refundAmount }
    );

    appendAudit(
      jobId,
      details.transactionId,
      details.tenantId,
      "JOB_SUCCEEDED",
      actualAmountUsd,
      details.checksum,
      { outputRef }
    );
  };

  // 6. WORKER SETTLEMENT (FAILURE PATH)
  const settleJobFailed = (params: {
    jobId: string;
    leaseToken: string;
    errorCode: string;
    errorMessage: string;
    retryable: boolean;
  }) => {
    const { jobId, leaseToken, errorCode, errorMessage, retryable } = params;
    let errorMsg: string | null = null;
    let details: any = null;

    setState((prev) => {
      const jobIdx = prev.jobs.findIndex((j) => j.jobId === jobId);
      if (jobIdx === -1) {
        errorMsg = "JOB_NOT_FOUND";
        return prev;
      }

      const job = prev.jobs[jobIdx];

      // ROW COUNT LEASE VALIDATION TO OVERCOME STALE LEASES
      if (job.leaseToken !== leaseToken || job.status !== JobStatus.RUNNING) {
        errorMsg = "STALE_LEASE_OR_ALREADY_FINALIZED";
        return prev;
      }

      const updatedJobs = [...prev.jobs];
      const nextStatus = retryable ? JobStatus.QUEUED : JobStatus.FAILED;
      const now = Date.now();

      // If NOT retryable, trigger automatic compensation to release locked funds back to tenant budget
      const nextReservations = { ...prev.redisReservations };
      const updatedTenants = [...prev.tenants];

      if (!retryable) {
        // Release funds
        if (nextReservations[job.reservationId]) {
          nextReservations[job.reservationId].status = "RELEASED";
          nextReservations[job.reservationId].reason = errorCode;
        }

        const tenantIdx = prev.tenants.findIndex((t) => t.tenantId === job.tenantId);
        if (tenantIdx !== -1) {
          const tenant = updatedTenants[tenantIdx];
          const reservedDecimal = new PreciseDecimal(tenant.reservedUsd);
          const maxBudgetDecimal = new PreciseDecimal(job.maxBudgetUsd);
          const availableDecimal = new PreciseDecimal(tenant.availableUsd);

          updatedTenants[tenantIdx] = {
            ...tenant,
            reservedUsd: reservedDecimal.subtract(maxBudgetDecimal).toString(),
            availableUsd: availableDecimal.add(maxBudgetDecimal).toString(),
          };
        }
      }

      const nextJob: SimJob = {
        ...job,
        status: nextStatus,
        leaseToken: null,
        leaseExpiresAt: null,
        lastErrorCode: errorCode,
        lastErrorMessage: errorMessage,
        retryable,
        availableAt: retryable ? now + 5000 : job.availableAt, // back-off penalty 5s
        updatedAt: now,
        finishedAt: !retryable ? now : null,
      };

      updatedJobs[jobIdx] = nextJob;

      const nextEvents: SimJobEvent[] = [
        {
          eventId: "evt_" + generateId(),
          jobId,
          tenantId: job.tenantId,
          eventType: retryable ? "JOB_FAILED_RETRYING" : "JOB_FAILED_FATAL",
          fromStatus: JobStatus.RUNNING,
          toStatus: nextStatus,
          payload: JSON.stringify({ error_code: errorCode, error_message: errorMessage, retryable }),
          createdAt: now,
        },
        ...prev.jobEvents,
      ];

      details = {
        tenantId: job.tenantId,
        transactionId: job.transactionId,
        reservationId: job.reservationId,
        amount: job.maxBudgetUsd,
        checksum: job.checksum,
      };

      return {
        ...prev,
        tenants: updatedTenants,
        redisReservations: nextReservations,
        jobs: updatedJobs,
        jobEvents: nextEvents,
      };
    });

    if (errorMsg) {
      logMessage(`[Postgres DB] mark_failed FAILED for job ${jobId.slice(0, 8)}... Cause: ${errorMsg}`, "error");
      throw new Error(errorMsg);
    }

    if (retryable) {
      logMessage(`[Postgres DB] Job failed with temporary error '${errorCode}'. Backoff applied. Status -> QUEUED`, "warn");
    } else {
      logMessage(`[Redis Ledg] Fatal error detected. Automatically released reservation ${details.reservationId} and restored $${details.amount} to tenant balance.`, "redis");
      logMessage(`[Postgres DB] Fatal error committed: UPDATE 1 affected. Job status -> FAILED`, "error");

      appendAudit(
        jobId,
        details.transactionId,
        details.tenantId,
        "FUNDS_RELEASED",
        details.amount,
        details.checksum,
        { reservationId: details.reservationId, reason: errorCode }
      );

      appendAudit(
        jobId,
        details.transactionId,
        details.tenantId,
        "JOB_FAILED",
        "0.000000",
        details.checksum,
        { errorCode, errorMessage }
      );
    }
  };

  // 7. SWEEPER PROCESS FOR REQUEUING EXPIRED LEASES
  const requeueExpiredJobs = (): number => {
    let affectedQuantity = 0;
    const now = Date.now();

    setState((prev) => {
      const updatedJobs = [...prev.jobs];
      let updatedEvents = [...prev.jobEvents];

      prev.jobs.forEach((j, idx) => {
        if (
          j.status === JobStatus.RUNNING &&
          j.leaseExpiresAt !== null &&
          j.leaseExpiresAt < now &&
          j.attempts < j.maxAttempts
        ) {
          affectedQuantity += 1;
          
          updatedJobs[idx] = {
            ...j,
            status: JobStatus.QUEUED,
            leaseToken: null,
            leaseExpiresAt: null,
            availableAt: now + 5000, // delay retry by 5 seconds
            updatedAt: now,
          };

          updatedEvents = [
            {
              eventId: "evt_" + generateId(),
              jobId: j.jobId,
              tenantId: j.tenantId,
              eventType: "LEASE_EXPIRED_REQUEUED",
              fromStatus: JobStatus.RUNNING,
              toStatus: JobStatus.QUEUED,
              payload: JSON.stringify({ expiredAt: j.leaseExpiresAt, requeuedAt: now }),
              createdAt: now,
            },
            ...updatedEvents,
          ];

          logMessage(`[Sweeper] Detected expired lease on job ${j.jobId.slice(0, 8)}... Clear lease token, requeued!`, "warn");
        }
      });

      return {
        ...prev,
        jobs: updatedJobs,
        jobEvents: updatedEvents,
      };
    });

    return affectedQuantity;
  };

  return {
    executeGovernanceFlow,
    leaseNextJob,
    settleJobSuccess,
    settleJobFailed,
    requeueExpiredJobs,
  };
}

