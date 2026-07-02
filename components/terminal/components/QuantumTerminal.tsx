"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SpectralAnalysis } from './SpectralAnalysis';
import { GovernanceMonitor } from './GovernanceMonitor';
import { ComplianceHorizon } from './ComplianceHorizon';
import { GenomeDNA } from './GenomeDNA';
import { LineageLedger } from './LineageLedger';
import { StatePropagationAtlas } from './StatePropagationAtlas';
import { ROIPanel } from './ROIPanel';
import { AgentTrustScore } from './AgentTrustScore';

import { BoundedScaling } from './BoundedScaling';
import { UACPLayers } from './UACPLayers';
import { SEKEDCompiler } from './SEKEDCompiler';
import { AgentConsensusMatrix } from './AgentConsensusMatrix';
import { ArchivesOfOrder } from './ArchivesOfOrder';
import { DeterminismRatio } from './DeterminismRatio';
import { EmissionsTrajectory } from './EmissionsTrajectory';
import { GovernanceRoadmap } from './GovernanceRoadmap';
import { IdentityGovernancePanel } from './IdentityGovernancePanel';
import { IntentConsole } from './IntentConsole';
import { MCPGateway } from './MCPGateway';
import { MemoryVault } from './MemoryVault';
import { MitigationPathwaysPanel } from './MitigationPathwaysPanel';
import { ObservabilitySignals } from './ObservabilitySignals';
import { PolicyEvaluationPanel } from './PolicyEvaluationPanel';
import { ProbabilityMatrix } from './ProbabilityMatrix';
import { RegionalEmittersPanel } from './RegionalEmittersPanel';
import { SignalIngestionFeed } from './SignalIngestionFeed';
import { AgentLatencyVisualizer } from './AgentLatencyVisualizer';
import { ThreatLandscape } from './ThreatLandscape';
import QuantumDashboard from './QuantumDashboard';
import { API_BASE_URL } from '../data/pglLoader';
import { getToken } from '@/lib/api';

type ViewType = 'terminal' | 'mesh' | 'tele' | 'paths' | 'engine' | 'hub' | 'trust' | 'dashboard' | 'tools' | 'climate' | 'security';

type LogType = 'sys' | 'pmt' | 'out' | 'ok' | 'warn' | 'err' | 'error' | 'dim' | 'pur' | 'hdr' | 'sep' | 'custom';

interface SpecPath {
  l: string;
  v: number;
  locked?: boolean;
  pruned?: boolean;
  ok?: boolean;
}

interface LogEntry {
  id: string;
  text: string;
  type: LogType;
  delay?: number;
  isSpec?: boolean;
  specPaths?: SpecPath[];
  isMesh?: boolean;
  meshLbl?: string;
  isRaw?: boolean;
}

interface ProviderConfig {
  id: string;
  name: string;
  enabled: boolean;
  baseUrl?: string;
  apiKey?: string;
}

type LLMProvider = any;

interface QuantumAgentStatus {
  id: number;
  role: string;
  status: string;
  progress: number;
}

interface TelemetryState {
  zenoCycles: number;
  pathsPruned: number;
  eventLogs: { id: string; cls: string; text: string; time: string }[];
}

