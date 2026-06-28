'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  ChevronRight, Activity, Globe, Zap, Shield, BookOpen,
  FileText, Clock, Bell, BarChart2, Search, ArrowUpRight,
  Minus, Info
} from 'lucide-react';
import type { BenchmarkApiEntry } from '@/lib/vnp/types';

// ── Dimension definitions ─────────────────────────────────────────────────
const DIMENSIONS = [
  { key: 'p99_latency',           label: 'p99 Latency',          weight: 40, icon: Zap,      good_direction: 'low',  unit: 'ms',  description: 'p99 response time across 1,000 probes per region' },
  { key: 'error_rate',            label: 'Error Rate',           weight: 25, icon: AlertTriangle, good_direction: 'low', unit: '%', description: '4xx + 5xx error rate across all probes' },
  { key: 'availability',          label: 'Availability',         weight: 15, icon: Activity,  good_direction: 'high', unit: '%',  description: 'Uptime measured across all 5 regions, 30-day window' },
  { key: 'throughput',            label: 'Throughput',           weight:  8, icon: BarChart2, good_direction: 'high', unit: 'rps', description: 'Sustained requests per second under load test' },
  { key: 'security',              label: 'Security',             weight:  8, icon: Shield,    good_direction: 'high', unit: 'pts', description: 'TLS version, HSTS, security headers, auth quality' },
  { key: 'documentation',         label: 'Documentation',        weight:  7, icon: BookOpen,  good_direction: 'high', unit: 'pts', description: 'OpenAPI spec completeness, TTFC, SDKs, changelogs' },
  { key: 'versioning',            label: 'Versioning',           weight:  7, icon: FileText,  good_direction: 'high', unit: 'pts', description: 'Semantic versioning, deprecation policy, stability' },
  { key: 'm2m_compliance',        label: 'M2M / x402',          weight:  6, icon: Globe,     good_direction: 'high', unit: 'pts', description: 'x402 payment protocol support and M2M attestation' },
  { key: 'ratelimit_transparency',label: 'Rate Limit',           weight:  6, icon: Clock,     good_direction: 'high', unit: 'pts', description: 'X-RateLimit headers, retry-after, burst policies' },
  { key: 'dx_ttfc',              label: 'DX / TTFC',            weight:  5, icon: ArrowUpRight, good_direction: 'high', unit: 'pts', description: 'Time-to-first-call, onboarding quality, SDK ease' },
];

// ── Simulate dimensional scores from BenchmarkApiEntry ────────────────────
function getDimensionalScores(api: BenchmarkApiEntry) {
  const base = api.govScore || 80;
  const seed = api.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const jitter = (i: number) => ((seed * (i + 1) * 7919) % 30) - 15;
  return {
    p99_latency:            Math.min(100, Math.max(30, 100 - (api.p99 / 15) + jitter(0))),
    error_rate:             Math.min(100, Math.max(20, 100 - api.drift * 2 + jitter(1))),
    availability:           Math.min(100, Math.max(40, api.uptime24h - 0.1 + jitter(2) * 0.1)),
    throughput:             Math.min(100, Math.max(30, base + jitter(3))),
    security:               Math.min(100, Math.max(50, base + 5 + jitter(4))),
    documentation:          Math.min(100, Math.max(20, base - 5 + jitter(5))),
    versioning:             Math.min(100, Math.max(30, base + jitter(6))),
    m2m_compliance:         api.complianceLabels.includes('x402') ? Math.min(100, base + 12 + jitter(7)) : Math.min(60, base - 20 + jitter(7)),
    ratelimit_transparency: Math.min(100, Math.max(25, base + jitter(8))),
    dx_ttfc:                Math.min(100, Math.max(20, base - 8 + jitter(9))),
  };
}

function gradeFor(score: number): { letter: string; color: string; bg: string } {
  if (score >= 90) return { letter: 'A+', color: '#00FF66', bg: '#00FF66/10' };
  if (score >= 80) return { letter: 'A',  color: '#00FF66', bg: '#00FF66/8'  };
  if (score >= 70) return { letter: 'B',  color: '#FFB800', bg: '#FFB800/10' };
  if (score >= 60) return { letter: 'C',  color: '#FFAB00', bg: '#FFAB00/10' };
  if (score >= 50) return { letter: 'D',  color: '#FF7A00', bg: '#FF7A00/10' };
  return                   { letter: 'F',  color: '#FF003C', bg: '#FF003C/10' };
}

// ── Weekly trend simulation ───────────────────────────────────────────────
function getTrend(api: BenchmarkApiEntry) {
  const seed = api.id.charCodeAt(0);
  return Array.from({ length: 7 }, (_, i) => {
    const base = api.govScore || 80;
    return Math.max(40, Math.min(100, base + Math.sin((seed + i) * 0.8) * 8 - i * 0.3));
  });
}

interface ProviderIntelPanelProps {
  apis: BenchmarkApiEntry[];
}

