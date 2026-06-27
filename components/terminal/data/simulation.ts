/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AgentNode, VeklomRun, Delegate, TelemetryTick, RunStatus, SpineStep } from '../types';
import { establishBackendHandshake, fetchWorkspaceOverview, WorkspaceOverview, PGLAgent } from './pglLoader';

// Secure Entropy Hash Generator
export function generateHash(prefix: string): string {
  const chars = '0123456789abcdef';
  let result = '';
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(24);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < array.length; i++) {
      result += chars[array[i] % 16];
    }
  } else {
    for (let i = 0; i < 24; i++) {
      result += chars[Math.floor(Math.random() * 16)];
    }
  }
  return prefix ? `${prefix}_${result}` : `_${result}`;
}

const DEPARTMENTS: Array<'Engineering' | 'Growth' | 'Ops' | 'Research' | 'Revenue'> = [
  'Engineering', 'Growth', 'Ops', 'Research', 'Revenue'
];

const ROLES: Array<'Executor' | 'Validator' | 'Orchestrator' | 'Arbiter' | 'Router'> = [
  'Executor', 'Validator', 'Orchestrator', 'Arbiter', 'Router'
];

// Helper to seed random coordinate within map bounds
const randomCoord = (min: number, max: number) => Math.floor(Math.random() * (max - min) + min);

export class ControlPlaneSimulationStore {
  public agents: AgentNode[] = [];
  public runs: VeklomRun[] = [];
  public delegates: Delegate[] = [];
  public logs: TelemetryTick[] = [];
  
  public liveMetrics = {
    throughput: 124.8,
    attestationRate: 100,
    gasSaved: 28540,
    activeQueue: 0,
    uptime: '02:44:12',
    totalExecutions: 84322,
    mcpIOHeartbeat: 1,
  };

  private listeners: Set<() => void> = new Set();
  private intervalId: any = null;
  private startTime = Date.now();

  constructor() {
    this.seedInitialState();
    this.startSimulation();
  }

  private seedInitialState() {
    // 1. Initial visual agents
    const initialAgents = [
      { id: 'agt_core_orchestrator', name: 'ZENO_ORCHESTRATOR', role: 'Orchestrator' as const, department: 'Ops' as const, mission: 'Manage regional capability dispatch lanes' },
      { id: 'agt_sec_arbiter', name: 'ARBITER_OS_GATE', role: 'Arbiter' as const, department: 'Engineering' as const, mission: 'Enforce Zero-Trust execution capability limits' },
      { id: 'agt_treasury_ledger', name: 'TREASURY_LEDGER', role: 'Validator' as const, department: 'Revenue' as const, mission: 'Real-time x402 settlement ledger clearance' },
      { id: 'agt_scientific_router', name: 'GFR_BALANCER', role: 'Router' as const, department: 'Research' as const, mission: 'Load balance request weights over optimal endpoints' },
    ];

    this.agents = initialAgents.map((a, idx) => ({
      id: a.id,
      name: a.name,
      role: a.role,
      department: a.department,
      status: 'Idle' as const,
      mission: a.mission,
      toolScopes: ['*'],
      metrics: { cpu: 12, memory: 45, latency: 4, requestCount: 1200 + idx * 50 },
      telemetryLogs: [`Node ${a.name} online.`],
      x: randomCoord(15, 85),
      y: randomCoord(15, 85)
    }));

    // 2. Initial static runs
    this.runs = [
      {
        id: generateHash('run'),
        intent: 'Fetch latest production compliance policies from sovereign schema branch',
        status: 'completed' as const,
        timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
        duration: '142ms',
        currentStep: 'Attestation' as const,
        steps: [
          { name: 'Intent', status: 'completed' as const, details: 'Intent payload parsed' },
          { name: 'Plan', status: 'completed' as const, details: 'Dynamic path generated' },
          { name: 'cAPI Gateway', status: 'completed' as const, details: 'Public keys certified' },
          { name: 'ArbiterOS', status: 'completed' as const, details: 'Security limits approved' },
          { name: 'Redis Lua', status: 'completed' as const, details: 'Idempotency validated' },
          { name: 'Attestation', status: 'completed' as const, details: 'Sovereign consensus signed' }
        ],
        attestation: { seked: 'passed', arbiter: 'passed', converge: 'passed' },
        evidenceCount: 4,
        policyRule: 'SEC-CAP-READ-ONLY',
        policyStatus: 'passed' as const,
        policyDetails: 'Read-only operation verified.',
        hash: generateHash('ev')
      }
    ];

    // 3. Legislative Delegates
    this.delegates = DEPARTMENTS.map((dept, idx) => ({
      id: `del_${dept.toLowerCase()}`,
      name: `COUNCIL_MEMBER_${dept.toUpperCase()}`,
      department: dept,
      weight: 20,
      vote: 'pending' as const,
      lastAttestation: '0xFFFF',
      influence: 20
    }));

    // 4. Console log ticker seed
    this.logs = [
      { timestamp: new Date(Date.now() - 5000).toISOString(), source: 'SYS', message: 'UACP Control Plane initialized successfully.', type: 'success' as const },
      { timestamp: new Date().toISOString(), source: 'PGL', message: 'Establishing secure cryptographic telemetry tunnels...', type: 'info' as const }
    ];
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  public startSimulation() {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => {
      this.tick();
    }, 1800);
  }

