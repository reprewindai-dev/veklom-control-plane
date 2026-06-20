'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import {
  Shield,
  Award,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Database,
  Users,
  Fingerprint,
  ChevronRight,
  Activity,
  AlertTriangle,
  BarChart2,
  Plus,
  X,
  Hash,
  Zap,
  TrendingUp,
  ExternalLink,
  Copy,
  Check,
  Terminal,
  BookOpen,
  ShieldAlert,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '@/lib/api';
import Shell from '@/components/Shell';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface TrustScoreEvent {
  id: string;
  timestamp: string;
  event_type: string;
  threat_type?: string;
  ai_confidence: number;
  description: string;
  evidence_hash: string;
  status: 'open' | 'resolved';
  resolution_notes?: string;
}

interface OperatorIdentity {
  id: string;
  wallet_address: string;
  operator_name: string;
  trust_score: number;
  rank: string;
  security_level: string;
  events_total: number;
  events_critical: number;
  events_resolved: number;
  joined_at: string;
  verification_status: 'unverified' | 'pending' | 'verified';
}

interface Agent {
  id: string;
  name: string;
  trustScore: number;
  successRate: number;
  status: 'active' | 'quarantined';
  budgetLimit: number;
  budgetUsed: number;
  anomalyCount: number;
  category: string;
  framework: string;
}

interface PolicyRule {
  id: string;
  agent: string;
  capability: string;
  timeContext: string;
  effect: 'ALLOW' | 'DENY';
  reasoning: string;
}

interface QuarantineTicket {
  id: string;
  agentName: string;
  description: string;
  anomalies: string[];
  severity: 'critical' | 'high' | 'medium';
  createdAt: string;
  approvals: {
    authority: string;
    role: string;
    status: 'pending' | 'approved' | 'rejected';
  }[];
}

