"use client";

import Shell from "@/components/Shell";
import { useApi } from "@/hooks/useApi";
import { Skeleton } from "@/components/ui";
import { ModuleHeader, SectionCard, Pill, KV, ProgressBar, BarChart, fmtNum, ACCENT } from "@/components/telemetry";
import { CheckCircle2, AlertTriangle, XCircle, Activity, Cpu, MemoryStick, HardDrive, Wifi } from "lucide-react";

function statusTone(s?: string) {
  const v = (s || "").toLowerCase();
  if (["up", "operational", "healthy", "pass"].includes(v)) return "green";
  if (["degraded", "warning"].includes(v)) return "amber";
  if (["down", "outage", "error", "fail"].includes(v)) return "red";
  return "neutral";
}
function StatusIcon({ s }: { s?: string }) {
  const t = statusTone(s);
  if (t === "green") return <CheckCircle2 size={16} className="text-accent-green" />;
  if (t === "amber") return <AlertTriangle size={16} className="text-brand-400" />;
  if (t === "red") return <XCircle size={16} className="text-accent-red" />;
  return <Activity size={16} className="text-ink-400" />;
}

function ResTile({ icon, label, percent, raw }: { icon: React.ReactNode; label: string; percent?: number; raw?: string }) {
  const color = percent == null ? ACCENT.violet : percent > 85 ? ACCENT.red : percent > 65 ? ACCENT.amber : ACCENT.green;
  return (
    <div className="card p-3">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-ink-400 mb-2">{icon} {label}</div>
      <div className="text-[18px] font-semibold mb-1.5">{raw ?? `${percent?.toFixed(1)}%`}</div>
      {percent != null && <ProgressBar percent={percent} color={color} />}
    </div>
  );
}

export default function StatusPage() {
  const uptime = useApi<any>("/api/v1/platform/uptime");
  const metrics = useApi<any>("/api/v1/monitoring/metrics");
  const health = useApi<any>("/api/v1/monitoring/health");
  const history = useApi<any>("/api/v1/monitoring/metrics/history");

  const u = uptime.data || {};
  const m = metrics.data || {};
  const comps = health.data?.components || {};
  const services: any[] = u.services || [];
  const points: any[] = history.data?.points || [];

  return (
    <Shell>
      <ModuleHeader
        breadcrumb="Operations · System Status"
        title="Platform status"
        subtitle={u.headline || "Live health of every governed runtime system."}
        pills={
          uptime.isLoading ? undefined : (
            <>
              <Pill tone={statusTone(u.overall_status) as any} dot>{(u.overall_status || "operational").toUpperCase()}</Pill>
              <Pill tone="neutral">{u.uptime_percent ?? "—"}% uptime · {u.window_days ?? 90}d</Pill>
              <Pill tone={(u.active_incidents ?? 0) > 0 ? "amber" : "green"}>{u.active_incidents ?? 0} active incidents</Pill>
              {u.simulated ? <Pill tone="violet">SIMULATED DATA</Pill> : <Pill tone="green">LIVE DATA</Pill>}
            </>
          )
        }
      />

      {/* Headline metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <ResTile icon={<Cpu size={13} />} label="CPU" percent={m.cpu_percent} />
        <ResTile icon={<MemoryStick size={13} />} label="Memory" percent={m.memory_percent} />
        <ResTile icon={<HardDrive size={13} />} label="Disk" percent={m.disk_percent} />
        <ResTile icon={<Wifi size={13} />} label="Calls (5m)" raw={fmtNum(m.traffic_samples ?? 0)} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <SectionCard label="Throughput" title="Live gateway" className="lg:col-span-1">
          <KV k="Requests / sec" v={fmtNum(m.requests_per_second ?? 0)} />
          <KV k="Avg latency" v={`${m.avg_latency_ms ?? "—"} ms`} />
          <KV k="Error rate" v={`${((m.error_rate ?? 0) * 100).toFixed(3)}%`} />
          <KV k="Sample window" v={`${m.traffic_window_minutes ?? 5} min`} />
          <KV k="Checks passed (24h)" v={fmtNum(u.checks_passed_24h ?? 0)} />
          <KV k="Avg response" v={`${u.avg_response_time_ms ?? "—"} ms`} />
        </SectionCard>

        <SectionCard label="Components" title="Internal health" className="lg:col-span-2" bodyClassName="grid sm:grid-cols-2 gap-2">
          {health.isLoading ? <Skeleton className="h-24" /> : Object.entries(comps).map(([name, c]: [string, any]) => (
            <div key={name} className="flex items-center gap-2.5 card p-3">
              <StatusIcon s={c.status} />
              <div className="min-w-0">
                <div className="text-[13px] text-ink-50 capitalize">{name.replace(/_/g, " ")}</div>
                <div className="text-[11px] text-ink-600">{c.latency_ms != null ? `${c.latency_ms}ms` : c.status}</div>
              </div>
              <Pill tone={statusTone(c.status) as any} className="ml-auto">{c.status}</Pill>
            </div>
          ))}
        </SectionCard>
      </div>

      {/* Requests history */}
      <SectionCard label="Last 24h" title="Requests per minute" className="mb-4">
        {history.isLoading ? <Skeleton className="h-48" /> : <BarChart points={points} valueKey="requests_per_min" labelKey="ts" color={ACCENT.violet} height={200} />}
      </SectionCard>

      {/* Services */}
      <SectionCard label="Services" title="Governed runtime systems" bodyClassName="space-y-2">
        {uptime.isLoading ? <Skeleton className="h-40" /> : services.map((s) => (
          <div key={s.slug} className="flex items-center gap-3 card p-3">
            <StatusIcon s={s.status} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium text-ink-50">{s.service}</span>
                <span className="text-[10px] text-ink-600 uppercase tracking-wider">{s.region}</span>
              </div>
              <div className="text-[11px] text-ink-500 truncate">{s.description}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[12px] text-ink-200 font-mono tabular-nums">{s.uptime_90d}%</div>
              <div className="text-[10px] text-ink-600">{s.response_time_ms}ms · 90d</div>
            </div>
            <Pill tone={statusTone(s.status) as any}>{s.status}</Pill>
          </div>
        ))}
      </SectionCard>

      {/* Incidents */}
      {!!(u.incidents || []).length && (
        <SectionCard label="History" title="Recent incidents" className="mt-4" bodyClassName="space-y-2">
          {u.incidents.map((inc: any, i: number) => (
            <div key={i} className="flex items-start gap-3 py-1.5 border-b border-border/50 last:border-0">
              <Pill tone={inc.status === "resolved" ? "green" : "neutral"}>{inc.status}</Pill>
              <div className="min-w-0">
                <div className="text-[12.5px] text-ink-100">{inc.title}</div>
                <div className="text-[11px] text-ink-600">{inc.date}{inc.severity ? ` · ${inc.severity}` : ""}</div>
              </div>
            </div>
          ))}
        </SectionCard>
      )}
    </Shell>
  );
}
