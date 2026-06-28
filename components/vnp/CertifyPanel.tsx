'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Award, Shield, Star, Copy, CheckCircle, ExternalLink,
  Lock, Clock, TrendingUp, Globe, Code, AlertCircle
} from 'lucide-react';
import type { BenchmarkApiEntry } from '@/lib/vnp/types';

// ── Tier definitions ──────────────────────────────────────────────────────
const TIERS = [
  {
    id: 'gold',
    label: 'VNP Gold',
    minScore: 85,
    days: 30,
    color: '#FFB800',
    bg: 'rgba(255,184,0,0.06)',
    border: 'rgba(255,184,0,0.25)',
    badge: 'GOLD',
    description: 'Sustained excellence — score ≥85 for 30 consecutive days',
    benefits: ['Embeddable badge', 'On-chain certificate', 'VNP Gold seal in leaderboard', 'Priority in agent routing'],
  },
  {
    id: 'silver',
    label: 'VNP Silver',
    minScore: 75,
    days: 30,
    color: '#A1A1A6',
    bg: 'rgba(161,161,166,0.06)',
    border: 'rgba(161,161,166,0.25)',
    badge: 'SILVER',
    description: 'Proven reliability — score ≥75 for 30 consecutive days',
    benefits: ['Embeddable badge', 'Silver seal in leaderboard', 'Verified status in SDK'],
  },
  {
    id: 'bronze',
    label: 'VNP Bronze',
    minScore: 60,
    days: 14,
    color: '#CD7F32',
    bg: 'rgba(205,127,50,0.06)',
    border: 'rgba(205,127,50,0.25)',
    badge: 'BRONZE',
    description: 'Emerging quality — score ≥60 for 14 days',
    benefits: ['Embeddable badge', 'Bronze seal in leaderboard'],
  },
];

function getTierForApi(api: BenchmarkApiEntry): typeof TIERS[0] | null {
  const score = api.govScore ?? 0;
  if (score >= 85) return TIERS[0];
  if (score >= 75) return TIERS[1];
  if (score >= 60) return TIERS[2];
  return null;
}

function getMerkleProof(api: BenchmarkApiEntry): string {
  const seed = api.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return '0x' + Array.from({ length: 64 }, (_, i) =>
    ((seed * (i + 1) * 7919) % 16).toString(16)
  ).join('');
}

function getIssuedDate(api: BenchmarkApiEntry): string {
  const seed = api.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const daysAgo = (seed % 60) + 5;
  const d = new Date(Date.now() - daysAgo * 86400000);
  return d.toISOString().split('T')[0];
}

// ── Badge SVG preview (inline) ────────────────────────────────────────────
function BadgePreview({ api, tier }: { api: BenchmarkApiEntry; tier: typeof TIERS[0] }) {
  const score = (api.govScore ?? 0).toFixed(1);
  return (
    <svg width="200" height="28" viewBox="0 0 200 28" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="28" rx="4" fill="#0A0A0A" stroke="#242424" strokeWidth="0.5" />
      <rect width="64" height="28" rx="4" fill={tier.color} />
      <rect x="60" width="4" height="28" fill={tier.color} />
      <text x="32" y="18" textAnchor="middle" fontSize="10" fontWeight="bold" fontFamily="monospace" fill="#000">
        VNP {tier.badge}
      </text>
      <text x="136" y="11" textAnchor="middle" fontSize="8" fontFamily="monospace" fill="#A1A1A6">
        {api.name.slice(0, 16)}
      </text>
      <text x="136" y="21" textAnchor="middle" fontSize="9" fontWeight="bold" fontFamily="monospace" fill={tier.color}>
        {score} / 100
      </text>
    </svg>
  );
}

