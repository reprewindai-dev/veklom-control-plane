"use client";

import { useState } from "react";
import Shell from "@/components/Shell";
import { useApi } from "@/hooks/useApi";
import { Card, PageHeader, Button, Skeleton, ErrorBox } from "@/components/ui";
import {
  ACCENT, KV, ModuleHeader, Pill, SectionCard, StatTile, fmtNum, statusTone,
} from "@/components/telemetry";
import { api } from "@/lib/api";
import { BookOpen, Play, ShieldCheck, Cpu, FileCheck2, GitBranch, Zap, Lock } from "lucide-react";

interface GpcNode {
  id: string;
  type: string;
  description: string;
  policy_tag: string;
  entropy: number;
}

interface GpcPlan {
  id: string;
  name: string;
  intent: string;
  graph: { nodes: GpcNode[]; edges: { from: string; to: string }[] };
  status: string;
  policy_result: string;
  compliance: string[];
  provider: string;
  model: string;
  createdAt: string;
  decision_frame_id?: string;
  proof_hash?: string;
}

const COMPLIANCE_OPTIONS = [
  { id: "hipaa", label: "HIPAA" },
  { id: "gdpr", label: "GDPR" },
  { id: "soc2", label: "SOC 2" },
  { id: "eu-ai-act", label: "EU AI Act" },
  { id: "fedramp", label: "FedRAMP" },
];

const POLICY_TAG_TONE: Record<string, string> = {
  privacy: "text-[#7fdcf0]",
  routing: "text-brand-400",
  compliance: "text-accent-green",
  execution: "text-[#c9aaff]",
  audit: "text-ink-400",
};

