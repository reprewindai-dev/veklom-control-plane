"use client";

import Link from "next/link";
import Shell from "@/components/Shell";
import { useApi } from "@/hooks/useApi";
import { ErrorBox } from "@/components/ui";
import {
  ACCENT, DualLineChart, Pill, ProgressBar, RoutePill, SectionCard,
  StatTile, fmtNum, fmtUsd, statusTone,
} from "@/components/telemetry";
import { Activity, Cpu, DollarSign, FileCheck2, Gauge, Layers, Sparkles, ShieldCheck, ArrowUpRight, Fingerprint } from "lucide-react";
import { AuthorityPanel } from "@/components/AuthorityPanel";

export default function DashboardPage() {
  const overview = useApi<any>("/api/v1/workspace/overview");
  const o = overview.data || {};
  const loading = overview.isLoading;

  const history: any[] = Array.isArray(o.routing?.history) ? o.routing.history : [];
  const vol = history.map((h) => (Number(h.hetzner) || 0) + (Number(h.aws) || 0));
  const recent: any[] = Array.isArray(o.recent_runs) ? o.recent_runs : [];
  const policy: any[] = Array.isArray(o.policy_events) ? o.policy_events : [];
  const alerts: any[] = Array.isArray(o.alerts) ? o.alerts : [];
  const auditLogs: any[] = Array.isArray(o.audit_logs) ? o.audit_logs : [];
  const fleet: any[] = Array.isArray(o.fleet) ? o.fleet : [];
  const breakdown: any[] = Array.isArray(o.spend_breakdown) ? o.spend_breakdown : [];
  const regions: any[] = Array.isArray(o.routing?.regions) ? o.routing.regions : [];

  return (
    <Shell>
      {/* Hero */}
      <div className="flex flex-col lg:flex-row lg:items-end gap-5 mb-6 animate-fade-up">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-[0.18em] text-ink-600">Workspace · Overview</div>
          <h1 className="text-[28px] font-semibold tracking-tight text-gradient mt-1">Sovereign control plane</h1>
          <p className="text-sm text-ink-400 mt-1.5 max-w-2xl">
            Every prompt routed, policed, and audited — across Hetzner primary and AWS burst — without leaving your perimeter.
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <Pill tone={overview.error ? "red" : "green"} dot>{overview.error ? "Backend error" : "Live backend connected"}</Pill>
            <Pill tone="neutral">SOC2-Ready</Pill>
            <Pill tone="neutral">HIPAA-Aware</Pill>
            <Pill tone="cyan">EU-Sovereign</Pill>
          </div>
        </div>
        <div className="lg:ml-auto flex items-center gap-2 shrink-0">
          <Link 
            href={o.plan === "free" || o.plan === "starter" || o.plan === "pro" ? "/subscriptions" : "/compliance"} 
            className="btn btn-ghost group relative"
          >
            <ShieldCheck size={15} /> 
            <span>Export evidence — Sovereign</span>
            {(o.plan === "free" || o.plan === "starter" || o.plan === "pro") && (
              <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-bg-800 border border-border text-[9px] text-brand-400 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                Requires Sovereign Tier
              </span>
            )}
          </Link>
          <Link href="/routing" className="btn btn-primary"><Sparkles size={15} /> Smart routing</Link>
        </div>
      </div>

      {overview.error && <div className="mb-5"><ErrorBox message={overview.error.message} /></div>}

      {/* Stat tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-5">
        <StatTile label="Requests / min" icon={<Activity size={12} />} loading={loading}
          value={fmtNum(o.requests_per_min)} spark={vol} sparkColor={ACCENT.amber} />
        <StatTile label="P50 latency" icon={<Gauge size={12} />} loading={loading}
          value={o.p50_latency_ms != null ? `${fmtNum(o.p50_latency_ms)} ms` : "—"} />
        <StatTile label="Tokens / sec" icon={<Cpu size={12} />} loading={loading}
          value={fmtNum(o.tokens_per_sec)} spark={vol} sparkColor={ACCENT.cyan} />
        <StatTile label="Spend today" icon={<DollarSign size={12} />} loading={loading}
          value={fmtUsd(o.spend_today_usd)} delta={o.spend_percent != null ? `${o.spend_percent}% cap` : undefined}
          spark={vol} sparkColor={ACCENT.green} />
        <StatTile label="Active models" icon={<Layers size={12} />} loading={loading}
          value={fmtNum(o.active_models ?? o.models_enabled)} />
        <StatTile label="Audit entries" icon={<FileCheck2 size={12} />} loading={loading}
          value={fmtNum(o.audit_entries)} delta="verified" deltaTone="up" spark={vol} sparkColor={ACCENT.violet} />
      </div>

      {/* Routing + Spend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <SectionCard className="lg:col-span-2" label="Routing · last 24h" title="Hetzner primary · AWS burst"
          actions={
            <div className="flex items-center gap-2">
              <Pill tone="amber">Hetzner {o.routing?.hetzner_percent ?? 0}%</Pill>
              <Pill tone="cyan">AWS {o.routing?.aws_percent ?? 0}%</Pill>
            </div>
          }>
          {loading ? <div className="skeleton h-[220px] rounded-lg" /> :
            <DualLineChart points={history} aKey="hetzner" bKey="aws" labelKey="hour" />}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-border">
            {regions.map((r, i) => (
              <div key={i}>
                <div className="flex items-center gap-1.5"><RoutePill route={r.route} /></div>
                <div className="text-sm font-semibold mt-1.5">{r.value}</div>
                <div className="text-[11px] text-ink-500">{r.sub}</div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard label="Spend · today" title={fmtUsd(o.spend_today_usd) + " of " + fmtUsd(o.spend_cap_usd)}
          actions={<Pill tone={statusTone(o.spend_status)}>{(o.spend_status || "—").toUpperCase()}</Pill>}>
          <ProgressBar percent={o.spend_percent ?? 0} color={ACCENT.amber} />
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-4">
            {breakdown.map((b, i) => (
              <div key={i}>
                <div className="text-[11px] text-ink-500">{b.label} <span className="text-ink-600">{b.percent}%</span></div>
                <div className="text-sm font-semibold tabular-nums">{fmtUsd(b.amount_usd, 2)}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-border space-y-1.5 text-xs">
            <Row k="Burn rate" v={`${fmtUsd(o.burn_rate_usd_per_min, 4)} / min`} />
            <Row k="Forecast EOD" v={`${fmtUsd(o.forecast_eod_usd)} (${o.spend_percent ?? 0}% cap)`} />
            <Row k="Remaining" v={fmtUsd(o.budget_remaining_usd)} />
          </div>
        </SectionCard>
      </div>

      {/* Recent runs + Policy interception */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
        <SectionCard className="lg:col-span-3" label="Recent runs · live" title="Per-call routing, latency, cost"
          actions={<Link href="/routing" className="text-xs text-brand-400 hover:underline inline-flex items-center gap-1">Routing <ArrowUpRight size={12} /></Link>}>
          {loading ? <div className="skeleton h-40 rounded-lg" /> : recent.length === 0 ? <Empty /> : (
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-ink-600 text-left">
                    <th className="font-medium px-1 pb-2">Model</th><th className="font-medium px-1 pb-2">Route</th>
                    <th className="font-medium px-1 pb-2 text-right">Latency</th><th className="font-medium px-1 pb-2 text-right">Tokens</th>
                    <th className="font-medium px-1 pb-2 text-right">Cost</th><th className="font-medium px-1 pb-2">Policy</th>
                    <th className="font-medium px-1 pb-2 text-right">When</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {recent.map((r, i) => (
                    <tr key={r.id || i} className="border-t border-border/60">
                      <td className="px-1 py-2.5 text-ink-100">{r.model}</td>
                      <td className="px-1 py-2.5"><RoutePill route={r.route} /></td>
                      <td className="px-1 py-2.5 text-right tabular-nums text-ink-300">{r.latency} ms</td>
                      <td className="px-1 py-2.5 text-right tabular-nums text-ink-300">{fmtNum(r.tokens)}</td>
                      <td className="px-1 py-2.5 text-right tabular-nums text-ink-300">{fmtUsd(r.cost, 5)}</td>
                      <td className="px-1 py-2.5"><Pill tone={statusTone(r.policy)}>{(r.policy || "—").toUpperCase()}</Pill></td>
                      <td className="px-1 py-2.5 text-right text-ink-500 whitespace-nowrap">{r.ts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        <SectionCard className="lg:col-span-2" label="Policy interception · live" title="Decision before execution"
          actions={<Pill tone="green" dot>Live</Pill>}>
          {loading ? <div className="skeleton h-40 rounded-lg" /> : policy.length === 0 ? <Empty /> : (
            <ul className="space-y-3.5">
              {policy.map((p, i) => (
                <li key={i} className="flex gap-3">
                  <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${p.tone === "warn" ? "bg-brand-400" : p.tone === "alert" ? "bg-accent-red" : "bg-accent-green"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[13px] text-ink-100 truncate">{p.title}</span>
                      <span className="text-[11px] text-ink-600 font-mono shrink-0">{p.t}</span>
                    </div>
                    <div className="text-[11px] text-ink-500 font-mono truncate">{p.body}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      {/* Alerts + Audit + Fleet */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard label="Alerts" title={`${alerts.length} open`}>
          {loading ? <div className="skeleton h-32 rounded-lg" /> : alerts.length === 0 ? <Empty msg="No open alerts" /> : (
            <ul className="space-y-3">
              {alerts.map((a, i) => (
                <li key={a.id || i} className="flex gap-2.5">
                  <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${statusTone(a.severity) === "red" ? "bg-accent-red" : "bg-brand-400"}`} />
                  <div className="min-w-0">
                    <div className="text-[13px] text-ink-100">{a.title}</div>
                    <div className="text-[10px] uppercase tracking-wider text-ink-600">{a.source} · {a.time}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard label="Audit trail · tamper-evident" title="Hash-chained"
          actions={<Pill tone="green">Verified</Pill>}>
          {loading ? <div className="skeleton h-32 rounded-lg" /> : auditLogs.length === 0 ? <Empty msg="No audit entries" /> : (
            <ul className="space-y-2.5 font-mono">
              {auditLogs.map((a, i) => (
                <li key={a.id || i} className="flex items-baseline justify-between gap-2 border-b border-border/50 pb-2 last:border-0">
                  <div className="min-w-0">
                    <div className="text-[12px] text-ink-100 truncate">{a.action}</div>
                    <div className="text-[10px] text-ink-600 truncate">{a.target} · {a.actor}</div>
                  </div>
                  <span className="text-[10px] text-brand-400/80 shrink-0">{a.hash}</span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard label="Fleet · models" title="Deployments">
          {loading ? <div className="skeleton h-32 rounded-lg" /> : fleet.length === 0 ? <Empty msg="No models deployed" /> : (
            <ul className="space-y-3">
              {fleet.map((f, i) => (
                <li key={f.id || i} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[13px] text-ink-100 truncate">{f.name}</div>
                    <div className="text-[10px] uppercase tracking-wider text-ink-600">{f.quant} · {f.replicas} replica{f.replicas === 1 ? "" : "s"}</div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <RoutePill route={f.route} />
                    <Pill tone="neutral">P50 {f.p50} ms</Pill>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      {/* Authority Panel — PGL Agent Authority Runtime */}
      <div className="mt-4">
        <SectionCard 
          label="Agent Authority" 
          title="PGL Birth Certificate & Chain"
          actions={
            <Link href="/onboarding/pgl" className="text-xs text-brand-400 hover:underline inline-flex items-center gap-1">
              <Fingerprint size={12} /> Manage
            </Link>
          }
        >
          <AuthorityPanel />
        </SectionCard>
      </div>
    </Shell>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-500">{k}</span>
      <span className="text-ink-200 font-mono tabular-nums">{v}</span>
    </div>
  );
}

function Empty({ msg = "No data yet" }: { msg?: string }) {
  return <div className="py-8 text-center text-sm text-ink-600">{msg}</div>;
}
