/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { establishBackendHandshake, triggerCAPIExecution, fetchWorkspaceOverview } from './pglLoader';
import { AgentNode, VeklomRun, Delegate, TelemetryTick, RunStatus, AgentStatus, SpineStep } from '../types';

// Helper to generate a random hash securely
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

// Programmatic generation of 105 UACP Agents
const generateSwarmAgents = (): AgentNode[] => {
  const agents: AgentNode[] = [];
  const departments: ('Engineering' | 'Growth' | 'Ops' | 'Research' | 'Revenue')[] = [
    'Engineering', 'Growth', 'Ops', 'Research', 'Revenue'
  ];
  
  const roles: ('Executor' | 'Validator' | 'Orchestrator' | 'Arbiter' | 'Router')[] = [
    'Executor', 'Validator', 'Executor', 'Validator', 'Router'
  ];

  // Root Agent (MCP IO Hub Core)
  agents.push({
    id: 'AG-CORE-000',
    name: 'MCP-IO-BUS-CORE',
    role: 'Orchestrator',
    department: 'Ops',
    status: 'Active',
    mission: 'High-throughput execution multiplexer and PGL consensus sequencer.',
    toolScopes: ['kernel_read', 'syscall_execute', 'bus_broadcast', 'quorum_attest'],
    metrics: { cpu: 84, memory: 72, latency: 4, requestCount: 14892 },
    telemetryLogs: [
      'MCP-IO core state initialized.',
      'Awaiting consensus attestation loop.',
      'Active connections established with 105 federated sub-agents.'
    ],
    x: 400,
    y: 300
  });

  const missionsByDept = {
    Engineering: [
      'Kernel compiler and automated build validation',
      'ZKP verification processor for execution signatures',
      'Virtual VM garbage collection state observer'
    ],
    Growth: [
      'Expansion metric tracker & API rate optimization sub-agent',
      'Dynamic indexing coordinator for swarm consensus logging',
      'Cross-chain execution pipeline load balancer'
    ],
    Ops: [
      'Redis cluster health analyzer and memory flush supervisor',
      'Docker instance sandbox container restarter',
      'Network delay telemetry validator and ping tracker'
    ],
    Research: [
      'Deep pattern mining for state rollback minimization',
      'ArbiterOS policy pre-compilation rule validator',
      'Zero-knowledge proof prover engine optimization'
    ],
    Revenue: [
      'Gas fee scheduler and smart execution planner',
      'Multi-currency execution hedge state arbiter',
      'Throughput-to-gas ratio optimizer sub-agent'
    ]
  };

  const toolsByDept = {
    Engineering: ['run_bundler', 'verify_zkp', 'git_diff', 'clean_vm_state'],
    Growth: ['query_telemetry', 'adjust_rates', 'broadcast_state', 'trigger_load_shed'],
    Ops: ['tcp_probe', 'flush_redis', 'reboot_sandbox', 'measure_latency'],
    Research: ['parse_policy', 'compile_rules', 'prove_state', 'estimate_entropy'],
    Revenue: ['calculate_gas', 'route_hedge', 'payout_attest', 'optimize_gas_limit']
  };

  // Generate 104 federated nodes inside cluster formations
  let idCounter = 1;
  departments.forEach((dept, deptIdx) => {
    // Determine the angle for the cluster
    const clusterAngle = (deptIdx * 2 * Math.PI) / departments.length;
    const clusterRadius = 180;
    const clusterCenterX = 400 + Math.cos(clusterAngle) * clusterRadius;
    const clusterCenterY = 300 + Math.sin(clusterAngle) * clusterRadius;

    // Center agent for this department cluster (Arbiter or Validator)
    const clusterLeaderId = `AG-${dept.slice(0, 3).toUpperCase()}-LDR`;
    agents.push({
      id: clusterLeaderId,
      name: `ArbiterOS-${dept}-Director`,
      role: 'Arbiter',
      department: dept,
      status: 'Idle',
      mission: `Governs regional Policy compliance representing ${dept} delegates.`,
      toolScopes: [...toolsByDept[dept], 'evaluate_arbiter_code', 'veto_state'],
      metrics: { cpu: 12, memory: 40, latency: 15, requestCount: 162 },
      telemetryLogs: [`Cluster control established on node ${clusterLeaderId}`],
      x: clusterCenterX,
      y: clusterCenterY
    });

    // Sub-agents inside the cluster
    const numSubAgents = 23; // 23 sub-agents + 1 leader per dept = 24 * 5 = 120 agents
    for (let i = 0; i < numSubAgents; i++) {
      const subAngle = (i * 2 * Math.PI) / numSubAgents;
      const subRadius = 55 + (i % 2 === 0 ? 15 : 0); // concentric rings
      const nodeX = clusterCenterX + Math.cos(subAngle) * subRadius;
      const nodeY = clusterCenterY + Math.sin(subAngle) * subRadius;

      const randomRole = roles[Math.floor(Math.random() * roles.length)];
      const nodeNum = String(idCounter++).padStart(3, '0');
      const id = `AG-${dept.slice(0, 3).toUpperCase()}-${nodeNum}`;
      
      const randomStatus: AgentStatus = Math.random() < 0.15 ? 'Active' : Math.random() < 0.05 ? 'Blocked' : 'Idle';

      agents.push({
        id,
        name: `SwarmUnit-${dept}-${nodeNum}`,
        role: randomRole,
        department: dept,
        status: randomStatus,
        mission: missionsByDept[dept][i % missionsByDept[dept].length],
        toolScopes: [toolsByDept[dept][i % toolsByDept[dept].length], toolsByDept[dept][(i + 1) % toolsByDept[dept].length]],
        metrics: {
          cpu: randomStatus === 'Active' ? Math.floor(Math.random() * 50) + 40 : randomStatus === 'Blocked' ? 0 : Math.floor(Math.random() * 8) + 2,
          memory: randomStatus === 'Active' ? Math.floor(Math.random() * 30) + 50 : randomStatus === 'Blocked' ? 98 : Math.floor(Math.random() * 20) + 10,
          latency: randomStatus === 'Active' ? Math.floor(Math.random() * 12) + 2 : randomStatus === 'Blocked' ? 999 : Math.floor(Math.random() * 10) + 8,
          requestCount: Math.floor(Math.random() * 500) + 50
        },
        telemetryLogs: [
          `Agent spawned in cluster: ${dept}.`,
          `Synchronizing dynamic policy: ArbiterOS-${dept.toUpperCase()}-SECURE v5.0.2.`,
          randomStatus === 'Active' ? 'Active pipeline subscription initialized.' : 'Idling on consensus ledger.'
        ],
        x: nodeX,
        y: nodeY
      });
    }
  });

  return agents;
};

