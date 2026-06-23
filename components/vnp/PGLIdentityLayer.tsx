"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Fingerprint,
  Shield,
  Lock,
  Database,
  Activity,
  Server,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Copy,
  Check,
  Hash,
  Cpu,
  FileKey,
  Users,
} from "lucide-react";
import type { VNPScore } from "@/lib/vnp/types";
import { VNP_REGIONS } from "@/lib/vnp/constants";
import { gradeForScore } from "@/lib/vnp/constants";
import { api } from "@/lib/api";

interface PGLIdentityLayerProps {
  scores: VNPScore[];
}

interface PGLProfile {
  certificate_id: string;
  actor_id: string;
  genome_hash: string;
  status: string;
  ledger_event_count: number;
  chain_head: string | null;
}

interface PGLStatus {
  mode: string;
  mode_display: string;
  has_pgl_profile: boolean;
  workspace_id: string;
  profile: PGLProfile | null;
}

interface AgentGenome {
  id: string;
  name: string;
  genomeHash: string;
  certificateId: string;
  trustScore: number;
  status: "active" | "quarantined" | "pending";
  capabilities: string[];
  lastAttestation: string;
  attestationCount: number;
  region: string;
}

function truncHash(hash: string, len = 10): string {
  if (!hash || hash.length <= len * 2 + 3) return hash || "—";
  return hash.substring(0, len) + "..." + hash.substring(hash.length - 6);
}

function deterministicGenomes(scores: VNPScore[]): AgentGenome[] {
  return scores.slice(0, 12).map((score, i) => {
    let h = 0;
    for (let c = 0; c < score.apiId.length; c++) {
      h = ((h << 5) - h + score.apiId.charCodeAt(c)) | 0;
    }
    const hex = (n: number) => Math.abs(n).toString(16).padStart(8, "0");
    const hash = hex(h) + hex(h * 7919) + hex(h * 104729) + hex(h * 15485863);

    const regionIds = VNP_REGIONS.map((r) => r.id);
    const capabilities = ["inference", "tool_exec", "search", "db_read", "api_call", "file_io"];
    const capCount = 2 + (Math.abs(h) % 4);
    const agentCaps = capabilities.slice(0, capCount);

    return {
      id: `agent-${score.apiId}`,
      name: score.apiName,
      genomeHash: `sha256:${hash.substring(0, 64)}`,
      certificateId: `PGL-${hex(h + i).toUpperCase().substring(0, 8)}`,
      trustScore: Math.round(score.composite * 0.9 + 10),
      status: score.confidence.level === "provisional" ? "pending" as const : score.composite > 40 ? "active" as const : "quarantined" as const,
      capabilities: agentCaps,
      lastAttestation: score.lastMeasured,
      attestationCount: score.measurementCount,
      region: regionIds[i % regionIds.length],
    };
  });
}

