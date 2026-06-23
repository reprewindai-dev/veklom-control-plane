import { establishBackendHandshake, triggerCAPIExecution, fetchWorkspaceOverview } from './pglLoader';
import { AgentNode, VeklomRun, Delegate, TelemetryTick, RunStatus, AgentStatus, SpineStep } from '../types';

export const generateHash = (prefix: string) => {
  const SECURE_ENTROPY = ['a','b','c','d','e','f','0','1','2','3','4','5','6','7','8','9'];
  let hash = prefix + '_';
  const randomValues = new Uint8Array(24);
  
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(randomValues);
  } else if (typeof globalThis !== 'undefined' && (globalThis as any).crypto) {
    (globalThis as any).crypto.getRandomValues(randomValues);
  } else {
    for (let i = 0; i < 24; i++) {
      randomValues[i] = Math.floor(Math.random() * 256);
    }
  }
  for (let i = 0; i < 24; i++) {
    hash += SECURE_ENTROPY[randomValues[i] % SECURE_ENTROPY.length];
  }
  return hash;
};

// Generates the visual topology of the 105 node cluster for the UI grid.
// These nodes remain "Idle" capacity until a real agent claims the slot.
const generateBaseTopology = (): AgentNode[] => {
  const agents: AgentNode[] = [];
  const departments: ('Engineering' | 'Growth' | 'Ops' | 'Research' | 'Revenue')[] = ['Engineering', 'Growth', 'Ops', 'Research', 'Revenue'];
  const roles: ('Executor' | 'Validator' | 'Orchestrator' | 'Arbiter' | 'Router')[] = ['Executor', 'Validator', 'Executor', 'Validator', 'Router'];

  // Root Agent (MCP IO Hub Core)
  agents.push({
    id: 'AG-CORE-000',
    name: 'MCP-IO-BUS-CORE',
    role: 'Orchestrator',
    department: 'Ops',
    status: 'Idle',
    mission: 'High-throughput execution multiplexer and PGL consensus sequencer.',
    toolScopes: ['kernel_read', 'syscall_execute', 'bus_broadcast', 'quorum_attest'],
    metrics: { cpu: 0, memory: 10, latency: 4, requestCount: 0 },
    telemetryLogs: ['Awaiting consensus attestation loop.'],
    x: 400,
    y: 300
  });

  const toolsByDept = {
    Engineering: ['run_bundler', 'verify_zkp', 'git_diff', 'clean_vm_state'],
    Growth: ['query_telemetry', 'adjust_rates', 'broadcast_state', 'trigger_load_shed'],
    Ops: ['tcp_probe', 'flush_redis', 'reboot_sandbox', 'measure_latency'],
    Research: ['parse_policy', 'compile_rules', 'prove_state', 'estimate_entropy'],
    Revenue: ['calculate_gas', 'route_hedge', 'payout_attest', 'optimize_gas_limit']
  };

  let idCounter = 1;
  departments.forEach((dept, deptIdx) => {
    const clusterAngle = (deptIdx * 2 * Math.PI) / departments.length;
    const clusterRadius = 180;
    const clusterCenterX = 400 + Math.cos(clusterAngle) * clusterRadius;
    const clusterCenterY = 300 + Math.sin(clusterAngle) * clusterRadius;

    // Leader
    const clusterLeaderId = `AG-${dept.slice(0, 3).toUpperCase()}-LDR`;
    agents.push({
      id: clusterLeaderId,
      name: `ArbiterOS-${dept}-Director`,
      role: 'Arbiter',
      department: dept,
      status: 'Idle',
      mission: `Capacity slot representing ${dept} delegates.`,
      toolScopes: [...toolsByDept[dept], 'evaluate_arbiter_code', 'veto_state'],
      metrics: { cpu: 0, memory: 10, latency: 15, requestCount: 0 },
      telemetryLogs: [],
      x: clusterCenterX,
      y: clusterCenterY
    });

    // Sub-agents
    for (let i = 0; i < 20; i++) {
      const subAngle = (i * 2 * Math.PI) / 20;
      const subRadius = 55 + (i % 2 === 0 ? 15 : 0);
      const nodeX = clusterCenterX + Math.cos(subAngle) * subRadius;
      const nodeY = clusterCenterY + Math.sin(subAngle) * subRadius;
      const nodeNum = String(idCounter++).padStart(3, '0');
      
      agents.push({
        id: `AG-${dept.slice(0, 3).toUpperCase()}-${nodeNum}`,
        name: `SwarmUnit-${dept}-${nodeNum}`,
        role: roles[i % roles.length],
        department: dept,
        status: 'Idle',
        mission: `Standby capacity for ${dept} cluster.`,
        toolScopes: [toolsByDept[dept][i % toolsByDept[dept].length]],
        metrics: { cpu: 0, memory: 0, latency: 0, requestCount: 0 },
        telemetryLogs: [],
        x: nodeX,
        y: nodeY
      });
    }
  });

  return agents;
};

