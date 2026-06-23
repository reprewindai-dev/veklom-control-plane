"use strict";
"use client";
import { Card, Table, ErrorBox } from "@/components/ui";
import { ShieldAlert, Zap, Activity } from "lucide-react";
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function SekedConsole() {
  const { data: agents, error } = useSWR('http://localhost:8088/api/v1/seked/agents', fetcher, {
    refreshInterval: 5000
  });

  const mockBlocks = [
    { id: "req_99x", agent: "Agent-110", route: "postgres://prod", reason: "Blocked: Tenant scope violation" },
    { id: "req_88y", agent: "Agent-112", route: "/api/v1/rag/memory/retrieve", reason: "Blocked: PHI Data detected in chunk" },
  ];

  return (
    <Card className="flex flex-col h-full border-accent-red/30 bg-accent-red/5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="text-accent-red" size={18} />
          <h2 className="text-lg font-medium text-white">SEKED Chokepoint Console</h2>
        </div>
        <button className="bg-accent-red hover:bg-accent-red/80 text-white text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1 shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-all">
          <Zap size={14} />
          GLOBAL KILL SWITCH
        </button>
      </div>
      <p className="text-sm text-ink-300 mb-4">Rule of Law: Real-time gateway visualizer blocking unauthorized execution before sandboxing.</p>
      
      <div className="flex-1 space-y-4">
        {/* Real Backend Data Segment */}
        {error && <ErrorBox error={error} title="Failed to load SEKED Metrics" />}
        {agents && agents.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-ink-300 uppercase tracking-wider mb-2">Live Execution Confidence</h3>
            <div className="grid grid-cols-2 gap-2">
              {agents.slice(0, 4).map((agent: any) => (
                <div key={agent.agent_id} className="p-2 bg-bg-900 border border-ink-800 rounded flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-white truncate max-w-[120px]" title={agent.name}>{agent.name}</span>
                    <span className={`text-[10px] px-1 rounded ${agent.ratios?.sigma >= 5 ? 'bg-accent-green/20 text-accent-green' : 'bg-accent-yellow/20 text-accent-yellow'}`}>
                      &Sigma; {agent.ratios?.sigma || 0}
                    </span>
                  </div>
                  <div className="text-[10px] text-ink-400 flex items-center gap-1">
                     <Activity size={10} className="text-accent-blue" />
                     {agent.directive?.action_type || agent.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Demo Blocked Segment */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-ink-300 uppercase tracking-wider mb-2">Recent Policy Interventions</h3>
          {mockBlocks.map(block => (
            <div key={block.id} className="p-3 bg-bg-900 border border-accent-red/20 rounded-lg flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">{block.agent} <span className="text-ink-400 font-normal">attempted access to</span> {block.route}</span>
                <span className="text-xs bg-accent-red/20 text-accent-red px-1.5 rounded">DENIED</span>
              </div>
              <div className="text-xs text-accent-red flex items-center gap-1">
                 <ShieldAlert size={12}/> {block.reason}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
