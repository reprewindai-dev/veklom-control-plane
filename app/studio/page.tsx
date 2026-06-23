import { PageHeader, Card } from "@/components/ui";
import { Shield, Activity, HardDrive, DollarSign, BarChart2, CheckCircle2 } from "lucide-react";
import { PglLineageTracker } from "@/components/studio/pgl-lineage-tracker";
import { SekedConsole } from "@/components/studio/seked-console";
import { AuditLedger } from "@/components/studio/audit-ledger";
import { ConvergeosPipeline } from "@/components/studio/convergeos-pipeline";
import { X402Tracker } from "@/components/studio/x402-tracker";
import { NexusLeaderboard } from "@/components/studio/nexus-leaderboard";
import { AutonomousFunnel } from "@/components/studio/AutonomousFunnel";
import { CopilotGuide } from "@/components/studio/CopilotGuide";

export default function StudioDashboard() {
  return (
    <div className="space-y-8 animate-fade-up relative">
      <CopilotGuide 
        title="Studio Control Plane"
        description="Welcome to your Sovereign AI cockpit. This is where mathematical truth replaces operational guesswork. Every panel here reads directly from cryptographically sealed ledger tables."
        benefits={[
          "Adaptive polling prevents dashboard lag and backend thundering herds.",
          "Self-learning models train autonomously, but ONLY on mathematically verified Gold-tier data.",
          "All spend and budget enforcement is immutable and cannot be bypassed by UI errors."
        ]}
      />
      
      <PageHeader 
        title="Sovereign Alignment" 
        subtitle="Real-time telemetry across the 6 pillars of AI governance. This console proves execution sovereignty for CISOs, Auditors, and FinOps."
        actions={
          <button className="btn btn-primary btn-sm flex items-center gap-1.5">
            <CheckCircle2 size={16} />
            Generate Compliance Report
          </button>
        }
      />
      
      {/* 3-Tier Autonomous Self Learning Funnel */}
      <div className="mb-8">
        <AutonomousFunnel />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pillar 1: PGL Identity & Forensics */}
        <PglLineageTracker />
        
        {/* Pillar 2: SEKED Chokepoint & Kill Switch */}
        <SekedConsole />
        
        {/* Pillar 3: Audit Sealing Ledger */}
        <AuditLedger />
        
        {/* Pillar 4: ConvergeOS Operational Integrity */}
        <ConvergeosPipeline />
        
        {/* Pillar 5: x402 FinOps Micropayment */}
        <X402Tracker />
        
        {/* Pillar 6: Nexus BYOS Certification */}
        <NexusLeaderboard />
      </div>
    </div>
  );
}
