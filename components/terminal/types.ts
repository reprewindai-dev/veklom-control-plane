/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AgentStatus = 'Idle' | 'Active' | 'Blocked';

export interface AgentNode {
  id: string;
  name: string;
  role: 'Executor' | 'Validator' | 'Orchestrator' | 'Arbiter' | 'Router';
  department: 'Engineering' | 'Growth' | 'Ops' | 'Research' | 'Revenue';
  status: AgentStatus;
  mission: string;
  toolScopes: string[];
  metrics: {
    cpu: number;
    memory: number;
    latency: number;
    requestCount: number;
  };
  telemetryLogs: string[];
  x: number;
  y: number;
}

export type RunStatus = 'completed' | 'running' | 'failed' | 'queued';
export type SpineStep = 'Intent' | 'Plan' | 'cAPI Gateway' | 'ArbiterOS' | 'Redis Lua' | 'Attestation';

export interface VeklomRun {
  id: string;
  intent: string;
  status: RunStatus;
  timestamp: string;
  duration: string; // e.g. "124ms"
  currentStep: SpineStep;
  steps: {
    name: SpineStep;
    status: 'pending' | 'active' | 'completed' | 'failed';
    hash?: string;
    details: string;
  }[];
  attestation: {
    seked: 'pending' | 'passed' | 'failed';
    arbiter: 'pending' | 'passed' | 'failed';
    converge: 'pending' | 'passed' | 'failed';
  };
  evidenceCount: number;
  policyRule: string;
  policyStatus: 'passed' | 'warning' | 'violated';
  policyDetails: string;
  hash: string;
}

export interface Delegate {
  id: string;
  name: string;
  department: 'Engineering' | 'Growth' | 'Ops' | 'Research' | 'Revenue';
  weight: number; // 0 to 100
  vote: 'yea' | 'nay' | 'abstain' | 'pending';
  lastAttestation: string;
  influence: number; // percentage
}

export interface TelemetryTick {
  timestamp: string;
  source: string;
  message: string;
  type: 'info' | 'success' | 'warn' | 'error';
}
