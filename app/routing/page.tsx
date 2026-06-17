"use client";

import { useState } from "react";
import Shell from "@/components/Shell";
import TierGate from "@/components/TierGate";
import { useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { Skeleton, Table, Button, ErrorBox } from "@/components/ui";
import {
  ModuleHeader, SectionCard, StatTile, Pill, Field, Select, KV, RoutePill, fmtUsd,
} from "@/components/telemetry";
import { unwrapList } from "@/types/api";
import { Network, Sparkles, Calculator } from "lucide-react";
import GradientFieldCanvas from "@/components/telemetry/GradientFieldCanvas";

const STRATEGIES = [
  { value: "cost_optimized", label: "Cost optimized — cheapest meeting quality floor" },
  { value: "quality_optimized", label: "Quality optimized — best within budget" },
  { value: "speed_optimized", label: "Speed optimized — fastest within constraints" },
  { value: "hybrid", label: "Hybrid — balanced cost/quality/speed" },
];
const PROVIDERS = ["ollama", "groq", "openai", "gemini", "huggingface", "anthropic"].map((p) => ({ value: p, label: p }));

export default function RoutingPage() {
  const rules = useApi<any>("/api/v1/routing");
  const economics = useApi<any>("/api/v1/routing/economics");
  const tier = useApi<any>("/api/v1/ai/routing/tier");
  const stack = useApi<any>("/api/v1/routing/stack");

  // Routing simulator
  const [strategy, setStrategy] = useState("cost_optimized");
  const [maxCost, setMaxCost] = useState("0.001");
  const [minQuality, setMinQuality] = useState("0.80");
  const [simBusy, setSimBusy] = useState(false);
  const [simErr, setSimErr] = useState<string>();
  const [sim, setSim] = useState<any>();

  async function runSim() {
    setSimBusy(true); setSimErr(undefined);
    try {
      const res = await api<any>("/api/v1/routing/test", {
        method: "POST",
        body: { operation_type: "inference", constraints: { strategy, max_cost: maxCost, min_quality: Number(minQuality) } },
      });
      setSim(res);
    } catch (e) { setSimErr((e as Error).message); } finally { setSimBusy(false); }
  }

  // Cost predictor
  const [provider, setProvider] = useState("openai");
  const [model, setModel] = useState("gpt-4o");
  const [text, setText] = useState("Summarize this contract clause in plain English.");
  const [costBusy, setCostBusy] = useState(false);
  const [costErr, setCostErr] = useState<string>();
  const [cost, setCost] = useState<any>();

  async function runCost() {
    setCostBusy(true); setCostErr(undefined);
    try {
      const res = await api<any>("/api/v1/cost/predict", {
        method: "POST",
        body: { operation_type: "inference", provider, model, input_text: text },
      });
      setCost(res);
    } catch (e) { setCostErr((e as Error).message); } finally { setCostBusy(false); }
  }

  const alts: any[] = Array.isArray(sim?.alternatives_considered) ? sim.alternatives_considered
    : Array.isArray(sim?.alternatives) ? sim.alternatives : [];
  const costAlts: any[] = Array.isArray(cost?.alternative_providers) ? cost.alternative_providers : [];

  return (
    <Shell>
      <TierGate required="pro" feature="Smart Routing">
        <ModuleHeader
          breadcrumb="Operations · Routing"
          title="Cost intelligence & routing"
          subtitle="Simulate provider selection, predict cost before you commit, and govern the model stack — Ollama-first with policy-gated cloud burst."
          pills={<><Pill tone="amber">Ollama primary</Pill><Pill tone="cyan">Groq fallback</Pill><Pill tone="green" dot>Circuit closed</Pill></>}
        />

        {/* Embedded Gradient Field Canvas */}
        <GradientFieldCanvas />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <StatTile label="Routing tier" icon={<Network size={12} />} value={tier.data?.tier || tier.data?.name || "—"} loading={tier.isLoading} />
          <StatTile label="Active rules" value={unwrapList(rules.data).length} loading={rules.isLoading} />
          <StatTile label="$ saved · 30d" value={economics.data?.savings_30d != null ? fmtUsd(Number(economics.data.savings_30d)) : "—"} loading={economics.isLoading} />
          <StatTile label="Avg latency" value={economics.data?.avg_latency_ms ? `${economics.data.avg_latency_ms} ms` : "—"} loading={economics.isLoading} />
        </div>

        {/* Interactive flagship tools */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <SectionCard label="Live engine · /routing/test" title="Routing simulator"
            actions={<Sparkles size={15} className="text-brand-400" />}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-3"><Field label="Strategy"><Select value={strategy} onChange={setStrategy} options={STRATEGIES} /></Field></div>
              <Field label="Max cost ($)"><input className="input" value={maxCost} onChange={(e) => setMaxCost(e.target.value)} /></Field>
              <Field label="Min quality"><input className="input" value={minQuality} onChange={(e) => setMinQuality(e.target.value)} /></Field>
              <div className="flex items-end"><Button onClick={runSim} loading={simBusy} className="w-full">Simulate</Button></div>
            </div>
            {simErr && <div className="mt-3"><ErrorBox message={simErr} /></div>}
            {sim && !simErr && (
              <div className="mt-4 rounded-xl border border-border bg-white/[0.02] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <RoutePill route={sim.selected_provider || sim.selected_model} />
                  <span className="text-sm font-semibold">{sim.selected_provider || sim.selected_model || "—"}</span>
                </div>
                <p className="text-[12px] text-ink-400">{sim.reasoning || sim.reason}</p>
                <div className="mt-3 space-y-0">
                  {sim.expected_cost != null && <KV k="Expected cost" v={fmtUsd(Number(sim.expected_cost), 6)} />}
                  {sim.expected_quality_score != null && <KV k="Expected quality" v={sim.expected_quality_score} />}
                  {sim.expected_latency_ms != null && <KV k="Expected latency" v={`${sim.expected_latency_ms} ms`} />}
                </div>
                {alts.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="text-[10px] uppercase tracking-wider text-ink-600 mb-1.5">Alternatives considered</div>
                    {alts.slice(0, 4).map((a, i) => (
                      <KV key={i} k={a.provider || a.model || `option ${i + 1}`} v={a.cost != null ? fmtUsd(Number(a.cost), 6) : (a.score ?? "—")} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </SectionCard>

          <SectionCard label="Live engine · /cost/predict" title="Cost predictor"
            actions={<Calculator size={15} className="text-brand-400" />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Provider"><Select value={provider} onChange={setProvider} options={PROVIDERS} /></Field>
              <Field label="Model"><input className="input" value={model} onChange={(e) => setModel(e.target.value)} /></Field>
              <div className="sm:col-span-2"><Field label="Input text"><textarea className="input min-h-[72px] resize-y" value={text} onChange={(e) => setText(e.target.value)} /></Field></div>
              <div className="sm:col-span-2"><Button onClick={runCost} loading={costBusy} className="w-full">Predict cost</Button></div>
            </div>
            {costErr && <div className="mt-3"><ErrorBox message={costErr} /></div>}
            {cost && !costErr && (
              <div className="mt-4 rounded-xl border border-border bg-white/[0.02] p-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold tabular-nums text-gradient">{fmtUsd(Number(cost.predicted_cost ?? 0), 6)}</span>
                  {cost.confidence != null && <Pill tone="neutral">{Math.round(Number(cost.confidence) * 100)}% conf</Pill>}
                </div>
                <div className="mt-3 space-y-0">
                  {cost.confidence_lower != null && <KV k="Confidence range" v={`${fmtUsd(Number(cost.confidence_lower), 6)} – ${fmtUsd(Number(cost.confidence_upper), 6)}`} />}
                  {cost.predicted_daily != null && <KV k="Projected daily" v={fmtUsd(Number(cost.predicted_daily), 4)} />}
                  {cost.predicted_monthly != null && <KV k="Projected monthly" v={fmtUsd(Number(cost.predicted_monthly), 2)} />}
                </div>
                {costAlts.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="text-[10px] uppercase tracking-wider text-ink-600 mb-1.5">Cheaper alternatives</div>
                    {costAlts.slice(0, 4).map((a, i) => (
                      <KV key={i} k={a.provider} v={<span>{fmtUsd(Number(a.cost), 6)} {a.savings_percent != null && <span className="text-accent-green">· {a.savings_percent}% off</span>}</span>} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Rules + stack */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SectionCard label="Policy" title="Routing rules">
            {rules.isLoading ? <Skeleton className="h-32 w-full" /> :
              <Table
                rows={unwrapList<any>(rules.data)}
                rowKey={(r) => r.id || r.rule_id}
                empty="No routing rules configured"
                columns={[
                  { key: "pattern", header: "Match", render: (r) => <span className="font-mono text-xs">{r.pattern || r.match || "*"}</span> },
                  { key: "target", header: "Route to", render: (r) => r.target || r.provider || r.model },
                  { key: "policy", header: "Policy", render: (r) => r.policy || "default" },
                  { key: "priority", header: "Pri", render: (r) => r.priority ?? "—" },
                ]}
              />
            }
          </SectionCard>
          <SectionCard label="Fleet" title="Providers in stack">
            {stack.isLoading ? <Skeleton className="h-32 w-full" /> :
              <ul className="space-y-2.5">
                {unwrapList<any>(stack.data).map((p, i) => (
                  <li key={i} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <RoutePill route={p.provider || p.name} />
                      <span className="text-sm text-ink-100">{p.provider || p.name}</span>
                    </div>
                    <span className="text-ink-500 text-xs font-mono">{p.models ? `${p.models.length} models` : (p.status || "")}</span>
                  </li>
                ))}
                {unwrapList(stack.data).length === 0 && <li className="text-ink-600 text-sm py-6 text-center">No providers in stack</li>}
              </ul>
            }
          </SectionCard>
        </div>
      </TierGate>
    </Shell>
  );
}