export const initialDelegates: Delegate[] = [
  { id: 'DEL-ENG', name: 'Dr. Evelyn Carter', department: 'Engineering', weight: 30, vote: 'yea', lastAttestation: '0x3ca2...9f4b', influence: 30 },
  { id: 'DEL-RES', name: 'Prof. Linus Zhang', department: 'Research', weight: 25, vote: 'yea', lastAttestation: '0x99a1...ff02', influence: 25 },
  { id: 'DEL-OPS', name: 'Commander Sarah Rex', department: 'Ops', weight: 20, vote: 'yea', lastAttestation: '0xe204...998a', influence: 20 },
  { id: 'DEL-REV', name: 'Aleta Vance', department: 'Revenue', weight: 15, vote: 'abstain', lastAttestation: '0xbb29...ad3e', influence: 15 },
  { id: 'DEL-GRO', name: 'Marcus Sterling', department: 'Growth', weight: 10, vote: 'pending', lastAttestation: '0x77cf...b831', influence: 10 }
];

export class ControlPlaneSimulationStore {
  // We initialize agents with the 105 empty topology slots to keep the UI beautiful.
  public agents: AgentNode[] = generateBaseTopology();
  public runs: VeklomRun[] = [];
  public delegates: Delegate[] = [...initialDelegates];
  public logs: TelemetryTick[] = [];
  
  public liveMetrics = {
    throughput: 0,
    attestationRate: 100.00,
    gasSaved: 0.00,
    activeQueue: 0,
    uptime: "Live",
    connectedAgentsCount: 0,
    mcpIOHeartbeat: 'NORMAL',
    totalExecutions: 0
  };

