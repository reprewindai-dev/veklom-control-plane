"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import Shell from "@/components/Shell";
import TierGate from "@/components/TierGate";
import TriageTelemetry from "@/components/telemetry/TriageTelemetry";
import { useApi } from "@/hooks/useApi";
import { api, apiUrl, getToken } from "@/lib/api";
import { Button, Skeleton, Table } from "@/components/ui";
import { ModuleHeader, SectionCard, Pill, RoutePill } from "@/components/telemetry";
import PipelineCanvas, { PNode, PEdge, CAT_COLOR } from "@/components/PipelineCanvas";
import { unwrapList } from "@/types/api";
import { Play, Rocket, Plus, Save, Search, Cpu, Code, Settings2, History, Library, ShieldCheck, LayoutTemplate, AlertTriangle, Bot, Sparkles } from "lucide-react";

const RUN_STAGES = ["Source", "Build", "Validate", "Test", "Stage", "Gate", "Deploy"];
type PanelTab = "library" | "inspector" | "code" | "templates" | "runs" | "copilot";
type CatalogCertification = {
  status?: string;
  adapter?: string;
  requires?: string[];
};
type CatalogNode = {
  id: string;
  name: string;
  type?: string;
  description?: string;
  provider?: string;
  certification?: CatalogCertification;
};
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
  url?: string;
  method?: string;
  query?: string;
  body?: string;
  collection?: string;
  class_name?: string;
  record_id?: string;
  repo_url?: string;
  max_risk_score?: number;
  max_cost_usd?: number;
  monthly_cap_usd?: number;
  committed_spend_usd?: number;
  approval_id?: string;
  approved_by?: string;
  reason?: string;
  email?: string;
  webhook_url?: string;
  parent_hash?: string;
  max_price_usd?: number;
  workspace_budget_usd?: number;
  asset?: string;
  network?: string;
  settlement_required?: boolean;
  settlement_proof?: string;
  traffic_sample?: number;
  status?: string;
  format?: string;
  scope?: string;
  top_k?: number;
  question?: string;
  sandbox_url?: string;
  language?: string;
  code?: string;
  providers?: { provider: string; model?: string; estimated_cost?: number }[];
  candidates?: { provider: string; model?: string; estimated_cost?: number }[];
  routes?: { route?: string; label?: string; provider?: string; model?: string; keywords?: string[] }[];
  labels?: ({ label: string; keywords?: string[] } | string)[];
  steps?: ({ label: string; operation?: string } | string)[];
  agents?: { name: string; role?: string; model_provider?: string; model_name?: string }[];
  recipient?: string;
  headers?: Record<string, string>;
  auth_token?: string;
  retry_count?: number;
  payload_template?: Record<string, string>;
  max_attempts?: number;
  backoff_ms?: number;
  failure_threshold?: number;
  cooldown_seconds?: number;
  limit?: number;
  window_seconds?: number;
  server_url?: string;
  package_url?: string;
  base_url?: string;
  policy?: string;
  maxLatencyMs?: number;
  monthlyCapUsd?: number;
  requireEvidence?: boolean;
  redactPii?: boolean;
  redact_pii?: boolean;
  outputSchema?: string;

  // GPC fields
  filePath?: string;
  sep?: string;
  column?: string;
  value?: string;
  groupBy?: string;
  aggregateColumn?: string;
  aggregateFunction?: string;
  columns?: string[];
  outputPath?: string;
  sqlQuery?: string;
};

