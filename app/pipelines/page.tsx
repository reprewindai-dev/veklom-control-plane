"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Shell from "@/components/Shell";
import TierGate from "@/components/TierGate";
import { useApi } from "@/hooks/useApi";
import { api, apiUrl, getToken } from "@/lib/api";
import { Button, Skeleton, Table } from "@/components/ui";
import { ModuleHeader, SectionCard, Pill, RoutePill } from "@/components/telemetry";
import PipelineCanvas, { PNode, PEdge, CAT_COLOR } from "@/components/PipelineCanvas";
import { unwrapList } from "@/types/api";
import { Play, Rocket, Plus, Save, Search, Cpu, Settings2, History, Library, ShieldCheck, LayoutTemplate, AlertTriangle } from "lucide-react";

const RUN_STAGES = ["Source", "Build", "Validate", "Test", "Stage", "Gate", "Deploy"];
type PanelTab = "library" | "inspector" | "templates" | "runs";
type NodeConfig = {
  provider?: string;
  model?: string;
  model_provider?: string;
  model_name?: string;
  system_prompt?: string;
  tools_allowed?: string[];
  blocked_tools?: string[];
  max_iterations?: number;
  timeout_seconds?: number;
  temperature?: number;
  text?: string;
  policy?: string;
  maxLatencyMs?: number;
  monthlyCapUsd?: number;
  requireEvidence?: boolean;
  redactPii?: boolean;
  redact_pii?: boolean;
  outputSchema?: string;
};

// LangChain category — many teams standardise on it, so it's first-class here.
const LANGCHAIN_CAT = {
  id: "langchain",
  label: "LangChain",
  nodes: [
    { id: "langchain_agent", name: "LangChain Agent", description: "ReAct tool-calling agent" },
    { id: "lc-langgraph", name: "LangGraph", description: "Stateful multi-step graph" },
    { id: "lc-memory", name: "Conversation Memory", description: "Buffer / summary memory" },
    { id: "lc-retrievalqa", name: "RetrievalQA Chain", description: "RAG question-answering" },
    { id: "lc-parser", name: "Output Parser", description: "Structured Pydantic parsing" },
    { id: "lc-toolnode", name: "Tool Node", description: "Bind marketplace tools" },
  ],
};

// Extra nodes to match the governed-inference reference palette.
const EXTRA: Record<string, { id: string; name: string; description: string }[]> = {
  retrieval: [
    { id: "weaviate", name: "Weaviate Store", description: "Weaviate vector DB" },
    { id: "doc-loader", name: "Document Loader", description: "Ingest PDFs, docs, URLs" },
  ],
  routing: [{ id: "semantic-router", name: "Semantic Router", description: "Embed + route by intent" }],
  output: [
    { id: "markdown-render", name: "Markdown Render", description: "Render output as Markdown" },
    { id: "audit-signer", name: "Audit Signer", description: "HMAC-sign the evidence record" },
  ],
};

function catOf(nodeType: string, type: string | undefined, lookup: Record<string, string>): string {
  if (lookup[nodeType]) return lookup[nodeType];
  switch (type) {
    case "model": case "embedding": return "models";
    case "vector_store": case "transform": case "retrieval": return "retrieval";
    case "tool": return "tools";
    case "gate": case "router": return "routing";
    case "output": return "output";
    default: return "input";
  }
}