interface LedgerEntry {
  id: string;
  timestamp: string;
  agent: string;
  capability: string;
  decision: 'ALLOW' | 'DENY';
  evidenceHash: string;
  policyRef: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Static Data
// ─────────────────────────────────────────────────────────────────────────────

const RANK_TIERS = [
  { rank: 'Recruit',          minScore: 0,  icon: '🎯', color: 'bg-white/5 border border-white/10 text-ink-300' },
  { rank: 'Operator',         minScore: 20, icon: '⚙️', color: 'bg-brand-500/10 border border-brand-500/30 text-brand-400' },
  { rank: 'Trusted Operator', minScore: 50, icon: '✓',  color: 'bg-brand-500/20 border border-brand-500/40 text-brand-400' },
  { rank: 'Sovereign',        minScore: 75, icon: '👑', color: 'bg-brand-500/30 border border-brand-500/50 text-brand-400' },
  { rank: 'Elite Sovereign',  minScore: 90, icon: '⭐', color: 'bg-brand-500/40 border border-brand-500/60 text-brand-400' },
  { rank: 'Apex',             minScore: 98, icon: '🔴', color: 'bg-brand-500/50 border border-brand-500/70 text-brand-300' },
];

const THREAT_TYPES = [
  'All', 'brute_force', 'sql_injection', 'xss', 'unauthorized_access',
  'data_exfiltration', 'suspicious_login', 'rate_limit_abuse', 'anomaly',
];

const INITIAL_AGENTS: Agent[] = [
  { id: 'agent-researcher', name: 'ComplianceResearcher', trustScore: 85, successRate: 0.98, status: 'active',      budgetLimit: 500,  budgetUsed: 120, anomalyCount: 0, category: 'service', framework: 'Veklom Frame v1.2' },
  { id: 'agent-db-sync',    name: 'SynclonObsoleteAgent',  trustScore: 62, successRate: 0.88, status: 'active',      budgetLimit: 1000, budgetUsed: 980, anomalyCount: 1, category: 'system',  framework: 'Veklom Daemon v2.0' },
  { id: 'agent-untrusted',  name: 'ExoExperimentAgent',   trustScore: 35, successRate: 0.72, status: 'active',      budgetLimit: 150,  budgetUsed: 20,  anomalyCount: 4, category: 'user',    framework: 'LangChain-Native Bridge' },
];

const INITIAL_QUARANTINE: QuarantineTicket[] = [
  {
    id: 'TKT-992A-SEC',
    agentName: 'SynclonObsoleteAgent',
    description: 'Agent attempted DatabaseDeleter capability at 3:00 AM off-hours window — outside permitted time context for class "system" agents.',
    anomalies: [
      'Cascading table truncation pattern detected',
      'Off-hours execution (03:00 UTC)',
      '98% of budget consumed (980/1000 units)',
      'No human-in-the-loop checkpoint triggered',
    ],
    severity: 'critical',
    createdAt: new Date(Date.now() - 86400000 * 1.5).toISOString(),
    approvals: [
      { authority: 'SOC-Alpha-Lead', role: 'Security Operations Lead',     status: 'pending' },
      { authority: 'Policy-Arbiter', role: 'Policy Governance Arbiter',    status: 'pending' },
      { authority: 'Exec-Override',  role: 'Executive Override Authority', status: 'pending' },
    ],
  },
];

const INITIAL_LEDGER: LedgerEntry[] = [
  { id: 'led-001', timestamp: new Date(Date.now() - 300000).toISOString(),   agent: 'ComplianceResearcher', capability: 'search',         decision: 'ALLOW', evidenceHash: 'sha256:a3f8c1d9e2b47f6a91c0d3e8f2a5b9c4d7e1f0', policyRef: 'POL-0012' },
  { id: 'led-002', timestamp: new Date(Date.now() - 720000).toISOString(),   agent: 'SynclonObsoleteAgent',  capability: 'db-delete',       decision: 'DENY',  evidenceHash: 'sha256:b7e2a4c9d1f3e8a6b0c5d9e2f4a7b1c8e3f9', policyRef: 'POL-0031' },
  { id: 'led-003', timestamp: new Date(Date.now() - 1200000).toISOString(),  agent: 'ExoExperimentAgent',   capability: 'payout-trigger',  decision: 'DENY',  evidenceHash: 'sha256:c1d5e9f2a3b6c8d0e4f7a1b5c9d2e6f3a8b0', policyRef: 'POL-0044' },
  { id: 'led-004', timestamp: new Date(Date.now() - 3600000).toISOString(),  agent: 'ComplianceResearcher', capability: 'db-read',         decision: 'ALLOW', evidenceHash: 'sha256:d4e8f1a2b5c7d9e0f3a4b6c8d1e5f9a2c3b7', policyRef: 'POL-0012' },
  { id: 'led-005', timestamp: new Date(Date.now() - 7200000).toISOString(),  agent: 'SynclonObsoleteAgent',  capability: 'search',          decision: 'ALLOW', evidenceHash: 'sha256:e9f3a7b1c4d6e8f0a2b5c9d3e7f1a4b8c2d6', policyRef: 'POL-0028' },
];

const INITIAL_POLICIES: PolicyRule[] = [
  { id: 'POL-0012', agent: 'ComplianceResearcher', capability: 'search',         timeContext: 'business hours', effect: 'ALLOW', reasoning: 'Trusted agent with score ≥80 may search during business hours per compliance framework.' },
  { id: 'POL-0028', agent: 'SynclonObsoleteAgent',  capability: 'search',         timeContext: 'business hours', effect: 'ALLOW', reasoning: 'Search capability permitted for all active agents within budget bounds.' },
  { id: 'POL-0031', agent: 'SynclonObsoleteAgent',  capability: 'db-delete',      timeContext: 'off-hours',      effect: 'DENY',  reasoning: 'Destructive capabilities blocked off-hours for score <70 agents. Budget 98% consumed.' },
  { id: 'POL-0044', agent: 'ExoExperimentAgent',   capability: 'payout-trigger', timeContext: 'holiday',        effect: 'DENY',  reasoning: 'Financial capabilities require trust score ≥60. Agent score is 35.' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function generateDemoIdentity(): OperatorIdentity {
  return {
    id: 'op_demo_123',
    wallet_address: '0x742d35Cc6634C0532925a3b844Bc9e7595f6bEd0',
    operator_name: 'Sovereign Alice',
    trust_score: 87,
    rank: 'Sovereign',
    security_level: 'HIGH',
    events_total: 42,
    events_critical: 2,
    events_resolved: 40,
    joined_at: '2025-06-01T00:00:00Z',
    verification_status: 'verified',
  };
}

function generateDemoEvents(): TrustScoreEvent[] {
  return [
    { id: '1', timestamp: new Date().toISOString(), event_type: 'suspicious_login', threat_type: 'suspicious_login', ai_confidence: 0.92, description: '3 failed login attempts from unusual IP detected by anomaly engine.', evidence_hash: 'sha256:a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6', status: 'resolved', resolution_notes: 'User confirmed legitimate attempt.' },
    { id: '2', timestamp: new Date(Date.now() - 3600000).toISOString(), event_type: 'anomaly', threat_type: 'rate_limit_abuse', ai_confidence: 0.78, description: 'Unusual spike in API key usage — 4x baseline throughput across 12-minute window.', evidence_hash: 'sha256:q1w2e3r4t5y6u7i8o9p0a1s2d3f4g5h6', status: 'open' },
    { id: '3', timestamp: new Date(Date.now() - 7200000).toISOString(), event_type: 'unauthorized_access', threat_type: 'unauthorized_access', ai_confidence: 0.95, description: 'Access attempt to restricted /admin endpoint from unverified operator node.', evidence_hash: 'sha256:z9x8c7v6b5n4m3k2j1h0g9f8e7d6c5b4', status: 'resolved' },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared micro-components
// ─────────────────────────────────────────────────────────────────────────────

function LiveBadge() {
  return (
    <span className="flex items-center gap-1.5 bg-[#151515] border border-[#242424] px-2.5 py-1 rounded text-[9px] font-mono font-bold text-brand-400">
      <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
      LIVE
    </span>
  );
}

function DecisionBadge({ decision }: { decision: 'ALLOW' | 'DENY' | 'WARN' | 'PENDING' }) {
  const styles: Record<string, string> = {
    ALLOW:   'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    DENY:    'bg-red-500/10 text-red-400 border-red-500/30',
    WARN:    'bg-brand-500/10 text-brand-400 border-brand-500/30',
    PENDING: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
  };
  return (
    <span className={clsx('px-2 py-0.5 rounded border font-mono font-bold text-[10px] tracking-wider', styles[decision] ?? styles.PENDING)}>
      {decision}
    </span>
  );
}

function TrustBar({ score, danger }: { score: number; danger?: boolean }) {
  const color = danger ? (score > 90 ? 'bg-red-500' : 'bg-brand-400') : score >= 70 ? 'bg-emerald-500' : score >= 40 ? 'bg-brand-400' : 'bg-red-500';
  const glow  = danger ? (score > 90 ? 'rgba(239,68,68,0.4)' : 'rgba(255,184,0,0.4)') : score >= 70 ? 'rgba(52,211,153,0.4)' : score >= 40 ? 'rgba(255,184,0,0.4)' : 'rgba(239,68,68,0.4)';
  return (
    <div className="relative w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
      <motion.div className={clsx('h-full rounded-full', color)} initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} style={{ boxShadow: `0 0 8px ${glow}` }} />
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, accent }: { label: string; value: string | number; sub?: string; icon: React.ElementType; accent?: string }) {
  return (
    <div className="card p-4 flex flex-col gap-2 hover:border-brand-500/20 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-mono font-bold text-ink-500 uppercase tracking-widest">{label}</span>
        <Icon className={clsx('w-3.5 h-3.5', accent ?? 'text-brand-400')} />
      </div>
      <p className={clsx('text-2xl font-bold font-mono tabular-nums', accent ?? 'text-white')}>{value}</p>
      {sub && <p className="text-[10px] text-ink-500 font-mono">{sub}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 1 — Identity Cards
// ─────────────────────────────────────────────────────────────────────────────

function TabIdentity() {
  const [identity, setIdentity]               = useState<OperatorIdentity | null>(null);
  const [events, setEvents]                   = useState<TrustScoreEvent[]>([]);
  const [filterThreatType, setFilterThreatType] = useState('All');
  const [filterStatus, setFilterStatus]       = useState<'all' | 'open' | 'resolved'>('all');
  const [expandedEvent, setExpandedEvent]     = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [copiedHash, setCopiedHash]           = useState<string | null>(null);
  const [searchWallet, setSearchWallet]       = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [userData, secStats] = await Promise.all([
          api<any>('/api/v1/auth/me'),
          api<any>('/api/v1/security/stats').catch(() => null),
        ]);
        const score = secStats?.security_score ?? 0;
        setIdentity({
          id: userData.id || 'op_dev',
          wallet_address: userData.wallet_address || '',
          operator_name: userData.full_name || userData.email || 'Operator',
          trust_score: score,
          rank: score >= 90 ? 'Elite Sovereign' : score >= 75 ? 'Sovereign' : score >= 50 ? 'Trusted Operator' : 'Operator',
          security_level: score >= 75 ? 'HIGH' : 'MEDIUM',
          events_total: secStats?.total ?? 0,
          events_critical: secStats?.critical ?? 0,
          events_resolved: secStats?.resolved ?? 0,
          joined_at: userData.created_at || new Date().toISOString(),
          verification_status: userData.pgl_id ? 'verified' : 'pending',
        });
        if (score >= 98) { setShowCelebration(true); setTimeout(() => setShowCelebration(false), 3000); }
      } catch { setIdentity(generateDemoIdentity()); }
    })();
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api<any>('/api/v1/security/events?limit=50');
        setEvents(Array.isArray(data) ? data : data.events || []);
      } catch { setEvents(generateDemoEvents()); }
    };
    load();
    const iv = setInterval(load, 5000);
    return () => clearInterval(iv);
  }, []);

