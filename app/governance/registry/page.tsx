"use client";

import React, { useState } from "react";
import {
  Shield,
  Activity,
  Award,
  Wallet,
  CheckCircle,
  AlertCircle,
  Database,
  RefreshCw,
  Search,
  Send,
  Cpu,
  Layers,
  Sparkles,
  Flame
} from "lucide-react";

export default function SovereignOperatorRegistry() {
  const [operatorAddress, setOperatorAddress] = useState<string | null>(null);
  const [trustScore, setTrustScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventType, setSelectedEventType] = useState("verified_action");
  const [actionDescription, setActionDescription] = useState("Verified autonomous network telemetry handshake");

  const handlePublishTelemetry = () => {
    const newEvent = {
      timestamp: new Date().toISOString(),
      tag: selectedEventType,
      delta: selectedEventType === "verified_action" ? "+10" : "-50",
      reason: actionDescription,
      proof: "0x" + Math.random().toString(16).slice(2, 64)
    };
    
    setEvents([newEvent, ...events]);
    setTrustScore((prev) => Math.min(1000, prev + (selectedEventType === "verified_action" ? 10 : -50)));
    setStreak((prev) => selectedEventType === "verified_action" ? prev + 1 : 0);
  };

  return (
    <div className="min-h-screen bg-[#080808] text-[#e0e0e0] font-mono p-6 selection:bg-cyan-500/30">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center text-white font-sans font-bold text-xl">
            V
          </div>
          <div>
            <h1 className="text-xl font-sans font-black tracking-tight text-white flex items-center gap-2">
              VEKLOM ID <span className="bg-blue-600 text-[10px] uppercase px-1.5 py-0.5 rounded tracking-widest text-white">LAYER 1</span>
            </h1>
            <p className="text-xs text-neutral-500">Sovereign Operator Registry trust primitive</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Hetzner Node Active
          </span>
          <span className="bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded text-neutral-300">
            Domain: <span className="text-white">veklomid.base.eth</span>
          </span>
        </div>
      </header>

      {/* Nav Tabs */}
      <nav className="flex gap-1 overflow-x-auto border-b border-neutral-800 pb-1 mb-8 text-xs font-bold uppercase tracking-wider text-neutral-500">
        <button className="flex items-center gap-2 px-4 py-3 bg-neutral-900 text-white border-t border-x border-neutral-800 rounded-t-md">
          <Shield className="w-3.5 h-3.5 text-blue-400" />
          1. Sovereign Operator Registry
        </button>
        <button className="flex items-center gap-2 px-4 py-3 hover:text-neutral-300 transition-colors">
          <Wallet className="w-3.5 h-3.5 text-orange-400" />
          2. Base Smart Wallet (EIP-5792)
        </button>
        <button className="flex items-center gap-2 px-4 py-3 hover:text-neutral-300 transition-colors">
          <Database className="w-3.5 h-3.5" />
          3. Config Reference
        </button>
        <button className="flex items-center gap-2 px-4 py-3 hover:text-neutral-300 transition-colors">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          4. Agentic Commerce Hub (X402)
        </button>
      </nav>

      {/* Main Intro Module */}
      <div className="bg-blue-900/10 border border-blue-900/30 rounded-lg p-5 mb-8 flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20 text-blue-400 mt-1">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-sans font-bold text-white mb-1">Veklom Layer 1 Identity Primitive</h2>
            <p className="text-sm text-neutral-400 max-w-3xl leading-relaxed">
              This module parses incoming decentralized actions (e.g. daily missions, agent telemetry, proof cycles) into deterministic scores. Every score movement is backed by an event log, and recalculated chronologically from history.
            </p>
          </div>
        </div>
        <button className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-4 py-2 rounded text-xs font-bold text-neutral-300 hover:text-white transition-colors">
          <CheckCircle className="w-3.5 h-3.5 text-blue-400" />
          Run Acceptance Tests
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* ID Card */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-3 flex items-center justify-between">
              SOVEREIGN OPERATOR ID CARD
              <button className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors normal-case tracking-normal">
                <RefreshCw className="w-3 h-3" /> sync registry
              </button>
            </h3>
            
            <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Shield className="w-48 h-48" />
              </div>
              
              <div className="text-[10px] text-blue-500 font-bold tracking-widest uppercase mb-8">
                SOVEREIGN REGISTRY
              </div>
              
              <div className="flex justify-between items-end mb-12">
                <div>
                  <div className="text-[10px] text-neutral-500 font-bold tracking-widest uppercase mb-1">
                    IMMUTABLE TRUST INDEX
                  </div>
                  <div className="text-4xl font-sans font-black text-white">
                    {trustScore} <span className="text-xl text-neutral-600">/1000</span>
                  </div>
                </div>
                
                <div className="flex gap-6 text-center">
                  <div>
                    <div className="text-[10px] text-neutral-500 font-bold tracking-widest uppercase mb-1">CUR STREAK</div>
                    <div className="text-xl font-bold text-orange-500 flex items-center gap-1 justify-center">
                      <Flame className="w-4 h-4" /> {streak}d
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-neutral-500 font-bold tracking-widest uppercase mb-1">LONGEST</div>
                    <div className="text-xl font-bold text-neutral-300">
                      {streak}d
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4 text-xs">
                <div className="flex justify-between border-b border-neutral-800/50 pb-2">
                  <span className="text-neutral-500">Operator address:</span>
                  <span className={operatorAddress ? "text-cyan-400" : "text-rose-500 font-bold italic"}>
                    {operatorAddress || "No wallet linked"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-neutral-800/50 pb-2">
                  <span className="text-neutral-500">Workspace identifier:</span>
                  <span className="text-neutral-300">sandbox_veklom_demo</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-neutral-500">Score Version:</span>
                  <span className="text-neutral-300">v.0 (Deterministic standard)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Configure Group */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-3">
              CONFIGURE NODE IDENTITY GROUP
            </h3>
            <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-5">
              <div className="flex gap-2 mb-4">
                <input 
                  type="text" 
                  placeholder="E.G. OPERATOR NODE ALPHA"
                  className="flex-1 bg-black/40 border border-neutral-800 rounded px-3 py-2 text-xs focus:outline-none focus:border-neutral-600"
                />
                <button className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-4 py-2 rounded text-xs transition-colors">
                  Update Card Tag
                </button>
              </div>
              <p className="text-[10px] text-neutral-500 mb-6">
                Note: Updating the display tag logs a 0-points verified identity trace directly to audit trail.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400">Test rank transition animation:</span>
                <button className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 px-3 py-1.5 rounded border border-blue-500/20">
                  <Sparkles className="w-3.5 h-3.5" /> Preview Rank Celebration
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Mock Telemetry Ingestion */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-3">
              MOCK TELEMETRY EVENT INGESTION
            </h3>
            <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
              <p className="text-xs text-neutral-400 mb-6">
                Event logs trigger the deterministic score calculator backend. Use this panel to simulate real-world trust logs.
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">SELECT EVENT TYPE</label>
                  <select 
                    value={selectedEventType}
                    onChange={(e) => setSelectedEventType(e.target.value)}
                    className="w-full bg-black/40 border border-neutral-800 rounded px-3 py-2.5 text-xs text-white focus:outline-none focus:border-neutral-600 appearance-none"
                  >
                    <option value="verified_action">verified_action (+10)</option>
                    <option value="policy_violation">policy_violation (-50)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">CUSTOM SCORE OVERRIDE (OPTIONAL)</label>
                  <input 
                    type="text" 
                    placeholder="Default delta for event"
                    className="w-full bg-black/40 border border-neutral-800 rounded px-3 py-2.5 text-xs text-neutral-400 focus:outline-none focus:border-neutral-600"
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">INCIDENT / ACTION DESCRIPTION REASON</label>
                <input 
                  type="text" 
                  value={actionDescription}
                  onChange={(e) => setActionDescription(e.target.value)}
                  className="w-full bg-black/40 border border-neutral-800 rounded px-3 py-3 text-xs text-white focus:outline-none focus:border-neutral-600"
                />
              </div>
              
              <button 
                onClick={handlePublishTelemetry}
                className="w-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 py-3 rounded flex items-center justify-center gap-2 text-xs font-bold transition-colors mb-8"
              >
                <Send className="w-3.5 h-3.5" />
                Publish Telemetry event to Operator Card
              </button>
              
              <div className="border-t border-neutral-800 pt-6">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-4">LIVE SCORING RANGE GUIDELINES</h4>
                <div className="grid grid-cols-2 gap-y-2 text-[11px]">
                  <div className="flex items-center gap-2 text-neutral-500">Tier 0-99: <span className="font-bold">Unranked</span></div>
                  <div className="flex items-center gap-2 text-neutral-400">Tier 100-199: <span className="font-bold">Novice Node</span></div>
                  <div className="flex items-center gap-2 text-neutral-300">Tier 200-349: <span className="font-bold">Operator</span></div>
                  <div className="flex items-center gap-2 text-emerald-400">Tier 350-499: <span className="font-bold">Trusted Operator</span></div>
                  <div className="flex items-center gap-2 text-blue-400">Tier 500-699: <span className="font-bold">Sovereign</span></div>
                  <div className="flex items-center gap-2 text-violet-400">Tier 700-849: <span className="font-bold">Elite Sovereign</span></div>
                  <div className="flex items-center gap-2 text-amber-400">Tier 850-1000: <span className="font-bold">Apex Sovereign</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Public Secure Directory */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-3">
              PUBLIC SECURE DIRECTORY READ-OUT
            </h3>
            <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-5">
              <p className="text-xs text-neutral-400 mb-4">
                Query high level operator stats without exposing private database linkages (owner_user_id, workspace_id, internal database references etc).
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="Enter wallet address (e.g. 0x3b8981F82743DDeF2b28F3D1BFF781f33Cd66D4e8)"
                    className="w-full bg-black/40 border border-neutral-800 rounded py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-neutral-600"
                  />
                </div>
                <button className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-6 py-2.5 rounded text-xs font-bold transition-colors">
                  Query Public Directory
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ledger */}
      <div className="mt-8">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-3">
          IMMUTABLE TRUST SCORE EVENTS LEDGER
        </h3>
        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950 border-b border-neutral-800">
              <tr>
                <th className="p-4 font-bold text-[10px] uppercase tracking-widest text-neutral-500">TIMESTAMP</th>
                <th className="p-4 font-bold text-[10px] uppercase tracking-widest text-neutral-500">EVENT LOGIC TAG</th>
                <th className="p-4 font-bold text-[10px] uppercase tracking-widest text-neutral-500">DELTA</th>
                <th className="p-4 font-bold text-[10px] uppercase tracking-widest text-neutral-500 w-1/3">EXPLANATION REASON</th>
                <th className="p-4 font-bold text-[10px] uppercase tracking-widest text-neutral-500 text-right">PROOF EVIDENCE HASH</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-neutral-500">
                    No score event history recorded yet. Use the Telemetry Event Ingestion panel above to post.
                  </td>
                </tr>
              ) : (
                events.map((event, i) => (
                  <tr key={i} className="border-b border-neutral-800/50 hover:bg-neutral-900/50">
                    <td className="p-4 text-neutral-400">{new Date(event.timestamp).toLocaleString()}</td>
                    <td className="p-4"><span className="bg-neutral-950 border border-neutral-800 px-2 py-1 rounded text-cyan-400">{event.tag}</span></td>
                    <td className={`p-4 font-bold ${event.delta.startsWith('+') ? 'text-emerald-400' : 'text-rose-500'}`}>{event.delta}</td>
                    <td className="p-4 text-neutral-300">{event.reason}</td>
                    <td className="p-4 text-right text-neutral-500 font-mono text-[10px] truncate max-w-[150px]">{event.proof}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 flex items-center justify-between text-[10px] text-neutral-600 border-t border-neutral-800/50 pt-4">
        <div>© 2026 Sovereign Operator Registry. Veklom Core Protocol • Layer 1 Trust Infrastructure.</div>
        <div className="flex items-center gap-4">
          <span>Secure Service Node: V1.0.4</span>
          <span>veklom.com</span>
        </div>
      </footer>
    </div>
  );
}
