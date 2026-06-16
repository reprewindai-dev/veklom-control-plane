// @ts-nocheck
"use client";
export type SeverityType = 'critical' | 'high' | 'medium' | 'low';

export interface SystemState {
  redisStatus: 'online' | 'offline' | 'degraded';
  lockState: 'idle' | 'active_lock' | 'unlocked';
  activeWorkers: number;
  routerQueueSize: number;
  byteFloatFormat: 'IEEE 754 Big Endian' | 'IEEE 754 Little Endian';
  activeConnectionsCount: number;
  lastResponseStatus: string;
}

export interface SimulationStep {
  id: number;
  title: string;
  description: string;
  actor: 'Client' | 'API Proxy' | 'Rust Router' | 'Redis Lock Gate' | 'Worker VM' | 'Audit Logger';
  status: 'pending' | 'active' | 'success' | 'failure' | 'mitigated';
  codeSnippet?: string;
}

export interface FaultParameter {
  id: string;
  name: string;
  type: 'select' | 'slider' | 'toggle';
  value: any;
  options?: string[];
  min?: number;
  max?: number;
  unit?: string;
  description: string;
}

export interface FailureEvent {
  id: string;
  name: string;
  shortImpact: string;
  immediateImpact: string;
  mitigationArchitecture: string;
  severity: SeverityType;
  componentAffected: string;
  lockType: string;
  recoveryTtl: string;
  scenarioSteps: SimulationStep[];
  parameters: FaultParameter[];
  codeReference: string;
}

