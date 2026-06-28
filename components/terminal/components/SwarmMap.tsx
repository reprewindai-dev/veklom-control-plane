"use client";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AgentNode } from '../types';
import { Search, ZoomIn, ZoomOut, RotateCcw, X, Cpu, Activity, Database, Flame, RefreshCcw, Terminal } from 'lucide-react';

function highlightJson(json: string): React.ReactNode[] {
  if (!json) return [];
  const parts: React.ReactNode[] = [];
  const regex = /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(json)) !== null) {
    if (match.index > lastIndex) {
      parts.push(json.substring(lastIndex, match.index));
    }

    let cls = 'text-white/60';
    if (/^"/.test(match[0])) {
      if (/:$/.test(match[0])) {
        cls = 'text-electric-cyan font-bold';
      } else {
        cls = 'text-matrix-emerald font-medium';
      }
    } else if (/true|false/.test(match[0])) {
      cls = 'text-amber-400 font-bold';
    } else if (/null/.test(match[0])) {
      cls = 'text-zinc-500 italic';
    } else {
      cls = 'text-hazard-amber font-semibold';
    }

    parts.push(<span key={match.index} className={cls}>{match[0]}</span>);
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < json.length) {
    parts.push(json.substring(lastIndex));
  }

  return parts;
}

interface SwarmMapProps {
  agents: AgentNode[];
  onAgentUpdate?: (id: string, updatedFields: Partial<AgentNode>) => void;
}

