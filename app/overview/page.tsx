// @ts-nocheck
"use client";
import './uacp.css';
import React, { useState, useEffect, useRef } from 'react';

import { motion, AnimatePresence } from 'motion/react';
import { SpectralAnalysis } from '@/components/uacp/SpectralAnalysis';
import { GovernanceMonitor } from '@/components/uacp/GovernanceMonitor';
import { ComplianceHorizon } from '@/components/uacp/ComplianceHorizon';
import { GenomeDNA } from '@/components/uacp/GenomeDNA';
import { LineageLedger } from '@/components/uacp/LineageLedger';
import { StatePropagationAtlas } from '@/components/uacp/StatePropagationAtlas';
import { ROIPanel } from '@/components/uacp/ROIPanel';
import { AgentTrustScore } from '@/components/uacp/AgentTrustScore';

// New imports
import { BoundedScaling } from '@/components/uacp/BoundedScaling';
import { UACPLayers } from '@/components/uacp/UACPLayers';
import { SEKEDCompiler } from '@/components/uacp/SEKEDCompiler';
import { AgentConsensusMatrix } from '@/components/uacp/AgentConsensusMatrix';
import { ArchivesOfOrder } from '@/components/uacp/ArchivesOfOrder';
import { DeterminismRatio } from '@/components/uacp/DeterminismRatio';
import { EmissionsTrajectory } from '@/components/uacp/EmissionsTrajectory';
import { GovernanceRoadmap } from '@/components/uacp/GovernanceRoadmap';
import { IdentityGovernancePanel } from '@/components/uacp/IdentityGovernancePanel';
import { IntentConsole } from '@/components/uacp/IntentConsole';
import { MCPGateway } from '@/components/uacp/MCPGateway';
import { MemoryVault } from '@/components/uacp/MemoryVault';
import { MitigationPathwaysPanel } from '@/components/uacp/MitigationPathwaysPanel';
import { ObservabilitySignals } from '@/components/uacp/ObservabilitySignals';
import { PolicyEvaluationPanel } from '@/components/uacp/PolicyEvaluationPanel';
import { ProbabilityMatrix } from '@/components/uacp/ProbabilityMatrix';
import { RegionalEmittersPanel } from '@/components/uacp/RegionalEmittersPanel';
import { SignalIngestionFeed } from '@/components/uacp/SignalIngestionFeed';
import { AgentLatencyVisualizer } from '@/components/uacp/AgentLatencyVisualizer';
import { ThreatLandscape } from '@/components/uacp/ThreatLandscape';
import { QuantumDashboard } from '@/components/uacp/QuantumDashboard';
import { ToolExecutor } from '@/components/uacp/ToolExecutor';

// Type definitions to help manage the state
type ViewType = 'terminal' | 'mesh' | 'tele' | 'paths' | 'engine' | 'hub' | 'climate' | 'security' | 'trust' | 'dashboard' | 'tools';
type LogType = 'sys' | 'pmt' | 'out' | 'ok' | 'warn' | 'err' | 'error' | 'dim' | 'pur' | 'hdr' | 'sep' | 'custom';

interface ProviderConfig {
  id: string;
  name: string;
  enabled: boolean;
  apiKey?: string;
  baseUrl?: string;
}

type LLMProvider = 'google' | 'openai' | 'anthropic' | 'groq' | 'ollama' | 'huggingface' | 'deepseek' | 'serp';

