"use client";

import { useApi } from "@/hooks/useApi";
import { Card, Button } from "@/components/ui";
import {
  CheckCircle2,
  Copy,
  Download,
  FileCheck,
  Fingerprint,
  Globe,
  KeyRound,
  Landmark,
  Layers,
  Link2,
  Shield,
  User,
  Wallet,
  XCircle,
  AlertTriangle,
} from "lucide-react";

interface AuthorityContext {
  agent_id?: string;
  workspace_id?: string;
  authority_run_id?: string;
  agent_info?: {
    id: string;
    name: string;
    creator: string;
    jurisdiction: string;
    declared_purpose: string;
    status: string;
    created_at?: string;
  };
  birth_certificate?: {
    certificate_id: string;
    genome_hash: string;
    document_uri?: string;
    parent_agent_ids: string[];
    issued_at?: string;
  };
  lineage: Array<{
    type: "parent" | "child";
    agent_id: string;
    name: string;
    relationship: string;
    created_at?: string;
  }>;
  authority_bundle?: {
    id: string;
    name: string;
    version: string;
    risk_level: string;
    tool_permissions: Record<string, any>;
    workspace_restrictions: Record<string, any>;
    time_restrictions: Record<string, any>;
    description: string;
    tags: string[];
    created_at?: string;
  };
  active_run?: {
    id: string;
    status: string;
    start_time?: string;
    end_time?: string;
    total_actions: number;
    approved_actions: number;
    denied_actions: number;
    violation_count: number;
    decisions: any[];
    violations: any[];
    approvals: any[];
  };
  recent_decisions: Array<{
    id: string;
    tool_name: string;
    decision: string;
    reason: string;
    confidence_score: number;
    decision_time?: string;
    risk_assessment: any;
    evidence_refs: string[];
  }>;
  permissions_summary: {
    total_tools: number;
    approved_tools: string[];
    denied_tools: string[];
    conditional_tools: string[];
    workspace_restrictions: Record<string, any>;
    time_restrictions: Record<string, any>;
  };
  risk_assessment: {
    overall_risk_level: string;
    risk_factors: string[];
    confidence_score: number;
    last_assessed: string;
  };
  generated_at: string;
}

interface PGLSnapshot {
  agent_id: string;
  agent_name: string;
  mode: string;
  certificate: {
    id: string;
    genome_version: string;
    genome_hash: string;
    jurisdiction: string;
    declared_purpose: string;
    intended_use: string;
    risk_category: string;
    tools: string[];
    permissions: string[];
    safety_rules: string[];
    active: boolean;
  };
  operator: {
    id: string;
    name: string;
    email: string;
  };
  workspace: {
    id: string;
    name: string;
    genome_hash: string;
    ledger_root: string;
  };
  ledger_events: Array<{
    id: string;
    event_type: string;
    hash: string;
    timestamp: string;
  }>;
  chain_verified: boolean;
  version_count: number;
}

interface AuthorityPanelProps {
  agentId?: string;
  workspaceId?: string;
  authorityRunId?: string;
  executionId?: string;
  showExport?: boolean;
}