export default function PipelinesPage() {
  const router = useRouter();
  const pipelines = useApi<any>("/api/v1/pipelines");
  const palette = useApi<any>("/api/v1/pipelines/nodes");
  const templates = useApi<any>("/api/v1/pipelines/templates");
  const billingStatus = useApi<any>("/api/v1/billing/config/status");
  const routingPolicy = useApi<any>("/api/v1/routing/policy");

  const [pid, setPid] = useState<string | null>(null);
  const [nodes, setNodes] = useState<PNode[]>([]);
  const [edges, setEdges] = useState<PEdge[]>([]);
  const [nodeConfigs, setNodeConfigs] = useState<Record<string, NodeConfig>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [panelTab, setPanelTab] = useState<PanelTab>("library");
  const [paletteQuery, setPaletteQuery] = useState("");
  const [loadingGraph, setLoadingGraph] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [saved, setSaved] = useState(false);
  const [running, setRunning] = useState(false);
  const [stageStatus, setStageStatus] = useState<Record<string, string>>({});
  const [runMsg, setRunMsg] = useState<string>();

  const list = unwrapList<any>(pipelines.data);
  const current = list.find((p) => p.id === pid) || list[0];
  const runs = useApi<any>(pid ? `/api/v1/pipelines/${pid}/runs` : null);
  const selectedNode = nodes.find((n) => n.id === selected) || null;

  // nodeType -> category lookup from live palette
  const catLookup = useMemo(() => {
    const m: Record<string, string> = {};
    (palette.data?.categories || []).forEach((c: any) => (c.nodes || []).forEach((n: any) => (m[n.id] = c.id)));
    LANGCHAIN_CAT.nodes.forEach((n) => (m[n.id] = "langchain"));
    Object.entries(EXTRA).forEach(([cat, ns]) => ns.forEach((n) => (m[n.id] = cat)));
    return m;
  }, [palette.data]);

  // Merge live palette + extras + LangChain
  const categories = useMemo(() => {
    const base = (palette.data?.categories || []).map((c: any) => ({
      ...c,
      nodes: [...(c.nodes || []), ...(EXTRA[c.id] || [])],
    }));
    return base.some((c: any) => c.id === "langchain") ? base : [...base, LANGCHAIN_CAT];
  }, [palette.data]);

  // Default selection
  useEffect(() => {
    if (!pid && list.length) setPid(list[0].id);
  }, [list, pid]);

  // Load graph when pipeline changes
  useEffect(() => {
    if (!pid) return;
    let cancelled = false;
    setLoadingGraph(true);
    api<any>(`/api/v1/pipelines/${pid}/graph`)
      .then((g) => {
        if (cancelled) return;
        const ns: PNode[] = (g.nodes || []).map((n: any) => ({
          id: n.id,
          nodeType: n.data?.nodeType || n.type || "node",
          label: n.data?.label || n.id,
          cat: catOf(n.data?.nodeType || "", n.type, catLookup),
          x: n.position?.x ?? 60,
          y: n.position?.y ?? 60,
        }));
        const es: PEdge[] = (g.edges || []).map((e: any) => ({ id: e.id, source: e.source, target: e.target }));
        setNodes(ns);
        setEdges(es);
        setNodeConfigs(g.node_configs || {});
        setSelected(null);
      })
      .finally(() => !cancelled && setLoadingGraph(false));
    return () => { cancelled = true; };
  }, [pid, catLookup]);

  function addNode(catId: string, node: any) {
    const id = `${node.id}-${Date.now().toString(36)}`;
    const cx = 120 + (nodes.length % 6) * 60;
    const cy = 80 + (nodes.length % 5) * 70;
    setNodes((ns) => [...ns, { id, nodeType: node.id, label: node.name, cat: catId, x: cx, y: cy }]);
    setNodeConfigs((cfg) => ({ ...cfg, [id]: defaultNodeConfig(catId, node.id) }));
    setSelected(id);
    setPanelTab("inspector");
  }

  async function saveGraph(): Promise<boolean> {
    if (!pid) return false;
    setSaving(true); setSaved(false);
    try {
      await api(`/api/v1/pipelines/${pid}/graph`, {
        method: "PUT",
        body: {
          nodes: nodes.map((n) => ({ id: n.id, type: n.cat, position: { x: n.x, y: n.y }, data: { label: n.label, nodeType: n.nodeType } })),
          edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target, animated: true })),
          viewport: { x: 0, y: 0, zoom: 1 },
          node_configs: nodeConfigs,
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      return true;
    } finally { setSaving(false); }
  }

  async function testRun() {
    if (!pid || running) return;
    setRunning(true); setRunMsg(undefined);
    setStageStatus(Object.fromEntries(RUN_STAGES.map((s) => [s, "pending"])));
    let timeout: number | undefined;
    try {
      const { run_id } = await api<any>(`/api/v1/pipelines/${pid}/run`, { method: "POST" });
      const controller = new AbortController();
      timeout = window.setTimeout(() => controller.abort(), 45000);
      const res = await fetch(apiUrl(`/api/v1/pipelines/${pid}/runs/${run_id}/stream`), {
        headers: { Authorization: `Bearer ${getToken()}` },
        signal: controller.signal,
      });
      if (!res.body) throw new Error("No stream");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() || "";
        for (const part of parts) {
          const line = part.split("\n").find((l) => l.startsWith("data:"));
          if (!line) continue;
          let ev: any;
          try { ev = JSON.parse(line.slice(5).trim()); } catch { continue; }
          if (ev.stage) setStageStatus((s) => ({ ...s, [ev.stage]: ev.type === "step.completed" ? "completed" : "running" }));
          if (ev.type === "run.completed") {
            setStageStatus(Object.fromEntries(RUN_STAGES.map((s) => [s, "completed"])));
            setRunMsg(`Completed · evidence ${ev.evidence_id || "—"} · proof ${ev.proof_hash || "—"}`);
            runs.mutate();
          }
        }
      }
    } catch (e) {
      setRunMsg((e as Error).name === "AbortError" ? "Run error: backend stream timed out before completion" : `Run error: ${(e as Error).message}`);
    } finally {
      if (timeout) window.clearTimeout(timeout);
      setRunning(false);
    }
  }

  async function newPipeline() {
    const name = window.prompt("Name your pipeline", "untitled-pipeline");
    if (!name) return;
    const created = await api<any>("/api/v1/pipelines", { method: "POST", body: { name, template: "Custom", vectorStore: "pgvector" } });
    await pipelines.mutate();
    if (created?.id) setPid(created.id);
  }

  async function useTemplate(templateId: string) {
    const pipe = await api<any>(`/api/v1/pipelines/${templateId}`);
    await pipelines.mutate();
    if (pipe?.id) setPid(pipe.id);
    setPanelTab("library");
  }

  async function deployAsEndpoint() {
    if (!pid || deploying) return;
    const critical = readiness.filter((r) => r.critical && !r.pass);
    if (critical.length) {
      setRunMsg(`Deployment blocked: ${critical.map((r) => r.label).join(", ")}`);
      setPanelTab("inspector");
      return;
    }
    setDeploying(true);
    try {
      const savedOk = await saveGraph();
      if (!savedOk) return;
      await api<any>("/api/v1/deployments", {
        method: "POST",
        body: {
          name: `${current?.name || "Pipeline"} endpoint`,
          type: "pipeline",
          endpoint: `/api/v1/pipelines/${pid}/run`,
          model: inferPrimaryModel(nodes, nodeConfigs),
          auth: "api-key",
          region: "eu-sovereign",
          rateLimit: "100 rpm",
          status: "live",
        },
      });
      router.push("/deployments");
    } catch (e) {
      setRunMsg(`Deploy error: ${(e as Error).message}`);
    } finally {
      setDeploying(false);
    }
  }

  function patchSelectedConfig(patch: NodeConfig) {
    if (!selected) return;
    setNodeConfigs((cfg) => ({ ...cfg, [selected]: { ...(cfg[selected] || {}), ...patch } }));
  }

  const readiness = useMemo(() => pipelineReadiness(nodes, edges, billingStatus.data), [nodes, edges, billingStatus.data]);
  const p50 = 180 + edges.length * 12 + nodes.length * 6;

  return (
    <Shell>
      <TierGate required="pro" feature="Pipelines">
        <ModuleHeader
          breadcrumb="Infrastructure · Pipelines"
          title="Visual builder for governed inference"
          subtitle="Drag-and-drop graphs that chain models, retrieval, memory, tools, and routing — every node gated by your policy engine."
          pills={<><Pill tone="green" dot>Policy engine inline</Pill><Pill tone="amber">LangChain · LangGraph</Pill><Pill tone="cyan">pgvector · Qdrant · Weaviate</Pill></>}
          actions={<>
            <Button variant="ghost" onClick={() => setPanelTab("templates")}><LayoutTemplate size={14} /> Templates</Button>
            <Button variant="ghost" onClick={newPipeline}><Plus size={14} /> New pipeline</Button>
          </>}
        />

        {/* Builder */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4 mb-5">
          <div className="card overflow-hidden">
            {/* Builder toolbar */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <Cpu size={15} className="text-brand-400" />
              <span className="text-sm font-semibold">{current?.name || "—"}</span>
              <Pill tone="neutral">{(current?.steps?.template || current?.template || "Custom")}</Pill>
              <Pill tone="amber">{current?.status || "draft"}</Pill>
              <div className="ml-auto flex items-center gap-2">
                <Button variant="ghost" onClick={saveGraph} loading={saving}><Save size={14} /> {saved ? "Saved" : "Save"}</Button>
                <Button variant="ghost" onClick={testRun} loading={running}><Play size={14} /> Test</Button>
                <Button onClick={deployAsEndpoint} loading={deploying}><Rocket size={14} /> Deploy as endpoint</Button>
              </div>
            </div>

            {loadingGraph ? (
              <div className="p-6"><Skeleton className="h-[400px] w-full" /></div>
            ) : (
              <div className="p-3">
                <PipelineCanvas
                  nodes={nodes} edges={edges}
                  setNodes={setNodes} setEdges={setEdges}
                  selected={selected} setSelected={setSelected}
                  running={running}
                  onDelete={(id) => setNodeConfigs((cfg) => {
                    const next = { ...cfg };
                    delete next[id];
                    return next;
                  })}
                />
              </div>
            )}

            {/* Footer status */}
            <div className="flex items-center gap-3 px-4 py-2.5 border-t border-border text-[11px]">
              <span className="flex items-center gap-1.5 text-accent-green"><span className="w-1.5 h-1.5 rounded-full bg-accent-green" /> POLICY ENGINE INLINE</span>
              <span className="text-ink-600 font-mono">routing: {routingPolicy.data?.default_strategy || "policy"}</span>
              <span className="ml-auto text-ink-600 font-mono">{readiness.filter((r) => r.pass).length}/{readiness.length} checks · {nodes.length} nodes · {edges.length} edges · est. p50 ~{p50}ms</span>
            </div>

            {/* Run progress */}
            {(running || runMsg) && (
              <div className="px-4 py-3 border-t border-border">
                <div className="flex flex-wrap items-center gap-1.5">
                  {RUN_STAGES.map((s) => {
                    const st = stageStatus[s] || "pending";
                    return (
                      <span key={s} className={
                        st === "completed" ? "text-[10px] px-2 py-1 rounded-md border border-accent-green/40 bg-accent-green/10 text-accent-green"
                        : st === "running" ? "text-[10px] px-2 py-1 rounded-md border border-brand-500/40 bg-brand-500/10 text-brand-400 animate-pulse"
                        : "text-[10px] px-2 py-1 rounded-md border border-border text-ink-600"
                      }>{s}</span>
                    );
                  })}
                </div>
                {runMsg && <div className="mt-2 text-[11px] text-ink-400 font-mono">{runMsg}</div>}
              </div>
            )}
          </div>

          {/* Node palette / inspector */}
          <SectionCard label="Library" title="Nodes" className="self-start">
            <div className="grid grid-cols-4 gap-1 mb-3 rounded-lg border border-border bg-bg-900 p-1">
              <PanelTabButton active={panelTab === "library"} onClick={() => setPanelTab("library")} title="Library"><Library size={13} /></PanelTabButton>
              <PanelTabButton active={panelTab === "inspector"} onClick={() => setPanelTab("inspector")} title="Inspector"><Settings2 size={13} /></PanelTabButton>
              <PanelTabButton active={panelTab === "templates"} onClick={() => setPanelTab("templates")} title="Templates"><LayoutTemplate size={13} /></PanelTabButton>
              <PanelTabButton active={panelTab === "runs"} onClick={() => setPanelTab("runs")} title="Runs"><History size={13} /></PanelTabButton>
            </div>

            {panelTab === "library" && (
              <>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-bg-900 px-2.5 h-9 mb-3">
                  <Search size={13} className="text-ink-600" />
                  <input value={paletteQuery} onChange={(e) => setPaletteQuery(e.target.value)} placeholder="Search nodes…" className="flex-1 bg-transparent text-sm outline-none placeholder:text-ink-600" />
                </div>
                <div className="space-y-4 max-h-[460px] overflow-y-auto scroll-thin pr-1">
                  {palette.isLoading ? <Skeleton className="h-40 w-full" /> :
                    categories.map((cat: any) => {
                      const q = paletteQuery.trim().toLowerCase();
                      const ns = (cat.nodes || []).filter((n: any) => !q || n.name.toLowerCase().includes(q) || (n.description || "").toLowerCase().includes(q));
                      if (!ns.length) return null;
                      return (
                        <div key={cat.id}>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: CAT_COLOR[cat.id] || CAT_COLOR.input }} />
                            <span className="text-[10px] uppercase tracking-wider text-ink-600 font-semibold">{cat.label}</span>
                          </div>
                          <div className="grid grid-cols-1 gap-1.5">
                            {ns.map((n: any) => (
                              <button key={n.id} onClick={() => addNode(cat.id, n)}
                                className="group flex items-center gap-2 rounded-lg border border-border bg-white/[0.02] hover:border-ink-600 hover:bg-white/[0.04] px-2.5 py-1.5 text-left transition">
                                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: CAT_COLOR[cat.id] || CAT_COLOR.input }} />
                                <span className="min-w-0">
                                  <span className="block text-[12px] text-ink-50 truncate">{n.name}</span>
                                  <span className="block text-[10px] text-ink-600 truncate">{n.description}</span>
                                </span>
                                <Plus size={12} className="ml-auto text-ink-600 group-hover:text-brand-400 shrink-0" />
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </>
            )}

            {panelTab === "inspector" && (
              <div className="space-y-3 max-h-[520px] overflow-y-auto scroll-thin pr-1">
                <ReadinessPanel readiness={readiness} />
                {selectedNode ? (
                  <NodeInspector node={selectedNode} config={nodeConfigs[selectedNode.id] || {}} onChange={patchSelectedConfig} />
                ) : (
                  <div className="rounded-lg border border-border bg-white/[0.02] p-3 text-xs text-ink-500">
                    Select a node to configure provider, policy, budget, evidence, and output controls.
                  </div>
                )}
              </div>
            )}

            {panelTab === "templates" && (
              <div className="space-y-2 max-h-[520px] overflow-y-auto scroll-thin pr-1">
                {templates.isLoading ? <Skeleton className="h-40 w-full" /> :
                  unwrapList<any>(templates.data?.templates || templates.data).map((t) => (
                    <button key={t.id} onClick={() => useTemplate(t.id)}
                      className="w-full rounded-lg border border-border bg-white/[0.02] hover:border-brand-500/50 hover:bg-brand-500/10 px-3 py-2 text-left transition">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-semibold text-ink-50 truncate">{t.name}</span>
                        <span className="ml-auto text-[10px] text-ink-600 font-mono">{t.nodes} nodes</span>
                      </div>
                      <div className="text-[10px] text-ink-500 mt-1 line-clamp-2">{t.description}</div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <RoutePill route={t.vectorStore} />
                        {(t.compliance || []).slice(0, 2).map((c: string) => <Pill key={c} tone="green">{c}</Pill>)}
                      </div>
                    </button>
                  ))}
              </div>
            )}

            {panelTab === "runs" && (
              <div className="space-y-2 max-h-[520px] overflow-y-auto scroll-thin pr-1">
                {runs.isLoading ? <Skeleton className="h-40 w-full" /> :
                  unwrapList<any>(runs.data?.runs || runs.data).length ? unwrapList<any>(runs.data?.runs || runs.data).map((r) => (
                    <div key={r.id} className="rounded-lg border border-border bg-white/[0.02] px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Pill tone={r.status === "completed" ? "green" : r.status === "failed" ? "red" : "amber"} dot={r.status !== "completed"}>{r.status || "queued"}</Pill>
                        <span className="ml-auto text-[10px] text-ink-600 font-mono">{r.id?.slice(0, 8)}</span>
                      </div>
                      <div className="mt-1 text-[10px] text-ink-500 font-mono">{r.updated_at || r.created_at || "pending"}</div>
                    </div>
                  )) : (
                    <div className="rounded-lg border border-border bg-white/[0.02] p-3 text-xs text-ink-500">No runs recorded for this pipeline yet.</div>
                  )}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Pipelines list */}
        <SectionCard label="Deployed & draft" title={`${list.length} pipelines`}>
          {pipelines.isLoading ? <Skeleton className="h-32 w-full" /> :
            <Table
              rows={list}
              rowKey={(r) => r.id}
              empty="No pipelines yet — create one to start building"
              columns={[
                { key: "name", header: "Name", render: (r) => (
                  <button onClick={() => setPid(r.id)} className={r.id === pid ? "text-brand-400 font-medium" : "text-ink-50 hover:text-brand-400"}>{r.name}</button>
                ) },
                { key: "template", header: "Template", render: (r) => <span className="text-ink-400">{r.steps?.template || r.template || "Custom"}</span> },
                { key: "vs", header: "Vector store", render: (r) => <RoutePill route={r.steps?.vectorStore || "pgvector"} /> },
                { key: "nodes", header: "Nodes", render: (r) => <span className="font-mono">{r.steps?.nodes ?? "—"}</span> },
                { key: "inv", header: "Invocations", render: (r) => <span className="font-mono tabular-nums">{(r.steps?.invocations ?? 0).toLocaleString()}</span> },
                { key: "status", header: "Status", render: (r) => <Pill tone={r.status === "deployed" || r.status === "live" ? "green" : "neutral"} dot={r.status === "deployed" || r.status === "live"}>{r.status || "draft"}</Pill> },
              ]}
            />
          }
        </SectionCard>
      </TierGate>
    </Shell>
  );
}

function defaultNodeConfig(catId: string, nodeType: string): NodeConfig {
  if (nodeType === "langchain_agent" || nodeType === "lc-agent") return {
    model_provider: "ollama",
    model_name: "qwen2.5:3b",
    system_prompt: "You are a governed Veklom ReAct agent. Use approved tools only and return enterprise-ready output.",
    tools_allowed: ["marketplace_tool"],
    blocked_tools: ["code_executor"],
    max_iterations: 3,
    timeout_seconds: 45,
    temperature: 0.2,
    policy: "sovereign_default",
    requireEvidence: true,
    redact_pii: true,
    redactPii: true,
  };
  if (catId === "models" || nodeType.startsWith("llm-")) return { provider: nodeType.replace("llm-", ""), model: nodeType, policy: "cost_quality_balanced", maxLatencyMs: 1200, monthlyCapUsd: 2500, requireEvidence: true };
  if (catId === "routing" || nodeType.includes("policy")) return { policy: "sovereign_default", requireEvidence: true, redactPii: true, maxLatencyMs: 300 };
  if (catId === "output") return { outputSchema: "signed_json", requireEvidence: true, redactPii: nodeType.includes("pii") };
  if (catId === "tools") return { policy: "tool_allowlist", requireEvidence: true, maxLatencyMs: 2000 };
  return { policy: "inherit", requireEvidence: true };
}

function inferPrimaryModel(nodes: PNode[], configs: Record<string, NodeConfig>) {
  const modelNode = nodes.find((n) => n.cat === "models" || n.cat === "langchain" || n.nodeType.startsWith("llm-"));
  return (modelNode && (configs[modelNode.id]?.model_name || configs[modelNode.id]?.model || modelNode.nodeType)) || "policy-routed";
}

function pipelineReadiness(nodes: PNode[], edges: PEdge[], billing: any) {
  const hasPolicy = nodes.some((n) => n.nodeType === "policy-gate" || n.nodeType === "audit-signer");
  const hasExecutor = nodes.some((n) => n.cat === "models" || n.cat === "langchain" || n.nodeType.startsWith("llm-"));
  const hasOutput = nodes.some((n) => n.cat === "output" || ["audit-log", "json-format", "webhook", "audit-signer"].includes(n.nodeType));
  const connected = nodes.length <= 1 || edges.length >= nodes.length - 1;
  const billingKnown = billing ? Boolean(billing.stripe_configured ?? billing.configured ?? billing.status ?? true) : true;
  return [
    { label: "Policy gate", pass: hasPolicy, critical: true },
    { label: "Executable node", pass: hasExecutor, critical: true },
    { label: "Output/audit sink", pass: hasOutput, critical: true },
    { label: "Connected graph", pass: connected, critical: nodes.length > 1 },
    { label: "Stripe billing route", pass: billingKnown, critical: false },
  ];
}

function PanelTabButton({ active, onClick, title, children }: { active: boolean; onClick: () => void; title: string; children: ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={active ? "h-8 rounded-md bg-brand-500/15 text-brand-400 border border-brand-500/30 grid place-items-center" : "h-8 rounded-md text-ink-500 hover:text-ink-100 hover:bg-white/[0.04] grid place-items-center"}
    >
      {children}
    </button>
  );
}

function ReadinessPanel({ readiness }: { readiness: { label: string; pass: boolean; critical: boolean }[] }) {
  return (
    <div className="rounded-lg border border-border bg-bg-900/70 p-3">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-ink-400 mb-2">
        <ShieldCheck size={13} className="text-accent-green" />
        Deployment readiness
      </div>
      <div className="space-y-1.5">
        {readiness.map((r) => (
          <div key={r.label} className="flex items-center gap-2 text-[11px]">
            {r.pass ? <span className="w-1.5 h-1.5 rounded-full bg-accent-green" /> : <AlertTriangle size={12} className={r.critical ? "text-accent-red" : "text-brand-400"} />}
            <span className={r.pass ? "text-ink-200" : r.critical ? "text-accent-red" : "text-brand-400"}>{r.label}</span>
            {r.critical && <span className="ml-auto text-[9px] uppercase text-ink-600">required</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function NodeInspector({ node, config, onChange }: { node: PNode; config: NodeConfig; onChange: (patch: NodeConfig) => void }) {
  const isLangChainAgent = node.nodeType === "langchain_agent" || node.nodeType === "lc-agent";
  const allowedTools = config.tools_allowed || [];
  const blockedTools = config.blocked_tools || [];
  const toggleTool = (tool: string) => {
    const next = allowedTools.includes(tool) ? allowedTools.filter((t) => t !== tool) : [...allowedTools, tool];
    onChange({ tools_allowed: next });
  };
  const toggleBlockedTool = (tool: string) => {
    const next = blockedTools.includes(tool) ? blockedTools.filter((t) => t !== tool) : [...blockedTools, tool];
    onChange({ blocked_tools: next });
  };

  return (
    <div className="rounded-lg border border-border bg-white/[0.02] p-3">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 rounded-full" style={{ background: CAT_COLOR[node.cat] || CAT_COLOR.input }} />
        <div className="min-w-0">
          <div className="text-[12px] font-semibold text-ink-50 truncate">{node.label}</div>
          <div className="text-[10px] uppercase tracking-wider text-ink-600">{node.nodeType}</div>
        </div>
      </div>
      <div className="space-y-2">
        <Control label="Policy">
          <select className="input h-8 text-xs" value={config.policy || "inherit"} onChange={(e) => onChange({ policy: e.target.value })}>
            <option className="bg-bg-800" value="inherit">Inherit workspace policy</option>
            <option className="bg-bg-800" value="sovereign_default">Sovereign default</option>
            <option className="bg-bg-800" value="hipaa_phi_redaction">HIPAA PHI redaction</option>
            <option className="bg-bg-800" value="tool_allowlist">Tool allowlist</option>
            <option className="bg-bg-800" value="cost_quality_balanced">Cost-quality balanced</option>
          </select>
        </Control>
        <div className="grid grid-cols-2 gap-2">
          <Control label="Max latency">
            <input className="input h-8 text-xs" type="number" value={config.maxLatencyMs || ""} onChange={(e) => onChange({ maxLatencyMs: Number(e.target.value) || undefined })} placeholder="ms" />
          </Control>
          <Control label="Budget cap">
            <input className="input h-8 text-xs" type="number" value={config.monthlyCapUsd || ""} onChange={(e) => onChange({ monthlyCapUsd: Number(e.target.value) || undefined })} placeholder="USD" />
          </Control>
        </div>
        <Control label="Model / endpoint">
          <input className="input h-8 text-xs" value={isLangChainAgent ? (config.model_name || "") : (config.model || "")} onChange={(e) => onChange(isLangChainAgent ? { model_name: e.target.value } : { model: e.target.value })} placeholder={isLangChainAgent ? "qwen2.5:3b" : "policy-routed"} />
        </Control>
        {isLangChainAgent && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Control label="Provider">
                <select className="input h-8 text-xs" value={config.model_provider || "ollama"} onChange={(e) => onChange({ model_provider: e.target.value })}>
                  <option className="bg-bg-800" value="ollama">Ollama</option>
                  <option className="bg-bg-800" value="openai">OpenAI</option>
                  <option className="bg-bg-800" value="gemini">Gemini</option>
                  <option className="bg-bg-800" value="groq">Groq</option>
                  <option className="bg-bg-800" value="huggingface">Hugging Face</option>
                </select>
              </Control>
              <Control label="Temperature">
                <input className="input h-8 text-xs" type="number" step="0.1" min="0" max="2" value={config.temperature ?? 0.2} onChange={(e) => onChange({ temperature: Number(e.target.value) })} />
              </Control>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Control label="Max steps">
                <input className="input h-8 text-xs" type="number" min="1" max="8" value={config.max_iterations || 3} onChange={(e) => onChange({ max_iterations: Number(e.target.value) || 3 })} />
              </Control>
              <Control label="Timeout">
                <input className="input h-8 text-xs" type="number" min="5" max="180" value={config.timeout_seconds || 45} onChange={(e) => onChange({ timeout_seconds: Number(e.target.value) || 45 })} />
              </Control>
            </div>
            <Control label="System prompt">
              <textarea className="input min-h-20 py-2 text-xs resize-none" value={config.system_prompt || ""} onChange={(e) => onChange({ system_prompt: e.target.value })} placeholder="Governed ReAct instructions" />
            </Control>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-ink-600">Allowed tools</span>
              <div className="grid grid-cols-2 gap-1.5 mt-1">
                {["web_search", "http_request", "sql_query", "file_reader", "marketplace_tool", "code_executor"].map((tool) => (
                  <label key={tool} className="flex items-center gap-2 rounded-md border border-border bg-bg-900 px-2 py-1.5 text-[10px] text-ink-300">
                    <input type="checkbox" checked={allowedTools.includes(tool)} onChange={() => toggleTool(tool)} />
                    <span className="truncate">{tool}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-ink-600">Blocked tools</span>
              <div className="grid grid-cols-2 gap-1.5 mt-1">
                {["web_search", "http_request", "sql_query", "file_reader", "marketplace_tool", "code_executor"].map((tool) => (
                  <label key={tool} className="flex items-center gap-2 rounded-md border border-border bg-bg-900 px-2 py-1.5 text-[10px] text-ink-300">
                    <input type="checkbox" checked={blockedTools.includes(tool)} onChange={() => toggleBlockedTool(tool)} />
                    <span className="truncate">{tool}</span>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}
        <Control label="Output schema">
          <input className="input h-8 text-xs" value={config.outputSchema || ""} onChange={(e) => onChange({ outputSchema: e.target.value })} placeholder="signed_json" />
        </Control>
        <label className="flex items-center justify-between gap-3 rounded-md border border-border bg-bg-900 px-2 py-1.5 text-[11px] text-ink-300">
          Evidence required
          <input type="checkbox" checked={!!config.requireEvidence} onChange={(e) => onChange({ requireEvidence: e.target.checked })} />
        </label>
        <label className="flex items-center justify-between gap-3 rounded-md border border-border bg-bg-900 px-2 py-1.5 text-[11px] text-ink-300">
          PII redaction
          <input type="checkbox" checked={!!(config.redactPii || config.redact_pii)} onChange={(e) => onChange({ redactPii: e.target.checked, redact_pii: e.target.checked })} />
        </label>
      </div>
    </div>
  );
}

function Control({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wider text-ink-600">{label}</span>
      <span className="block mt-1">{children}</span>
    </label>
  );
}