interface SpecPath {
  l: string;
  v: number;
  locked?: boolean;
  pruned?: boolean;
  ok?: boolean; // custom logical state for color
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

export default function App() {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
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
  const [agentTaskForce, setAgentTaskForce] = useState(() => 
    Array.from({ length: 120 }).map((_, i) => ({
      id: i + 1,
      role: `Agent-${i + 1}`,
      status: 'idle' as 'idle' | 'assigned' | 'executing' | 'blocked'
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
      await sleep(150); pushLog('Tap a chip or type a command. Explore all 5 tabs below.', 'dim');
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
        const [agentsRes, metricsRes, genRes, linRes] = await Promise.all([
            fetch("/api/agents/task-force"),
            fetch("/api/uacp/hub/metrics"),
            fetch("/api/pgl/genome"),
            fetch("/api/pgl/ledger")
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

  const addEvent = (cls: string, text: string) => {
    setTele(prev => {
      const newTime = evTimeOffset + Math.floor(Math.random() * 4) + 1;
      setEvTimeOffset(newTime);
      const m = String(Math.floor(newTime / 60)).padStart(2, '0');
      const s = String(newTime % 60).padStart(2, '0');
      const t = `${m}:${s}`;
      return {
        ...prev,
        eventLogs: [{ id: crypto.randomUUID(), cls, text, time: t }, ...prev.eventLogs]
      };
    });
  };

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
    { match: 'schedule evidence', route: '/api/v1/compliance/schedule-export', method: 'POST' }
  ];

  const doRealCommand = async (cmdInfo: typeof cmdMap[0], rawArgs: string) => {
    pushLog(`[EXEC]    Triggering ${cmdInfo.match}...`, 'sys');
    pushLog(`[ROUTER]  ${cmdInfo.method} ${cmdInfo.route}`, 'sys');
    
    await sleep(300);
    
    try {
        const opts: RequestInit = { method: cmdInfo.method };
        if (cmdInfo.method === 'POST') {
             opts.headers = { 'Content-Type': 'application/json' };
             opts.body = JSON.stringify({ action: "terminal_invoke", payload: rawArgs });
        }

        const t = performance.now();
        const res = await fetch(cmdInfo.route, opts);
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
      const mapped = cmdMap.find(c => lo === c.match || lo.startsWith(c.match));
      
      if (mapped) {
         await doRealCommand(mapped, raw);
      } else {
         // USE REAL BACKEND ENGINE
         const response = await fetch('/api/terminal/shell', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
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
    // We let the user press run
  };

  const pct = Math.min((tele.zenoCycles/512)*100, 100).toFixed(0);
  const coh = (99.8 - tele.pathsPruned*0.3).toFixed(1);

  const viewVariants = {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: "easeOut" } },
    exit: { opacity: 0, scale: 0.98, transition: { duration: 0.15, ease: "easeIn" } },
  };

  return (
    <div className="shell">
      <div className="scanline-fx"></div>
      {/* Titlebar */}
      <div className="titlebar">
        <div className="tb-inner">
          <div className="tb-l">
            <div className="dots"><div className="dot r"></div><div className="dot a"></div><div className="dot g"></div></div>
            <div className="tb-title"><b>VEKLOM TERMINAL</b> · UACP v4.0</div>
          </div>
          <div className="tb-stat"><div className="live-dot"></div>LIVE</div>
        </div>
      </div>

      <ZenoCanvas zenoOn={zenoState.on} zenoLabel={zenoState.lbl} />

      {/* VIEWS */}
      <div className="views">
        <AnimatePresence mode="wait">
          {activeView === 'terminal' && (
            <motion.div 
              key="terminal" 
              initial="initial" 
              animate="animate" 
              exit="exit" 
              variants={viewVariants}
              className="view active"
              id="v-terminal"
            >
          <div className="chips-bar">
            <div className="chip" onClick={() => fillPrompt('Optimize a 10,000-bit monochrome bitmap transmission')}>📡 Bitmap tx</div>
            <div className="chip" onClick={() => fillPrompt('Calibrate a thousand-qubit Heron processor')}>⚛️ Heron QPU</div>
            <div className="chip" onClick={() => fillPrompt('Synthesize MCP orchestration plan for CO2 Router')}>🌿 CO2 Router</div>
            <div className="chip" onClick={() => fillPrompt('Run Zeno interrogation on filesystem_srv')}>🔬 Zeno scan</div>
            <div className="chip" onClick={() => fillPrompt('Show MCP mesh topology')}>🕸️ MCP mesh</div>
          </div>
          
          <div className="output" id="output" ref={outRef}>
            {logs.map((L) => {
              if (L.type === 'custom') {
                if (L.isSpec && L.specPaths) {
                  return (
                    <div key={L.id} className="spec-card">
                      {L.specPaths.map((p, i) => (
                        <div key={i} className={`path ${p.pruned ? 'pruned' : ''} ${p.locked ? 'locked' : ''}`}>
                          <span className="p-lbl">{p.l}</span>
                          <div className="p-bar">
                            <div className={`p-fill ${p.ok ? 'ok' : ''}`} style={{ width: `${p.v}%` }}></div>
                          </div>
                          <span className="p-pct">{p.v}%</span>
                        </div>
                      ))}
                    </div>
                  );
                }
                if (L.isMesh) {
                  return (
                    <div key={L.id} className="spec-card">
                      <div style={{fontSize:'9px',color:'var(--text-f)',marginBottom:'8px',textTransform:'uppercase',letterSpacing:'.12em'}}>
                        MCP Session · {L.meshLbl || 'JSON-RPC'}
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:'0',overflowX:'auto'}}>
                        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'3px',minWidth:'72px'}}>
                          <div style={{padding:'5px 8px',borderRadius:'4px',border:'1px solid var(--border-b)',background:'var(--accent-dim)',color:'var(--accent)',fontSize:'9px'}}>UACP HOST</div>
                          <div style={{fontSize:'8px',color:'var(--text-f)'}}>PerplexTerm</div>
                        </div>
                        <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',minWidth:'32px'}}>
                          <div style={{fontSize:'8px',color:'var(--text-f)'}}>{L.meshLbl || 'JSON-RPC'}</div>
                          <div style={{width:'100%',height:'1px',background:'var(--border-b)'}}></div>
                        </div>
                        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'3px',minWidth:'72px'}}>
                          <div style={{padding:'5px 8px',borderRadius:'4px',border:'1px solid var(--border-b)',background:'var(--purple-dim)',color:'var(--purple)',fontSize:'9px'}}>MCP CLIENT</div>
                          <div style={{fontSize:'8px',color:'var(--text-f)'}}>Translator</div>
                        </div>
                        <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',minWidth:'32px'}}>
                          <div style={{fontSize:'8px',color:'var(--text-f)'}}>stdio/SSE</div>
                          <div style={{width:'100%',height:'1px',background:'var(--border-b)'}}></div>
                        </div>
                        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'3px',minWidth:'72px'}}>
                          <div style={{padding:'5px 8px',borderRadius:'4px',border:'1px solid var(--border-b)',background:'var(--green-dim)',color:'var(--green)',fontSize:'9px'}}>CTX SERVER</div>
                          <div style={{fontSize:'8px',color:'var(--text-f)'}}>quantum_srv</div>
                        </div>
                      </div>
                    </div>
                  );
                }
              }
              return <div key={L.id} className={`ln ${L.type}`}>{L.text}</div>;
            })}
          </div>

          <div className={`typing ${isTyping ? 'on' : ''}`} id="typing">
             <div className="td"></div><div className="td"></div><div className="td"></div>
             <div className="typing-lbl">Cognitive Engine…</div>
          </div>
          <div className="input-bar">
            <span className="i-pmt">$</span>
            <input 
              className="i-field" id="cmd" type="text" placeholder="Enter command…"
              value={inputVal} onChange={e => setInputVal(e.target.value)} onKeyDown={handleKeyDown}
              autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false" enterKeyHint="send"
            />
            <button className="run-btn" onClick={submitCmd}>RUN</button>
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
              className="view active" 
              id="v-mesh"
            >
          <div className="mesh-view">
             <div className="section-hdr">MCP Host–Client–Server Topology</div>
             <div className="topology">
                <div className="topo-node">
                  <div className="topo-box host">UACP HOST</div>
                  <div className="topo-lbl">Veklom Terminal</div>
                </div>
                <div className="topo-arrow"><div className="a-tag">JSON-RPC 2.0 · initialize</div><div className="a-line"></div></div>
                <div className="topo-node">
                  <div className="topo-box client">MCP CLIENT</div>
                  <div className="topo-lbl">Protocol Translator</div>
                </div>
                <div className="topo-arrow"><div className="a-tag">stdio / SSE transport</div><div className="a-line"></div></div>
                <div className="topo-node">
                  <div className="topo-box server">CONTEXT SERVERS</div>
                  <div className="topo-lbl">filesystem · quantum · co2router</div>
                </div>
             </div>

             <div className="section-hdr" style={{marginTop: '16px'}}>4-Step Protocol Handshake (I/O Riot NG)</div>
             <div className="kpi-grid" style={{marginBottom: '16px'}}>
               <div className="kpi-card"><div className="kpi-label">1. Capability Discovery</div><div className="kpi-val g">OK</div></div>
               <div className="kpi-card"><div className="kpi-label">2. Protocol Negotiation</div><div className="kpi-val g">OK</div></div>
               <div className="kpi-card"><div className="kpi-label">3. Session Initialization</div><div className="kpi-val g">OK</div></div>
               <div className="kpi-card"><div className="kpi-label">4. Transport Validation</div><div className="kpi-val g">OK</div></div>
             </div>

             <div className="section-hdr">Context Servers</div>
             <div className="srv-card">
                <div className="srv-head"><span className="srv-name">filesystem_srv</span><span className="srv-badge on">ACTIVE</span></div>
                <div className="srv-row"><span className="srv-k">Transport</span><span className="srv-v">stdio</span></div>
                <div className="srv-row"><span className="srv-k">Session</span><span className="srv-v g">Stateful 1:1</span></div>
                <div className="srv-row"><span className="srv-k">Protocol</span><span className="srv-v">v2025-03-26</span></div>
                <div className="srv-divider"></div>
                <div className="srv-k" style={{marginBottom:'6px'}}>Capabilities</div>
                <div className="cap-row">
                   <div className="cap-pill">tools × 6</div><div className="cap-pill">resources × 12</div><div className="cap-pill">prompts × 2</div>
                </div>
             </div>

             <div className="srv-card">
                <div className="srv-head"><span className="srv-name">quantum_srv</span><span className="srv-badge on">ACTIVE</span></div>
                <div className="srv-row"><span className="srv-k">Transport</span><span className="srv-v">SSE</span></div>
                <div className="srv-row"><span className="srv-k">Session</span><span className="srv-v g">Stateful 1:1</span></div>
                <div className="srv-row"><span className="srv-k">Qubits</span><span className="srv-v p">1,024 registered</span></div>
                <div className="srv-row"><span className="srv-k">Gate fidelity</span><span className="srv-v g">F₂q = 0.9974</span></div>
                <div className="srv-divider"></div>
                <div className="cap-row">
                   <div className="cap-pill">tools × 8</div><div className="cap-pill">resources × 4</div><div className="cap-pill">Zeno API</div><div className="cap-pill">QPU calibrate</div>
                </div>
             </div>

             <div className="srv-card">
                <div className="srv-head"><span className="srv-name">co2router_srv</span><span className="srv-badge warn">NEGOTIATING</span></div>
                <div className="srv-row"><span className="srv-k">Transport</span><span className="srv-v">SSE</span></div>
                <div className="srv-row"><span className="srv-k">APIs</span><span className="srv-v a">35 endpoints</span></div>
                <div className="srv-row"><span className="srv-k">Emissions baseline</span><span className="srv-v a">2.4 kg CO₂e/hr</span></div>
                <div className="srv-row"><span className="srv-k">Optimized target</span><span className="srv-v g">1.1 kg CO₂e/hr</span></div>
                <div className="srv-divider"></div>
                <div className="cap-row">
                   <div className="cap-pill">monitoring</div><div className="cap-pill">rerouting</div><div className="cap-pill">Veklom bridge</div>
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
              className="view active" 
              id="v-tele"
            >
          <div className="tele-view">
             <div className="section-hdr">Live System Metrics</div>
             <div className="kpi-grid">
               <div className="kpi-card"><div className="kpi-label">Zeno Cycles</div><div className="kpi-val">{tele.zenoCycles}</div><div className="kpi-sub">Total interrogations</div></div>
               <div className="kpi-card"><div className="kpi-label">Coherence</div><div className="kpi-val g">{coh}%</div><div className="kpi-sub">Phase stability</div></div>
               <div className="kpi-card"><div className="kpi-label">Paths Pruned</div><div className="kpi-val a">{tele.pathsPruned}</div><div className="kpi-sub">Hallucinated branches</div></div>
               <div className="kpi-card"><div className="kpi-label">MCP Sessions</div><div className="kpi-val p">3</div><div className="kpi-sub">Active servers</div></div>
             </div>
             
             <div className="section-hdr">Resource Utilisation</div>
             <div className="tele-bar-card">
               <div className="tb-row"><span className="tb-key">Quantum context buffer</span><span className="tb-val">{pct}%</span></div>
               <div className="tb-bar"><div className="tb-fill" style={{width: `${pct}%`}}></div></div>
               <div className="tb-row"><span className="tb-key">Gladiator path slots</span><span className="tb-val">37.5%</span></div>
               <div className="tb-bar"><div className="tb-fill" style={{width:'37.5%'}}></div></div>
             </div>

             <div className="tele-bar-card">
                 <div className="section-hdr" style={{borderBottom:'none', paddingBottom:0, marginBottom:8}}>pi_agent_rust Deterministic Reactor</div>
                 <div className="tb-row"><span className="tb-key">NUMA Slab Tracking</span><span className="tb-val g">Aligned</span></div>
                 <div className="tb-row"><span className="tb-key">Bounded SPSC Lanes</span><span className="tb-val g">Optimal (0 saturated)</span></div>
                 <div className="tb-row"><span className="tb-key">Hostcall Reactor Mesh</span><span className="tb-val g">Deterministic Lock</span></div>
                 <div className="tb-row"><span className="tb-key">Garbage Collection</span><span className="tb-val p">Zero (Rust Ownership)</span></div>
             </div>

             <div className="tele-bar-card">
                <div className="section-hdr" style={{borderBottom:'none', paddingBottom:0, marginBottom:8}}>FFT Spectral Analysis (ISO 10816)</div>
                <div className="tb-row"><span className="tb-key">1x RPM (Unbalance)</span><span className="tb-val a" style={{animation: 'pls 2s infinite'}}>TRIGGERED</span></div>
                <div className="tb-bar" style={{height:'24px', background:'var(--surface-3)', display:'flex', alignItems:'flex-end', gap:'2px', overflow:'visible'}}>
                   {Array.from({length: 30}).map((_, i) => (
                      <div key={i} style={{
                         flex: 1, 
                         backgroundColor: i === 5 ? 'var(--accent)' : i === 10 ? 'var(--amber)' : 'var(--text-m)', 
                         opacity: i === 5 || i === 10 ? 1 : 0.3, 
                         height: i === 5 ? '100%' : i === 10 ? '70%' : `${10 + Math.random()*20}%`,
                         transition: 'height 0.2s ease',
                         borderTopLeftRadius: '2px', borderTopRightRadius: '2px'
                      }}></div>
                   ))}
                </div>
                <div className="tb-row" style={{marginTop:'8px'}}><span className="tb-key">Carpet Noise</span><span className="tb-val g">Stable</span></div>
                <div className="cap-row">
                   <div className="cap-pill" style={{background:'var(--accent-dim)', color:'var(--accent)', borderColor:'var(--border-b)'}}>GAN-Latent-Recon</div>
                   <div className="cap-pill">MCAR</div>
                   <div className="cap-pill">MAR</div>
                   <div className="cap-pill">MNAR</div>
                </div>
             </div>

             <div className="tele-bar-card">
                <div className="section-hdr" style={{borderBottom:'none', paddingBottom:0, marginBottom:8}}>M.E.L.T. Governance Monitor</div>
                <div className="kpi-grid" style={{marginBottom: '10px'}}>
                  <div className="kpi-card" style={{padding:'10px'}}><div className="kpi-label">Metrics</div><div className="kpi-sub">Token Tracking</div></div>
                  <div className="kpi-card" style={{padding:'10px'}}><div className="kpi-label" style={{color:'var(--purple)'}}>Events</div><div className="kpi-sub">Auth Intercepts</div></div>
                  <div className="kpi-card" style={{padding:'10px'}}><div className="kpi-label" style={{color:'var(--amber)'}}>Logs</div><div className="kpi-sub">PII Redacted</div></div>
                  <div className="kpi-card" style={{padding:'10px'}}><div className="kpi-label" style={{color:'var(--green)'}}>Traces</div><div className="kpi-sub">A2A Auditable</div></div>
                </div>
                <div className="tb-row"><span className="tb-key">Zero-Trust Compliance</span><span className="tb-val g">100% SECURE</span></div>
             </div>

             <div className="mt-4 flex flex-col gap-4">
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

             <div className="section-hdr">Event Log</div>
             <div className="event-log">
               {tele.eventLogs.map(e => (
                 <div key={e.id} className="ev-item">
                   <div className={`ev-dot ${e.cls}`}></div>
                   <div className="ev-body" dangerouslySetInnerHTML={{__html: e.text}}></div>
                   <div className="ev-time">{e.time}</div>
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
              className="view active" 
              id="v-paths"
            >
          <div className="paths-view">
            <div className="section-hdr">Gladiator Reasoning Engine — Path History</div>
            
            <div className="path-run">
              <div className="path-run-hdr"><span className="path-run-title">Bitmap Transmission (example)</span><span className="path-run-badge">LOCKED</span></div>
              <div className="path-entry"><div className="pe-num">1</div><div className="pe-label">RLE-Delta</div><div className="pe-bar"><div className="pe-fill win" style={{width:'87%'}}></div></div><div className="pe-pct win">87%</div><div className="pe-tag locked">LOCKED</div></div>
              <div className="path-entry"><div className="pe-num">2</div><div className="pe-label">Huffman+Q</div><div className="pe-bar"><div className="pe-fill ok" style={{width:'74%'}}></div></div><div className="pe-pct ok">74%</div><div className="pe-tag locked">LOCKED</div></div>
              <div className="path-entry"><div className="pe-num">3</div><div className="pe-label">LDPC-QEC</div><div className="pe-bar"><div className="pe-fill ok" style={{width:'61%'}}></div></div><div className="pe-pct ok">61%</div><div className="pe-tag locked">LOCKED</div></div>
              <div className="path-entry"><div className="pe-num">4</div><div className="pe-label">Raw-LZ4</div><div className="pe-bar"><div className="pe-fill lose" style={{width:'22%'}}></div></div><div className="pe-pct lose">22%</div><div className="pe-tag pruned">PRUNED</div></div>
              <div className="path-entry"><div className="pe-num">5</div><div className="pe-label">Naive-RLE</div><div className="pe-bar"><div className="pe-fill lose" style={{width:'9%'}}></div></div><div className="pe-pct lose">9%</div><div className="pe-tag pruned">PRUNED</div></div>
            </div>

            <div className="path-run">
              <div className="path-run-hdr"><span className="path-run-title">Heron QPU Calibration (example)</span><span className="path-run-badge">LOCKED</span></div>
              <div className="path-entry"><div className="pe-num">1</div><div className="pe-label">Echoed CR gate</div><div className="pe-bar"><div className="pe-fill win" style={{width:'91%'}}></div></div><div className="pe-pct win">91%</div><div className="pe-tag locked">LOCKED</div></div>
              <div className="path-entry"><div className="pe-num">2</div><div className="pe-label">ZNE mitigation</div><div className="pe-bar"><div className="pe-fill ok" style={{width:'78%'}}></div></div><div className="pe-pct ok">78%</div><div className="pe-tag locked">LOCKED</div></div>
              <div className="path-entry"><div className="pe-num">3</div><div className="pe-label">Rand bench</div><div className="pe-bar"><div className="pe-fill ok" style={{width:'66%'}}></div></div><div className="pe-pct ok">66%</div><div className="pe-tag locked">LOCKED</div></div>
              <div className="path-entry"><div className="pe-num">4</div><div className="pe-label">Naive reset</div><div className="pe-bar"><div className="pe-fill lose" style={{width:'11%'}}></div></div><div className="pe-pct lose">11%</div><div className="pe-tag pruned">PRUNED</div></div>
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
              className="view active" 
              id="v-engine"
            >
          <div className="engine-view">
             <div className="section-hdr" style={{marginTop: '16px'}}>Sovereign Engine Orchestrator</div>
             <div className="provider-select">
                <span>Primary Provider: </span>
                <select value={selectedProvider} onChange={e => setSelectedProvider(e.target.value as LLMProvider)}>
                  {providers.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
             </div>

             <div className="section-hdr" style={{marginTop: '16px'}}>LLM Governance & Keys</div>
             <div className="flex flex-col gap-3">
               {providers.map((p, idx) => (
                 <div key={p.id} className="p-3 bg-black/40 border border-white/5 rounded-xl flex flex-col gap-2">
                   <div className="flex items-center justify-between">
                     <span className="text-xs font-bold text-white/80">{p.name}</span>
                     <div className={`text-[8px] font-mono px-1.5 py-0.5 rounded ${p.enabled ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-white/5 text-white/30 border border-white/10'}`}>
                       {p.id === selectedProvider ? 'PRIMARY' : p.enabled ? 'STANDBY' : 'OFFLINE'}
                     </div>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                     <div className="flex flex-col gap-1">
                       <label className="text-[9px] text-white/30 uppercase tracking-tighter">API Key</label>
                       <input 
                         type="password" 
                         placeholder="••••••••" 
                         className="bg-black/40 border border-white/10 rounded px-2 py-1 text-[10px] text-cyan-400 outline-none focus:border-cyan-500/50"
                         value={p.apiKey || ''}
                         onChange={(e) => {
                           const newProviders = [...providers];
                           newProviders[idx] = { ...p, apiKey: e.target.value };
                           setProviders(newProviders);
                         }}
                       />
                     </div>
                     <div className="flex flex-col gap-1">
                       <label className="text-[9px] text-white/30 uppercase tracking-tighter">Base URL</label>
                       <input 
                         type="text" 
                         placeholder="Default" 
                         className="bg-black/40 border border-white/10 rounded px-2 py-1 text-[10px] text-cyan-400 outline-none focus:border-cyan-500/50"
                         value={p.baseUrl || ''}
                         onChange={(e) => {
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

             <div className="model-card" style={{marginBottom: '16px'}}>
                <div className="section-hdr" style={{borderBottom:'none', paddingBottom:0, marginBottom:8}}>Hybrid Reasoning Architecture</div>
                <div className="model-row"><span className="model-k">Backbone</span><span className="model-v p">Olmo3-Hybrid</span></div>
                <div className="model-row"><span className="model-k">Zeno (Inferential Density)</span><span className="model-v">Optimized Ratio</span></div>
                <div className="model-row"><span className="model-k">Gladiator (Speculation)</span><span className="model-v">Competitive Exploration</span></div>
                <div className="model-row"><span className="model-k">Counterfactual (Simulation)</span><span className="model-v g">Predictive Safety</span></div>
                <div className="model-row"><span className="model-k">Paradigm</span><span className="model-v a">State-over-Tokens (SoT)</span></div>
                <div className="cap-row" style={{marginTop:'8px'}}>
                  <div className="cap-pill">State-Based Recall</div>
                  <div className="cap-pill" style={{background:'var(--accent-dim)', color:'var(--accent)', borderColor:'var(--border-b)'}}>Anti-Collapse Protection</div>
                </div>
             </div>

             <div className="section-hdr" style={{marginTop: '16px'}}>100-Agent Task Force <span style={{float:'right',color:'var(--accent)',fontWeight:'normal'}}>{agentTaskForce.filter(a => a.status === 'executing').length} Active</span></div>
             <div className="agent-grid">
               {agentTaskForce.map(a => (
                 <div key={a.id} className={`agent-node ${a.status}`} title={`${a.role}: ${a.status}`}></div>
               ))}
             </div>
             <div className="agent-legend">
               <div className="al-item"><div className="agent-node idle"></div> Idle</div>
               <div className="al-item"><div className="agent-node assigned"></div> Assigned</div>
               <div className="al-item"><div className="agent-node executing"></div> Executing</div>
               <div className="al-item"><div className="agent-node blocked"></div> Blocked</div>
             </div>

             <div className="section-hdr" style={{marginTop: '16px'}}>Operational Hub Metrics</div>
             <div className="kpi-grid">
               <div className="kpi-card"><div className="kpi-label">Determinism</div><div className="kpi-val o">{hubMetrics ? (hubMetrics.certainty_index * 100).toFixed(2) : '99.9'}%</div><div className="kpi-sub">Strict grounding</div></div>
               <div className="kpi-card"><div className="kpi-label">Latency</div><div className="kpi-val g">{hubMetrics ? hubMetrics.latency.toFixed(1) : '14.0'}ms</div><div className="kpi-sub">Avg roundtrip</div></div>
               <div className="kpi-card"><div className="kpi-label">Consensus</div><div className="kpi-val p">{hubMetrics ? hubMetrics.active_agents_consensus : '84'}/{hubMetrics ? (hubMetrics.active_agents_consensus * 1.2).toFixed(0) : '100'}</div><div className="kpi-sub">Agreement index</div></div>
               <div className="kpi-card"><div className="kpi-label">Policy</div><div className="kpi-val a" style={{fontSize:'16px',marginTop:'4px',lineHeight:1}}>{hubMetrics?.operational_plane_locked ? 'LOCKED' : 'ACTIVE'}</div><div className="kpi-sub">Gopher Watchtower</div></div>
             </div>

             <div className="tele-bar-card" style={{marginTop: '16px'}}>
                <div className="section-hdr" style={{borderBottom:'none', paddingBottom:0, marginBottom:8}}>Industrial ROI Projection</div>
                <div className="tb-row"><span className="tb-key">Breakdown Reduction</span><span className="tb-val g">75%</span></div>
                <div className="tb-bar"><div className="tb-fill" style={{width:'75%', background:'var(--green)', boxShadow:'0 0 8px var(--green)'}}></div></div>
                <div className="tb-row"><span className="tb-key">Labour Cost Decrease</span><span className="tb-val g">45%</span></div>
                <div className="tb-bar"><div className="tb-fill" style={{width:'45%', background:'var(--green)', boxShadow:'0 0 8px var(--green)'}}></div></div>
                <div className="tb-row"><span className="tb-key">Condition-Based Maint.</span><span className="tb-val p">P-F Interval Active</span></div>
             </div>

             <div className="mt-6 flex flex-col gap-4 mb-4">
                {genome ? (
                  <GenomeDNA genome={genome} />
                ) : (
                  <div className="text-cyan-500/50 text-[10px] tracking-widest text-center py-4 border border-cyan-900/40 bg-[#0b1219]/60 rounded-xl">DECODING GENOME_DNA...</div>
                )}
                {lineage ? (
                  <LineageLedger nodes={lineage} />
                ) : (
                  <div className="text-cyan-500/50 text-[10px] tracking-widest text-center py-4 border border-cyan-900/40 bg-[#0b1219]/60 rounded-xl">ASSEMBLING LINEAGE LEDGER...</div>
                )}
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
              className="view active" 
              id="v-hub"
            >
          <div className="tele-view">
             <div className="section-hdr">Strategic Orchestration Hub</div>
             <div className="flex flex-col gap-4 mt-4">
                <IntentConsole 
                  onExecute={async (intent) => { 
                    pushLog(`> INTENT SUBMITTED: ${intent}`, 'pmt'); 
                    pushLog(`  ENGAGING NEURAL ORCHESTRATION CLUSTER...`, 'sys');
                    setActiveView('terminal');
                    try {
                      const res = await fetch('/api/cognitive/orchestrate', {
                        method: 'POST',
                        headers: { 
                          'Content-Type': 'application/json',
                          'x-user-credits': '1000',
                          'x-agent-confidence': '0.99'
                        },
                        body: JSON.stringify({
                          prompt: intent,
                          provider: selectedProvider,
                          context: "User requested action."
                        })
                      });
                      const data = await res.json();
                      if (!res.ok) {
                        pushLog(`  [ERROR] ${data.details || 'Neural core link timeout.'}`, 'err');
                      } else {
                        pushLog(`  Consensus convergence achieved via mesh.`, 'hdr');
                        if (data.action_plan && data.action_plan.steps) {
                          data.action_plan.steps.forEach((step: string) => pushLog(`  - ${step}`, 'sys'));
                        } else if (data.response) {
                          pushLog(`  ${data.response}`, 'sys');
                        } else {
                          // Generic dump if structure is weird
                          pushLog(`  ${JSON.stringify(data).substring(0, 100)}...`, 'sys');
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
                <PolicyEvaluationPanel status="active" />
                <ObservabilitySignals signals={[]} />
                <DeterminismRatio ratio={3.0} certainty={0.9999} noise={0.0001} entropy={0.0} />
                <ArchivesOfOrder isLocked={true} latency={14} coherence={84} progress={0.0000001} />
                <EmissionsTrajectory data={[]} />
                <RegionalEmittersPanel emitters={[]} />
                <MitigationPathwaysPanel />
                <GovernanceRoadmap phases={[]} />
                <IdentityGovernancePanel data={{xaaStatus: 'active', activeAgents: 0, shadowAiDetections: 0, complianceLevel: 100}} />
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
              className="view active" 
              id="v-trust"
            >
          <div className="tele-view">
             <div className="section-hdr">Agent Trust Scores</div>
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
              className="view active" 
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
              className="view active" 
              id="v-tools" 
              style={{ height: 'calc(100vh - 120px)' }}
            >
           <ToolExecutor />
            </motion.div>
          )}

          {activeView === 'climate' && (
            <motion.div 
              key="climate" 
              initial="initial" 
              animate="animate" 
              exit="exit" 
              variants={viewVariants}
              className="view active" 
              id="v-climate"
            >
              <div className="tele-view">
                 <div className="section-hdr">Climate & Sustainability</div>
                 <div className="flex flex-col gap-4 mt-4">
                    <EmissionsTrajectory data={[]} />
                    <RegionalEmittersPanel emitters={[]} />
                    <MitigationPathwaysPanel />
                    <BoundedScaling metrics={{phi_ratio: 1.618, carbon_intensity: 0.85, utilization: 0.92, water_risk: 'low'}}/>
                 </div>
              </div>
            </motion.div>
          )}

          {activeView === 'security' && (
            <motion.div 
              key="security" 
              initial="initial" 
              animate="animate" 
              exit="exit" 
              variants={viewVariants}
              className="view active" 
              id="v-security"
            >
              <div className="tele-view">
                 <div className="section-hdr">Security & Governance</div>
                 <div className="flex flex-col gap-4 mt-4">
                   <ThreatLandscape surfaces={[]} />
                   <IdentityGovernancePanel data={{xaaStatus: 'active', activeAgents: 0, shadowAiDetections: 0, complianceLevel: 100}} />
                   <PolicyEvaluationPanel status="active" />
                   <GovernanceMonitor />
                   <MCPGateway status={{sanitization: 'active', redaction: 'active', auditing: 'active', egress_control: 'active', last_scan_result: 'clear'}} />
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Nav */}
      <div className="bnav overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className={`bt ${activeView === 'terminal' ? 'active' : ''}`} onClick={() => setActiveView('terminal')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>
          </svg>Terminal
        </div>
        <div className={`bt ${activeView === 'mesh' ? 'active' : ''}`} onClick={() => setActiveView('mesh')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/>
            <line x1="12" y1="7" x2="12" y2="12"/><line x1="12" y1="12" x2="5" y2="17"/><line x1="12" y1="12" x2="19" y2="17"/>
          </svg>Mesh
        </div>
        <div className={`bt ${activeView === 'tele' ? 'active' : ''}`} onClick={() => setActiveView('tele')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
             <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>Telemetry
        </div>
        <div className={`bt ${activeView === 'paths' ? 'active' : ''}`} onClick={() => setActiveView('paths')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
          </svg>Paths
        </div>
        <div className={`bt ${activeView === 'engine' ? 'active' : ''}`} onClick={() => setActiveView('engine')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
             <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"/>
          </svg>Engine
        </div>

        <div className={`bt ${activeView === 'hub' ? 'active' : ''}`} onClick={() => setActiveView('hub')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
             <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
          </svg>Hub
        </div>
        <div className={`bt ${activeView === 'trust' ? 'active' : ''}`} onClick={() => setActiveView('trust')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>
          </svg>Trust
        </div>
        <div className={`bt ${activeView === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveView('dashboard')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
          </svg>Dashboard
        </div>
        <div className={`bt ${activeView === 'tools' ? 'active' : ''}`} onClick={() => setActiveView('tools')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.77 3.77z"/>
          </svg>Tools
        </div>
        <div className={`bt ${activeView === 'climate' ? 'active' : ''}`} onClick={() => setActiveView('climate')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-11.314l.707.707m11.314 11.314l.707.707M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/>
          </svg>Climate
        </div>
        <div className={`bt ${activeView === 'security' ? 'active' : ''}`} onClick={() => setActiveView('security')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>Security
        </div>
      </div>
    </div>
  );
}

