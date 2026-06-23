"use client";
import { Card, StatCard } from "@/components/ui";
import { Layers } from "lucide-react";

export function ConvergeosPipeline() {
  return (
    <Card className="flex flex-col h-full border-border">
      <div className="flex items-center gap-2 mb-4">
        <Layers className="text-brand-400" size={18} />
        <h2 className="text-lg font-medium text-white">ConvergeOS Pipeline</h2>
      </div>
      <p className="text-sm text-ink-300 mb-6">Operational Integrity: Visualizing AI outputs passing or failing schema and quality consensus tests before reaching production.</p>
      
      <div className="grid grid-cols-2 gap-4 flex-1">
        <div className="flex flex-col gap-4">
          <StatCard label="Outputs Analyzed" value="14,209" hint="Last 24h" accent="text-white" />
          <StatCard label="Consensus Reached" value="98.2%" hint="Multi-agent agreement" accent="text-accent-green" />
        </div>
        <div className="flex flex-col gap-4">
          <StatCard label="Quarantined" value="241" hint="Malformed schema" accent="text-accent-red" />
          <StatCard label="Hallucinations Blocked" value="18" hint="Failed logic convergence" accent="text-accent-red" />
        </div>
      </div>
    </Card>
  );
}