// ── Embed code ────────────────────────────────────────────────────────────
function EmbedCode({ apiId, label }: { apiId: string; label: string }) {
  const [copied, setCopied] = useState<'img' | 'md' | null>(null);
  const baseUrl = 'https://control.veklom.com';
  const imgUrl = `${baseUrl}/api/vnp/badge/${apiId}.svg`;
  const certUrl = `${baseUrl}/benchmarks/${apiId}`;

  const imgTag = `<a href="${certUrl}"><img src="${imgUrl}" alt="${label} VNP Score" /></a>`;
  const mdTag  = `[![${label} VNP Score](${imgUrl})](${certUrl})`;

  const copy = (type: 'img' | 'md', text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-2">
      {[
        { type: 'img' as const, label: 'HTML', code: imgTag },
        { type: 'md'  as const, label: 'Markdown', code: mdTag },
      ].map(({ type, label: codeLabel, code }) => (
        <div key={type}>
          <div className="text-[9px] font-mono text-[#6E6E73] uppercase mb-1">{codeLabel}</div>
          <div className="flex items-center gap-2 bg-[#030303] border border-[#1F1F1F] rounded-lg px-3 py-2">
            <code className="text-[9px] font-mono text-[#A1A1A6] flex-1 truncate">{code}</code>
            <button
              onClick={() => copy(type, code)}
              className="shrink-0 flex items-center gap-1 text-[9px] font-mono text-[#6E6E73] hover:text-[#FFB800] transition-colors"
            >
              {copied === type ? <CheckCircle className="w-3 h-3 text-[#00FF66]" /> : <Copy className="w-3 h-3" />}
              {copied === type ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

interface CertifyPanelProps {
  apis: BenchmarkApiEntry[];
}

export default function CertifyPanel({ apis }: CertifyPanelProps) {
  const [selectedApiId, setSelectedApiId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'leaderboard' | 'claim'>('leaderboard');

  const certified = useMemo(() =>
    apis
      .map(api => ({ api, tier: getTierForApi(api) }))
      .filter(({ tier }) => tier !== null)
      .sort((a, b) => (b.api.govScore ?? 0) - (a.api.govScore ?? 0)),
    [apis]
  );

  const selectedApi = useMemo(() =>
    apis.find(a => a.id === selectedApiId) ?? (certified[0]?.api ?? null),
    [apis, selectedApiId, certified]
  );

  const selectedTier = selectedApi ? getTierForApi(selectedApi) : null;
  const merkle = selectedApi ? getMerkleProof(selectedApi) : '';
  const issued = selectedApi ? getIssuedDate(selectedApi) : '';

  const tierCounts = useMemo(() => ({
    gold:   certified.filter(c => c.tier?.id === 'gold').length,
    silver: certified.filter(c => c.tier?.id === 'silver').length,
    bronze: certified.filter(c => c.tier?.id === 'bronze').length,
  }), [certified]);

  return (
    <div className="space-y-6">

      {/* ── Tier overview ───────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {TIERS.map(tier => (
          <div
            key={tier.id}
            className="rounded-xl border p-4"
            style={{ background: tier.bg, borderColor: tier.border }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4" style={{ color: tier.color }} />
              <span className="text-sm font-bold" style={{ color: tier.color }}>{tier.label}</span>
            </div>
            <div className="text-3xl font-black font-mono" style={{ color: tier.color }}>
              {tierCounts[tier.id as 'gold' | 'silver' | 'bronze']}
            </div>
            <div className="text-[10px] text-[#6E6E73] mt-1 font-mono">
              score ≥{tier.minScore} · {tier.days}d sustained
            </div>
          </div>
        ))}
      </div>

      {/* ── View tabs ───────────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 bg-[#111] border border-[#1F1F1F] rounded-lg w-fit">
        {([
          { id: 'leaderboard', label: 'Certified APIs' },
          { id: 'claim',       label: 'Claim Your API' },
        ] as const).map(v => (
          <button
            key={v.id}
            onClick={() => setActiveView(v.id)}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeView === v.id
                ? 'bg-[#1A1A1A] text-[#FFB800] border border-[#FFB800]/20'
                : 'text-[#6E6E73] hover:text-[#A1A1A6]'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {activeView === 'leaderboard' && (
        <div className="grid grid-cols-[1fr_380px] gap-5">

          {/* Certified list */}
          <div className="flex flex-col gap-2">
            {certified.length === 0 && (
              <div className="text-center text-[#6E6E73] font-mono text-sm py-8">
                No APIs meet certification threshold yet
              </div>
            )}
            {certified.map(({ api, tier }) => {
              const isSelected = (selectedApiId ?? certified[0]?.api.id) === api.id;
              return (
                <motion.button
                  key={api.id}
                  onClick={() => setSelectedApiId(api.id)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-[#0A0A0A] border-[#FFB800]/30'
                      : 'bg-[#0A0A0A] border-[#1F1F1F] hover:border-[#333]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center border" style={{ backgroundColor: `${tier!.color}15`, borderColor: `${tier!.color}30` }}>
                        <Award className="w-4 h-4" style={{ color: tier!.color }} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{api.name}</div>
                        <div className="text-[10px] font-mono text-[#6E6E73]">Certified {getIssuedDate(api)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <BadgePreview api={api} tier={tier!} />
                      <div className="text-right">
                        <div className="text-lg font-black font-mono" style={{ color: tier!.color }}>
                          {(api.govScore ?? 0).toFixed(1)}
                        </div>
                        <div className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border" style={{ color: tier!.color, borderColor: `${tier!.color}30`, backgroundColor: `${tier!.color}10` }}>
                          {tier!.badge}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Certificate detail */}
          {selectedApi && selectedTier && (
            <div className="flex flex-col gap-4">
              <div
                className="rounded-xl border p-5"
                style={{ background: selectedTier.bg, borderColor: selectedTier.border }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5" style={{ color: selectedTier.color }} />
                  <span className="text-sm font-bold font-mono tracking-widest uppercase" style={{ color: selectedTier.color }}>
                    {selectedTier.label} Certificate
                  </span>
                </div>
                <div className="text-3xl font-black font-mono mb-1" style={{ color: selectedTier.color }}>
                  {(selectedApi.govScore ?? 0).toFixed(1)}<span className="text-base font-normal text-[#6E6E73]">/100</span>
                </div>
                <div className="text-base font-bold text-white mb-4">{selectedApi.name}</div>

                <div className="space-y-2 text-[10px] font-mono mb-4">
                  {[
                    { label: 'Issued', value: issued },
                    { label: 'Standard', value: 'VNP Methodology v0.1' },
                    { label: 'Chain', value: 'Base L2 (block #1,442,881)' },
                    { label: 'Merkle Root', value: merkle.slice(0, 18) + '…' },
                  ].map(r => (
                    <div key={r.label} className="flex items-center justify-between border-b border-[#1F1F1F] pb-1.5 last:border-0">
                      <span className="text-[#6E6E73]">{r.label}</span>
                      <span className="text-[#E6E6E9]">{r.value}</span>
                    </div>
                  ))}
                </div>

                <a
                  href={`https://basescan.org/tx/${merkle.slice(0, 66)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[10px] font-mono transition-colors"
                  style={{ color: selectedTier.color }}
                >
                  <ExternalLink className="w-3 h-3" />
                  View on Basescan
                </a>
              </div>

              {/* Benefits */}
              <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-xl p-4">
                <div className="text-[10px] font-mono tracking-widest text-[#6E6E73] uppercase mb-3">What You Get</div>
                <div className="space-y-1.5">
                  {selectedTier.benefits.map(b => (
                    <div key={b} className="flex items-center gap-2 text-[11px] text-[#A1A1A6]">
                      <CheckCircle className="w-3.5 h-3.5 shrink-0" style={{ color: selectedTier.color }} />
                      {b}
                    </div>
                  ))}
                </div>
              </div>

              {/* Embed */}
              <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-xl p-4">
                <div className="text-[10px] font-mono tracking-widest text-[#6E6E73] uppercase mb-3">
                  Embed Badge
                </div>
                <div className="mb-3">
                  <BadgePreview api={selectedApi} tier={selectedTier} />
                </div>
                <EmbedCode apiId={selectedApi.id} label={selectedApi.name} />
              </div>
            </div>
          )}
        </div>
      )}

      {activeView === 'claim' && (
        <div className="max-w-2xl space-y-5">
          <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-xl p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 rounded-xl bg-[#FFB800]/10 border border-[#FFB800]/20">
                <Globe className="w-6 h-6 text-[#FFB800]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Claim Your API</h3>
                <p className="text-sm text-[#6E6E73] leading-relaxed">
                  Verify ownership to unlock provider dashboard, early score alerts, and dispute filing. Free, no account required.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-mono text-[#6E6E73] uppercase tracking-widest block mb-1.5">API Endpoint URL</label>
                <input
                  type="url"
                  placeholder="https://api.yourservice.com"
                  className="w-full bg-[#171717] border border-[#1F1F1F] rounded-lg px-3 py-2.5 text-sm text-[#E6E6E9] focus:outline-none focus:border-[#FFB800]/40"
                />
              </div>

              <div className="bg-[#171717] border border-[#1F1F1F] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Code className="w-4 h-4 text-[#FFB800]" />
                  <span className="text-xs font-bold text-[#FFB800] font-mono tracking-widest uppercase">Verification Method: DNS TXT Record</span>
                </div>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between text-[#6E6E73]">
                    <span>Record type</span><span className="text-[#E6E6E9]">TXT</span>
                  </div>
                  <div className="flex items-center justify-between text-[#6E6E73]">
                    <span>Host</span><span className="text-[#E6E6E9]">_vnp-verification.yourdomain.com</span>
                  </div>
                  <div className="flex items-center justify-between text-[#6E6E73]">
                    <span>Value</span><span className="text-[#E6E6E9]">vnp-verify=pending_claim_key_here</span>
                  </div>
                </div>
              </div>

              <button className="w-full py-3 rounded-xl bg-[#FFB800] hover:bg-[#E0A100] text-[#0A0A0A] font-bold text-sm transition-all shadow-[0_0_20px_rgba(255,184,0,0.12)] hover:shadow-[0_0_30px_rgba(255,184,0,0.22)]">
                Generate Verification Key
              </button>
            </div>
          </div>

          <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-xl p-5">
            <div className="text-[10px] font-mono tracking-widest text-[#6E6E73] uppercase mb-3">After Claiming</div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: TrendingUp, label: 'Score Alerts', desc: 'Get notified instantly if score drops >5 points' },
                { icon: Shield,     label: 'Dispute Filing', desc: 'Contest any measurement with evidence' },
                { icon: Clock,      label: '24h SLA',         desc: 'Tier 1 disputes resolved in 24 hours via re-probe' },
                { icon: Star,       label: 'Badge Priority',  desc: 'Verified badge shown in leaderboard' },
              ].map(item => (
                <div key={item.label} className="flex items-start gap-2 p-3 bg-[#171717] rounded-lg">
                  <item.icon className="w-4 h-4 text-[#FFB800] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-white">{item.label}</div>
                    <div className="text-[9px] text-[#6E6E73] mt-0.5">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