function ZenoCanvas({ zenoOn, zenoLabel }: { zenoOn: boolean; zenoLabel: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let zenoPhase = 0;

    const resizeZ = () => {
      const d = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * d;
      canvas.height = 26 * d;
      ctx.scale(d, d);
    };
    resizeZ();
    window.addEventListener('resize', resizeZ);

    const drawZ = () => {
      const w = canvas.offsetWidth;
      const h = 26;
      ctx.clearRect(0, 0, w * 2, h * 2);
      ctx.beginPath();
      for (let x = 0; x < w; x++) {
        const amp = zenoOn ? 7 : 2.5;
        const fr = zenoOn ? 0.07 : 0.035;
        const y = h / 2 + Math.sin(x * fr + zenoPhase) * amp + Math.sin(x * fr * 2.1 + zenoPhase * 1.6) * (amp * 0.35);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = zenoOn ? 'rgba(227,179,65,.75)' : 'rgba(99,179,237,.5)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (zenoOn) {
        for (let i = 0; i < 5; i++) {
          const sx = (canvas.offsetWidth / 6) * (i + 1) + Math.sin(zenoPhase + i) * 4;
          const sh = 6 + Math.abs(Math.sin(zenoPhase * 2 + i)) * 9;
          ctx.beginPath();
          ctx.moveTo(sx, h / 2);
          ctx.lineTo(sx, h / 2 - sh);
          ctx.strokeStyle = `rgba(188,140,255,${0.3 + Math.abs(Math.sin(zenoPhase + i)) * 0.5})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
      zenoPhase += zenoOn ? 0.055 : 0.016;
      animationId = requestAnimationFrame(drawZ);
    };
    drawZ();

    return () => {
      window.removeEventListener('resize', resizeZ);
      cancelAnimationFrame(animationId);
    };
  }, [zenoOn]);

  return (
    <div className="zeno-strip">
      <div className="z-lbl">Zeno</div>
      <div className="z-wrap"><canvas ref={canvasRef} id="zeno"></canvas></div>
      <div className={`z-state ${zenoOn ? 'on' : ''}`}>{zenoLabel}</div>
    </div>
  );
}

export default function QuantumTerminal() {
  const isLanding = typeof window !== 'undefined' && window.location.pathname === '/';
  const [activeView, setActiveView] = useState<ViewType>(() => {
    if (typeof window !== 'undefined' && (window.location.pathname.includes('terminal') || window.location.pathname.includes('terrrinal') || window.location.pathname === '/')) {
      return 'terminal';
    }
    return 'dashboard';
  });
  const [inputVal, setInputVal] = useState('');

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [zenoState, setZenoState] = useState({ on: false, lbl: 'PHASE_LOCKED' });
  const [providers, setProviders] = useState<ProviderConfig[]>([
    { id: 'google', name: 'Google (Gemini Pro)', enabled: true },
    { id: 'openai', name: 'OpenAI (GPT-4o)', enabled: true },
    { id: 'anthropic', name: 'Anthropic (Claude 3)', enabled: true },
    { id: 'groq', name: 'Groq (Llama-3.1)', enabled: true },
    { id: 'ollama', name: 'Ollama (Local)', enabled: true, baseUrl: 'http://localhost:11434' },
    { id: 'huggingface', name: 'HuggingFace', enabled: true },
    { id: 'deepseek', name: 'DeepSeek', enabled: true }
  ]);

  const [selectedProvider, setSelectedProvider] = useState<LLMProvider>('openai');
  const [agentTaskForce, setAgentTaskForce] = useState<QuantumAgentStatus[]>(() =>
    Array.from({ length: 120 }).map((_, i) => ({
      id: i + 1,
      role: `Agent-${i + 1}`,
      status: 'idle',
      progress: 0
    }))
  );

  const [hubMetrics, setHubMetrics] = useState<any>(null);
  const [genome, setGenome] = useState<any>(null);
  const [lineage, setLineage] = useState<any>(null);

  const [tele, setTele] = useState<TelemetryState>({
    zenoCycles: 0,
    pathsPruned: 0,
    eventLogs: [
      { id: '1', cls: 'g', text: '<b>BOOT</b> — 120 Sovereign agents initialised', time: '00:00' },
      { id: '2', cls: 'p', text: '<b>Zeno</b> — Interrogator subsystem ONLINE', time: '00:01' },
      { id: '3', cls: 'a', text: '<b>co2router_srv</b> — Capability negotiation pending', time: '00:01' }
    ]
  });

  const [evTimeOffset, setEvTimeOffset] = useState(2);
  const outRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (outRef.current) {
      outRef.current.scrollTop = outRef.current.scrollHeight;
    }
  }, [logs, isTyping]);

  useEffect(() => {
    const bootSequence = async () => {
      await sleep(100);
      pushLog('—'.repeat(44), 'sep');
      pushLog('  VEKLOM TERMINAL  //  UACP v4.0', 'hdr');
      pushLog('  Neural Orchestration Engine · Antigravity v4.0', 'dim');
      pushLog('—'.repeat(44), 'sep');
      await sleep(200); pushLog('[BOOT]  Quantum context surface…', 'sys');
      await sleep(200); pushLog('[BOOT]  MCP host adapter loaded', 'sys');
      await sleep(200); pushLog('        ✓  filesystem_srv  (stdio)', 'ok');
      await sleep(200); pushLog('        ✓  quantum_srv     (SSE, 1024 qubits)', 'ok');
      await sleep(200); pushLog('        ⚠  co2router_srv   (capability pending)', 'warn');
      await sleep(200); pushLog('[BOOT]  Zeno Interrogator: ONLINE', 'sys');
      await sleep(200); pushLog('[BOOT]  Gladiator Engine: 8 paths ready', 'sys');
      await sleep(200); pushLog('[BOOT]  Cognitive Engine: CONNECTED', 'ok');
      await sleep(150); pushLog('', 'out');
      await sleep(150); pushLog('Tap a chip or type a command. Explore all tabs below.', 'dim');
      await sleep(150); pushLog('—'.repeat(44), 'sep');
    };
    bootSequence();
  }, []);

  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  const pushLog = (text: string, type: LogType, extra: Partial<LogEntry> = {}) => {
    setLogs(p => [...p, { id: crypto.randomUUID(), text, type, ...extra }]);
  };

  const updateTele = (z: number, p: number) => {
    setTele(prev => ({
      ...prev,
      zenoCycles: prev.zenoCycles + z,
      pathsPruned: prev.pathsPruned + p
    }));
  };

  useEffect(() => {
    const fetchAgentsAndMetrics = async () => {
      try {
        const token = getToken();
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const [agentsRes, metricsRes, genRes, linRes] = await Promise.all([
            fetch("/api/agents/task-force", { headers }),
            fetch("/api/uacp/hub/metrics", { headers }),
            fetch("/api/pgl/genome", { headers }),
            fetch("/api/pgl/ledger", { headers })
        ]);
        if (agentsRes.ok) {
          const data = await agentsRes.json();
          setAgentTaskForce(data);
        }
        if (metricsRes.ok) {
          const metricsData = await metricsRes.json();
          setHubMetrics(metricsData);
        }
        if (genRes.ok) setGenome(await genRes.json());
        if (linRes.ok) setLineage(await linRes.json());
      } catch (e) {
        // graceful degrade
      }
    };

    // Initial fetch
    fetchAgentsAndMetrics();

    const interval = setInterval(() => {
      fetchAgentsAndMetrics();
      setTele(prev => ({
        ...prev,
        zenoCycles: prev.zenoCycles + Math.floor(Math.random() * 3)
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const cmdMap = [
    { match: 'health check', route: '/health', method: 'GET' },
    { match: 'status', route: '/status', method: 'GET' },
    { match: 'telemetry', route: '/api/quantum-metrics', method: 'GET' },
    { match: 'monitoring health', route: '/api/v1/sys/health', method: 'GET' },
    { match: 'uacp security', route: '/api/uacp/security', method: 'GET' },
    { match: 'uacp layers', route: '/api/uacp/layers', method: 'GET' },
    { match: 'uacp execute', route: '/internal/uacp/execute', method: 'POST' },
    { match: 'workspace members', route: '/api/v1/workspace/members', method: 'GET' },
    { match: 'api keys list', route: '/api/v1/auth/api-keys', method: 'GET' },
    { match: 'api key create', route: '/api/v1/auth/api-keys', method: 'POST' },
    { match: 'workspace models', route: '/api/v1/workspace/models', method: 'GET' },
    { match: 'generic models', route: '/api/v1/models', method: 'GET' },
    { match: 'providers', route: '/api/v1/providers', method: 'GET' },
    { match: 'exec v1', route: '/api/v1/exec', method: 'POST' },
    { match: 'exec', route: '/v1/exec', method: 'POST' },
    { match: 'ai complete', route: '/api/v1/ai/complete', method: 'POST' },
    { match: 'listings', route: '/api/v1/listings', method: 'GET' },
    { match: 'marketplace', route: '/api/v1/marketplace', method: 'GET' },
    { match: 'pipelines list', route: '/api/v1/pipelines', method: 'GET' },
    { match: 'pipeline create', route: '/api/v1/pipelines', method: 'POST' },
    { match: 'pipeline save', route: '/api/v1/pipelines', method: 'POST' },
    { match: 'deployments list', route: '/api/v1/deployments', method: 'GET' },
    { match: 'deployment create', route: '/api/v1/deployments', method: 'POST' },
    { match: 'audit logs', route: '/api/v1/audit/logs', method: 'GET' },
    { match: 'wallet', route: '/api/v1/wallet', method: 'GET' },
    { match: 'add reserve', route: '/api/v1/billing/add-reserve', method: 'POST' },
    { match: 'reserve action', route: '/api/v1/wallet/reserve', method: 'POST' },
    { match: 'compliance', route: '/api/v1/compliance', method: 'GET' },
    { match: 'export evidence', route: '/api/v1/compliance/export', method: 'POST' },
    { match: 'schedule evidence', route: '/api/v1/compliance/schedule-export', method: 'POST' },
    { match: 'interlink health', route: '/health', method: 'GET' },
    { match: 'interlink audit', route: '/api/audit', method: 'GET' },
    { match: 'interlink ui', route: '/ui', method: 'GET' }
  ];

  const doRealCommand = async (cmdInfo: typeof cmdMap[0], rawArgs: string) => {
    pushLog(`[EXEC]    Triggering ${cmdInfo.match}...`, 'sys');
    pushLog(`[ROUTER]  ${cmdInfo.method} ${API_BASE_URL}${cmdInfo.route}`, 'sys');

    await sleep(300);

    try {
        const token = getToken();
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const opts: RequestInit = { 
          method: cmdInfo.method,
          headers
        };

        if (cmdInfo.method === 'POST') {
             opts.headers = { 
               ...headers,
               'Content-Type': 'application/json' 
             };
             opts.body = JSON.stringify({ action: "terminal_invoke", payload: rawArgs });
        }

        const t = performance.now();
        const res = await fetch(`${API_BASE_URL}${cmdInfo.route}`, opts);
        const elapsed = performance.now() - t;

        if (!res.ok) {
            pushLog(`[ERROR]   HTTP ${res.status} ${res.statusText}`, 'warn');
            if (res.status === 404) {
               pushLog('          Route is not currently implemented on the backend.', 'warn');
            } else {
               let bod = await res.text().catch(()=>null);
               if (bod) pushLog(`          ${bod.substring(0, 100)}`, 'dim');
            }
        } else {
             const data = await res.json().catch(()=>null);
             if (data) {
                  const str = JSON.stringify(data, null, 2);
                  const lines = str.split('\n').filter(l => l.trim() !== '' && l.trim() !== '{' && l.trim() !== '}').map(l => l.substring(0, 60));
                  pushLog(`[SUCCESS] Transmit time: ${elapsed.toFixed(1)}ms. Response:`, 'ok');
                  lines.slice(0, 8).forEach(l => pushLog(`          ${l}`, 'out'));
                  if (lines.length > 8) pushLog(`          ... (${lines.length - 8} more lines)`, 'out');
             } else {
                  pushLog(`[SUCCESS] Transmit time: ${elapsed.toFixed(1)}ms. (Empty body)`, 'ok');
             }
        }
    } catch (err: any) {
         pushLog(`[FAULT]   Network failure: ${err.message}`, 'error');
    }

    updateTele(0, 1);
  };

  const submitCmd = async () => {
    const raw = inputVal.trim();
    if (!raw) return;
    setInputVal('');

    pushLog('', 'out');
    pushLog(`$ ${raw}`, 'pmt');

    setIsTyping(true);
    setZenoState({ on: true, lbl: 'INTERROGATING' });

    const aInterval = setInterval(() => {
      setAgentTaskForce(p => p.map(a => Math.random() > 0.82 ? { ...a, status: ['assigned', 'executing', 'blocked', 'idle'][Math.floor(Math.random() * 4)] as any } : a));
    }, 150);

    try {
      const lo = raw.toLowerCase();
      const isLanding = typeof window !== 'undefined' && window.location.pathname === '/';
      const token = getToken();

      if (isLanding) {
        const isNavigation = ['login', 'signup', 'exit', 'workspace', 'overview', 'dashboard'].includes(lo.trim());
        
        if (isNavigation) {
          pushLog(`[GATEWAY] Intercepting command sequence: "${raw}"`, 'warn');
          pushLog('[GATEWAY] Secure enclave required. Elevating privileges...', 'sys');
          await sleep(400);
          pushLog('[GATEWAY] Claiming secure session...', 'pur');
          await sleep(500);
          
          if (token) {
            pushLog('[GATEWAY] Active session token detected. Redirecting to sovereign workspace...', 'ok');
            await sleep(600);
            window.location.href = '/overview';
          } else {
            pushLog('[GATEWAY] Transitioning to secure Veklom login portal...', 'ok');
            await sleep(600);
            window.location.href = '/login';
          }
          setIsTyping(false);
          clearInterval(aInterval);
          setAgentTaskForce(p => p.map(a => ({ ...a, status: 'idle' })));
          setZenoState({ on: false, lbl: 'PHASE_LOCKED' });
          return;
        }
      }

      const mapped = cmdMap.find(c => lo === c.match || lo.startsWith(c.match));

      if (mapped) {
         await doRealCommand(mapped, raw);
      } else {
         // USE REAL BACKEND ENGINE
         const response = await fetch(`${API_BASE_URL}/api/terminal/shell`, {
           method: 'POST',
           headers: token ? {
             'Content-Type': 'application/json',
             'Authorization': `Bearer ${token}`
           } : {
             'Content-Type': 'application/json'
           },
           body: JSON.stringify({ command: raw })
         });

         if (response.ok) {
           const backendLogs = await response.json();
           for (const log of backendLogs) {
             pushLog(log.text, log.type, log);
             if (log.type === 'pur' || log.text.includes('Zeno')) updateTele(64, 0);
             if (log.type === 'ok') updateTele(0, 1);
             await sleep(50); // Small rhythmic delay
           }
         } else {
           try {
             const errData = await response.json();
             const errMsg = Array.isArray(errData) ? errData[0].text : (errData.error || errData.details || 'Unknown Error');
             pushLog(`[FAULT] Engine Error: ${errMsg}`, 'err');
           } catch {
             pushLog('[FAULT] Engine communication failure (500).', 'err');
           }
         }
      }
    } catch (err: any) {
      pushLog(`[FAULT] Neural link severed: ${err.message}`, 'error');
    }

    setIsTyping(false);
    clearInterval(aInterval);
    setAgentTaskForce(p => p.map(a => ({ ...a, status: 'idle' })));
    setZenoState({ on: false, lbl: 'PHASE_LOCKED' });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') submitCmd();
  };

  const fillPrompt = (t: string) => {
    setInputVal(t);
    setActiveView('terminal');
  };

  const pct = Math.min((tele.zenoCycles/512)*100, 100).toFixed(0);
  const coh = (99.8 - tele.pathsPruned*0.3).toFixed(1);

  const viewVariants: any = {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: "easeOut" } },
    exit: { opacity: 0, scale: 0.98, transition: { duration: 0.15, ease: "easeIn" } },
  };

  return (
    <div className="shell h-full flex flex-col bg-[#080b0f] text-[#cdd9e5] font-mono relative overflow-hidden">
      <div className="scanline-fx"></div>

      <ZenoCanvas zenoOn={zenoState.on} zenoLabel={zenoState.lbl} />

      {/* VIEWS */}
      <div className="views flex-grow relative overflow-hidden">
        <AnimatePresence mode="wait">
          {activeView === 'terminal' && (
            <motion.div
              key="terminal"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={viewVariants}
              className="view active absolute inset-0 flex flex-col"
              id="v-terminal"
            >
          <div className="chips-bar flex gap-2 p-2 overflow-x-auto shrink-0 scrollbar-hide">
            <div className="chip whitespace-nowrap px-3 py-1 bg-[#FFB800]/10 border border-[#FFB800]/30 hover:bg-[#FFB800]/20 rounded-full text-[10px] cursor-pointer text-[#FFB800]" onClick={() => fillPrompt('veklom compare')}>📊 Veklom vs. Competitors</div>
            <div className="chip whitespace-nowrap px-3 py-1 bg-[#FFB800]/10 border border-[#FFB800]/30 hover:bg-[#FFB800]/20 rounded-full text-[10px] cursor-pointer text-[#FFB800]" onClick={() => fillPrompt('veklom test-shield injection')}>🛡️ Prompt Injection Shield</div>
            <div className="chip whitespace-nowrap px-3 py-1 bg-[#FFB800]/10 border border-[#FFB800]/30 hover:bg-[#FFB800]/20 rounded-full text-[10px] cursor-pointer text-[#FFB800]" onClick={() => fillPrompt('veklom test-shield credential')}>🔐 Credential Masking / x402 Swap</div>
            <div className="chip whitespace-nowrap px-3 py-1 bg-[#FFB800]/10 border border-[#FFB800]/30 hover:bg-[#FFB800]/20 rounded-full text-[10px] cursor-pointer text-[#FFB800]" onClick={() => fillPrompt('veklom test-shield depth')}>🕸️ Schema Moat Depth Limit</div>
            <div className="chip whitespace-nowrap px-3 py-1 bg-[#FFB800]/10 border border-[#FFB800]/30 hover:bg-[#FFB800]/20 rounded-full text-[10px] cursor-pointer text-[#FFB800]" onClick={() => fillPrompt('veklom test-shield slash')}>⚡ VNP SLA Autoslash</div>
            <div className="chip whitespace-nowrap px-3 py-1 bg-[#FFB800]/10 border border-[#FFB800]/30 hover:bg-[#FFB800]/20 rounded-full text-[10px] cursor-pointer text-[#FFB800]" onClick={() => fillPrompt('veklom status')}>ℹ️ Sovereign Gateway Status</div>
          </div>

          <div className="output flex-grow overflow-y-auto p-4 space-y-1" id="output" ref={outRef}>
            {logs.map((L) => {
              if (L.type === 'custom') {
                if (L.isSpec && L.specPaths) {
                  return (
                    <div key={L.id} className="spec-card bg-[#111820] border border-[#63b3ed1f] rounded-lg p-3 my-2">
                      {L.specPaths.map((p, i) => (
                        <div key={i} className={`path flex items-center gap-2 text-[11px] mb-1 ${p.pruned ? 'opacity-50 line-through' : ''}`}>
                          <span className="p-lbl min-w-[80px]">{p.l}</span>
                          <div className="p-bar flex-grow h-1 bg-[#63b3ed1f] rounded-full overflow-hidden">
                            <div className={`p-fill h-full bg-gradient-to-r from-[#63b3ed] to-[#bc8cff]`} style={{ width: `${p.v}%` }}></div>
                          </div>
                          <span className="p-pct min-w-[30px] text-right">{p.v}%</span>
                        </div>
                      ))}
                    </div>
                  );
                }
                if (L.isMesh) {
                  return (
                    <div key={L.id} className="spec-card bg-[#111820] border border-[#63b3ed1f] rounded-lg p-3 my-2">
                      <div className="text-[9px] text-[#3d5269] uppercase tracking-widest mb-2">
                        MCP Session · {L.meshLbl || 'JSON-RPC'}
                      </div>
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        <div className="flex flex-col items-center gap-1 min-w-[70px]">
                          <div className="px-2 py-1 rounded bg-[#63b3ed21] border border-[#63b3ed4d] text-[#63b3ed] text-[9px]">UACP HOST</div>
                          <div className="text-[8px] text-[#3d5269]">PerplexTerm</div>
                        </div>
                        <div className="flex-grow flex flex-col items-center min-w-[30px]">
                          <div className="text-[8px] text-[#3d5269]">{L.meshLbl || 'JSON-RPC'}</div>
                          <div className="w-full h-px bg-[#63b3ed4d]"></div>
                        </div>
                        <div className="flex flex-col items-center gap-1 min-w-[70px]">
                          <div className="px-2 py-1 rounded bg-[#bc8cff1a] border border-[#63b3ed4d] text-[#bc8cff] text-[9px]">MCP CLIENT</div>
                          <div className="text-[8px] text-[#3d5269]">Translator</div>
                        </div>
                        <div className="flex-grow flex flex-col items-center min-w-[30px]">
                          <div className="text-[8px] text-[#3d5269]">stdio/SSE</div>
                          <div className="w-full h-px bg-[#63b3ed4d]"></div>
                        </div>
                        <div className="flex flex-col items-center gap-1 min-w-[70px]">
                          <div className="px-2 py-1 rounded bg-[#56d36421] border border-[#63b3ed4d] text-[#56d364] text-[9px]">CTX SERVER</div>
                          <div className="text-[8px] text-[#3d5269]">quantum_srv</div>
                        </div>
                      </div>
                    </div>
                  );
                }
              }
              return <div key={L.id} className={`ln text-[12px] leading-relaxed break-words ${L.type}`}>{L.text}</div>;
            })}
          </div>

          <div className={`typing px-4 py-1 flex items-center gap-2 transition-opacity ${isTyping ? 'opacity-100' : 'opacity-0'}`} id="typing">
             <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#63b3ed] animate-bounce"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-[#63b3ed] animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-[#63b3ed] animate-bounce [animation-delay:0.4s]"></div>
             </div>
             <div className="text-[10px] text-[#3d5269] uppercase tracking-wider">Cognitive Engine…</div>
          </div>
          <div className="input-bar flex items-center gap-2 p-3 bg-[#0d1117] border-t border-[#63b3ed1f] shrink-0">
            <span className="text-[#63b3ed] font-bold">$</span>
            <input
              className="flex-grow bg-transparent border-none outline-none text-[#cdd9e5] text-[14px] placeholder:text-[#3d5269]"
              id="cmd" type="text" placeholder="Enter command…"
              value={inputVal} onChange={e => setInputVal(e.target.value)} onKeyDown={handleKeyDown}
              autoComplete="off" spellCheck="false"
            />
            <button className="px-4 py-2 bg-[#63b3ed21] border border-[#63b3ed4d] text-[#63b3ed] text-[11px] font-bold uppercase rounded hover:bg-[#63b3ed] hover:text-black transition-all" onClick={submitCmd}>RUN</button>
          </div>
            </motion.div>
          )}

          {activeView === 'mesh' && (
            <motion.div
              key="mesh"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={viewVariants}
              className="view active absolute inset-0 overflow-y-auto p-4 space-y-4"
              id="v-mesh"
            >
          <div className="mesh-view flex flex-col gap-4">
             <div className="text-[9px] uppercase tracking-widest text-[#3d5269] border-b border-[#63b3ed1f] pb-2">MCP Host–Client–Server Topology</div>
             <div className="topology bg-[#111820] border border-[#63b3ed1f] rounded-lg p-4 flex flex-col items-center">
                <div className="topo-node flex flex-col items-center gap-1 w-full max-w-[200px]">
                  <div className="w-full py-2 bg-[#63b3ed21] border border-[#63b3ed4d] text-[#63b3ed] text-center text-[11px] rounded">UACP HOST</div>
                  <div className="text-[9px] text-[#3d5269] uppercase tracking-wider">Veklom Terminal</div>
                </div>
                <div className="topo-arrow flex flex-col items-center py-2">
                  <div className="text-[9px] text-[#3d5269] tracking-wider">JSON-RPC 2.0 · initialize</div>
                  <div className="w-px h-6 bg-[#63b3ed4d] relative">
                    <div className="absolute -bottom-1 -left-[3px] border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[4px] border-t-[#63b3ed4d]"></div>
                  </div>
                </div>
                <div className="topo-node flex flex-col items-center gap-1 w-full max-w-[200px]">
                  <div className="w-full py-2 bg-[#bc8cff1a] border border-[#63b3ed4d] text-[#bc8cff] text-center text-[11px] rounded">MCP CLIENT</div>
                  <div className="text-[9px] text-[#3d5269] uppercase tracking-wider">Protocol Translator</div>
                </div>
                <div className="topo-arrow flex flex-col items-center py-2">
                  <div className="text-[9px] text-[#3d5269] tracking-wider">stdio / SSE transport</div>
                  <div className="w-px h-6 bg-[#63b3ed4d] relative">
                    <div className="absolute -bottom-1 -left-[3px] border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[4px] border-t-[#63b3ed4d]"></div>
                  </div>
                </div>
                <div className="topo-node flex flex-col items-center gap-1 w-full max-w-[200px]">
                  <div className="w-full py-2 bg-[#56d36421] border border-[#63b3ed4d] text-[#56d364] text-center text-[11px] rounded">CONTEXT SERVERS</div>
                  <div className="text-[9px] text-[#3d5269] uppercase tracking-wider text-center px-2">filesystem · quantum · co2router</div>
                </div>
             </div>

             <div className="text-[9px] uppercase tracking-widest text-[#3d5269] border-b border-[#63b3ed1f] pb-2">4-Step Protocol Handshake (I/O Riot NG)</div>
             <div className="grid grid-cols-2 gap-2">
               <div className="bg-[#111820] border border-[#63b3ed1f] rounded-lg p-3"><div className="text-[9px] uppercase text-[#3d5269] mb-1">1. Capability Discovery</div><div className="text-[#56d364] font-bold">OK</div></div>
               <div className="bg-[#111820] border border-[#63b3ed1f] rounded-lg p-3"><div className="text-[9px] uppercase text-[#3d5269] mb-1">2. Protocol Negotiation</div><div className="text-[#56d364] font-bold">OK</div></div>
               <div className="bg-[#111820] border border-[#63b3ed1f] rounded-lg p-3"><div className="text-[9px] uppercase text-[#3d5269] mb-1">3. Session Initialization</div><div className="text-[#56d364] font-bold">OK</div></div>
               <div className="bg-[#111820] border border-[#63b3ed1f] rounded-lg p-3"><div className="text-[9px] uppercase text-[#3d5269] mb-1">4. Transport Validation</div><div className="text-[#56d364] font-bold">OK</div></div>
             </div>

             <div className="text-[9px] uppercase tracking-widest text-[#3d5269] border-b border-[#63b3ed1f] pb-2">Context Servers</div>
             <div className="bg-[#111820] border border-[#63b3ed1f] rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center"><span className="text-[12px] font-bold">filesystem_srv</span><span className="px-2 py-0.5 bg-[#56d36421] text-[#56d364] text-[9px] rounded-full">ACTIVE</span></div>
                <div className="flex justify-between text-[10px]"><span className="text-[#6b8299]">Transport</span><span className="text-[#63b3ed]">stdio</span></div>
                <div className="flex justify-between text-[10px]"><span className="text-[#6b8299]">Session</span><span className="text-[#56d364]">Stateful 1:1</span></div>
                <div className="flex justify-between text-[10px]"><span className="text-[#6b8299]">Protocol</span><span className="text-[#63b3ed]">v2025-03-26</span></div>
                <div className="pt-2 flex flex-wrap gap-1">
                   <div className="px-2 py-0.5 bg-[#151e2b] border border-[#63b3ed1f] rounded text-[9px] text-[#6b8299]">tools × 6</div>
                   <div className="px-2 py-0.5 bg-[#151e2b] border border-[#63b3ed1f] rounded text-[9px] text-[#6b8299]">resources × 12</div>
                   <div className="px-2 py-0.5 bg-[#151e2b] border border-[#63b3ed1f] rounded text-[9px] text-[#6b8299]">prompts × 2</div>
                </div>
             </div>

             <div className="bg-[#111820] border border-[#63b3ed1f] rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center"><span className="text-[12px] font-bold">quantum_srv</span><span className="px-2 py-0.5 bg-[#56d36421] text-[#56d364] text-[9px] rounded-full">ACTIVE</span></div>
                <div className="flex justify-between text-[10px]"><span className="text-[#6b8299]">Transport</span><span className="text-[#63b3ed]">SSE</span></div>
                <div className="flex justify-between text-[10px]"><span className="text-[#6b8299]">Session</span><span className="text-[#56d364]">Stateful 1:1</span></div>
                <div className="flex justify-between text-[10px]"><span className="text-[#6b8299]">Qubits</span><span className="text-[#bc8cff]">1,024 registered</span></div>
                <div className="pt-2 flex flex-wrap gap-1">
                   <div className="px-2 py-0.5 bg-[#151e2b] border border-[#63b3ed1f] rounded text-[9px] text-[#6b8299]">tools × 8</div>
                   <div className="px-2 py-0.5 bg-[#151e2b] border border-[#63b3ed1f] rounded text-[9px] text-[#6b8299]">Zeno API</div>
                   <div className="px-2 py-0.5 bg-[#151e2b] border border-[#63b3ed1f] rounded text-[9px] text-[#6b8299]">QPU calibrate</div>
                </div>
             </div>
          </div>
            </motion.div>
          )}

          {activeView === 'tele' && (
            <motion.div
              key="tele"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={viewVariants}
              className="view active absolute inset-0 overflow-y-auto p-4 space-y-4"
              id="v-tele"
            >
          <div className="tele-view flex flex-col gap-4">
             <div className="text-[9px] uppercase tracking-widest text-[#3d5269] border-b border-[#63b3ed1f] pb-2">Live System Metrics</div>
             <div className="grid grid-cols-2 gap-2">
               <div className="bg-[#111820] border border-[#63b3ed1f] rounded-lg p-4 flex flex-col gap-1">
                  <div className="text-[9px] uppercase text-[#3d5269] tracking-widest">Zeno Cycles</div>
                  <div className="text-[22px] font-bold text-[#63b3ed]">{tele.zenoCycles}</div>
                  <div className="text-[10px] text-[#3d5269]">Total interrogations</div>
               </div>
               <div className="bg-[#111820] border border-[#63b3ed1f] rounded-lg p-4 flex flex-col gap-1">
                  <div className="text-[9px] uppercase text-[#3d5269] tracking-widest">Coherence</div>
                  <div className="text-[22px] font-bold text-[#56d364]">{coh}%</div>
                  <div className="text-[10px] text-[#3d5269]">Phase stability</div>
               </div>
             </div>

             <div className="bg-[#111820] border border-[#63b3ed1f] rounded-lg p-4 space-y-3">
               <div className="flex justify-between items-center text-[10px]">
                  <span className="text-[#6b8299] uppercase">Quantum context buffer</span>
                  <span className="text-[#63b3ed] font-bold">{pct}%</span>
               </div>
               <div className="h-1 bg-[#63b3ed1f] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#63b3ed] to-[#bc8cff]" style={{width: `${pct}%`}}></div>
               </div>
               <div className="flex justify-between items-center text-[10px]">
                  <span className="text-[#6b8299] uppercase">Gladiator path slots</span>
                  <span className="text-[#63b3ed] font-bold">37.5%</span>
               </div>
               <div className="h-1 bg-[#63b3ed1f] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#63b3ed] to-[#bc8cff]" style={{width:'37.5%'}}></div>
               </div>
             </div>

             <div className="grid grid-cols-1 gap-4">
                <SpectralAnalysis data={{ v1x: 80, v2x: 20, carpet: 50 }} />
                <GovernanceMonitor />
                <ComplianceHorizon />
                <BoundedScaling metrics={{phi_ratio: 1.618, carbon_intensity: 0.85, utilization: 0.92, water_risk: 'low'}}/>
                <SEKEDCompiler state={{energy: 0.8, resilience: 0.95, confidence: 0.88, diversity: 0.7, stability: 0.9, directive: 'EXECUTE'}} />
                <UACPLayers layers={[
                  {layer: 'cognitive', status: 'active', latency: 120},
                  {layer: 'context', status: 'isolated', latency: 15},
                  {layer: 'execution', status: 'pending', latency: 10},
                  {layer: 'hitl', status: 'idempotent', latency: 0}
                ]} />
             </div>

             <div className="text-[9px] uppercase tracking-widest text-[#3d5269] border-b border-[#63b3ed1f] pb-2">Event Log</div>
             <div className="bg-[#111820] border border-[#63b3ed1f] rounded-lg p-4 space-y-3">
               {tele.eventLogs.map(e => (
                 <div key={e.id} className="flex gap-3 items-start pb-2 border-b border-[#63b3ed0a] last:border-none last:pb-0">
                   <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${e.cls === 'g' ? 'bg-[#56d364]' : e.cls === 'p' ? 'bg-[#bc8cff]' : 'bg-[#e3b341]'}`}></div>
                   <div className="flex-grow text-[11px] text-[#6b8299] leading-normal" dangerouslySetInnerHTML={{__html: e.text}}></div>
                   <div className="text-[9px] text-[#3d5269] shrink-0">{e.time}</div>
                 </div>
               ))}
             </div>
          </div>
            </motion.div>
          )}

          {activeView === 'paths' && (
            <motion.div
              key="paths"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={viewVariants}
              className="view active absolute inset-0 overflow-y-auto p-4 space-y-4"
              id="v-paths"
            >
          <div className="paths-view flex flex-col gap-4">
            <div className="text-[9px] uppercase tracking-widest text-[#3d5269] border-b border-[#63b3ed1f] pb-2">Gladiator Reasoning Engine — Path History</div>

            <div className="bg-[#111820] border border-[#63b3ed1f] rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center mb-1"><span className="text-[11px] font-bold">Bitmap Transmission (example)</span><span className="px-2 py-0.5 bg-[#56d36421] text-[#56d364] text-[9px] rounded-full uppercase">LOCKED</span></div>
              <div className="flex items-center gap-2 text-[10px]">
                 <span className="text-[#3d5269] w-4">1</span>
                 <span className="text-[#6b8299] min-w-[80px]">RLE-Delta</span>
                 <div className="flex-grow h-1.5 bg-[#63b3ed1f] rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[#63b3ed] to-[#bc8cff]" style={{width:'87%'}}></div></div>
                 <span className="text-[#56d364] w-8 text-right">87%</span>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                 <span className="text-[#3d5269] w-4">2</span>
                 <span className="text-[#6b8299] min-w-[80px]">Huffman+Q</span>
                 <div className="flex-grow h-1.5 bg-[#63b3ed1f] rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[#63b3ed] to-[#bc8cff]" style={{width:'74%'}}></div></div>
                 <span className="text-[#63b3ed] w-8 text-right">74%</span>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                 <span className="text-[#3d5269] w-4">4</span>
                 <span className="text-[#3d5269] min-w-[80px] line-through">Raw-LZ4</span>
                 <div className="flex-grow h-1.5 bg-[#63b3ed1f] rounded-full overflow-hidden"><div className="h-full bg-[#f8514933]" style={{width:'22%'}}></div></div>
                 <span className="text-[#f85149] w-8 text-right">22%</span>
                 <span className="px-1.5 py-0.5 bg-[#f8514933] text-[#f85149] text-[8px] rounded uppercase">PRUNED</span>
              </div>
            </div>

            <div className="bg-[#111820] border border-[#63b3ed1f] rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center mb-1"><span className="text-[11px] font-bold">Heron QPU Calibration (example)</span><span className="px-2 py-0.5 bg-[#56d36421] text-[#56d364] text-[9px] rounded-full uppercase">LOCKED</span></div>
              <div className="flex items-center gap-2 text-[10px]">
                 <span className="text-[#3d5269] w-4">1</span>
                 <span className="text-[#6b8299] min-w-[80px]">Echoed CR gate</span>
                 <div className="flex-grow h-1.5 bg-[#63b3ed1f] rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[#63b3ed] to-[#bc8cff]" style={{width:'91%'}}></div></div>
                 <span className="text-[#56d364] w-8 text-right">91%</span>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                 <span className="text-[#3d5269] w-4">2</span>
                 <span className="text-[#6b8299] min-w-[80px]">ZNE mitigation</span>
                 <div className="flex-grow h-1.5 bg-[#63b3ed1f] rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[#63b3ed] to-[#bc8cff]" style={{width:'78%'}}></div></div>
                 <span className="text-[#63b3ed] w-8 text-right">78%</span>
              </div>
            </div>
          </div>
            </motion.div>
          )}

          {activeView === 'engine' && (
            <motion.div
              key="engine"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={viewVariants}
              className="view active absolute inset-0 overflow-y-auto p-4 space-y-4"
              id="v-engine"
            >
          <div className="engine-view flex flex-col gap-4">
             <div className="flex items-center justify-between text-[11px] bg-[#111820] border border-[#63b3ed1f] rounded-lg p-3">
                <span className="text-[#6b8299]">Primary Provider: </span>
                <select className="bg-[#0d1117] text-[#63b3ed] border border-[#63b3ed1f] px-2 py-1 rounded text-[10px] outline-none" value={selectedProvider as string} onChange={e => setSelectedProvider(e.target.value as any)}>
                  {providers.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
             </div>

             <div className="text-[9px] uppercase tracking-widest text-[#3d5269] border-b border-[#63b3ed1f] pb-2">LLM Governance & Keys</div>
             <div className="flex flex-col gap-3">
               {providers.map((p, idx) => (
                 <div key={p.id} className="p-3 bg-[#111820] border border-[#63b3ed1f] rounded-xl flex flex-col gap-2">
                   <div className="flex items-center justify-between">
                     <span className="text-[11px] font-bold text-white/80">{p.name}</span>
                     <div className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${p.id === selectedProvider ? 'bg-[#56d36421] text-[#56d364] border-[#56d3644d]' : 'bg-[#151e2b] text-[#3d5269] border-[#63b3ed1f]'}`}>
                       {p.id === selectedProvider ? 'PRIMARY' : p.enabled ? 'STANDBY' : 'OFFLINE'}
                     </div>
                   </div>
                   <div className="grid grid-cols-2 gap-2">
                     <div className="flex flex-col gap-1">
                       <label className="text-[9px] text-[#3d5269] uppercase tracking-tighter">API Key</label>
                       <input
                         type="password" placeholder="••••••••"
                         className="bg-[#0d1117] border border-[#63b3ed1f] rounded px-2 py-1 text-[10px] text-[#63b3ed] outline-none"
                         value={p.apiKey || ''} onChange={(e) => {
                           const newProviders = [...providers];
                           newProviders[idx] = { ...p, apiKey: e.target.value };
                           setProviders(newProviders);
                         }}
                       />
                     </div>
                     <div className="flex flex-col gap-1">
                       <label className="text-[9px] text-[#3d5269] uppercase tracking-tighter">Base URL</label>
                       <input
                         type="text" placeholder="Default"
                         className="bg-[#0d1117] border border-[#63b3ed1f] rounded px-2 py-1 text-[10px] text-[#63b3ed] outline-none"
                         value={p.baseUrl || ''} onChange={(e) => {
                           const newProviders = [...providers];
                           newProviders[idx] = { ...p, baseUrl: e.target.value };
                           setProviders(newProviders);
                         }}
                       />
                     </div>
                   </div>
                 </div>
               ))}
             </div>

             <div className="bg-[#111820] border border-[#63b3ed1f] rounded-lg p-4 space-y-2">
                <div className="text-[9px] uppercase tracking-widest text-[#3d5269] mb-2">Hybrid Reasoning Architecture</div>
                <div className="flex justify-between text-[10px]"><span className="text-[#6b8299]">Backbone</span><span className="text-[#bc8cff]">Olmo3-Hybrid</span></div>
                <div className="flex justify-between text-[10px]"><span className="text-[#6b8299]">Paradigm</span><span className="text-[#e3b341]">State-over-Tokens (SoT)</span></div>
                <div className="pt-2 flex flex-wrap gap-1">
                  <div className="px-2 py-0.5 bg-[#151e2b] border border-[#63b3ed1f] rounded text-[9px] text-[#6b8299]">State-Based Recall</div>
                  <div className="px-2 py-0.5 bg-[#63b3ed21] border border-[#63b3ed4d] text-[#63b3ed] rounded text-[9px]">Anti-Collapse Protection</div>
                </div>
             </div>

             <div className="text-[9px] uppercase tracking-widest text-[#3d5269] border-b border-[#63b3ed1f] pb-2">120-Agent Task Force <span className="float-right text-[#63b3ed] font-normal">{agentTaskForce.filter(a => a.status === 'executing').length} Active</span></div>
             <div className="grid grid-cols-10 gap-1 bg-[#111820] p-4 border border-[#63b3ed1f] rounded-xl">
               {agentTaskForce.map(a => (
                 <div key={a.id} className={`w-full aspect-square border border-[#63b3ed1f] rounded-sm transition-all ${a.status === 'executing' ? 'bg-[#63b3ed4d] border-[#63b3ed99]' : a.status === 'assigned' ? 'bg-[#bc8cff33] border-[#bc8cff66]' : a.status === 'blocked' ? 'bg-[#e3b34133] border-[#e3b34166]' : 'bg-[#0d1117]'}`} title={`${a.role}: ${a.status}`}></div>
               ))}
             </div>
             <div className="flex justify-center gap-4 text-[10px] text-[#6b8299]">
               <div className="flex items-center gap-1"><div className="w-2 h-2 bg-[#0d1117] border border-[#63b3ed1f]"></div> Idle</div>
               <div className="flex items-center gap-1"><div className="w-2 h-2 bg-[#bc8cff33] border-[#bc8cff66]"></div> Assigned</div>
               <div className="flex items-center gap-1"><div className="w-2 h-2 bg-[#63b3ed4d] border-[#63b3ed99]"></div> Executing</div>
               <div className="flex items-center gap-1"><div className="w-2 h-2 bg-[#e3b34133] border-[#e3b34166]"></div> Blocked</div>
             </div>

             <div className="text-[9px] uppercase tracking-widest text-[#3d5269] border-b border-[#63b3ed1f] pb-2">Operational Hub Metrics</div>
             <div className="grid grid-cols-2 gap-2">
               <div className="bg-[#111820] border border-[#63b3ed1f] rounded-lg p-3 flex flex-col gap-1">
                  <div className="text-[9px] uppercase text-[#3d5269]">Determinism</div>
                  <div className="text-lg font-bold text-[#e3b341]">{hubMetrics ? (hubMetrics.certainty_index * 100).toFixed(2) : '99.9'}%</div>
               </div>
               <div className="bg-[#111820] border border-[#63b3ed1f] rounded-lg p-3 flex flex-col gap-1">
                  <div className="text-[9px] uppercase text-[#3d5269]">Latency</div>
                  <div className="text-lg font-bold text-[#56d364]">{hubMetrics ? hubMetrics.latency.toFixed(1) : '14.0'}ms</div>
               </div>
             </div>

             <div className="space-y-4 pt-4">
                {genome ? <GenomeDNA genome={genome} /> : <div className="text-[#63b3ed80] text-[10px] tracking-widest text-center py-4 border border-[#63b3ed1a] bg-[#0b121999] rounded-xl uppercase">Decoding Genome_DNA...</div>}
                {lineage ? <LineageLedger nodes={lineage} /> : <div className="text-[#63b3ed80] text-[10px] tracking-widest text-center py-4 border border-[#63b3ed1a] bg-[#0b121999] rounded-xl uppercase">Assembling Lineage Ledger...</div>}
                <StatePropagationAtlas />
                <ROIPanel />
             </div>
          </div>
            </motion.div>
          )}

          {activeView === 'hub' && (
            <motion.div
              key="hub"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={viewVariants}
              className="view active absolute inset-0 overflow-y-auto p-4 space-y-4"
              id="v-hub"
            >
          <div className="tele-view flex flex-col gap-4">
             <div className="text-[9px] uppercase tracking-widest text-[#3d5269] border-b border-[#63b3ed1f] pb-2">Strategic Orchestration Hub</div>
             <div className="flex flex-col gap-4">
                <IntentConsole
                  onExecute={async (intent) => {
                    pushLog(`> INTENT SUBMITTED: ${intent}`, 'pmt');
                    pushLog(`  ENGAGING NEURAL ORCHESTRATION CLUSTER...`, 'sys');
                    setActiveView('terminal');
                    try {
                      const res = await fetch('/api/cognitive/orchestrate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ prompt: intent, provider: selectedProvider })
                      });
                      const data = await res.json();
                      if (!res.ok) {
                        pushLog(`  [ERROR] ${data.details || 'Neural core link timeout.'}`, 'err');
                      } else {
                        pushLog(`  Consensus convergence achieved via mesh.`, 'hdr');
                        if (data.action_plan?.steps) {
                          data.action_plan.steps.forEach((step: string) => pushLog(`  - ${step}`, 'sys'));
                        } else if (data.response) {
                          pushLog(`  ${data.response}`, 'sys');
                        }
                      }
                    } catch (err) {
                      pushLog(`  [ERROR] Network or server failure routing to cluster.`, 'err');
                    }
                  }}
                  isLocked={false}
                  selectedProvider={selectedProvider}
                  onProviderChange={setSelectedProvider}
                  providers={providers}
                />
                <AgentLatencyVisualizer />
                <SignalIngestionFeed signals={[]} />
                <ProbabilityMatrix revision="1.0.4" isCompiled={false} />
                <AgentConsensusMatrix activeNodes={10} consensusModel="Gemini Pro Integrated" />
                <MemoryVault />
                <PolicyEvaluationPanel status="ACTIVE" />
                <ObservabilitySignals signals={[]} />
                <DeterminismRatio ratio={3.0} certainty={0.9999} noise={0.0001} entropy={0.0} />
                <ArchivesOfOrder isLocked={true} latency={14} coherence={84} progress={0.0000001} />
                <EmissionsTrajectory data={[]} />
                <RegionalEmittersPanel emitters={[]} />
                <MitigationPathwaysPanel />
                <GovernanceRoadmap phases={[]} />
                <IdentityGovernancePanel data={{}} />
                <MCPGateway status={{sanitization: 'active', redaction: 'active', auditing: 'active', egress_control: 'active', last_scan_result: 'clear'}} />
                <ThreatLandscape surfaces={[]} />
             </div>
          </div>
            </motion.div>
          )}

          {activeView === 'trust' && (
            <motion.div
              key="trust"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={viewVariants}
              className="view active absolute inset-0 overflow-y-auto p-4"
              id="v-trust"
            >
          <div className="tele-view">
             <div className="text-[9px] uppercase tracking-widest text-[#3d5269] border-b border-[#63b3ed1f] pb-2">Agent Trust Scores</div>
             <div className="mt-4">
                <AgentTrustScore />
             </div>
          </div>
            </motion.div>
          )}

          {activeView === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={viewVariants}
              className="view active absolute inset-0 overflow-y-auto"
              id="v-dashboard"
            >
           <QuantumDashboard />
            </motion.div>
          )}

          {activeView === 'tools' && (
            <motion.div
              key="tools"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={viewVariants}
              className="view active absolute inset-0 overflow-y-auto p-4"
              id="v-tools"
            >
           <div className="text-[#3d5269] text-[10px] p-4 text-center">Tools executor module loading...</div>
            </motion.div>
          )}

          {activeView === 'climate' && (
            <motion.div
              key="climate"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={viewVariants}
              className="view active absolute inset-0 overflow-y-auto p-4 flex flex-col gap-4"
              id="v-climate"
            >
              <div className="text-[9px] uppercase tracking-widest text-[#3d5269] border-b border-[#63b3ed1f] pb-2">Climate & Sustainability</div>
              <EmissionsTrajectory data={[]} />
              <RegionalEmittersPanel emitters={[]} />
              <MitigationPathwaysPanel />
              <BoundedScaling metrics={{phi_ratio: 1.618, carbon_intensity: 0.85, utilization: 0.92, water_risk: 'low'}}/>
            </motion.div>
          )}

          {activeView === 'security' && (
            <motion.div
              key="security"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={viewVariants}
              className="view active absolute inset-0 overflow-y-auto p-4 flex flex-col gap-4"
              id="v-security"
            >
              <div className="text-[9px] uppercase tracking-widest text-[#3d5269] border-b border-[#63b3ed1f] pb-2">Security & Governance</div>
              <ThreatLandscape surfaces={[]} />
              <IdentityGovernancePanel data={{}} />
              <PolicyEvaluationPanel status="ACTIVE" />
              <GovernanceMonitor />
              <MCPGateway status={{sanitization: 'active', redaction: 'active', auditing: 'active', egress_control: 'active', last_scan_result: 'clear'}} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Nav */}
      {!isLanding && (
        <div className="bnav flex bg-[#0d1117] border-t border-[#63b3ed1f] shrink-0 overflow-x-auto scrollbar-hide">
          <div className={`bt flex-grow flex flex-col items-center justify-center p-2 text-[8px] uppercase tracking-widest cursor-pointer ${activeView === 'terminal' ? 'text-[#63b3ed]' : 'text-[#3d5269]'}`} onClick={() => setActiveView('terminal')}>Terminal</div>
          <div className={`bt flex-grow flex flex-col items-center justify-center p-2 text-[8px] uppercase tracking-widest cursor-pointer ${activeView === 'mesh' ? 'text-[#63b3ed]' : 'text-[#3d5269]'}`} onClick={() => setActiveView('mesh')}>Mesh</div>
          <div className={`bt flex-grow flex flex-col items-center justify-center p-2 text-[8px] uppercase tracking-widest cursor-pointer ${activeView === 'tele' ? 'text-[#63b3ed]' : 'text-[#3d5269]'}`} onClick={() => setActiveView('tele')}>Telemetry</div>
          <div className={`bt flex-grow flex flex-col items-center justify-center p-2 text-[8px] uppercase tracking-widest cursor-pointer ${activeView === 'paths' ? 'text-[#63b3ed]' : 'text-[#3d5269]'}`} onClick={() => setActiveView('paths')}>Paths</div>
          <div className={`bt flex-grow flex flex-col items-center justify-center p-2 text-[8px] uppercase tracking-widest cursor-pointer ${activeView === 'engine' ? 'text-[#63b3ed]' : 'text-[#3d5269]'}`} onClick={() => setActiveView('engine')}>Engine</div>
          <div className={`bt flex-grow flex flex-col items-center justify-center p-2 text-[8px] uppercase tracking-widest cursor-pointer ${activeView === 'hub' ? 'text-[#63b3ed]' : 'text-[#3d5269]'}`} onClick={() => setActiveView('hub')}>Hub</div>
          <div className={`bt flex-grow flex flex-col items-center justify-center p-2 text-[8px] uppercase tracking-widest cursor-pointer ${activeView === 'trust' ? 'text-[#63b3ed]' : 'text-[#3d5269]'}`} onClick={() => setActiveView('trust')}>Trust</div>
          <div className={`bt flex-grow flex flex-col items-center justify-center p-2 text-[8px] uppercase tracking-widest cursor-pointer ${activeView === 'dashboard' ? 'text-[#63b3ed]' : 'text-[#3d5269]'}`} onClick={() => setActiveView('dashboard')}>Dashboard</div>
          <div className={`bt flex-grow flex flex-col items-center justify-center p-2 text-[8px] uppercase tracking-widest cursor-pointer ${activeView === 'tools' ? 'text-[#63b3ed]' : 'text-[#3d5269]'}`} onClick={() => setActiveView('tools')}>Tools</div>
          <div className={`bt flex-grow flex flex-col items-center justify-center p-2 text-[8px] uppercase tracking-widest cursor-pointer ${activeView === 'climate' ? 'text-[#63b3ed]' : 'text-[#3d5269]'}`} onClick={() => setActiveView('climate')}>Climate</div>
          <div className={`bt flex-grow flex flex-col items-center justify-center p-2 text-[8px] uppercase tracking-widest cursor-pointer ${activeView === 'security' ? 'text-[#63b3ed]' : 'text-[#3d5269]'}`} onClick={() => setActiveView('security')}>Security</div>
        </div>
      )}
    </div>
  );
}