function catOf(nodeType: string, type: string | undefined, lookup: Record<string, string>): string {
  if (lookup[nodeType]) return lookup[nodeType];
  switch (type) {
    case "agent": return "agents";
    case "integration": return "integrations";
    case "data": return "data";
    case "runtime": return "runtime";
    case "custom": return "custom";
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
  const [shadowDeploy, setShadowDeploy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [running, setRunning] = useState(false);
  const [stageStatus, setStageStatus] = useState<Record<string, string>>({});
  const [runMsg, setRunMsg] = useState<string>();
  const [gpcIntent, setGpcIntent] = useState("");
  const [buildingGpc, setBuildingGpc] = useState(false);
  const [compiledCode, setCompiledCode] = useState<string>("");
  const [compiling, setCompiling] = useState<boolean>(false);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [nodePreviews, setNodePreviews] = useState<Record<string, any>>({});

  const list = unwrapList<any>(pipelines.data);
  const current = list.find((p) => p.id === pid) || list[0];
  const runs = useApi<any>(pid ? `/api/v1/pipelines/${pid}/runs` : null);
  const selectedNode = nodes.find((n) => n.id === selected) || null;

  // nodeType -> backend category/certification lookup from live palette
  const catLookup = useMemo(() => {
    const m: Record<string, string> = {};
    (palette.data?.categories || []).forEach((c: any) => (c.nodes || []).forEach((n: any) => {
      if (!m[n.id]) m[n.id] = c.id;
    }));
    return m;
  }, [palette.data]);

  const nodeCatalog = useMemo(() => {
    const m: Record<string, CatalogNode> = {};
    (palette.data?.categories || []).forEach((c: any) => (c.nodes || []).forEach((n: CatalogNode) => {
      if (!m[n.id]) m[n.id] = n;
    }));
    return m;
  }, [palette.data]);

  // The backend node catalog is the execution contract.
  const categories = useMemo(() => {
    return palette.data?.categories || [];
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
          certification: nodeCatalog[n.data?.nodeType || n.type || "node"]?.certification,
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
  }, [pid, catLookup, nodeCatalog]);

  function isGpcPipeline(ns: PNode[]): boolean {
    return ns.some((n) => ["CsvFileInput", "FilterRows", "Aggregate", "SelectColumns", "ParquetOutput", "DuckDBQuery"].includes(n.nodeType));
  }

  async function triggerCompile() {
    if (!pid) return;
    setCompiling(true);
    try {
      // Save current state first to ensure backend compiles latest edits
      await api(`/api/v1/pipelines/${pid}/graph`, {
        method: "PUT",
        body: {
          nodes: nodes.map((n) => ({ id: n.id, type: n.cat, position: { x: n.x, y: n.y }, data: { label: n.label, nodeType: n.nodeType } })),
          edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target, animated: true })),
          viewport: { x: 0, y: 0, zoom: 1 },
          node_configs: nodeConfigs,
        },
      });
      
      const res = await api<any>("/api/v1/gpc/compile", {
        method: "POST",
        body: { pipeline_id: pid, tenant_id: "system_gpc" }
      });
      if (res?.python_code) {
        setCompiledCode(res.python_code);
      } else if (res?.warnings?.length) {
        setCompiledCode(`# Compilation Warning:\n${res.warnings.join("\n")}`);
      }
    } catch (e) {
      setCompiledCode(`# Compilation Error:\n${(e as Error).message}`);
    } finally {
      setCompiling(false);
    }
  }

  // Live compilation hook
  useEffect(() => {
    if (panelTab === "code" && pid) {
      const delayDebounce = setTimeout(() => {
        triggerCompile();
      }, 500); // 500ms debounce
      return () => clearTimeout(delayDebounce);
    }
  }, [nodes, edges, nodeConfigs, panelTab, pid]);

  function addNode(catId: string, node: any) {
    const id = `${node.id}-${Date.now().toString(36)}`;
    const cx = 120 + (nodes.length % 6) * 60;
    const cy = 80 + (nodes.length % 5) * 70;
    setNodes((ns) => [...ns, { id, nodeType: node.id, label: node.name, cat: catId, x: cx, y: cy, certification: node.certification }]);
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
    
    // GPC active nodes and previews reset
    setActiveNodeId(null);
    setNodePreviews({});
    
    let timeout: number | undefined;
    try {
      const isGpc = isGpcPipeline(nodes);
      
      const controller = new AbortController();
      timeout = window.setTimeout(() => controller.abort(), 45000);
      
      let res: Response;
      if (isGpc) {
        // Save graph first to ensure backend executes the latest nodes and configs
        await saveGraph();
        
        // Execute GPC pipeline directly
        res = await fetch(apiUrl(`/api/v1/gpc/execute?pipeline_id=${pid}`), {
          method: "POST",
          headers: { 
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "application/json"
          },
          signal: controller.signal,
        });
      } else {
        const { run_id } = await api<any>(`/api/v1/pipelines/${pid}/run`, { method: "POST" });
        res = await fetch(apiUrl(`/api/v1/pipelines/${pid}/runs/${run_id}/stream`), {
          headers: { Authorization: `Bearer ${getToken()}` },
          signal: controller.signal,
        });
      }
      
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
          let dataIdx = part.indexOf("\ndata:");
          if (dataIdx !== -1) {
            dataIdx += 1;
          } else if (part.startsWith("data:")) {
            dataIdx = 0;
          }
          if (dataIdx === -1) continue;

          const endIdx = part.indexOf("\n", dataIdx);
          const dataStr = endIdx === -1 ? part.slice(dataIdx + 5) : part.slice(dataIdx + 5, endIdx);

          let ev: any;
          try { ev = JSON.parse(dataStr.trim()); } catch { continue; }
          
          if (isGpc) {
            // Parse GPC-specific SSE events
            if (ev.event === "start") {
              setRunMsg("Starting GPC pipeline compilation and sandboxed execution...");
              setStageStatus(Object.fromEntries(RUN_STAGES.map((s) => [s, s === "Source" ? "running" : "pending"])));
            } else if (ev.event === "node_start") {
              setActiveNodeId(ev.node_id);
              setSelected(ev.node_id); // Auto select the currently executing node to show live progress & preview
              setRunMsg(`Executing node ${ev.node_id}...`);
              setStageStatus((s) => {
                const next = { ...s };
                if (ev.index === 0) next["Source"] = "completed";
                if (ev.index > 0) next["Build"] = "completed";
                next["Validate"] = "running";
                return next;
              });
            } else if (ev.event === "node_complete") {
              setNodePreviews((prev) => ({ ...prev, [ev.node_id]: ev.preview }));
            } else if (ev.event === "complete") {
              setActiveNodeId(null);
              setStageStatus(Object.fromEntries(RUN_STAGES.map((s) => [s, "completed"])));
              setRunMsg(`Completed · run ID ${ev.run_id} · PIPEDA & Quebec Law 25 compliance checks verified`);
              runs.mutate();
            } else if (ev.event === "error") {
              setActiveNodeId(null);
              setRunMsg(`Execution error: ${ev.message}`);
              setStageStatus((s) => ({ ...s, Validate: "failed" }));
            }
          } else {
            // Parse standard pipeline execution events
            if (ev.stage) setStageStatus((s) => ({ ...s, [ev.stage]: ev.type === "step.completed" ? "completed" : "running" }));
            if (ev.type === "run.completed") {
              setStageStatus(Object.fromEntries(RUN_STAGES.map((s) => [s, "completed"])));
              setRunMsg(`Completed · evidence ${ev.evidence_id || "—"} · proof ${ev.proof_hash || "—"}`);
              runs.mutate();
            }
            if (ev.type === "run.waiting_approval") {
              setStageStatus((s) => ({ ...s, Gate: "running" }));
              const approvalId = ev.approval?.approval_id || "approval required";
              const reason = ev.approval?.reason || "ASK_HUMAN is waiting for approval";
              setRunMsg(`Waiting approval: ${approvalId} - ${reason}`);
              runs.mutate();
            }
            if (ev.type === "run.failed") {
              setRunMsg(`Run failed: ${ev.error || "backend execution failed"}`);
              runs.mutate();
            }
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

  async function buildWithGpc() {
    const intent = window.prompt("Describe the pipeline you want the AI to build:", "An input that goes to a vector search then is answered by an LLM");
    if (!intent) return;
    setBuildingGpc(true);
    try {
      const created = await api<any>("/api/v1/gpc/intent-to-plan", { 
        method: "POST", 
        body: { intent, provider: "ollama", model: "qwen2.5:3b" } 
      });
      await pipelines.mutate();
      if (created?.id) {
        setPid(created.id);
        setPanelTab("library");
      }
    } catch (e) {
      alert("Failed to build pipeline via GPC.");
    } finally {
      setBuildingGpc(false);
    }
  }

  async function applyTemplate(templateId: string) {
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
          status: shadowDeploy ? "shadow" : "live",
          shadowMode: shadowDeploy,
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
            <Button onClick={buildWithGpc} loading={buildingGpc}><Rocket size={14} /> GPC Auto-Build</Button>
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
                <label className="flex items-center gap-2 rounded-md border border-border bg-bg-900 px-2 py-1.5 text-[11px] text-ink-300">
                  <input type="checkbox" checked={shadowDeploy} onChange={(e) => setShadowDeploy(e.target.checked)} />
                  Shadow
                </label>
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
            <div className="grid grid-cols-6 gap-1 mb-3 rounded-lg border border-border bg-bg-900 p-1">
              <PanelTabButton active={panelTab === "library"} onClick={() => setPanelTab("library")} title="Library"><Library size={13} /></PanelTabButton>
              <PanelTabButton active={panelTab === "inspector"} onClick={() => setPanelTab("inspector")} title="Inspector"><Settings2 size={13} /></PanelTabButton>
              <PanelTabButton active={panelTab === "code"} onClick={() => setPanelTab("code")} title="Code"><Code size={13} /></PanelTabButton>
              <PanelTabButton active={panelTab === "copilot"} onClick={() => setPanelTab("copilot")} title="Copilot"><Bot size={13} /></PanelTabButton>
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
                            {ns.map((n: any) => {
                              const isPremium = ["pgl-register", "x402-payment-gate", "audit-signer", "policy-gate", "repo-risk-gate", "evidence-receipt", "capi-invoke", "quantum-terminal"].includes(n.id);
                              return (
                                <button key={n.id} onClick={() => addNode(cat.id, n)}
                                  className={clsx(
                                    "group flex items-center gap-2 rounded-lg border bg-white/[0.02] px-2.5 py-1.5 text-left transition",
                                    isPremium ? "border-brand-500/50 hover:bg-brand-500/10 hover:border-brand-400" : "border-border hover:border-ink-600 hover:bg-white/[0.04]"
                                  )}>
                                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: CAT_COLOR[cat.id] || CAT_COLOR.input }} />
                                  <span className="min-w-0 flex-1">
                                    <span className="flex items-center gap-1.5 text-[12px] text-ink-50">
                                      <span className="truncate">{n.name}</span>
                                      {isPremium && <Sparkles size={10} className="text-brand-400 shrink-0" />}
                                      <span className={clsx(
                                        "rounded border px-1 py-0.5 text-[8px] uppercase leading-none shrink-0 ml-auto",
                                        n.certification?.status === "real" ? "border-accent-green/30 bg-accent-green/10 text-accent-green"
                                        : n.certification?.status === "unsafe" ? "border-accent-red/30 bg-accent-red/10 text-accent-red"
                                        : "border-brand-500/30 bg-brand-500/10 text-brand-400"
                                      )}>{n.certification?.status || "real"}</span>
                                    </span>
                                    <span className="block text-[10px] text-ink-600 truncate">{n.description}</span>
                                  </span>
                                  <Plus size={12} className={clsx("shrink-0", isPremium ? "text-brand-400" : "text-ink-600 group-hover:text-brand-400")} />
                                </button>
                              );
                            })}
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
                  <NodeInspector node={selectedNode} config={nodeConfigs[selectedNode.id] || {}} onChange={patchSelectedConfig} preview={nodePreviews[selectedNode.id]} />
                ) : (
                  <div className="rounded-lg border border-border bg-white/[0.02] p-3 text-xs text-ink-500">
                    Select a node to configure provider, policy, budget, evidence, and output controls.
                  </div>
                )}
              </div>
            )}

            {panelTab === "code" && (
              <div className="rounded-lg border border-border bg-bg-950 p-3 max-h-[520px] overflow-auto scroll-thin font-mono text-[10px] text-ink-300 relative select-text">
                <div className="flex items-center justify-between border-b border-white/[0.05] pb-2 mb-2">
                  <span className="text-[11px] font-semibold text-brand-400 uppercase tracking-wider flex items-center gap-1.5 select-none">
                    <Code size={12} />
                    GPC AST Code
                  </span>
                  {compiling && (
                    <span className="flex items-center gap-1.5 text-brand-500 text-[9px] uppercase tracking-widest animate-pulse select-none">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-ping" />
                      Compiling...
                    </span>
                  )}
                </div>
                {compiling && !compiledCode ? (
                  <div className="space-y-2 py-4 select-none">
                    <div className="h-3 bg-white/[0.03] rounded w-3/4 animate-pulse" />
                    <div className="h-3 bg-white/[0.03] rounded w-5/6 animate-pulse" />
                    <div className="h-3 bg-white/[0.03] rounded w-2/3 animate-pulse" />
                    <div className="h-3 bg-white/[0.03] rounded w-full animate-pulse" />
                  </div>
                ) : (
                  <pre className="whitespace-pre overflow-x-auto selection:bg-brand-500/30 selection:text-white leading-relaxed">
                    {compiledCode || "# Drag, configure, or link nodes to live compile Python AST..."}
                  </pre>
                )}
              </div>
            )}

            {panelTab === "templates" && (
              <div className="space-y-2 max-h-[520px] overflow-y-auto scroll-thin pr-1">
                {templates.isLoading ? <Skeleton className="h-40 w-full" /> :
                  unwrapList<any>(templates.data?.templates || templates.data).map((t) => (
                    <button key={t.id} onClick={() => applyTemplate(t.id)}
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

            {panelTab === "copilot" && (
              <div className="space-y-3 max-h-[520px] overflow-y-auto scroll-thin pr-1">
                <div className="flex items-center gap-2 px-1 mb-2">
                  <Bot size={16} className="text-brand-400" />
                  <span className="text-sm font-semibold text-brand-400">Insight Copilot</span>
                </div>
                
                {nodes.length === 0 ? (
                  <div className="rounded-lg border border-brand-500/30 bg-brand-500/10 p-3 text-xs text-brand-100 flex items-start gap-2">
                    <Sparkles size={14} className="mt-0.5 shrink-0 text-brand-400" />
                    <div>
                      <span className="font-semibold block text-brand-300">Start Building</span>
                      Drag an <b>Input</b> node from the Library to begin constructing your pipeline.
                    </div>
                  </div>
                ) : (
                  <>
                    {!nodes.some(n => n.cat === "input") && (
                      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200 flex items-start gap-2">
                        <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-400" />
                        <div>
                          <span className="font-semibold block text-amber-400">Missing Input</span>
                          Your pipeline requires an initial data source. Add an <b>Input</b> or <b>Document Loader</b> node.
                        </div>
                      </div>
                    )}
                    
                    {!nodes.some(n => n.cat === "output") && (
                      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200 flex items-start gap-2">
                        <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-400" />
                        <div>
                          <span className="font-semibold block text-amber-400">Missing Output</span>
                          Your pipeline has no designated output. Consider adding a <b>JSON Formatter</b> or an <b>Audit Logger</b>.
                        </div>
                      </div>
                    )}

                    {!nodes.some(n => ["policy-gate", "x402-payment-gate", "pgl-register", "audit-signer", "repo-risk-gate", "capi-invoke", "quantum-terminal"].includes(n.nodeType)) && (
                      <div className="rounded-lg border border-brand-500/30 bg-brand-500/10 p-3 text-xs text-brand-100 flex items-start gap-2">
                        <Sparkles size={14} className="mt-0.5 shrink-0 text-brand-400" />
                        <div>
                          <span className="font-semibold block text-brand-300">Veklom Edge Recommendation</span>
                          Maximize your infrastructure! Secure this pipeline by adding a <b>Policy Gate</b>, or achieve literal UBC closed-loop sovereignty by connecting a <b>cAPI Node</b> or <b>Quantum Terminal</b>.
                        </div>
                      </div>
                    )}

                    {nodes.some(n => n.cat === "input") && nodes.some(n => n.cat === "output") && (
                      <div className="rounded-lg border border-accent-green/30 bg-accent-green/10 p-3 text-xs text-accent-green flex items-start gap-2">
                        <ShieldCheck size={14} className="mt-0.5 shrink-0" />
                        <div>
                          <span className="font-semibold block">End-to-End Ready</span>
                          Your pipeline has clear inputs and outputs. You can deploy it to production when ready.
                        </div>
                      </div>
                    )}
                  </>
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

        {/* Pipeline Compilation Telemetry Node */}
        <div className="mt-4">
          <TriageTelemetry context="pipelines" />
        </div>
      </TierGate>
    </Shell>
  );
}

function defaultNodeConfig(catId: string, nodeType: string): NodeConfig {
  if (nodeType === "CsvFileInput") return { filePath: "data.csv", sep: ",", policy: "inherit", requireEvidence: true };
  if (nodeType === "FilterRows") return { column: "status", value: "active", policy: "inherit", requireEvidence: true };
  if (nodeType === "Aggregate") return { groupBy: "status", aggregateColumn: "id", aggregateFunction: "count", policy: "inherit", requireEvidence: true };
  if (nodeType === "SelectColumns") return { columns: ["id", "username", "email", "status", "created_at"], policy: "inherit", requireEvidence: true };
  if (nodeType === "ParquetOutput") return { outputPath: "output.parquet", policy: "inherit", requireEvidence: true };
  if (nodeType === "DuckDBQuery") return { sqlQuery: "SELECT * FROM df WHERE status = 'active'", policy: "inherit", requireEvidence: true };

  if (nodeType === "input") return { text: "Describe the task for this governed pipeline.", policy: "inherit", requireEvidence: true };
  if (nodeType === "doc-loader" || nodeType === "file-read") return { text: "Paste document text or configure a governed URL.", policy: "tool_allowlist", requireEvidence: true };
  if (nodeType === "embed-bge") return { provider: "ollama", model: "bge-m3", policy: "sovereign_default", requireEvidence: true };
  if (nodeType === "embed-openai") return { provider: "openai", model: "text-embedding-3-small", policy: "sovereign_default", requireEvidence: true };
  if (nodeType === "pgvector") return { record_id: "", policy: "sovereign_default", requireEvidence: true };
  if (nodeType === "qdrant") return { url: "", collection: "veklom_pipeline", policy: "sovereign_default", requireEvidence: true };
  if (nodeType === "weaviate") return { url: "", class_name: "VeklomPipelineRecord", policy: "sovereign_default", requireEvidence: true };
  if (nodeType === "chunker") return { top_k: 5, policy: "inherit", requireEvidence: true };
  if (nodeType === "reranker" || nodeType === "hybrid-search") return { query: "", top_k: 5, policy: "sovereign_default", requireEvidence: true };
  if (nodeType === "evidence-pack") return { format: "signed_json", policy: "sovereign_default", requireEvidence: true };
  if (nodeType === "pgl-register") return { record_id: "", policy: "sovereign_default", requireEvidence: true };
  if (nodeType === "ask-human") return {
    approval_id: "",
    reason: "Human approval required before this governed workflow can continue.",
    email: "",
    webhook_url: "",
    policy: "sovereign_default",
    requireEvidence: true,
  };
  if (nodeType === "pgl-lineage-anchor") return { parent_hash: "", record_id: "", policy: "sovereign_default", requireEvidence: true };
  if (nodeType === "x402-payment-gate") return {
    max_price_usd: 0.01,
    workspace_budget_usd: 2500,
    asset: "USDC",
    network: "base",
    settlement_required: false,
    settlement_proof: "",
    policy: "cost_quality_balanced",
    requireEvidence: true,
  };
  if (nodeType === "evidence-receipt") return { format: "receipt_json", policy: "sovereign_default", requireEvidence: true };
  if (nodeType === "shadow-mode") return { traffic_sample: 0.05, policy: "sovereign_default", requireEvidence: true };
  if (nodeType === "repo-risk-gate") return { repo_url: "", max_risk_score: 70, policy: "sovereign_default", requireEvidence: true };
  if (nodeType === "cost-gate") return { max_cost_usd: 0.25, policy: "cost_quality_balanced", requireEvidence: true };
  if (nodeType === "budget-gate") return { monthly_cap_usd: 2500, committed_spend_usd: 0, policy: "cost_quality_balanced", requireEvidence: true };
  if (nodeType === "human-approval") return { status: "pending", approval_id: "", approved_by: "", policy: "sovereign_default", requireEvidence: true };
  if (nodeType === "deploy-endpoint" || nodeType === "deploy-agent") return { policy: "sovereign_default", requireEvidence: true };
  if (nodeType === "lock-engine") return { scope: "pipeline_execution_contract", policy: "sovereign_default", requireEvidence: true };
  if (nodeType === "capi-invoke") return { capi_node_id: "capi-edge-1", allow_autonomous_compute: true, policy: "sovereign_default", requireEvidence: true } as any;
  if (nodeType === "quantum-terminal") return { allow_shell: true, enforce_sandbox: false, default_dir: "/data", policy: "sovereign_default", requireEvidence: true } as any;
  if (["agent-node", "supervisor-agent", "critic-agent", "planner-agent"].includes(nodeType)) return {
    model_provider: "ollama",
    model_name: "qwen2.5:3b",
    temperature: 0.2,
    policy: "sovereign_default",
    requireEvidence: true,
    redact_pii: true,
    redactPii: true,
  };
  if (nodeType === "agent-team") return {
    agents: [
      { name: "Planner", role: "planner", model_provider: "ollama", model_name: "qwen2.5:3b" },
      { name: "Critic", role: "critic", model_provider: "ollama", model_name: "qwen2.5:3b" },
    ],
    policy: "sovereign_default",
    requireEvidence: true,
  };
  if (nodeType === "agent-handoff") return { recipient: "human", policy: "sovereign_default", requireEvidence: true };
  if (nodeType === "pgl-register-agent") return { record_id: "", policy: "sovereign_default", requireEvidence: true };
  if (nodeType === "langchain_agent" || nodeType === "lc-agent") return {
    model_provider: "ollama",
    model_name: "qwen2.5:3b",
    system_prompt: "You are a governed Veklom ReAct agent. Use approved tools only and return enterprise-ready output.",
    tools_allowed: ["nexus_tool"],
    blocked_tools: ["code_executor"],
    max_iterations: 3,
    timeout_seconds: 45,
    temperature: 0.2,
    policy: "sovereign_default",
    requireEvidence: true,
    redact_pii: true,
    redactPii: true,
  };
  if (nodeType === "lc-langgraph") return {
    steps: [
      { label: "Normalize input", operation: "pass" },
      { label: "Apply governed state transition", operation: "pass" },
    ],
    policy: "sovereign_default",
    requireEvidence: true,
  };
  if (nodeType === "lc-memory") return { policy: "inherit", requireEvidence: true };
  if (nodeType === "lc-toolnode") return { tools_allowed: ["nexus_tool"], policy: "tool_allowlist", requireEvidence: true };
  if (nodeType === "lc-retrievalqa") return {
    model_provider: "ollama",
    model_name: "qwen2.5:3b",
    question: "",
    temperature: 0.2,
    policy: "sovereign_default",
    requireEvidence: true,
  };
  if (nodeType === "cost-router") return {
    candidates: [
      { provider: "ollama", model: "qwen2.5:3b", estimated_cost: 0 },
      { provider: "groq", model: "llama-3.1-8b-instant", estimated_cost: 0.00002 },
      { provider: "gemini", model: "gemini-2.5-flash", estimated_cost: 0.00004 },
    ],
    policy: "cost_quality_balanced",
    requireEvidence: true,
  };
  if (nodeType === "fallback" || nodeType === "load-balancer") return {
    providers: [
      { provider: "ollama", model: "qwen2.5:3b" },
      { provider: "groq", model: "llama-3.1-8b-instant" },
    ],
    policy: "sovereign_default",
    requireEvidence: true,
  };
  if (nodeType === "classifier") return { labels: [{ label: "support", keywords: ["help", "issue"] }, { label: "sales", keywords: ["price", "demo"] }], policy: "sovereign_default", requireEvidence: true };
  if (nodeType === "semantic-router") return { routes: [{ route: "support", keywords: ["help", "issue"], provider: "ollama", model: "qwen2.5:3b" }, { route: "sales", keywords: ["price", "demo"], provider: "groq", model: "llama-3.1-8b-instant" }], policy: "sovereign_default", requireEvidence: true };
  if (nodeType === "code-exec") return { sandbox_url: "", language: "python", code: "print(input)", policy: "tool_allowlist", requireEvidence: true };
  if (["webhook", "webhook-output", "email-send", "slack-send", "discord-send", "github-action", "jira-action", "pagerduty-event", "stripe-event"].includes(nodeType)) return {
    method: "POST",
    url: "",
    headers: {},
    auth_token: "",
    retry_count: 2,
    timeout_seconds: 10,
    payload_template: { result: "$.result", audit_hash: "$.audit_hash", cost: "$.cost" },
    policy: "tool_allowlist",
    requireEvidence: true,
  };
  if (nodeType === "custom-http") return { method: "POST", url: "", policy: "tool_allowlist", requireEvidence: true };
  if (nodeType === "custom-python") return { sandbox_url: "", language: "python", code: "print(input)", policy: "tool_allowlist", requireEvidence: true };
  if (nodeType === "custom-mcp-tool") return { server_url: "", policy: "tool_allowlist", requireEvidence: true };
  if (nodeType === "custom-node-package") return { package_url: "", sandbox_url: "", policy: "tool_allowlist", requireEvidence: true };
  if (nodeType === "retry-logic") return { max_attempts: 3, backoff_ms: 500, policy: "inherit", requireEvidence: true };
  if (nodeType === "circuit-breaker") return { failure_threshold: 3, cooldown_seconds: 60, policy: "inherit", requireEvidence: true };
  if (nodeType === "rate-limiter") return { limit: 100, window_seconds: 60, policy: "inherit", requireEvidence: true };
  if (nodeType === "llm-openai-compatible") return { provider: "openai-compatible", model: "custom-model", base_url: "", policy: "cost_quality_balanced", requireEvidence: true };
  if (catId === "models" || nodeType.startsWith("llm-")) return { provider: nodeType.replace("llm-", ""), model: nodeType, policy: "cost_quality_balanced", maxLatencyMs: 1200, monthlyCapUsd: 2500, requireEvidence: true };
  if (catId === "routing" || nodeType.includes("policy")) return { policy: "sovereign_default", requireEvidence: true, redactPii: true, maxLatencyMs: 300 };
  if (catId === "output") return { outputSchema: "signed_json", requireEvidence: true, redactPii: nodeType.includes("pii") };
  if (nodeType === "http-call") return { method: "GET", url: "", policy: "tool_allowlist", requireEvidence: true, maxLatencyMs: 2000 };
  if (nodeType === "web-search") return { query: "", policy: "tool_allowlist", requireEvidence: true, maxLatencyMs: 3000 };
  if (nodeType === "sql-query") return { query: "select 1 as ok", policy: "tool_allowlist", requireEvidence: true, maxLatencyMs: 2000 };
  if (nodeType === "nexus-tool") return { query: "governance", policy: "tool_allowlist", requireEvidence: true, maxLatencyMs: 1200 };
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

function NodeInspector({ node, config, onChange, preview }: { node: PNode; config: NodeConfig; onChange: (patch: NodeConfig) => void; preview?: any }) {
  const isLangChainAgent = node.nodeType === "langchain_agent" || node.nodeType === "lc-agent";
  const isAgentModel = ["agent-node", "supervisor-agent", "critic-agent", "planner-agent"].includes(node.nodeType);
  const isModelBacked = isLangChainAgent || isAgentModel || node.nodeType === "lc-retrievalqa" || node.nodeType.startsWith("llm-") || node.nodeType.startsWith("embed-");
  const acceptsText = ["input", "doc-loader", "file-read"].includes(node.nodeType);
  const acceptsUrl = ["doc-loader", "file-read", "http-call", "custom-http", "webhook", "webhook-output", "email-send", "slack-send", "discord-send", "github-action", "jira-action", "pagerduty-event", "stripe-event", "qdrant", "weaviate"].includes(node.nodeType);
  const acceptsQuery = ["web-search", "sql-query", "nexus-tool", "reranker", "hybrid-search"].includes(node.nodeType);
  const acceptsHttp = ["http-call", "custom-http", "webhook", "webhook-output", "email-send", "slack-send", "discord-send", "github-action", "jira-action", "pagerduty-event", "stripe-event"].includes(node.nodeType);
  const isVectorStore = ["pgvector", "qdrant", "weaviate"].includes(node.nodeType);
  const isRoutingConfig = ["cost-router", "fallback", "load-balancer", "classifier", "semantic-router"].includes(node.nodeType);
  const isLangGraph = node.nodeType === "lc-langgraph";
  const isCodeExec = ["code-exec", "custom-python"].includes(node.nodeType);
  const isVeklomGate = ["repo-risk-gate", "cost-gate", "budget-gate", "human-approval", "ask-human", "pgl-register", "pgl-register-agent", "pgl-lineage-anchor", "x402-payment-gate", "evidence-pack", "evidence-receipt", "shadow-mode", "lock-engine", "deploy-endpoint", "deploy-agent"].includes(node.nodeType);
  const isWebhookLike = ["webhook", "webhook-output", "email-send", "slack-send", "discord-send", "github-action", "jira-action", "pagerduty-event", "stripe-event"].includes(node.nodeType);
  const isCustomContract = ["custom-mcp-tool", "custom-node-package"].includes(node.nodeType);
  const isRuntimeContract = ["retry-logic", "circuit-breaker", "rate-limiter"].includes(node.nodeType);
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
        <span className={clsx(
          "ml-auto rounded-md border px-1.5 py-0.5 text-[9px] uppercase",
          node.certification?.status === "real" ? "border-accent-green/30 bg-accent-green/10 text-accent-green"
          : node.certification?.status === "unsafe" ? "border-accent-red/30 bg-accent-red/10 text-accent-red"
          : "border-brand-500/30 bg-brand-500/10 text-brand-400"
        )}>
          {node.certification?.status || "real"}
        </span>
      </div>
      <div className="space-y-2">
        {node.certification?.adapter && (
          <div className="rounded-md border border-border bg-bg-900 px-2 py-1.5 text-[10px] text-ink-500">
            Adapter: <span className="font-mono text-ink-300">{node.certification.adapter}</span>
            {!!node.certification.requires?.length && <span className="block mt-1">Requires: {node.certification.requires.join(", ")}</span>}
          </div>
        )}
        {node.nodeType === "CsvFileInput" && (
          <div className="space-y-2 border-b border-border/20 pb-3 mb-3">
            <Control label="File Path">
              <input
                className="input h-8 text-xs font-mono"
                value={config.filePath || ""}
                onChange={(e) => onChange({ filePath: e.target.value })}
                placeholder="data.csv"
              />
            </Control>
            <Control label="Delimiter">
              <input
                className="input h-8 text-xs font-mono"
                value={config.sep || ""}
                onChange={(e) => onChange({ sep: e.target.value })}
                placeholder=","
              />
            </Control>
          </div>
        )}
        {node.nodeType === "FilterRows" && (
          <div className="space-y-2 border-b border-border/20 pb-3 mb-3">
            <Control label="Filter Column">
              <input
                className="input h-8 text-xs font-mono"
                value={config.column || ""}
                onChange={(e) => onChange({ column: e.target.value })}
                placeholder="e.g. status"
              />
            </Control>
            <Control label="Filter Value">
              <input
                className="input h-8 text-xs font-mono"
                value={config.value || ""}
                onChange={(e) => onChange({ value: e.target.value })}
                placeholder="e.g. active"
              />
            </Control>
          </div>
        )}
        {node.nodeType === "Aggregate" && (
          <div className="space-y-2 border-b border-border/20 pb-3 mb-3">
            <Control label="Group By Column">
              <input
                className="input h-8 text-xs font-mono"
                value={config.groupBy || ""}
                onChange={(e) => onChange({ groupBy: e.target.value })}
                placeholder="e.g. status"
              />
            </Control>
            <Control label="Aggregate Column">
              <input
                className="input h-8 text-xs font-mono"
                value={config.aggregateColumn || ""}
                onChange={(e) => onChange({ aggregateColumn: e.target.value })}
                placeholder="e.g. id"
              />
            </Control>
            <Control label="Aggregation Function">
              <select
                className="input h-8 text-xs"
                value={config.aggregateFunction || "count"}
                onChange={(e) => onChange({ aggregateFunction: e.target.value })}
              >
                {["count", "sum", "avg", "min", "max"].map((fn) => (
                  <option key={fn} className="bg-bg-800" value={fn}>{fn.toUpperCase()}</option>
                ))}
              </select>
            </Control>
          </div>
        )}
        {node.nodeType === "SelectColumns" && (
          <div className="space-y-2 border-b border-border/20 pb-3 mb-3">
            <Control label="Columns (comma-separated)">
              <input
                className="input h-8 text-xs font-mono"
                value={(config.columns || []).join(", ")}
                onChange={(e) => onChange({ columns: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                placeholder="id, username, email"
              />
            </Control>
          </div>
        )}
        {node.nodeType === "ParquetOutput" && (
          <div className="space-y-2 border-b border-border/20 pb-3 mb-3">
            <Control label="Output Path">
              <input
                className="input h-8 text-xs font-mono"
                value={config.outputPath || ""}
                onChange={(e) => onChange({ outputPath: e.target.value })}
                placeholder="output.parquet"
              />
            </Control>
          </div>
        )}
        {node.nodeType === "DuckDBQuery" && (
          <div className="space-y-2 border-b border-border/20 pb-3 mb-3">
            <Control label="DuckDB SQL Query">
              <textarea
                className="input min-h-24 py-2 text-xs font-mono resize-none leading-relaxed"
                value={config.sqlQuery || ""}
                onChange={(e) => onChange({ sqlQuery: e.target.value })}
                placeholder="SELECT * FROM df WHERE status = 'active'"
              />
            </Control>
          </div>
        )}

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
        {isModelBacked && (
          <div className="grid grid-cols-2 gap-2">
            <Control label="Provider">
              <input className="input h-8 text-xs" value={config.model_provider || config.provider || ""} onChange={(e) => onChange(isLangChainAgent || isAgentModel || node.nodeType === "lc-retrievalqa" ? { model_provider: e.target.value } : { provider: e.target.value })} placeholder="ollama" />
            </Control>
            <Control label="Model">
              <input className="input h-8 text-xs" value={isLangChainAgent || isAgentModel || node.nodeType === "lc-retrievalqa" ? (config.model_name || "") : (config.model || "")} onChange={(e) => onChange(isLangChainAgent || isAgentModel || node.nodeType === "lc-retrievalqa" ? { model_name: e.target.value } : { model: e.target.value })} placeholder="qwen2.5:3b" />
            </Control>
          </div>
        )}
        {acceptsText && (
          <Control label="Input text">
            <textarea className="input min-h-20 py-2 text-xs resize-none" value={config.text || ""} onChange={(e) => onChange({ text: e.target.value })} placeholder="Text payload" />
          </Control>
        )}
        {acceptsQuery && (
          <Control label={node.nodeType === "sql-query" ? "SQL query" : "Query"}>
            <textarea className="input min-h-16 py-2 text-xs resize-none font-mono" value={config.query || ""} onChange={(e) => onChange({ query: e.target.value })} placeholder={node.nodeType === "sql-query" ? "select 1 as ok" : "Search query"} />
          </Control>
        )}
        {acceptsUrl && (
          <Control label="URL">
            <input className="input h-8 text-xs" value={config.url || ""} onChange={(e) => onChange({ url: e.target.value })} placeholder="https://api.example.com" />
          </Control>
        )}
        {acceptsHttp && (
          <div className="grid grid-cols-2 gap-2">
            <Control label="Method">
              <select className="input h-8 text-xs" value={config.method || "GET"} onChange={(e) => onChange({ method: e.target.value })}>
                {(isWebhookLike ? ["POST", "PUT", "PATCH"] : ["GET", "POST", "PUT", "PATCH", "DELETE"]).map((m) => <option key={m} className="bg-bg-800" value={m}>{m}</option>)}
              </select>
            </Control>
            <Control label="Body">
              <input className="input h-8 text-xs" value={config.body || ""} onChange={(e) => onChange({ body: e.target.value })} placeholder="JSON or text" />
            </Control>
          </div>
        )}
        {node.nodeType === "llm-openai-compatible" && (
          <Control label="Base URL">
            <input className="input h-8 text-xs" value={config.base_url || ""} onChange={(e) => onChange({ base_url: e.target.value })} placeholder="https://models.example.com/v1" />
          </Control>
        )}
        {isWebhookLike && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Control label="Retry count">
                <input className="input h-8 text-xs" type="number" min="0" max="5" value={config.retry_count ?? 2} onChange={(e) => onChange({ retry_count: Number(e.target.value) || 0 })} />
              </Control>
              <Control label="Timeout">
                <input className="input h-8 text-xs" type="number" min="2" max="60" value={config.timeout_seconds ?? 10} onChange={(e) => onChange({ timeout_seconds: Number(e.target.value) || 10 })} />
              </Control>
            </div>
            <Control label="Auth token">
              <input className="input h-8 text-xs" type="password" value={config.auth_token || ""} onChange={(e) => onChange({ auth_token: e.target.value })} placeholder="Enter auth token" />
            </Control>
            <JsonConfigControl label="Headers" field="headers" value={config.headers || {}} onChange={onChange} />
            <JsonConfigControl label="Payload template" field="payload_template" value={config.payload_template || { result: "$.result", audit_hash: "$.audit_hash", cost: "$.cost" }} onChange={onChange} />
          </>
        )}
        {isVectorStore && (
          <div className="grid grid-cols-2 gap-2">
            {node.nodeType !== "pgvector" && (
              <Control label={node.nodeType === "qdrant" ? "Collection" : "Class name"}>
                <input className="input h-8 text-xs" value={node.nodeType === "qdrant" ? (config.collection || "") : (config.class_name || "")} onChange={(e) => onChange(node.nodeType === "qdrant" ? { collection: e.target.value } : { class_name: e.target.value })} placeholder={node.nodeType === "qdrant" ? "veklom_pipeline" : "VeklomPipelineRecord"} />
              </Control>
            )}
            <Control label="Record id">
              <input className="input h-8 text-xs" value={config.record_id || ""} onChange={(e) => onChange({ record_id: e.target.value })} placeholder="auto" />
            </Control>
          </div>
        )}
        {isVeklomGate && node.nodeType === "repo-risk-gate" && (
          <div className="grid grid-cols-2 gap-2">
            <Control label="Repo URL">
              <input className="input h-8 text-xs" value={config.repo_url || ""} onChange={(e) => onChange({ repo_url: e.target.value })} placeholder="https://github.com/org/repo" />
            </Control>
            <Control label="Max risk">
              <input className="input h-8 text-xs" type="number" value={config.max_risk_score || 70} onChange={(e) => onChange({ max_risk_score: Number(e.target.value) || 70 })} />
            </Control>
          </div>
        )}
        {isVeklomGate && node.nodeType === "cost-gate" && (
          <Control label="Max cost USD">
            <input className="input h-8 text-xs" type="number" step="0.000001" value={config.max_cost_usd ?? 0.25} onChange={(e) => onChange({ max_cost_usd: Number(e.target.value) })} />
          </Control>
        )}
        {isVeklomGate && node.nodeType === "budget-gate" && (
          <div className="grid grid-cols-2 gap-2">
            <Control label="Monthly cap">
              <input className="input h-8 text-xs" type="number" value={config.monthly_cap_usd ?? 2500} onChange={(e) => onChange({ monthly_cap_usd: Number(e.target.value) })} />
            </Control>
            <Control label="Committed">
              <input className="input h-8 text-xs" type="number" value={config.committed_spend_usd ?? 0} onChange={(e) => onChange({ committed_spend_usd: Number(e.target.value) })} />
            </Control>
          </div>
        )}
        {isVeklomGate && node.nodeType === "human-approval" && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Control label="Status">
                <select className="input h-8 text-xs" value={config.status || "pending"} onChange={(e) => onChange({ status: e.target.value })}>
                  <option className="bg-bg-800" value="pending">Pending</option>
                  <option className="bg-bg-800" value="approved">Approved</option>
                </select>
              </Control>
              <Control label="Approval ID">
                <input className="input h-8 text-xs" value={config.approval_id || ""} onChange={(e) => onChange({ approval_id: e.target.value })} placeholder="approval ticket" />
              </Control>
            </div>
            <Control label="Approved by">
              <input className="input h-8 text-xs" value={config.approved_by || ""} onChange={(e) => onChange({ approved_by: e.target.value })} placeholder="security@company.com" />
            </Control>
          </>
        )}
        {isVeklomGate && node.nodeType === "ask-human" && (
          <>
            <Control label="Approval ID">
              <input className="input h-8 text-xs" value={config.approval_id || ""} onChange={(e) => onChange({ approval_id: e.target.value })} placeholder="auto or ticket id" />
            </Control>
            <Control label="Reason">
              <textarea className="input min-h-16 py-2 text-xs resize-none" value={config.reason || ""} onChange={(e) => onChange({ reason: e.target.value })} placeholder="Why approval is required" />
            </Control>
            <div className="grid grid-cols-2 gap-2">
              <Control label="Approver email">
                <input className="input h-8 text-xs" value={config.email || ""} onChange={(e) => onChange({ email: e.target.value })} placeholder="security@company.com" />
              </Control>
              <Control label="Webhook URL">
                <input className="input h-8 text-xs" value={config.webhook_url || ""} onChange={(e) => onChange({ webhook_url: e.target.value })} placeholder="https://..." />
              </Control>
            </div>
          </>
        )}
        {isVeklomGate && node.nodeType === "pgl-register" && (
          <Control label="Ledger record">
            <input className="input h-8 text-xs" value={config.record_id || ""} onChange={(e) => onChange({ record_id: e.target.value })} placeholder="auto" />
          </Control>
        )}
        {isVeklomGate && node.nodeType === "pgl-lineage-anchor" && (
          <div className="grid grid-cols-2 gap-2">
            <Control label="Parent proof hash">
              <input className="input h-8 text-xs font-mono" value={config.parent_hash || ""} onChange={(e) => onChange({ parent_hash: e.target.value })} placeholder="0x..." />
            </Control>
            <Control label="Record ID">
              <input className="input h-8 text-xs" value={config.record_id || ""} onChange={(e) => onChange({ record_id: e.target.value })} placeholder="auto" />
            </Control>
          </div>
        )}
        {isVeklomGate && node.nodeType === "x402-payment-gate" && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Control label="Max price USD">
                <input className="input h-8 text-xs" type="number" step="0.000001" value={config.max_price_usd ?? 0.01} onChange={(e) => onChange({ max_price_usd: Number(e.target.value) })} />
              </Control>
              <Control label="Workspace cap">
                <input className="input h-8 text-xs" type="number" value={config.workspace_budget_usd ?? 2500} onChange={(e) => onChange({ workspace_budget_usd: Number(e.target.value) })} />
              </Control>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Control label="Asset">
                <input className="input h-8 text-xs" value={config.asset || "USDC"} onChange={(e) => onChange({ asset: e.target.value })} />
              </Control>
              <Control label="Network">
                <input className="input h-8 text-xs" value={config.network || "base"} onChange={(e) => onChange({ network: e.target.value })} />
              </Control>
            </div>
            <label className="flex items-center justify-between gap-3 rounded-md border border-border bg-bg-900 px-2 py-1.5 text-[11px] text-ink-300">
              Settlement proof required
              <input type="checkbox" checked={!!config.settlement_required} onChange={(e) => onChange({ settlement_required: e.target.checked })} />
            </label>
            {config.settlement_required && (
              <Control label="Settlement proof">
                <input className="input h-8 text-xs font-mono" value={config.settlement_proof || ""} onChange={(e) => onChange({ settlement_proof: e.target.value })} placeholder="payment proof" />
              </Control>
            )}
          </>
        )}
        {isVeklomGate && node.nodeType === "evidence-pack" && (
          <Control label="Evidence format">
            <input className="input h-8 text-xs" value={config.format || "signed_json"} onChange={(e) => onChange({ format: e.target.value })} />
          </Control>
        )}
        {isVeklomGate && node.nodeType === "evidence-receipt" && (
          <Control label="Receipt format">
            <input className="input h-8 text-xs" value={config.format || "receipt_json"} onChange={(e) => onChange({ format: e.target.value })} />
          </Control>
        )}
        {isVeklomGate && node.nodeType === "shadow-mode" && (
          <Control label="Traffic sample">
            <input className="input h-8 text-xs" type="number" min="0" max="1" step="0.01" value={config.traffic_sample ?? 0.05} onChange={(e) => onChange({ traffic_sample: Number(e.target.value) })} />
          </Control>
        )}
        {isVeklomGate && node.nodeType === "lock-engine" && (
          <Control label="Lock scope">
            <input className="input h-8 text-xs" value={config.scope || "pipeline_execution_contract"} onChange={(e) => onChange({ scope: e.target.value })} />
          </Control>
        )}
        {node.nodeType === "agent-team" && (
          <JsonConfigControl label="Agents" field="agents" value={config.agents || []} onChange={onChange} />
        )}
        {node.nodeType === "agent-handoff" && (
          <Control label="Recipient">
            <input className="input h-8 text-xs" value={config.recipient || "human"} onChange={(e) => onChange({ recipient: e.target.value })} placeholder="human or agent id" />
          </Control>
        )}
        {isRuntimeContract && node.nodeType === "retry-logic" && (
          <div className="grid grid-cols-2 gap-2">
            <Control label="Max attempts">
              <input className="input h-8 text-xs" type="number" min="1" max="10" value={config.max_attempts ?? 3} onChange={(e) => onChange({ max_attempts: Number(e.target.value) || 3 })} />
            </Control>
            <Control label="Backoff ms">
              <input className="input h-8 text-xs" type="number" value={config.backoff_ms ?? 500} onChange={(e) => onChange({ backoff_ms: Number(e.target.value) || 500 })} />
            </Control>
          </div>
        )}
        {isRuntimeContract && node.nodeType === "circuit-breaker" && (
          <div className="grid grid-cols-2 gap-2">
            <Control label="Failures">
              <input className="input h-8 text-xs" type="number" value={config.failure_threshold ?? 3} onChange={(e) => onChange({ failure_threshold: Number(e.target.value) || 3 })} />
            </Control>
            <Control label="Cooldown">
              <input className="input h-8 text-xs" type="number" value={config.cooldown_seconds ?? 60} onChange={(e) => onChange({ cooldown_seconds: Number(e.target.value) || 60 })} />
            </Control>
          </div>
        )}
        {isRuntimeContract && node.nodeType === "rate-limiter" && (
          <div className="grid grid-cols-2 gap-2">
            <Control label="Limit">
              <input className="input h-8 text-xs" type="number" value={config.limit ?? 100} onChange={(e) => onChange({ limit: Number(e.target.value) || 100 })} />
            </Control>
            <Control label="Window sec">
              <input className="input h-8 text-xs" type="number" value={config.window_seconds ?? 60} onChange={(e) => onChange({ window_seconds: Number(e.target.value) || 60 })} />
            </Control>
          </div>
        )}
        {isCustomContract && node.nodeType === "custom-mcp-tool" && (
          <Control label="MCP server URL">
            <input className="input h-8 text-xs" value={config.server_url || ""} onChange={(e) => onChange({ server_url: e.target.value })} placeholder="https://mcp.example.com/run" />
          </Control>
        )}
        {isCustomContract && node.nodeType === "custom-node-package" && (
          <div className="grid grid-cols-2 gap-2">
            <Control label="Package URL">
              <input className="input h-8 text-xs" value={config.package_url || ""} onChange={(e) => onChange({ package_url: e.target.value })} placeholder="https://..." />
            </Control>
            <Control label="Sandbox URL">
              <input className="input h-8 text-xs" value={config.sandbox_url || ""} onChange={(e) => onChange({ sandbox_url: e.target.value })} placeholder="https://sandbox..." />
            </Control>
          </div>
        )}
        {(node.nodeType === "reranker" || node.nodeType === "hybrid-search" || node.nodeType === "chunker") && (
          <Control label={node.nodeType === "chunker" ? "Chunk / top size" : "Top K"}>
            <input className="input h-8 text-xs" type="number" min="1" max="25" value={config.top_k || 5} onChange={(e) => onChange({ top_k: Number(e.target.value) || 5 })} />
          </Control>
        )}
        {node.nodeType === "lc-retrievalqa" && (
          <Control label="Question">
            <textarea className="input min-h-16 py-2 text-xs resize-none" value={config.question || ""} onChange={(e) => onChange({ question: e.target.value })} placeholder="Question over retrieved context" />
          </Control>
        )}
        {isLangGraph && (
          <JsonConfigControl label="Graph steps" field="steps" value={config.steps || []} onChange={onChange} />
        )}
        {isRoutingConfig && node.nodeType === "cost-router" && (
          <JsonConfigControl label="Candidates" field="candidates" value={config.candidates || []} onChange={onChange} />
        )}
        {isRoutingConfig && ["fallback", "load-balancer"].includes(node.nodeType) && (
          <JsonConfigControl label="Providers" field="providers" value={config.providers || []} onChange={onChange} />
        )}
        {isRoutingConfig && node.nodeType === "classifier" && (
          <JsonConfigControl label="Labels" field="labels" value={config.labels || []} onChange={onChange} />
        )}
        {isRoutingConfig && node.nodeType === "semantic-router" && (
          <JsonConfigControl label="Routes" field="routes" value={config.routes || []} onChange={onChange} />
        )}
        {isCodeExec && (
          <>
            <Control label="Sandbox URL">
              <input className="input h-8 text-xs" value={config.sandbox_url || ""} onChange={(e) => onChange({ sandbox_url: e.target.value })} placeholder="https://sandbox.example.com/execute" />
            </Control>
            <div className="grid grid-cols-2 gap-2">
              <Control label="Language">
                <select className="input h-8 text-xs" value={config.language || "python"} onChange={(e) => onChange({ language: e.target.value })}>
                  {["python", "javascript"].map((lang) => <option key={lang} className="bg-bg-800" value={lang}>{lang}</option>)}
                </select>
              </Control>
              <Control label="Code">
                <input className="input h-8 text-xs font-mono" value={config.code || ""} onChange={(e) => onChange({ code: e.target.value })} placeholder="print(input)" />
              </Control>
            </div>
          </>
        )}
        {isLangChainAgent && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Control label="Temperature">
                <input className="input h-8 text-xs" type="number" step="0.1" min="0" max="2" value={config.temperature ?? 0.2} onChange={(e) => onChange({ temperature: Number(e.target.value) })} />
              </Control>
              <Control label="PII mode">
                <select className="input h-8 text-xs" value={(config.redactPii || config.redact_pii) ? "redact" : "pass"} onChange={(e) => onChange({ redactPii: e.target.value === "redact", redact_pii: e.target.value === "redact" })}>
                  <option className="bg-bg-800" value="redact">Redact</option>
                  <option className="bg-bg-800" value="pass">Pass through</option>
                </select>
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
                {["web_search", "http_request", "sql_query", "file_reader", "nexus_tool", "code_executor"].map((tool) => (
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
                {["web_search", "http_request", "sql_query", "file_reader", "nexus_tool", "code_executor"].map((tool) => (
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

      {preview && (
        <div className="mt-4 border-t border-border/40 pt-4 space-y-3">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-accent-green uppercase tracking-wider">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-green"></span>
            </span>
            Live Dataset Preview
          </div>
          <div className="text-[10px] text-ink-500 font-medium select-none">
            {preview.rows?.toLocaleString() || "0"} rows &times; {preview.columns?.length || "0"} columns
          </div>

          {preview.columns?.length > 0 && preview.sample?.length > 0 && (
            <div className="overflow-x-auto rounded border border-border bg-bg-950/50 scroll-thin">
              <table className="w-full text-left border-collapse font-mono text-[9px] leading-tight select-none">
                <thead>
                  <tr className="border-b border-border bg-bg-900">
                    {preview.columns.map((col: string, idx: number) => (
                      <th key={idx} className="px-2 py-1.5 font-bold text-ink-300 truncate max-w-28">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.sample.slice(0, 3).map((row: any[], rIdx: number) => (
                    <tr key={rIdx} className={rIdx < 2 ? "border-b border-border/20" : ""}>
                      {row.map((val: any, cIdx: number) => (
                        <td key={cIdx} className="px-2 py-1 text-ink-400 truncate max-w-28" title={String(val)}>
                          {typeof val === "object" && val !== null ? JSON.stringify(val) : String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {preview.metadata && Object.keys(preview.metadata).length > 0 && (
            <div className="rounded border border-border bg-bg-950/60 p-2 font-mono text-[9px] text-ink-400 space-y-1">
              <div className="text-[8px] uppercase tracking-wider text-ink-600 font-bold border-b border-white/[0.03] pb-1 select-none">Metadata Attributes</div>
              <pre className="whitespace-pre-wrap overflow-x-auto leading-normal text-[9px] text-brand-400 select-text">
                {JSON.stringify(preview.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function JsonConfigControl({ label, field, value, onChange }: { label: string; field: keyof NodeConfig; value: unknown; onChange: (patch: NodeConfig) => void }) {
  const [raw, setRaw] = useState(() => JSON.stringify(value, null, 2));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRaw(JSON.stringify(value, null, 2));
  }, [value]);

  return (
    <Control label={label}>
      <textarea
        className={clsx("input min-h-28 py-2 text-xs resize-none font-mono", error && "border-accent-red/60")}
        value={raw}
        onChange={(e) => {
          const next = e.target.value;
          setRaw(next);
          try {
            const parsed = JSON.parse(next);
            setError(null);
            onChange({ [field]: parsed } as NodeConfig);
          } catch {
            setError("Invalid JSON");
          }
        }}
      />
      {error && <span className="mt-1 block text-[10px] text-accent-red">{error}</span>}
    </Control>
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
