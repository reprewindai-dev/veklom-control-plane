"use client";

import Shell from "@/components/Shell";
import { useApi } from "@/hooks/useApi";
import { ModuleHeader, Pill, StatTile, fmtNum } from "@/components/telemetry";
import { BookOpen, Play, ShieldCheck, Lock } from "lucide-react";

export default function GpcPage() {
  const stats = useApi<any>("/api/v1/gpc/stats");
  const s = stats.data || {};

  // Default to the external render URL if env var is missing
  const uacpUrl = process.env.NEXT_PUBLIC_UACP_URL || "https://uacpv3.onrender.com";

  return (
    <Shell>
      <ModuleHeader
        breadcrumb="GPC · Governed Plan Compiler"
        title="Universal Agentic Control Plane V3"
        subtitle="Compile agent intent into deterministic, policy-checked execution plans with SHA-256 sealed evidence."
        pills={
          <>
            <Pill tone="green" dot>Backend live</Pill>
            <Pill tone="neutral">UACP V3 Engine</Pill>
            <Pill tone="cyan">Decision Frames</Pill>
            <Pill tone="amber">Evidence Sealed</Pill>
          </>
        }
      />
      {/* Stat row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatTile label="Plans compiled" icon={<BookOpen size={12} />} loading={stats.isLoading}
          value={fmtNum(s.plans_total ?? 0)} />
        <StatTile label="Runs executed" icon={<Play size={12} />} loading={stats.isLoading}
          value={fmtNum(s.runs_total ?? 0)} />
        <StatTile label="Decisions approved" icon={<ShieldCheck size={12} />} loading={stats.isLoading}
          value={fmtNum(s.decisions?.approved ?? 0)} spark={[]} sparkColor="#10b981" />
        <StatTile label="Decisions blocked" icon={<Lock size={12} />} loading={stats.isLoading}
          value={fmtNum(s.decisions?.blocked ?? 0)} spark={[]} sparkColor="#ef4444" />
      </div>
      <div className="w-full h-[calc(100vh-250px)] rounded-xl overflow-hidden border border-border shadow-md relative">
        {/* We iframe the standalone UACP V3 engine directly here */}
        <iframe 
          src={uacpUrl} 
          className="w-full h-full border-0" 
          title="UACP V3 Engine"
          allow="clipboard-write"
        />
      </div>
    </Shell>
  );
}