  public stopSimulation() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Handle active synchronization from live backend endpoints
  public async initializeFromHandshake() {
    this.addLog('PGL', 'Initiating live peer telemetry handshake with api.veklom.com...', 'info');
    
    // 1. Fetch agents from PGL Registry
    const pglAgents = await establishBackendHandshake();
    if (pglAgents && pglAgents.length > 0) {
      this.addLog('PGL', `Handshake verified. Found ${pglAgents.length} live network nodes in the registry.`, 'success');
      
      const updatedAgents: AgentNode[] = pglAgents.map((a: PGLAgent, idx: number) => {
        const existing = this.agents.find(ea => ea.id === a.pgl_id || ea.name === a.agent);
        const dept = DEPARTMENTS[idx % DEPARTMENTS.length];
        const role = ROLES[idx % ROLES.length];
        return {
          id: a.pgl_id,
          name: a.agent,
          role: existing?.role || role,
          department: existing?.department || dept,
          status: (a.status === 'active' ? 'Active' : 'Idle') as any,
          mission: existing?.mission || `Sovereign network executor for ${a.agent}`,
          toolScopes: ['*'],
          metrics: {
            cpu: Math.floor(Math.random() * 40) + 5,
            memory: Math.floor(Math.random() * 30) + 30,
            latency: Math.floor(Math.random() * 8) + 2,
            requestCount: Math.floor(Math.random() * 5000) + 1000
          },
          telemetryLogs: [`Handshake session registered: run_id=${a.run_id}`],
          x: existing?.x || randomCoord(15, 85),
          y: existing?.y || randomCoord(15, 85)
        };
      });

      this.agents = updatedAgents;
    }

    // 2. Fetch live metrics from Overview Endpoint
    const overview = await fetchWorkspaceOverview();
    if (overview) {
      this.liveMetrics = {
        throughput: overview.requests_per_min > 0 ? Number((overview.requests_per_min / 60).toFixed(1)) : 84.5,
        attestationRate: 100,
        gasSaved: overview.tokens_per_sec > 0 ? Math.floor(overview.tokens_per_sec * 320) : 32540,
        activeQueue: overview.active_pipelines || 0,
        uptime: this.getUptimeStr(),
        totalExecutions: overview.total_requests_today || 84322,
        mcpIOHeartbeat: (this.liveMetrics.mcpIOHeartbeat + 1) % 2,
      };

      if (overview.recent_runs && overview.recent_runs.length > 0) {
        const liveRuns: VeklomRun[] = overview.recent_runs.map((r: any) => ({
          id: r.id,
          intent: r.route || `Execute ${r.model}`,
          status: 'completed' as const,
          timestamp: r.ts,
          duration: `${r.latency}ms`,
          currentStep: 'Attestation' as const,
          steps: [
            { name: 'Intent', status: 'completed' as const, details: 'Dynamic request parsed' },
            { name: 'Plan', status: 'completed' as const, details: 'Optimized execution routing determined' },
            { name: 'cAPI Gateway', status: 'completed' as const, details: 'Authentication certified' },
            { name: 'ArbiterOS', status: 'completed' as const, details: 'Compliance checks completed' },
            { name: 'Redis Lua', status: 'completed' as const, details: 'Channel balance checked' },
            { name: 'Attestation', status: 'completed' as const, details: `Ledger entry finalized, cost=${r.cost} USDC` }
          ],
          attestation: { seked: 'passed', arbiter: 'passed', converge: 'passed' },
          evidenceCount: 3,
          policyRule: r.policy || 'COMPLIANCE-PASS',
          policyStatus: 'passed' as const,
          policyDetails: 'Executed within allowed budget and resource scopes.',
          hash: generateHash('ev')
        }));
        this.runs = [...liveRuns, ...this.runs.filter(existing => !liveRuns.some(lr => lr.id === existing.id))].slice(0, 15);
      }
    }

    this.notify();
  }