export default function GpcPage() {
  const stats = useApi<any>("/api/v1/gpc/stats");
  const [intent, setIntent] = useState("");
  const [compliance, setCompliance] = useState<string[]>([]);
  const [provider, setProvider] = useState("gemini");
  const [compiling, setCompiling] = useState(false);
  const [plan, setPlan] = useState<GpcPlan | null>(null);
  const [err, setErr] = useState<string | undefined>();

  const s = stats.data || {};

  async function compile() {
    if (!intent.trim()) return;
    setCompiling(true);
    setErr(undefined);
    setPlan(null);
    try {
      const res = await api<GpcPlan>("/api/v1/gpc/compile", {
        body: { intent, compliance, provider, model: provider === "gemini" ? "gemini-2.5-flash" : "gpt-4o-mini" },
      });
      setPlan(res);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setCompiling(false);
    }
  }

  function toggleCompliance(id: string) {
    setCompliance((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  return (
    <Shell>
      <ModuleHeader
        breadcrumb="GPC · Governed Plan Compiler"
        title="Governed Plan Compiler"
        subtitle="Compile agent intent into deterministic, policy-checked execution plans with SHA-256 sealed evidence."
        pills={
          <>
            <Pill tone="green" dot>Backend live</Pill>
            <Pill tone="neutral">UACP4 Enforced</Pill>
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
          value={fmtNum(s.decisions?.approved ?? 0)} spark={[]} sparkColor={ACCENT.green} />
        <StatTile label="Decisions blocked" icon={<Lock size={12} />} loading={stats.isLoading}
          value={fmtNum(s.decisions?.blocked ?? 0)} spark={[]} sparkColor={ACCENT.red} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Compiler input */}
        <div className="lg:col-span-2 space-y-4">
          <SectionCard label="Compiler · Input" title="Describe your agent intent">
            <div className="space-y-4">
              <div>
                <label className="text-[11px] uppercase tracking-wider text-ink-400 block mb-1.5">
                  Intent
                </label>
                <textarea
                  id="gpc-intent"
                  className="input w-full h-28 resize-none text-sm"
                  placeholder="e.g. Run a quarterly compliance audit for HIPAA across all patient data pipelines and generate a signed evidence package..."
                  value={intent}
                  onChange={(e) => setIntent(e.target.value)}
                  disabled={compiling}
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider text-ink-400 block mb-1.5">
                  Compliance frameworks
                </label>
                <div className="flex flex-wrap gap-2">
                  {COMPLIANCE_OPTIONS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => toggleCompliance(c.id)}
                      className={`text-[11px] px-2.5 py-1 rounded-md border font-semibold transition-all ${
                        compliance.includes(c.id)
                          ? "border-brand-500/60 bg-brand-500/15 text-brand-400"
                          : "border-border text-ink-400 hover:border-border-strong"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider text-ink-400 block mb-1.5">
                  Provider
                </label>
                <select
                  className="input w-full text-sm appearance-none"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  disabled={compiling}
                >
                  <option value="gemini">Gemini 2.5 Flash</option>
                  <option value="openai">GPT-4o Mini</option>
                  <option value="ollama">Ollama (Local / Sovereign)</option>
                </select>
              </div>

              {err && <ErrorBox message={err} />}

              <Button
                onClick={compile}
                disabled={compiling || !intent.trim()}
                loading={compiling}
                className="w-full"
              >
                <Zap size={14} />
                {compiling ? "Compiling plan…" : "Compile governed plan"}
              </Button>

              <p className="text-[11px] text-ink-600 text-center">
                Every compile creates a Decision Frame + SHA-256 proof hash sealed in the audit chain.
              </p>
            </div>
          </SectionCard>
        </div>

        {/* Plan output */}
        <div className="lg:col-span-3 space-y-4">
          {compiling && (
            <SectionCard label="GPC · Compiling" title="Running policy gates…">
              <div className="space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-5 w-2/3" />
              </div>
            </SectionCard>
          )}

          {plan && !compiling && (
            <>
              {/* Plan header */}
              <SectionCard
                label="GPC · Compiled plan"
                title={plan.name}
                actions={
                  <Pill tone={statusTone(plan.policy_result)}>
                    {plan.policy_result.toUpperCase()}
                  </Pill>
                }
              >
                <div className="space-y-1.5">
                  <KV k="Plan ID" v={plan.id} />
                  <KV k="Provider" v={`${plan.provider} · ${plan.model}`} />
                  <KV k="Status" v={plan.status} />
                  {plan.compliance.length > 0 && (
                    <KV k="Compliance" v={plan.compliance.join(", ")} mono={false} />
                  )}
                  {plan.decision_frame_id && (
                    <KV k="Decision Frame" v={plan.decision_frame_id} />
                  )}
                  {plan.proof_hash && (
                    <KV k="Proof hash" v={`${plan.proof_hash.slice(0, 20)}…`} />
                  )}
                  <KV k="Compiled at" v={new Date(plan.createdAt).toLocaleTimeString()} />
                </div>
              </SectionCard>

              {/* Execution graph */}
              <SectionCard label="Execution graph" title="Policy-checked node pipeline">
                <div className="space-y-2">
                  {plan.graph.nodes.map((node, i) => (
                    <div key={node.id} className="flex items-start gap-3">
                      {/* Connector line */}
                      <div className="flex flex-col items-center shrink-0 pt-1">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                          node.type === "quantum"
                            ? "border-[#B98BFF]/50 bg-[#B98BFF]/10 text-[#c9aaff]"
                            : "border-brand-500/40 bg-brand-500/10 text-brand-400"
                        }`}>
                          {i + 1}
                        </div>
                        {i < plan.graph.nodes.length - 1 && (
                          <div className="w-px h-6 bg-border mt-1" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[13px] font-medium text-ink-100">{node.description}</span>
                          <span className={`text-[10px] uppercase tracking-wider font-semibold ${POLICY_TAG_TONE[node.policy_tag] || "text-ink-400"}`}>
                            {node.policy_tag}
                          </span>
                          <Pill tone={node.type === "quantum" ? "violet" : "amber"}>
                            {node.type}
                          </Pill>
                        </div>
                        <div className="text-[11px] text-ink-600 mt-0.5 font-mono">
                          id: {node.id} · entropy: {node.entropy.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>

              {/* Evidence */}
              {plan.proof_hash && (
                <SectionCard label="Evidence · Sealed" title="Audit chain entry" actions={<Pill tone="green"><FileCheck2 size={10} className="mr-1" />Verified</Pill>}>
                  <div className="space-y-1.5">
                    <KV k="Proof hash" v={plan.proof_hash} />
                    {plan.decision_frame_id && <KV k="Decision frame ID" v={plan.decision_frame_id} />}
                    <p className="text-[11px] text-ink-600 mt-2 pt-2 border-t border-border/50">
                      This plan compile is recorded as a Decision Frame in the tamper-evident HMAC-SHA256 audit chain. It cannot be modified after creation.
                    </p>
                  </div>
                </SectionCard>
              )}
            </>
          )}

          {!plan && !compiling && (
            <SectionCard label="GPC · Output" title="No plan compiled yet">
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto">
                  <GitBranch size={20} className="text-brand-400" />
                </div>
                <div className="text-sm text-ink-400">
                  Enter your agent intent and click <strong className="text-ink-200">Compile governed plan</strong>.
                </div>
                <div className="text-[11px] text-ink-600 max-w-sm mx-auto">
                  GPC converts natural language intent into a deterministic, policy-gated execution graph with full audit evidence.
                </div>
              </div>
            </SectionCard>
          )}
        </div>
      </div>

      {/* Live GPC Black Box — the real Governed Plan Compiler engine, embedded */}
      <SectionCard
        label="GPC · Live Engine"
        title="Governed Plan Compiler — Black Box"
        className="mt-5"
        actions={
          <a
            href="https://uacpv3.onrender.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-brand-400 hover:text-brand-300 inline-flex items-center gap-1"
          >
            Open full engine <Play size={10} />
          </a>
        }
      >
        <div className="rounded-lg overflow-hidden border border-border bg-bg-900">
          <iframe
            src="https://uacpv3.onrender.com/"
            title="Veklom Governed Plan Compiler (GPC) — live black box"
            className="w-full h-[680px] block"
            loading="lazy"
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>
        <p className="text-[11px] text-ink-600 mt-2">
          Live GPC black box (uacpv3.onrender.com). If the embed does not load (host blocks framing),
          use <span className="text-ink-400">Open full engine</span> above.
        </p>
      </SectionCard>
    </Shell>
  );
}