  const resolveEvent = async (id: string, notes: string) => {
    try {
      await api(`/api/v1/security/events/${id}/resolve`, { method: 'POST', body: { resolution_notes: notes } });
      setEvents(p => p.map(e => e.id === id ? { ...e, status: 'resolved' } : e));
    } catch {}
  };

  const filtered = useMemo(() => events.filter(e => {
    if (filterStatus !== 'all' && e.status !== filterStatus) return false;
    if (filterThreatType !== 'All' && e.threat_type !== filterThreatType) return false;
    return true;
  }), [events, filterStatus, filterThreatType]);

  const currentRank = useMemo(() => {
    if (!identity) return RANK_TIERS[0];
    return [...RANK_TIERS].reverse().find(t => identity.trust_score >= t.minScore) || RANK_TIERS[0];
  }, [identity]);

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash).catch(() => {});
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {showCelebration && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none bg-black/60 backdrop-blur-sm">
            <div className="text-center animate-bounce">
              <div className="text-8xl mb-4">{currentRank.icon}</div>
              <p className="text-4xl font-bold text-brand-400">{currentRank.rank}</p>
              <p className="text-xl text-brand-300 mt-2 font-mono">Apex Rank Unlocked! 🎉</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wallet search */}
      <div className="card p-4 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-500" />
          <input
            value={searchWallet}
            onChange={e => setSearchWallet(e.target.value)}
            placeholder="Search by wallet address… 0x742d35Cc…"
            className="w-full bg-transparent pl-9 pr-4 py-2.5 text-xs font-mono text-ink-200 placeholder:text-ink-600 border border-[#242424] rounded-lg focus:outline-none focus:border-brand-500/40 transition"
          />
        </div>
        <button className="btn btn-primary text-xs px-5">Lookup</button>
      </div>

      {/* Identity card */}
      {identity && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-6 border-brand-500/20 bg-gradient-to-r from-brand-500/[0.03] to-transparent">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-[9px] font-mono font-bold text-ink-500 uppercase tracking-widest">Operator Identity</p>
              <p className="text-xl font-bold text-white">{identity.operator_name}</p>
              <p className="text-ink-400 font-mono text-[10px] break-all">{identity.wallet_address || '0x742d35Cc6634C0532925a3b844Bc9e7595f6bEd0'}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <CheckCircle className="w-3.5 h-3.5 text-brand-400" />
                <span className="text-[10px] font-bold text-brand-400 font-mono">{identity.verification_status.toUpperCase()}</span>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-[9px] font-mono font-bold text-ink-500 uppercase tracking-widest">Trust Score Index</p>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-extrabold text-brand-400 tabular-nums">{identity.trust_score}</p>
                <p className="text-ink-500 text-xs font-mono">/100</p>
              </div>
              <TrustBar score={identity.trust_score} />
              <p className="text-[10px] text-ink-500 font-mono">{100 - identity.trust_score} pts to next verification level</p>
            </div>
            <div className="space-y-3">
              <p className="text-[9px] font-mono font-bold text-ink-500 uppercase tracking-widest">Sovereign Rank</p>
              <div className={clsx('inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm', currentRank.color)}>
                <span className="text-base">{currentRank.icon}</span>
                {currentRank.rank}
              </div>
              <p className="text-[10px] text-ink-500 font-mono">Security Level: <span className="text-brand-400">{identity.security_level}</span></p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#242424]">
            {[
              { label: 'Total Events',  value: identity.events_total,    color: 'text-white' },
              { label: 'Critical',      value: identity.events_critical,  color: 'text-red-400' },
              { label: 'Resolved',      value: identity.events_resolved,  color: 'text-brand-400' },
              { label: 'Joined',        value: new Date(identity.joined_at).toLocaleDateString(), color: 'text-ink-300' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-[9px] text-ink-500 font-mono uppercase tracking-widest">{s.label}</p>
                <p className={clsx('text-lg font-bold font-mono mt-0.5', s.color)}>{s.value}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Rank matrix */}
      <div className="card p-5">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <Award className="w-4 h-4 text-brand-400" /> Rank Progression Matrix
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {RANK_TIERS.map(tier => {
            const isActive  = identity && identity.trust_score >= tier.minScore;
            const isCurrent = currentRank.rank === tier.rank;
            return (
              <div key={tier.rank} className={clsx('p-3.5 rounded-xl border transition-all', isActive ? isCurrent ? 'bg-brand-500/10 border-brand-500 shadow-[0_0_16px_rgba(255,184,0,0.12)]' : 'bg-white/[0.01] border-white/5' : 'bg-black/40 border-[#242424] opacity-30')}>
                <p className="text-xl mb-1.5">{tier.icon}</p>
                <p className={clsx('text-xs font-semibold', isActive ? isCurrent ? 'text-brand-400' : 'text-ink-300' : 'text-ink-500')}>{tier.rank}</p>
                <p className="text-[10px] mt-0.5 font-mono text-ink-600">≥{tier.minScore}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Events */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <div className="lg:col-span-1 card p-5 space-y-5">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#242424] pb-3">
            <Filter className="w-3.5 h-3.5 text-brand-400" /> Ledger Filters
          </h4>
          <div className="space-y-1.5">
            <label className="text-[9px] font-mono text-ink-500 uppercase tracking-widest">Threat Class</label>
            <select value={filterThreatType} onChange={e => setFilterThreatType(e.target.value)} className="bg-[#0D0D0D] border border-[#242424] rounded-lg w-full px-3 py-2 text-xs text-brand-400 font-mono outline-none">
              {THREAT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-mono text-ink-500 uppercase tracking-widest">Lifecycle</label>
            <div className="space-y-1">
              {[{ key: 'all', label: 'All Incidents' }, { key: 'open', label: 'Open Warning' }, { key: 'resolved', label: 'Resolved Safe' }].map(opt => (
                <button key={opt.key} onClick={() => setFilterStatus(opt.key as any)} className={clsx('w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition', filterStatus === opt.key ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20' : 'bg-white/[0.01] hover:bg-white/[0.03] text-ink-300 border border-transparent')}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 card overflow-hidden">
          <div className="bg-white/[0.01] px-5 py-4 border-b border-[#242424] flex items-center justify-between">
            <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider">
              <Shield className="w-4 h-4 text-brand-400" /> Immutable Trust Event Ledger
            </h3>
            <LiveBadge />
          </div>
          <div className="divide-y divide-[#242424] max-h-[480px] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#242424 transparent' }}>
            {filtered.length === 0
              ? <div className="p-10 text-center text-xs font-mono text-ink-500 italic">No matching trust events logged.</div>
              : filtered.map(event => (
                <div key={event.id} onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)} className="p-5 hover:bg-white/[0.01] cursor-pointer transition">
                  <div className="flex items-start justify-between mb-2 gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <p className="text-xs font-bold text-white font-mono">{event.event_type}</p>
                        {event.threat_type && <span className="px-2 py-0.5 bg-white/5 border border-white/10 text-ink-300 text-[9px] font-mono rounded">{event.threat_type}</span>}
                      </div>
                      <p className="text-xs text-ink-400 leading-relaxed">{event.description}</p>
                    </div>
                    <span className={clsx('px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase flex items-center gap-1 whitespace-nowrap', event.status === 'resolved' ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20')}>
                      {event.status === 'resolved' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {event.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-ink-500 font-mono">
                    <p>{new Date(event.timestamp).toLocaleString()}</p>
                    <p>AI: <span className="text-brand-300">{(event.ai_confidence * 100).toFixed(0)}%</span></p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-[#242424] flex items-center justify-between">
                    <span className="text-[9px] text-ink-500 font-mono">Evidence HMAC-SHA256</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[9px] text-brand-400">{event.evidence_hash.slice(0, 26)}…</span>
                      <button onClick={e => { e.stopPropagation(); copyHash(event.evidence_hash); }} className="text-ink-600 hover:text-brand-400 transition">
                        {copiedHash === event.evidence_hash ? <Check className="w-3 h-3 text-brand-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                  {expandedEvent === event.id && event.status === 'open' && (
                    <div className="mt-4 pt-4 border-t border-[#242424] space-y-3" onClick={e => e.stopPropagation()}>
                      <textarea placeholder="Enter resolution details…" className="w-full bg-[#0D0D0D] border border-[#242424] rounded-lg p-3 text-xs text-ink-200 placeholder:text-ink-600 outline-none resize-none h-20 focus:border-brand-500/40 transition" />
                      <button onClick={e => { const ta = (e.currentTarget.parentElement?.querySelector('textarea') as HTMLTextAreaElement); resolveEvent(event.id, ta?.value || ''); }} className="btn btn-primary text-xs w-full py-2">
                        Resolve Security Exception
                      </button>
                    </div>
                  )}
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 2 — Compliance Dashboard
// ─────────────────────────────────────────────────────────────────────────────

function TabCompliance() {
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);

  const governed      = agents.length;
  const avgTrust      = Math.round(agents.reduce((a, b) => a + b.trustScore, 0) / agents.length);
  const activeAnomalies = agents.reduce((a, b) => a + b.anomalyCount, 0);
  const totalBudget   = agents.reduce((a, b) => a + b.budgetLimit, 0);
  const usedBudget    = agents.reduce((a, b) => a + b.budgetUsed, 0);
  const budgetUtil    = Math.round((usedBudget / totalBudget) * 100);

  const toggle = (id: string) => setAgents(p => p.map(a => a.id === id ? { ...a, status: a.status === 'active' ? 'quarantined' : 'active' } : a));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Governed Agents"    value={governed}         sub="All frameworks"    icon={Users} />
        <StatCard label="Avg Trust Score"    value={`${avgTrust}%`}   sub="Weighted average"  icon={TrendingUp} accent="text-brand-400" />
        <StatCard label="Active Anomalies"   value={activeAnomalies}  sub="Pending review"    icon={AlertTriangle} accent={activeAnomalies > 0 ? 'text-brand-400' : 'text-emerald-400'} />
        <StatCard label="Budget Utilization" value={`${budgetUtil}%`} sub="Across all agents" icon={BarChart2} accent={budgetUtil > 80 ? 'text-red-400' : 'text-brand-400'} />
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-[#242424] flex items-center justify-between bg-white/[0.01]">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-400" /> Governed Agents
          </h3>
          <LiveBadge />
        </div>
        <div className="divide-y divide-[#242424]">
          {agents.map(agent => {
            const budgetPct = Math.round((agent.budgetUsed / agent.budgetLimit) * 100);
            return (
              <div key={agent.id} className="px-5 py-4 hover:bg-white/[0.01] transition">
                <div className="flex items-center justify-between mb-3 gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="text-sm font-semibold text-white">{agent.name}</p>
                      <span className={clsx('px-2 py-0.5 rounded text-[9px] font-mono font-bold border', agent.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30')}>
                        {agent.status.toUpperCase()}
                      </span>
                      {agent.anomalyCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20 text-[9px] font-mono font-bold">
                          {agent.anomalyCount} anomal{agent.anomalyCount > 1 ? 'ies' : 'y'}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-ink-500 font-mono">{agent.framework} · {agent.category}</p>
                  </div>
                  <button onClick={() => toggle(agent.id)} className={clsx('text-[10px] font-mono font-bold px-3 py-1.5 rounded border transition shrink-0', agent.status === 'active' ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10')}>
                    {agent.status === 'active' ? 'Quarantine' : 'Reinstate'}
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Trust Score', value: `${agent.trustScore}%`, pct: agent.trustScore, danger: false },
                    { label: 'Success Rate', value: `${(agent.successRate * 100).toFixed(0)}%`, pct: agent.successRate * 100, danger: false },
                    { label: 'Budget', value: `${agent.budgetUsed}/${agent.budgetLimit}`, pct: budgetPct, danger: true },
                  ].map(m => (
                    <div key={m.label}>
                      <div className="flex justify-between text-[10px] font-mono text-ink-500 mb-1">
                        <span>{m.label}</span>
                        <span className={m.danger && m.pct > 90 ? 'text-red-400' : m.pct >= 70 ? 'text-emerald-400' : m.pct >= 40 ? 'text-brand-400' : 'text-red-400'}>{m.value}</span>
                      </div>
                      <TrustBar score={m.pct} danger={m.danger} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 3 — Policy Manager
// ─────────────────────────────────────────────────────────────────────────────

function TabPolicy() {
  const [policies, setPolicies]     = useState<PolicyRule[]>(INITIAL_POLICIES);
  const [calcAgent, setCalcAgent]   = useState('ComplianceResearcher');
  const [calcCap, setCalcCap]       = useState('search');
  const [calcTime, setCalcTime]     = useState('business hours');
  const [calcResult, setCalcResult] = useState<{ effect: 'ALLOW' | 'DENY'; rule: PolicyRule | null; reasoning: string } | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [newRule, setNewRule]       = useState({ agent: '', capability: '', timeContext: 'business hours', effect: 'ALLOW' as 'ALLOW' | 'DENY', reasoning: '' });

  const capabilities  = ['search', 'db-read', 'db-delete', 'payout-trigger'];
  const timeContexts  = ['business hours', 'off-hours', 'holiday'];
  const agentNames    = INITIAL_AGENTS.map(a => a.name);

  const calculate = () => {
    const match = policies.find(p => p.agent === calcAgent && p.capability === calcCap && p.timeContext === calcTime);
    if (match) {
      setCalcResult({ effect: match.effect, rule: match, reasoning: match.reasoning });
    } else {
      setCalcResult({ effect: 'DENY', rule: null, reasoning: `No explicit policy found for agent "${calcAgent}" with capability "${calcCap}" in context "${calcTime}". Default DENY applied per zero-trust baseline.` });
    }
  };

  const addRule = () => {
    if (!newRule.agent || !newRule.capability || !newRule.reasoning) return;
    const id = `POL-${String(policies.length + 1).padStart(4, '0')}`;
    setPolicies(p => [...p, { id, ...newRule }]);
    setNewRule({ agent: '', capability: '', timeContext: 'business hours', effect: 'ALLOW', reasoning: '' });
    setShowBuilder(false);
  };

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-5 flex items-center gap-2">
          <Zap className="w-4 h-4 text-brand-400" /> Effective Permission Calculator
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          {[
            { label: 'Agent',        value: calcAgent, setter: setCalcAgent, options: agentNames },
            { label: 'Capability',   value: calcCap,   setter: setCalcCap,   options: capabilities },
            { label: 'Time Context', value: calcTime,  setter: setCalcTime,  options: timeContexts },
          ].map(f => (
            <div key={f.label} className="space-y-1.5">
              <label className="text-[9px] font-mono font-bold text-ink-500 uppercase tracking-widest">{f.label}</label>
              <select value={f.value} onChange={e => f.setter(e.target.value)} className="w-full bg-[#0D0D0D] border border-[#242424] rounded-lg px-3 py-2.5 text-xs text-brand-400 font-mono outline-none focus:border-brand-500/40 transition appearance-none">
                {f.options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>
        <button onClick={calculate} className="btn btn-primary text-xs px-8 py-2.5">
          Calculate Effective Permission
        </button>
        <AnimatePresence>
          {calcResult && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={clsx('mt-5 p-5 rounded-xl border', calcResult.effect === 'ALLOW' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20')}>
              <div className="flex items-center gap-3 mb-3">
                {calcResult.effect === 'ALLOW' ? <ShieldCheck className="w-5 h-5 text-emerald-400" /> : <ShieldAlert className="w-5 h-5 text-red-400" />}
                <DecisionBadge decision={calcResult.effect} />
                {calcResult.rule && <span className="text-[10px] font-mono text-ink-500">{calcResult.rule.id}</span>}
              </div>
              <p className="text-xs text-ink-300 leading-relaxed">{calcResult.reasoning}</p>
              {calcResult.rule && (
                <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap gap-4 text-[10px] font-mono text-ink-500">
                  <span>Agent: <span className="text-ink-300">{calcResult.rule.agent}</span></span>
                  <span>Cap: <span className="text-ink-300">{calcResult.rule.capability}</span></span>
                  <span>Context: <span className="text-ink-300">{calcResult.rule.timeContext}</span></span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-[#242424] flex items-center justify-between bg-white/[0.01]">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-brand-400" /> Active Policies ({policies.length})
          </h3>
          <button onClick={() => setShowBuilder(v => !v)} className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-brand-400 hover:text-brand-300 transition px-3 py-1.5 rounded border border-brand-500/20 hover:border-brand-500/40">
            <Plus className="w-3 h-3" /> Add Rule
          </button>
        </div>

        <AnimatePresence>
          {showBuilder && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="p-5 bg-brand-500/[0.03] border-b border-[#242424] space-y-4">
                <p className="text-[9px] font-mono text-ink-500 uppercase tracking-widest font-bold">New Policy Rule</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <input value={newRule.agent} onChange={e => setNewRule(p => ({ ...p, agent: e.target.value }))} placeholder="Agent name…" className="bg-[#0D0D0D] border border-[#242424] rounded-lg px-3 py-2 text-xs font-mono text-ink-200 placeholder:text-ink-600 outline-none focus:border-brand-500/40" />
                  <select value={newRule.capability} onChange={e => setNewRule(p => ({ ...p, capability: e.target.value }))} className="bg-[#0D0D0D] border border-[#242424] rounded-lg px-3 py-2 text-xs font-mono text-brand-400 outline-none">
                    <option value="">capability…</option>
                    {capabilities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select value={newRule.timeContext} onChange={e => setNewRule(p => ({ ...p, timeContext: e.target.value }))} className="bg-[#0D0D0D] border border-[#242424] rounded-lg px-3 py-2 text-xs font-mono text-brand-400 outline-none">
                    {timeContexts.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <select value={newRule.effect} onChange={e => setNewRule(p => ({ ...p, effect: e.target.value as 'ALLOW' | 'DENY' }))} className="bg-[#0D0D0D] border border-[#242424] rounded-lg px-3 py-2 text-xs font-mono text-brand-400 outline-none">
                    <option value="ALLOW">ALLOW</option>
                    <option value="DENY">DENY</option>
                  </select>
                </div>
                <input value={newRule.reasoning} onChange={e => setNewRule(p => ({ ...p, reasoning: e.target.value }))} placeholder="Policy justification / reasoning…" className="w-full bg-[#0D0D0D] border border-[#242424] rounded-lg px-3 py-2 text-xs font-mono text-ink-200 placeholder:text-ink-600 outline-none focus:border-brand-500/40" />
                <div className="flex gap-2">
                  <button onClick={addRule} className="btn btn-primary text-xs px-6">Save Policy</button>
                  <button onClick={() => setShowBuilder(false)} className="btn btn-ghost text-xs px-4">Cancel</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="divide-y divide-[#242424]">
          {policies.map(p => (
            <div key={p.id} className="px-5 py-4 hover:bg-white/[0.01] transition flex items-start gap-4">
              <DecisionBadge decision={p.effect} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[10px] font-mono text-ink-500">{p.id}</span>
                  <span className="text-xs font-semibold text-white">{p.agent}</span>
                  <span className="px-1.5 py-0.5 bg-white/5 border border-white/10 text-ink-400 text-[9px] font-mono rounded">{p.capability}</span>
                  <span className="px-1.5 py-0.5 bg-white/5 border border-white/10 text-ink-400 text-[9px] font-mono rounded">{p.timeContext}</span>
                </div>
                <p className="text-[11px] text-ink-400 leading-relaxed">{p.reasoning}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 4 — Quarantine Center
// ─────────────────────────────────────────────────────────────────────────────

function TabQuarantine() {
  const [tickets, setTickets] = useState<QuarantineTicket[]>(INITIAL_QUARANTINE);

  const updateApproval = (ticketId: string, authority: string, status: 'approved' | 'rejected') => {
    setTickets(p => p.map(t => t.id !== ticketId ? t : {
      ...t,
      approvals: t.approvals.map(a => a.authority === authority ? { ...a, status } : a),
    }));
  };

  const sevStyle: Record<string, string> = {
    critical: 'bg-red-500/10 text-red-400 border-red-500/30',
    high:     'bg-brand-500/10 text-brand-400 border-brand-500/30',
    medium:   'bg-sky-500/10 text-sky-400 border-sky-500/30',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2">
          <ShieldAlert className="w-4 h-4 text-red-400" />
          <span className="text-xs font-mono font-bold text-red-400">{tickets.length} ACTIVE TICKET{tickets.length !== 1 ? 'S' : ''}</span>
        </div>
        <span className="text-[10px] text-ink-500 font-mono">All actions are cryptographically logged to the immutable ledger</span>
      </div>

      {tickets.map(ticket => {
        const allApproved = ticket.approvals.every(a => a.status === 'approved');
        const anyRejected = ticket.approvals.some(a => a.status === 'rejected');
        const isResolved  = allApproved || anyRejected;

        return (
          <motion.div key={ticket.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-[#242424] bg-red-500/[0.03] flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono font-bold text-white text-sm">{ticket.id}</span>
                  <span className={clsx('px-2.5 py-0.5 rounded border text-[9px] font-mono font-bold uppercase', sevStyle[ticket.severity])}>
                    {ticket.severity}
                  </span>
                  {isResolved && (
                    <span className={clsx('px-2.5 py-0.5 rounded border text-[9px] font-mono font-bold uppercase', allApproved ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20')}>
                      {allApproved ? 'Cleared' : 'Rejected'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink-300 leading-relaxed max-w-2xl">{ticket.description}</p>
                <p className="text-[10px] text-ink-500 font-mono">{new Date(ticket.createdAt).toLocaleString()}</p>
              </div>
              <span className="text-2xl">🔒</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#242424]">
              <div className="p-6">
                <h4 className="text-[9px] font-mono font-bold text-ink-500 uppercase tracking-widest mb-4">Detected Anomalies</h4>
                <div className="space-y-2.5">
                  {ticket.anomalies.map((a, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-brand-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-ink-300">{a}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-6">
                <h4 className="text-[9px] font-mono font-bold text-ink-500 uppercase tracking-widest mb-4">Approval Authorities</h4>
                <div className="space-y-3">
                  {ticket.approvals.map(approval => (
                    <div key={approval.authority} className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white">{approval.authority}</p>
                        <p className="text-[10px] text-ink-500 font-mono">{approval.role}</p>
                      </div>
                      {approval.status === 'pending' ? (
                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={() => updateApproval(ticket.id, approval.authority, 'approved')} className="flex items-center gap-1 px-3 py-1.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold hover:bg-emerald-500/20 transition">
                            <Check className="w-3 h-3" /> Approve
                          </button>
                          <button onClick={() => updateApproval(ticket.id, approval.authority, 'rejected')} className="flex items-center gap-1 px-3 py-1.5 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-mono font-bold hover:bg-red-500/20 transition">
                            <X className="w-3 h-3" /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className={clsx('px-2.5 py-1 rounded border text-[9px] font-mono font-bold flex items-center gap-1', approval.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20')}>
                          {approval.status === 'approved' ? <CheckCircle className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          {approval.status.toUpperCase()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                {isResolved && (
                  <div className={clsx('mt-4 p-3 rounded-lg border text-xs font-mono', allApproved ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-red-500/5 border-red-500/20 text-red-400')}>
                    {allApproved ? '✓ All authorities approved — ticket cleared from quarantine.' : '✗ Rejection recorded — agent remains in quarantine.'}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 5 — Ledger Explorer
// ─────────────────────────────────────────────────────────────────────────────

function TabLedger() {
  const [entries]                = useState<LedgerEntry[]>(INITIAL_LEDGER);
  const [searchAgent, setAgent]  = useState('');
  const [searchCap, setCap]      = useState('');
  const [copiedId, setCopiedId]  = useState<string | null>(null);

  const filtered = useMemo(() => entries.filter(e => {
    if (searchAgent && !e.agent.toLowerCase().includes(searchAgent.toLowerCase())) return false;
    if (searchCap   && !e.capability.toLowerCase().includes(searchCap.toLowerCase()))   return false;
    return true;
  }), [entries, searchAgent, searchCap]);

  const copy = (id: string, hash: string) => {
    navigator.clipboard.writeText(hash).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-500" />
          <input value={searchAgent} onChange={e => setAgent(e.target.value)} placeholder="Filter by agent…" className="w-full pl-9 pr-4 py-2.5 bg-[#0D0D0D] border border-[#242424] rounded-lg text-xs font-mono text-ink-200 placeholder:text-ink-600 outline-none focus:border-brand-500/40 transition" />
        </div>
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-500" />
          <input value={searchCap} onChange={e => setCap(e.target.value)} placeholder="Filter by capability…" className="w-full pl-9 pr-4 py-2.5 bg-[#0D0D0D] border border-[#242424] rounded-lg text-xs font-mono text-ink-200 placeholder:text-ink-600 outline-none focus:border-brand-500/40 transition" />
        </div>
        <div className="flex items-center gap-1.5 px-3 py-2 bg-[#0D0D0D] border border-[#242424] rounded-lg text-[10px] font-mono text-ink-500 whitespace-nowrap">
          <span className="text-ink-300">{filtered.length}</span> / <span>{entries.length}</span> entries
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-[#242424] bg-white/[0.01] flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Hash className="w-4 h-4 text-brand-400" /> Cryptographic Evidence Ledger
          </h3>
          <LiveBadge />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[640px]">
            <thead className="bg-[#0A0A0A] border-b border-[#242424]">
              <tr>
                {['Timestamp', 'Agent', 'Capability', 'Decision', 'Policy Ref', 'Evidence Hash'].map(h => (
                  <th key={h} className="px-4 py-3.5 text-left font-mono font-bold text-[9px] text-ink-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#242424]">
              {filtered.length === 0
                ? <tr><td colSpan={6} className="px-4 py-10 text-center text-xs font-mono text-ink-500 italic">No entries match the current filter.</td></tr>
                : filtered.map(e => (
                  <tr key={e.id} className="hover:bg-white/[0.015] transition">
                    <td className="px-4 py-3.5 font-mono text-[10px] text-ink-400 whitespace-nowrap">
                      <span className="block">{new Date(e.timestamp).toLocaleTimeString()}</span>
                      <span className="block text-ink-600">{new Date(e.timestamp).toLocaleDateString()}</span>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-white whitespace-nowrap">{e.agent}</td>
                    <td className="px-4 py-3.5"><span className="px-2 py-0.5 bg-white/5 border border-white/10 font-mono text-ink-300 text-[9px] rounded">{e.capability}</span></td>
                    <td className="px-4 py-3.5"><DecisionBadge decision={e.decision} /></td>
                    <td className="px-4 py-3.5 font-mono text-[10px] text-ink-400">{e.policyRef}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[9px] text-brand-400">{e.evidenceHash.slice(0, 22)}…</span>
                        <button onClick={() => copy(e.id, e.evidenceHash)} className="text-ink-600 hover:text-brand-400 transition shrink-0">
                          {copiedId === e.id ? <Check className="w-3 h-3 text-brand-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 6 — Registry
// ─────────────────────────────────────────────────────────────────────────────

function TabRegistry() {
  return (
    <div className="space-y-6">
      <Link href="/governance/registry" className="block card p-6 border-brand-500/20 hover:border-brand-500/40 bg-gradient-to-br from-brand-500/[0.04] to-transparent group transition-all duration-300 hover:shadow-[0_0_32px_rgba(255,184,0,0.06)]">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 grid place-items-center">
                <Database className="w-5 h-5 text-brand-400" />
              </div>
              <div>
                <p className="text-[9px] font-mono font-bold text-ink-500 uppercase tracking-widest">Sovereign Infrastructure · Layer 1</p>
                <h2 className="text-lg font-bold text-white">Veklom Operator Registry</h2>
              </div>
            </div>
            <p className="text-sm text-ink-400 leading-relaxed max-w-xl">
              The Veklom Layer 1 identity primitive. View the full sovereign operator registry, publish telemetry events, query cryptographic trust scores, and test rank tier transitions.
            </p>
          </div>
          <ExternalLink className="w-5 h-5 text-ink-600 group-hover:text-brand-400 transition mt-1 shrink-0" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-[#242424]">
          {[
            { label: 'Registered Operators', value: '1',      icon: Users,    green: false },
            { label: 'Trust Events Logged',  value: '2',      icon: Activity, green: false },
            { label: 'Score Version',        value: 'v0 Det.', icon: Layers,   green: false },
            { label: 'Node Status',          value: 'ACTIVE', icon: Zap,      green: true  },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-3">
              <s.icon className={clsx('w-4 h-4 shrink-0', s.green ? 'text-emerald-400' : 'text-brand-400')} />
              <div>
                <p className="text-[9px] text-ink-500 font-mono uppercase tracking-widest">{s.label}</p>
                <p className={clsx('text-sm font-bold font-mono', s.green ? 'text-emerald-400' : 'text-white')}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      </Link>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-5 space-y-3">
          <h4 className="text-xs font-bold text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-brand-400" /> Registry Capabilities
          </h4>
          {[
            'Immutable trust score tracking',
            'Wallet-linked operator identity cards',
            'Telemetry event ingestion (verified_action / policy_violation)',
            'Cryptographic evidence proof hashes',
            'Rank tier progression — Recruit → Apex Sovereign',
          ].map(c => (
            <div key={c} className="flex items-start gap-2">
              <ChevronRight className="w-3.5 h-3.5 text-brand-400 mt-0.5 shrink-0" />
              <span className="text-xs text-ink-300">{c}</span>
            </div>
          ))}
        </div>
        <div className="card p-5 space-y-3">
          <h4 className="text-xs font-bold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-brand-400" /> Zero-Trust Architecture
          </h4>
          {[
            'All access decisions evaluated on Hetzner sovereign node',
            'AWS burst capacity gated by tenant policy rule',
            'No data leaves the EU-sovereign perimeter',
            'Every policy evaluation produces an evidence hash',
            'Human-in-the-loop checkpoints for critical capabilities',
          ].map(c => (
            <div key={c} className="flex items-start gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-brand-400 mt-0.5 shrink-0" />
              <span className="text-xs text-ink-300">{c}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab config
// ─────────────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'identity',   label: 'Identity Cards',       icon: Fingerprint, badge: undefined as string | undefined },
  { id: 'compliance', label: 'Compliance Dashboard', icon: BarChart2,   badge: undefined as string | undefined },
  { id: 'policy',     label: 'Policy Manager',       icon: BookOpen,    badge: undefined as string | undefined },
  { id: 'quarantine', label: 'Quarantine Center',    icon: ShieldAlert, badge: '1'                              },
  { id: 'ledger',     label: 'Ledger Explorer',      icon: Hash,        badge: undefined as string | undefined },
  { id: 'registry',   label: 'Registry',             icon: Database,    badge: undefined as string | undefined },
] as const;

type TabId = typeof TABS[number]['id'];

// ─────────────────────────────────────────────────────────────────────────────
// Root page
// ─────────────────────────────────────────────────────────────────────────────

export default function GovernancePage() {
  const [activeTab, setActiveTab] = useState<TabId>('identity');

  const content: Record<TabId, React.ReactNode> = {
    identity:   <TabIdentity />,
    compliance: <TabCompliance />,
    policy:     <TabPolicy />,
    quarantine: <TabQuarantine />,
    ledger:     <TabLedger />,
    registry:   <TabRegistry />,
  };

  return (
    <Shell>
      <div className="space-y-6 gvn-fade-up">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-[0.18em] text-ink-600">Zero-Trust · Governance Layer</span>
            <h1 className="text-[28px] font-semibold tracking-tight gvn-gradient">Governance Hub</h1>
            <p className="text-sm text-ink-400 max-w-2xl mt-1">
              Unified sovereign control room — identity, compliance, policy enforcement, quarantine, and cryptographic evidence ledger.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <LiveBadge />
            <Link href="/audit" className="btn btn-ghost text-xs py-2">
              <Shield className="w-3.5 h-3.5 mr-1.5 text-brand-400" /> Audit Log
            </Link>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-0 overflow-x-auto border border-[#242424] rounded-xl bg-[#0D0D0D] p-1">
          {TABS.map(tab => {
            const Icon     = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'relative flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap flex-shrink-0',
                  isActive
                    ? 'bg-brand-500/[0.12] text-brand-400'
                    : 'text-ink-400 hover:text-ink-200 hover:bg-white/[0.03]'
                )}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.badge && (
                  <span className="min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-1">
                    {tab.badge}
                  </span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="gov-tab-indicator"
                    className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-brand-400"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {content[activeTab]}
          </motion.div>
        </AnimatePresence>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .gvn-gradient {
          background: linear-gradient(135deg, #FFFFFF 40%, #FFB800 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        @keyframes gvn-fade-up-anim {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .gvn-fade-up { animation: gvn-fade-up-anim 0.4s ease-out both; }
      ` }} />
    </Shell>
  );
}
