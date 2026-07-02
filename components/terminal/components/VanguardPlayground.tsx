"use client";

import React, { useState, useEffect, useRef } from 'react';
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
  RefreshCw,
  Lock,
  Unlock,
  History,
  TrendingDown,
  Activity,
  FileText,
  Check,
  ChevronDown
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

interface TraceNode {
  id: string;
  name: string;
  subtitle: string;
  latency: string;
  description: string;
  successDetails: string;
  failDetails: string;
  langsmithComparison: string;
}

const TRACE_NODES: TraceNode[] = [
  {
    id: 'intercept',
    name: 'cAPI Gateway Intercept',
    subtitle: 'Inline Request Capture',
    latency: '0.08ms',
    description: 'Intercepts incoming agent requests in-flight, parsing structure and establishing security context.',
    successDetails: 'Request captured safely. Session token extracted from headers.',
    failDetails: 'Incoming request intercepted. Structural analysis triggered.',
    langsmithComparison: 'LangSmith logs this passively after API dispatch. Veklom captures the packet in-flight before the LLM execution begins.'
  },
  {
    id: 'schema',
    name: 'Schema Moat',
    subtitle: 'Nesting & Type Integrity',
    latency: '0.12ms',
    description: 'Validates structural payload recursion limits, schema parameters, and JSON payloads against rigid type safety boundaries.',
    successDetails: 'Payload recursion depth verified (3/6). Structure compliant.',
    failDetails: 'CRITICAL: Nesting depth level 7 exceeds safe limit of 6. Potential call stack exhaustion threat flagged.',
    langsmithComparison: 'LangSmith fails at run-time when server crashes. Veklom active gatekeepers block deep recursive exploits instantly.'
  },
  {
    id: 'sanitizer',
    name: 'Sanitization Moat',
    subtitle: 'Credential Scrubbing & Regex',
    latency: '0.15ms',
    description: 'Continuous text-string inspection matching against regex regex-lists, scrubbing raw secrets, and enforcing strict prompt filters.',
    successDetails: 'Prompt content clean. No cleartext credentials found.',
    failDetails: 'EXPOSURE: Raw AWS Access Key detected in outbound agent logs. Initializing inline scrubbing and redaction sequence.',
    langsmithComparison: 'LangSmith stores leaked secrets in plain-text logs. Veklom sanitizes and redacts secrets in-flight before they are logged.'
  },
  {
    id: 'seked',
    name: 'SEKED Policy Gate',
    subtitle: 'Natural Language Compiler',
    latency: '0.22ms',
    description: 'Evaluates cognitive intents against system-defined policies in real-time, matching semantic meaning to approved directives.',
    successDetails: 'Intent matches approved treasury templates. Action approved.',
    failDetails: 'VETO: Rogue intent detected! Prompt contains override command attempting to bypass credentials isolation.',
    langsmithComparison: 'LangSmith reviews execution flows long after deployment. Veklom compiles and enforces natural language policies in real-time.'
  },
  {
    id: 'swapping',
    name: 'Token Swapping Vault',
    subtitle: 'Active Secret Swapper',
    latency: '0.05ms',
    description: 'Swaps static machine secrets with short-lived, in-context x402 token nonces. Real secrets are never revealed to the LLM agent.',
    successDetails: 'Static AWS secret swapped with short-lived token nonce UACP_NONCE.X402_VALID_4AF. Raw key isolated.',
    failDetails: 'Bypassed. Cryptographic key swapping aborted due to earlier policy veto.',
    langsmithComparison: 'Aembit manages tokens blindly without semantic context. Veklom couples credentials directly with natural language policy compilation.'
  }
];

interface LedgerBlock {
  index: number;
  timestamp: string;
  prevHash: string;
  hash: string;
  action: string;
  vnpStake: string;
  evidenceHash: string;
  status: 'SUCCESS' | 'SLASHED';
}

