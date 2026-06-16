// @ts-nocheck
"use client";
import { useState } from "react";
import CodeExplorer from "./components/CodeExplorer";
import StateVisualizer from "./components/StateVisualizer";
import {
  ShieldAlert,
  Cpu,
  Coins,
  FileCheck,
  GitBranch,
  Terminal,
  PlayCircle
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"simulator" | "codebase">("simulator");

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] selection:bg-[#141414] selection:text-[#E4E3E0] font-sans pb-12">
      
      {/* Main Structural Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        
        {/* Upper Master Navigation & Branding - Hardened Contrast Header */}
        <header id="master-header" className="border border-[#141414] bg-[#141414] text-[#E4E3E0] p-6 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,0.15)]">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#E4E3E0] text-[#141414] border border-[#141414] rounded-none">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tighter text-[#E4E3E0] font-sans flex items-center gap-2">
                  VIRO <span className="text-white/60 font-light text-lg">v1</span>
                </h1>
                <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
                  Financial Data Plane // Hardened Infrastructure
                </p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-[#E4E3E0]/80 max-w-2xl leading-relaxed pt-2 font-mono">
              Production-hardened transaction plane with high-precision Decimal money math, managed server lifespans, and atomic double-completion race protection.
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono bg-white/10 border border-white/20 px-3 py-1.5 rounded-none text-[#E4E3E0] flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-emerald-400" />
              FastMCP: Managed Lifespan
            </span>
            <span className="text-[10px] font-mono bg-white/10 border border-white/20 px-3 py-1.5 rounded-none text-[#E4E3E0] flex items-center gap-1.5">
              <Coins className="h-3.5 w-3.5 text-amber-400" />
              Math: decimal(18,6)
            </span>
            <span className="text-[10px] font-mono bg-white/10 border border-white/20 px-3 py-1.5 rounded-none text-[#E4E3E0] flex items-center gap-1.5">
              <FileCheck className="h-3.5 w-3.5 text-emerald-400" />
              Leases: UPDATE 1 Enforced
            </span>
          </div>
        </header>

        {/* Section Selection Navigation Tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mb-8 gap-4">
          <div className="flex bg-white/50 p-1 rounded-none border border-[#141414] self-start shadow-[2px_2px_0px_rgba(20,20,20,0.1)]">
            <button
              id="tab-btn-simulator"
              onClick={() => setActiveTab("simulator")}
              className={`px-4 sm:px-6 py-2.5 rounded-none text-xs sm:text-sm font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-2 ${
                activeTab === "simulator"
                  ? "bg-[#141414] text-[#E4E3E0] font-black border border-[#141414]"
                  : "text-[#141414] hover:bg-[#141414]/10"
              }`}
            >
              <PlayCircle className="h-4 w-4" />
              Interactive Simulation Workspace
            </button>
            <button
              id="tab-btn-codebase"
              onClick={() => setActiveTab("codebase")}
              className={`px-4 sm:px-6 py-2.5 rounded-none text-xs sm:text-sm font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-2 ${
                activeTab === "codebase"
                  ? "bg-[#141414] text-[#E4E3E0] font-black border border-[#141414]"
                  : "text-[#141414] hover:bg-[#141414]/10"
              }`}
            >
              <Terminal className="h-4 w-4" />
              Hardened Code Tree Editor
            </button>
          </div>

          <div className="text-[11px] text-[#141414] font-mono text-left sm:text-right flex items-center gap-2 self-start sm:self-auto uppercase font-bold">
            <GitBranch className="h-3.5 w-3.5 text-[#141414]" />
            Veklom-v1 @ Build Stable v1.0.4
          </div>
        </div>

        {/* Workspace Display */}
        <main className="space-y-6">
          {activeTab === "simulator" ? (
            <StateVisualizer />
          ) : (
            <CodeExplorer />
          )}
        </main>

        {/* Quick-Audit Educational Footer Grid */}
        <footer className="mt-16 pt-8 border-t border-[#141414] grid grid-cols-1 md:grid-cols-3 gap-8 text-xs text-[#141414]/80 leading-relaxed font-sans">
          <div className="space-y-3 bg-white/40 p-4 border border-[#141414]/10 shadow-[2px_2px_0px_rgba(20,20,20,0.05)]">
            <h4 className="text-[#141414] font-black uppercase tracking-wider text-[11px] flex items-center gap-2 font-mono">
              <span className="w-2 h-2 bg-[#141414]" />
              1. Exact USD decimals math
            </h4>
            <p>
              Replaces binary float tracking with high-precision Postgres and Python Decimal models. Completely limits micro-cents rounding discrepancies over millions of client transactions.
            </p>
          </div>
          <div className="space-y-3 bg-white/40 p-4 border border-[#141414]/10 shadow-[2px_2px_0px_rgba(20,20,20,0.05)]">
            <h4 className="text-[#141414] font-black uppercase tracking-wider text-[11px] flex items-center gap-2 font-mono">
              <span className="w-2 h-2 bg-[#141414]" />
              2. Stale Update Mitigation
            </h4>
            <p>
              Requires structural status checks in operations returning "UPDATE 1". If a worker lease expires and a secondary worker acquires the job, any late writes by the original worker are rejected automatically.
            </p>
          </div>
          <div className="space-y-3 bg-white/40 p-4 border border-[#141414]/10 shadow-[2px_2px_0px_rgba(20,20,20,0.05)]">
            <h4 className="text-[#141414] font-black uppercase tracking-wider text-[11px] flex items-center gap-2 font-mono">
              <span className="w-2 h-2 bg-[#141414]" />
              3. Self-healing state loops
            </h4>
            <p>
              Integrates background sweeper cron cycles to periodically grab running jobs with past expiration timelines and requeue them, restoring hot reservations with secure ledger reconciliation.
            </p>
          </div>
        </footer>

        {/* Trademark Line */}
        <div className="mt-8 pt-4 pb-8 text-center text-[10px] text-[#141414]/60 font-mono">
          Veklom Financial Data Plane Simulator • Developed For Sovereign Execution Cores • AI Studio Build
        </div>

      </div>
    </div>
  );
}

