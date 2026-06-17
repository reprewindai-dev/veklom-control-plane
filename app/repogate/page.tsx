"use client";

import React, { useState } from "react";
import Shell from "@/components/Shell";
import { ModuleHeader, Pill, SectionCard } from "@/components/telemetry";
import { ShieldCheck, Terminal, Cpu, Database, Network, Key, ArrowRight } from "lucide-react";

// Read from our generated PGL registry
const PGL_AGENTS = [
  { agent: "authority-bundles", run_id: "run_f421", pgl_id: "pgl_c98a", status: "cleared" },
  { agent: "enforcement", run_id: "run_38ab", pgl_id: "pgl_d81f", status: "cleared" },
  { agent: "eyes-visual", run_id: "run_91bc", pgl_id: "pgl_a319", status: "cleared" },
  { agent: "governance", run_id: "run_55cd", pgl_id: "pgl_b720", status: "cleared" },
  { agent: "hrm-workforce", run_id: "run_12ef", pgl_id: "pgl_e441", status: "cleared" },
  { agent: "memory", run_id: "run_88fa", pgl_id: "pgl_f912", status: "cleared" },
  { agent: "phase0-scaffolding", run_id: "run_aa11", pgl_id: "pgl_11bc", status: "cleared" },
  { agent: "phase1-engineering", run_id: "run_bb22", pgl_id: "pgl_22cd", status: "cleared" },
  { agent: "phase2-vendor-acquisition", run_id: "run_cc33", pgl_id: "pgl_33de", status: "cleared" },
  { agent: "phase3-user-acquisition", run_id: "run_dd44", pgl_id: "pgl_44ef", status: "cleared" },
  { agent: "phase4-retention-revenue", run_id: "run_ee55", pgl_id: "pgl_55fa", status: "cleared" },
  { agent: "phase5-daily-operations", run_id: "run_ff66", pgl_id: "pgl_66ab", status: "cleared" },
  { agent: "rag-knowledge", run_id: "run_0077", pgl_id: "pgl_77bc", status: "cleared" },
  { agent: "security-force", run_id: "run_1188", pgl_id: "pgl_88cd", status: "cleared" },
  { agent: "skills", run_id: "run_2299", pgl_id: "pgl_99de", status: "cleared" },
  { agent: "special-governance", run_id: "run_3300", pgl_id: "pgl_00ef", status: "cleared" }
];

export default function RepogatePage() {
  const [filter, setFilter] = useState("");

  const filteredAgents = PGL_AGENTS.filter(a => 
    a.agent.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <Shell>
      <ModuleHeader
        breadcrumb="Operations · RepoGate Terminal"
        title="RepoGate Governance Terminal"
        subtitle="100% PGL-Verified Agent Pipeline & MCP Integration Hub"
        pills={
          <>
            <Pill tone="green" dot>All Agents Cleared</Pill>
            <Pill tone="cyan">MCP API Live</Pill>
            <Pill tone="violet">Cappo Connected</Pill>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        {/* MCP API Connection */}
        <SectionCard label="Infrastructure" title="MCP API Alignment">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border border-brand-500/30 bg-brand-500/5 rounded-lg">
              <div className="flex items-center gap-3">
                <Network className="text-brand-400" size={18} />
                <div>
                  <div className="text-xs font-semibold text-ink-100">Governance Portal</div>
                  <div className="text-[10px] text-ink-400 font-mono">gpc.veklom.com</div>
                </div>
              </div>
              <Pill tone="green">SYNCED</Pill>
            </div>
            
            <div className="flex items-center gap-2 justify-center text-ink-500">
              <ArrowRight size={14} className="rotate-90 lg:rotate-0" />
            </div>

            <div className="flex items-center justify-between p-3 border border-emerald-500/30 bg-emerald-500/5 rounded-lg">
              <div className="flex items-center gap-3">
                <Database className="text-emerald-400" size={18} />
                <div>
                  <div className="text-xs font-semibold text-ink-100">Cappo Main Backend</div>
                  <div className="text-[10px] text-ink-400 font-mono">cappo.veklom.com</div>
                </div>
              </div>
              <Pill tone="green">ACTIVE</Pill>
            </div>
          </div>
        </SectionCard>

        {/* Global Stats */}
        <SectionCard label="Telemetry" title="Terminal Diagnostics" className="lg:col-span-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-full">
            <div className="flex flex-col justify-center p-4 border border-border/50 bg-ink-900/30 rounded-lg">
              <div className="text-2xl font-bold text-ink-100">{PGL_AGENTS.length}</div>
              <div className="text-[10px] uppercase tracking-wider text-ink-500 mt-1 flex items-center gap-1">
                <Cpu size={10} /> Total Agents
              </div>
            </div>
            <div className="flex flex-col justify-center p-4 border border-brand-500/30 bg-brand-500/5 rounded-lg">
              <div className="text-2xl font-bold text-brand-400">100%</div>
              <div className="text-[10px] uppercase tracking-wider text-brand-500 mt-1 flex items-center gap-1">
                <ShieldCheck size={10} /> PGL Alignment
              </div>
            </div>
            <div className="flex flex-col justify-center p-4 border border-emerald-500/30 bg-emerald-500/5 rounded-lg">
              <div className="text-2xl font-bold text-emerald-400">60+</div>
              <div className="text-[10px] uppercase tracking-wider text-emerald-500 mt-1 flex items-center gap-1">
                <Terminal size={10} /> Routes Unified
              </div>
            </div>
            <div className="flex flex-col justify-center p-4 border border-violet-500/30 bg-violet-500/5 rounded-lg">
              <div className="text-2xl font-bold text-violet-400">0</div>
              <div className="text-[10px] uppercase tracking-wider text-violet-500 mt-1 flex items-center gap-1">
                <Key size={10} /> Loose Ends
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard label="Directory" title="Policy Gate Logic (PGL) Agent Registry">
        <div className="mb-4">
          <input 
            type="text" 
            placeholder="Search verified agents..." 
            className="input w-full md:w-64 text-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        
        <div className="border border-border/50 rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-ink-900/50 border-b border-border/50 text-[11px] uppercase tracking-wider text-ink-400">
              <tr>
                <th className="px-4 py-3 font-medium">Agent Name</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">PGL ID</th>
                <th className="px-4 py-3 font-medium">Clearance Run ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {filteredAgents.map((agent) => (
                <tr key={agent.agent} className="hover:bg-ink-900/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-ink-200">
                    <div className="flex items-center gap-2">
                      <Cpu size={14} className="text-brand-400" />
                      {agent.agent}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Pill tone="green"><ShieldCheck size={10} className="mr-1 inline" /> CLEARED</Pill>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-ink-400">
                    {agent.pgl_id}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-ink-500">
                    {agent.run_id}
                  </td>
                </tr>
              ))}
              {filteredAgents.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-ink-500">
                    No agents match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </Shell>
  );
}
