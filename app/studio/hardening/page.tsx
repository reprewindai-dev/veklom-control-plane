import { PageHeader, Card } from "@/components/ui";
import { CheckCircle2, Shield, Lock, Activity, DollarSign, Code, Zap } from "lucide-react";

export default function ProductionHardening() {
  return (
    <div className="space-y-8 animate-fade-up">
      <PageHeader 
        title="Production Hardening Status" 
        subtitle="Canonical Reference: Tracking the invariants required for Sovereign AI execution."
      />
      
      <div className="grid gap-6">
        <Card className="border-brand-500/20 bg-black/40">
          <div className="flex items-start gap-4 p-6">
            <div className="w-12 h-12 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 shrink-0">
              <Shield size={24} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-bold text-white">1. Unified PGL Identity</h3>
                <span className="flex items-center gap-1.5 text-brand-400 text-sm font-medium bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/30">
                  <CheckCircle2 size={16} /> Enforced
                </span>
              </div>
              <p className="text-ink-300 text-sm mb-4">
                Identity is no longer hand-wavy. Governance, Lineage, Evidence, and Genome are all wired into a single canonical PGL profile. Quarantine, kill-switches, and budgets all speak the exact same ID.
              </p>
            </div>
          </div>
        </Card>

        <Card className="border-brand-500/20 bg-black/40">
          <div className="flex items-start gap-4 p-6">
            <div className="w-12 h-12 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 shrink-0">
              <Lock size={24} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-bold text-white">2. RLS Isolation</h3>
                <span className="flex items-center gap-1.5 text-brand-400 text-sm font-medium bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/30">
                  <CheckCircle2 size={16} /> Enforced
                </span>
              </div>
              <p className="text-ink-300 text-sm mb-4">
                `app.current_tenant_id` is injected into the session natively. Cross-tenant leaks are cut off at the database level. "Even if the router misbehaves, PostgreSQL says no."
              </p>
            </div>
          </div>
        </Card>

        <Card className="border-brand-500/20 bg-black/40">
          <div className="flex items-start gap-4 p-6">
            <div className="w-12 h-12 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 shrink-0">
              <Activity size={24} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-bold text-white">3. Evidence Sealing (SEKED)</h3>
                <span className="flex items-center gap-1.5 text-brand-400 text-sm font-medium bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/30">
                  <CheckCircle2 size={16} /> Enforced
                </span>
              </div>
              <p className="text-ink-300 text-sm mb-4">
                Telemetry reflects reality. Confidence, resistance, and stability are deterministic aggregations over cryptographically sealed EvidencePack events, not RNG metrics.
              </p>
            </div>
          </div>
        </Card>

        <Card className="border-brand-500/20 bg-black/40">
          <div className="flex items-start gap-4 p-6">
            <div className="w-12 h-12 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 shrink-0">
              <DollarSign size={24} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-bold text-white">4. x402 Ledger Enforcement</h3>
                <span className="flex items-center gap-1.5 text-brand-400 text-sm font-medium bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/30">
                  <CheckCircle2 size={16} /> Enforced
                </span>
              </div>
              <p className="text-ink-300 text-sm mb-4">
                Financial governance is based on immutable ledger state (SettlementEntry), not in-memory counters. Runtime budget enforcement terminates access based on authoritative spend.
              </p>
            </div>
          </div>
        </Card>

        <Card className="border-brand-500/20 bg-black/40">
          <div className="flex items-start gap-4 p-6">
            <div className="w-12 h-12 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 shrink-0">
              <Code size={24} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-bold text-white">5. Typed Contracts</h3>
                <span className="flex items-center gap-1.5 text-brand-400 text-sm font-medium bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/30">
                  <CheckCircle2 size={16} /> Enforced
                </span>
              </div>
              <p className="text-ink-300 text-sm mb-4">
                Separate request and response models via Pydantic. Internal ORM logic never leaks to the dashboard.
              </p>
            </div>
          </div>
        </Card>

        <Card className="border-brand-500/20 bg-black/40">
          <div className="flex items-start gap-4 p-6">
            <div className="w-12 h-12 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 shrink-0">
              <Zap size={24} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-bold text-white">6. Adaptive Polling</h3>
                <span className="flex items-center gap-1.5 text-brand-400 text-sm font-medium bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/30">
                  <CheckCircle2 size={16} /> Enforced
                </span>
              </div>
              <p className="text-ink-300 text-sm mb-4">
                The dashboard is a real cockpit. Visibility-aware SWR polling, keepPreviousData, and exponential backoff prevent thundering herds while keeping the operator view live.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
