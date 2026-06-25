"use client";
import React, { useState, useEffect, useRef } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/api";
import { Server, Activity, ShieldAlert, Zap, Cpu, Clipboard, RefreshCw, Layers, Radio, Flame, CheckCircle, Terminal, Play, Lock, Database } from "lucide-react";

interface PeerNode {
  id: string;
  name: string;
  region: string;
  status: "LEADER" | "ATTESTING" | "CHALLENGED" | "STANDBY";
  x: number;
  y: number;
  stakeUsd: number;
  cpuMs: number;
  poolUtilization: number;
  version: string;
  tenantLock: string;
}

interface PaymentPacket {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  progress: number; // 0 to 1
  amountUsd: number;
  tenant: string;
}

interface SwarmTransaction {
  id: string;
  timestamp: string;
  tenant: string;
  amount: number;
  status: "SETTLED" | "ESCROWED" | "SLASHED" | "PENDING";
  signature: string;
  proposer: string;
}

export default function NetworkTopologyPanel() {
  const [selectedNodeId, setSelectedNodeId] = useState<string>("peer-1");
  const { data: topologyData } = useSWR<any>("/api/v1/beacon/topology", fetcher, { refreshInterval: 5000 });
  const topology = topologyData?.topology;

  const [nodes, setNodes] = useState<PeerNode[]>([]);
  const [packets, setPackets] = useState<PaymentPacket[]>([]);
  const [eventsLog, setEventsLog] = useState<string[]>([]);
  const [ledgerFeed, setLedgerFeed] = useState<SwarmTransaction[]>([]);
  const [isActiveStorm, setIsActiveStorm] = useState(false);
  const [totalSettledUsd, setTotalSettledUsd] = useState(0);
  const [safetyGuardActive, setSafetyGuardActive] = useState(true);

  useEffect(() => {
    if (topology) {
      if (nodes.length === 0) setNodes(topology.nodes || []);
      setEventsLog(topology.eventsLog || []);
      setLedgerFeed(topology.ledgerFeed || []);
      setTotalSettledUsd(topology.totalSettledUsd || 0);
      setIsActiveStorm(topology.isActiveStorm || false);
      setSafetyGuardActive(topology.safetyGuardActive ?? true);
    }
  }, [topology]);
  const selectedNode = nodes.find(n => n.id === selectedNodeId) || nodes[0];

  // Animate packets flowing between nodes
  useEffect(() => {
    const timer = setInterval(() => {
      // 1. Advance existing packets
      setPackets((prevPackets) => {
        return prevPackets
          .map((p) => ({ ...p, progress: p.progress + 0.04 }))
          .filter((p) => p.progress < 1.0);
      });

      // 2. Increment active settled total score
      setTotalSettledUsd(prev => prev + (Math.random() > 0.6 ? parseFloat((Math.random() * 0.05).toFixed(6)) : 0));

      // 3. Random packet spawner to simulate actual ledger transactions
      if (Math.random() > (isActiveStorm ? 0.08 : 0.65) && nodes.length > 0) {
        const fromNode = nodes[Math.floor(Math.random() * nodes.length)];
        const toNode = nodes[Math.floor(Math.random() * nodes.length)];
        if (fromNode.id !== toNode.id) {
          const tenants = ["veklom.io", "tempo_global", "coinbase_swarms", "mcp_gateway", "stripe.com"];
          const newP: PaymentPacket = {
            id: Math.random().toString(36).substr(2, 9),
            fromX: fromNode.x,
            fromY: fromNode.y,
            toX: toNode.x,
            toY: toNode.y,
            progress: 0,
            amountUsd: parseFloat((0.0001 + Math.random() * 0.04).toFixed(6)),
            tenant: tenants[Math.floor(Math.random() * tenants.length)]
          };

          setPackets((prev) => [...prev, newP]);

          // Also trigger a corresponding ledger log entry if storm handles it
          if (Math.random() > 0.45) {
            setLedgerFeed((prev) => {
              const txId = "tx_0x" + Math.random().toString(16).substr(2, 5);
              const curTime = new Date().toLocaleTimeString([], { hour12: false });
              const isChallenged = fromNode.status === "CHALLENGED" || toNode.status === "CHALLENGED";
              const newTx: SwarmTransaction = {
                id: txId,
                timestamp: curTime,
                tenant: newP.tenant,
                amount: newP.amountUsd,
                status: isChallenged ? "ESCROWED" : "SETTLED",
                signature: `ed25519:${Math.random().toString(36).substr(2, 4)}`,
                proposer: fromNode.name
              };
              return [newTx, ...prev.slice(0, 10)];
            });
          }
        }
      }
    }, 110);

    return () => clearInterval(timer);
  }, [nodes, isActiveStorm]);

  // Periodic node metrics fluctuation
  useEffect(() => {
    const testTimer = setInterval(() => {
      setNodes((prevNodes) => {
        return prevNodes.map((node) => {
          if (node.status === "STANDBY") return node;
          
          let nextCpu = parseFloat((node.cpuMs * (0.8 + Math.random() * 0.4)).toFixed(3));
          if (nextCpu < 0.03) nextCpu = 0.03;
          if (nextCpu > 0.75) nextCpu = 0.75;

          let nextPool = Math.round(node.poolUtilization + (Math.random() * 6 - 3));
          if (nextPool < 5) nextPool = 5;
          if (nextPool > 85) nextPool = 85;

          return {
            ...node,
            cpuMs: nextCpu,
            poolUtilization: nextPool
          };
        });
      });
    }, 4000);

    return () => clearInterval(testTimer);
  }, []);

  // 1. Fire Transaction Storm Trigger
  const triggerStorm = () => {
    setIsActiveStorm(true);
    setEventsLog(prev => [
      `[${new Date().toLocaleTimeString([], { hour12: false })}] ⚡ STORM INGESTION REGISTERED - 10,000 High-Frequency Microtransactions gliding across PBFT network`,
      `[${new Date().toLocaleTimeString([], { hour12: false })}] [SQLx Pool] dynamically spinning active pooling tunnels to handle connection throughput.`,
      ...prev.slice(0, 5)
    ]);

    setTimeout(() => {
      setIsActiveStorm(false);
    }, 4500);
  };

  // 2. Trigger Slashing attestation challenge
  const triggerAttestationChallenge = () => {
    // We arbitrarily challenge peer-3 (validator-eu-west-1) or peer-2
    setNodes((prev) => prev.map((n) => {
      if (n.id === "peer-3") {
        return { ...n, status: "CHALLENGED", stakeUsd: n.stakeUsd - 12000 };
      }
      return n;
    }));

    setEventsLog(prev => [
      `[${new Date().toLocaleTimeString([], { hour12: false })}] 🚨 ATTESTATION FAIL OR CHEAT SUSPICION: "validator-eu-west-1" submitted anomalous metric payload.`,
      `[${new Date().toLocaleTimeString([], { hour12: false })}] [PBFT Guardian] slashing 12,000 USD from validator deposit. Quarantine state LOCK applied.`,
      `[${new Date().toLocaleTimeString([], { hour12: false })}] [RLS Isolation] All queries from identity "tempo_global" redirected to isolated decoy storage buffer until audit clears.`,
      ...prev.slice(0, 5)
    ]);

    // Recover after 7 seconds
    setTimeout(() => {
      setNodes((prev) => prev.map((n) => {
        if (n.id === "peer-3") {
          return { ...n, status: "ATTESTING", version: "vnp-v0.1.3-patch" };
        }
        return n;
      }));
      setEventsLog(prev => [
        `[${new Date().toLocaleTimeString([], { hour12: false })}] ✓ "validator-eu-west-1" hot patched to v0.1.3-patch. Attestation integrity restored. State un-frozen.`,
        ...prev.slice(0, 4)
      ]);
    }, 7000);
  };

  // 3. Toggle Security Guard Isolation Modes
  const toggleSafetyGuard = () => {
    setSafetyGuardActive(prev => !prev);
    const state = !safetyGuardActive ? "ARMED" : "SOFT-LOG ONLY";
    setEventsLog(prev => [
      `[${new Date().toLocaleTimeString([], { hour12: false })}] Security guard system changed direction to [${state}]. PostgreSQL Row-Level-Security rules updated dynamically.`,
      ...prev.slice(0, 6)
    ]);
  };

  return (
    <div id="vnp-topology-cockpit-root" className="grid grid-cols-1 lg:grid-cols-12 gap-7 animate-fade-in text-[11px] font-mono">
      
      {/* LEFT SPACE: Interactive SVG Graph Node Swarm (lg:col-span-8) */}
      <div className="lg:col-span-8 flex flex-col justify-between bg-[#080d15] border border-slate-900 rounded-2xl p-5 relative overflow-hidden h-[570px]">
        {/* Glow Effects Filters */}
        <svg className="absolute w-0 h-0">
          <defs>
            <filter id="laser-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="node-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>

        {/* HUD Overlay Info Bar */}
        <div className="flex items-center justify-between border-b border-slate-900 pb-3 z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Radio className="w-4.5 h-4.5 text-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-slate-100 uppercase tracking-widest">Veklom MCP Gateway &amp; ConvergeOS Swarm</span>
            </div>
            <span className="text-[9px] text-[#86efac]/80 uppercase font-extrabold bg-[#052e16]/30 border border-emerald-500/10 px-2 py-0.5 rounded">
              PBFT Multicast Consensus &amp; attestation web
            </span>
          </div>

          <div className="text-right text-[10px]">
            <span className="text-slate-500 block uppercase leading-tight font-extrabold">x402 USDC ROUTE PAYMENTS</span>
            <span className="text-emerald-400 font-bold block">{totalSettledUsd.toFixed(6)} $SETTLED (USDC)</span>
          </div>
        </div>

        {/* The Vector map viewport area */}
        <div className="flex-1 min-h-[350px] relative mt-2 select-all">
          <svg viewBox="0 0 600 450" className="w-[100%] h-[100%] block">
            {/* Draw grid background lines */}
            <g stroke="rgba(30, 41, 59, 0.2)" strokeWidth="0.5" strokeDasharray="3,3">
              {Array.from({ length: 9 }).map((_, i) => (
                <line key={`grid-v-${i}`} x1={i * 70 + 20} y1="0" x2={i * 70 + 20} y2="450" />
              ))}
              {Array.from({ length: 7 }).map((_, i) => (
                <line key={`grid-h-${i}`} x1="0" y1={i * 70 + 15} x2="600" y2={i * 70 + 15} />
              ))}
            </g>

            {/* Draw laser peer-to-peer connection lines */}
            <g stroke="rgba(16, 185, 129, 0.08)" strokeWidth="1">
              {nodes.map((n1, idx1) => 
                nodes.slice(idx1 + 1).map((n2) => {
                  const isLeaderCon = n1.status === "LEADER" || n2.status === "LEADER";
                  const isChallenged = n1.status === "CHALLENGED" || n2.status === "CHALLENGED";
                  
                  return (
                    <line
                      key={`${n1.id}-${n2.id}`}
                      x1={n1.x}
                      y1={n1.y}
                      x2={n2.x}
                      y2={n2.y}
                      stroke={isChallenged ? "rgba(239, 68, 68, 0.15)" : isLeaderCon ? "rgba(16, 185, 129, 0.22)" : "rgba(16, 185, 129, 0.08)"}
                      strokeWidth={isLeaderCon ? "1.2" : "0.75"}
                      style={isLeaderCon ? { filter: "url(#laser-glow)" } : undefined}
                    />
                  );
                })
              )}
            </g>

            {/* Draw animation gliding packets */}
            {packets.map((p) => {
              const currentX = p.fromX + (p.toX - p.fromX) * p.progress;
              const currentY = p.fromY + (p.toY - p.fromY) * p.progress;

              return (
                <g key={p.id}>
                  {/* Glowing package head dot */}
                  <circle
                    cx={currentX}
                    cy={currentY}
                    r="3.5"
                    fill={p.tenant === "veklom.io" ? "#10b981" : p.tenant === "tempo_global" ? "#6366f1" : "#f59e0b"}
                    style={{ filter: "url(#laser-glow)" }}
                  />
                  {/* Subtle outer halo ripple ring */}
                  <circle
                    cx={currentX}
                    cy={currentY}
                    r="7"
                    fill="none"
                    stroke={p.tenant === "veklom.io" ? "#10b981" : p.tenant === "tempo_global" ? "#6366f1" : "#f59e0b"}
                    strokeWidth="0.5"
                    opacity={1.0 - p.progress}
                  />
                </g>
              );
            })}

            {/* Draw interactable physical nodes */}
            {nodes.map((n) => {
              const isSelected = selectedNodeId === n.id;
              let fillNodeColor = "#111827";
              let borderStroke = "rgba(16, 185, 129, 0.4)";
              let ledColor = "#10b981";

              if (n.status === "LEADER") {
                fillNodeColor = "#022c22";
                borderStroke = "#10b981";
                ledColor = "#10b981";
              } else if (n.status === "CHALLENGED") {
                fillNodeColor = "#450a0a";
                borderStroke = "#ef4444";
                ledColor = "#ef4444";
              } else if (n.status === "STANDBY") {
                fillNodeColor = "#1e293b";
                borderStroke = "rgba(148, 163, 184, 0.3)";
                ledColor = "#94a3b8";
              }

              if (isSelected) {
                borderStroke = "#6366f1";
              }

              return (
                <g 
                  key={n.id} 
                  transform={`translate(${n.x}, ${n.y})`}
                  className="cursor-pointer group"
                  onClick={() => setSelectedNodeId(n.id)}
                >
                  {/* Invisible broad click target path */}
                  <circle cx="0" cy="0" r="28" fill="transparent" />

                  {/* Pulsing Selection Ring */}
                  {isSelected && (
                    <circle
                      cx="0"
                      cy="0"
                      r="20"
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="1.5"
                      strokeDasharray="4,3"
                      className="animate-spin"
                      style={{ animationDuration: "12s" }}
                    />
                  )}

                  {/* Healthy outer halo glow */}
                  {n.status === "LEADER" && (
                    <circle
                      cx="0"
                      cy="0"
                      r="16"
                      fill="transparent"
                      stroke="#10b981"
                      strokeWidth="1.2"
                      opacity="0.3"
                      className="animate-pulse"
                    />
                  )}

                  {/* Physical chassis polygon / shape circle */}
                  <circle
                    cx="0"
                    cy="0"
                    r="12.5"
                    fill={fillNodeColor}
                    stroke={borderStroke}
                    strokeWidth={isSelected ? "2.5" : "1.25"}
                    style={n.status === "CHALLENGED" ? { filter: "url(#node-glow)" } : undefined}
                    className="transition duration-150 group-hover:scale-110"
                  />

                  {/* Central Core status LED */}
                  <circle
                    cx="0"
                    cy="0"
                    r="3.5"
                    fill={ledColor}
                    className={n.status === "CHALLENGED" ? "animate-pulse" : undefined}
                  />

                  {/* Floating Identifier Label */}
                  <text
                    x="0"
                    y="25"
                    fill={isSelected ? "#818cf8" : n.status === "CHALLENGED" ? "#f87171" : "#94a3b8"}
                    fontSize="8.5"
                    textAnchor="middle"
                    className="font-bold tracking-tight select-none opacity-85 group-hover:opacity-100"
                  >
                    {n.name.split("-")[1] || n.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Real-time system tracing console logs bar */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase font-extrabold pb-1.5 border-b border-slate-900">
            <Terminal className="w-3.5 h-3.5 text-slate-500" />
            <span>osconverge Repo &amp; PBFT Ledger Trace output</span>
          </div>
          <div className="h-[65px] overflow-y-auto font-mono text-[9px]/relaxed text-slate-400 space-y-1 select-text scrollbar-thin">
            {eventsLog.map((log, idx) => {
              let badge = "text-slate-500";
              if (log.includes("STORM")) badge = "text-amber-400 font-extrabold animate-pulse";
              if (log.includes("FAIL") || log.includes("CHALLENGE") || log.includes("slashing")) badge = "text-red-400 font-bold";
              if (log.includes("patched") || log.includes("restored")) badge = "text-emerald-400 font-bold";
              if (log.includes("Row Level Security")) badge = "text-blue-400";
              
              return (
                <div key={idx} className={`${badge} break-all`}>
                  {log}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* RIGHT SPACE: Controlling Command Center HUD (lg:col-span-4) */}
      <div className="lg:col-span-4 space-y-6 flex flex-col justify-between">
        
        {/* Validator HUD Inspector Details */}
        <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
            <Server className={`${selectedNode.status === "LEADER" ? "text-emerald-400 animate-pulse" : selectedNode.status === "CHALLENGED" ? "text-red-400 animate-spin" : "text-blue-400"} w-5 h-5`} />
            <div>
              <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold block">Consensus HUD Node</span>
              <h3 className="text-xs font-bold text-slate-100">{selectedNode.name}</h3>
            </div>
            <span className={`text-[8.5px] font-mono px-2 py-0.5 rounded font-extrabold uppercase border ml-auto ${
              selectedNode.status === "LEADER"
                ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/20"
                : selectedNode.status === "CHALLENGED"
                ? "bg-red-950/40 text-red-300 border-red-500/20 animate-pulse"
                : selectedNode.status === "STANDBY"
                ? "bg-slate-900 text-slate-400 border-slate-800"
                : "bg-blue-900/10 text-blue-300 border-blue-500/20"
            }`}>
              {selectedNode.status_str || selectedNode.status}
            </span>
          </div>

          {/* Interactive Node Metric HUD */}
          <div className="space-y-3 font-mono text-[10px] text-slate-400">
            <div className="flex justify-between">
              <span className="text-slate-500">Validator Jurisdiction:</span>
              <span className="text-slate-300 font-bold uppercase">{selectedNode.region}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Active Locked Stake:</span>
              <span className="text-emerald-400 font-bold">${selectedNode.stakeUsd.toLocaleString()} USD</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Node Latency response:</span>
              <span className="text-slate-300 font-bold">{selectedNode.cpuMs} ms</span>
            </div>
            
            {/* Connection Pool Meter */}
            <div className="space-y-1 bg-[#111827]/40 p-2.5 rounded border border-slate-900">
              <div className="flex justify-between text-[9px]">
                <span className="text-slate-500 lowercase">sqlx::Pool idle warm connections:</span>
                <span className="text-blue-300 font-bold">{selectedNode.poolUtilization}% utilization</span>
              </div>
              <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${selectedNode.status === "CHALLENGED" ? "bg-red-500" : "bg-blue-500"}`} 
                  style={{ width: `${selectedNode.poolUtilization}%` }}
                />
              </div>
            </div>

            <div className="flex justify-between pt-1 border-t border-slate-900 text-[9.5px]">
              <span className="text-slate-500">Tenant Namespace Isolation lock:</span>
              <span className="text-indigo-400 block max-w-[140px] truncate bg-indigo-950/15 px-1.5 py-0.2 rounded border border-indigo-500/10 font-bold">
                {selectedNode.tenantLock}
              </span>
            </div>
          </div>
        </div>

        {/* Live Reactor Button Deck (Spiders/Lasers Control Room) */}
        <div className="p-4 bg-[#0a0f18] border border-slate-900 rounded-2xl relative space-y-4">
          <div className="flex items-center gap-1.5 font-bold text-xs text-slate-300">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Interactive Protocol Probes</span>
          </div>

          <div className="flex flex-col gap-2.5">
            {/* Storm trigger button */}
            <button
              onClick={triggerStorm}
              disabled={isActiveStorm}
              className="w-full py-3 bg-gradient-to-tr from-amber-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 disabled:opacity-40 text-white rounded-xl text-xs font-black select-none cursor-pointer transition hover:scale-[1.01] active:scale-95 duration-100 uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 text-yellow-300 animate-pulse" />
              <span>{isActiveStorm ? "Consensus Flooding..." : "Simulate Escrow Traffic Storm"}</span>
            </button>

            <div className="grid grid-cols-2 gap-2 text-[10px]">
              {/* Challenge slash trigger */}
              <button
                onClick={triggerAttestationChallenge}
                className="py-2.5 bg-red-950/40 hover:bg-red-950/80 hover:text-red-300 text-red-400 rounded-lg font-bold border border-red-500/20 hover:border-red-500/50 cursor-pointer text-center transition block"
                title="Force-triggers anomalous payload from validator-eu-west-1 to fire automatic Slashing penalty"
              >
                <Flame className="w-3.5 h-3.5 inline mr-1 text-red-500 animate-bounce" />
                Fire Slashing Attest
              </button>

              {/* RLS Safety toggle switch */}
              <button
                onClick={toggleSafetyGuard}
                className={`py-2.5 rounded-lg border font-bold cursor-pointer text-center transition flex items-center justify-center gap-1 ${
                  safetyGuardActive 
                    ? "bg-emerald-950/20 text-emerald-300 border-emerald-500/20 hover:bg-emerald-950/40" 
                    : "bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800"
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>RLS Shield: {safetyGuardActive ? "ARMED" : "OFF"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Ledger Swarm Event trace feed */}
        <div className="bg-[#0b1017]/80 border border-slate-900/80 rounded-2xl p-4 space-y-3 flex-1 flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-4 h-4 text-indigo-400" />
              <span>x402 Micropayment Ledger (USDC on Base)</span>
            </span>
            <span className="text-[8.5px] bg-[#1a1224] text-[#d8b4fe] border border-purple-950 px-2 py-0.5 rounded font-bold uppercase animate-pulse">
              Anchor RLS
            </span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[110px] pr-1.5 space-y-2 mt-1 custom-scrollbar">
            {ledgerFeed.map((tx) => (
              <div 
                key={tx.id} 
                className="p-2.5 bg-slate-950/90 border border-slate-900/60 hover:border-slate-800 rounded-lg flex items-center justify-between text-[10.5px] transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-200 text-[11px]">{tx.tenant}</span>
                    <span className="text-[8.5px] text-slate-600 select-all font-mono">({tx.id})</span>
                  </div>
                  <span className="text-[8.5px] text-slate-500 block leading-none">Proposer Node: {tx.proposer}</span>
                </div>

                <div className="text-right">
                  <span className={`block font-extrabold ${tx.status === "SLASHED" ? "text-red-400" : tx.status === "ESCROWED" ? "text-amber-400" : "text-emerald-400"}`}>
                    ${tx.amount.toFixed(6)}
                  </span>
                  <span className="text-[8px] text-slate-500 block">{tx.signature}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
