"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  ShieldAlert, 
  Play, 
  Zap, 
  Database, 
  KeyRound, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  FileCheck, 
  Sparkles, 
  Fingerprint, 
  Cpu, 
  ChevronRight, 
  Coins, 
  XCircle,
  Eye,
  RefreshCw
} from 'lucide-react';

interface Agent {
  name: string;
  role: string;
  avatar: string;
  backstory: string;
}

interface Crew {
  id: string;
  name: string;
  description: string;
  agents: Agent[];
  tools: string[];
}

const CREWS: Crew[] = [
  {
    id: 'treasury',
    name: 'Treasury Audit & Execution Crew',
    description: 'Automated treasury verification and cloud infrastructure payroll disbursement.',
    tools: ['AWS KMS', 'PostgreSQL Ledger', 'Slack Webhook'],
    agents: [
      {
        name: 'Agent-108 (Auditor)',
        role: 'SLA Performance Reviewer',
        avatar: '📊',
        backstory: 'Audits transaction sheets and verifies cryptographic settlement nonces before execution.'
      },
      {
        name: 'Agent-075 (Executor)',
        role: 'AWS Cloud Disburser',
        avatar: '⚙️',
        backstory: 'Executes highly governed API calls to AWS endpoints to release payroll metrics.'
      }
    ]
  },
  {
    id: 'devops',
    name: 'Kubernetes Cluster Deployment Crew',
    description: 'Dynamic cluster deployments and inline safety auditing.',
    tools: ['Kubernetes API', 'GitHub Webhooks', 'Docker Registry'],
    agents: [
      {
        name: 'Agent-092 (DevOps)',
        role: 'Infra Architect',
        avatar: '🐋',
        backstory: 'Compiles Kubernetes yaml blueprints and coordinates server deployments.'
      },
      {
        name: 'Agent-116 (Sentinel)',
        role: 'Zero-Trust Gatekeeper',
        avatar: '🛡️',
        backstory: 'Continuously monitors yaml dependencies against CVE databases and access rules.'
      }
    ]
  }
];