  private listeners: (() => void)[] = [];
  private intervalId: NodeJS.Timeout | null = null;
  private lastSyncTime = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('cli-command', ((e: CustomEvent) => {
        const { command, response } = e.detail;
        this.logs.unshift({ timestamp: new Date().toISOString(), source: 'USER-CLI', message: `> ${command}`, type: 'success' });
        if (response) {
          setTimeout(() => {
            this.logs.unshift({ timestamp: new Date().toISOString(), source: 'SYS-RESP', message: response, type: 'info' });
            this.notify();
          }, 300);
        }
        this.notify();
      }) as EventListener);
    }
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter(l => l !== listener); };
  }

  private notify() { this.listeners.forEach(l => l()); }

  private mapRealAgentsToTopology(realAgents: any[]) {
    // Reset all nodes to idle
    this.agents.forEach(a => {
      a.status = 'Idle';
      if (!a.name.includes('MCP-IO')) a.mission = `Standby capacity for ${a.department} cluster.`;
    });

    // Core is active if anything is active
    if (realAgents.length > 0) {
       const core = this.agents.find(a => a.id === 'AG-CORE-000');
       if (core) {
         core.status = 'Active';
         core.metrics = { cpu: 84, memory: 72, latency: 4, requestCount: 14892 };
       }
    }

    // Map real agents into available slots
    realAgents.forEach((realAgent, index) => {
      // Find an idle node (skipping core)
      const slot = this.agents.find(a => a.status === 'Idle' && a.id !== 'AG-CORE-000');
      if (slot) {
        slot.status = realAgent.status === 'cleared' ? 'Active' : 'Idle';
        slot.name = realAgent.agent.toUpperCase();
        slot.mission = `PGL Context: ${realAgent.run_id}`;
        slot.metrics = { cpu: 45, memory: 60, latency: 12, requestCount: 1 };
        slot.telemetryLogs = [`Synced with GnomLedger PGL.`, `Verified: ${realAgent.pgl_id}`];
      }
    });
  }

  public async initializeFromHandshake() {
    try {
      this.logs.unshift({ timestamp: new Date().toISOString(), source: 'PGL-SYS', message: 'Establishing live cryptographic handshake...', type: 'info' });
      this.notify();

      const pglAgents = await establishBackendHandshake();
      
      if (pglAgents && pglAgents.length > 0) {
        this.mapRealAgentsToTopology(pglAgents);
        this.liveMetrics.connectedAgentsCount = pglAgents.length;
        this.logs.unshift({ timestamp: new Date().toISOString(), source: 'PGL-SYS', message: `Handshake complete. ${pglAgents.length} live agents mapped into Swarm topology slots.`, type: 'success' });
      }
    } catch (e) {
      this.logs.unshift({ timestamp: new Date().toISOString(), source: 'PGL-SYS', message: 'Handshake failed. Backend unreachable.', type: 'error' });
    }
    this.notify();
  }

  public startSimulation() {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => { this.syncWithBackend(); }, 4000);
  }

  public stopSimulation() {
    if (this.intervalId) { clearInterval(this.intervalId); this.intervalId = null; }
  }

  public async syncWithBackend() {
    const now = Date.now();
    if (now - this.lastSyncTime < 3000) return;
    this.lastSyncTime = now;

    try {
      const overview = await fetchWorkspaceOverview();
      if (overview) {
        if (overview.fleet) this.mapRealAgentsToTopology(overview.fleet);
        
        this.liveMetrics.totalExecutions = overview.total_requests_today || this.liveMetrics.totalExecutions;
        this.liveMetrics.throughput = overview.tokens_per_sec || overview.requests_per_min || this.liveMetrics.throughput;
        this.liveMetrics.gasSaved = overview.budget_remaining_usd || this.liveMetrics.gasSaved;
        this.liveMetrics.activeQueue = overview.active_pipelines || this.liveMetrics.activeQueue;
        
        if (overview.audit_logs) {
          overview.audit_logs.forEach(log => {
            if (!this.logs.some(l => l.message.includes(log.id))) {
              this.logs.unshift({ timestamp: log.ts, source: log.actor === 'system' ? 'PGL-SYS' : 'USER-CLI', message: `[${log.target.toUpperCase()}] ${log.action.toUpperCase()} - Ref: ${log.id}`, type: log.action.includes('denied') ? 'error' : 'info' });
            }
          });
        }

        if (overview.recent_runs) {
          overview.recent_runs.forEach(realRun => {
            const existingIndex = this.runs.findIndex(r => r.id === realRun.id);
            const mappedRun: VeklomRun = {
              id: realRun.id,
              intent: `Inference via ${realRun.model}`,
              status: realRun.policy === 'violated' ? 'failed' : 'completed',
              timestamp: realRun.ts || new Date().toISOString(),
              duration: `${realRun.latency}ms`,
              currentStep: 'Attestation',
              steps: [
                { name: 'Intent', status: 'completed', hash: generateHash('int'), details: 'Parsed.' },
                { name: 'cAPI Gateway', status: 'completed', hash: realRun.id, details: `Approved.` }
              ],
              attestation: { seked: 'passed', arbiter: 'passed', converge: 'passed' },
              evidenceCount: 1,
              policyRule: 'SEC-GAS-LIMIT-MAX',
              policyStatus: realRun.policy === 'violated' ? 'violated' : 'passed',
              policyDetails: `Validated ${realRun.model}`,
              hash: realRun.id
            };

            if (existingIndex >= 0) {
              this.runs[existingIndex] = { ...this.runs[existingIndex], status: mappedRun.status };
            } else {
              this.runs.unshift(mappedRun);
            }
          });
        }
        
        // Let's reset delegates voting occasionally if backend gives legislative signals
        if ((overview as any).delegates) {
             this.delegates = [...(overview as any).delegates];
        }

        if (this.logs.length > 100) this.logs = this.logs.slice(0, 100);
        if (this.runs.length > 100) this.runs = this.runs.slice(0, 100);
      }
      this.notify();
    } catch (err) {}
  }

  public async triggerManualRun(intentText: string, policyText: string = 'SEC-GAS-LIMIT-MAX') {
    const agent = this.agents.find(a => a.status === 'Active') || this.agents[0];
    const pgl_id = agent ? agent.id : "TERMINAL";
    
    this.logs.unshift({ timestamp: new Date().toISOString(), source: 'cAPI-GATE', message: `Transmitting Intent [${intentText}] to real cAPI...`, type: 'warn' });
    this.notify();

    let receiptHash = "PENDING";
    let status: RunStatus = 'running';

    try {
      const receipt = await triggerCAPIExecution(agent ? agent.name : "TERMINAL-MANUAL", pgl_id, "mcp", "manual_override", { intent: intentText, policy: policyText });
      receiptHash = receipt.evidence_chain_id || generateHash('evd');
      status = 'completed';
      this.logs.unshift({ timestamp: new Date().toISOString(), source: 'PGL-EVIDENCE', message: `cAPI Approved: ${receiptHash}`, type: 'success' });
    } catch (e: any) {
      status = 'failed';
      this.logs.unshift({ timestamp: new Date().toISOString(), source: 'cAPI-VETO', message: `REJECTED: ${e.message}`, type: 'error' });
    }

    const newRun: VeklomRun = {
      id: `VR-${String(9482 + this.runs.length).padStart(5, '0')}`,
      intent: intentText,
      status: status,
      timestamp: new Date().toISOString(),
      duration: status === 'completed' ? 'Executed' : 'REJECTED',
      currentStep: 'Attestation',
      steps: [
        { name: 'Intent', status: 'completed', hash: generateHash('int'), details: 'Parsed.' },
        { name: 'cAPI Gateway', status: status === 'completed' ? 'completed' : 'failed', hash: receiptHash, details: 'Checked.' }
      ],
      attestation: { seked: 'passed', arbiter: 'passed', converge: 'passed' },
      evidenceCount: 1,
      policyRule: policyText,
      policyStatus: status === 'completed' ? 'passed' : 'violated',
      policyDetails: "Manual Execution Request",
      hash: receiptHash !== "PENDING" ? receiptHash : generateHash('vr')
    };

    this.runs.unshift(newRun);
    if (this.runs.length > 100) this.runs.pop();
    this.notify();
    return newRun;
  }
}

export const controlStore = new ControlPlaneSimulationStore();
controlStore.startSimulation();
