"use client";

import clsx from "clsx";
import { api } from "@/lib/api";
import Shell from "@/components/Shell";
import TierGate from "@/components/TierGate";
import { useApi } from "@/hooks/useApi";
import { Card, PageHeader, Skeleton, Table } from "@/components/ui";
import { unwrapList } from "@/types/api";

export default function WorkspacePage() {
  const overview = useApi<any>("/api/v1/workspace/overview");
  const models = useApi<any>("/api/v1/workspace/models");
  const providers = useApi<any>("/api/v1/workspace/providers");
  const integrations = useApi<any>("/api/v1/workspace/integrations");
  const obs = useApi<any>("/api/v1/workspace/observability");

  const o = overview.data || {};

  return (
    <Shell>
      <TierGate required="starter" feature="Workspace Settings">
        <PageHeader title="Workspace Settings" subtitle="Models, providers, integrations, and observability config." />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="lg:col-span-2">
            <div className="text-sm font-medium mb-3">Sovereign Governance Vertical</div>
            <p className="text-xs text-ink-400 mb-4">
              Select your organization&apos;s industry vertical to automatically load optimized governance policy packs, risk tiers, and compliance schemas.
            </p>
            {overview.isLoading ? <Skeleton className="h-28 w-full" /> :
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {[
                  { id: "generic", label: "Sovereign AI Hub", desc: "General purpose zero-trust AI orchestration.", icon: "Layers", badge: "Core" },
                  { id: "finance", label: "Fintech & Finance", desc: "Hard budget caps, ledger validation, PCI-DSS.", icon: "Coins", badge: "FinOps" },
                  { id: "healthcare", label: "Healthcare & Life", desc: "PII redaction, HIPAA filters, clinical checks.", icon: "Shield", badge: "PII" },
                  { id: "defense", label: "Defense & Intel", desc: "Air-gapped metrics, sovereign key attestation.", icon: "Lock", badge: "HighSec" },
                  { id: "energy", label: "Energy & Climate", desc: "Carbon emission projections, grid latencies.", icon: "Activity", badge: "Green" },
                ].map((v) => {
                  const active = (o.industry || "generic") === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={async () => {
                        try {
                          await api("/api/v1/workspace/settings", {
                            method: "PATCH",
                            body: { industry: v.id }
                          });
                          overview.mutate();
                        } catch (e) {
                          console.error("Failed to update vertical:", e);
                        }
                      }}
                      className={clsx(
                        "flex flex-col text-left p-3.5 rounded-xl border transition group cursor-pointer",
                        active 
                          ? "bg-brand-500/10 border-brand-500/40 text-brand-400 shadow-[0_0_15px_rgba(0,200,255,0.05)]" 
                          : "bg-white/[0.01] border-border hover:border-brand-500/20 text-ink-300"
                      )}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <span className="text-xs font-bold font-mono tracking-wide">{v.label}</span>
                        <span className={clsx(
                          "text-[9px] px-1.5 py-0.5 rounded font-black tracking-wider uppercase leading-none",
                          active ? "bg-brand-500/20 text-brand-400" : "bg-white/5 text-ink-500 group-hover:text-ink-300"
                        )}>{v.badge}</span>
                      </div>
                      <span className="text-[10px] text-ink-500 leading-normal">{v.desc}</span>
                    </button>
                  );
                })}
              </div>
            }
          </Card>
          <Card>
            <div className="text-sm font-medium mb-2">Observability</div>
            <pre className="text-xs bg-bg-900 p-3 rounded-md overflow-x-auto">{JSON.stringify(obs.data, null, 2)}</pre>
          </Card>
          <Card className="p-0">
            <div className="p-5 pb-3 text-sm font-medium">Models</div>
            {models.isLoading ? <div className="p-5"><Skeleton className="h-32 w-full" /></div> :
              <Table rows={unwrapList<any>(models.data)} rowKey={(r) => r.id || r.model_id || r.name} empty="No models" columns={[
                { key: "name", header: "Model", render: (r) => r.name || r.id },
                { key: "provider", header: "Provider", render: (r) => r.provider },
                { key: "status", header: "Status", render: (r) => r.status || (r.deployed ? "deployed" : "—") },
              ]} />
            }
          </Card>
          <Card className="p-0">
            <div className="p-5 pb-3 text-sm font-medium">Providers</div>
            {providers.isLoading ? <div className="p-5"><Skeleton className="h-32 w-full" /></div> :
              <Table rows={unwrapList<any>(providers.data)} rowKey={(r) => r.id || r.name} empty="No providers" columns={[
                { key: "name", header: "Provider", render: (r) => r.name },
                { key: "region", header: "Region", render: (r) => r.region || "—" },
                { key: "status", header: "Status", render: (r) => r.status },
              ]} />
            }
          </Card>
          <Card className="lg:col-span-2 p-0">
            <div className="p-5 pb-3 text-sm font-medium">Integrations</div>
            {integrations.isLoading ? <div className="p-5"><Skeleton className="h-32 w-full" /></div> :
              <Table rows={unwrapList<any>(integrations.data)} rowKey={(r) => r.id || r.name} empty="No integrations" columns={[
                { key: "name", header: "Integration", render: (r) => r.name },
                { key: "status", header: "Status", render: (r) => r.status || (r.connected ? "connected" : "—") },
              ]} />
            }
          </Card>
        </div>
      </TierGate>
    </Shell>
  );
}
