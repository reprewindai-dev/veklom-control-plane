"use client";

import Shell from "@/components/Shell";
import TierGate from "@/components/TierGate";
import { useApi } from "@/hooks/useApi";
import { Skeleton, Table, Button, ErrorBox } from "@/components/ui";
import { unwrapList, TeamMember, TeamRole, SsoStatus, ScimStatus, MfaStatus, ListEnvelope } from "@/types/api";
import { api } from "@/lib/api";
import { useState } from "react";
import Modal from "@/components/Modal";
import { ModuleHeader, SectionCard, StatTile, Pill, ProgressBar, Field, Select, KV, fmtNum, ACCENT } from "@/components/telemetry";
import { Users, ShieldCheck, KeyRound, UserPlus, Trash2, Network } from "lucide-react";

const ROLE_OPTIONS = ["OWNER", "ADMIN", "DEVELOPER", "VIEWER"];

export default function TeamPage() {
  const members = useApi<ListEnvelope<TeamMember>>("/api/v1/team/members");
  const roles = useApi<ListEnvelope<TeamRole>>("/api/v1/team/roles");
  const sso = useApi<SsoStatus>("/api/v1/team/sso/status");
  const scim = useApi<ScimStatus>("/api/v1/team/scim/status");
  const mfa = useApi<MfaStatus>("/api/v1/team/mfa/status");
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("DEVELOPER");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string>();

  const m = mfa.data || {};
  const rows = unwrapList<TeamMember>(members.data);
  const enforced = m.enforcement === "enforced";

  async function invite() {
    if (!email.trim()) { setErr("Enter an email."); return; }
    setBusy(true); setErr(undefined);
    try { await api("/api/v1/team/invite", { method: "POST", body: { email: email.trim(), role } }); setEmail(""); setShowInvite(false); members.mutate(); }
    catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }
  async function changeRole(id: string, newRole: string) {
    await api(`/api/v1/team/members/${id}/role`, { method: "PATCH", body: { role: newRole } }).catch(() => {});
    members.mutate();
  }
  async function remove(id: string) {
    await api(`/api/v1/team/members/${id}`, { method: "DELETE" }).catch(() => {});
    members.mutate();
  }
  async function toggleMfa() {
    await api("/api/v1/team/mfa/enforce", { method: "POST", body: { enforced: !enforced } }).catch(() => {});
    mfa.mutate();
  }

  return (
    <Shell>
      <TierGate required="pro" feature="Team & RBAC">
        <ModuleHeader
          breadcrumb="Account · Team & RBAC"
          title="Team, roles & access"
          subtitle="Members, role-based access, MFA enforcement, SSO and SCIM provisioning."
          pills={
            <>
              <Pill tone="neutral">{fmtNum(rows.length)} members</Pill>
              <Pill tone={enforced ? "green" : "amber"} dot>MFA {m.enforcement || "optional"}</Pill>
            </>
          }
          actions={<Button onClick={() => setShowInvite(true)}><UserPlus size={14} /> Invite</Button>}
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <StatTile label="Members" icon={<Users size={14} />} value={fmtNum(m.total_members ?? rows.length)} />
          <StatTile label="MFA compliance" icon={<ShieldCheck size={14} />} value={`${m.mfa_compliance_percent ?? 0}%`} />
          <StatTile label="SSO" icon={<KeyRound size={14} />} value={sso.data?.enabled || sso.data?.configured ? "On" : "Off"} />
          <StatTile label="SCIM" icon={<Network size={14} />} value={scim.data?.scim_enabled || scim.data?.configured ? "On" : "Off"} />
        </div>

        <div className="grid lg:grid-cols-3 gap-4 mb-4">
          <SectionCard label="Security" title="MFA enforcement" className="lg:col-span-1">
            <div className="flex items-end justify-between mb-2">
              <span className="text-[20px] font-semibold">{m.mfa_enabled_count ?? 0}/{m.total_members ?? 0}</span>
              <span className="text-[12px] text-ink-500">enrolled</span>
            </div>
            <ProgressBar percent={m.mfa_compliance_percent ?? 0} color={(m.mfa_compliance_percent ?? 0) >= 100 ? ACCENT.green : ACCENT.amber} />
            <div className="card p-3 mt-3">
              <KV k="Enforcement" v={m.enforcement || "optional"} mono={false} />
              <KV k="Grace period" v={`${m.grace_period_hours ?? 0} hrs`} />
            </div>
            <Button variant={enforced ? "ghost" : "primary"} onClick={toggleMfa} className="w-full mt-3">
              <ShieldCheck size={14} /> {enforced ? "Make MFA optional" : "Enforce MFA"}
            </Button>
          </SectionCard>

          <SectionCard label="Roles" title="Access tiers" className="lg:col-span-2" bodyClassName="space-y-2">
            {roles.isLoading ? <Skeleton className="h-32" /> : unwrapList<TeamRole>(roles.data).map((r) => (
              <div key={r.id} className="card p-3">
                <div className="flex items-center gap-2">
                  <Pill tone="amber">{r.name || r.id}</Pill>
                  <span className="text-[11px] text-ink-600">{(r.permissions || []).includes("*") ? "all permissions" : `${(r.permissions || []).length} permissions`}</span>
                </div>
                <div className="text-[12px] text-ink-400 mt-1">{r.description}</div>
              </div>
            ))}
          </SectionCard>
        </div>

        <SectionCard label="People" title="Members" bodyClassName="p-0">
          {members.isLoading ? <div className="p-5"><Skeleton className="h-32 w-full" /></div> :
            <Table
              rows={rows}
              rowKey={(r) => r.id || r.email}
              empty="No members yet."
              columns={[
                { key: "name", header: "Member", render: (r) => <div><div className="text-ink-100">{r.name}</div><div className="text-[11px] text-ink-600">{r.email}</div></div> },
                { key: "role", header: "Role", width: "150px", render: (r) => (
                  <Select value={(r.role || "").toUpperCase()} onChange={(v) => changeRole(r.id, v)} options={ROLE_OPTIONS.map((x) => ({ value: x, label: x.charAt(0) + x.slice(1).toLowerCase() }))} />
                ) },
                { key: "mfa", header: "MFA", render: (r) => r.mfa ? <Pill tone="green">on</Pill> : <Pill tone="amber">off</Pill> },
                { key: "active", header: "Last active", render: (r) => <span className="text-ink-500 text-xs">{r.lastActive}</span> },
                { key: "status", header: "Status", render: (r) => <Pill tone={r.status === "active" ? "green" : "neutral"}>{r.status}</Pill> },
                { key: "act", header: "", width: "90px", render: (r) => <Button variant="danger" onClick={() => remove(r.id)}><Trash2 size={13} /></Button> },
              ]}
            />
          }
        </SectionCard>

        {showInvite && (
          <Modal open onClose={() => setShowInvite(false)} size="md"
            title={<span className="flex items-center gap-2"><UserPlus size={15} className="text-brand-400" /> Invite member</span>}
            footer={<div className="ml-auto flex gap-2"><Button variant="ghost" onClick={() => setShowInvite(false)}>Cancel</Button><Button onClick={invite} loading={busy}>Send invite</Button></div>}>
            <div className="space-y-3">
              <Field label="Email"><input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@company.com" autoFocus /></Field>
              <Field label="Role"><Select value={role} onChange={setRole} options={ROLE_OPTIONS.map((x) => ({ value: x, label: x.charAt(0) + x.slice(1).toLowerCase() }))} /></Field>
              {err && <ErrorBox message={err} />}
            </div>
          </Modal>
        )}
      </TierGate>
    </Shell>
  );
}