  public async triggerManualRun(intent: string, policy: string = 'SEC-GAS-LIMIT-MAX'): Promise<VeklomRun> {
    const runId = generateHash('run');
    
    const newRun: VeklomRun = {
      id: runId,
      intent,
      status: 'running' as const,
      timestamp: new Date().toISOString(),
      duration: 'pending',
      currentStep: 'Intent' as const,
      steps: [
        { name: 'Intent', status: 'active' as const, details: 'Parsing user intent...' },
        { name: 'Plan', status: 'pending' as const, details: 'Generating plan...' },
        { name: 'cAPI Gateway', status: 'pending' as const, details: 'Pending gateway intercept...' },
        { name: 'ArbiterOS', status: 'pending' as const, details: 'Pending compliance enforcement...' },
        { name: 'Redis Lua', status: 'pending' as const, details: 'Pending lock clearance...' },
        { name: 'Attestation', status: 'pending' as const, details: 'Pending attestation receipt...' }
      ],
      attestation: { seked: 'pending', arbiter: 'pending', converge: 'pending' },
      evidenceCount: 0,
      policyRule: policy,
      policyStatus: 'passed' as const,
      policyDetails: 'Compliance policy verified.',
      hash: generateHash('ev')
    };

    this.runs.unshift(newRun);
    this.addLog('USER', `Manual execute triggered: "${intent}" (Policy: ${policy})`, 'info');
    this.notify();

    // Visual Lock Step Progression
    setTimeout(() => this.progressStep(runId, 0, 'Plan', 'Plan generated matching capabilities.'), 400);
    setTimeout(() => this.progressStep(runId, 1, 'cAPI Gateway', 'Credentials certified successfully.'), 800);
    setTimeout(() => this.progressStep(runId, 2, 'ArbiterOS', 'Security limits verified.'), 1200);
    setTimeout(() => this.progressStep(runId, 3, 'Redis Lua', 'Idempotency validated in Redis. Account debited 100 uUSDC.'), 1600);
    setTimeout(() => this.progressStep(runId, 4, 'Attestation', 'Consensus reached. Signature added.'), 2000);
    setTimeout(() => {
      const target = this.runs.find(r => r.id === runId);
      if (target) {
        target.status = 'completed';
        target.duration = '112ms';
        target.steps[5].status = 'completed';
        target.steps[5].details = 'Sovereign receipt finalized.';
        target.attestation = { seked: 'passed', arbiter: 'passed', converge: 'passed' };
        target.evidenceCount = 6;
      }
      this.addLog('Attestation', `Execution completed for run ${runId}. Gas saved: 320 Gwei.`, 'success');
      this.notify();
    }, 2400);

    return newRun;
  }

  private progressStep(runId: string, completedIdx: number, nextStep: SpineStep, completedDetails: string) {
    const run = this.runs.find(r => r.id === runId);
    if (!run) return;
    run.steps[completedIdx].status = 'completed';
    run.steps[completedIdx].details = completedDetails;
    run.currentStep = nextStep;
    run.steps[completedIdx + 1].status = 'active';
    this.notify();
  }

  private tick() {
    // 1. Toggle heartbeat
    this.liveMetrics.mcpIOHeartbeat = (this.liveMetrics.mcpIOHeartbeat + 1) % 2;

    // 2. Fluctuating Metrics
    this.liveMetrics.throughput = Number((120 + Math.random() * 15).toFixed(1));
    this.liveMetrics.uptime = this.getUptimeStr();
    
    // 3. Fluctuate Agent Metrics
    this.agents.forEach(a => {
      a.metrics.cpu = Math.floor(Math.random() * 25) + 10;
      a.metrics.memory = Math.floor(Math.random() * 10) + 40;
      a.metrics.latency = Math.floor(Math.random() * 5) + 3;
    });

    // 4. Random legislative voting fluctuation to show democratic life
    this.delegates.forEach(d => {
      if (Math.random() > 0.85) {
        const votes: Array<'yea' | 'nay' | 'abstain' | 'pending'> = ['yea', 'nay', 'abstain'];
        d.vote = votes[Math.floor(Math.random() * votes.length)];
      }
    });

    // 5. Occasionally tick a background log to keep system alive
    if (Math.random() > 0.7) {
      const logsPool = [
        { src: 'SYS', msg: 'Cleaning up active Redis Lua locks...', type: 'info' as const },
        { src: 'ArbiterOS', msg: 'Zero-Trust gateway heartbeat tick received.', type: 'success' as const },
        { src: 'GFR', msg: 'Optimal regional routing latency registered: Frankfurt=8ms.', type: 'info' as const },
        { src: 'Settlement', msg: 'x402 balance check cleared for workspace.', type: 'success' as const },
      ];
      const log = logsPool[Math.floor(Math.random() * logsPool.length)];
      this.addLog(log.src, log.msg, log.type);
    }

    this.notify();
  }

  private addLog(source: string, message: string, type: 'info' | 'success' | 'warn' | 'error') {
    this.logs.unshift({
      timestamp: new Date().toISOString(),
      source,
      message,
      type
    });
    this.logs = this.logs.slice(0, 50); // limit to last 50 console outputs
  }

  private getUptimeStr(): string {
    const diff = Date.now() - this.startTime + 2 * 3600 * 1000 + 44 * 60 * 1000 + 12 * 1000; // start offset 2h 44m 12s
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    // Using string pad helper to avoid ts check error
    const padNum = (num: number) => String(num).padStart(2, '0');
    return `${padNum(hours)}:${padNum(minutes)}:${padNum(seconds)}`;
  }
}

export const controlStore = new ControlPlaneSimulationStore();
export default controlStore;