export default function SwarmMap({ agents, onAgentUpdate }: SwarmMapProps) {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(() => {
    return localStorage.getItem('swarm_diagnostics_open') === 'true';
  });
  const [copiedDiagnostics, setCopiedDiagnostics] = useState(false);

  useEffect(() => {
    localStorage.setItem('swarm_diagnostics_open', isDiagnosticsOpen.toString());
  }, [isDiagnosticsOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable
      ) {
        return;
      }

      if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        setIsDiagnosticsOpen(prev => !prev);
      } else if (e.key === 'Escape') {
        setIsDiagnosticsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Zoom and Pan States for infinite space feel
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1.0);
  const isDragging = useRef(false);
  const startDrag = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-centering state
  const centerMap = () => {
    if (containerRef.current) {
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      // Center on coordinate (400, 300)
      setPan({ x: width / 2 - 400 * zoom, y: height / 2 - 300 * zoom });
    }
  };

  useEffect(() => {
    centerMap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).tagName === 'circle' || (e.target as HTMLElement).closest('.drawer')) {
      return; // Ignore clicking on node circles or drawer elements
    }
    isDragging.current = true;
    startDrag.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    containerRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    setPan({
      x: e.clientX - startDrag.current.x,
      y: e.clientY - startDrag.current.y
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    containerRef.current?.releasePointerCapture(e.pointerId);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    let nextZoom = zoom;
    if (e.deltaY < 0) {
      nextZoom = Math.min(2.5, zoom * zoomFactor);
    } else {
      nextZoom = Math.max(0.4, zoom / zoomFactor);
    }

    // Zoom centered on the cursor inside container
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;

      // Calculate where the coordinate space maps before and after zoom
      const mapX = (cursorX - pan.x) / zoom;
      const mapY = (cursorY - pan.y) / zoom;

      setZoom(nextZoom);
      setPan({
        x: cursorX - mapX * nextZoom,
        y: cursorY - mapY * nextZoom
      });
    }
  };

  // Agent retrieval
  const selectedAgent = useMemo(() => {
    return agents.find(a => a.id === selectedAgentId) || null;
  }, [agents, selectedAgentId]);

  const formattedJson = useMemo(() => {
    if (!selectedAgent) return '';
    return JSON.stringify(selectedAgent, null, 2);
  }, [selectedAgent]);

  const highlightedJsonElements = useMemo(() => {
    if (!formattedJson) return [];
    return highlightJson(formattedJson);
  }, [formattedJson]);

  // Filters
  const filteredAgents = useMemo(() => {
    return agents.filter(agent => {
      const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            agent.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            agent.mission.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept = selectedDept === 'ALL' || agent.department === selectedDept;
      const matchesStatus = selectedStatus === 'ALL' || agent.status === selectedStatus;
      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [agents, searchQuery, selectedDept, selectedStatus]);

  const deptLeaderMap = useMemo(() => {
    const map = new Map<string, AgentNode>();
    for (const a of agents) {
      if (a.id.includes('LDR')) {
        map.set(a.id, a);
      }
    }
    return map;
  }, [agents]);

  // Orbit routes configurations to animate light pulse particles
  const orbitEdges = useMemo(() => {
    const edges: { fromX: number; fromY: number; toX: number; toY: number; dept: string; id: string }[] = [];
    const deptLeaders = agents.filter(a => a.id.includes('LDR'));
    const core = agents.find(a => a.id === 'AG-CORE-000');

    if (core) {
      // Connect leaders to Core IO Bus
      deptLeaders.forEach(leader => {
        edges.push({
          fromX: leader.x,
          fromY: leader.y,
          toX: core.x,
          toY: core.y,
          dept: leader.department,
          id: `edge-${leader.id}-core`
        });
      });
    }

    return edges;
  }, [agents]);

  // Manual Diagnostics Action: Reboot / Flush agent memory
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleAgentDiagnostics = (id: string) => {
    setIsRefreshing(true);
    if (onAgentUpdate) {
      onAgentUpdate(id, {
        status: 'Active',
        telemetryLogs: [
          `[${new Date().toISOString().substring(11, 19)}] MAN_OVERRIDE: Hard reboot command received.`,
          `[${new Date().toISOString().substring(11, 19)}] FLUSHING: Clearing Redis cache lock slots.`,
          `[${new Date().toISOString().substring(11, 19)}] SEKED: Re-establishing sandbox enclavement bounds.`,
          ...(selectedAgent?.telemetryLogs || [])
        ].slice(0, 15)
      });
    }
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-void-black grid-overlay select-none overflow-hidden">
      
      {/* 1. Topological Filtering Overlay Banner */}
      <div className="p-3.5 border-b border-white/[0.08] bg-black/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 z-10 font-mono text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#030303] border border-white/15 rounded-none px-2.5 py-1">
            <Search className="w-3.5 h-3.5 text-white/40" />
            <input
              type="text"
              placeholder="Query Swarm Telemetry..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-white/95 placeholder-white/35 font-mono text-xs w-48 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-white/40">CLUSTER:</span>
            <div className="flex rounded-none border border-white/15 overflow-hidden">
              {['ALL', 'Engineering', 'Ops', 'Research', 'Revenue', 'Growth'].map((dept) => (
                <button
                  key={dept}
                  onClick={() => setSelectedDept(dept)}
                  className={`px-2 py-0.5 text-[10px] uppercase font-bold transition-colors rounded-none ${selectedDept === dept ? 'bg-electric-cyan text-void-black' : 'bg-[#0A0A0C] text-white/60 hover:text-white hover:bg-white/5'}`}
                >
                  {dept === 'Engineering' ? 'ENG' : dept === 'Research' ? 'RES' : dept === 'Revenue' ? 'REV' : dept === 'Growth' ? 'GRO' : dept}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-1.5">
            <span className="text-white/40">STATE:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-[#030303] border border-white/15 text-white/80 rounded-none px-2 py-0.5 text-[11px] focus:outline-none"
            >
              <option value="ALL">ALL STATES</option>
              <option value="Active" className="text-electric-cyan font-bold">ACTIVE (PULSING)</option>
              <option value="Idle">IDLE (DIM)</option>
              <option value="Blocked">BLOCKED (WARNING)</option>
            </select>
          </div>

          {/* Map utilities */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setZoom(z => Math.min(2.5, z * 1.15))}
              className="p-1 px-2.5 rounded-none border border-white/15 bg-[#030303] text-white/60 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(z => Math.max(0.4, z / 1.15))}
              className="p-1 px-2.5 rounded-none border border-white/15 bg-[#030303] text-white/60 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setZoom(1.0);
                centerMap();
              }}
              className="p-1 px-2.5 rounded-none border border-white/15 bg-[#030303] text-white/60 hover:text-white"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsDiagnosticsOpen(prev => !prev)}
              className={`p-1 px-2.5 rounded-none border text-[10px] font-mono tracking-wider font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                isDiagnosticsOpen 
                  ? 'bg-electric-cyan text-void-black border-electric-cyan' 
                  : 'bg-[#030303] text-white/60 hover:text-white border-white/15'
              }`}
              title="Toggle Live JSON Diagnostics [D]"
              id="btn-toggle-diagnostics-drawer"
            >
              <kbd className="bg-white/10 px-1 py-0.5 rounded text-[9px] border border-white/20 select-none">D</kbd>
              <span>DIAGNOSTICS</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Interactive SVG Canvas wrapper */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        className="flex-grow relative cursor-grab active:cursor-grabbing overflow-hidden outline-none"
      >
        <svg
          className="w-full h-full absolute inset-0"
          pointerEvents="all"
        >
          {/* Main transformation matrix viewport */}
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            
            {/* Edge Connections between Leaders and Core */}
            {orbitEdges.map((edge) => {
              const pulseColor = edge.dept === 'Engineering' ? '#00FF66' : edge.dept === 'Research' ? '#00E5FF' : edge.dept === 'Revenue' ? '#FFAB00' : '#888888';
              return (
                <g key={edge.id}>
                  {/* Backdrop Connection Edge Line */}
                  <line
                    x1={edge.fromX}
                    y1={edge.fromY}
                    x2={edge.toX}
                    y2={edge.toY}
                    stroke="rgba(255, 255, 255, 0.04)"
                    strokeWidth="1.5"
                  />
                  {/* Edge Gradient / Flow Track Overlay */}
                  <line
                    x1={edge.fromX}
                    y1={edge.fromY}
                    x2={edge.toX}
                    y2={edge.toY}
                    stroke={`url(#grad-${edge.id})`}
                    strokeWidth="1.2"
                  />
                  <defs>
                    <linearGradient id={`grad-${edge.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="transparent" />
                      <stop offset="50%" stopColor={pulseColor} stopOpacity="0.3" />
                      <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                  </defs>

                  {/* Animated traveling particles */}
                  <circle r="2.5" fill={pulseColor} className="shadow-lg">
                    <animateMotion
                      dur={`${Math.random() * 3 + 2}s`}
                      repeatCount="indefinite"
                      path={`M ${edge.fromX} ${edge.fromY} L ${edge.toX} ${edge.toY}`}
                    />
                  </circle>
                </g>
              );
            })}

            {/* Department Orbit Subsystem Connections (sub-agents connected to leader) */}
            {agents.filter(a => !a.id.includes('LDR') && a.id !== 'AG-CORE-000').map((agent) => {
              // Find the leader of this cluster
              const leaderId = `AG-${agent.department.slice(0, 3).toUpperCase()}-LDR`;
              const deptLeader = deptLeaderMap.get(leaderId);
              if (!deptLeader) return null;

              return (
                <line
                  key={`subedge-${agent.id}`}
                  x1={agent.x}
                  y1={agent.y}
                  x2={deptLeader.x}
                  y2={deptLeader.y}
                  stroke={agent.status === 'Active' ? 'rgba(0, 229, 255, 0.08)' : 'rgba(255, 255, 255, 0.015)'}
                  strokeWidth="0.8"
                />
              );
            })}

            {/* Swarm Agent Nodes rendering to minimize DOM footprint and increase scrolling speed */}
            {filteredAgents.map((agent) => {
              const isSelected = agent.id === selectedAgentId;
              const isLead = agent.id.includes('LDR') || agent.id === 'AG-CORE-000';
              const r = isLead ? (agent.id === 'AG-CORE-000' ? 18 : 10) : 5;

              // Color determination based on status & department
              let strokeColor = 'rgba(255, 255, 255, 0.2)';
              let fillColor = '#0f0f12';
              let filterGlow = '';

              if (agent.status === 'Active') {
                strokeColor = '#00E5FF';
                fillColor = 'rgba(0, 229, 255, 0.2)';
                filterGlow = 'glow-pulse';
              } else if (agent.status === 'Blocked') {
                strokeColor = '#FF003C';
                fillColor = 'rgba(255, 0, 60, 0.2)';
              } else if (isLead) {
                strokeColor = 'rgba(255, 255, 255, 0.4)';
                fillColor = '#1a1a24';
              }

              return (
                <g
                  key={agent.id}
                  className="cursor-pointer group"
                  onClick={() => setSelectedAgentId(agent.id)}
                >
                  {/* Backdrop glowing concentric wave for Selected and Active units */}
                  {(isSelected || agent.status === 'Active') && (
                    <circle
                      cx={agent.x}
                      cy={agent.y}
                      r={r + (isSelected ? 7 : 4)}
                      fill="none"
                      stroke={agent.status === 'Blocked' ? '#FF003C' : '#00E5FF'}
                      strokeOpacity="0.25"
                      strokeWidth={isSelected ? "1.5" : "1"}
                      className="animate-fast-pulse pointer-events-none"
                    />
                  )}

                  {/* Subtle, slow-pulsing outer glow effect (using box-shadow with SVG foreignObject) */}
                  {agent.status === 'Active' && (
                    <foreignObject
                      x={agent.x - r - 24}
                      y={agent.y - r - 24}
                      width={(r + 24) * 2}
                      height={(r + 24) * 2}
                      className="pointer-events-none"
                    >
                      <div className="w-full h-full flex items-center justify-center pointer-events-none">
                        <div
                          className="active-glow-node pointer-events-none border"
                          style={{
                            width: `${r * 2}px`,
                            height: `${r * 2}px`,
                          }}
                        />
                      </div>
                    </foreignObject>
                  )}

                  {/* Core Node Circle */}
                  <circle
                    cx={agent.x}
                    cy={agent.y}
                    r={r}
                    fill={fillColor}
                    stroke={isSelected ? '#ffffff' : strokeColor}
                    strokeWidth={isSelected ? 2 : isLead ? 1.5 : 1}
                    className="transition-colors duration-200"
                  />

                  {/* Quick hovering node tooltips (Native SVG Title fallback for lightweight telemetry access) */}
                  <title>{`${agent.name} (${agent.role})\nCluster: ${agent.department}\nStatus: ${agent.status}\nMission: ${agent.mission}`}</title>

                  {/* Cluster Core Labels */}
                  {isLead && (
                    <text
                      x={agent.x}
                      y={agent.y - r - 5}
                      textAnchor="middle"
                      fill={agent.id === 'AG-CORE-000' ? '#00FF66' : '#ffffffaa'}
                      className="font-mono text-[9px] font-bold pointer-events-none uppercase tracking-wider select-none bg-black"
                    >
                      {agent.id === 'AG-CORE-000' ? 'MCP IO BUS CORE' : agent.department}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* 3. Frosted-Glass Slidable Right-Side-Panel Drawer */}
      <AnimatePresence>
        {selectedAgent && (
          <motion.div
            initial={{ x: 380, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 380, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="drawer absolute right-0 top-0 w-80 h-full border-l border-white/10 bg-[#060608]/95 z-20 flex flex-col justify-between"
          >
            {/* Header section with Close */}
            <div>
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#0A0A0C]">
                <div>
                  <div className="text-[10px] font-mono uppercase text-white/40">AGENT SPECS & CONTEXT</div>
                  <div className="font-mono text-xs font-bold text-white tracking-tight break-all flex items-center gap-1.5">
                    {selectedAgent.name}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAgentId(null)}
                  className="p-1 px-2 rounded-none hover:bg-white/5 text-white/50 hover:text-white border border-transparent hover:border-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Specs parameters */}
              <div className="p-4 space-y-4 font-mono text-xs overflow-y-auto max-h-[calc(100vh-210px)]">
                
                {/* Visual Status Indicator Node card */}
                <div className="p-3.5 rounded-none border border-white/5 bg-white/[0.02] flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase text-white/35 block font-bold leading-none">Current Consensus State</span>
                    <span className="text-white font-bold tracking-wide text-[10.5px]">{selectedAgent.role} • {selectedAgent.department}</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-tight ${
                    selectedAgent.status === 'Active' ? 'bg-electric-cyan/15 text-electric-cyan border border-electric-cyan/30' :
                    selectedAgent.status === 'Blocked' ? 'bg-laser-red/15 text-laser-red border border-laser-red/30' :
                    'bg-white/5 text-white/60 border border-white/10'
                  }`}>
                    {selectedAgent.status}
                  </span>
                </div>

                {/* Computational telemetry scores: CPU & Memory */}
                <div className="space-y-2">
                  <div className="text-[10px] uppercase text-white/35">Hardware Vector Slices</div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-2 border border-white/5 bg-[#030303]/80 rounded-none">
                      <span className="text-[9px] text-white/30 block flex items-center gap-1 uppercase font-bold"><Cpu className="w-2.5 h-2.5" /> CPU LOAD</span>
                      <span className="text-white font-bold text-sm tracking-tight">{selectedAgent.metrics.cpu}%</span>
                      <div className="w-full bg-white/5 h-1 rounded-none overflow-hidden mt-1.5">
                        <div className="bg-electric-cyan h-full" style={{ width: `${selectedAgent.metrics.cpu}%` }} />
                      </div>
                    </div>
                    <div className="p-2 border border-white/5 bg-[#030303]/80 rounded-none">
                      <span className="text-[9px] text-white/30 block flex items-center gap-1 uppercase font-bold"><Database className="w-2.5 h-2.5" /> MEM ALLOC</span>
                      <span className="text-white font-bold text-sm tracking-tight">{selectedAgent.metrics.memory}%</span>
                      <div className="w-full bg-white/5 h-1 rounded-none overflow-hidden mt-1.5">
                        <div className="bg-matrix-emerald h-full" style={{ width: `${selectedAgent.metrics.memory}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Micro metrics */}
                <div className="grid grid-cols-2 gap-2 text-[11px] py-1 border-y border-white/5">
                  <div>
                    <span className="text-white/30 block text-[9px] uppercase">Latency Bound</span>
                    <span className="text-white/80 font-bold">{selectedAgent.metrics.latency}ms</span>
                  </div>
                  <div>
                    <span className="text-white/30 block text-[9px] uppercase">PGL Exec Ticks</span>
                    <span className="text-white/80 font-bold">{selectedAgent.metrics.requestCount.toLocaleString()} tks</span>
                  </div>
                </div>

                {/* Mission Text area */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase text-white/35 block flex items-center gap-1 font-bold"><Flame className="w-2.5 h-2.5 text-hazard-amber" /> Dedicated Swarm Mission</span>
                  <p className="text-white/75 bg-[#030303] p-2.5 border border-white/5 rounded-none text-[11px] leading-relaxed">
                    {selectedAgent.mission}
                  </p>
                </div>

                {/* Tool scope codes */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase text-white/35 block flex items-center gap-1 font-bold">Authorized Tool Capability Scopes</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedAgent.toolScopes.map((scope) => (
                      <code key={scope} className="text-[10px] bg-white/[0.04] border border-white/10 text-white/80 px-2 py-0.5 rounded-none break-all tracking-tight select-all">
                        {scope}()
                      </code>
                    ))}
                  </div>
                </div>

                {/* Real-time ticker console */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase text-white/35 block flex items-center gap-1 font-bold"><Activity className="w-2.5 h-2.5" /> Node Cluster Telemetry Ticker</span>
                  <div className="bg-[#030303] text-[9.5px] font-mono leading-relaxed p-2.5 border border-white/5 rounded-none text-white/70 space-y-1.5 max-h-40 overflow-y-auto">
                    {selectedAgent.telemetryLogs.length === 0 ? (
                      <div className="text-white/30 italic text-center py-2">No dynamic telemetry ticks matching current block height.</div>
                    ) : (
                      selectedAgent.telemetryLogs.map((log, idx) => (
                        <div key={idx} className="border-b border-white/[0.02] last:border-none pb-1 font-mono tracking-tight text-white/85">
                          {log}
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Diagnostics footer override triggers */}
            <div className="p-3 bg-[#0A0A0C] border-t border-white/10">
              <button
                onClick={() => handleAgentDiagnostics(selectedAgent.id)}
                disabled={isRefreshing}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white/[0.01] hover:bg-white/[0.04] border border-white/10 rounded-none text-white text-[11px] font-bold font-mono uppercase tracking-widest disabled:opacity-50 transition-all cursor-pointer"
              >
                <RefreshCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-electric-cyan' : ''}`} />
                {isRefreshing ? 'RECONFIGURING HARD ENCLAVE...' : 'TRIGGER AGENT REBOOT'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. High-Contrast JSON Diagnostics Drawer (Keyboard-triggered [D] or clickable) */}
      <AnimatePresence>
        {isDiagnosticsOpen && (
          <motion.div
            initial={{ x: 440, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 440, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute top-0 h-full border-l border-white/20 bg-black/98 z-30 flex flex-col justify-between shadow-[0_0_50px_rgba(0,0,0,0.95)] transition-all duration-300"
            style={{
              width: '440px',
              right: selectedAgent ? '320px' : '0px',
            }}
          >
            <div>
              {/* Header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-zinc-950 font-mono">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-matrix-emerald animate-pulse" />
                  <div>
                    <div className="text-[10px] font-bold uppercase text-white/40 tracking-widest leading-none">JSON PAYLOAD DIAGNOSTICS</div>
                    <div className="font-mono text-xs font-bold text-white tracking-tight">
                      {selectedAgent ? `NODE :: ${selectedAgent.id}` : 'WAITING FOR INSTANCE FOCUS'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsDiagnosticsOpen(false)}
                  className="p-1 px-2 rounded-none hover:bg-white/5 text-white/50 hover:text-white border border-transparent hover:border-white/10 cursor-pointer"
                  title="Close diagnostics [Esc]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Payload Content Area */}
              <div className="p-4 font-mono text-[11.5px] leading-relaxed overflow-y-auto max-h-[calc(100vh-140px)]">
                {selectedAgent ? (
                  <div className="space-y-4">
                    {/* Live stream indicator bar */}
                    <div className="p-2.5 bg-[#030303] border border-matrix-emerald/10 flex items-center justify-between">
                      <span className="text-[9px] uppercase font-bold text-white/55 block flex items-center gap-1.5 leading-none">
                        <span className="w-2 h-2 rounded-full bg-matrix-emerald animate-ping inline-block" />
                        <span className="w-2 h-2 rounded-full bg-matrix-emerald inline-block absolute" />
                        &nbsp;&nbsp;&nbsp;ACTIVE PAYLOAD BUFFER STREAM
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(formattedJson);
                          setCopiedDiagnostics(true);
                          setTimeout(() => setCopiedDiagnostics(false), 2000);
                        }}
                        className={`px-2 py-1 text-[8.5px] font-bold tracking-wider uppercase border rounded-none transition-all cursor-pointer ${
                          copiedDiagnostics 
                            ? 'bg-matrix-emerald/20 text-matrix-emerald border-matrix-emerald/45 animate-pulse' 
                            : 'bg-white/5 text-white/70 border-white/10 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {copiedDiagnostics ? 'COPIED TO CLIPBOARD' : 'COPY RAW PAYLOAD'}
                      </button>
                    </div>

                    <div className="relative">
                      {/* JSON print container */}
                      <pre className="p-3 bg-[#020202] border border-white/5 overflow-x-auto text-[10.5px] leading-relaxed select-text font-mono max-h-[70vh] break-all whitespace-pre-wrap selection:bg-white/15">
                        {highlightedJsonElements}
                      </pre>
                    </div>
                  </div>
                ) : (
                  /* Empty state */
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full border border-dashed border-white/15 flex items-center justify-center animate-pulse">
                      <Cpu className="w-8 h-8 text-white/20" />
                    </div>
                    <div>
                      <h4 className="text-white font-mono text-xs uppercase tracking-wider font-bold mb-1">NO ACTIVE NODE FOCUSED</h4>
                      <p className="text-white/40 font-mono text-[10px] leading-relaxed max-w-xs px-4">
                        Select any agent telemetry node within the orbital topography viewport to map its dynamic specification payload here.
                      </p>
                    </div>
                    <div className="p-2 px-3 border border-white/10 bg-white/[0.02] text-[9.5px] text-white/40 font-mono">
                      PRESS <kbd className="bg-white/10 px-1 py-0.5 border border-white/20 text-white rounded font-mono">D</kbd> TO TOGGLE VIEW
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer with timestamp and system specs */}
            <div className="p-3.5 bg-zinc-950 border-t border-white/10 font-mono text-[9px] text-white/40 flex justify-between items-center bg-[#070709]">
              <span>SCHEDULER SYNCED</span>
              <span>UTC {new Date().toISOString().substring(11, 19)}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
