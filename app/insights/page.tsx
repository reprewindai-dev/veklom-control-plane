"use client";

import Shell from "@/components/Shell";
import TierGate from "@/components/TierGate";
import { useApi } from "@/hooks/useApi";
import { Skeleton } from "@/components/ui";
import { ModuleHeader, SectionCard, StatTile, Pill, ProgressBar, KV, fmtUsd, fmtNum, ACCENT } from "@/components/telemetry";
import { Lightbulb, PiggyBank, TrendingUp, Sparkles } from "lucide-react";

const SAVINGS_KEYS = [
  { k: "routing_savings", label: "Smart routing", color: ACCENT.violet },
  { k: "caching_savings", label: "Response caching", color: ACCENT.cyan },
  { k: "policy_savings", label: "Policy gating", color: ACCENT.green },
];

export default function InsightsPage() {
  const summary = useApi<any>("/api/v1/insights/summary");
  const savings = useApi<any>("/api/v1/insights/savings");
  const projected = useApi<any>("/api/v1/insights/savings/projected");
  const suggestions = useApi<any>("/api/v1/suggestions");
  const explain = useApi<any>("/api/v1/explain/cost");

  const s = summary.data || {};
  const sv = savings.data || {};
  const pj = projected.data || {};
  const sug: any[] = Array.isArray(suggestions.data) ? suggestions.data : [];
  const ex = explain.data || {};
  const breakdown: Record<string, number> = ex.breakdown || {};
  const topModels: any[] = s.top_models || [];

  return (
    <Shell>
      <TierGate required="pro" feature="Insights">
        <ModuleHeader
          breadcrumb="Operations · Insights"
          title="Savings & opportunities"
          subtitle="Realized savings and forecasted opportunities from routing, caching, and policy controls."
          pills={
            <Pill tone="green" dot>{Math.round((pj.confidence ?? 0) * 100)}% forecast confidence</Pill>
          }
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <StatTile label="Saved (30d)" icon={<PiggyBank size={14} />} value={fmtUsd(sv.total_saved_usd ?? 0)} />
          <StatTile label="Projected / mo" icon={<TrendingUp size={14} />} value={fmtUsd(pj.projected_monthly_savings ?? 0)} />
          <StatTile label="Spend (30d)" value={fmtUsd(s.total_cost_30d ?? 0)} />
          <StatTile label="Requests (30d)" value={fmtNum(s.total_requests_30d ?? 0)} />
        </div>

        <div className="grid lg:grid-cols-3 gap-4 mb-4">
          <SectionCard label="Savings" title="Where it comes from" className="lg:col-span-1">
            {savings.isLoading ? <Skeleton className="h-32" /> : (
              <div className="space-y-3">
                {SAVINGS_KEYS.map((c) => {
                  const total = sv.total_saved_usd || 1;
                  const v = sv[c.k] ?? 0;
                  return (
                    <div key={c.k}>
                      <div className="flex justify-between text-[12px] mb-1"><span className="text-ink-200">{c.label}</span><span className="font-mono">{fmtUsd(v)}</span></div>
                      <ProgressBar percent={(v / total) * 100} color={c.color} />
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>

          <SectionCard label="Cost drivers" title={ex.top_driver ? `Top driver: ${ex.top_driver}` : "Cost breakdown"} className="lg:col-span-2">
            {explain.isLoading ? <Skeleton className="h-32" /> : (
              <>
                <p className="text-[12.5px] text-ink-300 mb-3">{ex.explanation}</p>
                <div className="space-y-2">
                  {Object.entries(breakdown).map(([k, v]) => (
                    <div key={k}>
                      <div className="flex justify-between text-[12px] mb-1"><span className="capitalize text-ink-200">{k}</span><span className="font-mono">{(v * 100).toFixed(0)}%</span></div>
                      <ProgressBar percent={v * 100} color={ACCENT.amber} />
                    </div>
                  ))}
                </div>
                {ex.tip && <div className="flex items-start gap-2 mt-3 text-[12px] text-brand-400"><Lightbulb size={14} className="mt-0.5 shrink-0" />{ex.tip}</div>}
              </>
            )}
          </SectionCard>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <SectionCard label="Recommendations" title="Suggested optimizations" bodyClassName="space-y-2">
            {suggestions.isLoading ? <Skeleton className="h-24" /> : sug.length === 0 ? (
              <div className="text-ink-500 text-[13px]">No suggestions right now - you&apos;re well optimized.</div>
            ) : sug.map((g) => (
              <div key={g.id} className="flex items-center gap-3 card p-3">
                <Sparkles size={15} className="text-brand-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] text-ink-50">{g.title}</div>
                  <div className="text-[10px] text-ink-600 uppercase tracking-wider">{(g.type || "").replace(/_/g, " ")}</div>
                </div>
                {g.impact_usd != null && <Pill tone="green">+{fmtUsd(g.impact_usd)}/mo</Pill>}
              </div>
            ))}
          </SectionCard>

          <SectionCard label="Models" title="Top models (today)" bodyClassName="space-y-2">
            {summary.isLoading ? <Skeleton className="h-24" /> : topModels.length === 0 ? (
              <div className="text-ink-500 text-[13px]">No model activity today.</div>
            ) : topModels.map((m, i) => (
              <div key={i} className="flex items-center gap-3 card p-3">
                <span className="font-mono text-[12px] text-brand-400">{m.model}</span>
                <span className="ml-auto text-[12px] text-ink-300">{fmtNum(m.calls)} calls</span>
              </div>
            ))}
            <div className="card p-3 mt-1">
              <KV k="Avg latency" v={`${s.avg_latency_ms ?? "—"} ms`} />
              <KV k="Error rate" v={`${s.error_rate_percent ?? 0}%`} />
              <KV k="Peak hour reqs" v={fmtNum(s.peak_hour_requests ?? 0)} />
            </div>
          </SectionCard>
        </div>
      </TierGate>
    </Shell>
  );
}
