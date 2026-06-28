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

/**
 * Quantum MCP Terminal Ported Types
 */

export interface QuantumAgentTrustScore {
  id: string;
  name: string;
  performance: number; // 0-100
  behavioral: number;  // 0-100
  semantic: number;    // 0-100
  governance: number;  // 0-100
  social: number;      // 0-100
  totalScore: number;  // 0-100
  trustTier: TrustTier;
}

export type TrustTier = 'T1' | 'T2' | 'T3' | 'T4' | 'T5';

export interface RARAInvariant {
  class: 'structural' | 'semantic' | 'temporal';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
}

export interface SpeculativePath {
  id: string;
  label: string;
  probability: number;
  status: 'active' | 'pruned';
  insight: string;
}

export interface QuantumTelemetry {
  zeno_cycles: number;
  leakage_rate: number;
  fidelity: number;
  vibration_1x?: number;
  vibration_2x?: number;
  carpet_noise?: number;
  timestamp?: string;
}

export interface MELTSignal {
  type: 'metric' | 'event' | 'log' | 'trace';
  layer: 'behavioral' | 'operational' | 'decision' | 'governance';
  message: string;
  metadata?: any;
}

export interface MCPConfigTool {
  enabled: boolean;
  params?: Record<string, any>;
}

export type MCPConfig = Record<string, MCPConfigTool>;

export interface OrchestrationResponse {
  plan_summary: string;
  speculative_paths: SpeculativePath[];
  quantum_telemetry: QuantumTelemetry;
  suggested_actions: string[];
  mcp_trace?: { tool: string; result: string }[];
}

export interface PGLGenome {
  hash: string;
  layers: {
    model: string;
    prompt: string;
    policy: string;
    watchtower: string;
    task_profile: string;
  };
  timestamp: string;
}

export interface PGLCertificate {
  id: string;
  genome_hash: string;
  issued_at: string;
  status: 'valid' | 'revoked' | 'expired';
}

export interface PGLNode {
  id: string;
  type: 'genome' | 'output' | 'delegation';
  label: string;
  relation?: 'DERIVED_FROM' | 'PRODUCED_BY' | 'DELEGATED_FROM';
  parentId?: string;
}

export interface EmissionPoint {
  year: number;
  value: number;
  label?: string;
}

export interface RegionalEmitter {
  name: string;
  volume: number; // MtCO2e
  percentage: number;
  perCapita?: number;
}

export type SEKEDDirective = 'HALT' | 'WAIT' | 'STABILIZE' | 'GRIND' | 'CLARIFY' | 'FORTIFY' | 'EXECUTE' | 'EXPAND' | 'SCALE BACK';

export interface SEKEDState {
  energy: number;       // E
  resilience: number;   // R
  confidence: number;   // C
  diversity: number;    // D
  stability: number;     // S
  directive: SEKEDDirective;
}

export interface UACPLayerStatus {
  layer: 'cognitive' | 'context' | 'execution' | 'hitl';
  status: 'active' | 'isolated' | 'idempotent' | 'pending';
  latency: number;
}

export interface BoundedMetrics {
  phi_ratio: number;
  carbon_intensity: number;
  utilization: number;
  water_risk: 'low' | 'moderate' | 'high';
}

export interface SecuritySurface {
  name: string;
  threat_level: 'low' | 'medium' | 'high' | 'critical';
  containment: number; // 0-1
  description: string;
}

export interface GatewayStatus {
  sanitization: 'active' | 'idle';
  redaction: 'active' | 'idle';
  auditing: 'active' | 'idle';
  egress_control: 'active' | 'idle';
  last_scan_result: 'clear' | 'threat_detected';
}

export interface IdentityGovernance {
  xaa_status: 'enforced' | 'pending' | 'bypass';
  jit_access: 'active' | 'inactive';
  secretless_mode: boolean;
  active_agents: number;
  shadow_ai_detected: number;
}

export interface RoadmapPhase {
  id: number;
  label: string;
  status: 'completed' | 'in-progress' | 'planned';
  description: string;
  target_threat: string;
}

export interface SSRNSignal {
  node: string;
  match_strength: number;
}

export interface ObservabilitySignal {
  name: string;
  state: 'RISING' | 'STABLE' | 'FALLING';
  value: number;
}

export interface OperationalHubMetrics {
  determinism_ratio: number;
  certainty_index: number;
  acceptable_noise: number;
  deterministic_entropy: number;
  latency: number;
  coherence: number;
  operational_plane_locked: boolean;
  active_agents_consensus: number;
  gopher_policy_status: 'ACTIVE' | 'VIOLATION' | 'PENDING';
  system_progress: number;
}

export type LLMProvider = 'google' | 'openai' | 'anthropic' | 'groq' | 'deepseek' | 'huggingface' | 'ollama' | 'serp';

export interface ProviderConfig {
  id: string;
  name: string;
  enabled: boolean;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

export interface QuantumAgentStatus {
  id: number;
  role: string;
  status: 'idle' | 'assigned' | 'executing' | 'blocked';
  progress: number;
}

export interface QuantumAppState {
  isOrchestrating: boolean;
  currentTask: string | null;
  agentTaskForce: QuantumAgentStatus[];
  selectedProvider: LLMProvider;
  providerConfigs: ProviderConfig[];
  results: OrchestrationResponse | null;
  telemetry?: QuantumTelemetry;
  telemetryHistory: QuantumTelemetry[];
  orchestrationHistory: { id: string; timestamp: string; prompt: string; result: OrchestrationResponse }[];
  pglLedger: PGLNode[];
  currentGenome?: PGLGenome;
  emissionsData: EmissionPoint[];
  regionalEmitters: RegionalEmitter[];
  seked: SEKEDState;
  uacpLayers: UACPLayerStatus[];
  boundedScaling: BoundedMetrics;
  securitySurfaces: SecuritySurface[];
  mcpGateway: GatewayStatus;
  identityGov: IdentityGovernance;
  roadmap: RoadmapPhase[];
  hubMetrics: OperationalHubMetrics;
  ssrnSignals: SSRNSignal[];
  obsSignals: ObservabilitySignal[];
  logs: MELTSignal[];
  connectionStatus: 'idle' | 'linking' | 'connected' | 'error';
  lastError: string | null;
}