// Generate 5 core Delegates with deep parameters
export const initialDelegates: Delegate[] = [
  { id: 'DEL-ENG', name: 'Dr. Evelyn Carter', department: 'Engineering', weight: 30, vote: 'yea', lastAttestation: '0x3ca2...9f4b', influence: 30 },
  { id: 'DEL-RES', name: 'Prof. Linus Zhang', department: 'Research', weight: 25, vote: 'yea', lastAttestation: '0x99a1...ff02', influence: 25 },
  { id: 'DEL-OPS', name: 'Commander Sarah Rex', department: 'Ops', weight: 20, vote: 'yea', lastAttestation: '0xe204...998a', influence: 20 },
  { id: 'DEL-REV', name: 'Aleta Vance', department: 'Revenue', weight: 15, vote: 'abstain', lastAttestation: '0xbb29...ad3e', influence: 15 },
  { id: 'DEL-GRO', name: 'Marcus Sterling', department: 'Growth', weight: 10, vote: 'pending', lastAttestation: '0x77cf...b831', influence: 10 }
];

// Seed list of historical/live VeklomRuns
const mockIntents = [
  'Deploy decentralized VM load-allocator representing Swarm Pool 4',
  'Execute gas arbitrage on flash-route convergent matrix solver',
  'Verify zero-knowledge root attestations on Block #15,827,991',
  'Enforce rate limit throttling across non-primary cluster validators',
  'Force garbage collection and hot swap cache layer inside Redis VM',
  'Commit state ledger synchronization representing PGL-Core-00',
  'Prune stale execution trees for subnet Research cluster 2',
  'Consolidate multi-currency asset payouts into secure revenue reserves'
];

