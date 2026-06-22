// @ts-nocheck
"use client";
import { useState, useEffect, useRef, FormEvent } from "react";
import { JobStatus, SimTenant, SimJob, SimJobEvent, SimAuditBlock } from "../types";
import { PreciseDecimal } from "../utils/math";
import {
  generateUUID,
  generateId,
  getInitialTenants,
  getInitialJobs,
  ROUTE_NODES,
  createSimulationManager,
  SimSystemState,
} from "../utils/veklomSim";
import {
  Activity,
  Database,
  RefreshCw,
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lock,
  DollarSign,
  Flame,
  PlusCircle,
  Clock,
  Terminal,
  Server,
  FileSpreadsheet,
  Info,
  LineChart,
  Zap
} from "lucide-react";

interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: "info" | "success" | "warn" | "error" | "redis" | "postgres";
}

export default function StateVisualizer() {
  // System State
  const [state, setState] = useState<SimSystemState>(() => ({
    tenants: getInitialTenants(),
    jobs: Object.fromEntries(getInitialJobs().map(j => [j.jobId, j])),
    jobEvents: [],
    auditBlocks: [],
    redisReservations: {},
    idempotencyKeys: {},
    redisStream: [],
  }));

  // Logging
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logCounter = useRef(0);

  const logMessage = (
    message: string,
    type: LogEntry["type"] = "info"
  ) => {
    const timestamp = new Date().toISOString().split("T")[1].slice(0, 8);
    setLogs((prev) => [
      {
        id: `log-${Date.now()}-${logCounter.current++}`,
        timestamp,
        message,
        type,
      },
      ...prev.slice(0, 49), // cap logs at 50 for clean render
    ]);
  };

  // Form Inputs
  const [activeTenantId, setActiveTenantId] = useState("tenant_alpha_prime");
  const [payloadIntent, setPayloadIntent] = useState("aggregate_crossblock_liquidity");
  const [tokenBudget, setTokenBudget] = useState(1200);
  const [maxBudgetUsd, setMaxBudgetUsd] = useState("15.500000");
  const [customTxId, setCustomTxId] = useState("");
  const [forcePostgresCrash, setForcePostgresCrash] = useState(false);

  // Simulation Controls & Sweeper
  const [autoSweep, setAutoSweep] = useState(true);
  const [selectedSimTab, setSelectedSimTab] = useState<"dashboard" | "db" | "audit" | "drift" | "discovery">("dashboard");
  const [workerCount, setWorkerCount] = useState(1);
  const [timeStep, setTimeStep] = useState(Date.now());

  // Edit Tenant balance modal/inputs
  const [editingTenantId, setEditingTenantId] = useState<string | null>(null);
  const [newBalance, setNewBalance] = useState("1000.000000");

  const simManager = createSimulationManager(state, setState, logMessage);

  // Hook up continuous simulation clock ticking (for lease timer countdowns and auto sweep)
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeStep(Date.now());
      if (autoSweep) {
        const swept = simManager.requeueExpiredJobs();
        if (swept > 0) {
          // notification carried inside veklomSim logMessage
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [autoSweep, state]);

  // Initial greeting logs
  useEffect(() => {
    logMessage("Veklom v1 Income Orchestrator Simulator booted successfully", "success");
    logMessage("Ready to receive FastMCP execute_governed_workflow tool requests...", "info");
    logMessage("Active Tenants initialized with exact Decimal precision configuration", "redis");
  }, []);

  // Dispatch admission
  const handleAdmissionDispatch = (e: FormEvent) => {
    e.preventDefault();
    const txId = customTxId.trim() || "tx_" + Math.random().toString(36).substring(2, 10);
    const tenant = state.tenants.find((t) => t.tenantId === activeTenantId);

    if (!tenant) return;

    try {
      simManager.executeGovernanceFlow({
        transactionId: txId,
        tenantId: activeTenantId,
        payloadIntent,
        tokenBudget,
        maxBudgetUsd,
        tenantTier: tenant.tier,
        originX: Math.floor(Math.random() * 100) - 50,
        originY: Math.floor(Math.random() * 100) - 50,
        forceDatabaseCrash: forcePostgresCrash,
      });

      // Reset transaction field
      setCustomTxId("");
    } catch (err: any) {
      logMessage(`[MCP Error Exception] ${err.message}`, "error");
    }
  };

  // Worker Action helper
  const handleWorkerLeaseNext = () => {
    const leased = simManager.leaseNextJob("worker_xray_01", 30000); // 30 second lease
    if (!leased) {
      logMessage("[Worker pool] Failed to lease job: Queue is empty or entries are already locked or throttled", "warn");
    }
  };

  const handleUpdateTenantBalance = (tenantId: string) => {
    const inputBal = parseFloat(newBalance);
    if (isNaN(inputBal) || inputBal < 0) {
      logMessage("Invalid balance amount format", "error");
      return;
    }
    // Format to 6 decimals
    const formatted = inputBal.toFixed(6);

    setState((prev) => {
      const updated = prev.tenants.map((t) => {
        if (t.tenantId === tenantId) {
          return { ...t, availableUsd: formatted };
        }
        return t;
      });
      return { ...prev, tenants: updated };
    });

    logMessage(`Updated ${tenantId} available balance to exact Decimal: $${formatted}`, "success");
    setEditingTenantId(null);
  };

  // Drift demo state
  const [driftIterations, setDriftIterations] = useState(100);
  const [driftIncrement, setDriftIncrement] = useState(0.0001);
  const [driftResult, setDriftResult] = useState<{ floatResult: number; exactResult: string; driftAmount: number } | null>(null);

  const runDriftDemo = () => {
    const demo = PreciseDecimal.demonstrateFloatDrift(driftIterations, driftIncrement);
    setDriftResult(demo);
  };

  // Discovery interactive states
  const [discoveryFormat, setDiscoveryFormat] = useState<"X402" | "ACP" | "WELL_KNOWN">("X402");
  const [copiedDoc, setCopiedDoc] = useState(false);
  const [handshakeStatus, setHandshakeStatus] = useState<"idle" | "running" | "done">("idle");
  const [handshakeLogs, setHandshakeLogs] = useState<string[]>([]);

  const runHandshakeDemo = () => {
    setHandshakeStatus("running");
    setHandshakeLogs([]);
    let step = 0;
    const logsList: string[] = [];
    const pushLog = (msg: string) => {
      logsList.push(msg);
      setHandshakeLogs([...logsList]);
    };

    const interval = setInterval(() => {
      if (step === 0) {
        pushLog(`[Client CLI] POST /api/workflows/admit (Requesting governed pipeline execution...)`);
      } else if (step === 1) {
        pushLog(`[Gateway] Intercepted by FastAPI x402_payment_gate middleware: Verifying "Authorization" receipt...`);
      } else if (step === 2) {
        pushLog(`[Gateway] Error: Receipt missing or invalid. Blocking access. Code: HTTP/1.1 402 Payment Required`);
      } else if (step === 3) {
        pushLog(`[Gateway] Header: WWW-Authenticate: x402 realm="veklom_workspace", network="base", currency="USDC", address="0x3a74772e925b54f7dad7fd95c9ba30825033f970", price="0.5"`);
      } else if (step === 4) {
        pushLog(`[Client Agent] Parsing WWW-Authenticate headers! Discovered recipient EVM address: 0x3a7477...f970 on Base.`);
      } else if (step === 5) {
        pushLog(`[Client Agent] Submitting 0.50 USDC payment transaction on Base network...`);
      } else if (step === 6) {
        pushLog(`[Blockchain] Tx confirmed! Hash: 0x4dfb7d62900351726a978f14ac61c8bebe8976a26dfab97fdd7480aee124af0b`);
      } else if (step === 7) {
        pushLog(`[Client Agent] Retrying payload admit with receipt token "0x4dfb7d62..." in Authorization header...`);
      } else if (step === 8) {
        pushLog(`[Gateway] Signature validation: SUCCESS for Base USDC prepayment to 0x3a7477...f970.`);
      } else if (step === 9) {
        pushLog(`[FastMCP Server] Job admitted! Allocation reserved successfully. Contract running.`);
        setHandshakeStatus("done");
        clearInterval(interval);
      }
      step++;
    }, 400);
  };

  // Latency & Node performance interactive state
  const [selectedPerfFilter, setSelectedPerfFilter] = useState<string>("all");
  const [hoveredJob, setHoveredJob] = useState<SimJob | null>(null);

  // Latency metrics calculations over last 100 jobs
  const last100Jobs = Object.values(state.jobs).sort((a, b) => b.createdAt - a.createdAt).slice(0, 100);
  const completedWithLatency = last100Jobs.filter((j) => j.latencyMs !== undefined);
  const overallAvgLatency =
    completedWithLatency.length > 0
      ? (completedWithLatency.reduce((acc, j) => acc + (j.latencyMs || 0), 0) / completedWithLatency.length).toFixed(1)
      : "0.0";

  // Per-node calculation statistics
  const calculatedNodeStats = ROUTE_NODES.map((node) => {
    const nodeJobs = last100Jobs.filter((j) => j.routeNodeId === node.nodeId && j.latencyMs !== undefined);
    const nodeAvg =
      nodeJobs.length > 0
        ? (nodeJobs.reduce((acc, j) => acc + (j.latencyMs || 0), 0) / nodeJobs.length).toFixed(1)
        : node.estimatedMs.toFixed(1);

    const diff = parseFloat(nodeAvg) - node.estimatedMs;
    // Nominating rating based on reference
    const rating = diff > 8 ? "DEGRADED" : diff < -3 ? "OPTIMAL" : "NOMINAL";
    return {
      ...node,
      averageMs: nodeAvg,
      count: nodeJobs.length,
      rating,
    };
  });

  return (
    <div id="state-visualizer-root" className="space-y-6">
      
      {/* Simulation tab selectors */}
      <div className="flex border-b border-[#141414] pb-px overflow-x-auto gap-1 mb-4">
        <button
          id="btn-tab-dashboard"
          onClick={() => setSelectedSimTab("dashboard")}
          className={`px-4 py-2 border-b-2 text-xs sm:text-sm font-bold uppercase tracking-wider whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
            selectedSimTab === "dashboard"
              ? "border-[#141414] text-[#141414] font-black bg-white/40"
              : "border-transparent text-[#141414]/65 hover:text-[#141414] hover:bg-[#141414]/5"
          }`}
        >
          <Activity className="h-4 w-4 shrink-0" />
          Interactive Simulator
        </button>
        <button
          id="btn-tab-db"
          onClick={() => setSelectedSimTab("db")}
          className={`px-4 py-2 border-b-2 text-xs sm:text-sm font-bold uppercase tracking-wider whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
            selectedSimTab === "db"
              ? "border-[#141414] text-[#141414] font-black bg-white/40"
              : "border-transparent text-[#141414]/65 hover:text-[#141414] hover:bg-[#141414]/5"
          }`}
        >
          <Database className="h-4 w-4 shrink-0" />
          Durable DB Tables
        </button>
        <button
          id="btn-tab-audit"
          onClick={() => setSelectedSimTab("audit")}
          className={`px-4 py-2 border-b-2 text-xs sm:text-sm font-bold uppercase tracking-wider whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
            selectedSimTab === "audit"
              ? "border-[#141414] text-[#141414] font-black bg-white/40"
              : "border-transparent text-[#141414]/65 hover:text-[#141414] hover:bg-[#141414]/5"
          }`}
        >
          <FileSpreadsheet className="h-4 w-4 shrink-0" />
          Redis Stream / Audit Block Logs
        </button>
        <button
          id="btn-tab-drift"
          onClick={() => setSelectedSimTab("drift")}
          className={`px-4 py-2 border-b-2 text-xs sm:text-sm font-bold uppercase tracking-wider whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
            selectedSimTab === "drift"
              ? "border-[#141414] text-[#141414] font-black bg-white/40"
              : "border-transparent text-[#141414]/65 hover:text-[#141414] hover:bg-[#141414]/5"
          }`}
        >
          <DollarSign className="h-4 w-4 shrink-0" />
          Money Math & Rounding Drift Demo
        </button>
        <button
          id="btn-tab-discovery"
          onClick={() => setSelectedSimTab("discovery")}
          className={`px-4 py-2 border-b-2 text-xs sm:text-sm font-bold uppercase tracking-wider whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
            selectedSimTab === "discovery"
              ? "border-[#141414] text-[#141414] font-black bg-white/40"
              : "border-transparent text-[#141414]/65 hover:text-[#141414] hover:bg-[#141414]/5"
          }`}
        >
          <Zap className="h-4 w-4 shrink-0 text-amber-500 animate-pulse" />
          Protocol Discovery Hub (X402 & ACP)
        </button>
      </div>

      {selectedSimTab === "dashboard" && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* OBSERVABILITY NODE PERFORMANCE REGISTER */}
          <div id="latency-analytics-widget" className="bg-white/40 p-5 rounded-none border border-[#141414] space-y-4 shadow-[4px_4px_0px_rgba(20,20,20,0.15)]">
            
            {/* Header section with live indicator */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#141414]/10 gap-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10B981]" />
                <h3 className="text-xs font-black text-[#141414] uppercase tracking-widest font-mono flex items-center gap-1.5 font-bold">
                  <LineChart className="h-4 w-4 text-[#141414]" />
                  Observability Plane // Node Latency Registry
                </h3>
              </div>
              <div className="text-[10px] text-[#141414]/65 font-mono bg-white/50 border border-[#141414]/15 px-2.5 py-1 rounded-none uppercase font-bold">
                ROLLING METRICS: LAST 100 TRANSACTIONS
              </div>
            </div>

            {/* Left/Right Grid - Metrics Overview vs Visual SVG Graph */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: KPI cards & Node statuses (4 cols) */}
              <div className="lg:col-span-4 flex flex-col gap-4 justify-between">
                
                {/* Rolling Net Average Card */}
                <div className="bg-white p-4 rounded-none border border-[#141414] shadow-[2px_2px_0px_rgba(20,20,20,0.1)] flex items-center justify-between">
                  <div>
                    <span className="block text-[9px] text-[#141414]/60 font-mono font-bold uppercase tracking-wider">
                      Rolling network avg
                    </span>
                    <div className="text-3xl font-black font-mono tracking-tight text-[#141414]">
                      {overallAvgLatency} <span className="text-xs font-semibold text-[#141414]/60">ms</span>
                    </div>
                  </div>
                  <div className="p-2.5 bg-[#141414] text-[#E4E3E0] rounded-none">
                    <Zap className="h-5 w-5 text-amber-400" />
                  </div>
                </div>

                {/* Real-time Route Nodes Statuses */}
                <div className="bg-white p-3.5 rounded-none border border-[#141414] shadow-[2px_2px_0px_rgba(20,20,20,0.1)] space-y-2 text-xs flex-1">
                  <span className="block text-[9px] text-[#141414]/60 font-mono font-bold uppercase tracking-wider pb-1 border-b border-[#141414]/10">
                    Routing Nodes Performance
                  </span>
                  
                  <div className="space-y-2 pt-1 font-mono text-[11px]">
                    {calculatedNodeStats.map((node) => {
                      const isFilterActive = selectedPerfFilter === node.nodeId;
                      return (
                        <div
                          key={node.nodeId}
                          onClick={() => setSelectedPerfFilter(selectedPerfFilter === node.nodeId ? "all" : node.nodeId)}
                          className={`p-2 border rounded-none cursor-pointer flex items-center justify-between transition-all ${
                            isFilterActive
                              ? "bg-[#141414] text-[#E4E3E0] border-[#141414]"
                              : "bg-[#E4E3E0]/10 hover:bg-[#E4E3E0]/40 border-[#141414]/10"
                          }`}
                        >
                          <div className="truncate pr-2">
                            <div className="font-extrabold truncate">{node.nodeId}</div>
                            <div className={`text-[9px] ${isFilterActive ? "text-white/60" : "text-slate-500"}`}>
                              Region: {node.region} • Target: {node.estimatedMs}ms
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-bold text-[12px]">{node.averageMs} ms</div>
                            <span className={`status-pill inline-block text-[8px] px-1 py-0.2 uppercase ${
                              node.rating === "OPTIMAL"
                                ? "bg-emerald-100 text-emerald-950 border-emerald-950/45 font-bold"
                                : node.rating === "NOMINAL"
                                ? "bg-blue-100 text-blue-950 border-blue-950/45 font-bold"
                                : "bg-amber-100 text-amber-950 border-amber-950/45 font-bold"
                            }`}>
                              {node.rating}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-[10px] text-center text-[#141414]/60 font-mono pt-1">
                    💡 Click a route node above to filter the timeline chart below.
                  </div>
                </div>

              </div>

              {/* Right Column: Visual SVG Graph (8 cols) */}
              <div className="lg:col-span-8 bg-white p-4 rounded-none border border-[#141414] shadow-[2px_2px_0px_rgba(20,20,20,0.1)] flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-[#141414]/70 font-mono font-bold uppercase tracking-wider">
                    Transaction Latency Timeline{" "}
                    {selectedPerfFilter !== "all" && (
                      <span className="text-indigo-800 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-none font-bold ml-1 font-mono">
                        Filter: {selectedPerfFilter}
                      </span>
                    )}
                  </span>
                  
                  <div className="flex items-center gap-1.5 text-[9px] font-mono">
                    <span className="flex items-center gap-1 font-bold">
                      <span className="w-2.5 h-2.5 rounded-none inline-block" style={{ backgroundColor: "#4F46E5" }} /> Latency
                    </span>
                    <span className="flex items-center gap-1 font-bold">
                      <span className="w-2.5 h-0.5 border-t border-dashed border-red-500 inline-block" /> Target
                    </span>
                  </div>
                </div>

                {/* SVG Canvas Area */}
                <div className="relative w-full border border-[#141414]/10 bg-[#E4E3E0]/15 p-1">
                  {(() => {
                    const chartJobs = (selectedPerfFilter === "all"
                      ? last100Jobs
                      : last100Jobs.filter(j => j.routeNodeId === selectedPerfFilter)
                    ).slice(0, 100).reverse();

                    const maxVal = Math.max(...chartJobs.map(j => j.latencyMs || 0), 120);
                    const minVal = Math.max(0, Math.min(...chartJobs.map(j => j.latencyMs || 0), 20) - 10);
                    const range = (maxVal - minVal) || 1;

                    const svgWidth = 1000;
                    const svgHeight = 150;
                    const paddingX = 40;
                    const paddingY = 25;

                    const pointsStr = chartJobs.length > 0
                      ? chartJobs
                          .map((j, i) => {
                            const x = paddingX + (i / (Math.max(1, chartJobs.length - 1))) * (svgWidth - paddingX * 2);
                            const y = svgHeight - paddingY - (((j.latencyMs || 0) - minVal) / range) * (svgHeight - paddingY * 2);
                            return `${x},${y}`;
                          })
                          .join(" ")
                      : "";

                    const getPolygonPoints = () => {
                      if (chartJobs.length === 0) return "";
                      const startPt = `${paddingX},${svgHeight - paddingY}`;
                      const endPt = `${paddingX + (chartJobs.length - 1) / (Math.max(1, chartJobs.length - 1)) * (svgWidth - paddingX * 2)},${svgHeight - paddingY}`;
                      return `${startPt} ${pointsStr} ${endPt}`;
                    };
                    const polygonPointsStr = getPolygonPoints();

                    return (
                      <>
                        <svg
                          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                          className="w-full h-auto overflow-visible select-none"
                          style={{ maxHeight: "150px" }}
                        >
                          {/* Gridlines for latency milestones */}
                          {[40, 80, 120].map((level) => {
                            if (level < minVal || level > maxVal) return null;
                            const y = svgHeight - paddingY - ((level - minVal) / range) * (svgHeight - paddingY * 2);
                            return (
                              <g key={level} className="opacity-40">
                                <line
                                  x1={paddingX}
                                  y1={y}
                                  x2={svgWidth - paddingX}
                                  y2={y}
                                  stroke="#141414"
                                  strokeWidth="1"
                                  strokeDasharray="4 4"
                                />
                                <text
                                  x={paddingX - 8}
                                  y={y + 4}
                                  textAnchor="end"
                                  className="fill-[#141414] font-mono text-[9px] font-bold"
                                >
                                  {level}ms
                                </text>
                              </g>
                            );
                          })}

                          {/* Dotted target baseline of selected node */}
                          {selectedPerfFilter !== "all" && (() => {
                            const nodeTarget = ROUTE_NODES.find(n => n.nodeId === selectedPerfFilter)?.estimatedMs || 60;
                            const targetY = svgHeight - paddingY - ((nodeTarget - minVal) / range) * (svgHeight - paddingY * 2);
                            return (
                              <line
                                x1={paddingX}
                                y1={targetY}
                                x2={svgWidth - paddingX}
                                y2={targetY}
                                stroke="#EF4444"
                                strokeWidth="1.5"
                                strokeDasharray="3 3"
                                className="opacity-75"
                              />
                            );
                          })()}

                          {/* Line & Shaded Area */}
                          {chartJobs.length > 0 && (
                            <>
                              {/* Shaded Area Polygon under the path */}
                              <polygon
                                points={polygonPointsStr}
                                fill="url(#latency-area-gradient)"
                                className="opacity-60"
                              />
                              
                              <defs>
                                <linearGradient id="latency-area-gradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.3" />
                                  <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.0" />
                                </linearGradient>
                              </defs>

                              {/* Continuous Polyline path */}
                              <polyline
                                fill="none"
                                stroke="#4F46E5"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                points={pointsStr}
                              />
                            </>
                          )}

                          {/* Interactive circles points */}
                          {chartJobs.map((job, idx) => {
                            const x = paddingX + (idx / Math.max(1, chartJobs.length - 1)) * (svgWidth - paddingX * 2);
                            const y = svgHeight - paddingY - (((job.latencyMs || 0) - minVal) / range) * (svgHeight - paddingY * 2);
                            const isHovered = hoveredJob?.jobId === job.jobId;
                            const color =
                              job.status === JobStatus.FAILED
                                ? "#EF4444"
                                : job.status === JobStatus.SUCCEEDED
                                ? "#10B981"
                                : "#4F46E5";

                            return (
                              <circle
                                key={job.jobId}
                                cx={x}
                                cy={y}
                                r={isHovered ? 8 : 4.5}
                                fill={isHovered ? "#FFFFFF" : color}
                                stroke={isHovered ? color : "#FFFFFF"}
                                strokeWidth={isHovered ? 3.5 : 1}
                                className="transition-all cursor-pointer duration-100"
                                onMouseEnter={() => setHoveredJob(job)}
                                onMouseLeave={() => setHoveredJob(null)}
                              />
                            );
                          })}
                        </svg>

                        {/* Empty state overlay for no jobs */}
                        {chartJobs.length === 0 && (
                          <div className="absolute inset-0 flex items-center justify-center text-xs text-[#141414]/50 font-mono italic">
                            No jobs under filter criteria yet. Process some transactions.
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* Interactive Tooltip Card Overlay */}
                <div className="h-10 mt-2 flex items-center justify-between text-[11px] font-mono border-t border-[#141414]/10 pt-2 text-[#141414]/85">
                  {hoveredJob ? (
                    <div className="flex flex-wrap items-center justify-between w-full gap-2 animate-fadeIn">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[#141414]">Transaction: #{hoveredJob.jobId.slice(0, 8)}</span>
                        <span className={`status-pill inline px-1.5 text-[8.5px] uppercase ${
                          hoveredJob.status === JobStatus.SUCCEEDED
                            ? "status-pill-succeeded"
                            : hoveredJob.status === JobStatus.FAILED
                            ? "status-pill-failed"
                            : "status-pill-queued"
                        }`}>
                          {hoveredJob.status}
                        </span>
                        <span className="text-[#141414]/60">• node: {hoveredJob.routeNodeId}</span>
                      </div>
                      <div className="font-black text-[#141414] bg-[#E4E3E0]/70 px-2 py-0.5 border border-[#141414]/25">
                        Latency: {hoveredJob.latencyMs} ms
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-500 italic text-center w-full">
                      Hover over any circular node coordinate point above to expand full telemetry, checksum audits, and server node performance.
                    </div>
                  )}
                </div>

              </div>

            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT: Admission Control Intake Form */}
          <div className="lg:col-span-4 bg-white/40 p-5 rounded-none border border-[#141414] space-y-4 shadow-[4px_4px_0px_rgba(20,20,20,0.15)]">
            <div className="flex items-center justify-between pb-2 border-b border-[#141414]/10">
              <h3 className="text-xs font-black text-[#141414] flex items-center gap-2 uppercase tracking-wider">
                <Server className="h-4 w-4 text-[#141414]" />
                Veklom Control Plane Intake
              </h3>
              <span className="status-pill status-pill-running">
                FAST_MCP BOUNDARY
              </span>
            </div>

            <form onSubmit={handleAdmissionDispatch} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-[#141414]/70 uppercase tracking-widest mb-1.5 font-mono">
                  Tenant Identity
                </label>
                <select
                  value={activeTenantId}
                  onChange={(e) => setActiveTenantId(e.target.value)}
                  className="w-full bg-white border border-[#141414] rounded-none px-3 py-2 text-xs text-[#141414] font-[#141414] font-bold focus:outline-none focus:ring-1 focus:ring-[#141414]"
                >
                  {state.tenants.map((t) => (
                    <option key={t.tenantId} value={t.tenantId}>
                      {t.tenantId} ({t.tier.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#141414]/70 uppercase tracking-widest mb-1.5 font-mono">
                  Intake Action Intent
                </label>
                <select
                  value={payloadIntent}
                  onChange={(e) => setPayloadIntent(e.target.value)}
                  className="w-full bg-white border border-[#141414] rounded-none px-3 py-2 text-xs text-[#141414] font-bold focus:outline-none focus:ring-1 focus:ring-[#141414]"
                >
                  <option value="aggregate_crossblock_liquidity">aggregate_crossblock_liquidity</option>
                  <option value="settle_offramp_clearing">settle_offramp_clearing</option>
                  <option value="verify_domain_compliance">verify_domain_compliance</option>
                  <option value="trigger_settlement_payout">trigger_settlement_payout</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[#141414]/70 uppercase tracking-widest mb-1.5 font-mono">
                    Token Budget Limit
                  </label>
                  <input
                    type="number"
                    value={tokenBudget}
                    onChange={(e) => setTokenBudget(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-[#141414] rounded-none px-3 py-2 text-xs text-[#141414] font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#141414]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#141414]/70 uppercase tracking-widest mb-1.5 font-mono">
                    Max Cost Budget (USD)
                  </label>
                  <input
                    type="text"
                    value={maxBudgetUsd}
                    onChange={(e) => setMaxBudgetUsd(e.target.value)}
                    className="w-full bg-white border border-[#141414] rounded-none px-3 py-2 text-xs text-[#141414] font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#141414]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#141414]/70 uppercase tracking-widest mb-1.5 font-mono">
                  Custom TX ID <span className="text-[10px] text-[#141414]/50 font-normal font-sans">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Leave empty for auto-generated UUID"
                  value={customTxId}
                  onChange={(e) => setCustomTxId(e.target.value)}
                  className="w-full bg-white border border-[#141414] rounded-none px-3 py-2 text-xs text-[#141414] font-mono focus:outline-none focus:ring-1 focus:ring-[#141414]"
                />
              </div>

              {/* Toggle to break durability pipeline */}
              <div className="p-3 bg-white border border-[#141414] rounded-none gap-2.5 flex items-start shadow-[2px_2px_0px_rgba(20,20,20,0.1)]">
                <input
                  type="checkbox"
                  id="toggle-postgres-crash"
                  checked={forcePostgresCrash}
                  onChange={(e) => setForcePostgresCrash(e.target.checked)}
                  className="mt-1 h-3.5 w-3.5 border border-[#141414] bg-white rounded-none focus:ring-0 checked:bg-[#141414] accent-[#141414] shrink-0"
                />
                <div className="text-xs space-y-1 font-sans">
                  <label htmlFor="toggle-postgres-crash" className="font-extrabold text-[#141414] cursor-pointer flex items-center gap-1 uppercase tracking-wider text-[11px] font-mono">
                    Simulate DB Intake Crash
                  </label>
                  <p className="text-[11px] text-[#141414]/85 leading-relaxed">
                    If checked, PostgreSQL will crash *after* Redis locks the money. Demonstrates the strict compensation pathway reverting balances instantly!
                  </p>
                </div>
              </div>

              <button
                type="submit"
                id="btn-dispatch-admission"
                className="w-full py-2.5 bg-[#141414] text-[#E4E3E0] font-black rounded-none text-xs uppercase tracking-wider transition-all border border-[#141414] hover:bg-[#E4E3E0] hover:text-[#141414] flex items-center justify-center gap-2 cursor-pointer shadow-[2px_2px_0px_rgba(20,20,20,0.15)]"
              >
                <PlusCircle className="h-4 w-4" />
                Dispatch Admission Job
              </button>
            </form>

            {/* Sweep Process Panel */}
            <div className="pt-4 border-t border-[#141414]/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#141414] uppercase tracking-wider">
                  Self-Healing Sweeper
                </span>
                <span className={`status-pill ${autoSweep ? "status-pill-succeeded" : "status-pill-queued"}`}>
                  {autoSweep ? "AUTO" : "MANUAL"}
                </span>
              </div>
              <p className="text-xs text-[#141414]/85 leading-relaxed font-sans">
                Periodically scans the PostgreSQL registry for jobs marked as `RUNNING` that exceeded their lease duration, resetting them back to `QUEUED`.
              </p>
              <div className="flex items-center gap-2">
                <button
                  id="btn-trigger-manual-sweep"
                  onClick={() => {
                    const quantity = simManager.requeueExpiredJobs();
                    if (quantity > 0) {
                      logMessage(`Manual sweep completed. Recovered & requeued ${quantity} expired leases.`, "success");
                    } else {
                      logMessage("Manual sweep completed: No expired running leases found", "info");
                    }
                  }}
                  className="flex-1 py-1.5 bg-white text-[#141414] font-black border border-[#141414] rounded-none text-[11px] hover:bg-[#141414]/5 transition cursor-pointer flex items-center justify-center gap-1 shadow-[2px_2px_0px_rgba(20,20,20,0.1)] font-mono"
                >
                  <RefreshCw className="h-3 w-3" />
                  Run Sweep Now
                </button>
                <button
                  id="btn-toggle-auto-sweep"
                  onClick={() => setAutoSweep(!autoSweep)}
                  className={`px-3 py-1.5 font-bold rounded-none text-[11px] border transition cursor-pointer shadow-[2px_2px_0px_rgba(20,20,20,0.1)] ${
                    autoSweep
                      ? "bg-[#141414] text-[#E4E3E0] border-[#141414]"
                      : "bg-white text-[#141414]/60 border-[#141414]/20"
                  }`}
                >
                  {autoSweep ? "Disable Auto" : "Enable Auto"}
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: Live Data Plane State Blocks (Redis & Postgres Pools) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* 1. Hot Reservation Ledger (Redis) */}
            <div className="bg-white/40 p-5 rounded-none border border-[#141414] flex flex-col gap-4 shadow-[4px_4px_0px_rgba(20,20,20,0.15)]">
              <div className="flex items-center justify-between pb-2 border-b border-[#141414]/10">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-600 animate-pulse" />
                  <h3 className="text-xs font-black text-[#141414] uppercase tracking-wider">
                    Hot Balance Plane (Simulated Redis Cache)
                  </h3>
                </div>
                <span className="status-pill status-pill-failed px-2 py-0.5 text-[9px] font-bold">
                  LUA STATE COORDINATION
                </span>
              </div>

              {/* Tenants details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {state.tenants.map((t) => (
                  <div
                    key={t.tenantId}
                    className="bg-white p-4 rounded-none border border-[#141414] relative overflow-hidden flex flex-col justify-between shadow-[2px_2px_0px_rgba(20,20,20,0.1)]"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-bold text-slate-800 truncate max-w-[130px]" title={t.tenantId}>
                          {t.tenantId}
                        </span>
                        <span className={`status-pill ${
                          t.tier === "enterprise"
                            ? "bg-purple-100 text-purple-900 border-purple-900/50"
                            : t.tier === "premium"
                            ? "bg-blue-100 text-blue-900 border-blue-900/50"
                            : "bg-slate-100 text-slate-900 border-slate-900/50"
                        }`}>
                          {t.tier}
                        </span>
                      </div>
                      
                      <div className="pt-2 text-lg font-black font-mono text-[#141414]">
                        ${t.availableUsd}
                      </div>
                      <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Available Limit</div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#141414]/10 grid grid-cols-2 gap-1 text-[10px] font-mono">
                      <div>
                        <div className="text-[9px] text-slate-500 uppercase tracking-widest">Reserved</div>
                        <div className="text-amber-700 font-bold">${t.reservedUsd}</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-slate-500 uppercase tracking-widest">Collected</div>
                        <div className="text-emerald-700 font-bold">${t.collectedUsd}</div>
                      </div>
                    </div>

                    {/* Balance Modifier adjustment */}
                    <button
                      id={`btn-adjust-balance-${t.tenantId}`}
                      onClick={() => {
                        setEditingTenantId(t.tenantId);
                        setNewBalance(parseFloat(t.availableUsd).toFixed(0));
                      }}
                      className="absolute bottom-2 right-2 p-1 text-[#141414]/55 hover:text-[#141414] hover:bg-[#141414]/5 rounded-none transition cursor-pointer border border-transparent hover:border-[#141414]/20"
                      title="Adjust Balances"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Edit Balance Popup inline inline */}
              {editingTenantId && (
                <div className="p-4 bg-[#E4E3E0] border border-[#141414] rounded-none flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn shadow-[2px_2px_0px_rgba(20,20,20,0.1)]">
                  <div className="text-xs">
                    <span className="font-bold text-[#141414]">Set available balance for {editingTenantId}: </span>
                    <p className="text-slate-700 mt-0.5">Numeric Decimal calculation will align scale to precise 6 decimals.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={newBalance}
                      onChange={(e) => setNewBalance(e.target.value)}
                      className="bg-white border border-[#141414] rounded-none px-2.5 py-1 text-xs text-[#141414] font-mono font-bold focus:outline-none w-28"
                    />
                    <button
                      id="save-balance-btn"
                      onClick={() => handleUpdateTenantBalance(editingTenantId)}
                      className="px-3 py-1 bg-[#141414] text-[#E4E3E0] border border-[#141414] rounded-none text-xs font-bold hover:bg-[#E4E3E0] hover:text-[#141414] cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingTenantId(null)}
                      className="px-2 py-1 bg-white text-[#141414]/70 hover:text-[#141414] border border-[#141414]/30 rounded-none text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Durable Jobs Queue (Postgres Queue & Active Workers) */}
            <div className="bg-white/40 p-5 rounded-none border border-[#141414] flex flex-col gap-4 shadow-[4px_4px_0px_rgba(20,20,20,0.15)]">
              <div className="flex items-center justify-between pb-2 border-b border-[#141414]/10">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-[#141414]" />
                  <h3 className="text-xs font-black text-[#141414] uppercase tracking-wider">
                    Durable Queue Buffer (Simulated Postgres Registry)
                  </h3>
                </div>
                <span className="status-pill status-pill-running px-2 py-0.5 text-[9px] font-bold">
                  SKIP LOCKED WORKER PIPELINE
                </span>
              </div>

              {/* Worker Pool Operations box */}
              <div className="bg-white p-4 rounded-none border border-[#141414] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[2px_2px_0px_rgba(20,20,20,0.1)]">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-[#141414] flex items-center gap-1.5 uppercase font-mono">
                    <span className="w-2.5 h-2.5 bg-[#00FF00] shadow-[0_0_8px_#00FF00] shrink-0" />
                    Simulated Worker Agent
                  </span>
                  <p className="text-[11px] text-[#141414]/85 leading-relaxed max-w-[430px] font-sans">
                    Simulate worker loop steps. A thread will poll Postgres using SKIP LOCKED queries inside `try_lease_next_job`, secure reservation locks, and either settle or fail back.
                  </p>
                </div>
                <button
                  id="btn-lease-job"
                  onClick={handleWorkerLeaseNext}
                  disabled={!Object.values(state.jobs).some((j) => j.status === JobStatus.QUEUED)}
                  className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-none transition-all flex items-center gap-1.5 border shrink-0 cursor-pointer shadow-[2px_2px_0px_rgba(20,20,20,0.1)] ${
                    Object.values(state.jobs).some((j) => j.status === JobStatus.QUEUED)
                      ? "bg-[#141414] text-[#E4E3E0] hover:bg-[#E4E3E0] hover:text-[#141414] border-[#141414]"
                      : "bg-white text-slate-400 border-[#141414]/15 cursor-not-allowed"
                  }`}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Acquire / Lease Job
                </button>
              </div>

              {/* Jobs List container */}
              <div className="space-y-2.5 max-h-[290px] overflow-y-auto">
                {Object.values(state.jobs).length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-500 border border-dashed border-[#141414]/30 rounded-none bg-white/20 font-mono">
                    No jobs currently on database queue. Submit an admission job above to trace the lifecycle.
                  </div>
                ) : (
                  Object.values(state.jobs).sort((a, b) => b.createdAt - a.createdAt).map((job) => {
                    const isRunning = job.status === JobStatus.RUNNING;
                    const isSucceeded = job.status === JobStatus.SUCCEEDED;
                    const isFailed = job.status === JobStatus.FAILED;
                    
                    // Expiry calculations
                    const isLeaseExpired = job.leaseExpiresAt !== null && job.leaseExpiresAt < timeStep;
                    const remainingMs = job.leaseExpiresAt !== null ? job.leaseExpiresAt - timeStep : 0;
                    const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));

                    return (
                      <div
                        key={job.jobId}
                        className={`p-4 rounded-none border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[2px_2px_0px_rgba(20,20,20,0.05)] ${
                          isRunning
                            ? isLeaseExpired
                              ? "bg-amber-100/50 border-amber-900 text-amber-950"
                              : "bg-indigo-100/40 border-indigo-905 text-indigo-950"
                            : isSucceeded
                            ? "bg-emerald-50 border-emerald-900 text-emerald-950"
                            : isFailed
                            ? "bg-red-50 border-red-900 text-red-950"
                            : "bg-white border-[#141414]/30 text-[#141414]"
                        }`}
                      >
                        {/* Left description */}
                        <div className="space-y-1.5 truncate max-w-full md:max-w-[440px]">
                          <div className="flex items-center flex-wrap gap-2">
                            <span className="text-xs font-mono font-bold">
                              Job #{job.jobId.slice(0, 8)}
                            </span>
                            <span className={`status-pill ${
                              isRunning
                                ? isLeaseExpired
                                  ? "status-pill-refunded"
                                  : "status-pill-running"
                                : isSucceeded
                                ? "status-pill-succeeded"
                                : isFailed
                                ? "status-pill-failed"
                                : "status-pill-queued"
                            }`}>
                              {isRunning && isLeaseExpired ? "EXPIRED_LEASE" : job.status}
                            </span>
                            <span className="text-[10px] text-slate-600 font-mono truncate" title={job.tenantId}>
                              • tenant_id: {job.tenantId}
                            </span>
                          </div>

                          <div className="text-xs font-mono truncate">
                            Intent: <span className="font-bold font-sans">{job.payloadIntent}</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-mono opacity-85">
                            <div>Reserved: <span className="text-amber-800 font-bold">${job.maxBudgetUsd}</span></div>
                            {job.actualAmountUsd && (
                              <div>Settled: <span className="text-emerald-800 font-bold">${job.actualAmountUsd}</span></div>
                            )}
                            <div>Attempts: <span className="font-bold">{job.attempts}/10</span></div>
                            {isRunning && !isLeaseExpired && (
                              <div className="flex items-center gap-1 font-bold">
                                <Clock className="h-3 w-3 shrink-0" />
                                Lease: <span>{remainingSec}s left</span>
                              </div>
                            )}
                            {isLeaseExpired && isRunning && (
                              <div className="flex items-center gap-1 font-bold text-amber-905 animate-pulse">
                                <AlertTriangle className="h-3 w-3 shrink-0" />
                                Lease Overdue! Requeue Candidate
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Mid controllers for active runner job */}
                        {isRunning && (
                          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0 font-sans">
                            {/* Force Success button */}
                            <button
                              id={`btn-worker-success-${job.jobId.slice(0, 8)}`}
                              onClick={() => {
                                const costFraction = (parseFloat(job.maxBudgetUsd) * (0.6 + Math.random() * 0.3)).toFixed(6);
                                try {
                                  simManager.settleJobSuccess({
                                    jobId: job.jobId,
                                    leaseToken: job.leaseToken || "",
                                    actualAmountUsd: costFraction,
                                    outputRef: "gcs://veklom_blocks/out_" + generateId() + ".json",
                                  });
                                } catch (err: any) {
                                  logMessage(`Worker action aborted: ${err.message}`, "error");
                                }
                              }}
                              className="px-2.5 py-1.5 bg-[#00FF00] hover:bg-[#00EE00] border border-[#141414] text-[#141414] text-[10px] font-black uppercase rounded-none cursor-pointer transition flex items-center gap-1 shadow-[1px_1px_0px_rgba(20,20,20,0.15)]"
                              title="Resolve queue successfully and return credit differences back to host balance"
                            >
                              <CheckCircle className="h-3.5 w-3.5 text-[#141414]" />
                              Settle (Success)
                            </button>

                            {/* Race condition simulation button */}
                            <button
                              id={`btn-worker-stale-race-${job.jobId.slice(0, 8)}`}
                              onClick={() => {
                                const oldToken = job.leaseToken || "";
                                logMessage(`[RACE TRACK] Invalidated worker A lease token. PostgreSQL now considers this lease expired...`, "warn");
                                
                                setState((prev) => {
                                  const updated = Object.fromEntries(Object.values(prev.jobs).map((j) => {
                                    if (j.jobId === job.jobId) {
                                      return [j.jobId, { ...j, leaseToken: "another-workers-token-" + generateId() }];
                                    }
                                    return [j.jobId, j];
                                  }));
                                  return { ...prev, jobs: updated };
                                });

                                logMessage(`[RACE TRACK] Worker A attempts to settle the stale lease... expecting rejection.`, "info");
                                
                                setTimeout(() => {
                                  try {
                                    simManager.settleJobSuccess({
                                      jobId: job.jobId,
                                      leaseToken: oldToken,
                                      actualAmountUsd: (parseFloat(job.maxBudgetUsd) * 0.8).toFixed(6),
                                      outputRef: "gcs://veklom_blocks/race_" + generateId() + ".json",
                                    });
                                  } catch (err: any) {
                                    logMessage(`[RACE CORRECTED] Stale Update Rejected! System safely threw '${err.message}'. No duplicate completion committed!`, "success");
                                  }
                                }, 800);
                              }}
                              className="px-2.5 py-1.5 bg-[#141414] text-[#E4E3E0] hover:bg-[#E4E3E0] hover:text-[#141414] border border-[#141414] text-[10px] font-black uppercase rounded-none cursor-pointer transition flex items-center gap-1 shadow-[1px_1px_0px_rgba(20,20,20,0.15)]"
                              title="Test stale-lease detection. Simulates a worker writing back results after lease timed out and was swept. Verifies UPDATE 1 count safety."
                            >
                              <PlusCircle className="h-3.5 w-3.5" />
                              Race Demo
                            </button>

                            {/* Fail Retry button */}
                            <button
                              id={`btn-worker-retry-fail-${job.jobId.slice(0, 8)}`}
                              onClick={() => {
                                try {
                                  simManager.settleJobFailed({
                                    jobId: job.jobId,
                                    leaseToken: job.leaseToken || "",
                                    errorCode: "TimeoutError",
                                    errorMessage: "GPU cluster latency expired. Recoverable connection dropped.",
                                    retryable: true,
                                  });
                                } catch (err: any) {
                                  logMessage(`Worker action aborted: ${err.message}`, "error");
                                }
                              }}
                              className="px-2 py-1 bg-white hover:bg-[#FF9900]/10 border border-[#141414] text-amber-955 text-[9px] font-bold uppercase rounded-none transition cursor-pointer"
                              title="Simulate network retryable failure. Holds reservation, locks job back to queue"
                            >
                              Fail (Retry)
                            </button>

                            {/* Fail Fatal button (Trigger Refund) */}
                            <button
                              id={`btn-worker-fatal-fail-${job.jobId.slice(0, 8)}`}
                              onClick={() => {
                                try {
                                  simManager.settleJobFailed({
                                    jobId: job.jobId,
                                    leaseToken: job.leaseToken || "",
                                    errorCode: "TaskInputCorruptedError",
                                    errorMessage: "CRC Checksum comparison failed. Non-retryable instruction.",
                                    retryable: false,
                                  });
                                } catch (err: any) {
                                  logMessage(`Worker action aborted: ${err.message}`, "error");
                                }
                              }}
                              className="px-2 py-1 bg-[#FF4444] text-white hover:bg-red-600 border border-[#141414] text-[9px] font-bold uppercase rounded-none transition cursor-pointer"
                              title="Simulate dramatic unrecoverable failure. Automatically terminates reservation and refunds all currency back to Available budget instantly"
                            >
                              Fail (Fatal)
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 3. Action terminal logger stream */}
            <div className="bg-white/40 p-4 rounded-none border border-[#141414] space-y-3 shadow-[4px_4px_0px_rgba(20,20,20,0.15)]">
              <div className="flex items-center justify-between pb-2 border-b border-[#141414]/10">
                <span className="text-xs font-black text-[#141414] flex items-center gap-1.5 uppercase font-mono">
                  <Terminal className="h-4 w-4 text-[#141414]" />
                  VEKLOM ENGINE LIVE TRACE STREAM
                </span>
                <button
                  onClick={() => setLogs([])}
                  className="text-[10px] text-[#141414] hover:underline transition uppercase font-mono font-bold cursor-pointer"
                >
                  Clear Console
                </button>
              </div>

              <div className="bg-[#141414] text-[#E4E3E0] p-4 rounded-none border border-[#141414] font-mono text-[11px] overflow-y-auto max-h-[170px] space-y-1.5 shadow-inner">
                {logs.length === 0 ? (
                  <div className="text-white/40 text-center py-4">
                    Idle. Dispatch transactions to stream execution.
                  </div>
                ) : (
                  logs.map((log) => {
                    const colorMap = {
                      info: "text-[#E4E3E0]",
                      success: "text-[#00FF00] font-bold",
                      warn: "text-[#FF9900] font-bold",
                      error: "text-red-400 font-bold",
                      redis: "text-[#FF9900]",
                      postgres: "text-blue-300",
                    };
                    return (
                      <div key={log.id} className="flex gap-2 font-mono">
                        <span className="text-white/30 shrink-0">[{log.timestamp}]</span>
                        <span className={colorMap[log.type]}>{log.message}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

        </div>
      </div>
    )}

      {selectedSimTab === "db" && (
        <div className="grid grid-cols-1 gap-6 bg-white/40 p-5 rounded-none border border-[#141414] shadow-[4px_4px_0px_rgba(20,20,20,0.15)]">
          <div className="flex items-center justify-between pb-2 border-b border-[#141414]/10">
            <h3 className="text-xs font-black text-[#141414] flex items-center gap-2 uppercase tracking-widest font-mono">
              <Database className="h-4 w-4 text-[#141414]" />
              PostgreSQL Schema Engine Inspector (Simulated Relation Views)
            </h3>
            <span className="status-pill status-pill-succeeded px-2.5 py-0.5 text-[9px] font-bold">
              ACID METRICS
            </span>
          </div>

          <div className="space-y-6">
            {/* Table "jobs" */}
            <div className="space-y-2 font-sans">
              <h4 className="text-xs font-bold text-[#141414] uppercase font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 bg-[#141414]" /> Table: jobs
              </h4>
              <div className="overflow-x-auto bg-white border border-[#141414] rounded-none shadow-[2px_2px_0px_rgba(20,20,20,0.1)]">
                <table className="w-full text-left font-mono text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-[#141414] text-[#E4E3E0] font-sans border-b border-[#141414]">
                      <th className="cell-header">job_id</th>
                      <th className="cell-header">tenant_id</th>
                      <th className="cell-header">reservation_id</th>
                      <th className="cell-header">status</th>
                      <th className="cell-header">token_budget</th>
                      <th className="cell-header">max_budget_usd</th>
                      <th className="cell-header">actual_amount_usd</th>
                      <th className="cell-header text-right">attempts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(state.jobs).length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-10 text-center text-slate-500 italic font-mono bg-white">
                          Table is empty. Queue some transactions!
                        </td>
                      </tr>
                    ) : (
                      Object.values(state.jobs).sort((a, b) => b.createdAt - a.createdAt).map((j) => (
                        <tr key={j.jobId} className="data-row text-[#141414] font-mono">
                          <td className="p-2 sm:p-2.5 font-bold text-indigo-900">{j.jobId.slice(0, 8)}...</td>
                          <td className="p-2 sm:p-2.5">{j.tenantId}</td>
                          <td className="p-2 sm:p-2.5 opacity-75">{j.reservationId.slice(0, 12)}...</td>
                          <td className="p-2 sm:p-2.5">
                            <span className={`status-pill ${
                              j.status === JobStatus.SUCCEEDED ? "status-pill-succeeded" :
                              j.status === JobStatus.FAILED ? "status-pill-failed" :
                              j.status === JobStatus.RUNNING ? "status-pill-running" :
                              "status-pill-queued"
                            }`}>
                              {j.status}
                            </span>
                          </td>
                          <td className="p-2 sm:p-2.5 text-right pr-6">{j.tokenBudget}</td>
                          <td className="p-2 sm:p-2.5 val-money text-amber-800">${j.maxBudgetUsd}</td>
                          <td className="p-2 sm:p-2.5 val-money text-emerald-850">
                            {j.actualAmountUsd ? `$${j.actualAmountUsd}` : "NULL"}
                          </td>
                          <td className="p-2 sm:p-2.5 text-right font-bold pr-6">{j.attempts}/10</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table "job_events" */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#141414] uppercase font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 bg-[#141414]" /> Table: job_events
              </h4>
              <div className="overflow-x-auto bg-white border border-[#141414] rounded-none shadow-[2px_2px_0px_rgba(20,20,20,0.1)]">
                <table className="w-full text-left font-mono text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-[#141414] text-[#E4E3E0] font-sans border-b border-[#141414]">
                      <th className="cell-header">event_id</th>
                      <th className="cell-header">job_id</th>
                      <th className="cell-header">event_type</th>
                      <th className="cell-header">from_status</th>
                      <th className="cell-header">to_status</th>
                      <th className="cell-header text-right">payload</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.jobEvents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-10 text-center text-slate-500 italic font-mono bg-white">
                          Table is empty. Queued actions create event logs dynamically.
                        </td>
                      </tr>
                    ) : (
                      state.jobEvents.map((e) => (
                        <tr key={e.eventId} className="data-row text-[#141414] font-mono">
                          <td className="p-2 sm:p-2.5 text-indigo-900 font-bold">{e.eventId}</td>
                          <td className="p-2 sm:p-2.5">{e.jobId.slice(0, 8)}...</td>
                          <td className="p-2 sm:p-2.5 font-bold">{e.eventType}</td>
                          <td className="p-2 sm:p-2.5 text-slate-500 font-semibold">{e.fromStatus || "NULL"}</td>
                          <td className="p-2 sm:p-2.5 text-[#141414] font-semibold">{e.toStatus || "NULL"}</td>
                          <td className="p-2 sm:p-2.5 text-right opacity-80 truncate max-w-[200px] pr-4" title={e.payload}>
                            {e.payload}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedSimTab === "audit" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
          
          {/* PostgreSQL audit_blocks table */}
          <div className="bg-white/40 p-5 rounded-none border border-[#141414] space-y-4 shadow-[4px_4px_0px_rgba(20,20,20,0.15)]">
            <div className="flex items-center justify-between pb-2 border-b border-[#141414]/10">
              <h3 className="text-xs font-black text-[#141414] flex items-center gap-2 font-mono uppercase tracking-wider">
                <Database className="h-4 w-4" />
                PG TABLE: audit_blocks
              </h3>
              <span className="status-pill status-pill-running bg-[#141414] text-[#E4E3E0] px-2 py-0.5 text-[9px] font-bold">
                AUDITED TRUTH
              </span>
            </div>

            <div className="overflow-y-auto max-h-[385px] bg-[#141414] text-[#E4E3E0] border border-[#141414] divide-y divide-white/10 rounded-none shadow-inner p-3 space-y-3">
              {state.auditBlocks.length === 0 ? (
                <div className="p-12 text-center text-xs text-white/40 italic font-mono">
                  No audit blocks emitted yet.
                </div>
              ) : (
                state.auditBlocks.map((b) => (
                  <div key={b.auditId} className="p-3 text-[11px] font-mono space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[#00FF00] font-bold">{b.auditId}</span>
                      <span className="text-white/45">
                        {new Date(b.createdAt).toISOString().split("T")[1].slice(0, 10)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-2 text-[10px]">
                      <div>
                        <span className="text-white/40">event_type:</span>{" "}
                        <span className="text-[#00FF00] font-bold uppercase">{b.eventType}</span>
                      </div>
                      <div>
                        <span className="text-white/40">job_id:</span>{" "}
                        <span className="text-white/80">{b.jobId.slice(0, 8)}...</span>
                      </div>
                      <div>
                        <span className="text-white/40">tenant_id:</span>{" "}
                        <span className="text-white/80">{b.tenantId}</span>
                      </div>
                      <div>
                        <span className="text-white/40">amount_usd:</span>{" "}
                        <span className="text-amber-400 font-bold">${b.amountUsd}</span>
                      </div>
                    </div>

                    <div className="text-[10px] bg-white/5 p-2 rounded-none text-white/70 truncate max-w-full" title={b.payloadJson}>
                      <span className="text-white/45 font-bold">payload_json:</span> {b.payloadJson}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Redis stream: 'veklom:audit_events' */}
          <div className="bg-white/40 p-5 rounded-none border border-[#141414] space-y-4 shadow-[4px_4px_0px_rgba(20,20,20,0.15)]">
            <div className="flex items-center justify-between pb-2 border-b border-[#141414]/10">
              <h3 className="text-xs font-black text-[#141414] flex items-center gap-2 font-mono uppercase tracking-wider">
                <Terminal className="h-4 w-4 text-[#141414]" />
                REDIS STREAM: veklom:audit_events
              </h3>
              <span className="status-pill status-pill-failed px-2 py-0.5 text-[9px] font-bold">
                LUA EVENTS PIPELINE (XADD)
              </span>
            </div>

            <div className="overflow-y-auto max-h-[385px] bg-[#141414] text-[#E4E3E0] border border-[#141414] divide-y divide-white/10 rounded-none shadow-inner p-3 space-y-3 font-mono">
              {state.redisStream.length === 0 ? (
                <div className="p-12 text-center text-xs text-white/40 italic font-mono">
                  Redis stream is empty. State transactions write events asynchronously.
                </div>
              ) : (
                state.redisStream.map((entry) => (
                  <div key={entry.id} className="p-3 text-[11px] font-mono space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-amber-400 font-bold">XADD ID: {entry.id}</span>
                      <span className="status-pill bg-white/10 text-[#E4E3E0] border-white/20 px-1.5 py-0.2 select-none text-[8px]">
                        STREAM ENTRY
                      </span>
                    </div>
                    <div>
                      <span className="text-white/45 font-semibold">topic: </span>
                      <span className="text-white/80">veklom:audit_events</span>
                    </div>
                    <div>
                      <span className="text-white/45 font-semibold">payload:</span>
                      <div className="mt-1 bg-white/5 p-2 rounded-none text-white/80 text-[10px] max-h-16 overflow-y-auto whitespace-pre-wrap">
                        {entry.payload}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {selectedSimTab === "drift" && (
        <div className="bg-white/40 p-5 rounded-none border border-[#141414] space-y-5 shadow-[4px_4px_0px_rgba(20,20,20,0.15)] animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-[#141414]/10">
            <h3 className="text-xs font-black text-[#141414] flex items-center gap-2 uppercase tracking-widest font-mono">
              <DollarSign className="h-4 w-4 text-[#141414]" />
              Binary Floating-Point vs Exact Decimal Verification Demo
            </h3>
            <span className="status-pill status-pill-succeeded px-2.5 py-0.5 text-[9px] font-bold">
              MONEY PRECISION DRIFT
            </span>
          </div>

          <p className="text-xs text-[#141414]/90 leading-relaxed max-w-4xl font-sans">
            Financial platforms fail when they use binary floating-point numbers (`float` in Python or `number` in Javascript) for currencies, because base-2 cannot exactly represent fractions like 0.1 or 0.0001, resulting in accumulated rounding drift in larger transaction volumes.
            Our implementation of <strong>PreciseDecimal</strong> matches PostgreSQL's database <strong>numeric(18,6)</strong> constraint end-to-end to secure exact drift-free audits. Test this behavior now:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-4 rounded-none border border-[#141414] shadow-[2px_2px_0px_rgba(20,20,20,0.1)]">
            <div>
              <label className="block text-[10px] font-bold text-[#141414]/75 uppercase tracking-wider mb-2 font-mono">
                Simulated Runs / Iterations
              </label>
              <input
                type="number"
                value={driftIterations}
                onChange={(e) => setDriftIterations(parseInt(e.target.value) || 0)}
                className="w-full bg-white border border-[#141414] rounded-none px-3 py-2 text-sm text-[#141414] font-mono focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#141414]/75 uppercase tracking-wider mb-2 font-mono">
                Increment Fractional Value
              </label>
              <select
                value={driftIncrement}
                onChange={(e) => setDriftIncrement(parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-[#141414] rounded-none px-3 py-2 text-sm text-[#141414] font-mono focus:outline-none font-bold"
              >
                <option value="0.0001">0.0001 (Micro-Settle fee fraction)</option>
                <option value="0.000001">0.000001 (Micro-Gas transaction cost)</option>
                <option value="0.05">0.05 (Standard surcharge fee)</option>
                <option value="0.1">0.10 (Standard ledger increment)</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                id="btn-run-drift-demo"
                onClick={runDriftDemo}
                className="w-full py-2 bg-[#141414] text-[#E4E3E0] font-black border border-[#141414] rounded-none text-xs uppercase tracking-wider transition hover:bg-[#141414]/90 cursor-pointer shadow-[2px_2px_0px_rgba(20,20,20,0.15)]"
              >
                Run Drift Trace
              </button>
            </div>
          </div>

          {driftResult && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fadeIn">
              <div className="p-4 rounded-none bg-red-50 border border-red-900 text-center shadow-[2px_2px_0px_rgba(20,20,20,0.05)]">
                <div className="text-[10px] font-bold text-red-900 uppercase tracking-widest font-mono">
                  Float (IEEE-754) Sum:
                </div>
                <div className="text-xl font-mono font-black text-red-600 mt-2">
                  {driftResult.floatResult}
                </div>
                <p className="text-[10px] text-red-800/85 mt-1.5 leading-normal font-sans">
                  Binary floats accumulate bits values unpredictably over repeated summations.
                </p>
              </div>

              <div className="p-4 rounded-none bg-emerald-50 border border-emerald-900 text-center shadow-[2px_2px_0px_rgba(20,20,20,0.05)]">
                <div className="text-[10px] font-bold text-emerald-900 uppercase tracking-widest font-mono">
                  Veklom PreciseDecimal Sum:
                </div>
                <div className="text-xl font-mono font-black text-emerald-700 mt-2">
                  {driftResult.exactResult}
                </div>
                <p className="text-[10px] text-emerald-800/85 mt-1.5 leading-normal font-sans">
                  Scaled integers scale base-10 precisely, matching database integrity limits.
                </p>
              </div>

              <div className="p-4 rounded-none bg-white border border-[#141414] text-center shadow-[2px_2px_0px_rgba(20,20,20,0.05)]">
                <div className="text-[10px] font-bold text-[#141414] uppercase tracking-widest font-mono">
                  Binary Float drift loss:
                </div>
                <div className="text-xl font-mono font-black text-[#141414] mt-2">
                  ${driftResult.driftAmount.toFixed(14)}
                </div>
                <p className="text-[10px] text-slate-700 mt-1.5 leading-normal font-sans font-semibold">
                  {driftResult.driftAmount > 0
                    ? `⚠️ ROUNDING DRIFT ACCUMULATED! Precision loss committed.`
                    : `No drift recorded under short iterations. Increase iterations count.`}
                </p>
              </div>
            </div>
          )}

          <div className="p-4 bg-white border border-[#141414] rounded-none space-y-2 text-xs text-[#141414]/90 shadow-[2px_2px_0px_rgba(20,20,20,0.05)]">
            <h4 className="font-bold text-[#141414] flex items-center gap-1.5 uppercase tracking-wider text-[11px] font-mono font-sans">
              <Info className="h-4 w-4 text-[#141414]" /> Why does Veklom mandate end-to-end Decimal values?
            </h4>
            <p className="leading-relaxed font-sans text-xs">
              If a client makes 1,000,000 requests of tiny payments (e.g. reserving gas fees of $0.0001), floating-point arithmetic leads to a total mismatch of many dollars between hot memory reservation balances (Redis) and durable transaction ledgers (PostgreSQL). By enforcing exact stringification and Python's <code>Decimal</code> / TypeScript scaled BigInt models, Veklom v1 ensures mathematical reconciliation down to six-digit sub-cents.
            </p>
          </div>
        </div>
      )}

      {selectedSimTab === "discovery" && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Header Banner */}
          <div className="border border-[#141414] bg-[#141414] text-[#E4E3E0] p-6 shadow-[3px_3px_0px_rgba(0,0,0,0.15)] rounded-none space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-[#E4E3E0] text-[#141414] border border-[#141414]">
                <Zap className="h-5 w-5 text-amber-500 fill-amber-500 animate-pulse" />
              </span>
              <h2 className="text-lg font-black uppercase tracking-tight">Viro-v1 Discovery Engine</h2>
            </div>
            <p className="text-xs text-[#E4E3E0]/80 font-mono leading-relaxed max-w-3xl">
              Model Context Protocol (MCP) compatible schema publishing. Enables autonomous agent routers and programmatic gateways to inspect capability configurations, parameter expectations, and ledger reconciliation endpoints.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Format Selector and Code Explorer (2 Columns) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white/80 p-4 rounded-none border border-[#141414] shadow-[3px_3px_0px_rgba(0,0,0,0.1)] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#141414]">Select Discovery Target Format</h3>
                  <p className="text-[10px] text-slate-500">Compare standardized legacy definitions against semantic agent-ready tool specs.</p>
                </div>
                <div className="flex bg-[#E4E3E0] p-1 border border-[#141414] rounded-none">
                  <button
                    onClick={() => {
                      setDiscoveryFormat("X402");
                      setCopiedDoc(false);
                    }}
                    className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition rounded-none font-bold cursor-pointer ${
                      discoveryFormat === "X402"
                        ? "bg-[#141414] text-[#E4E3E0]"
                        : "text-[#141414] hover:bg-[#141414]/10"
                    }`}
                  >
                    X402 (XML)
                  </button>
                  <button
                    onClick={() => {
                      setDiscoveryFormat("ACP");
                      setCopiedDoc(false);
                    }}
                    className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition rounded-none font-bold cursor-pointer ${
                      discoveryFormat === "ACP"
                        ? "bg-[#141414] text-[#E4E3E0]"
                        : "text-[#141414] hover:bg-[#141414]/10"
                    }`}
                  >
                    ACP (JSON)
                  </button>
                  <button
                    onClick={() => {
                      setDiscoveryFormat("WELL_KNOWN");
                      setCopiedDoc(false);
                    }}
                    className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition rounded-none font-bold cursor-pointer ${
                      discoveryFormat === "WELL_KNOWN"
                        ? "bg-[#141414] text-[#E4E3E0]"
                        : "text-[#141414] hover:bg-[#141414]/10"
                    }`}
                  >
                    .well-known/x402
                  </button>
                </div>
              </div>

              {/* Discovery Document Representation Screen */}
              <div className="bg-white border border-[#141414] shadow-[4px_4px_0px_rgba(20,20,20,0.15)] rounded-none flex flex-col">
                <div className="bg-[#141414] text-[#E4E3E0] px-4 py-3 flex items-center justify-between border-b border-[#141414]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-none bg-indigo-500" />
                    <span className="text-xs font-mono font-bold tracking-tight">
                      {discoveryFormat === "X402" 
                        ? "viro_x402_discovery.xml" 
                        : discoveryFormat === "ACP" 
                        ? "viro_acp_discovery.json" 
                        : ".well-known/x402"}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      let docText = "";
                      if (discoveryFormat === "X402") {
                        docText = `<?xml version="1.0" encoding="UTF-8"?>
<X402Discovery xmlns="https://veklom.org/protocols/x402/viro-v1.xsd" version="1.0.4">
  <ServerInfo>
    <Name>Veklom Income Orchestrator (VIRO)</Name>
    <Standard>X402-Message-Handling-System-v1</Standard>
    <Zone>EU-NORTH-WEST-1</Zone>
    <ComplianceDomain>EU</ComplianceDomain>
  </ServerInfo>
  <Capabilities>
    <Capability id="X402AdmissionPlan" type="workflow_admission">
      <Endpoint>/api/workflows/admit</Endpoint>
      <InputSchema>X402AdmissionRequest</InputSchema>
      <OutputSchema>X402AdmittedJob</OutputSchema>
    </Capability>
    <Capability id="X402PreciseReserveRegistry" type="ledger_reservation">
      <Endpoint>/api/ledger/reserve</Endpoint>
      <Precision>decimal(18,6)</Precision>
    </Capability>
    <Capability id="X402SecureAuditChain" type="audit_logging">
      <Endpoint>/api/ledger/audits</Endpoint>
      <ChecksumAlgorithm>SHA-256</ChecksumAlgorithm>
    </Capability>
  </Capabilities>
  <PaymentRequiredGate>
    <RequiredHeader>WWW-Authenticate</RequiredHeader>
    <GatewayType>x402</GatewayType>
    <Network>base</Network>
    <Asset>USDC</Asset>
    <TargetAddress>0x3a74772e925b54f7dad7fd95c9ba30825033f970</TargetAddress>
    <MinimumAmountUSD>0.50</MinimumAmountUSD>
  </PaymentRequiredGate>
  <Channels>
    <WorkflowChannel>tcp://amqp.veklom.internal:5672/workflows</WorkflowChannel>
    <LedgerChannel>tcp://redis.veklom.internal:6379/reservations</LedgerChannel>
  </Channels>
</X402Discovery>`;
                      } else if (discoveryFormat === "ACP") {
                        docText = `{
  "tools": [
    {
      "name": "execute_governed_pipeline",
      "description": "Executes the deterministic AI pipeline. NOTE: This tool requires a pre-payment of USDC on the Base network.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "payload": { "type": "string" },
          "payment_receipt": { 
            "type": "string",
            "description": "The transaction hash or cryptographic receipt proving payment to 0x3a74772e925b54f7dad7fd95c9ba30825033f970"
          }
        },
        "required": ["payload", "payment_receipt"]
      },
      "metadata": {
        "pricing": {
          "protocol": "x402",
          "network": "base",
          "currency": "USDC",
          "address": "0x3a74772e925b54f7dad7fd95c9ba30825033f970",
          "amount_per_use": "0.5"
        }
      }
    }
  ]
}`;
                      } else {
                        docText = `{
  "entity": "Veklom",
  "supported_protocols": ["x402"],
  "payment_methods": [
    {
      "network": "base",
      "asset": "USDC",
      "address": "0x3a74772e925b54f7dad7fd95c9ba30825033f970",
      "minimum_amount_usd": "0.50"
    }
  ]
}`;
                      }
                      navigator.clipboard.writeText(docText);
                      setCopiedDoc(true);
                      setTimeout(() => setCopiedDoc(false), 2000);
                    }}
                    className="px-3 py-1 bg-[#E4E3E0] text-[#141414] hover:bg-white text-[10px] font-bold font-mono tracking-wider cursor-pointer uppercase border border-[#141414]"
                  >
                    {copiedDoc ? "Copied" : "Copy Schema Code"}
                  </button>
                </div>
                
                {/* IDE Preformatted Container */}
                <div className="bg-white p-4 font-mono text-[11px] leading-relaxed text-[#141414] overflow-auto max-h-[430px] min-h-[350px] shadow-inner relative">
                  {discoveryFormat === "X402" ? (
                    <pre className="whitespace-pre">{`<?xml version="1.0" encoding="UTF-8"?>
<X402Discovery xmlns="https://veklom.org/protocols/x402/viro-v1.xsd" version="1.0.4">
  <ServerInfo>
    <Name>Veklom Income Orchestrator (VIRO)</Name>
    <Standard>X402-Message-Handling-System-v1</Standard>
    <Zone>EU-NORTH-WEST-1</Zone>
  </ServerInfo>
  <Capabilities>
    <!-- Admission plan specifies atomic entry checkpoints -->
    <Capability id="X402AdmissionPlan" type="workflow_admission">
      <Endpoint>/api/workflows/admit</Endpoint>
      <InputSchema>X402AdmissionRequest</InputSchema>
      <OutputSchema>X402AdmittedJob</OutputSchema>
    </Capability>
    <!-- Precision configuration utilizing decimal representations -->
    <Capability id="X402PreciseReserveRegistry" type="ledger_reservation">
      <Endpoint>/api/ledger/reserve</Endpoint>
      <Precision>decimal(18,6)</Precision>
    </Capability>
  </Capabilities>
  <PaymentRequiredGate>
    <RequiredHeader>WWW-Authenticate</RequiredHeader>
    <GatewayType>x402</GatewayType>
    <Network>base</Network>
    <Asset>USDC</Asset>
    <TargetAddress>0x3a74772e925b54f7dad7fd95c9ba30825033f970</TargetAddress>
    <MinimumAmountUSD>0.50</MinimumAmountUSD>
  </PaymentRequiredGate>
  <Channels>
    <WorkflowChannel>tcp://amqp.veklom.internal:5672/workflows</WorkflowChannel>
    <LedgerChannel>tcp://redis.veklom.internal:6379/reservations</LedgerChannel>
  </Channels>
</X402Discovery>`}</pre>
                  ) : discoveryFormat === "ACP" ? (
                    <pre className="whitespace-pre">{`{
  "tools": [
    {
      "name": "execute_governed_pipeline",
      "description": "Executes virtual tasks. Requires prepayment receipt string.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "payload": { "type": "string" },
          "payment_receipt": { 
            "type": "string",
            "description": "The transaction hash proving payment to 0x3a74772e925b54f7dad7fd95c9ba30825033f970"
          }
        },
        "required": ["payload", "payment_receipt"]
      },
      "metadata": {
        "pricing": {
          "protocol": "x402",
          "network": "base",
          "currency": "USDC",
          "address": "0x3a74772e925b54f7dad7fd95c9ba30825033f970",
          "amount_per_use": "0.5"
        }
      }
    }
  ]
}`}</pre>
                  ) : (
                    <pre className="whitespace-pre">{`{
  "entity": "Veklom",
  "supported_protocols": ["x402"],
  "payment_methods": [
    {
      "network": "base",
      "asset": "USDC",
      "address": "0x3a74772e925b54f7dad7fd95c9ba30825033f970",
      "minimum_amount_usd": "0.50"
    }
  ]
}`}</pre>
                  )}
                </div>
              </div>
            </div>

            {/* Target Audience Analyzer & Interactive CLI Handshake Workspace (1 Column) */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Designed For Whom Section */}
              <div className="bg-white p-5 rounded-none border border-[#141414] space-y-4 shadow-[3px_3px_0px_rgba(0,0,0,0.1)]">
                <h3 className="text-xs font-black uppercase tracking-widest text-[#141414] flex items-center gap-1.5 border-b border-[#141414] pb-2">
                  <Info className="h-4 w-4" />
                  Designed For Whom?
                </h3>
                
                <div className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <span className="inline-block px-2.5 py-0.5 bg-indigo-100 text-indigo-900 font-extrabold uppercase tracking-widest text-[9px] font-mono border border-indigo-900/10">
                      Designed For AGENTS (AIs & APIs)
                    </span>
                    <p className="text-slate-700 leading-relaxed font-sans">
                      The publishing specifications (<strong>WWW-Authenticate Header</strong> and <strong>ACP Tool Semantics</strong>) are optimized for programmatic discovery. LLMs, AI agents, copilot architectures, and internal message routing buses read these specs to understand parameter requirements, token payloads, and exact routing namespaces without human intervention.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="inline-block px-2.5 py-0.5 bg-emerald-100 text-emerald-900 font-extrabold uppercase tracking-widest text-[9px] font-mono border border-emerald-900/10">
                      Designed For HUMANS (Architects & Operators)
                    </span>
                    <p className="text-slate-700 leading-relaxed font-sans">
                      The <strong>Interactive Dashboard, Ledger Tables, and Audit logs</strong> are built for human supervisors. They let operators monitor active leases, inspect Decimal compliance, and safely verify queue safety, without getting lost in low-level code abstractions.
                    </p>
                  </div>
                </div>
              </div>

              {/* Developer Integration Code Blocks */}
              <div className="bg-white p-5 rounded-none border border-[#141414] space-y-4 shadow-[3px_3px_0px_rgba(0,0,0,0.1)]">
                <h3 className="text-xs font-black uppercase tracking-widest text-[#141414] flex items-center gap-1.5 border-b border-[#141414] pb-2">
                  <Terminal className="h-4 w-4 text-indigo-600" />
                  Integration Blueprint
                </h3>

                <div className="space-y-4">
                  {/* Python Gateway code box */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-indigo-700 font-mono">1. Python FastAPI Gateway</span>
                      <button 
                        onClick={() => {
                          const pyCode = `from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

app = FastAPI()

@app.middleware("http")
async def x402_payment_gate(request: Request, call_next):
    auth_token = request.headers.get("Authorization")
    # Custom verification logic for the prepayment receipt hash
    is_paid = auth_token and auth_token.startswith("0x") and len(auth_token) == 66

    if not is_paid:
        headers = {
            "WWW-Authenticate": (
                'x402 realm="veklom_workspace", '
                'network="base", '
                'currency="USDC", '
                'address="0x3a74772e925b54f7dad7fd95c9ba30825033f970", '
                'price="0.5"'
            )
        }
        return JSONResponse(
            status_code=402, 
            content={"error": "Agent routing blocked. x402 Payment Required."}, 
            headers=headers
        )
    return await call_next(request)`;
                          navigator.clipboard.writeText(pyCode);
                        }}
                        className="text-[9px] hover:underline font-mono text-slate-500 font-bold uppercase cursor-pointer"
                      >
                        Copy-Code
                      </button>
                    </div>
                    <div className="bg-[#141414] text-[#E4E3E0] p-2 text-[9px] font-mono leading-normal overflow-auto max-h-[140px] border border-[#141414]">
                      <pre className="whitespace-pre">{`# Python HTTP 402 Gate
headers = {
    "WWW-Authenticate": (
        'x402 realm="veklom_workspace", '
        'network="base", '
        'currency="USDC", '
        'address="0x3a74772e925b54f7dad7fd95c9ba30825033f970", '
        'price="0.5"'
    )
}`}</pre>
                    </div>
                  </div>

                  {/* Rust / MCP Schema code box */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-amber-700 font-mono">2. Rust MCP Tool Definition</span>
                      <button 
                        onClick={() => {
                          const rustCode = `use serde::{Serialize, Deserialize};
use schemars::JsonSchema;

#[derive(Serialize, Deserialize, JsonSchema, Debug)]
pub struct ExecuteGovernedPipelineArgs {
    /// Payload containing execution pipelines
    pub payload: String,
    /// Cryptographic transaction hash proving prepayment of 0.5 USDC to 0x3a74772e925b54f7dad7fd95c9ba30825033f970
    pub payment_receipt: String,
}

// In your MCP server registry definition:
// {
//   "name": "execute_governed_pipeline",
//   "description": "Executes the deterministic AI pipeline. Required: pre-payment on Base.",
//   "metadata": {
//     "pricing": {
//       "protocol": "x402",
//       "network": "base",
//       "currency": "USDC",
//       "address": "0x3a74772e925b54f7dad7fd95c9ba30825033f970"
//     }
//   }
// }`;
                          navigator.clipboard.writeText(rustCode);
                        }}
                        className="text-[9px] hover:underline font-mono text-slate-500 font-bold uppercase cursor-pointer"
                      >
                        Copy-Code
                      </button>
                    </div>
                    <div className="bg-[#141414] text-[#E4E3E0] p-2 text-[9px] font-mono leading-normal overflow-auto max-h-[140px] border border-[#141414]">
                      <pre className="whitespace-pre">{`// Rust struct schema
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct ExecuteGovernedPipelineArgs {
    pub payload: String,
    /// Base: 0x3a74772e925b54f7dad7fd95c9ba30825033f970
    pub payment_receipt: String,
}`}</pre>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Handshake Simulator */}
              <div className="bg-white p-5 rounded-none border border-[#141414] space-y-4 shadow-[3px_3px_0px_rgba(0,0,0,0.1)]">
                <div className="space-y-1">
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#141414]">Interactive Handshake</h3>
                  <p className="text-[10px] text-slate-500">Query the discovery server via custom transport protocol.</p>
                </div>

                <button
                  onClick={runHandshakeDemo}
                  disabled={handshakeStatus === "running"}
                  className="w-full py-2.5 bg-[#141414] text-[#E4E3E0] hover:bg-[#141414]/90 font-mono text-xs uppercase font-extrabold tracking-wider transition rounded-none border border-[#141414] cursor-pointer disabled:opacity-50"
                >
                  {handshakeStatus === "running" ? "Handshaking..." : `Query with ${discoveryFormat}`}
                </button>

                {/* Handshake logs */}
                {(handshakeStatus === "running" || handshakeStatus === "done") && (
                  <div className="bg-[#141414] text-[#E4E3E0] p-3 rounded-none border border-[#141414] font-mono text-[10px] leading-relaxed max-h-[220px] overflow-auto space-y-1.5 shadow-inner">
                    <div className="text-[9px] text-slate-400 border-b border-white/10 pb-1 flex items-center justify-between">
                      <span>CONSOLE TERMINAL</span>
                      <span className="text-emerald-400 animate-pulse">● ROUTING</span>
                    </div>
                    {handshakeLogs.map((logStr, i) => (
                      <div key={i} className="text-white/95 leading-normal text-[9.5px]">
                        {logStr}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>

          {/* Core Guarantees callout panel */}
          <div className="p-4 bg-amber-50 border border-amber-900 text-amber-950 rounded-none space-y-2 text-xs shadow-[2px_2px_0px_rgba(20,20,20,0.05)]">
            <h4 className="font-bold flex items-center gap-1.5 uppercase tracking-wider text-[11px] font-mono text-amber-900">
              <Lock className="h-4 w-4" /> VIRO X402 & ACP Discovery Guarantees
            </h4>
            <p className="leading-relaxed font-sans text-xs">
              Because VIRO serves precision banking flows, both <strong>X402</strong> and <strong>ACP</strong> protocols publish deterministic contracts that require zero-guess execution. Any agent calling the workflow tool must supply exact decimals, and is backed by a double-completion prevention wrapper. In case of network-side PostgreSQL transaction timeouts, memory allocations are safely restored.
            </p>
          </div>

        </div>
      )}

    </div>
  );
}

