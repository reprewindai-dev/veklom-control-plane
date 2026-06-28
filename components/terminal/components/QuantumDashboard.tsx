"use client";
import React, { useEffect, useState } from 'react';

export default function QuantumDashboard() {
  const [telemetry, setTelemetry] = useState<any>(null);
  const [statusState, setStatusState] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [securityData, setSecurityData] = useState<any>(null);
  const [layers, setLayers] = useState<any>([]);
  const [infra, setInfra] = useState<any>(null);
  const [nodes, setNodes] = useState<{x: number, y: number, r: number, glow: boolean}[]>([]);
  const [edges, setEdges] = useState<{n1: number, n2: number}[]>([]);

  useEffect(() => {
    // Generate static deterministic topology nodes based on grid.
    // Data-driven rendering based on actual Layer count will make it somewhat dynamic without Math.random()
    const buildGraph = (layerCount: number) => {
      const n = [];
      const nodeCount = Math.max(15, layerCount * 4);
      const gridSize = Math.ceil(Math.sqrt(nodeCount));
      for(let i=0; i<nodeCount; i++) {
         n.push({
           x: 10 + (i % gridSize) * ((80)/Math.max(1, gridSize-1)) + Math.sin(i)*5,
           y: 10 + Math.floor(i / gridSize) * ((80)/Math.max(1, gridSize-1)) + Math.cos(i)*5,
           r: i === 0 ? 8 : (i < layerCount ? 4 : 2),
           glow: i % 3 === 0
         });
      }
      setNodes(n);

      const e = [];
      for(let i=0; i<nodeCount*1.5; i++) {
         e.push({
           n1: i % n.length,
           n2: (i + 3) % n.length
         });
      }
      setEdges(e);
    };

    buildGraph(layers?.length || 4);
  }, [layers?.length]);

  const fetchData = async () => {
    try {
      // In agent-control-need-pgl, we should ideally use the configured API_BASE_URL
      // For now we keep the paths but they might need proxying or full URLs
      const [telRes, statusRes, healthRes, secRes, layersRes, infraRes] = await Promise.all([
        fetch('/api/quantum-metrics').catch(() => ({ ok: false })),
        fetch('/api/status').catch(() => ({ ok: false })),
        fetch('/api/v1/sys/health').catch(() => ({ ok: false })),
        fetch('/api/uacp/security').catch(() => ({ ok: false })),
        fetch('/api/uacp/layers').catch(() => ({ ok: false })),
        fetch('/api/uacp/infrastructure').catch(() => ({ ok: false }))
      ]);
      if (telRes.ok) setTelemetry(await telRes.json());
      if (statusRes.ok) setStatusState(await statusRes.json());
      if (healthRes.ok) setHealth(await healthRes.json());
      if (secRes.ok) setSecurityData(await secRes.json());
      if (layersRes.ok) setLayers(await layersRes.json());
      if (infraRes.ok) setInfra(await infraRes.json());
    } catch (e) {
      console.error("Failed to fetch dashboard data", e);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const coherence = telemetry ? parseFloat(telemetry.fidelity || 99.8) : 99.8;
  const errorRate = telemetry ? parseFloat(telemetry.leakage_rate || 0.0) : 0.00;

  const systemOperational = statusState?.status === "healthy";
  const circuitState = statusState?.circuit_breaker?.state || "UNKNOWN";
  const llmModel = statusState?.llm_model || "Connecting...";
  const uptime = statusState?.uptime_seconds || 0;

  const zenoCycles = telemetry?.zeno_cycles || 0;
  const sysScore = health?.score || 0;

  const threatCount = securityData?.surfaces?.filter((s:any) => s.threat_level === "critical").length || 0;
  const warnCount = securityData?.surfaces?.filter((s:any) => s.threat_level === "high").length || 0;

  const engineState = telemetry?.status || "PHASE_LOCKED";

  // Simple formatting helpers
  const fmtTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="quantum-dashboard font-mono text-[10px]" style={{ height: '100%', overflowY: 'auto', backgroundColor: '#050a0f', color: '#88aebf', padding: '16px' }}>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border border-cyan-500/50 flex items-center justify-center p-1 text-cyan-400">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
               </svg>
            </div>
            <div>
               <div className="text-white font-sans font-medium text-sm tracking-widest">QUANTUM SERIES UACP</div>
               <div className="text-[8px] tracking-widest uppercase text-cyan-500/80">Universal Autonomous Control Plane</div>
            </div>
         </div>
         <div className="flex gap-4">
             <div className="flex gap-2 text-cyan-500/50">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
             </div>
             <div className="text-right">
                <div className="text-cyan-400 font-sans text-xs tracking-widest">{llmModel}</div>
                <div className="text-[8px] uppercase tracking-widest text-cyan-500/50">Uptime: {fmtTime(uptime)}</div>
             </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr_1fr] gap-4">
         {/* Left Column */}
         <div className="flex flex-col gap-4">
            {/* SYSTEM LOGS */}
            <div className="bg-[#0b1219]/60 border border-cyan-900/40 rounded-xl p-4 relative backdrop-blur-sm shadow-[0_0_15px_rgba(0,255,255,0.03)]">
               <div className="text-[10px] tracking-widest text-white/90 font-sans mb-4 flex items-center justify-between">
                  SYSTEM EVENTS <span className="text-cyan-500/40 tracking-[0.2em] font-mono">...</span>
               </div>

               <div className="space-y-4">
                  {[
                     { t: 'Circuit Breaker', s: circuitState },
                     { t: 'LLM Engine', s: statusState?.llm_ok ? "ONLINE" : "OFFLINE" },
                     { t: 'Privacy Shield', s: statusState?.privacy?.pii_protection || "Loading..." }
                  ].map((x, i) => (
                     <div key={i} className="flex gap-2 items-start">
                        <div className="w-[4px] h-[4px] rounded-full bg-cyan-400 mt-[5px] shadow-[0_0_6px_#0ff]"></div>
                        <div>
                           <div className="text-white/80">{x.t}</div>
                           <div className="text-[8px] text-cyan-500/50 uppercase">{x.s}</div>
                        </div>
                     </div>
                  ))}
               </div>

               <div className="mt-6 h-16 w-full border-t border-cyan-900/30 pt-2 relative">
                  {/* Waveform graphic */}
                  <svg className="w-full h-full text-cyan-500/70" viewBox="0 0 100 40" preserveAspectRatio="none">
                     <path d="M0,20 Q10,35 20,20 T40,20 T60,20 T80,20 T100,20" fill="none" stroke="currentColor" strokeWidth="1" />
                     <path d="M0,20 Q15,5 25,20 T50,20 T75,20 T100,20" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-cyan-400 drop-shadow-[0_0_3px_#0ff]" />
                  </svg>
                  <div className="flex justify-between text-[8px] text-cyan-500/40 absolute bottom-0 w-full">
                     <span>T-120s</span><span>T-60s</span><span>T-30s</span><span>Now</span>
                  </div>
               </div>
            </div>

            {/* CONTROL MODULES */}
            <div className="bg-[#0b1219]/60 border border-cyan-900/40 rounded-xl p-4 relative backdrop-blur-sm">
               <div className="text-[10px] tracking-widest text-white/90 font-sans mb-4 flex items-center justify-between">
                  INFRASTRUCTURE MESH <span className="text-cyan-500/40 tracking-[0.2em] font-mono">...</span>
               </div>
               <div className="space-y-2 mb-4 h-[120px] overflow-y-auto pr-2 scrollbar-hide">
                  {infra?.nodes ? infra.nodes.map((n: any, i: number) => (
                     <div key={i} className="bg-cyan-950/20 border border-cyan-900/40 p-2 rounded">
                        <div className="flex justify-between items-center mb-1">
                           <span className="text-white/90 font-bold">{n.name}</span>
                           <span className="text-green-400 text-[8px]">{n.status}</span>
                        </div>
                        <div className="text-[7px] text-cyan-500/60 uppercase flex gap-2">
                           <span>IP: {n.ip}</span>
                           <span>PING: {n.latency}</span>
                        </div>
                        <div className="flex gap-1 mt-1">
                           {n.roles.map((r: string) => (
                              <span key={r} className="px-1 border border-cyan-800/50 bg-cyan-900/20 text-[6px] text-cyan-400/80 rounded">{r}</span>
                           ))}
                        </div>
                     </div>
                  )) : (
                     <div className="text-cyan-500/50">Probing Hetzner network...</div>
                  )}
               </div>
            </div>
         </div>

         {/* Center Column */}
         <div className="bg-[#0b1219]/80 border border-cyan-800/40 rounded-xl p-5 relative flex flex-col justify-between backdrop-blur-md shadow-[inset_0_0_40px_rgba(0,180,255,0.03)]">
            <div className="flex justify-between items-start z-10">
               <div>
                  <div className="text-[12px] tracking-widest text-white font-sans mb-1">QUANTUM NETWORK TOPOLOGY</div>
                  <div className="flex items-center gap-3">
                     <div className="flex items-center gap-1 text-[8px] tracking-widest text-green-400/90 border border-green-500/30 bg-green-500/10 px-2 py-0.5 rounded-full">
                        <div className="w-[4px] h-[4px] bg-green-400 rounded-full shadow-[0_0_5px_#4ade80]"></div>
                        {engineState}
                     </div>
                     <span className="text-[10px] text-white/50 tracking-widest">ERRORS {errorRate}%</span>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  <div className="text-[8px] tracking-widest text-cyan-500/40 text-right pr-2">SCORE: {sysScore}/100</div>
                  <div className="flex items-center gap-2">
                     <div className="text-center w-12 h-12 rounded-full border border-cyan-500/30 flex flex-col justify-center items-center shadow-[inset_0_0_10px_rgba(0,255,255,0.1)] relative">
                        <svg className="absolute w-full h-full rotate-[-90deg]">
                           <circle cx="24" cy="24" r="22" fill="none" stroke="rgba(0,255,255,0.1)" strokeWidth="2" />
                           <circle cx="24" cy="24" r="22" fill="none" stroke="var(--accent)" strokeWidth="2" strokeDasharray="138" strokeDashoffset={138 - (138 * Math.min(errorRate, 10)) / 100} />
                        </svg>
                        <span className="text-white/80 text-[10px]">{errorRate}%</span>
                        <span className="text-[6px] text-cyan-500/50 uppercase">Error</span>
                     </div>
                     <div className="text-center w-12 h-12 rounded-full border border-cyan-500/30 flex flex-col justify-center items-center shadow-[inset_0_0_10px_rgba(0,255,255,0.1)] relative">
                        <svg className="absolute w-full h-full rotate-[-90deg]">
                           <circle cx="24" cy="24" r="22" fill="none" stroke="rgba(0,255,255,0.1)" strokeWidth="2" />
                           <circle cx="24" cy="24" r="22" fill="none" stroke="var(--accent)" strokeWidth="2" strokeDasharray="138" strokeDashoffset={138 - (138 * coherence) / 100} />
                        </svg>
                        <span className="text-white/80 text-[10px]">{coherence.toFixed(1)}%</span>
                        <span className="text-[6px] text-cyan-500/50 uppercase">Coherence</span>
                     </div>
                  </div>
               </div>
            </div>

            {/* Network Topology Visualization */}
            <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
               <svg className="w-[80%] h-[70%] text-cyan-400">
                   {edges.map((e, i) => {
                      const n1 = nodes[e.n1];
                      const n2 = nodes[e.n2];
                      if(!n1 || !n2) return null;
                      return <line key={i} x1={`${n1.x}%`} y1={`${n1.y}%`} x2={`${n2.x}%`} y2={`${n2.y}%`} stroke="rgba(0, 255, 255, 0.2)" strokeWidth="1" strokeDasharray={i % 2 === 0 ? "2,2" : ""} />
                   })}
                   {nodes.map((n, i) => (
                      <g key={i}>
                        {n.glow && <circle cx={`${n.x}%`} cy={`${n.y}%`} r={n.r * 3} fill="rgba(0,255,255,0.1)" filter="blur(4px)" />}
                        {n.glow && <circle cx={`${n.x}%`} cy={`${n.y}%`} r={n.r * 1.5} fill="rgba(0,255,255,0.3)" />}
                        <circle cx={`${n.x}%`} cy={`${n.y}%`} r={n.r} fill="currentColor" className="drop-shadow-[0_0_8px_#0ff]" />
                      </g>
                   ))}
                   {/* Main core */}
                   <circle cx="50%" cy="50%" r="20" fill="rgba(0,255,255,0.1)" className="drop-shadow-[0_0_20px_#0ff]" />
                   <circle cx="50%" cy="50%" r="8" fill="#fff" className="drop-shadow-[0_0_10px_#fff]" />
                   <circle cx="50%" cy="50%" r="25" fill="none" stroke="rgba(0,255,255,0.3)" strokeDasharray="4 4" strokeWidth="2" />
               </svg>
            </div>

            <div className="z-10 mt-auto">
               <div className="text-cyan-200/80 mb-6">
                  <div>Qubit Stability: <span className="text-cyan-400">{coherence}%</span></div>
                  <div>Network Integrity: <span className="text-cyan-400">{errorRate < 1 ? 'High' : 'Degraded'}</span></div>
                  <div>Status: <span className="text-white/60">{engineState}</span></div>
               </div>

               <div className="w-full h-[1px] bg-cyan-900/40 mb-3 relative flex justify-end">
                  <div className="absolute top-[-8px] bg-[#0b1219] px-2 text-[8px] text-cyan-400 tracking-widest mr-2 uppercase border border-cyan-800/40 rounded">ENTANGLEMENT {engineState}</div>
               </div>

               <div className="grid grid-cols-5 gap-2 text-center items-end pb-2">
                  <div className="flex flex-col border-r border-cyan-900/30 pr-2 overflow-hidden text-ellipsis whitespace-nowrap">
                     <span className="text-[8px] text-cyan-500/50 uppercase tracking-widest mb-1 truncate">SYSTEM STATUS</span>
                     <span className="text-cyan-300 tracking-wider truncate">{systemOperational ? 'OPERATIONAL' : 'DEGRADED'}</span>
                  </div>
                  <div className="flex flex-col border-r border-cyan-900/30 px-2 overflow-hidden text-ellipsis whitespace-nowrap">
                     <span className="text-[8px] text-cyan-500/50 uppercase tracking-widest mb-1 truncate">CIRCUIT</span>
                     <span className="text-cyan-300 tracking-wider truncate">{circuitState}</span>
                  </div>
                  <div className="flex flex-col border-r border-cyan-900/30 px-2 overflow-hidden text-ellipsis whitespace-nowrap">
                     <span className="text-[8px] text-cyan-500/50 uppercase tracking-widest mb-1 truncate">QUBIT ARRAY</span>
                     <span className="text-cyan-300 tracking-wider truncate">ACTIVE <span className="text-[8px] text-cyan-500/50">({zenoCycles}C)</span></span>
                  </div>
                  <div className="flex flex-col border-r border-cyan-900/30 px-2 overflow-hidden text-ellipsis whitespace-nowrap">
                     <span className="text-[8px] text-cyan-500/50 uppercase tracking-widest mb-1 truncate">COHERENCE</span>
                     <span className="text-cyan-300 text-[12px] truncate">{coherence.toFixed(1)}%</span>
                  </div>
                  <div className="flex flex-col pl-2 overflow-hidden text-ellipsis whitespace-nowrap">
                     <span className="text-[8px] text-cyan-500/50 uppercase tracking-widest mb-1 truncate">SYS SCORE</span>
                     <span className="text-cyan-300 text-[12px] truncate">{sysScore}</span>
                  </div>
               </div>
            </div>
         </div>

         {/* Right Column */}
         <div className="flex flex-col gap-4">
            {/* RESOURCES */}
            <div className="bg-[#0b1219]/60 border border-cyan-900/40 rounded-xl p-4 relative backdrop-blur-sm">
               <div className="text-[10px] tracking-widest text-white/90 font-sans mb-4 flex items-center justify-between">
                  HEALTH COMPONENTS <span className="text-cyan-500/40 tracking-[0.2em] font-mono">...</span>
               </div>
               <div className="space-y-3">
                  {health?.components ? Object.keys(health.components).map((k) => (
                     <div key={k}>
                        <div className="flex justify-between text-[10px] text-cyan-100/80 mb-1">
                           <span className="capitalize">{k}</span>
                           <span>{health.components[k].status} ({health.components[k].latency})</span>
                        </div>
                        <div className="h-1 bg-cyan-950 rounded-full overflow-hidden">
                           <div className="h-full bg-cyan-400 shadow-[0_0_8px_#0ff]" style={{width: health.components[k].status === 'healthy' ? '100%' : '50%'}}></div>
                        </div>
                     </div>
                  )) : (
                     <div className="text-cyan-500/50">Loading metrics...</div>
                  )}
               </div>
            </div>

            {/* ALERT MONITOR */}
            <div className="bg-[#0b1219]/60 border border-cyan-900/40 rounded-xl p-4 relative backdrop-blur-sm">
               <div className="text-[10px] tracking-widest text-white/90 font-sans mb-4 flex items-center justify-between">
                  SECURITY SURFACES <span className="text-cyan-500/40 tracking-[0.2em] font-mono">...</span>
               </div>
               <div className="flex gap-6 relative h-[25px]">
                  <div>
                     <div className="text-2xl text-red-500 font-sans tracking-tight mb-1 items-baseline flex gap-1">{threatCount} <span className="text-[10px] font-mono tracking-widest text-red-300/80">Critical</span></div>
                     <div className="h-[2px] w-full bg-red-950 absolute bottom-0 left-0"><div className="h-full bg-red-500 transition-all duration-500" style={{width: threatCount > 0 ? '100%' : '0%'}}></div></div>
                  </div>
                  <div>
                     <div className="text-2xl text-yellow-500 font-sans tracking-tight mb-1 items-baseline flex gap-1">{warnCount} <span className="text-[10px] font-mono tracking-widest text-yellow-300/80">High</span></div>
                     <div className="h-[2px] w-full bg-yellow-950 absolute bottom-0 right-0 w-[50%]"><div className="h-full bg-yellow-500 transition-all duration-500" style={{width: warnCount > 0 ? '100%' : '0%'}}></div></div>
                  </div>
               </div>
            </div>

            {/* TIMELINE */}
            <div className="bg-[#0b1219]/60 border border-cyan-900/40 rounded-xl p-4 relative backdrop-blur-sm flex-1 overflow-hidden">
               <div className="text-[10px] tracking-widest text-white/90 font-sans mb-4 flex items-center justify-between">
                  TIMELINE <span className="text-cyan-500/40 tracking-[0.2em] font-mono">...</span>
               </div>
               <div className="space-y-4 border-l border-cyan-900/50 pl-3 ml-1 h-[150px] overflow-y-auto pr-2 scrollbar-hide">
                  {telemetry?.timestamp ? (
                     <div className="relative">
                        <div className="absolute left-[-16.5px] top-[4px] w-2 h-2 rounded-full border border-cyan-400 bg-[#0b1219] z-10 box-content shadow-[0_0_8px_#0ff] flex items-center justify-center">
                           <div className="w-[2px] h-[2px] bg-cyan-400 rounded-full"></div>
                        </div>
                        <div className="text-white/80">Event: Qubit Sync [{new Date(telemetry.timestamp).toLocaleTimeString()}]</div>
                        <div className="text-[8px] text-cyan-500/50 uppercase">Data ingested from MCP</div>
                     </div>
                  ) : null}
                  {health?.status ? (
                     <div className="relative">
                        <div className="absolute left-[-16.5px] top-[4px] w-2 h-2 rounded-full border border-cyan-400 bg-[#0b1219] z-10 box-content shadow-[0_0_8px_#0ff] flex items-center justify-center">
                           <div className="w-[2px] h-[2px] bg-cyan-400 rounded-full"></div>
                        </div>
                        <div className="text-white/80">Event: Health Check [{new Date().toLocaleTimeString()}]</div>
                        <div className="text-[8px] text-cyan-500/50 uppercase">Substems: {Object.keys(health.components || {}).join(', ')}</div>
                     </div>
                  ) : null}
                  {securityData?.surfaces ? securityData.surfaces.slice(0, 3).map((s:any, i:number) => (
                     <div key={`sec-${i}`} className="relative">
                        <div className="absolute left-[-16.5px] top-[4px] w-2 h-2 rounded-full border border-red-500 bg-[#0b1219] z-10 box-content shadow-[0_0_8px_#f00] flex items-center justify-center">
                           <div className="w-[2px] h-[2px] bg-red-500 rounded-full"></div>
                        </div>
                        <div className="text-red-300/90">Alert: {s.name}</div>
                        <div className="text-[8px] text-red-500/50 uppercase">Threat: {s.threat_level}</div>
                     </div>
                  )) : null}
                  {!telemetry && !health && !securityData && (
                     <div className="text-[10px] text-cyan-500/50">Awaiting telemetry datastream...</div>
                  )}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