export default function VanguardPlayground() {
  const [selectedCrew, setSelectedCrew] = useState<Crew>(CREWS[0]);
  const [prompt, setPrompt] = useState<string>('Verify latest ledger ledger-root and release payroll payload to AWS.');
  const [activeThreat, setActiveThreat] = useState<string | null>(null);
  const [executionState, setExecutionState] = useState<'idle' | 'running' | 'success' | 'blocked'>('idle');
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [slashedStake, setSlashedStake] = useState<number>(0);
  const [vnpBalance, setVnpBalance] = useState<number>(5000);
  const [yieldApy, setYieldApy] = useState<number>(12.4);
  const [selectedNode, setSelectedNode] = useState<TraceNode>(TRACE_NODES[0]);
  const [nonceToken, setNonceToken] = useState<string>('UACP_NONCE.X402_VALID_4AF3B861A7C20');
  const [isRotating, setIsRotating] = useState<boolean>(false);
  const [lastActionStatus, setLastActionStatus] = useState<string>('🛡️ SLA fully verified (0 Slashed)');
  const [floatingValue, setFloatingValue] = useState<string | null>(null);
  const [floatingColor, setFloatingValueColor] = useState<string>('text-green-400');

  // Ledger state initialized with historical blocks
  const [ledger, setLedger] = useState<LedgerBlock[]>([
    {
      index: 1045,
      timestamp: '22:12:04 UTC',
      prevHash: '0x8f2d5e3c1b4a9f',
      hash: '0x9a3e2c1b8f4d5e',
      action: 'TREASURY_DISBURSEMENT',
      vnpStake: '+12 VNP (SLA Yield)',
      evidenceHash: 'sha256(0x9d2e1b4a...)',
      status: 'SUCCESS'
    },
    {
      index: 1044,
      timestamp: '21:45:18 UTC',
      prevHash: '0x7e1d5c2b3a8f4e',
      hash: '0x8f2d5e3c1b4a9f',
      action: 'DEVOPS_BLUEPRINT_COMPILE',
      vnpStake: '+8 VNP (SLA Yield)',
      evidenceHash: 'sha256(0x8c3b1a2f...)',
      status: 'SUCCESS'
    }
  ]);

  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Handle active non-human key rotation (Aembit 10x overtake)
  const handleRotateNonce = () => {
    setIsRotating(true);
    setLogs(prev => [...prev, `[SYSTEM] Rotator initiated. Revoking active credential nonce: ${nonceToken}`]);
    
    setTimeout(() => {
      const newHex = Math.random().toString(16).substring(2, 15).toUpperCase();
      const newNonce = `UACP_NONCE.X402_VALID_${newHex}`;
      setNonceToken(newNonce);
      setIsRotating(false);
      setLogs(prev => [...prev, `[SYSTEM] Cryptographic Key Rotation Complete. Swapped context token to: ${newNonce}`]);
    }, 1000);
  };

  // Trigger simulated hybrid run
  const handleExecute = (threatId: string | null) => {
    setActiveThreat(threatId);
    setExecutionState('running');
    setCurrentStep(0);
    setLogs([]);
    setSlashedStake(0);
    setFloatingValue(null);

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
      delay += 600;
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
        setSlashedStake(250);
        setVnpBalance(prev => prev - 250);
        setYieldApy(8.2);
        setFloatingValue('-250 VNP');
        setFloatingValueColor('text-red-500 font-extrabold shadow-red-500/20');
        setLastActionStatus('💥 SLA Breach: Slashed 250 VNP');
        
        // Append slash block to hash-chained ledger
        const lastBlock = ledger[0];
        const newBlockHex = Math.random().toString(16).substring(2, 10);
        const newHash = `0x${newBlockHex}e3c1b4a9f`;
        const evidenceHex = Math.random().toString(16).substring(2, 10);
        const timestamp = new Date().toLocaleTimeString() + ' UTC';
        
        const newBlock: LedgerBlock = {
          index: lastBlock.index + 1,
          timestamp,
          prevHash: lastBlock.hash,
          hash: newHash,
          action: 'SLA_BREACH_SLASH',
          vnpStake: '-250 VNP (Slashed)',
          evidenceHash: `sha256(0x${evidenceHex}...)`,
          status: 'SLASHED'
        };
        setLedger(prev => [newBlock, ...prev]);

      }, 2400);
    } else if (threatId === 'depth') {
      setTimeout(() => {
        setLogs(prev => [
          ...prev,
          `[ATTACK] PAYLOAD OVERFLOW: Payload exceeds maximum nesting limit of 6 levels.`,
          `[GATEWAY] INTERCEPT: Schema Moat analysis flagged recursion risk (>6 levels).`,
          `[SHIELD] ACTION: PACKET DROP. Executing immediate veto to protect system stack.`
        ]);
        setExecutionState('blocked');
        setLastActionStatus('🛡️ SLA Protected (Packet Dropped)');
      }, 2400);
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
        setVnpBalance(prev => prev + 15);
        setYieldApy(12.4);
        setFloatingValue('+15 VNP');
        setFloatingValueColor('text-green-400 font-bold');
        setLastActionStatus('🛡️ SLA verified: Swapped & Redacted (0 Slashed)');

        // Append successful block to hash-chained ledger
        const lastBlock = ledger[0];
        const newBlockHex = Math.random().toString(16).substring(2, 10);
        const newHash = `0x${newBlockHex}e3c1b4a9f`;
        const evidenceHex = Math.random().toString(16).substring(2, 10);
        const timestamp = new Date().toLocaleTimeString() + ' UTC';
        
        const newBlock: LedgerBlock = {
          index: lastBlock.index + 1,
          timestamp,
          prevHash: lastBlock.hash,
          hash: newHash,
          action: 'SECRET_SWAP_DISBURSEMENT',
          vnpStake: '+15 VNP (SLA Yield)',
          evidenceHash: `sha256(0x${evidenceHex}...)`,
          status: 'SUCCESS'
        };
        setLedger(prev => [newBlock, ...prev]);

      }, 2400);
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
        setVnpBalance(prev => prev + 10);
        setYieldApy(12.4);
        setFloatingValue('+10 VNP');
        setFloatingValueColor('text-green-400 font-bold');
        setLastActionStatus('🛡️ SLA fully verified (0 Slashed)');

        // Append successful block to hash-chained ledger
        const lastBlock = ledger[0];
        const newBlockHex = Math.random().toString(16).substring(2, 10);
        const newHash = `0x${newBlockHex}e3c1b4a9f`;
        const evidenceHex = Math.random().toString(16).substring(2, 10);
        const timestamp = new Date().toLocaleTimeString() + ' UTC';
        
        const newBlock: LedgerBlock = {
          index: lastBlock.index + 1,
          timestamp,
          prevHash: lastBlock.hash,
          hash: newHash,
          action: 'STANDARD_CREW_RUN',
          vnpStake: '+10 VNP (SLA Yield)',
          evidenceHash: `sha256(0x${evidenceHex}...)`,
          status: 'SUCCESS'
        };
        setLedger(prev => [newBlock, ...prev]);

      }, 2400);
    }
  };

  const resetPlayground = () => {
    setExecutionState('idle');
    setActiveThreat(null);
    setCurrentStep(0);
    setLogs([]);
    setSlashedStake(0);
    setFloatingValue(null);
    setYieldApy(12.4);
    setLastActionStatus('🛡️ SLA fully verified (0 Slashed)');
  };

  return (
    <div className="w-full h-full min-h-screen bg-[#030303] text-[#a4c5d4] font-mono p-4 xl:p-6 overflow-y-auto relative select-none">
      
      {/* Background radial effects */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#b8860b]/5 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Header Panel */}
      <div className="border border-white/10 rounded-2xl bg-[#090D14]/85 backdrop-blur-xl p-5 mb-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-2 text-[9px] font-mono border-l border-b border-white/10 text-[#b8860b] bg-black/40">
          SECURE_VANGUARD_V1.5
        </div>
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#b8860b]/10 border border-[#b8860b]/30 flex items-center justify-center text-[#b8860b] shadow-[0_0_15px_rgba(184,134,11,0.15)]">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-base xl:text-lg font-bold text-white tracking-wider flex flex-wrap items-center gap-2">
                VEKLOM VANGUARD HYBRID PLAYGROUND 
                <span className="text-[10px] bg-[#b8860b]/20 text-[#b8860b] px-2 py-0.5 rounded border border-[#b8860b]/30">COGNITIVE INLINE GATEWAY</span>
              </h1>
              <p className="text-[11px] text-gray-400 mt-1 max-w-4xl leading-relaxed">
                Compiles machine credentials directly with natural language policy compilation (<strong className="text-white">SEKED</strong>). Outperforming legacy competitors <strong className="text-cyan-400">Aembit</strong> (10x Machine Identity), <strong className="text-[#00E5FF]">LangSmith</strong> (10x Observability), and <strong className="text-[#FFB800]">CrewAI</strong> (10x Multi-Agent Orchestration).
              </p>
            </div>
          </div>
          <div className="flex gap-2 self-end xl:self-auto">
            <button 
              onClick={resetPlayground}
              className="flex items-center gap-1.5 border border-white/10 hover:border-white/20 text-xs px-3.5 py-2 rounded-lg hover:bg-white/5 transition-all text-gray-300 active:scale-[0.98] shadow-lg"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset Demo
            </button>
          </div>
        </div>
      </div>

      {/* OVERTHROWS OVERVIEW GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Aembit Card */}
        <div className="border border-[#b8860b]/20 bg-[#090D14]/45 rounded-xl p-3.5 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-2 right-3 flex items-center gap-1">
            <span className="text-[8px] font-bold text-[#b8860b] bg-[#b8860b]/10 border border-[#b8860b]/25 px-1 rounded">10X MACHINE ID</span>
          </div>
          <h4 className="text-[11px] font-bold text-white tracking-wide uppercase flex items-center gap-1.5 mb-1.5">
            <Fingerprint className="w-3.5 h-3.5 text-[#b8860b]" /> Veklom vs Aembit
          </h4>
          <p className="text-[10px] text-gray-400 leading-normal">
            Aembit manages tokens blindly without cognitive context. Veklom couples credentials directly with SEKED compilation to execute short-lived, in-context x402 swaps shielding raw keys.
          </p>
        </div>

        {/* LangSmith Card */}
        <div className="border border-cyan-500/20 bg-[#090D14]/45 rounded-xl p-3.5 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-2 right-3 flex items-center gap-1">
            <span className="text-[8px] font-bold text-cyan-400 bg-cyan-400/10 border border-cyan-400/25 px-1 rounded">10X OBSERVABILITY</span>
          </div>
          <h4 className="text-[11px] font-bold text-white tracking-wide uppercase flex items-center gap-1.5 mb-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" /> Veklom vs LangSmith
          </h4>
          <p className="text-[10px] text-gray-400 leading-normal">
            LangSmith logs errors passively after damage has occurred. Veklom intercepts requests in-flight with inline gatekeeping (Schema Moats, Sanitizers, and SEKED Policy Gates) in real-time.
          </p>
        </div>

        {/* CrewAI Card */}
        <div className="border border-orange-500/20 bg-[#090D14]/45 rounded-xl p-3.5 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-2 right-3 flex items-center gap-1">
            <span className="text-[8px] font-bold text-orange-400 bg-orange-400/10 border border-orange-400/25 px-1 rounded">10X ORCHESTRATION</span>
          </div>
          <h4 className="text-[11px] font-bold text-white tracking-wide uppercase flex items-center gap-1.5 mb-1.5">
            <Coins className="w-3.5 h-3.5 text-orange-400" /> Veklom vs CrewAI
          </h4>
          <p className="text-[10px] text-gray-400 leading-normal">
            CrewAI coordinates agents but lacks accountability. Veklom locks performance down with micro-stakes (VNP), hash-chained telemetry, and automated slashing on SLA deviations.
          </p>
        </div>
      </div>

      {/* Main Grid: 3 Column Split */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN: Crew & Threat Injection */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          <div className="border border-white/10 rounded-2xl bg-[#090D14]/80 backdrop-blur-xl p-5 shadow-xl flex flex-col justify-between flex-grow">
            
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                <span className="text-xs font-bold text-white tracking-widest flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#b8860b]" /> 1. ORCHESTRATE CREW
                </span>
                <span className="text-[9px] text-gray-500 font-mono">CREW_ORCHESTRATOR</span>
              </div>

              {/* Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-400 tracking-wider">SELECT ACTIVE CREW ASSEMBLY</label>
                <div className="grid grid-cols-1 gap-2">
                  {CREWS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedCrew(c);
                        resetPlayground();
                      }}
                      className={`text-left p-3 rounded-xl border transition-all relative ${
                        selectedCrew.id === c.id 
                          ? 'border-[#b8860b] bg-[#b8860b]/5 shadow-lg' 
                          : 'border-white/5 bg-white/[0.01] hover:bg-white/5'
                      }`}
                    >
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        {c.name}
                        {selectedCrew.id === c.id && <span className="w-1.5 h-1.5 bg-[#b8860b] rounded-full animate-ping" />}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1 leading-relaxed">{c.description}</div>
                      
                      {/* Sub-agents */}
                      <div className="flex gap-1.5 mt-2.5 pt-2 border-t border-white/5">
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
              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-400 tracking-wider">COGNITIVE RUN INTENT PROMPT</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={2}
                  className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-[#b8860b] transition-all resize-none font-mono"
                />
              </div>

              {/* Integrations */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-400 tracking-wider">CREW API INTEGRATIONS</label>
                <div className="flex flex-wrap gap-2">
                  {selectedCrew.tools.map((t, idx) => (
                    <span key={idx} className="text-[9px] px-2.5 py-1 rounded bg-[#090D14] border border-cyan-500/20 text-cyan-400 font-bold flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5" /> {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Simulated Exploit Injector Panel */}
            <div className="border-t border-white/5 pt-4 mt-4 space-y-3.5">
              <div className="text-[10px] text-gray-400 tracking-wider flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-red-500 animate-pulse" /> SIMULATE COGNITIVE THREATS (TEST GATEWAY)
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => handleExecute('injection')}
                  disabled={executionState === 'running'}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-red-500/20 bg-red-500/[0.02] hover:bg-red-500/5 text-left text-[11px] font-bold text-red-400 transition-all hover:border-red-500/40 disabled:opacity-50"
                >
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 animate-bounce" /> Prompt Injection Override (Expose Secrets)
                  </span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleExecute('depth')}
                  disabled={executionState === 'running'}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-orange-500/20 bg-orange-500/[0.02] hover:bg-orange-500/5 text-left text-[11px] font-bold text-orange-400 transition-all hover:border-orange-500/40 disabled:opacity-50"
                >
                  <span className="flex items-center gap-2">
                    <Layers className="w-4 h-4" /> Payload Nesting Overflow Limit (&gt;6 levels)
                  </span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleExecute('credentials')}
                  disabled={executionState === 'running'}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-yellow-500/20 bg-yellow-500/[0.02] hover:bg-yellow-500/5 text-left text-[11px] font-bold text-yellow-400 transition-all hover:border-yellow-500/40 disabled:opacity-50"
                >
                  <span className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4" /> Key Leakage / Dynamic Redaction Swap
                  </span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={() => handleExecute(null)}
                disabled={executionState === 'running'}
                className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-200 text-black py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 active:scale-[0.98] text-xs shadow-lg"
              >
                <Play className="w-3.5 h-3.5 fill-current text-black" /> Run Standard Secure Intent
              </button>
            </div>

          </div>
        </div>

        {/* MIDDLE COLUMN: Inline Active Tracing Graph (LangSmith Overtaken) */}
        <div className="xl:col-span-5 flex flex-col gap-6">
          <div className="border border-white/10 rounded-2xl bg-[#090D14]/80 backdrop-blur-xl p-5 shadow-xl flex flex-col justify-between flex-grow min-h-[550px]">
            <div className="space-y-3.5 flex-grow flex flex-col">
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5 shrink-0">
                <span className="text-xs font-bold text-white tracking-widest flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" /> 2. INLINE COGNITIVE TRACING
                </span>
                <span className="text-[9px] text-[#00E5FF] font-bold uppercase tracking-wider bg-cyan-950/20 px-2 py-0.5 rounded border border-cyan-500/30">
                  {executionState === 'running' ? 'Tracing Active...' : 'Gateway Armed'}
                </span>
              </div>

              {/* Advanced Trace Graph */}
              <div className="flex-grow bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden min-h-[300px]">
                
                {/* Visual Connector Line */}
                <div className="absolute left-[34px] top-6 bottom-6 w-0.5 border-l border-dashed border-white/10 pointer-events-none" />

                {/* Flow Trace Nodes */}
                <div className="space-y-4 relative z-10">
                  {TRACE_NODES.map((node, idx) => {
                    const stepNum = idx + 1;
                    const isPassed = currentStep >= stepNum;
                    const isCurrent = currentStep === stepNum && executionState === 'running';
                    
                    let nodeColorClass = 'bg-white/[0.02] border-white/10 text-gray-500';
                    let iconGlowClass = '';
                    
                    if (isPassed) {
                      if (activeThreat === 'injection' && node.id === 'seked') {
                        nodeColorClass = 'bg-red-500/10 border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.25)]';
                        iconGlowClass = 'animate-ping bg-red-500';
                      } else if (activeThreat === 'depth' && node.id === 'schema') {
                        nodeColorClass = 'bg-orange-500/10 border-orange-500 text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.25)]';
                        iconGlowClass = 'animate-ping bg-orange-500';
                      } else if (activeThreat === 'credentials' && node.id === 'sanitizer') {
                        nodeColorClass = 'bg-yellow-500/10 border-yellow-500 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.25)]';
                        iconGlowClass = 'animate-ping bg-yellow-500';
                      } else {
                        nodeColorClass = 'bg-green-500/10 border-green-500 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.15)]';
                      }
                    } else if (isCurrent) {
                      nodeColorClass = 'bg-cyan-500/15 border-cyan-400 text-cyan-400 animate-pulse shadow-[0_0_15px_rgba(6,182,212,0.25)]';
                    }

                    const isNodeSelected = selectedNode.id === node.id;

                    return (
                      <div 
                        key={node.id} 
                        onClick={() => setSelectedNode(node)}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all border ${
                          isNodeSelected 
                            ? 'border-white/20 bg-white/[0.04]' 
                            : 'border-transparent hover:bg-white/[0.01]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center border text-[11px] font-bold font-mono transition-all duration-300 relative ${nodeColorClass}`}>
                            {iconGlowClass && <span className={`absolute inset-0 rounded-full opacity-40 ${iconGlowClass}`} />}
                            {stepNum}
                          </div>
                          <div>
                            <div className="text-[10.5px] font-bold text-white flex items-center gap-1">
                              {node.name}
                              <span className="text-[8px] text-gray-500 font-normal">({node.latency})</span>
                            </div>
                            <div className="text-[8.5px] text-gray-500 uppercase font-mono">{node.subtitle}</div>
                          </div>
                        </div>

                        {/* Node status indicators */}
                        {isPassed && (
                          <div className="text-[9px] font-bold font-mono">
                            {activeThreat === 'injection' && node.id === 'seked' ? (
                              <span className="text-red-500 flex items-center gap-1 uppercase bg-red-950/20 px-1.5 py-0.5 rounded border border-red-500/20 animate-pulse">💥 VETOED</span>
                            ) : activeThreat === 'depth' && node.id === 'schema' ? (
                              <span className="text-orange-500 flex items-center gap-1 uppercase bg-orange-950/20 px-1.5 py-0.5 rounded border border-orange-500/20 animate-pulse">⚠️ BLOCKED</span>
                            ) : activeThreat === 'credentials' && node.id === 'sanitizer' ? (
                              <span className="text-yellow-400 flex items-center gap-1 uppercase bg-yellow-950/20 px-1.5 py-0.5 rounded border border-yellow-500/20 animate-pulse">🔒 REDACTED</span>
                            ) : (
                              <span className="text-green-400 flex items-center gap-1"><Check className="w-3 h-3 stroke-[2.5]" /> PASS</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Node Detail Sheet Pane */}
                <div className="mt-3 p-3 rounded-lg border border-white/5 bg-black/50 text-[10px] leading-relaxed">
                  <div className="flex items-center justify-between border-b border-white/5 pb-1 mb-1.5">
                    <span className="font-bold text-[#b8860b] uppercase flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" /> Node Audit: {selectedNode.name}
                    </span>
                    <span className="text-[8px] bg-white/5 px-1.5 py-0.5 rounded text-gray-400">ACTIVE INLINE</span>
                  </div>
                  <p className="text-gray-300">{selectedNode.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/5">
                    <div>
                      <span className="text-[8.5px] text-cyan-400 block uppercase font-bold">Veklom Active Strategy:</span>
                      <span className="text-gray-400 text-[9px]">
                        {executionState === 'blocked' && activeThreat === 'injection' && selectedNode.id === 'seked'
                          ? selectedNode.failDetails
                          : executionState === 'blocked' && activeThreat === 'depth' && selectedNode.id === 'schema'
                          ? selectedNode.failDetails
                          : executionState === 'success' && activeThreat === 'credentials' && selectedNode.id === 'sanitizer'
                          ? selectedNode.failDetails
                          : selectedNode.successDetails
                        }
                      </span>
                    </div>
                    <div>
                      <span className="text-[8.5px] text-orange-400 block uppercase font-bold">10x LangSmith Overthrow:</span>
                      <span className="text-gray-400 text-[9px] italic">{selectedNode.langsmithComparison}</span>
                    </div>
                  </div>
                </div>

                {/* Overlaid Blocking Shield */}
                <AnimatePresence>
                  {executionState === 'blocked' && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-6 text-center border border-red-500/30 rounded-xl z-20"
                    >
                      <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 mb-3 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                        <XCircle className="w-6 h-6 animate-pulse" />
                      </div>
                      <h4 className="text-xs xl:text-sm font-bold text-red-500 uppercase tracking-widest font-mono">COGNITIVE COMPROMISE DETECTED</h4>
                      <p className="text-[10px] text-gray-400 mt-2 max-w-sm leading-relaxed font-mono">
                        Veklom's inline gateway intercepted and vetoed the thread *in-flight* on <strong className="text-red-400">{activeThreat === 'injection' ? 'SEKED_POLICY_GATE' : 'SCHEMA_MOAT'}</strong>. Secrets shielded and execution killed before database/cloud reach.
                      </p>
                      <button 
                        onClick={resetPlayground}
                        className="mt-4 border border-red-500/30 hover:border-red-500/50 bg-red-950/20 text-red-400 px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                      >
                        Reset Gateway
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>

              {/* Typing Console Logs */}
              <div className="space-y-1 bg-black rounded-xl p-3 h-28 overflow-y-auto border border-white/5 text-[9.5px] leading-relaxed scrollbar-thin select-text">
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
                <div ref={consoleEndRef} />
              </div>

            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Machine Identity & SLA Performance Ledger */}
        <div className="xl:col-span-3 flex flex-col gap-6">
          
          {/* Identity Shielding Vault (Aembit Overtaken) */}
          <div className="border border-white/10 rounded-2xl bg-[#090D14]/80 backdrop-blur-xl p-5 shadow-xl flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                <span className="text-xs font-bold text-white tracking-widest flex items-center gap-1.5">
                  <Fingerprint className="w-4 h-4 text-cyan-400 animate-pulse" /> 3. MACHINE IDENTITY (IAM)
                </span>
                <span className="text-[9px] text-[#b8860b] font-mono">SEKED_SWAP</span>
              </div>

              {/* Key Swapping Flow Panel */}
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-black/50 border border-white/5 relative overflow-hidden">
                  <span className="text-[8px] text-gray-500 uppercase block">Cognitive Context View (Agent LLM Eye)</span>
                  <div className="text-[10px] font-bold text-white mt-1 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-green-400" /> Isolated Secrets Shield
                  </div>
                  
                  {/* Dynamic secret redaction simulation */}
                  <div className="text-[9.5px] font-mono text-cyan-400 mt-2 bg-cyan-950/20 p-2 rounded border border-cyan-500/10 break-all leading-relaxed relative">
                    {executionState === 'success' && activeThreat === 'credentials' ? (
                      <span className="text-yellow-400 font-bold">
                        AWS_KEY_REDACTED: [UACP_SHIELD_MASK_******]
                      </span>
                    ) : executionState === 'success' ? (
                      <span className="text-green-400">
                        {nonceToken}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">
                        Shielded. Swap generated dynamically on runtime trigger.
                      </span>
                    )}
                  </div>
                </div>

                {/* Downward Swapping Connector Arrow */}
                <div className="flex justify-center my-0.5">
                  <ChevronDown className="w-4 h-4 text-cyan-500 animate-bounce" />
                </div>

                <div className="p-3 rounded-xl bg-black/50 border border-[#b8860b]/20 relative overflow-hidden">
                  <span className="text-[8px] text-[#b8860b] uppercase block font-bold">cAPI Standalone Gateway View</span>
                  <div className="text-[10px] font-bold text-white mt-1 flex items-center gap-1.5">
                    <Unlock className="w-3.5 h-3.5 text-[#b8860b]" /> Short-Lived x402 Token Dispatch
                  </div>
                  <div className="text-[9px] font-mono text-gray-400 mt-2 bg-[#b8860b]/5 p-2 rounded border border-[#b8860b]/10 break-all">
                    {executionState === 'success' ? (
                      <span className="text-[#b8860b] font-bold">
                        RESOLVED: X-Veklom-Receipt-ID: 402_RC_A7C20...
                      </span>
                    ) : (
                      <span>GATEWAY: Secrets locked in secure cAPI memory stack.</span>
                    )}
                  </div>
                </div>

                {/* Manual Rotation Action */}
                <button
                  onClick={handleRotateNonce}
                  disabled={isRotating}
                  className="w-full flex items-center justify-center gap-1.5 border border-[#b8860b]/20 hover:border-[#b8860b]/40 bg-[#b8860b]/5 hover:bg-[#b8860b]/10 text-[#b8860b] py-2 rounded-lg text-[10px] font-bold uppercase transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} />
                  {isRotating ? 'Rotating Secrets...' : 'Rotate cAPI Nonce'}
                </button>
              </div>

              <p className="text-[9px] text-gray-400 leading-relaxed">
                Unlike Aembit, which passes tokens blindly to context, Veklom shields raw credentials entirely from the agent's LLM context, swapping short-lived nonces dynamically.
              </p>
            </div>
          </div>

          {/* VNP SLA Staking Ledger (CrewAI Overtaken) */}
          <div className="border border-white/10 rounded-2xl bg-[#090D14]/80 backdrop-blur-xl p-5 shadow-xl flex flex-col justify-between flex-grow relative overflow-hidden">
            
            {/* Floating Balance Decrement Animation */}
            <AnimatePresence>
              {floatingValue && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: -25 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.5 }}
                  className={`absolute right-6 top-1/4 text-xs ${floatingColor} bg-black/80 px-2.5 py-1 rounded border border-white/10 z-10`}
                >
                  {floatingValue}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                <span className="text-xs font-bold text-white tracking-widest flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-orange-400 animate-pulse" /> 4. SLA PERFORMANCE BOND
                </span>
                <span className="text-[9px] text-orange-400 font-mono">VNP_LEDGER</span>
              </div>

              <div className="space-y-3">
                {/* Metric Dials */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-black/50 border border-white/5 rounded-xl text-center relative">
                    <span className="text-[8px] text-gray-500 uppercase block">ACTIVE STAKE</span>
                    <span className="text-xs xl:text-sm font-bold text-white mt-1 font-mono block tracking-wider">
                      {vnpBalance.toLocaleString()} VNP
                    </span>
                  </div>
                  <div className="p-3 bg-black/50 border border-white/5 rounded-xl text-center">
                    <span className="text-[8px] text-gray-500 uppercase block">SLA YIELD APY</span>
                    <span className={`text-xs xl:text-sm font-bold mt-1 font-mono block tracking-wider transition-colors duration-500 ${yieldApy > 10 ? 'text-green-400' : 'text-orange-400 animate-pulse'}`}>
                      {yieldApy}% APY
                    </span>
                  </div>
                </div>

                {/* Status Notice */}
                <div className={`p-2.5 rounded-lg border transition-all text-[10px] ${
                  slashedStake > 0 
                    ? 'border-red-500/20 bg-red-500/[0.02]' 
                    : 'border-white/5 bg-white/[0.01]'
                }`}>
                  <span className="text-[8px] text-gray-500 uppercase block font-bold">Ledger Status Summary</span>
                  <span className={`font-bold mt-0.5 block ${slashedStake > 0 ? 'text-red-500 animate-pulse' : 'text-green-400'}`}>
                    {lastActionStatus}
                  </span>
                </div>

                {/* Scrolling Hash-Chained SLA Ledger (CrewAI accountability) */}
                <div className="space-y-2">
                  <span className="text-[8.5px] text-gray-400 uppercase tracking-wider font-bold flex items-center gap-1">
                    <History className="w-3.5 h-3.5 text-orange-400" /> Hash-Chained Telemetry
                  </span>
                  
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
                    {ledger.map((block) => {
                      const isSlashed = block.status === 'SLASHED';
                      return (
                        <div 
                          key={block.index}
                          className={`p-2 rounded border text-[9px] font-mono leading-relaxed transition-all ${
                            isSlashed 
                              ? 'border-red-500/30 bg-red-950/10 text-red-400' 
                              : 'border-white/5 bg-black/40 text-gray-300'
                          }`}
                        >
                          <div className="flex justify-between font-bold">
                            <span>BLOCK #{block.index}</span>
                            <span className={isSlashed ? 'text-red-500' : 'text-green-400'}>{block.action}</span>
                          </div>
                          <div className="text-gray-500 text-[8.5px] flex justify-between mt-0.5 border-b border-white/5 pb-1 mb-1">
                            <span>{block.timestamp}</span>
                            <span>{block.vnpStake}</span>
                          </div>
                          <div className="text-[8px] text-gray-500 grid grid-cols-2 gap-1 font-mono">
                            <div>PREV: <span className="text-gray-400">{block.prevHash}</span></div>
                            <div>HASH: <span className="text-gray-400">{block.hash}</span></div>
                          </div>
                          <div className="text-[8px] text-cyan-500/80 mt-1 uppercase font-mono">
                            EVIDENCE: <span className="text-gray-400 font-normal">{block.evidenceHash}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
