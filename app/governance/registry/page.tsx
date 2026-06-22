"use client";

import React, { useState, useEffect } from "react";
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
  Flame,
  Terminal,
  PlayCircle
} from "lucide-react";
import { api } from "@/lib/api";

interface PGLStatus {
  has_pgl_profile: boolean;
  requires_onboarding: boolean;
  workspace_id: string;
  profile: {
    certificate_id: string;
    actor_id: string;
    genome_hash: string;
    constitution_hash?: string;
    status: string;
    created_at: string;
    ledger_event_count: number;
    chain_head: string | null;
  } | null;
}

interface SnapshotResponse {
  certificate_id: string;
  workspace_id: string;
  actor_id: string;
  genome_hash: string;
  constitution_hash: string;
  status: string;
  created_at: string;
  ledger_events: {
    id: string;
    event_type: string;
    event_hash: string;
    prev_event_hash: string | null;
    created_at: string;
  }[];
  chain_head: string | null;
  version_count: number;
}

export default function SovereignOperatorRegistry() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<PGLStatus | null>(null);
  const [snapshot, setSnapshot] = useState<SnapshotResponse | null>(null);
  const [operatorAddress, setOperatorAddress] = useState<string | null>(null);
  const [trustScore, setTrustScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventType, setSelectedEventType] = useState("verified_action");
  const [actionDescription, setActionDescription] = useState("Verified autonomous network telemetry handshake");
  const [customDelta, setCustomDelta] = useState("");

  // cAPI console states
  const [capiAgentId, setCapiAgentId] = useState("agent_alpha");
  const [capiProtocol, setCapiProtocol] = useState("mcp");
  const [capiAction, setCapiAction] = useState("web_search");
  const [capiPayload, setCapiPayload] = useState('{"query": "Veklom protocol stats"}');
  const [capiReceipt, setCapiReceipt] = useState<any | null>(null);
  const [capiRunning, setCapiRunning] = useState(false);
  const [capiError, setCapiError] = useState<string | null>(null);

  const fetchRegistryData = async () => {
    setLoading(true);
    try {
      const pglStatus = await api<PGLStatus>("/api/v1/pgl/status");
      setStatus(pglStatus);
      
      if (pglStatus.profile?.certificate_id) {
        const snap = await api<SnapshotResponse>(`/api/v1/pgl/snapshot/${pglStatus.profile.certificate_id}`);
        setSnapshot(snap);
        
        // Calculate trust score based on event logs
        let calculatedScore = 500; // Base score
        let currentStreak = 0;
        
        const mappedEvents = snap.ledger_events.map(e => {
          let delta = "+10";
          let explanation = "Autonomous trace action";
          
          if (e.event_type === "operator_created") {
            delta = "+50";
            explanation = "Registry node created";
          } else if (e.event_type.includes("violation") || e.event_type.includes("quarantine")) {
            delta = "-100";
            explanation = "Policy violation gate check triggered";
          }
          
          const deltaNum = parseInt(delta);
          calculatedScore = Math.max(0, Math.min(1000, calculatedScore + deltaNum));
          if (deltaNum > 0) currentStreak += 1;
          
          return {
            timestamp: e.created_at,
            tag: e.event_type,
            delta: deltaNum > 0 ? `+${deltaNum}` : `${deltaNum}`,
            reason: explanation,
            proof: e.event_hash
          };
        });

        setEvents(mappedEvents.reverse()); // most recent first
        setTrustScore(calculatedScore);
        setStreak(currentStreak);
      }
      
      // Fetch operator user address
      const me = await api<any>("/api/v1/auth/me");
      if (me?.pgl_id) {
        setOperatorAddress(me.pgl_id);
      }
    } catch (e) {
      console.error("Failed to load PGL registry stats", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistryData();
  }, []);

  const handlePublishTelemetry = async () => {
    if (!status?.profile?.certificate_id) return;
    try {
      const delta = customDelta ? parseInt(customDelta) : (selectedEventType === "verified_action" ? 10 : -50);
      const res = await api<any>("/api/v1/pgl/ledger/events", {
        body: {
          agent_id: status.profile.certificate_id,
          event_type: selectedEventType,
          actor: "operator-console",
          summary: actionDescription,
          details: {
            delta,
            client_proof_seed: Math.random().toString(36).slice(2)
          }
        }
      });
      await fetchRegistryData();
    } catch (e) {
      console.error("Telemetry publish failed", e);
    }
  };

  const handleTriggerCapi = async () => {
    setCapiRunning(true);
    setCapiError(null);
    setCapiReceipt(null);
    try {
      let parsedPayload = {};
      try {
        parsedPayload = JSON.parse(capiPayload);
      } catch {
        throw new Error("Invalid payload JSON format");
      }

      const receipt = await api<any>("/api/v1/capi/execute", {
        body: {
          agent_id: capiAgentId,
          pgl_id: status?.profile?.certificate_id || "unregistered_agent_sig",
          target_protocol: capiProtocol,
          action: capiAction,
          payload: parsedPayload
        }
      });
      setCapiReceipt(receipt);
      await fetchRegistryData(); // refresh ledger events to pull in run evidence
    } catch (e: any) {
      setCapiError(e.message || "cAPI execution failed");
    } finally {
      setCapiRunning(false);
    }
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
        <button 
          onClick={fetchRegistryData}
          className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-4 py-2 rounded text-xs font-bold text-neutral-300 hover:text-white transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${loading ? 'animate-spin' : ''}`} />
          Reload Live Registry
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* ID Card */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-3 flex items-center justify-between">
              SOVEREIGN OPERATOR ID CARD
              <button 
                onClick={fetchRegistryData}
                className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors normal-case tracking-normal"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> sync registry
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
                      <Flame className="w-4 h-4" /> {streak}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-neutral-500 font-bold tracking-widest uppercase mb-1">LONGEST</div>
                    <div className="text-xl font-bold text-neutral-300">
                      {streak}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4 text-xs">
                <div className="flex justify-between border-b border-neutral-800/50 pb-2">
                  <span className="text-neutral-500">Operator address:</span>
                  <span className={operatorAddress ? "text-cyan-400 break-all max-w-[200px] text-right font-mono" : "text-rose-500 font-bold italic"}>
                    {operatorAddress || "No wallet linked"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-neutral-800/50 pb-2">
                  <span className="text-neutral-500">Workspace identifier:</span>
                  <span className="text-neutral-300 font-mono">{status?.workspace_id || "sandbox_veklom_demo"}</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-neutral-500">Score Version:</span>
                  <span className="text-neutral-300">v.0 (Deterministic standard)</span>
                </div>
              </div>
            </div>
          </div>

          {/* cAPI Console Panel */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-3">
              cAPI GOVERNED TOOL GATEWAY CONSOLE
            </h3>
            <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold uppercase text-neutral-500 mb-1">AGENT TARGET</label>
                  <input 
                    type="text" 
                    value={capiAgentId}
                    onChange={(e) => setCapiAgentId(e.target.value)}
                    className="w-full bg-black/40 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase text-neutral-500 mb-1">PROTOCOL</label>
                  <select 
                    value={capiProtocol}
                    onChange={(e) => setCapiProtocol(e.target.value)}
                    className="w-full bg-black/40 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="mcp">mcp</option>
                    <option value="http">http</option>
                    <option value="local_tool">local_tool</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase text-neutral-500 mb-1">ACTION/TOOL NAME</label>
                <input 
                  type="text" 
                  value={capiAction}
                  onChange={(e) => setCapiAction(e.target.value)}
                  className="w-full bg-black/40 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase text-neutral-500 mb-1">PAYLOAD JSON (ARGUMENTS)</label>
                <textarea 
                  value={capiPayload}
                  onChange={(e) => setCapiPayload(e.target.value)}
                  rows={2}
                  className="w-full bg-black/40 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>
              <button 
                onClick={handleTriggerCapi}
                disabled={capiRunning}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-800 text-white py-2 rounded text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                <PlayCircle className="w-4 h-4" />
                {capiRunning ? "Processing Gates..." : "Dispatch Governed cAPI Execution"}
              </button>

              {capiError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded text-xs">
                  {capiError}
                </div>
              )}

              {capiReceipt && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded text-[11px] font-mono space-y-1">
                  <div>Status: <span className="font-bold">{capiReceipt.status}</span></div>
                  <div>Verdict: <span className="font-bold">{capiReceipt.verdict}</span></div>
                  <div>Chain: <span className="underline">{capiReceipt.evidence_chain_id}</span></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Telemetry Ingestion */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-3">
              TELEMETRY EVENT INGESTION (REAL PGL)
            </h3>
            <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
              <p className="text-xs text-neutral-400 mb-6">
                Publishing score logs writes directly to the GnomLedger hash chain. All subsequent checks will verify this chain lineage.
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">SELECT EVENT TYPE</label>
                  <select 
                    value={selectedEventType}
                    onChange={(e) => setSelectedEventType(e.target.value)}
                    className="w-full bg-black/40 border border-neutral-800 rounded px-3 py-2.5 text-xs text-white focus:outline-none focus:border-neutral-600 appearance-none"
                  >
                    <option value="verified_action">verified_action</option>
                    <option value="policy_violation">policy_violation</option>
                    <option value="deployment">deployment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">CUSTOM DELTA (OPTIONAL)</label>
                  <input 
                    type="text" 
                    placeholder="Enter delta integer (e.g. -20)"
                    value={customDelta}
                    onChange={(e) => setCustomDelta(e.target.value)}
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
                disabled={!status?.profile?.certificate_id}
                className="w-full bg-neutral-800 hover:bg-neutral-700 disabled:bg-neutral-900 text-neutral-300 py-3 rounded flex items-center justify-center gap-2 text-xs font-bold transition-colors mb-8"
              >
                <Send className="w-3.5 h-3.5" />
                Publish Live Telemetry to PGL Ledger
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

          {/* Secure Directory */}
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
