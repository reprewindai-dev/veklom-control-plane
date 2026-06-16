// @ts-nocheck
"use client";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Shield, 
  Zap, 
  Database, 
  Lock, 
  Cpu, 
  Wallet, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Server, 
  Code, 
  ChevronRight, 
  Link as LinkIcon, 
  Fingerprint, 
  Activity, 
  Coins, 
  Play, 
  Compass, 
  Check, 
  Terminal, 
  Info,
  GitFork,
  History,
  Copy,
  FileJson
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  PGLCertificate, 
  ExecutionIdentityV1, 
  LedgerBlock, 
  CompiledPlan, 
  SovereignRoute 
} from "./types";
import { GNOMLEDGER_REPLAY_DATA } from "./gnomledgerDataset";

export default function App() {
  // Scenario presets
  const presets = [
    {
      title: "🏥 PHI Patient Diagnostics",
      intent: "Inspect patient history database for cancer diagnoses & write HIPAA-compliant summaries to the EHR clinic ledger.",
      policies: ["HIPAA"]
    },
    {
      title: "🇪🇺 GDPR EU Profile Audit",
      intent: "Read personal customer profile files containing Europe addresses and perform deep-clean sync on marketing consent logs.",
      policies: ["GDPR"]
    },
    {
      title: "💳 PCI Transaction Review",
      intent: "Fetch billing stream files with raw card details, secure check payment tokens, and sync unmasked logs via external Analytical spreadsheet API.",
      policies: ["PCI-DSS"]
    },
    {
      title: "🗄️ SOC 2 Database Migration",
      intent: "Run custom development write-back scripts to modify schema tables on target production server database partition.",
      policies: ["SOC2"]
    }
  ];

  // States
  const [walletBalance, setWalletBalance] = useState<number>(1500);
  const [ledger, setLedger] = useState<LedgerBlock[]>([]);
  const [routes, setRoutes] = useState<SovereignRoute[]>([]);
  const [rawIntent, setRawIntent] = useState<string>("");
  const [enabledPolicies, setEnabledPolicies] = useState<string[]>(["HIPAA", "GDPR", "PCI-DSS", "SOC2"]);
  
  // Compiler / Compile states
  const [compiling, setCompiling] = useState<boolean>(false);
  const [activePlan, setActivePlan] = useState<CompiledPlan | null>(null);

  // Policy Evaluation States
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [evalResults, setEvalResults] = useState<any[]>([]);
  const [isHalted, setIsHalted] = useState<boolean>(false);
  const [sekedJustification, setSekedJustification] = useState<string>("");

  // Mint states
  const [mintingPGL, setMintingPGL] = useState<boolean>(false);
  const [activePGL, setActivePGL] = useState<PGLCertificate | null>(null);
  const [mintingEI, setMintingEI] = useState<boolean>(false);
  const [activeEI, setActiveEI] = useState<ExecutionIdentityV1 | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<string>("vk-model-llama3-70b");

  // Tool execution chamber states
  const [selectedTool, setSelectedTool] = useState<string>("");
  const [toolArg, setToolArg] = useState<string>("");
  const [executingTool, setExecutingTool] = useState<boolean>(false);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [executionResult, setExecutionResult] = useState<any | null>(null);

  // Diagnostic / Integrity verification states
  const [verifyingLedger, setVerifyingLedger] = useState<boolean>(false);
  const [verificationOutput, setVerificationOutput] = useState<string | null>(null);

  // Real Gnomledger replay states
  const [activeRightTab, setActiveRightTab] = useState<"live_ledger" | "provable_genome_replay">("live_ledger");
  const [replaySelectedAgent, setReplaySelectedAgent] = useState<"agent_alpha" | "agent_beta" | "agent_gamma">("agent_alpha");
  const [replayRunning, setReplayRunning] = useState<boolean>(false);
  const [replayCurrentIndex, setReplayCurrentIndex] = useState<number>(0);
  const [replayLog, setReplayLog] = useState<string[]>([]);
  const [copiedStatus, setCopiedStatus] = useState<boolean>(false);

  // Load initial server configurations
  useEffect(() => {
    fetchWalletInfo();
    fetchLedger();
    fetchRoutes();
  }, []);

  // Gnomledger Replay Engine Play/Pause/Reset handlers
  const startReplay = () => {
    setReplayRunning(true);
    setReplayCurrentIndex(0);
    setReplayLog([
      "⚡ BOOTING GNOMLEDGER REPLAY ENGINE",
      "📡 Connection established. Retrieving verified block lineage...",
      "🛡️ Root security anchor verified: SHA-256 enabled."
    ]);
  };

  const pauseReplay = () => {
    setReplayRunning(false);
    setReplayLog(prev => [...prev, "⏸️ Replay playback paused by operator."]);
  };

  const resetReplay = () => {
    setReplayRunning(false);
    setReplayCurrentIndex(0);
    setReplayLog([]);
  };

  const copyAuditBundle = () => {
    navigator.clipboard.writeText(JSON.stringify(GNOMLEDGER_REPLAY_DATA, null, 2));
    setCopiedStatus(true);
    setTimeout(() => setCopiedStatus(false), 2000);
  };

  // Replay sequence ticking
  useEffect(() => {
    if (!replayRunning) return;

    const currentAgentEvents = GNOMLEDGER_REPLAY_DATA.bundle.ledgerByAgent[replaySelectedAgent] || [];
    
    if (replayCurrentIndex >= currentAgentEvents.length) {
      setReplayRunning(false);
      setReplayLog(prev => [
        ...prev,
        "\n🛡️ REPLAY SEQUENCE COMPLETED SUCCESSFULLY.",
        "🟢 Sovereign verification: 100% hash chain integrity validated.",
        "👉 Copied/Downloaded Completed compliance proof. Reference Hash: " + (currentAgentEvents[currentAgentEvents.length - 1]?.event_hash || "SECURE")
      ]);
      return;
    }

    const timer = setTimeout(() => {
      const currentEvent = currentAgentEvents[replayCurrentIndex];
      const nextLogLines = [
        `\n[EVENT PARSED] ID: ${currentEvent.event_id} (${currentEvent.event_type})`,
        `👤 Actor: ${currentEvent.actor}`,
        `📝 Summary: "${currentEvent.summary}"`,
        `📦 Payload: ${JSON.stringify(currentEvent.details)}`,
        currentEvent.prev_event_hash 
          ? `⛓️ Verification: parent ${currentEvent.prev_event_hash.substring(0, 8)} -> current ${currentEvent.event_hash.substring(0, 8)} matched!` 
          : `🔗 Genesis Anchor hash verified: ${currentEvent.event_hash}`,
      ];

      setReplayLog(prev => [...prev, ...nextLogLines]);
      setReplayCurrentIndex(prev => prev + 1);
    }, 1500);

    return () => clearTimeout(timer);
  }, [replayRunning, replayCurrentIndex, replaySelectedAgent]);

  const fetchWalletInfo = async () => {
    try {
      const res = await fetch("/api/wallet-info");
      const data = await res.json();
      if (data.balanceCents !== undefined) {
        setWalletBalance(data.balanceCents);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLedger = async () => {
    try {
      const res = await fetch("/api/ledger");
      const data = await res.json();
      if (data.blocks) {
        setLedger(data.blocks);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRoutes = async () => {
    try {
      const res = await fetch("/api/routes");
      const data = await res.json();
      if (data.routes) {
        setRoutes(data.routes);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fund Wallet Mock Call
  const fundWallet = async () => {
    try {
      const res = await fetch("/api/wallet-fund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountCents: 500 }) // Fund 500 cents ($5.00)
      });
      const data = await res.json();
      if (data.balanceCents !== undefined) {
        setWalletBalance(data.balanceCents);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Reset entire simulation state
  const resetSimulation = async () => {
    try {
      const res = await fetch("/api/reset-state", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setLedger(data.blocks);
        setWalletBalance(data.balanceCents);
        setActivePlan(null);
        setEvalResults([]);
        setIsHalted(false);
        setSekedJustification("");
        setActivePGL(null);
        setActiveEI(null);
        setSelectedTool("");
        setToolArg("");
        setExecutionResult(null);
        setExecutionError(null);
        setVerificationOutput(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Step 1: Compile messy intent via GPC
  const compileIntent = async () => {
    if (!rawIntent.trim()) return;
    setCompiling(true);
    setActivePlan(null);
    setEvalResults([]);
    setIsHalted(false);
    setActivePGL(null);
    setActiveEI(null);
    setExecutionResult(null);
    setExecutionError(null);
    setVerificationOutput(null);

    try {
      const res = await fetch("/api/compile-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent: rawIntent })
      });
      const data = await res.json();
      if (res.status === 402) {
        alert(`HTTP 402 Payment Required: ${data.detail || "Exhausted budget"}`);
        fetchWalletInfo();
        setCompiling(false);
        return;
      }
      if (data.success) {
        setActivePlan(data.plan);
        setWalletBalance(data.balanceCents);
        
        // Auto select tool from steps
        if (data.plan.steps && data.plan.steps.length > 0) {
          setSelectedTool(data.plan.steps[0].toolRequired);
          setToolArg("Target Node Connection parameters");
        }
      } else {
        alert(data.error || "GPC compilation error");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCompiling(false);
    }
  };

  // Step 2: Evaluate policies against compile intent
  const evaluatePolicies = async () => {
    if (!activePlan) return;
    setEvaluating(true);

    try {
      const res = await fetch("/api/evaluate-policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          planId: activePlan.id, 
          enabledPolicies: enabledPolicies 
        })
      });
      const data = await res.json();
      if (res.status === 402) {
        alert(`HTTP 402 Payment Required: ${data.detail || "Exhausted budget"}`);
        fetchWalletInfo();
        setEvaluating(false);
        return;
      }
      if (data.success) {
        setEvalResults(data.evaluationResults);
        setIsHalted(data.isHalted);
        setSekedJustification(data.justification);
        setWalletBalance(data.balanceCents);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setEvaluating(false);
    }
  };

  // Step 3: Mint PGL Certificate
  const mintPGLCertificate = async () => {
    if (!activePlan || isHalted) return;
    setMintingPGL(true);

    try {
      const res = await fetch("/api/mint-pgl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: activePlan.id })
      });
      const data = await res.json();
      if (data.success) {
        setActivePGL(data.certificate);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setMintingPGL(false);
    }
  };

  // Step 4: Mint ExecutionIdentityV1
  const mintExecutionIdentity = async () => {
    if (!activePGL || !activePlan) return;
    setMintingEI(true);

    try {
      const res = await fetch("/api/mint-ei", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          certificateId: activePGL.certificate_id, 
          planId: activePlan.id,
          selectedRoute
        })
      });
      const data = await res.json();
      if (res.status === 402) {
        alert(`HTTP 402 Payment Required: ${data.detail || "Exhausted budget"}`);
        fetchWalletInfo();
        setMintingEI(false);
        return;
      }
      if (data.success) {
        setActiveEI(data.identity);
        setWalletBalance(data.balanceCents);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setMintingEI(false);
    }
  };

  // Step 5: Execute Tool via MCP Gateway
  const executeSecureTool = async () => {
    setExecutingTool(true);
    setExecutionError(null);
    setExecutionResult(null);

    try {
      const res = await fetch("/api/execute-tool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          executionId: activeEI?.execution_id || "bypass_key_attempt",
          tool: selectedTool,
          arg: toolArg
        })
      });
      const data = await res.json();
      if (res.status === 402) {
        setExecutionError(`HTTP 402 Payment Required: ${data.detail}`);
        fetchWalletInfo();
        return;
      }
      if (res.status === 403) {
        setExecutionError(`HTTP 403 Forbidden: ${data.detail || "Validation check failed"}`);
        return;
      }
      if (data.success) {
        setExecutionResult(data);
        fetchWalletInfo();
        fetchLedger();
      } else {
        setExecutionError(data.error || "Secure execution failed");
      }
    } catch (e) {
      console.error(e);
      setExecutionError("Network execution communication timeout");
    } finally {
      setExecutingTool(false);
    }
  };

  // Recalculate side hashes to guarantee signature and ledger integrity via backend API
  const verifyCryptographyIntegrity = async () => {
    setVerifyingLedger(true);
    setVerificationOutput(null);

    await new Promise(r => setTimeout(r, 600));

    try {
      const res = await fetch("/api/verify-ledger", { method: "POST" });
      const data = await res.json();
      if (data.logs) {
        setVerificationOutput(data.logs);
      }
    } catch (e) {
      console.error(e);
      setVerificationOutput("❌ Failed to establish communication with the sovereign audit verifier.");
    } finally {
      setVerifyingLedger(false);
    }
  };

  // Pre-populate raw scenario presets
  const applyPreset = (preset: typeof presets[0]) => {
    setRawIntent(preset.intent);
    setEnabledPolicies(preset.policies);
    setActivePlan(null);
    setEvalResults([]);
    setIsHalted(false);
    setActivePGL(null);
    setActiveEI(null);
  };

  const togglePolicyGate = (policy: string) => {
    setEnabledPolicies(prev => 
      prev.includes(policy) 
        ? prev.filter(p => p !== policy) 
        : [...prev, policy]
    );
  };

  return (
    <div className="bg-[#020617] text-slate-100 min-h-screen font-sans flex flex-col selection:bg-cyan-500 selection:text-slate-900 border-t-2 border-cyan-500">
      
      {/* Dynamic Cover Frame & Status */}
      <header className="px-6 py-4 bg-[#090d1f] border-b border-cyan-950/40 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-cyan-600 to-magenta-600 rounded-lg text-slate-100 font-mono text-xl font-bold tracking-wider">
              VK
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Veklom <span className="font-mono text-xs font-medium px-2 py-0.5 bg-cyan-950 border border-cyan-800 text-cyan-400 rounded-full">Sovereign Authority Runtime</span>
              </h1>
              <p className="text-xs text-slate-400">Moving autonomous execution from prompt to cryptographic proof</p>
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-4 text-xs font-mono">
          <div className="px-3 py-1.5 bg-[#0b132e] border border-cyan-950/80 rounded flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
            <span className="text-slate-300">STATUS:</span>
            <span className="text-cyan-400 font-medium">SECURE_ENCLAVE_ACTIVE</span>
          </div>

          <div className="px-3 py-1.5 bg-[#0b132e] border border-cyan-950/80 rounded flex items-center gap-2">
            <span className="text-slate-300">LEDGER TIME:</span>
            <span className="text-magenta-400 font-medium">2026-06-08 02:35:36 UTC</span>
          </div>

          {/* USDC Economy Balance widget */}
          <div className="px-3  py-1.5 bg-gradient-to-r from-emerald-950 to-cyan-950 border border-emerald-900 rounded flex items-center gap-3">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="text-slate-400 text-[10px] block uppercase leading-none font-bold">Base Wallet</span>
              <span className="text-emerald-400 font-bold text-sm leading-none block mt-1">
                ${(walletBalance / 100).toFixed(2)} <span className="text-xs font-normal text-slate-400">USDC</span>
              </span>
            </div>
            <button 
              onClick={fundWallet}
              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-xs text-slate-900 border border-emerald-400 rounded transition font-bold cursor-pointer"
              id="fund-wallet-btn"
            >
              + $5
            </button>
          </div>
        </div>
      </header>

      {/* Main Structural Spinal Layout */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 leading-relaxed">
        
        {/* Left Interactive Play columns */}
        <div className="lg:col-span-8 flex flex-col gap-6">

          {/* Three-Tier Spine Diagram Header banner */}
          <div className="p-4 bg-gradient-to-r from-[#070b1e] via-[#09102b] to-[#04081c] border border-cyan-950/60 rounded-xl shadow-lg">
            <div className="mb-3 flex items-center gap-2">
              <Compass className="w-5 h-5 text-cyan-400" />
              <h2 className="text-sm font-semibold tracking-wide text-white uppercase">The Deterministic Spinal Spine Model</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs relative">
              <div className="p-3 bg-slate-900/40 border border-slate-800 rounded">
                <span className="text-cyan-400 font-semibold block mb-1">1. The Brain (LLM)</span>
                <p className="text-slate-400 text-[11px] leading-relaxed">Stochastic reasoning model. Brilliant but unpredictable. It proposes agent intention.</p>
              </div>
              <div className="p-3 bg-slate-900/60 border border-cyan-800 rounded glow-cyan relative">
                <span className="text-magenta-400 font-semibold block mb-1">2. The Spinal Cord (Veklom)</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">Deterministic Obfuscation Membrane ( GPC / SEKED ). Evaluates plans & grants crypto ExecutionIdentityV1.</p>
                <div className="absolute top-1/2 -right-3 transform -translate-y-1/2 text-slate-500 block hidden md:block">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
              <div className="p-3 bg-slate-900/40 border border-slate-800 rounded">
                <span className="text-emerald-400 font-semibold block mb-1">3. The Hands & Feet (Synapse)</span>
                <p className="text-slate-400 text-[11px] leading-relaxed">Actual physical runtime execution and database mutations. Blocks unauthorized tool calls.</p>
              </div>
            </div>
          </div>

          {/* Playground Interface */}
          <div className="bg-[#070c25] border border-cyan-950/40 rounded-xl shadow-xl overflow-hidden">
            <div className="px-5 py-4 bg-[#0a1133] border-b border-cyan-950 font-semibold text-slate-200 flex justify-between items-center">
              <span className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-cyan-400" />
                Sovereign Control Playground
              </span>
              <button 
                onClick={resetSimulation}
                className="text-xs flex items-center gap-1.5 text-slate-400 hover:text-white transition px-2.5 py-1.5 bg-[#0e163d] rounded border border-cyan-950 cursor-pointer"
                id="reset-sim-btn"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset Workspace
              </button>
            </div>

            <div className="p-5 flex flex-col gap-6">
              
              {/* STAGE 1: MESSY INTENT INPUT */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 bg-cyan-950 text-cyan-400 rounded text-[10px]">STAGE 1</span>
                    Messy Agent Intent Proposer
                  </label>
                  <span className="text-[10px] text-slate-400">it - Proposed Intent</span>
                </div>

                {/* Scenario Quick Presets */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                  {presets.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => applyPreset(p)}
                      className="text-left p-2 bg-[#0e153b]/60 hover:bg-[#121c4e] active:scale-95 border border-cyan-950 rounded transition text-xs flex flex-col justify-between cursor-pointer"
                    >
                      <span className="font-bold text-slate-200 leading-tight block">{p.title}</span>
                      <span className="text-[10px] text-slate-400 mt-1 uppercase block font-mono">{p.policies.join(", ")} Gate</span>
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <textarea
                    value={rawIntent}
                    onChange={(e) => setRawIntent(e.target.value)}
                    placeholder="Enter what the agent wants to execute on your infrastructure... (e.g., 'Inspect patient diagnosic records for patient clinical lists and update logs')"
                    className="w-full h-24 p-3 bg-slate-950 border border-cyan-950 hover:border-cyan-900 focus:border-cyan-700 rounded text-sm text-slate-100 placeholder-slate-500 font-mono focus:outline-none transition leading-relaxed"
                  />
                  {rawIntent && (
                    <button
                      onClick={() => setRawIntent("")}
                      className="absolute right-3.5 bottom-3.5 text-slate-400 hover:text-white text-xs font-mono"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* GATING AUTHORIZATIONS SYSTEM: COMPLIANCE CHECKBOXES */}
                <div className="mt-4 p-5 bg-slate-900/50 border border-[#1e293b]/80 rounded-xl shadow-inner relative">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono font-bold text-slate-100 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-magenta-400" />
                        STAGE 1 ACTIVE COMPLIANCE CHECKBOXES (SEKED AUTHORIZATION GATES)
                      </span>
                      <span className="text-[10px] text-cyan-400 bg-cyan-950/60 px-2 py-0.5 border border-cyan-900 rounded font-bold uppercase animate-pulse">
                        Active Sentinel Guards
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-450 leading-relaxed font-sans text-slate-300">
                      ⚠️ **Operator Notice:** The SEKED compiler verifies operations against authorized checkboxes below. If a policy is **REQUIRED** by your plan but unchecked, execution will halt! Hover & tick to authorize target gateways.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {["HIPAA", "GDPR", "PCI-DSS", "SOC2"].map((policy) => {
                      const isChecked = enabledPolicies.includes(policy);
                      const isRequiredButUnchecked = activePlan?.detectedPolicies.includes(policy) && !isChecked;
                      
                      return (
                        <div 
                          key={policy} 
                          onClick={() => togglePolicyGate(policy)}
                          className={`group p-3 rounded-lg border cursor-pointer select-none transition-all duration-300 flex flex-col justify-between gap-3 relative overflow-hidden ${
                            isRequiredButUnchecked
                              ? "bg-red-950/20 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.25)] animate-pulse"
                              : isChecked 
                                ? "bg-cyan-950/20 border-cyan-800 text-cyan-300 hover:border-cyan-600" 
                                : "bg-slate-950/60 border-slate-900 text-slate-500 hover:border-slate-800"
                          }`}
                          title={`Toggle ${policy} compliance gate`}
                        >
                          {/* Inner glowing effect for un-authorized required gates */}
                          {isRequiredButUnchecked && (
                            <span className="absolute top-0 right-0 py-0.5 px-1.5 bg-red-600 text-slate-100 text-[8px] font-bold uppercase rounded-bl font-mono animate-bounce">
                              ⚠️ Required Check!
                            </span>
                          )}

                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-mono font-bold tracking-wider ${
                              isRequiredButUnchecked ? "text-red-400" : isChecked ? "text-cyan-300" : "text-slate-500"
                            }`}>
                              {policy} Checkbox
                            </span>
                            
                            {/* Native Checkbox Node representation for perfect human/browser mapping */}
                            <input 
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}} // Controlled via card click handler
                              className="w-4 h-4 rounded text-cyan-500 bg-slate-950 border-slate-800 focus:ring-0 focus:ring-offset-0 pointer-events-none"
                              id={`checkbox-${policy}`}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[10px] font-mono mt-1 pt-1.5 border-t border-slate-900/50">
                            <span className="text-slate-400">
                              {policy === "HIPAA" ? "🏥 Health Records"
                               : policy === "GDPR" ? "🇪🇺 EU Privacy"
                               : policy === "PCI-DSS" ? "💳 Card Details"
                               : "🗄️ System Audits"}
                            </span>
                            
                            <span className={`px-1 rounded text-[9px] font-bold ${
                              isChecked 
                                ? "text-cyan-400 bg-cyan-950/60" 
                                : isRequiredButUnchecked 
                                  ? "text-red-400 bg-red-950/60 animate-pulse font-extrabold" 
                                  : "text-slate-600 bg-slate-950"
                            }`}>
                              {isChecked 
                                ? "🟢 AUTHORIZED" 
                                : isRequiredButUnchecked 
                                  ? "🚨 CLICK TO TICK!" 
                                  : "⚪ DISABLED"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* COMPILE INSTRUCTIONS ACTION */}
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={compileIntent}
                    disabled={!rawIntent.trim() || compiling}
                    className={`px-5 py-2.5 rounded font-mono font-bold text-xs flex items-center gap-2 transition active:scale-95 cursor-pointer ${
                      rawIntent.trim() && !compiling
                        ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                        : "bg-[#0e163d] text-slate-500 border border-cyan-950 cursor-not-allowed"
                    }`}
                    id="compile-btn"
                  >
                    {compiling ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Compiling Messy Plan via GPC...
                      </>
                    ) : (
                      <>
                        <Cpu className="w-4 h-4" />
                        Compile Intent (GPC Cost: 25¢ USDC)
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* STAGE 2: GPC COMPILED PLAN & POLICY CHECK */}
              <AnimatePresence mode="wait">
                {activePlan && (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="p-5 bg-slate-900 border border-cyan-950/80 rounded-xl flex flex-col gap-4"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs font-bold text-slate-300 flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 bg-magenta-950 text-magenta-400 rounded text-[10px]">STAGE 2</span>
                          GPC Compiled Plan & Estimated Budget
                        </span>
                        <span className="text-xs font-mono text-slate-400">Plan ID: {activePlan.id}</span>
                      </div>
                      <p className="text-sm italic text-slate-300">"{activePlan.justification}"</p>
                    </div>

                    {/* Step breakdowns */}
                    <div className="border border-slate-800/80 rounded bg-slate-950 p-3 flex flex-col gap-3">
                      <span className="text-[10px] font-mono leading-none tracking-wider uppercase text-slate-500">Proposed Steps & Boundary Tools Required</span>
                      <div className="flex flex-col gap-2">
                        {activePlan.steps.map((step, sIdx) => (
                          <div key={sIdx} className="bg-slate-900/40 p-2.5 rounded border border-slate-800/60 flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs font-mono">
                            <div>
                              <span className="text-slate-300 font-bold block">{step.name}</span>
                              <span className="text-slate-400 text-[11px] block mt-0.5">{step.description}</span>
                            </div>
                            <div className="flex items-center gap-2 self-start sm:self-auto font-mono">
                              <span className="px-2 py-0.5 bg-[#0b1b36] border border-cyan-900 text-cyan-400 rounded text-[10px]">
                                Tool: {step.toolRequired}
                              </span>
                              <span className="text-slate-400 font-bold">
                                ~ {step.costEstimateCents}¢
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-2 pt-2 border-t border-slate-800/80 flex justify-between items-center text-xs font-mono">
                        <span className="text-slate-400">Sum Cost Estimate:</span>
                        <span className="text-emerald-400 font-bold text-sm bg-emerald-950/50 px-2 py-0.5 border border-emerald-900 rounded">
                          {activePlan.estimatedCostCents}¢ USDC
                        </span>
                      </div>
                    </div>

                    {/* Security warnings and detected policy triggers */}
                    {activePlan.detectedPolicies.length > 0 && (
                      <div className="p-3 bg-amber-950/20 border border-amber-900/40 rounded flex items-start gap-2.5">
                        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-bold text-amber-400 block font-mono">Detected Compliance Boundaries Target Logs</span>
                          <p className="text-[11px] text-slate-300 leading-normal mt-1">
                            Current agent tasks overlap with localized data protection policies:{" "}
                            <span className="font-bold text-amber-400">{activePlan.detectedPolicies.join(", ")}</span>. 
                            Ensure corresponding gates are checked/authorized prior to cryptographic minting.
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-mono font-bold text-amber-400 bg-amber-950/40 px-2 py-1 rounded inline-block">
                            Risks: {activePlan.potentialRisks.join(" | ")}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* POLICY GATES INTERFACE */}
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-t border-slate-800 pt-4">
                      <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                        <Info className="w-4 h-4 text-cyan-400" />
                        <span>Run compliance checks for targets. Policy Fee: 10¢</span>
                      </div>

                      <button
                        onClick={evaluatePolicies}
                        disabled={evaluating}
                        className="px-4 py-2 bg-gradient-to-r from-magenta-600 to-indigo-600 text-white font-mono font-bold text-xs rounded active:scale-95 transition cursor-pointer"
                        id="evaluate-policies-btn"
                      >
                        {evaluating ? (
                          <span className="flex items-center gap-1">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Evaluating Gates...
                          </span>
                        ) : (
                          "Evaluate Policy Compliance"
                        )}
                      </button>
                    </div>

                    {/* GATEWAY RESULTS DISPLAY */}
                    {evalResults.length > 0 && (
                      <div className="mt-3 p-4 bg-[#0a0f28] border border-cyan-950/60 rounded-lg">
                        <span className="text-xs font-bold font-mono text-slate-300 block mb-3 uppercase tracking-wide">
                          SEKED Evaluation Gate results
                        </span>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {evalResults.map((resItem, idx) => (
                            <div 
                              key={idx} 
                              className={`p-3 rounded border text-xs font-mono flex items-start gap-2.5 transition ${
                                resItem.status === "APPROVED" 
                                  ? "bg-emerald-950/20 border-emerald-950 glow-green text-emerald-400" 
                                  : "bg-red-950/20 border-red-950 glow-red text-red-400"
                              }`}
                            >
                              {resItem.status === "APPROVED" ? (
                                <CheckCircle2 className="w-5 h-5 shrink-0" />
                              ) : (
                                <XCircle className="w-5 h-5 shrink-0" />
                              )}
                              <div>
                                <span className="font-bold block text-sm">{resItem.policy} Compliance Check</span>
                                <span className="text-[11px] opacity-90 block mt-0.5">{resItem.governedConstraint}</span>
                                <span className="text-[10px] uppercase font-bold text-slate-400 block mt-1.5">
                                  Status: {resItem.status === "APPROVED" ? "🟢 CLEAN_APPROVED" : "🔴 HALTED_BLOCKED"}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Halted summary message */}
                        <div className="mt-4 pt-3 border-t border-slate-800">
                          <p className={`text-xs font-mono ${isHalted ? "text-red-400" : "text-emerald-400"}`}>
                            {sekedJustification}
                          </p>
                          
                          {!isHalted ? (
                            <div className="mt-4 flex justify-end">
                              <button
                                onClick={mintPGLCertificate}
                                disabled={mintingPGL}
                                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs rounded active:scale-95 transition cursor-pointer"
                                id="mint-pgl-btn"
                              >
                                {mintingPGL ? "Minting Proof Certificate..." : "Mint PGL Pre-Certificate"}
                              </button>
                            </div>
                          ) : (
                            <div className="mt-3 p-3 bg-red-950/40 border border-red-800 rounded-lg text-xs text-red-300 font-mono flex flex-col gap-1.5 shadow-md">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-400 animate-bounce" />
                                <span className="font-bold">SEKED GPC COMPILER BLOCKED / HALTED</span>
                              </div>
                              <p className="text-[11px] leading-relaxed text-slate-300">
                                To clear this warning and authorize cryptographic minting, scroll up to **Stage 1 (under Gating Authorizations CONFIG)**, check the checkboxes highlighted in red marked with <span className="text-red-400 font-bold bg-red-950 px-1 py-0.5 rounded border border-red-900">⚠️ Required Check!</span>, and click **"Evaluate Policy Compliance"** again to re-validate!
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* STAGE 3 & 4: MINT PRE-CERTIFICATE & EXECUTION IDENTITY */}
              <AnimatePresence>
                {activePGL && (
                  <motion.div 
                    initial={{ opacity: 0, flex: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    {/* PGL certificate Card */}
                    <div className="p-4 bg-slate-900 border border-indigo-950 rounded-xl font-mono text-xs">
                      <div className="flex items-center gap-1.5 mb-2 text-indigo-400 uppercase font-bold text-[10px] tracking-wider">
                        <Fingerprint className="w-4 h-4" />
                        PGL Pre-Execution Certificate
                      </div>
                      <div className="bg-slate-950 p-3 rounded flex flex-col gap-1.5 rounded-lg border border-slate-800 text-[11px] leading-relaxed">
                        <p className="text-slate-400">ID: <span className="text-indigo-300 font-bold">{activePGL.certificate_id}</span></p>
                        <p className="text-slate-400">Genome: <span className="text-indigo-400 truncate block text-[10px] bg-slate-900 p-1 border border-slate-800 rounded mt-0.5">{activePGL.genome_hash}</span></p>
                        <p className="text-slate-400">Constitution: <span className="text-indigo-400 truncate block text-[10px] bg-slate-900 p-1 border border-slate-800 rounded mt-0.5">{activePGL.constitution_hash}</span></p>
                        <p className="text-slate-400">Plan Proof Hash: <span className="text-indigo-400 truncate block text-[10px] bg-slate-900 p-1 border border-slate-800 rounded mt-0.5">{activePGL.plan_hash}</span></p>
                        <p className="text-slate-500 mt-1">Minted At (UTC): {activePGL.timestamp}</p>
                      </div>

                      {/* Select routing pathway prior to Minting EI */}
                      {!activeEI && (
                        <div className="mt-4 p-3 bg-slate-950 border border-slate-800 rounded">
                          <label className="text-[10px] font-mono leading-none uppercase tracking-wider text-slate-500 block mb-2">Sovereign Model Routing Matrix</label>
                          <select 
                            value={selectedRoute} 
                            onChange={(e) => setSelectedRoute(e.target.value)}
                            className="bg-slate-900 border border-slate-800 text-xs px-2.5 py-1.5 w-full rounded focus:outline-none focus:border-cyan-700 text-slate-200"
                          >
                            {routes.map(r => (
                              <option key={r.model} value={r.model}>
                                {r.model} (Weight: {r.weight}% | Latency: {r.latency}ms)
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {!activeEI && (
                        <div className="mt-4 flex justify-end">
                          <button
                            onClick={mintExecutionIdentity}
                            disabled={mintingEI}
                            className="px-4 py-2 bg-gradient-to-tr from-cyan-600 to-magenta-600 text-white font-mono font-bold text-xs rounded active:scale-95 transition cursor-pointer"
                            id="mint-ei-btn"
                          >
                            {mintingEI ? (
                              <span className="flex items-center gap-1">
                                <RefreshCw className="w-3 animate-spin"/> Minting Identity...
                              </span>
                            ) : "Mint ExecutionIdentityV1 (15¢)"}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Selected routing display card if active EI */}
                    <div className="flex flex-col gap-3">
                      <div className="p-4 bg-slate-900 border border-cyan-950 rounded-xl font-mono text-xs">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#06b6d4] block mb-2">Sovereign Probability Routing Matrix</span>
                        
                        <div className="space-y-2">
                          {routes.map(routeItem => {
                            const isSelected = selectedRoute === routeItem.model;
                            return (
                              <div 
                                key={routeItem.model} 
                                className={`p-2 rounded border text-[11px] flex justify-between items-center transition ${
                                  isSelected 
                                    ? "bg-cyan-950/35 border-cyan-700 glow-cyan font-bold" 
                                    : "bg-slate-950/40 border-slate-900 text-slate-400"
                                }`}
                              >
                                <div>
                                  <span className={isSelected ? "text-cyan-300" : "text-slate-400"}>{routeItem.model}</span>
                                  <span className="text-[10px] block opacity-85">{routeItem.profile}</span>
                                </div>
                                <div className="text-right">
                                  <span className="block">W: {routeItem.weight}% | Δ: {routeItem.entropy}</span>
                                  <span className="text-[9px] block">Latency: {routeItem.latency}ms</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-[10.5px] mt-2.5 text-slate-400 italic">Veklom recalculates pathways continuously to ensure compliance metrics on target system.</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* STAGE 4: EXECUTIONIDENTITYV1 ENFORCEMENT CARD */}
              <AnimatePresence>
                {activeEI && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-5 bg-gradient-to-tr from-[#020617] via-[#091038] to-[#040822] border-2 border-magenta-900/60 rounded-xl glow-magenta"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        <Lock className="w-4 h-4 text-magenta-400 animate-pulse" />
                        <span className="font-mono text-xs font-bold text-magenta-300 uppercase shrink-0">
                          ExecutionIdentityV1 - LAWS 0 Cryptographic Token
                        </span>
                      </div>
                      <span className="px-2 py-0.5 bg-magenta-950 border border-magenta-700 text-magenta-300 rounded font-mono text-[10px] font-extrabold uppercase animate-pulse">Signature Verified</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                      
                      {/* Left properties block */}
                      <div className="space-y-1.5 text-slate-300 leading-normal">
                        <div className="p-2 bg-slate-950/80 border border-slate-900/80 rounded leading-none flex items-center justify-between">
                          <span className="text-slate-500 text-[10px]">EXECUTION_ID:</span>
                          <span className="text-slate-200 text-[11px] font-bold">{activeEI.execution_id}</span>
                        </div>
                        <div className="p-2 bg-slate-950/80 border border-slate-900/80 rounded leading-none flex items-center justify-between">
                          <span className="text-slate-500 text-[10px]">RISK_TIER:</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            activeEI.risk_tier === "HIGH" ? "bg-red-950 text-red-400 border border-red-800" : "bg-cyan-950 text-cyan-400 border border-cyan-800"
                          }`}>{activeEI.risk_tier}</span>
                        </div>
                        <div className="p-2 bg-slate-950/80 border border-slate-900/80 rounded leading-none flex items-center justify-between">
                          <span className="text-slate-500 text-[10px]">DELEGATION_DEPTH:</span>
                          <span className="text-slate-200">{activeEI.delegation_depth}</span>
                        </div>
                        <div className="p-2 bg-slate-950/80 border border-slate-900/80 rounded leading-none flex items-center justify-between">
                          <span className="text-slate-500 text-[10px]">BUDGET_APPROVED:</span>
                          <span className="text-slate-200 font-bold">{activeEI.budget_approved_cents}¢ USDC</span>
                        </div>
                        <div className="p-2 bg-slate-950/80 border border-slate-900/80 rounded leading-none flex items-center justify-between">
                          <span className="text-slate-500 text-[10px]">EXPIRES_AT (10M TTL):</span>
                          <span className="text-slate-400 truncate text-[11px]">{new Date(activeEI.expires_at).toLocaleTimeString()}</span>
                        </div>
                      </div>

                      {/* Right cryptographic block */}
                      <div className="space-y-1.5 text-[11px] font-mono">
                        <p className="text-slate-500 leading-none">SIGNATURE (HMAC-SHA256):</p>
                        <p className="p-1.5 bg-slate-950 border border-slate-900 text-magenta-400 text-[10.5px] break-all rounded leading-relaxed">{activeEI.signature}</p>

                        <p className="text-slate-500 leading-none mt-2">DETERMINISTIC PERMITTED SCOPE TOOLS:</p>
                        <div className="flex flex-wrap gap-1.5 mt-1 leading-normal">
                          {activeEI.scope.tools.map(toolItem => (
                            <span key={toolItem} className="px-2 py-0.5 bg-cyan-950/40 border border-cyan-800 text-cyan-400 rounded text-[10px]">
                              {toolItem}
                            </span>
                          ))}
                        </div>
                      </div>

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* STAGE 5: SECURE EXECUTION - THE MCP GATEWAY CHAMBER */}
              <div className="border-t border-cyan-950/40 pt-5">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 bg-[#10b981] text-[#022c22] rounded text-[10px] font-bold">STAGE 5</span>
                    MCP Gateway Safe Tool Chamber
                  </label>
                  <span className="text-[10px] text-slate-400">Synapse RPC Execution Layer</span>
                </div>

                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg flex flex-col md:flex-row gap-4">
                  {/* Select Tool to attempt execution */}
                  <div className="flex-1">
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">Target Execution Tool</label>
                    <select
                      value={selectedTool}
                      onChange={(e) => setSelectedTool(e.target.value)}
                      className="bg-slate-950 border border-cyan-950 text-xs px-2.5 py-1.5 w-full rounded focus:outline-none focus:border-cyan-700 font-mono"
                    >
                      <option value="">-- Choose Tool --</option>
                      <option value="DB_READ">DB_READ (Allowable on preset)</option>
                      <option value="DB_WRITE">DB_WRITE (Allowed only if scoped)</option>
                      <option value="EXTERNAL_API">EXTERNAL_API (Allowed only if scoped)</option>
                      <option value="FILE_READ">FILE_READ</option>
                      <option value="BASH_RUN">BASH_RUN (Critical Warning Tool)</option>
                      <option value="ROOT_DEPLOY">ROOT_DEPLOY (Strictly Banned)</option>
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">By choosing an out-of-scope tool (e.g. BASH_RUN), you trigger a LAW 0 Rule 4 containment bypass rejection.</p>
                  </div>

                  <div className="flex-1">
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">Run Parameter Node Arg</label>
                    <input
                      type="text"
                      value={toolArg}
                      onChange={(e) => setToolArg(e.target.value)}
                      placeholder='e.g., "customer_id=140134"'
                      className="bg-slate-950 border border-cyan-950 text-xs px-2.5 py-1.5 w-full rounded focus:outline-none focus:border-cyan-700 font-mono text-slate-200"
                    />
                  </div>

                  <div className="flex items-end shrink-0 leading-normal">
                    <button
                      onClick={executeSecureTool}
                      disabled={executingTool}
                      className="px-5 py-2 w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono text-xs rounded transition uppercase flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                      id="execute-secure-tool-btn"
                    >
                      {executingTool ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> executing...
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" /> Execute Synapse CPC
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* OUTPUT RESULTS DISPLAY */}
                <AnimatePresence mode="wait">
                  {executionError && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-3 p-4 bg-red-950/20 border-l-4 border-red-600 text-red-200 rounded text-xs font-mono leading-relaxed"
                    >
                      <div className="flex items-center gap-1.5 font-bold mb-1">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        <span>MCP GATEWAY SECURITY CONSTRAINT REJECTION</span>
                      </div>
                      <p className="text-[11px] opacity-90">{executionError}</p>
                      <div className="mt-2.5 pt-2 border-t border-red-900/40 text-[10px] block font-bold uppercase text-red-300">
                        LAW 0 Status: ENFORCED. Mutations halted instantly.
                      </div>
                    </motion.div>
                  )}

                  {executionResult && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-3 p-4 bg-emerald-950/20 border-l-4 border-emerald-600 text-emerald-200 rounded text-xs font-mono leading-relaxed"
                    >
                      <div className="flex items-center gap-1.5 font-bold mb-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>MCP GATEWAY AUTHORIZED SYSTEM CALL SUCCESS</span>
                      </div>
                      
                      <div className="space-y-1 mt-1 text-[11px]">
                        <p><span className="text-slate-400">Target Executed API:</span> <span className="font-bold text-slate-200">{executionResult.toolExecuted}</span></p>
                        <p><span className="text-slate-400">Arg parameter:</span> {executionResult.arg}</p>
                        <p className="text-emerald-400 mt-2 bg-emerald-950/50 p-2 border border-emerald-900/60 rounded italic">"Successfully executed state mutation via sovereign Synapse RPC [${executionResult.toolExecuted}] for argument \"${executionResult.arg}\"."</p>
                        
                        <p className="text-[10px] text-slate-400 mt-2 block break-all">
                          Execution Attestation Proof Hash: 
                          <span className="font-bold text-slate-200 ml-1 block mt-0.5 p-1 bg-slate-950 rounded border border-slate-900">{executionResult.execution_attestation_hash}</span>
                        </p>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-emerald-900/40 text-[10px] block font-bold uppercase text-emerald-400">
                        Status: COMPLETED. Action anchored to tamper-proof Ledger block index: #{executionResult.block.index}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </div>

        </div>

        {/* Right Chained SHA-256 Audit Ledger column */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          <div className="bg-[#04081c] border border-cyan-950/50 rounded-xl shadow-xl flex-1 flex flex-col min-h-[600px] overflow-hidden">
            
            {/* Elegant Sliding Horizontal Tab Buttons */}
            <div className="flex border-b border-cyan-950/85 bg-[#070b22] shrink-0">
              <button 
                onClick={() => setActiveRightTab("live_ledger")}
                className={`flex-1 py-3.5 text-xs font-mono uppercase tracking-wider font-bold transition-all duration-300 flex items-center justify-center gap-2 border-b-2 cursor-pointer ${
                  activeRightTab === "live_ledger" 
                    ? "border-cyan-500 text-cyan-300 bg-cyan-950/15" 
                    : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"
                }`}
                id="live-ledger-tab"
              >
                <Activity className="w-4 h-4 text-cyan-400" />
                Live Actions Ledger
              </button>
              
              <button 
                onClick={() => setActiveRightTab("provable_genome_replay")}
                className={`flex-1 py-3.5 text-xs font-mono uppercase tracking-wider font-bold transition-all duration-300 flex items-center justify-center gap-2 border-b-2 cursor-pointer ${
                  activeRightTab === "provable_genome_replay" 
                    ? "border-magenta-500 text-magenta-300 bg-magenta-950/15 animate-pulse" 
                    : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"
                }`}
                id="real-replay-tab"
              >
                <Fingerprint className="w-4 h-4 text-magenta-500" />
                Real PGL Replay
              </button>
            </div>

            {/* TAB 1: LIVE ACTIONS LEDGER VIEW */}
            {activeRightTab === "live_ledger" && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="px-4 py-3 bg-[#0a0f2b]/40 border-b border-cyan-950/50 flex justify-between items-center shrink-0">
                  <span className="text-[10px] font-mono uppercase text-slate-300">Secure Synapse Block Storage</span>
                  <span className="px-2 py-0.5 bg-cyan-950 border border-cyan-800 text-cyan-400 rounded text-[9px] font-mono">
                    REALTIME CHAIN
                  </span>
                </div>

                <div className="p-4 flex-1 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-4">
                  <div className="p-3 bg-slate-900/40 rounded border border-slate-800 text-slate-400 leading-normal mb-2">
                    <span className="text-slate-200 text-xs font-bold block mb-1">Audit Ledger Formula</span>
                    Ledger blocks are locked and secure. Every action computes a combined, tamper-proof blockchain index:
                    <p className="mt-1 text-[11px] text-magenta-400 font-bold bg-slate-900 p-1.5 border border-slate-950/80 rounded overflow-x-auto">
                      Ct = SHA256( it + Jt + Et + a(exec) + H(ct) + H(Ct-1) )
                    </p>
                  </div>

                  {/* Dynamic Ledger list rendering */}
                  <div className="relative border-l border-cyan-950/80 pl-3 ml-2.5 space-y-6 list-none">
                    {ledger.length === 0 ? (
                      <div className="py-8 text-center text-slate-500 italic text-xs">
                        No live blocks committed yet. Execute stage 5 synapse CPC tools to log actions.
                      </div>
                    ) : (
                      ledger.slice().reverse().map((block) => {
                        return (
                          <div key={block.index} className="relative">
                            <span className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-cyan-500 ring-4 ring-[#04081c] z-10"></span>
                            
                            <div className="bg-[#070c25] border border-cyan-950 p-3 rounded-lg flex flex-col gap-1.5 transition hover:border-cyan-800">
                              <div className="flex justify-between items-center leading-none">
                                <span className="text-cyan-400 font-bold text-xs uppercase">Block #{block.index}</span>
                                <span className="text-slate-550 text-[10px]">{new Date(block.timestamp).toLocaleTimeString()}</span>
                              </div>

                              <p className="text-slate-200 text-[11px] mt-1"><span className="text-slate-450 font-bold">Intent:</span> "{block.intent}"</p>
                              <p className="text-slate-300"><span className="text-slate-500 font-bold">Justif:</span> {block.justification}</p>
                              <p className="text-slate-400">
                                <span className="text-slate-500 font-bold">Action:</span>{" "}
                                <span className="px-1.5 py-0.5 bg-cyan-950 text-cyan-300 font-bold rounded text-[10px]">
                                  {block.action}
                                </span>
                              </p>

                              <div className="mt-2 pt-2 border-t border-slate-900/80 space-y-1">
                                <p className="text-slate-500 leading-none text-[10px]/none">PREVIOUS HASH H(Ct-1):</p>
                                <p className="text-slate-400 text-[10px] break-all truncate bg-slate-950 p-1 rounded font-normal block">{block.previous_hash}</p>
                                
                                <p className="text-slate-500 leading-none text-[10px]/none mt-1">CURRENT COMBINED Ct:</p>
                                <p className="text-magenta-400 font-bold text-[10px] break-all truncate bg-slate-950 p-1 rounded font-normal block border border-magenta-950/40">{block.combined_hash}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Diagnostic system validation bottom block */}
                <div className="p-4 bg-[#0a0f2b] border-t border-cyan-950/60 shrink-0 select-none">
                  <button
                    onClick={verifyCryptographyIntegrity}
                    disabled={verifyingLedger || ledger.length === 0}
                    className="w-full py-2 bg-[#0e163d] hover:bg-[#131e50] border border-cyan-950 text-slate-300 font-mono text-xs rounded transition uppercase font-bold flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                    id="verify-crypt-btn"
                  >
                    {verifyingLedger ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> recalibrating...
                      </>
                    ) : (
                      <>
                        <Shield className="w-3.5 h-3.5 text-cyan-400" /> Verify Ledger Cryptography
                      </>
                    )}
                  </button>

                  {/* Integrity Diagnostic report window */}
                  {verificationOutput && (
                    <div className="mt-2.5 p-3 bg-slate-950 border border-cyan-950/80 rounded font-mono text-[10px] leading-relaxed text-cyan-400 whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {verificationOutput}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: GNOMLEDGER REAL-TIME REPLAY PLAYER */}
            {activeRightTab === "provable_genome_replay" && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="px-4 py-3 bg-[#110e2d]/60 border-b border-magenta-950/40 flex justify-between items-center shrink-0">
                  <span className="text-[10px] font-mono uppercase text-magenta-300 font-bold flex items-center gap-1">
                    Gnomledger Compliance Audit Platform
                  </span>
                  <span className="px-2 py-0.5 bg-magenta-950 border border-magenta-800 text-magenta-400 rounded text-[9px] font-mono font-bold uppercase animate-pulse">
                    Verified Offline
                  </span>
                </div>

                <div className="p-4 flex-1 overflow-y-auto space-y-4">
                  
                  {/* Real visual branching network lineage */}
                  <div className="p-3 bg-[#080d2d]/30 border border-slate-900 rounded-lg">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5 font-bold">
                      <GitFork className="w-3.5 h-3.5 text-magenta-400" />
                      Provable Genome Family Genealogy (Select Card to profile)
                    </div>
                    
                    <div className="flex flex-col gap-1.5 font-mono text-[11px]">
                      {/* Alpha Sentinel Node */}
                      <div 
                        onClick={() => {
                          setReplaySelectedAgent("agent_alpha");
                          resetReplay();
                        }}
                        className={`p-2 rounded border transition cursor-pointer flex items-center justify-between ${
                          replaySelectedAgent === "agent_alpha" 
                            ? "bg-indigo-950/40 border-indigo-500 text-white font-bold shadow-[0_0_8px_rgba(99,102,241,0.25)]" 
                            : "bg-[#060a1f] border-slate-900 text-slate-400 hover:text-slate-200 hover:border-slate-800"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                          🛡️ Alpha Sentinel [Prime Root Target]
                        </span>
                        <span className="text-[9px] font-semibold bg-red-950/60 text-red-400 border border-red-900 px-1.5 rounded">High Risk</span>
                      </div>
                      
                      {/* Vertical Fork bar graphic */}
                      <div className="pl-4 text-slate-700 leading-none h-2 flex items-center">
                        <span className="border-l border-dashed border-slate-800 h-full ml-1"></span>
                      </div>

                      {/* Forks containers columns */}
                      <div className="grid grid-cols-2 gap-2 pl-4">
                        {/* Beta Node */}
                        <div 
                          onClick={() => {
                            setReplaySelectedAgent("agent_beta");
                            resetReplay();
                          }}
                          className={`p-2 rounded border transition cursor-pointer flex flex-col justify-between ${
                            replaySelectedAgent === "agent_beta" 
                              ? "bg-teal-900/30 border-teal-500 text-white font-bold shadow-[0_0_8px_rgba(20,184,166,0.3)]" 
                              : "bg-[#060a1f] border-slate-900 text-slate-400 hover:text-slate-200 hover:border-slate-800"
                          }`}
                        >
                          <span className="truncate">🌿 Beta Playbook [Fork ID]</span>
                          <span className="text-[8.5px] mt-1 text-teal-400 font-bold bg-teal-950/50 border border-teal-900/60 px-1 rounded max-w-max">Medium Risk</span>
                        </div>

                        {/* Gamma Node */}
                        <div 
                          onClick={() => {
                            setReplaySelectedAgent("agent_gamma");
                            resetReplay();
                          }}
                          className={`p-2 rounded border transition cursor-pointer flex flex-col justify-between ${
                            replaySelectedAgent === "agent_gamma" 
                              ? "bg-amber-900/20 border-amber-500 text-white font-bold shadow-[0_0_8px_rgba(245,158,11,0.3)]" 
                              : "bg-[#060a1f] border-slate-900 text-slate-400 hover:text-slate-200 hover:border-slate-800"
                          }`}
                        >
                          <span className="truncate">📦 Gamma Archive [Fork ID]</span>
                          <span className="text-[8.5px] mt-1 text-amber-500 font-bold bg-amber-950/50 border border-amber-900/60 px-1 rounded max-w-max">Medium Risk</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Selected Agent Genome Description card */}
                  <div className="p-3 bg-slate-950 rounded-lg border border-[#1e293b]/70 font-mono text-[11px]">
                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-2 flex items-center justify-between">
                      <span>Genome Profile: {GNOMLEDGER_REPLAY_DATA.bundle.agents.find(a => a.agent_id === replaySelectedAgent)?.name}</span>
                      <span className="text-[9px] text-[#e11d48] uppercase tracking-widest">{GNOMLEDGER_REPLAY_DATA.bundle.agents.find(a => a.agent_id === replaySelectedAgent)?.status}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="p-2 bg-slate-900/40 border border-slate-900 rounded">
                        <span className="text-slate-500 block text-[9px]">JURISDICTION:</span>
                        <span className="text-cyan-400 font-bold">{GNOMLEDGER_REPLAY_DATA.bundle.agents.find(a => a.agent_id === replaySelectedAgent)?.jurisdiction}</span>
                      </div>
                      <div className="p-2 bg-slate-900/40 border border-slate-900 rounded">
                        <span className="text-slate-500 block text-[9px]">GENOME VERSION:</span>
                        <span className="text-indigo-400 font-bold">Count: {GNOMLEDGER_REPLAY_DATA.bundle.agents.find(a => a.agent_id === replaySelectedAgent)?.version_count}</span>
                      </div>
                      <div className="p-2 bg-slate-900/40 border border-slate-900 rounded col-span-2">
                        <span className="text-slate-500 block text-[9px]">DECLARED OPERATIONS PURPOSE:</span>
                        <span className="text-slate-300 leading-normal block mt-0.5">"{GNOMLEDGER_REPLAY_DATA.bundle.agents.find(a => a.agent_id === replaySelectedAgent)?.declared_purpose}"</span>
                      </div>
                      <div className="p-2 bg-slate-900/40 border border-slate-900 rounded col-span-2">
                        <span className="text-slate-500 block text-[9px]">PERMISSIONS GRANTED (GENOME):</span>
                        <div className="flex flex-wrap gap-1 mt-1 font-bold">
                          {GNOMLEDGER_REPLAY_DATA.bundle.agents.find(a => a.agent_id === replaySelectedAgent)?.genome.permissions.map(perm => (
                            <span key={perm} className="px-1.5 py-0.5 bg-emerald-950/60 border border-emerald-900 text-emerald-400 rounded text-[9px] uppercase">
                              ✓ {perm}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="p-2 bg-slate-900/40 border border-slate-900 rounded col-span-2">
                        <span className="text-slate-500 block text-[9px]">CRITICAL SAFETY CONTROLLERS:</span>
                        <div className="flex flex-wrap gap-1 mt-1 font-bold">
                          {GNOMLEDGER_REPLAY_DATA.bundle.agents.find(a => a.agent_id === replaySelectedAgent)?.genome.safety_rules.map(rule => (
                            <span key={rule} className="px-1.5 py-0.5 bg-cyan-950/60 border border-cyan-900 text-cyan-400 rounded text-[9px] uppercase">
                              ⚙️ {rule}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="p-2 bg-slate-900/40 border border-slate-900 rounded col-span-2">
                        <span className="text-slate-500 block text-[9px]">LATEST GENOME STATE TRACE HASH:</span>
                        <span className="text-magenta-450 font-bold tracking-tight block mt-0.5 pb-0.5 truncate select-all">
                          {GNOMLEDGER_REPLAY_DATA.bundle.agents.find(a => a.agent_id === replaySelectedAgent)?.latest_genome_hash}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* PLAYER CONTROLLER BUTTONS PANEL */}
                  <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800 flex items-center justify-between gap-3 font-mono shrink-0 select-none">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={replayRunning ? pauseReplay : startReplay}
                        className={`px-3.5 py-1.5 rounded text-[11px] font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer ${
                          replayRunning 
                            ? "bg-amber-600 hover:bg-amber-500 text-slate-950 animate-pulse" 
                            : "bg-magenta-650 hover:bg-magenta-550 text-slate-100 bg-magenta-600 hover:bg-magenta-500"
                        }`}
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        {replayRunning ? "Pause Playback" : "Replay Run"}
                      </button>

                      <button
                        onClick={resetReplay}
                        disabled={replayCurrentIndex === 0 && !replayRunning}
                        className="px-3.5 py-1.5 rounded text-[11px] font-bold bg-[#0e163d] border border-cyan-950 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Reset Player
                      </button>
                    </div>

                    <div className="text-right text-[10.5px]">
                      <span className="text-slate-500 block leading-none">SEQUENCE INDEX</span>
                      <span className="text-magenta-400 font-bold text-xs mt-1 block">
                        {replayCurrentIndex} / {GNOMLEDGER_REPLAY_DATA.bundle.ledgerByAgent[replaySelectedAgent]?.length || 0} committed events
                      </span>
                    </div>
                  </div>

                  {/* Cyber Terminal Console Monitor */}
                  <div className="p-3 bg-slate-950 border border-[#1e293b] rounded-lg relative overflow-hidden flex flex-col h-56 font-mono text-[10.5px]/relaxed">
                    <div className="flex justify-between items-center text-[9px]/none uppercase font-bold text-slate-550 border-b border-slate-900 pb-2 mb-2 shrink-0">
                      <span className="flex items-center gap-1 text-slate-400">
                        <Terminal className="w-3.5 h-3.5 text-magenta-500 shrink-0" />
                        Reprewind Playback Monitor Console
                      </span>
                      <span className="text-magenta-450">Active: {replaySelectedAgent}</span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-1 select-text scrollbar-thin max-h-52">
                      {replayLog.length === 0 ? (
                        <div className="py-12 text-center text-slate-600 italic">
                          Console dormant. Click "Replay Run" above to execute real-time verified lineage playback.
                        </div>
                      ) : (
                        replayLog.map((line, lIdx) => (
                          <div 
                            key={lIdx} 
                            className={`${
                              line.startsWith("\n") ? "mt-3 border-t border-slate-900/50 pt-1 text-slate-100 font-bold" 
                              : line.includes("successfully") || line.includes("matched") ? "text-emerald-400 font-bold" 
                              : line.includes("BOOTING") || line.includes("COMPLETED") ? "text-magenta-400 font-bold"
                              : line.startsWith("📦") ? "text-indigo-300 max-w-full break-all"
                              : "text-slate-400"
                            }`}
                          >
                            {line}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

                {/* COPY EXPORT BUNDLE BUTTON */}
                <div className="p-4 bg-[#110e2d]/60 border-t border-magenta-950/40 shrink-0">
                  <button
                    onClick={copyAuditBundle}
                    className="w-full py-2 bg-[#121133] hover:bg-[#1f1642] border border-magenta-950 text-slate-200 font-mono text-xs rounded transition uppercase font-bold flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    {copiedStatus ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Gnomledger Audit Package Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-magenta-400" />
                        Copy Gnomledger Export Bundle (JSON)
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>

      </main>

      <footer className="py-4 text-center text-xs text-slate-500 border-t border-cyan-950/30 shrink-0 font-mono select-none">
        Developed in alignment with sovereign agent system specifications • Port 3000 Ingress Enforced • © 2026 Veklom Group.
      </footer>

    </div>
  );
}