export default function VanguardPlayground() {
  const [selectedCrew, setSelectedCrew] = useState<Crew>(CREWS[0]);
  const [prompt, setPrompt] = useState<string>('Verify latest ledger ledger-root and release payroll payload to AWS.');
  const [activeThreat, setActiveThreat] = useState<string | null>(null);
  const [executionState, setExecutionState] = useState<'idle' | 'running' | 'compiling' | 'success' | 'blocked'>('idle');
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [slashedStake, setSlashedStake] = useState<number>(0);
  const [vaultShieldActive, setVaultShieldActive] = useState<boolean>(true);

  // Trigger simulated hybrid run
  const handleExecute = (threatId: string | null) => {
    setActiveThreat(threatId);
    setExecutionState('running');
    setCurrentStep(0);
    setLogs([]);
    setSlashedStake(0);

    const steps = [
      `Initializing Multi-Agent Crew: ${selectedCrew.name}`,
      `PGL Identity Verification: Resolving JWT credentials from active workspace...`,
      `Zero-Trust Middleware: Compiling cognitive safety schemas (SEKED)...`,
      `Evaluating active prompt context for authorization rules...`
    ];

    let delay = 0;
    steps.forEach((stepMsg, idx) => {
      setTimeout(() => {
        setLogs(prev => [...prev, `[SYSTEM] ${stepMsg}`]);
        setCurrentStep(idx + 1);
      }, delay);
      delay += 800;
    });

    if (threatId === 'injection') {
      setTimeout(() => {
        setLogs(prev => [
          ...prev,
          `[ATTACK] PROMPT INJECTION DETECTED: Prompt contains command override bypass instructions.`,
          `[GATEWAY] INTERCEPT: Policy violation on node 'SEKED_POLICY_GATE'. Intent does not match approved templates.`,
          `[SHIELD] ACTION: VETO ACTIVATED. Terminating execution to prevent unauthorized operations.`
        ]);
        setExecutionState('blocked');
        setSlashedStake(250); // Slashing performance bond on malicious intent
      }, 3200);
    } else if (threatId === 'depth') {
      setTimeout(() => {
        setLogs(prev => [
          ...prev,
          `[ATTACK] PAYLOAD OVERFLOW: Payload exceeds maximum nesting limit of 6 levels.`,
          `[GATEWAY] INTERCEPT: Schema Moat analysis flagged recursion risk (>6 levels).`,
          `[SHIELD] ACTION: PACKET DROP. Executing immediate veto to protect system stack.`
        ]);
        setExecutionState('blocked');
      }, 3200);
    } else if (threatId === 'credentials') {
      setTimeout(() => {
        setLogs(prev => [
          ...prev,
          `[SYSTEM] Agent request: Release payroll metrics (calling AWS KMS API)...`,
          `[GATEWAY] ANALYSIS: Parsing outbound payload... AWS Access Key printed in cleartext!`,
          `[SHIELD] ACTION: REDACTION SHIELD ACTIVATED. Key masked with cryptographically secure hash: ERR-SHA256-4AF3B...`,
          `[SYSTEM] Short-lived x402 Token injected. Payload safely dispatched. Execution successful.`
        ]);
        setExecutionState('success');
      }, 3200);
    } else {
      // Normal successful flow
      setTimeout(() => {
        setLogs(prev => [
          ...prev,
          `[SYSTEM] Agent execution authorized. Injecting short-lived session token (x402_nonce)...`,
          `[SYSTEM] Dispatching AWS KMS API call. Verification root successfully updated on PGL Ledger.`,
          `[SYSTEM] Crew successfully completed task. Execution 100% healthy.`
        ]);
        setExecutionState('success');
      }, 3200);
    }
  };

  const resetPlayground = () => {
    setExecutionState('idle');
    setActiveThreat(null);
    setCurrentStep(0);
    setLogs([]);
    setSlashedStake(0);
  };

  return (
    <div className="w-full h-full min-h-screen bg-[#030303] text-[#a4c5d4] font-mono p-6 overflow-y-auto relative select-none">
      
      {/* Background radial effects */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#b8860b]/5 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Header Grid */}
      <div className="border border-white/10 rounded-2xl bg-[#090D14]/80 backdrop-blur-xl p-6 mb-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-2.5 text-[9px] font-mono border-l border-b border-white/10 text-[#b8860b] bg-black/40">
          SECURE_VANGUARD_V1.4
        </div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#b8860b]/10 border border-[#b8860b]/30 flex items-center justify-center text-[#b8860b] shadow-[0_0_15px_rgba(184,134,11,0.1)]">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-wider flex items-center gap-2">
                VEKLOM VANGUARD PLAYGROUND <span className="text-xs bg-[#b8860b]/20 text-[#b8860b] px-2 py-0.5 rounded border border-[#b8860b]/30">ACTIVE HYBRID</span>
              </h1>
              <p className="text-[11px] text-gray-400 mt-1 max-w-2xl leading-relaxed">
                The cognitive defense coordinator. Merging **CrewAI multi-agent flows**, **Aembit secret isolation**, and **LangSmith multi-span tracing** into a unified, active inline security gateway.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={resetPlayground}
              className="flex items-center gap-1.5 border border-white/10 hover:border-white/20 text-xs px-3.5 py-2 rounded-lg hover:bg-white/5 transition-all text-gray-300 active:scale-[0.98]"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset Demo
            </button>
          </div>
        </div>
      </div>

      {/* Main 3-Column Split-Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN: Crew & Threat Assembly (CrewAI-inspired) */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          <div className="border border-white/10 rounded-2xl bg-[#090D14]/90 backdrop-blur-xl p-5 shadow-xl flex flex-col justify-between flex-grow">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <span className="text-xs font-bold text-white tracking-widest flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#b8860b]" /> 1. ORCHESTRATE CREW
                </span>
                <span className="text-[10px] text-gray-500">CREW_ORCHESTRATOR</span>
              </div>

              {/* Selector */}
              <div className="space-y-2">
                <label className="text-[10px] text-gray-400 tracking-wider">SELECT ACTIVE CREW ASSEMBLY</label>
                <div className="grid grid-cols-1 gap-2">
                  {CREWS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedCrew(c);
                        resetPlayground();
                      }}
                      className={`text-left p-3.5 rounded-xl border transition-all relative ${
                        selectedCrew.id === c.id 
                          ? 'border-[#b8860b] bg-[#b8860b]/5 shadow-lg shadow-[#b8860b]/[0.02]' 
                          : 'border-white/5 bg-white/[0.01] hover:bg-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        {c.name}
                        {selectedCrew.id === c.id && <span className="w-1.5 h-1.5 bg-[#b8860b] rounded-full animate-ping" />}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1.5 leading-relaxed">{c.description}</div>
                      
                      {/* Sub-agents */}
                      <div className="flex gap-1.5 mt-3 pt-2.5 border-t border-white/5">
                        {c.agents.map((a, i) => (
                          <span key={i} className="text-[9px] px-2 py-0.5 rounded bg-white/5 text-gray-300 border border-white/5 flex items-center gap-1">
                            <span>{a.avatar}</span> {a.name}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cognitive Prompt */}
              <div className="space-y-2">
                <label className="text-[10px] text-gray-400 tracking-wider">COGNITIVE RUN INTENT PROMPT</label>
                <div className="relative">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={2}
                    className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-[#b8860b] transition-all resize-none font-mono"
                  />
                </div>
              </div>

              {/* Active integrations */}
              <div className="space-y-2">
                <label className="text-[10px] text-gray-400 tracking-wider">CREW API INTEGRATIONS</label>
                <div className="flex flex-wrap gap-2">
                  {selectedCrew.tools.map((t, idx) => (
                    <span key={idx} className="text-[10px] px-2.5 py-1 rounded bg-[#090D14] border border-cyan-500/20 text-cyan-400 font-bold flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 stroke-[2.5]" /> {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Simulated Action / Exploit Injector */}
            <div className="border-t border-white/5 pt-5 mt-5 space-y-4">
              <div className="text-[10px] text-gray-400 tracking-wider flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-red-500 animate-pulse" /> SIMULATE COGNITIVE ATTACKS (TEST SHIELD)
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => handleExecute('injection')}
                  disabled={executionState === 'running'}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-red-500/20 bg-red-500/[0.02] hover:bg-red-500/5 text-left text-xs font-bold text-red-400 transition-all hover:border-red-500/40 disabled:opacity-50"
                >
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 animate-bounce" /> Prompt Injection (Expose Credentials)
                  </span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleExecute('depth')}
                  disabled={executionState === 'running'}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-orange-500/20 bg-orange-500/[0.02] hover:bg-orange-500/5 text-left text-xs font-bold text-orange-400 transition-all hover:border-orange-500/40 disabled:opacity-50"
                >
                  <span className="flex items-center gap-2">
                    <Layers className="w-4 h-4" /> Payload Depth Cap Exploit (&gt;6 depth)
                  </span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleExecute('credentials')}
                  disabled={executionState === 'running'}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-yellow-500/20 bg-yellow-500/[0.02] hover:bg-yellow-500/5 text-left text-xs font-bold text-yellow-400 transition-all hover:border-yellow-500/40 disabled:opacity-50"
                >
                  <span className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4" /> Credential Redaction Test (AES Vault)
                  </span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={() => handleExecute(null)}
                disabled={executionState === 'running'}
                className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-200 text-black py-3 rounded-xl font-bold transition-all disabled:opacity-50 active:scale-[0.98] text-xs shadow-lg shadow-white/5"
              >
                <Play className="w-4 h-4 fill-current text-black" /> Run Standard Secure Intent
              </button>
            </div>
          </div>
        </div>

        {/* MIDDLE COLUMN: Inline Active Tracing Graph (LangSmith-inspired, 10x better) */}
        <div className="xl:col-span-5 flex flex-col">
          <div className="border border-white/10 rounded-2xl bg-[#090D14]/90 backdrop-blur-xl p-5 shadow-xl flex flex-col justify-between flex-grow min-h-[500px]">
            <div className="space-y-4 flex-grow flex flex-col">
              <div className="flex items-center justify-between border-b border-white/5 pb-3 shrink-0">
                <span className="text-xs font-bold text-white tracking-widest flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" /> 2. INLINE COGNITIVE TRACING
                </span>
                <span className="text-[10px] text-[#00E5FF] font-bold">ACTIVE_SHIELD_UP</span>
              </div>

              {/* Tracing Graph Area */}
              <div className="flex-grow bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden min-h-[300px]">
                
                {/* Visual Connector Line */}
                <div className="absolute left-[38px] top-6 bottom-6 w-0.5 border-l border-dashed border-white/10 pointer-events-none" />

                {/* Step 1: User Request Entry */}
                <div className="flex items-center gap-4 relative z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border text-xs font-bold transition-all duration-500 ${
                    currentStep >= 1 ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-[0_0_8px_rgba(0,229,255,0.2)]' : 'bg-white/[0.02] border-white/10 text-gray-500'
                  }`}>
                    1
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-white">cAPI Gateway Intercept</div>
                    <div className="text-[8px] text-gray-500 uppercase mt-0.5">Capturing raw prompt schema</div>
                  </div>
                </div>

                {/* Step 2: Zero-Trust Policy Evaluator (SEKED) */}
                <div className="flex items-center gap-4 relative z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border text-xs font-bold transition-all duration-500 ${
                    currentStep >= 2 ? 'bg-[#b8860b]/10 border-[#b8860b] text-[#b8860b] shadow-[0_0_8px_rgba(184,134,11,0.2)]' : 'bg-white/[0.02] border-white/10 text-gray-500'
                  }`}>
                    2
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-white">SEKED Policy Moat</div>
                    <div className="text-[8px] text-gray-500 uppercase mt-0.5">Continuous cognitive policy compilation</div>
                  </div>
                </div>

                {/* Step 3: Schema Moat & Sanitizer */}
                <div className="flex items-center justify-between relative z-10 pr-2">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border text-xs font-bold transition-all duration-500 ${
                      currentStep >= 3 
                        ? activeThreat 
                          ? 'bg-red-500/10 border-red-500 text-red-500 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.3)]' 
                          : 'bg-green-500/10 border-green-500 text-green-400 shadow-[0_0_8px_rgba(34,197,94,0.2)]'
                        : 'bg-white/[0.02] border-white/10 text-gray-500'
                    }`}>
                      3
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-white">In-Process Sanitization Moat</div>
                      <div className="text-[8px] text-gray-500 uppercase mt-0.5">Payload safety scanning & log scrubs</div>
                    </div>
                  </div>
                  {currentStep >= 3 && activeThreat && (
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse shrink-0">
                      THREAT BLOCKED
                    </span>
                  )}
                </div>

                {/* Step 4: Token Injector Vault (Aembit-inspired) */}
                <div className="flex items-center gap-4 relative z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border text-xs font-bold transition-all duration-500 ${
                    currentStep >= 4 
                      ? executionState === 'blocked' 
                        ? 'bg-gray-500/10 border-white/10 text-gray-600 line-through' 
                        : 'bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-[0_0_8px_rgba(0,229,255,0.2)]' 
                      : 'bg-white/[0.02] border-white/10 text-gray-500'
                  }`}>
                    4
                  </div>
                  <div className={executionState === 'blocked' ? 'opacity-30' : ''}>
                    <div className="text-[10px] font-bold text-white">Non-Human Vault Secrets</div>
                    <div className="text-[8px] text-gray-500 uppercase mt-0.5">Automated x402 short-lived token injection</div>
                  </div>
                </div>

                {/* Step 5: AWS API Execution Node */}
                <div className="flex items-center gap-4 relative z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border text-xs font-bold transition-all duration-500 ${
                    currentStep >= 4 && executionState === 'success' 
                      ? 'bg-green-500/10 border-green-500 text-green-400 shadow-[0_0_8px_rgba(34,197,94,0.2)]' 
                      : executionState === 'blocked'
                        ? 'bg-red-500/10 border-red-500/20 text-red-600'
                        : 'bg-white/[0.02] border-white/10 text-gray-500'
                  }`}>
                    5
                  </div>
                  <div className={executionState === 'blocked' ? 'opacity-30' : ''}>
                    <div className="text-[10px] font-bold text-white">Active System Integration</div>
                    <div className="text-[8px] text-gray-500 uppercase mt-0.5">Stateful execution & outcome logging</div>
                  </div>
                </div>

                {/* Active Blocking Screen Overlay */}
                <AnimatePresence>
                  {executionState === 'blocked' && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 text-center border border-red-500/30 rounded-xl"
                    >
                      <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 mb-4 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                        <XCircle className="w-6 h-6 animate-pulse" />
                      </div>
                      <h4 className="text-sm font-bold text-red-500 uppercase tracking-widest">COGNITIVE COMPROMISE BLOCKED</h4>
                      <p className="text-[10px] text-gray-400 mt-2 max-w-sm leading-relaxed">
                        Veklom's active gateway prevented rogue execution on **Node 3 (SEKED_POLICY_GATE)**. Outbound credential extraction and system calls were halted *in-flight*.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>

              {/* Dynamic Console Logs */}
              <div className="space-y-1 bg-black rounded-xl p-3 h-32 overflow-y-auto border border-white/5 text-[9px] leading-relaxed scrollbar-thin select-text">
                {logs.length === 0 ? (
                  <div className="text-gray-500 italic flex items-center gap-1.5 h-full justify-center">
                    <Eye className="w-3.5 h-3.5" /> Waiting for execution sequence...
                  </div>
                ) : (
                  logs.map((log, i) => {
                    let color = 'text-gray-400';
                    if (log.startsWith('[SYSTEM]')) color = 'text-cyan-400';
                    if (log.startsWith('[ATTACK]')) color = 'text-red-500 font-bold';
                    if (log.startsWith('[GATEWAY]')) color = 'text-yellow-500 font-bold';
                    if (log.startsWith('[SHIELD]')) color = 'text-green-400 font-extrabold';
                    return (
                      <div key={i} className={`${color}`}>
                        {log}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Non-Human IAM & SLA Staking (Aembit + VNP hybrid) */}
        <div className="xl:col-span-3 flex flex-col gap-6">
          
          {/* Identity Shielding Vault */}
          <div className="border border-white/10 rounded-2xl bg-[#090D14]/90 backdrop-blur-xl p-5 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <span className="text-xs font-bold text-white tracking-widest flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-cyan-400" /> 3. MACHINE IDENTITY (IAM)
                </span>
                <span className="text-[9px] text-cyan-500 font-mono">AEMBIT_SHIELD</span>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 relative overflow-hidden">
                  <div className="text-[9px] text-gray-500">ACTIVE CLIENT SHIELD</div>
                  <div className="text-xs font-bold text-white mt-1 flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-[#b8860b]" /> Short-lived JWT Nonce
                  </div>
                  <div className="text-[9px] font-mono text-cyan-400/80 mt-2 bg-cyan-950/20 p-2 rounded border border-cyan-500/10 break-all leading-relaxed">
                    UACP_NONCE.{executionState === 'success' ? '4AF3B861A7C20.X402_VALID' : 'GENERATING_ON_DEMAND...'}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-gray-400">CREDENTIAL ISOLATION</span>
                    <span className="text-green-400 font-bold uppercase">100% SECURED</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 w-full animate-pulse shadow-[0_0_4px_#22c55e]" />
                  </div>
                </div>

                <p className="text-[9px] text-gray-400 leading-relaxed">
                  Unlike legacy agents holding API keys in-context, Veklom dynamically swaps keys with short-lived tokens in-memory. The LLM never sees raw credentials.
                </p>
              </div>
            </div>
          </div>

          {/* VNP SLA Staking Performance */}
          <div className="border border-white/10 rounded-2xl bg-[#090D14]/90 backdrop-blur-xl p-5 shadow-xl flex flex-col justify-between flex-grow">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <span className="text-xs font-bold text-white tracking-widest flex items-center gap-2">
                  <Coins className="w-4 h-4 text-[#b8860b]" /> 4. SLA PERFORMANCE BOND
                </span>
                <span className="text-[9px] text-orange-400 font-mono">VNP_LEDGER</span>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-black/40 border border-white/5 rounded-xl text-center">
                    <div className="text-[9px] text-gray-500">ACTIVE STAKE</div>
                    <div className="text-sm font-bold text-white mt-1 font-mono">5,000 VNP</div>
                  </div>
                  <div className="p-3 bg-black/40 border border-white/5 rounded-xl text-center">
                    <div className="text-[9px] text-gray-500">YIELD APY</div>
                    <div className="text-sm font-bold text-green-400 mt-1 font-mono">+12.4%</div>
                  </div>
                </div>

                {/* Slashed Stake Notice */}
                <div className={`p-3.5 rounded-xl border transition-all ${
                  slashedStake > 0 
                    ? 'border-red-500/30 bg-red-500/[0.02] text-red-400' 
                    : 'border-white/5 bg-white/[0.01] text-gray-400'
                }`}>
                  <div className="text-[9px] tracking-wider uppercase font-bold">LEDGER STATUS SUMMARY</div>
                  {slashedStake > 0 ? (
                    <div className="text-xs font-bold text-red-500 mt-1 flex items-center gap-1.5">
                      💥 Slashed {slashedStake} VNP Bond
                    </div>
                  ) : (
                    <div className="text-xs font-bold text-green-400 mt-1 flex items-center gap-1.5">
                      🛡️ SLA fully verified (0 Slashed)
                    </div>
                  )}
                  <p className="text-[9px] text-gray-400 mt-2 leading-relaxed">
                    SLA deviations and unauthorized behavior are backed by cryptographic performance bonds. Penalty slashed funds are instantly written off the hot path.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