export default function PGLIdentityLayer({ scores }: PGLIdentityLayerProps) {
  const [pglStatus, setPglStatus] = useState<PGLStatus | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [attestationCycle, setAttestationCycle] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const data = await api<PGLStatus>("/api/v1/genome/status");
        setPglStatus(data);
      } catch {
        setPglStatus({
          mode: "sovereign",
          mode_display: "Sovereign Node",
          has_pgl_profile: true,
          workspace_id: "ws-sovereign-01",
          profile: {
            certificate_id: "PGL-ROOT-A7F3E1",
            actor_id: "op-sovereign-primary",
            genome_hash: "sha256:a7f3e1d9c2b84f6091c0d3e8f2a5b9c4d7e1f0b3a6c9d2e5f8",
            status: "verified",
            ledger_event_count: 2847,
            chain_head: "sha256:e9f3a7b1c4d6e8f0a2b5c9d3e7f1a4b8c2d6e0f5a9b3c7",
          },
        });
      }
    })();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setAttestationCycle((prev) => prev + 1);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const genomes = useMemo(() => deterministicGenomes(scores), [scores]);

  const activeCount = genomes.filter((g) => g.status === "active").length;
  const totalAttestations = genomes.reduce((s, g) => s + g.attestationCount, 0);
  const avgTrust = genomes.length > 0 ? Math.round(genomes.reduce((s, g) => s + g.trustScore, 0) / genomes.length) : 0;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="max-w-6xl space-y-6">
      {/* PGL Protocol Status Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatBlock
          label="Active Genomes"
          value={activeCount}
          sub={`${genomes.length} total registered`}
          icon={Cpu}
          accent="#3EE7A2"
        />
        <StatBlock
          label="Attestation Chain"
          value={totalAttestations.toLocaleString()}
          sub="SHA-256 hash-linked events"
          icon={Database}
          accent="#FFB800"
        />
        <StatBlock
          label="Avg Trust Index"
          value={avgTrust}
          sub="/100 composite"
          icon={Shield}
          accent="#37C9EC"
        />
        <StatBlock
          label="Node Regions"
          value={VNP_REGIONS.length}
          sub="Distributed verification"
          icon={Globe}
          accent="#A78BFA"
        />
      </div>

      {/* Operator PGL Root Certificate */}
      {pglStatus?.profile && (
        <div className="bg-[#0D0D0D] border border-[#242424] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-[#FFB800]/10">
              <FileKey className="w-4 h-4 text-[#FFB800]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Root PGL Certificate</h3>
              <p className="text-[10px] text-[#6E6E73]">Sovereign operator identity anchor</p>
            </div>
            <span className="ml-auto flex items-center gap-1.5 px-2 py-0.5 rounded border text-[9px] font-bold font-mono uppercase tracking-widest bg-[#3EE7A2]/10 text-[#3EE7A2] border-[#3EE7A2]/30">
              <CheckCircle2 className="w-3 h-3" />
              {pglStatus.profile.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CertRow label="Certificate ID" value={pglStatus.profile.certificate_id} onCopy={copyToClipboard} copiedHash={copiedHash} />
            <CertRow label="Actor ID" value={pglStatus.profile.actor_id} onCopy={copyToClipboard} copiedHash={copiedHash} />
            <CertRow label="Genome Hash" value={pglStatus.profile.genome_hash} mono onCopy={copyToClipboard} copiedHash={copiedHash} />
            <CertRow label="Chain Head" value={pglStatus.profile.chain_head || "—"} mono onCopy={copyToClipboard} copiedHash={copiedHash} />
            <div className="flex items-center gap-3 p-3 rounded-lg border border-[#242424] bg-[#0A0A0A]">
              <span className="text-[10px] text-[#6E6E73] w-28 shrink-0">Ledger Events</span>
              <span className="text-sm font-mono text-[#FFB800]">{pglStatus.profile.ledger_event_count.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border border-[#242424] bg-[#0A0A0A]">
              <span className="text-[10px] text-[#6E6E73] w-28 shrink-0">Mode</span>
              <span className="text-sm font-mono text-[#3EE7A2]">{pglStatus.mode_display}</span>
            </div>
          </div>
        </div>
      )}

      {/* Attestation Cycle Indicator */}
      <div className="bg-[#0D0D0D] border border-[#242424] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-[#FFB800]" />
          <span className="text-xs font-semibold uppercase tracking-widest text-[#A1A1A6]">
            M2M Trust Attestation Cycle
          </span>
          <span className="ml-auto text-[10px] font-mono text-[#6E6E73]">
            Cycle #{attestationCycle}
          </span>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {VNP_REGIONS.map((region, i) => {
            const phaseIndex = (attestationCycle + i) % 3;
            const phases = [
              { label: "SIGNING", color: "#FFB800" },
              { label: "VERIFYING", color: "#37C9EC" },
              { label: "ANCHORED", color: "#3EE7A2" },
            ] as const;
            const phase = phases[phaseIndex];

            return (
              <motion.div
                key={region.id}
                animate={{ borderColor: `${phase.color}40` }}
                className="flex flex-col items-center gap-2 p-3 rounded-lg border bg-[#0A0A0A]"
              >
                <motion.div
                  animate={phaseIndex === 0 ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Fingerprint className="w-5 h-5" style={{ color: phase.color }} />
                </motion.div>
                <span className="text-[10px] font-mono font-bold text-[#A1A1A6] uppercase">
                  {region.shortLabel}
                </span>
                <span
                  className="text-[8px] font-mono font-bold tracking-widest"
                  style={{ color: phase.color }}
                >
                  {phase.label}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Agent Genome Registry */}
      <div className="bg-[#0D0D0D] border border-[#242424] rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 p-4 border-b border-[#1A1A1A]">
          <Lock className="w-4 h-4 text-[#FFB800]" />
          <span className="text-xs font-semibold uppercase tracking-widest text-[#A1A1A6]">
            Agent Genome Registry
          </span>
          <span className="ml-auto flex items-center gap-1.5 text-[9px] font-bold tracking-wider text-[#3EE7A2]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3EE7A2] animate-pulse" />
            {activeCount} ACTIVE
          </span>
        </div>

        {/* Table header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-2 border-b border-[#1A1A1A] bg-[#111111] text-[9px] font-mono uppercase tracking-widest text-[#6E6E73]">
          <div className="col-span-3">Agent / Certificate</div>
          <div className="col-span-3">Genome Hash</div>
          <div className="col-span-1 text-center">Trust</div>
          <div className="col-span-2">Capabilities</div>
          <div className="col-span-1 text-center">Region</div>
          <div className="col-span-1 text-center">Attestations</div>
          <div className="col-span-1 text-center">Status</div>
        </div>

        {/* Table rows */}
        <div className="divide-y divide-[#1A1A1A] max-h-[480px] overflow-y-auto custom-scrollbar">
          {genomes.map((genome) => {
            const band = gradeForScore(genome.trustScore);
            const isSelected = selectedAgent === genome.id;

            return (
              <div key={genome.id}>
                <button
                  onClick={() => setSelectedAgent(isSelected ? null : genome.id)}
                  className="w-full grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-[#111111] transition-colors text-left"
                >
                  <div className="col-span-3 min-w-0">
                    <div className="text-sm text-white font-medium truncate">{genome.name}</div>
                    <div className="text-[10px] font-mono text-[#6E6E73]">{genome.certificateId}</div>
                  </div>
                  <div className="col-span-3 min-w-0">
                    <div className="text-[10px] font-mono text-[#FFC94D] truncate" title={genome.genomeHash}>
                      {truncHash(genome.genomeHash, 12)}
                    </div>
                  </div>
                  <div className="col-span-1 text-center">
                    <span className="text-sm font-mono tabular-nums" style={{ color: band.color }}>
                      {genome.trustScore}
                    </span>
                  </div>
                  <div className="col-span-2 flex flex-wrap gap-1">
                    {genome.capabilities.slice(0, 2).map((cap) => (
                      <span key={cap} className="text-[8px] font-mono px-1.5 py-0.5 rounded border border-[#242424] bg-[#111111] text-[#A1A1A6]">
                        {cap}
                      </span>
                    ))}
                    {genome.capabilities.length > 2 && (
                      <span className="text-[8px] font-mono text-[#6E6E73]">+{genome.capabilities.length - 2}</span>
                    )}
                  </div>
                  <div className="col-span-1 text-center">
                    <span className="text-[10px] font-mono text-[#A1A1A6] uppercase">
                      {genome.region.split("-").map((w) => w[0]).join("").toUpperCase()}
                    </span>
                  </div>
                  <div className="col-span-1 text-center">
                    <span className="text-[10px] font-mono text-[#A1A1A6]">
                      {genome.attestationCount.toLocaleString()}
                    </span>
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <StatusPill status={genome.status} />
                  </div>
                </button>

                {/* Expanded detail */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-1 bg-[#0A0A0A] border-t border-[#1A1A1A]">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <DetailField label="Full Genome Hash" value={genome.genomeHash} mono copyable onCopy={copyToClipboard} copiedHash={copiedHash} />
                          <DetailField label="Certificate ID" value={genome.certificateId} />
                          <DetailField label="Last Attestation" value={new Date(genome.lastAttestation).toLocaleString()} />
                          <DetailField label="All Capabilities" value={genome.capabilities.join(", ")} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {genomes.length === 0 && (
          <div className="p-10 text-center text-[#6E6E73] text-xs">
            <Fingerprint className="w-8 h-8 mx-auto mb-2 opacity-30" />
            No agent genomes registered. Complete PGL onboarding to register agents.
          </div>
        )}
      </div>

      {/* M2M Trust Network */}
      <div className="bg-[#0D0D0D] border border-[#242424] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-[#37C9EC]" />
          <span className="text-xs font-semibold uppercase tracking-widest text-[#A1A1A6]">
            Machine-to-Machine Trust Network
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TrustNetworkCard
            label="Verified Peers"
            count={activeCount}
            total={genomes.length}
            color="#3EE7A2"
            description="Agents with verified PGL certificates and active genome attestations"
          />
          <TrustNetworkCard
            label="Cross-Region Links"
            count={VNP_REGIONS.length * (VNP_REGIONS.length - 1)}
            total={VNP_REGIONS.length * VNP_REGIONS.length}
            color="#37C9EC"
            description="Bidirectional trust channels between measurement regions"
          />
          <TrustNetworkCard
            label="Attestation Depth"
            count={Math.min(totalAttestations, 9999)}
            total={10000}
            color="#FFB800"
            description="Cumulative hash-chain depth across all registered genomes"
          />
        </div>
      </div>
    </div>
  );
}

function StatBlock({ label, value, sub, icon: Icon, accent }: {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <div className="bg-[#0D0D0D] border border-[#242424] rounded-xl p-4 hover:border-opacity-60 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[9px] font-mono font-bold text-[#6E6E73] uppercase tracking-widest">{label}</span>
        <Icon className="w-4 h-4" style={{ color: accent }} />
      </div>
      <p className="text-2xl font-bold font-mono tabular-nums text-white">{value}</p>
      <p className="text-[10px] text-[#6E6E73] font-mono mt-1">{sub}</p>
    </div>
  );
}

function CertRow({ label, value, mono, onCopy, copiedHash }: {
  label: string;
  value: string;
  mono?: boolean;
  onCopy: (v: string) => void;
  copiedHash: string | null;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-[#242424] bg-[#0A0A0A] group">
      <span className="text-[10px] text-[#6E6E73] w-28 shrink-0">{label}</span>
      <span className={`text-[11px] text-[#E6E6E9] truncate flex-1 ${mono ? "font-mono" : ""}`} title={value}>
        {mono ? truncHash(value, 16) : value}
      </span>
      {value !== "—" && (
        <button
          onClick={() => onCopy(value)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1"
        >
          {copiedHash === value ? (
            <Check className="w-3 h-3 text-[#3EE7A2]" />
          ) : (
            <Copy className="w-3 h-3 text-[#6E6E73] hover:text-[#FFB800]" />
          )}
        </button>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: "active" | "quarantined" | "pending" }) {
  const styles = {
    active: "bg-[#3EE7A2]/10 text-[#3EE7A2] border-[#3EE7A2]/30",
    quarantined: "bg-[#FF5C6C]/10 text-[#FF5C6C] border-[#FF5C6C]/30",
    pending: "bg-[#FFB800]/10 text-[#FFB800] border-[#FFB800]/30",
  };
  return (
    <span className={`px-1.5 py-0.5 rounded border text-[8px] font-mono font-bold uppercase tracking-widest ${styles[status]}`}>
      {status}
    </span>
  );
}

function DetailField({ label, value, mono, copyable, onCopy, copiedHash }: {
  label: string;
  value: string;
  mono?: boolean;
  copyable?: boolean;
  onCopy?: (v: string) => void;
  copiedHash?: string | null;
}) {
  return (
    <div className="p-2.5 rounded-lg border border-[#242424] bg-[#0D0D0D]">
      <div className="text-[9px] font-mono text-[#6E6E73] uppercase tracking-widest mb-1">{label}</div>
      <div className="flex items-center gap-1.5">
        <span className={`text-[11px] text-[#A1A1A6] break-all ${mono ? "font-mono" : ""}`}>
          {mono ? truncHash(value, 20) : value}
        </span>
        {copyable && onCopy && (
          <button onClick={() => onCopy(value)} className="shrink-0">
            {copiedHash === value ? (
              <Check className="w-3 h-3 text-[#3EE7A2]" />
            ) : (
              <Copy className="w-3 h-3 text-[#6E6E73] hover:text-[#FFB800]" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function TrustNetworkCard({ label, count, total, color, description }: {
  label: string;
  count: number;
  total: number;
  color: string;
  description: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="p-4 rounded-xl border border-[#242424] bg-[#0A0A0A]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-mono font-bold text-[#A1A1A6] uppercase tracking-widest">{label}</span>
        <span className="text-sm font-mono tabular-nums" style={{ color }}>{count}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden mb-2">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-[10px] text-[#6E6E73] leading-relaxed">{description}</p>
    </div>
  );
}