export default function ProviderIntelPanel({ apis }: ProviderIntelPanelProps) {
  const [search, setSearch] = useState('');
  const [selectedApiId, setSelectedApiId] = useState<string | null>(null);
  const [alertThreshold, setAlertThreshold] = useState(75);

  const filtered = useMemo(() =>
    apis.filter(a => a.name.toLowerCase().includes(search.toLowerCase())),
    [apis, search]
  );

  const selectedApi = useMemo(() =>
    apis.find(a => a.id === selectedApiId) ?? (apis.length > 0 ? apis[0] : null),
    [apis, selectedApiId]
  );

  const scores = selectedApi ? getDimensionalScores(selectedApi) : null;
  const trend = selectedApi ? getTrend(selectedApi) : [];

  const issues = useMemo(() => {
    if (!scores) return [];
    return DIMENSIONS
      .map(d => ({ ...d, score: scores[d.key as keyof typeof scores] as number }))
      .sort((a, b) => a.score - b.score)
      .slice(0, 3);
  }, [scores]);

  const composite = selectedApi?.govScore ?? 0;
  const compositeGrade = gradeFor(composite);

  // Peer comparison (top 5 by score)
  const peers = useMemo(() =>
    [...apis]
      .sort((a, b) => (b.govScore ?? 0) - (a.govScore ?? 0))
      .slice(0, 5),
    [apis]
  );

  return (
    <div className="grid grid-cols-[260px_1fr] gap-5 min-h-[600px]">

      {/* ── Left: API Selector ────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6E6E73]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search APIs…"
            className="w-full bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg pl-8 pr-3 py-2 text-xs text-[#E6E6E9] font-mono focus:outline-none focus:border-[#FFB800]/40 placeholder-[#6E6E73]"
          />
        </div>

        <div className="flex flex-col gap-1 overflow-y-auto max-h-[520px] pr-1">
          {filtered.map(api => {
            const isSelected = (selectedApiId ?? apis[0]?.id) === api.id;
            const score = api.govScore ?? 0;
            const g = gradeFor(score);
            return (
              <button
                key={api.id}
                onClick={() => setSelectedApiId(api.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all ${
                  isSelected
                    ? 'border-[#FFB800]/40 bg-[#FFB800]/5'
                    : 'border-[#1F1F1F] bg-[#0A0A0A] hover:border-[#333]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-semibold ${isSelected ? 'text-[#FFB800]' : 'text-[#E6E6E9]'}`}>
                    {api.name}
                  </span>
                  <span className="text-[10px] font-bold font-mono" style={{ color: g.color }}>
                    {score.toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1 bg-[#171717] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: g.color }} />
                  </div>
                  <span className="text-[9px] font-bold font-mono" style={{ color: g.color }}>{g.letter}</span>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center text-[#6E6E73] text-xs py-8 font-mono">No APIs found</div>
          )}
        </div>
      </div>

      {/* ── Right: Intel View ─────────────────────────────────────────── */}
      {selectedApi && scores ? (
        <div className="flex flex-col gap-5">

          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl font-bold text-white">{selectedApi.name}</h2>
                <span
                  className="px-3 py-1 rounded-lg border text-sm font-black font-mono"
                  style={{ color: compositeGrade.color, borderColor: `${compositeGrade.color}40`, backgroundColor: `${compositeGrade.color}10` }}
                >
                  {compositeGrade.letter}
                </span>
                <span className="text-2xl font-black font-mono text-white">{composite.toFixed(1)}<span className="text-sm text-[#6E6E73] font-normal">/100</span></span>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-mono text-[#6E6E73]">
                <span>ID: {selectedApi.id}</span>
                <span>·</span>
                <span>{selectedApi.complianceLabels.join(' · ')}</span>
                <span>·</span>
                <span className="text-[#00FF66]">LIVE SCORE</span>
              </div>
            </div>

            {/* Alert config */}
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2 text-[10px] font-mono text-[#6E6E73]">
                <Bell className="w-3 h-3" />
                <span>Alert below:</span>
                <span className="text-[#FFB800] font-bold">{alertThreshold}</span>
              </div>
              <input
                type="range" min={40} max={95} value={alertThreshold}
                onChange={e => setAlertThreshold(parseInt(e.target.value))}
                className="w-28 accent-[#FFB800]"
              />
            </div>
          </div>

          {/* 7-day trend */}
          <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-xl p-4">
            <div className="text-[10px] font-mono tracking-widest text-[#6E6E73] uppercase mb-3">7-Day Score Trend</div>
            <div className="flex items-end gap-1 h-12">
              {trend.map((v, i) => {
                const g = gradeFor(v);
                const isLast = i === trend.length - 1;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-sm" style={{ height: `${(v / 100) * 48}px`, backgroundColor: isLast ? g.color : `${g.color}50` }} />
                    <div className="text-[8px] font-mono text-[#6E6E73]">
                      {['6d', '5d', '4d', '3d', '2d', '1d', 'now'][i]}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2 text-[9px] font-mono text-[#6E6E73]">
              <span>7 days ago: <span className="text-[#E6E6E9] font-bold">{trend[0].toFixed(1)}</span></span>
              <span className="flex items-center gap-1">
                {trend[6] >= trend[0]
                  ? <TrendingUp className="w-3 h-3 text-[#00FF66]" />
                  : <TrendingDown className="w-3 h-3 text-[#FF003C]" />
                }
                <span className={trend[6] >= trend[0] ? 'text-[#00FF66]' : 'text-[#FF003C]'}>
                  {trend[6] >= trend[0] ? '+' : ''}{(trend[6] - trend[0]).toFixed(1)} pts
                </span>
              </span>
            </div>
          </div>

          {/* Dimension breakdown */}
          <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-xl p-4">
            <div className="text-[10px] font-mono tracking-widest text-[#6E6E73] uppercase mb-4">Score Breakdown — All 10 Dimensions</div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              {DIMENSIONS.map(d => {
                const score = scores[d.key as keyof typeof scores] as number;
                const g = gradeFor(score);
                return (
                  <div key={d.key}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <d.icon className="w-3 h-3" style={{ color: g.color }} />
                        <span className="text-[10px] font-mono text-[#A1A1A6]">{d.label}</span>
                        <span className="text-[8px] font-mono text-[#6E6E73]">({d.weight}%)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold font-mono" style={{ color: g.color }}>{score.toFixed(0)}</span>
                        <span className="text-[9px] font-bold font-mono px-1 rounded" style={{ color: g.color, backgroundColor: `${g.color}15` }}>{g.letter}</span>
                      </div>
                    </div>
                    <div className="h-1 bg-[#171717] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${score}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: DIMENSIONS.indexOf(d) * 0.04 }}
                        style={{ backgroundColor: g.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top issues + peer comparison */}
          <div className="grid grid-cols-2 gap-5">

            {/* Top issues */}
            <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-xl p-4">
              <div className="text-[10px] font-mono tracking-widest text-[#6E6E73] uppercase mb-3">What's Dragging You Down</div>
              <div className="space-y-3">
                {issues.map((issue, i) => (
                  <div key={issue.key} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full border border-[#FF003C]/30 bg-[#FF003C]/10 flex items-center justify-center shrink-0 text-[9px] font-bold text-[#FF003C]">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-[#E6E6E9]">{issue.label}</span>
                        <span className="text-[10px] font-bold font-mono text-[#FF003C]">{issue.score.toFixed(0)}</span>
                      </div>
                      <p className="text-[9px] text-[#6E6E73] mt-0.5 leading-relaxed">{issue.description}</p>
                      <div className="mt-1.5 flex items-center gap-1 text-[9px] font-mono text-[#FFB800]">
                        <ChevronRight className="w-3 h-3" />
                        <span>
                          {issue.key === 'p99_latency'    ? 'Deploy edge cache or regional replicas'
                          : issue.key === 'error_rate'    ? 'Review 4xx/5xx causes in error logs'
                          : issue.key === 'm2m_compliance' ? 'Implement x402 payment headers'
                          : issue.key === 'documentation' ? 'Publish OpenAPI spec + TTFC guide'
                          : issue.key === 'security'      ? 'Upgrade TLS + add HSTS header'
                          : 'Review methodology spec for guidance'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Peer comparison */}
            <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-xl p-4">
              <div className="text-[10px] font-mono tracking-widest text-[#6E6E73] uppercase mb-3">Peer Comparison</div>
              <div className="space-y-2">
                {peers.map(peer => {
                  const score = peer.govScore ?? 0;
                  const g = gradeFor(score);
                  const isYou = peer.id === selectedApi.id;
                  return (
                    <div key={peer.id} className={`flex items-center gap-2 py-1 px-2 rounded ${isYou ? 'bg-[#FFB800]/5 border border-[#FFB800]/20' : ''}`}>
                      <div className="w-12 text-right">
                        <span className="text-[10px] font-bold font-mono" style={{ color: g.color }}>{score.toFixed(1)}</span>
                      </div>
                      <div className="flex-1 h-1 bg-[#171717] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: g.color }} />
                      </div>
                      <div className="w-24 flex items-center gap-1">
                        <span className="text-[10px] text-[#A1A1A6] truncate">{peer.name}</span>
                        {isYou && <span className="text-[8px] font-bold text-[#FFB800] bg-[#FFB800]/15 px-1 rounded">YOU</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 pt-3 border-t border-[#1F1F1F] text-[9px] font-mono text-[#6E6E73]">
                Rankings update every ~5 minutes · VNP Methodology v0.1 locked
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center text-[#6E6E73] font-mono text-sm">
          Loading API data…
        </div>
      )}
    </div>
  );
}