export function AuthorityPanel({
  agentId,
  workspaceId,
  authorityRunId,
  executionId,
  showExport = true,
}: AuthorityPanelProps) {
  // Try new AuthorityContext API first, fallback to PGL snapshot
  const authorityContext = useApi<AuthorityContext>(
    agentId || workspaceId || authorityRunId
      ? `/api/v1/authority/context?${agentId ? `agent_id=${agentId}` : workspaceId ? `workspace_id=${workspaceId}` : `authority_run_id=${authorityRunId}`}`
      : null
  );

  const snapshot = useApi<PGLSnapshot>(
    agentId && !authorityContext.data ? `/api/v1/pgl/snapshot/${agentId}` : null
  );

  const isLoading = authorityContext.isLoading || snapshot.isLoading;
  const error = authorityContext.error || snapshot.error;
  const data = authorityContext.data || snapshot.data;

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-bg-700 rounded w-1/3" />
          <div className="h-8 bg-bg-700 rounded w-1/2" />
          <div className="h-20 bg-bg-700 rounded" />
        </div>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-amber-500">
          <AlertTriangle className="w-5 h-5" />
          <span>
            {authorityContext.error 
              ? "No authority context found. Complete onboarding to view authority."
              : "No PGL profile found. Complete onboarding to view authority."
            }
          </span>
        </div>
      </Card>
    );
  }

  const s = data as AuthorityContext | PGLSnapshot;

  // Check if we have AuthorityContext data (new) or PGL snapshot (legacy)
  const isAuthorityContext = 'generated_at' in s;
  
  if (isAuthorityContext) {
    const ctx = s as AuthorityContext;
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-500" />
            <h2 className="text-lg font-semibold">Authority Context</h2>
          </div>
          {showExport && (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm">
                <Copy className="w-4 h-4 mr-1" /> Copy
              </Button>
              <Button variant="ghost" size="sm">
                <Download className="w-4 h-4 mr-1" /> Export
              </Button>
            </div>
          )}
        </div>

        {/* Agent Information */}
        {ctx.agent_info && (
          <Card className="p-4">
            <SectionHeader
              icon={Fingerprint}
              title="Agent Information"
              subtitle={ctx.agent_info.name}
            />
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <Field label="Agent ID" value={ctx.agent_info.id} mono />
              <Field label="Creator" value={ctx.agent_info.creator} />
              <Field label="Jurisdiction" value={ctx.agent_info.jurisdiction} />
              <Field label="Status" value={ctx.agent_info.status} />
              <Field 
                label="Declared Purpose" 
                value={ctx.agent_info.declared_purpose} 
                className="col-span-2"
              />
              {ctx.agent_info.created_at && (
                <Field 
                  label="Created At" 
                  value={new Date(ctx.agent_info.created_at).toLocaleString()} 
                  className="col-span-2"
                />
              )}
            </div>
          </Card>
        )}

        {/* Birth Certificate */}
        {ctx.birth_certificate && (
          <Card className="p-4">
            <SectionHeader
              icon={FileCheck}
              title="Birth Certificate"
              subtitle={ctx.birth_certificate.certificate_id}
            />
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <Field label="Certificate ID" value={ctx.birth_certificate.certificate_id} mono />
              <Field label="Genome Hash" value={ctx.birth_certificate.genome_hash} mono />
              {ctx.birth_certificate.parent_agent_ids.length > 0 && (
                <Field 
                  label="Parent Agents" 
                  value={ctx.birth_certificate.parent_agent_ids.join(", ")} 
                  className="col-span-2"
                />
              )}
              {ctx.birth_certificate.issued_at && (
                <Field 
                  label="Issued At" 
                  value={new Date(ctx.birth_certificate.issued_at).toLocaleString()} 
                  className="col-span-2"
                />
              )}
            </div>
          </Card>
        )}

        {/* Lineage */}
        {ctx.lineage.length > 0 && (
          <Card className="p-4">
            <SectionHeader
              icon={Link2}
              title="Agent Lineage"
              subtitle={`${ctx.lineage.length} relationships`}
            />
            <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
              {ctx.lineage.map((rel, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-xs p-2 rounded bg-bg-700/50"
                >
                  <span className="text-ink-500">{rel.type === "parent" ? "↑" : "↓"}</span>
                  <span className="text-brand-500">{rel.name}</span>
                  <span className="text-ink-400 font-mono truncate">
                    {rel.agent_id.slice(0, 16)}...
                  </span>
                  <span className="text-ink-500 ml-auto">
                    {rel.relationship}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Authority Bundle */}
        {ctx.authority_bundle && (
          <Card className="p-4">
            <SectionHeader
              icon={KeyRound}
              title="Authority Bundle"
              subtitle={`${ctx.authority_bundle.name} v${ctx.authority_bundle.version}`}
            />
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <Field label="Bundle ID" value={ctx.authority_bundle.id} mono />
              <Field 
                label="Risk Level" 
                value={ctx.authority_bundle.risk_level}
                tone={
                  ctx.authority_bundle.risk_level === "high"
                    ? "red"
                    : ctx.authority_bundle.risk_level === "medium"
                    ? "amber"
                    : "green"
                }
              />
              {ctx.authority_bundle.description && (
                <Field 
                  label="Description" 
                  value={ctx.authority_bundle.description}
                  className="col-span-2"
                />
              )}
              {ctx.authority_bundle.tags.length > 0 && (
                <Field 
                  label="Tags" 
                  value={ctx.authority_bundle.tags.join(", ")}
                  className="col-span-2"
                />
              )}
            </div>
          </Card>
        )}

        {/* Active Run */}
        {ctx.active_run && (
          <Card className="p-4">
            <SectionHeader
              icon={Landmark}
              title="Active Authority Run"
              subtitle={`Status: ${ctx.active_run.status}`}
            />
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <Field label="Run ID" value={ctx.active_run.id} mono />
              <Field label="Status" value={ctx.active_run.status} />
              <Field label="Total Actions" value={ctx.active_run.total_actions.toString()} />
              <Field label="Approved Actions" value={ctx.active_run.approved_actions.toString()} />
              <Field label="Denied Actions" value={ctx.active_run.denied_actions.toString()} />
              <Field label="Violations" value={ctx.active_run.violation_count.toString()} />
              {ctx.active_run.start_time && (
                <Field 
                  label="Start Time" 
                  value={new Date(ctx.active_run.start_time).toLocaleString()} 
                  className="col-span-2"
                />
              )}
            </div>
          </Card>
        )}

        {/* Permissions Summary */}
        {ctx.permissions_summary && (
          <Card className="p-4">
            <SectionHeader
              icon={Shield}
              title="Permissions Summary"
              subtitle={`${ctx.permissions_summary.total_tools} total tools`}
            />
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-sm">{ctx.permissions_summary.approved_tools.length} Approved</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm">{ctx.permissions_summary.denied_tools.length} Denied</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-sm">{ctx.permissions_summary.conditional_tools.length} Conditional</span>
              </div>
            </div>
          </Card>
        )}

        {/* Risk Assessment */}
        {ctx.risk_assessment && (
          <Card className="p-4">
            <SectionHeader
              icon={AlertTriangle}
              title="Risk Assessment"
              subtitle={`Overall: ${ctx.risk_assessment.overall_risk_level}`}
            />
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <Field 
                label="Overall Risk" 
                value={ctx.risk_assessment.overall_risk_level}
                tone={
                  ctx.risk_assessment.overall_risk_level === "high"
                    ? "red"
                    : ctx.risk_assessment.overall_risk_level === "medium"
                    ? "amber"
                    : "green"
                }
              />
              <Field label="Confidence" value={`${(ctx.risk_assessment.confidence_score * 100).toFixed(1)}%`} />
              {ctx.risk_assessment.risk_factors.length > 0 && (
                <Field 
                  label="Risk Factors" 
                  value={ctx.risk_assessment.risk_factors.join(", ")}
                  className="col-span-2"
                />
              )}
              <Field 
                label="Last Assessed" 
                value={new Date(ctx.risk_assessment.last_assessed).toLocaleString()} 
                className="col-span-2"
              />
            </div>
          </Card>
        )}

        {/* Recent Decisions */}
        {ctx.recent_decisions.length > 0 && (
          <Card className="p-4">
            <SectionHeader
              icon={Globe}
              title="Recent Authority Decisions"
              subtitle={`${ctx.recent_decisions.length} decisions`}
            />
            <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
              {ctx.recent_decisions.slice(-5).map((decision, i) => (
                <div
                  key={decision.id}
                  className="flex items-center gap-2 text-xs p-2 rounded bg-bg-700/50"
                >
                  <span className={`w-2 h-2 rounded-full ${
                    decision.decision === "approve" ? "bg-emerald-500" :
                    decision.decision === "deny" ? "bg-red-500" : "bg-amber-500"
                  }`} />
                  <span className="text-brand-500">{decision.tool_name}</span>
                  <span className="text-ink-400">{decision.decision}</span>
                  <span className="text-ink-500 ml-auto">
                    {decision.decision_time && new Date(decision.decision_time).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  }

  // Legacy PGL Snapshot rendering
  const pgl = s as PGLSnapshot;
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-brand-500" />
          <h2 className="text-lg font-semibold">Authority Panel</h2>
        </div>
        {showExport && (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm">
              <Copy className="w-4 h-4 mr-1" /> Copy
            </Button>
            <Button variant="ghost" size="sm">
              <Download className="w-4 h-4 mr-1" /> Export
            </Button>
          </div>
        )}
      </div>

      {/* PGL Birth Certificate */}
      <Card className="p-4">
        <SectionHeader
          icon={Fingerprint}
          title="PGL Birth Certificate"
          subtitle={`Agent: ${pgl.agent_name}`}
        />
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <Field label="Agent ID" value={pgl.agent_id} mono />
          <Field label="Certificate" value={pgl.certificate.id} mono />
          <Field label="Genome" value={pgl.certificate.genome_version} />
          <Field label="Genome Hash" value={pgl.certificate.genome_hash} mono />
          <Field label="Jurisdiction" value={pgl.certificate.jurisdiction} />
          <Field
            label="Risk Category"
            value={pgl.certificate.risk_category}
            tone={
              pgl.certificate.risk_category === "high"
                ? "red"
                : pgl.certificate.risk_category === "medium"
                ? "amber"
                : "green"
            }
          />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <StatusBadge verified={pgl.certificate.active} />
          <span className="text-xs text-ink-400">
            {pgl.certificate.active ? "Certificate Active" : "Certificate Inactive"}
          </span>
        </div>
      </Card>

      {/* Operator & Workspace */}
      <Card className="p-4">
        <SectionHeader
          icon={User}
          title="Operator Identity"
          subtitle={pgl.operator.name}
        />
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <Field label="Operator ID" value={pgl.operator.id} mono />
          <Field label="Email" value={pgl.operator.email} />
        </div>
      </Card>

      <Card className="p-4">
        <SectionHeader
          icon={Layers}
          title="Workspace Genome"
          subtitle={pgl.workspace.name}
        />
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <Field label="Workspace ID" value={pgl.workspace.id} mono />
          <Field label="Genome Hash" value={pgl.workspace.genome_hash} mono />
          <Field label="Ledger Root" value={pgl.workspace.ledger_root} mono />
        </div>
      </Card>

      {/* Ledger Chain */}
      <Card className="p-4">
        <SectionHeader
          icon={Landmark}
          title="Evidence Ledger"
          subtitle={`${pgl.version_count} events • Chain ${pgl.chain_verified ? "verified" : "unverified"}`}
        />
        <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
          {pgl.ledger_events.slice(-5).map((event, i) => (
            <div
              key={event.id}
              className="flex items-center gap-2 text-xs p-2 rounded bg-bg-700/50"
            >
              <span className="text-ink-500">#{i + 1}</span>
              <span className="text-brand-500">{event.event_type}</span>
              <span className="text-ink-400 font-mono truncate">
                {event.hash.slice(0, 16)}...
              </span>
              <span className="text-ink-500 ml-auto">
                {new Date(event.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Mode Indicator */}
      <ModeIndicator mode={pgl.mode} />
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-ink-400" />
      <div>
        <div className="font-medium">{title}</div>
        {subtitle && <div className="text-xs text-ink-400">{subtitle}</div>}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  mono = false,
  tone,
  className = "",
}: {
  label: string;
  value: string;
  mono?: boolean;
  tone?: "green" | "amber" | "red";
  className?: string;
}) {
  const toneClasses = {
    green: "text-emerald-500",
    amber: "text-amber-500",
    red: "text-red-500",
  };

  return (
    <div className={className}>
      <div className="text-xs text-ink-500">{label}</div>
      <div
        className={`text-sm truncate ${
          mono ? "font-mono text-ink-300" : ""
        } ${tone ? toneClasses[tone] : "text-ink-200"}`}
      >
        {value}
      </div>
    </div>
  );
}

function StatusBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-emerald-500/20 text-emerald-500">
      <CheckCircle2 className="w-3 h-3" /> Verified
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-500">
      <XCircle className="w-3 h-3" /> Unverified
    </span>
  );
}

function ModeIndicator({ mode }: { mode: string }) {
  const configs: Record<string, { label: string; color: string; desc: string }> =
    {
      live: {
        label: "Live PGL",
        color: "bg-emerald-500",
        desc: "Connected to production PGL registry",
      },
      replay: {
        label: "Replay Mode",
        color: "bg-amber-500",
        desc: "Demo mode with cached responses",
      },
      "local-dev": {
        label: "Local Development",
        color: "bg-blue-500",
        desc: "Local-only simulation",
      },
    };

  const config = configs[mode] || configs["local-dev"];

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-bg-700/50 border border-border">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${config.color} animate-pulse`} />
        <div>
          <div className="text-sm font-medium">{config.label}</div>
          <div className="text-xs text-ink-400">{config.desc}</div>
        </div>
      </div>
      <div className="text-xs text-ink-500">Mode: {mode}</div>
    </div>
  );
}

export function CompactAuthorityBadge({ 
  agentId, 
  workspaceId, 
  authorityRunId 
}: { 
  agentId?: string; 
  workspaceId?: string; 
  authorityRunId?: string;
}) {
  // Try new AuthorityContext API first, fallback to PGL snapshot
  const authorityContext = useApi<AuthorityContext>(
    agentId || workspaceId || authorityRunId
      ? `/api/v1/authority/context?${agentId ? `agent_id=${agentId}` : workspaceId ? `workspace_id=${workspaceId}` : `authority_run_id=${authorityRunId}`}`
      : null
  );

  const snapshot = useApi<PGLSnapshot>(
    agentId && !authorityContext.data ? `/api/v1/pgl/snapshot/${agentId}` : null
  );

  const data = authorityContext.data || snapshot.data;

  if (!data) return null;

  // Check if we have AuthorityContext data (new) or PGL snapshot (legacy)
  const isAuthorityContext = 'generated_at' in data;
  
  if (isAuthorityContext) {
    const ctx = data as AuthorityContext;
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg-700 border border-border text-sm">
        <Shield className="w-4 h-4 text-brand-500" />
        <span className="font-medium">
          {ctx.agent_info?.name || ctx.workspace_id || `Run ${ctx.authority_run_id?.slice(0, 8)}`}
        </span>
        <span className="text-ink-400">•</span>
        <span
          className={`text-xs ${
            ctx.risk_assessment?.overall_risk_level === "high"
              ? "text-red-500"
              : ctx.risk_assessment?.overall_risk_level === "medium"
              ? "text-amber-500"
              : "text-emerald-500"
          }`}
        >
          {ctx.risk_assessment?.overall_risk_level || "Unknown"}
        </span>
      </div>
    );
  }

  // Legacy PGL Snapshot rendering
  const pgl = data as PGLSnapshot;
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg-700 border border-border text-sm">
      <Shield className="w-4 h-4 text-brand-500" />
      <span className="font-medium">{pgl.agent_name}</span>
      <span className="text-ink-400">•</span>
      <span
        className={`text-xs ${
          pgl.certificate.active
            ? "text-emerald-500"
            : "text-red-500"
        }`}
      >
        {pgl.certificate.active ? "Active" : "Inactive"}
      </span>
    </div>
  );
}