const policyRules = [
  { rule: 'SEC-REENTRANCY-01', desc: 'No concurrent state modifications below execution depth 4.', status: 'passed' },
  { rule: 'SEC-GAS-LIMIT-MAX', desc: 'Single-run dynamic gas estimation must not exceed 2.4 Gwei.', status: 'passed' },
  { rule: 'SYS-MEM-BOUNDS-4G', desc: 'Redis memory footprint allocation restricted to 1.2GB/worker node.', status: 'passed' },
  { rule: 'GOV-QUORUM-65P', desc: 'Consensus voting representation threshold requires a minimum of 65% affirmative weights.', status: 'passed' },
  { rule: 'NET-LATENCY-WARP', desc: 'Inter-agent RPC response time-boundaries bound strictly to 25ms limits.', status: 'passed' }
] as const;

const generateVeklomRuns = (agents: AgentNode[]): VeklomRun[] => {
  const runs: VeklomRun[] = [];
  
  for (let i = 0; i < 30; i++) {
    const intent = mockIntents[i % mockIntents.length];
    const runStatus: RunStatus = i === 0 ? 'running' : i % 8 === 0 ? 'failed' : 'completed';
    const duration = `${(Math.random() * 80 + 30).toFixed(1)}ms`;
    const ruleObj = policyRules[i % policyRules.length];
    
    const steps: VeklomRun['steps'] = [
      { name: 'Intent', status: 'completed', hash: generateHash('int'), details: 'User intent parsed and parsed into PGL representation.' },
      { name: 'Plan', status: 'completed', hash: generateHash('pln'), details: 'Generated 5 dependency sub-paths for swarm allocations.' },
      { name: 'ArbiterOS', status: 'completed', hash: generateHash('arb'), details: `Validated against Policy ${ruleObj.rule}: ${ruleObj.desc}` },
      { name: 'Redis Lua', status: 'completed', hash: generateHash('lua'), details: 'Lua execution atomicity locks applied successfully on primary slots.' },
      { name: 'Attestation', status: 'completed', hash: generateHash('att'), details: 'State root signed, attestation envelopes sealed by SEKED and ConvergeOS.' }
    ];

    if (runStatus === 'running') {
      steps[3].status = 'active';
      steps[4].status = 'pending';
    } else if (runStatus === 'failed') {
      steps[2].status = 'failed';
      steps[2].details = `VETO triggered by ArbiterOS on policy instruction ${ruleObj.rule}. State rolled back.`;
      steps[3].status = 'pending';
      steps[4].status = 'pending';
    }

    const attState = runStatus === 'completed' ? 'passed' : runStatus === 'failed' ? 'failed' : 'pending';

    runs.push({
      id: `VR-${String(9482 + i).padStart(5, '0')}`,
      intent,
      status: runStatus,
      timestamp: new Date(Date.now() - i * 4 * 60 * 1000 - Math.random() * 60 * 1000).toISOString(),
      duration,
      currentStep: i === 0 ? 'Redis Lua' : 'Attestation',
      steps,
      attestation: {
        seked: attState,
        arbiter: attState,
        converge: attState
      },
      evidenceCount: Math.floor(Math.random() * 8) + 2,
      policyRule: ruleObj.rule,
      policyStatus: runStatus === 'failed' ? 'violated' : Math.random() < 0.1 ? 'warning' : 'passed',
      policyDetails: ruleObj.desc,
      hash: generateHash('vr')
    });
  }

  return runs;
};

// Global Central Store holding state and allowing reactive subscription
export class ControlPlaneSimulationStore {
  public agents: AgentNode[] = [];
  public runs: VeklomRun[] = [];
  public delegates: Delegate[] = initialDelegates;
  public logs: TelemetryTick[] = [];
  
  // Real-time system performance counters
  public liveMetrics = {
    throughput: 582, // kb/s
    attestationRate: 99.82, // %
    gasSaved: 1482.91, // Gwei
    activeQueue: 4, // counts
    uptime: "223d 14h 42m",
    connectedAgentsCount: 120,
    mcpIOHeartbeat: 'online',
    totalExecutions: 82941
  };

  private listeners: (() => void)[] = [];

