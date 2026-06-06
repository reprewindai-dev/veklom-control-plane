"use client";

import Shell from "@/components/Shell";
import TierGate from "@/components/TierGate";
import { useApi } from "@/hooks/useApi";
import { Skeleton, Button, ErrorBox } from "@/components/ui";
import { api } from "@/lib/api";
import { useState } from "react";
import { ModuleHeader, SectionCard, Pill, Field, KV, fmtUsd } from "@/components/telemetry";
import { Cpu, GraduationCap, Sparkles, Calculator } from "lucide-react";

const FLAGS = [
  { k: "ml_routing", label: "ML routing", desc: "Route by learned cost/quality models" },
  { k: "quality_scoring", label: "Quality scoring", desc: "Score completions for relevance & accuracy" },
  { k: "auto_training", label: "Auto-training", desc: "Retrain predictors as new logs arrive" },
];

function Toggle({ on, onClick, disabled }: { on: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} className={`relative w-10 h-6 rounded-full transition ${on ? "bg-brand-500" : "bg-white/10"} disabled:opacity-50`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${on ? "translate-x-4" : ""}`} />
    </button>
  );
}

export default function AutonomousPage() {
  const flags = useApi<any>("/api/v1/autonomous/feature-flags");
  const [savingFlag, setSavingFlag] = useState<string>();
  const [err, setErr] = useState<string>();

  // training
  const [training, setTraining] = useState(false);
  const [trainRes, setTrainRes] = useState<any>();
  // quality optimize
  const [optimizing, setOptimizing] = useState(false);
  const [optRes, setOptRes] = useState<any>();
  // cost predict
  const [model, setModel] = useState("llama3.1:8b");
  const [inTok, setInTok] = useState("1000");
  const [outTok, setOutTok] = useState("500");
  const [predicting, setPredicting] = useState(false);
  const [predRes, setPredRes] = useState<any>();

  const f = flags.data || {};

  async function toggleFlag(k: string) {
    setSavingFlag(k); setErr(undefined);
    try { await api("/api/v1/autonomous/feature-flags", { method: "POST", body: { ...f, [k]: !f[k] } }); flags.mutate(); }
    catch (e) { setErr((e as Error).message); } finally { setSavingFlag(undefined); }
  }
  async function train() {
    setTraining(true); setTrainRes(undefined);
    try { setTrainRes(await api<any>("/api/v1/autonomous/train", { method: "POST", body: { min_samples: 100 } })); }
    catch (e) { setErr((e as Error).message); } finally { setTraining(false); }
  }
  async function optimize() {
    setOptimizing(true); setOptRes(undefined);
    try { setOptRes(await api<any>("/api/v1/autonomous/quality/optimize", { method: "POST", body: {} })); }
    catch (e) { setErr((e as Error).message); } finally { setOptimizing(false); }
  }
  async function predict() {
    setPredicting(true); setPredRes(undefined);
    try { setPredRes(await api<any>("/api/v1/autonomous/cost/predict", { method: "POST", body: { model, input_tokens: Number(inTok), output_tokens: Number(outTok) } })); }
    catch (e) { setErr((e as Error).message); } finally { setPredicting(false); }
  }

  return (
    <Shell>
      <TierGate required="pro" feature="Autonomous Jobs">
        <ModuleHeader
          breadcrumb="Operations · Autonomous Intelligence"
          title="Autonomous ML controls"
          subtitle="The learned routing/quality/cost models that optimize every governed call. Tune the feature flags, retrain on your logs, and forecast cost."
          pills={<Pill tone={f.ml_routing ? "green" : "neutral"} dot>ML routing {f.ml_routing ? "on" : "off"}</Pill>}
        />
        {err && <div className="mb-4"><ErrorBox message={err} /></div>}

        <div className="grid lg:grid-cols-3 gap-4 mb-4">
          <SectionCard label="Feature flags" title="ML capabilities" className="lg:col-span-1" bodyClassName="space-y-2">
            {flags.isLoading ? <Skeleton className="h-32" /> : FLAGS.map((fl) => (
              <div key={fl.k} className="flex items-center gap-3 card p-3">
                <Cpu size={15} className="text-brand-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] text-ink-50">{fl.label}</div>
                  <div className="text-[10px] text-ink-600">{fl.desc}</div>
                </div>
                <Toggle on={!!f[fl.k]} onClick={() => toggleFlag(fl.k)} disabled={savingFlag === fl.k} />
              </div>
            ))}
          </SectionCard>

          <SectionCard label="Training" title="Retrain predictors" className="lg:col-span-1">
            <p className="text-[12.5px] text-ink-400 mb-3">Train the cost, routing, and quality models on this workspace&apos;s execution history.</p>
            <Button onClick={train} loading={training} className="w-full"><GraduationCap size={14} /> Train models</Button>
            {trainRes && (
              <div className={`mt-3 card p-3 ${trainRes.success ? "" : "border-accent-red/30"}`}>
                {trainRes.success ? (
                  <>
                    <Pill tone="green" dot>Trained</Pill>
                    <div className="mt-2 space-y-1">
                      <KV k="Cost predictor" v={`${trainRes.cost_predictor?.samples_used ?? 0} samples`} />
                      <KV k="Routing optimizer" v={`${trainRes.routing_optimizer?.samples_used ?? 0} samples`} />
                      <KV k="Quality predictor" v={`${trainRes.quality_predictor?.samples_used ?? 0} samples`} />
                    </div>
                  </>
                ) : (
                  <div className="text-[12px] text-brand-400">{trainRes.message}</div>
                )}
              </div>
            )}
          </SectionCard>

          <SectionCard label="Quality" title="Optimize provider" className="lg:col-span-1">
            <p className="text-[12.5px] text-ink-400 mb-3">Recommend the best provider/model for quality at lowest cost.</p>
            <Button onClick={optimize} loading={optimizing} variant="ghost" className="w-full"><Sparkles size={14} /> Get recommendation</Button>
            {optRes && (
              <div className="mt-3 card p-3">
                <KV k="Provider" v={optRes.recommended_provider} mono={false} />
                <KV k="Model" v={optRes.recommended_model} />
                <KV k="Expected quality" v={`${Math.round((optRes.expected_quality ?? 0) * 100)}%`} />
                <KV k="Expected cost" v={fmtUsd(Number(optRes.expected_cost ?? 0), 6)} />
              </div>
            )}
          </SectionCard>
        </div>

        <SectionCard label="Forecast" title="Cost predictor">
          <div className="grid sm:grid-cols-4 gap-3 items-end">
            <Field label="Model"><input className="input" value={model} onChange={(e) => setModel(e.target.value)} /></Field>
            <Field label="Input tokens"><input className="input" type="number" value={inTok} onChange={(e) => setInTok(e.target.value)} /></Field>
            <Field label="Output tokens"><input className="input" type="number" value={outTok} onChange={(e) => setOutTok(e.target.value)} /></Field>
            <Button onClick={predict} loading={predicting}><Calculator size={14} /> Predict</Button>
          </div>
          {predRes && (
            <div className="grid sm:grid-cols-4 gap-3 mt-4">
              <div className="card p-3 text-center"><div className="text-[18px] font-semibold text-brand-400">{fmtUsd(Number(predRes.predicted_cost), 6)}</div><div className="text-[10px] uppercase tracking-wider text-ink-600">Predicted</div></div>
              <div className="card p-3 text-center"><div className="text-[14px] font-semibold">{fmtUsd(Number(predRes.confidence_lower), 6)} – {fmtUsd(Number(predRes.confidence_upper), 6)}</div><div className="text-[10px] uppercase tracking-wider text-ink-600">Confidence band</div></div>
              <div className="card p-3 text-center"><div className="text-[18px] font-semibold">{predRes.samples_analyzed}</div><div className="text-[10px] uppercase tracking-wider text-ink-600">Samples</div></div>
              <div className="card p-3 text-center"><div className="text-[18px] font-semibold">{predRes.historical_avg_latency_ms}ms</div><div className="text-[10px] uppercase tracking-wider text-ink-600">Avg latency</div></div>
            </div>
          )}
        </SectionCard>
      </TierGate>
    </Shell>
  );
}