  public async initializeFromHandshake() {
    try {
      this.logs.unshift({
        timestamp: new Date().toISOString(),
        source: 'PGL-SYS',
        message: 'Establishing live cryptographic handshake with Backend...',
        type: 'warn'
      });
      this.notify();

      const pglAgents = await establishBackendHandshake();
      
      if (pglAgents && pglAgents.length > 0) {
        // Map the real PGL agents over the sub-agent nodes in the swarm to preserve the full map
        const subAgents = this.agents.filter(a => a.id !== 'AG-CORE-000' && !a.id.includes('LDR'));
        pglAgents.forEach((realAgent, idx) => {
          if (idx < subAgents.length) {
            const targetAgent = subAgents[idx];
            targetAgent.id = realAgent.pgl_id;
            targetAgent.name = realAgent.agent.toUpperCase();
            targetAgent.status = realAgent.status === 'cleared' ? 'Active' : 'Idle';
            targetAgent.mission = `PGL Aligned Execution Context: ${realAgent.run_id}`;
            targetAgent.toolScopes = ['kernel_read', 'pgl_attest'];
            targetAgent.telemetryLogs = [
              `[HANDSHAKE] Synced with GnomLedger PGL.`,
              `PGL Signature Verified: ${realAgent.pgl_id}`,
              `Connected to backend execution trace: ${realAgent.run_id}`
            ];
          }
        });

        this.liveMetrics.connectedAgentsCount = pglAgents.length;
        
        this.logs.unshift({
          timestamp: new Date().toISOString(),
          source: 'PGL-SYS',
          message: `Handshake complete. ${pglAgents.length} deterministically aligned agents mapped to Swarm.`,
          type: 'info'
        });
      }
    } catch (e) {
      console.error(e);
      this.logs.unshift({
        timestamp: new Date().toISOString(),
        source: 'PGL-SYS',
        message: 'Handshake failed. Falling back to local/mock swarm.',
        type: 'error'
      });
    }
    this.notify();
  }

  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    this.agents = generateSwarmAgents();
    this.runs = generateVeklomRuns(this.agents);
    this.seedLogs();
    // Listen for custom CLI commands from the frontend terminal
    if (typeof window !== 'undefined') {
      window.addEventListener('cli-command', ((e: CustomEvent) => {
        const { command, response } = e.detail;

        this.logs.unshift({
          timestamp: new Date().toISOString(),
          source: 'USER-CLI',
          message: `> ${command}`,
          type: 'success'
        });

        if (response) {
          setTimeout(() => {
            this.logs.unshift({
              timestamp: new Date().toISOString(),
              source: 'SYS-RESP',
              message: response,
              type: 'info'
            });
            this.notify();
          }, 300);
        }
        this.notify();
      }) as EventListener);
    }
  }

  private seedLogs() {
    const initialMsgs = [
      { source: 'SYS', msg: 'UACP Control Plane v5.0.0 Alpha initialized.', type: 'success' },
      { source: 'MCP-IO', msg: 'Zero-Copy IO channel connected cleanly, speed threshold 2.5 Gbps.', type: 'info' },
      { source: 'ArbiterOS', msg: 'Policy Engine parsed 12 distinct system governance profiles.', type: 'success' },
      { source: 'Redis-Lua', msg: 'LUA pipeline pre-compilation fully warmed in 1.4ms.', type: 'info' },
      { source: 'Consensus', msg: 'ConvergeOS secure hardware enclave (SEKED) reporting ONLINE.', type: 'success' },
      { source: 'Council', msg: 'Delegate weights locked. Engineering holds primary 30% voting vector.', type: 'warn' }
    ] as const;

    initialMsgs.forEach((itm, idx) => {
      this.logs.push({
        timestamp: new Date(Date.now() - (10 - idx) * 30 * 1000).toISOString(),
        source: itm.source,
        message: itm.msg,
        type: itm.type
      });
    });
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
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

  private lastSyncTime = 0;

  public async syncWithBackend() {
    const now = Date.now();
    // Throttle sync to once every 6 seconds to prevent flooding
    if (now - this.lastSyncTime < 6000) return;
    this.lastSyncTime = now;

    try {
      const overview = await fetchWorkspaceOverview();
      if (overview) {
        // Sync Live Metrics from backend — authoritative real data
        this.liveMetrics.totalExecutions = overview.total_requests_today || this.liveMetrics.totalExecutions;
        this.liveMetrics.throughput = overview.tokens_per_sec || overview.requests_per_min || this.liveMetrics.throughput;
        this.liveMetrics.gasSaved = overview.budget_remaining_usd || this.liveMetrics.gasSaved;
        this.liveMetrics.activeQueue = overview.active_pipelines || this.liveMetrics.activeQueue;
        this.liveMetrics.connectedAgentsCount = overview.active_models || this.liveMetrics.connectedAgentsCount;
        
        // Sync Real Audit Logs to our live telemetry console ticker
        if (overview.audit_logs && overview.audit_logs.length > 0) {
          overview.audit_logs.forEach(log => {
            // Check if this log is already present in our ticker to avoid duplicates
            const isDuplicate = this.logs.some(existingLog => 
              existingLog.message.includes(log.id) || 
              (existingLog.message.includes(log.action) && existingLog.timestamp === log.ts)
            );
            if (!isDuplicate) {
              this.logs.unshift({
                timestamp: log.ts,
                source: log.actor === 'system' ? 'PGL-SYS' : 'USER-CLI',
                message: `[${log.target.toUpperCase()}] ${log.action.toUpperCase()} (${log.hash}) - Ref: ${log.id}`,
                type: log.action.includes('denied') || log.action.includes('fail') ? 'error' : 'info'
              });
            }
          });
          // Keep logs size bounded
          if (this.logs.length > 100) {
            this.logs = this.logs.slice(0, 100);
          }
        }

        // Sync Policy Events into telemetry logs for live awareness
        if (overview.policy_events && overview.policy_events.length > 0) {
          overview.policy_events.forEach(event => {
            const isDuplicate = this.logs.some(existingLog =>
              existingLog.message.includes(event.title) && existingLog.message.includes(event.body)
            );
            if (!isDuplicate) {
              this.logs.unshift({
                timestamp: event.t || new Date().toISOString(),
                source: 'ArbiterOS',
                message: `[POLICY] ${event.title}: ${event.body}`,
                type: event.tone === 'warn' || event.tone === 'warning' ? 'warn' : 'info'
              });
            }
          });
        }

        // Sync Security Alerts
        if (overview.alerts && overview.alerts.length > 0) {
          overview.alerts.forEach(alert => {
            const isDuplicate = this.logs.some(existingLog =>
              existingLog.message.includes(alert.id)
            );
            if (!isDuplicate) {
              this.logs.unshift({
                timestamp: new Date().toISOString(),
                source: 'SEKED',
                message: `[ALERT:${alert.severity.toUpperCase()}] ${alert.title} (${alert.source}) — Ref: ${alert.id}`,
                type: alert.severity === 'critical' || alert.severity === 'high' ? 'error' : 'warn'
              });
            }
          });
        }

        // Sync Real runs into our runs state
        if (overview.recent_runs && overview.recent_runs.length > 0) {
          overview.recent_runs.forEach(realRun => {
            // Check if this run is already present in our runs list
            const existingIndex = this.runs.findIndex(r => r.id === realRun.id);
            const runStatus: RunStatus = realRun.policy === 'violated' || realRun.policy === 'redacted' ? 'failed' : 'completed';
            
            const mappedRun: VeklomRun = {
              id: realRun.id,
              intent: `Inference via ${realRun.model} (${realRun.route})`,
              status: runStatus,
              timestamp: realRun.ts || new Date().toISOString(),
              duration: `${realRun.latency}ms`,
              currentStep: 'Attestation',
              steps: [
                { name: 'Intent', status: 'completed', hash: generateHash('int'), details: 'User intent parsed and parsed into PGL representation.' },
                { name: 'Plan', status: 'completed', hash: generateHash('pln'), details: 'Plan generated for model routing.' },
                { name: 'ArbiterOS', status: 'completed', hash: generateHash('arb'), details: `Checked model execution policies.` },
                { name: 'Redis Lua', status: 'completed', hash: generateHash('lua'), details: 'Storage and rate-limiting limits checked.' },
                { name: 'Attestation', status: 'completed', hash: generateHash('att'), details: `State root attested. Cost: $${realRun.cost.toFixed(5)}` }
              ],
              attestation: {
                seked: 'passed',
                arbiter: 'passed',
                converge: 'passed'
              },
              evidenceCount: 1,
              policyRule: 'SEC-GAS-LIMIT-MAX',
              policyStatus: realRun.policy === 'violated' || realRun.policy === 'redacted' ? 'violated' : 'passed',
              policyDetails: `Validated model route: ${realRun.model}`,
              hash: realRun.id
            };

            if (existingIndex >= 0) {
              // Update existing
              this.runs[existingIndex] = {
                ...this.runs[existingIndex],
                status: mappedRun.status,
                duration: mappedRun.duration,
                policyStatus: mappedRun.policyStatus
              };
            } else {
              // Insert new at the beginning
              this.runs.unshift(mappedRun);
            }
          });
          // Keep runs bounded
          if (this.runs.length > 100) {
            this.runs = this.runs.slice(0, 100);
          }
        }
      }
    } catch (err) {
      console.error('[SYNC ERROR] Failed to sync with backend.', err);
    }
  }

  // Make random changes to the system core state to make it look incredibly alive!
  private tick() {
    // 1. Sync with real backend data first
    this.syncWithBackend();

    // 2. Randomly update Agent CPU, memory, and add tick log
    const activeAgents = this.agents.filter(a => a.status === 'Active');
    const idleAgents = this.agents.filter(a => a.status === 'Idle');
    
    // Wake up/rest an agent
    if (Math.random() < 0.25 && idleAgents.length > 0) {
      const idx = Math.floor(Math.random() * idleAgents.length);
      idleAgents[idx].status = 'Active';
      idleAgents[idx].metrics.cpu = Math.floor(Math.random() * 40) + 50;
      idleAgents[idx].metrics.memory = Math.floor(Math.random() * 20) + 40;
      idleAgents[idx].telemetryLogs.unshift(
        `[${new Date().toISOString().substring(11, 19)}] Spawning sub-pipeline for state-root check.`
      );
    }

    if (Math.random() < 0.25 && activeAgents.length > 5) {
      const idx = Math.floor(Math.random() * activeAgents.length);
      activeAgents[idx].status = 'Idle';
      activeAgents[idx].metrics.cpu = Math.floor(Math.random() * 6) + 2;
      activeAgents[idx].telemetryLogs.unshift(
        `[${new Date().toISOString().substring(11, 19)}] Pipeline completed. Going idle.`
      );
    }

    // Tweak core properties of random agents
    this.agents.forEach(agent => {
      if (agent.status === 'Active') {
        const deltaCpu = Math.floor(Math.random() * 15) - 7;
        agent.metrics.cpu = Math.max(40, Math.min(99, agent.metrics.cpu + deltaCpu));
        agent.metrics.latency = Math.max(1, Math.min(25, agent.metrics.latency + (Math.random() > 0.5 ? 1 : -1)));
        agent.metrics.requestCount += Math.floor(Math.random() * 3) + 1;
      }
    });

    // 2. Telemetry logs update
    const sources = ['MCP-IO', 'ArbiterOS', 'Redis-Lua', 'SEKED', 'ConvergeOS', 'Consensus'];
    const randomLogs = [
      'Dispatched pipeline state root to validator swarm.',
      'Attestation signature verification completed successfully in ZKP circuit.',
      'Active gas utilization estimated: saving 4.8 Gwei on block compilation.',
      'Redis cache slot allocation refreshed. Clean state overhead.',
      'ArbiterOS policy pre-run evaluation verified without exception bounds.',
      'Throughput limit boundaries auto-adjusted based on CPU workload vectors.'
    ];

    if (Math.random() < 0.7) {
      const src = sources[Math.floor(Math.random() * sources.length)];
      const msg = randomLogs[Math.floor(Math.random() * randomLogs.length)];
      this.logs.unshift({
        timestamp: new Date().toISOString(),
        source: src,
        message: msg,
        type: Math.random() < 0.1 ? 'warn' : 'info'
      });
      // Keep logs size bounded
      if (this.logs.length > 100) this.logs.pop();
    }

    // 3. Live performance metrics noise
    this.liveMetrics.throughput = Math.floor(this.liveMetrics.throughput + (Math.random() * 30 - 15));
    if (this.liveMetrics.throughput < 500) this.liveMetrics.throughput = 512;
    this.liveMetrics.gasSaved = parseFloat((this.liveMetrics.gasSaved + Math.random() * 0.4).toFixed(2));
    this.liveMetrics.activeQueue = Math.max(2, Math.min(8, this.liveMetrics.activeQueue + (Math.random() < 0.45 ? 1 : Math.random() < 0.45 ? -1 : 0)));
    this.liveMetrics.totalExecutions += Math.floor(Math.random() * 4) + 1;

    // 4. Progress active VeklomRun or push a new one
    const activeRun = this.runs.find(r => r.status === 'running');
    if (activeRun) {
      // Advance step
      if (activeRun.currentStep === 'Intent') {
        activeRun.currentStep = 'Plan';
        activeRun.steps[0].status = 'completed';
        activeRun.steps[1].status = 'active';
      } else if (activeRun.currentStep === 'Plan') {
        activeRun.currentStep = 'ArbiterOS';
        activeRun.steps[1].status = 'completed';
        activeRun.steps[2].status = 'active';
      } else if (activeRun.currentStep === 'ArbiterOS') {
        activeRun.currentStep = 'Redis Lua';
        activeRun.steps[2].status = 'completed';
        activeRun.steps[3].status = 'active';
      } else if (activeRun.currentStep === 'Redis Lua') {
        activeRun.currentStep = 'Attestation';
        activeRun.steps[3].status = 'completed';
        activeRun.steps[4].status = 'active';
        activeRun.attestation.seked = 'passed';
        activeRun.attestation.arbiter = 'passed';
        activeRun.attestation.converge = 'passed';
      } else if (activeRun.currentStep === 'Attestation') {
        activeRun.status = 'completed';
        activeRun.steps[4].status = 'completed';
      }
    } else {
      // Spawn a new execution representing the dynamic pipeline
      if (Math.random() < 0.4) {
        const intent = mockIntents[Math.floor(Math.random() * mockIntents.length)];
        const ruleObj = policyRules[Math.floor(Math.random() * policyRules.length)];
        const newRun: VeklomRun = {
          id: `VR-${String(9482 + this.runs.length).padStart(5, '0')}`,
          intent,
          status: 'running',
          timestamp: new Date().toISOString(),
          duration: `${(Math.random() * 40 + 25).toFixed(1)}ms`,
          currentStep: 'Intent',
          steps: [
            { name: 'Intent', status: 'active', hash: generateHash('int'), details: 'User intent parsed and parsed into PGL representation.' },
            { name: 'Plan', status: 'pending', hash: generateHash('pln'), details: 'Generating deployment plan...' },
            { name: 'ArbiterOS', status: 'pending', hash: generateHash('arb'), details: `Awaiting Policy evaluation of ${ruleObj.rule}: ${ruleObj.desc}` },
            { name: 'Redis Lua', status: 'pending', hash: generateHash('lua'), details: 'Awaiting dynamic locks...' },
            { name: 'Attestation', status: 'pending', hash: generateHash('att'), details: 'Consensus sealed by SEKED.' }
          ],
          attestation: {
            seked: 'pending',
            arbiter: 'pending',
            converge: 'pending'
          },
          evidenceCount: Math.floor(Math.random() * 5) + 1,
          policyRule: ruleObj.rule,
          policyStatus: Math.random() < 0.05 ? 'violated' : Math.random() < 0.08 ? 'warning' : 'passed',
          policyDetails: ruleObj.desc,
          hash: generateHash('vr')
        };
        this.runs.unshift(newRun);
        if (this.runs.length > 100) this.runs.pop();

        this.logs.unshift({
          timestamp: new Date().toISOString(),
          source: 'MCP-IO',
          message: `Dispatched new VeklomRun execution context: ${newRun.id}`,
          type: 'info'
        });
      }
    }

    // 5. Shift voting weights or votes on delegates occasionally to look highly responsive
    if (Math.random() < 0.15) {
      const randomDeleg = this.delegates[Math.floor(Math.random() * this.delegates.length)];
      const possibleVotes: ('yea' | 'nay' | 'abstain' | 'pending')[] = ['yea', 'yea', 'yea', 'nay', 'abstain', 'pending'];
      
      const prevVote = randomDeleg.vote;
      const nextVote = possibleVotes[Math.floor(Math.random() * possibleVotes.length)];

      if (prevVote !== nextVote) {
        randomDeleg.vote = nextVote as any;
        randomDeleg.lastAttestation = generateHash('att').substring(0, 10) + '...' + generateHash('att').substring(26, 30);
        this.logs.unshift({
          timestamp: new Date().toISOString(),
          source: 'Council',
          message: `Delegate ${randomDeleg.name} (${randomDeleg.department}) updated vote state to: [${nextVote.toUpperCase()}].`,
          type: 'warn'
        });
      }
    }

    this.notify();
  }

  // Force trigger a manual execution via cAPI
  public async triggerManualRun(intentText: string, policyText: string = 'SEC-GAS-LIMIT-MAX') {
    const isSuccess = Math.random() < 0.85;
    const ruleObj = policyRules.find(p => p.rule === policyText) || policyRules[0];
    
    // Default fallback values
    let evidence_id = "EV-PENDING-NETWORK";
    let policyStatus = isSuccess ? 'passed' : 'violated';
    
    // Pick an agent (the first one that is active or fallback)
    const agent = this.agents.find(a => a.status === 'Active') || this.agents[0];
    const pgl_id = agent ? agent.id : "NO-PGL-ID";
    
    this.logs.unshift({
      timestamp: new Date().toISOString(),
      source: 'cAPI-GATE',
      message: `Transmitting Intent [${intentText}] to cAPI Backend for Agent ${pgl_id}...`,
      type: 'warn'
    });
    this.notify();

    try {
      // FIRE ACROSS THE INTERNET TO cAPI BACKEND
      const receipt = await triggerCAPIExecution(
        agent ? agent.name : "TERMINAL-MANUAL",
        pgl_id,
        "mcp",
        "manual_override",
        { intent: intentText, policy: policyText }
      );
      
      evidence_id = receipt.evidence_chain_id;
      policyStatus = 'passed'; // If it returns, cAPI approved it
      
      this.logs.unshift({
        timestamp: new Date().toISOString(),
        source: 'PGL-EVIDENCE',
        message: `cAPI Approved. Cryptographic Receipt: ${evidence_id}`,
        type: 'info'
      });
      
    } catch (e: any) {
      console.error(e);
      policyStatus = 'violated';
      this.logs.unshift({
        timestamp: new Date().toISOString(),
        source: 'cAPI-VETO',
        message: `PACKET DROPPED: ${e.message}`,
        type: 'error'
      });
    }

    const newRun: VeklomRun = {
      id: `VR-${String(9482 + this.runs.length).padStart(5, '0')}`,
      intent: intentText || 'Manual multiplexer override allocation',
      status: policyStatus === 'passed' ? 'running' : 'failed',
      timestamp: new Date().toISOString(),
      duration: policyStatus === 'passed' ? 'Calculating...' : 'DROPPED',
      currentStep: 'Intent',
      steps: [
        { name: 'Intent', status: 'completed', hash: generateHash('int'), details: 'User intent parsed and converted to ExecutionIntent payload.' },
        { name: 'cAPI Gateway', status: policyStatus === 'passed' ? 'completed' : 'failed', hash: evidence_id, details: policyStatus === 'passed' ? `Approved: ${evidence_id}` : 'VETO ENGAGED. Payload dropped.' },
        { name: 'ArbiterOS', status: 'pending', hash: generateHash('arb'), details: `Checking rule restrictions on ${ruleObj.rule}.` },
        { name: 'Redis Lua', status: 'pending', hash: generateHash('lua'), details: 'Lua storage queue placement.' },
        { name: 'Attestation', status: 'pending', hash: generateHash('att'), details: 'Final proof sealing.' }
      ],
      attestation: {
        seked: 'pending',
        arbiter: 'pending',
        converge: 'pending'
      },
      evidenceCount: 1,
      policyRule: ruleObj.rule,
      policyStatus: policyStatus as any,
      policyDetails: ruleObj.desc,
      hash: evidence_id !== "EV-PENDING-NETWORK" ? evidence_id : generateHash('vr')
    };

    this.runs.unshift(newRun);
    this.notify();
    return newRun;
  }
}

export const controlStore = new ControlPlaneSimulationStore();
controlStore.startSimulation();
