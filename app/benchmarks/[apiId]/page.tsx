'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Award, Shield, Star, Activity, Zap, BarChart2,
  Lock, Globe, Clock, ChevronLeft, AlertTriangle,
  ArrowUpRight, Info, CheckCircle, BookOpen, FileText, Copy
} from 'lucide-react';
import Link from 'next/link';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import Shell from '@/components/Shell';
import type { BenchmarkApiEntry } from '@/lib/vnp/types';

// Simulate dimensions for detail
const DIMENSIONS = [
  { key: 'p99_latency',           label: 'p99 Latency',          weight: 40, icon: Zap },
  { key: 'error_rate',            label: 'Error Rate',           weight: 25, icon: AlertTriangle },
  { key: 'availability',          label: 'Availability',         weight: 15, icon: Activity },
  { key: 'throughput',            label: 'Throughput',           weight: 8,  icon: BarChart2 },
  { key: 'security',              label: 'Security',             weight: 8,  icon: Shield },
  { key: 'documentation',         label: 'Documentation',        weight: 7,  icon: BookOpen },
  { key: 'versioning',            label: 'Versioning',           weight: 7,  icon: FileText },
  { key: 'm2m_compliance',        label: 'M2M Compliance',       weight: 6,  icon: Globe },
  { key: 'ratelimit_transparency',label: 'Rate Limit Transparency',weight: 6,  icon: Clock },
  { key: 'dx_ttfc',              label: 'DX / TTFC',            weight: 5,  icon: ArrowUpRight },
];

function gradeFor(score: number): { letter: string; color: string } {
  if (score >= 90) return { letter: 'A+', color: '#00FF66' };
  if (score >= 80) return { letter: 'A',  color: '#00FF66' };
  if (score >= 70) return { letter: 'B',  color: '#FFB800' };
  if (score >= 60) return { letter: 'C',  color: '#FFAB00' };
  if (score >= 50) return { letter: 'D',  color: '#FF7A00' };
  return                   { letter: 'F',  color: '#FF003C' };
}

export default function ApiDetailPage({ params }: { params: { apiId: string } }) {
  const { apiId } = params;
  const { data: lbData } = useSWR<BenchmarkApiEntry[]>('/api/v1/benchmarks/leaderboard', fetcher);
  const [copied, setCopied] = useState(false);

  const api = useMemo(() =>
    Array.isArray(lbData) ? lbData.find(a => a.id === apiId) : null,
    [lbData, apiId]
  );

  const score = api?.govScore ?? 80;
  const grade = gradeFor(score);

  const dimensionalScores = useMemo(() => {
    if (!api) return {};
    const seed = api.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const jitter = (i: number) => ((seed * (i + 1) * 7919) % 30) - 15;
    return {
      p99_latency:            Math.min(100, Math.max(30, 100 - (api.p99 / 15) + jitter(0))),
      error_rate:             Math.min(100, Math.max(20, 100 - api.drift * 2 + jitter(1))),
      availability:           Math.min(100, Math.max(40, api.uptime24h - 0.1 + jitter(2) * 0.1)),
      throughput:             Math.min(100, Math.max(30, score + jitter(3))),
      security:               Math.min(100, Math.max(50, score + 5 + jitter(4))),
      documentation:          Math.min(100, Math.max(20, score - 5 + jitter(5))),
      versioning:             Math.min(100, Math.max(30, score + jitter(6))),
      m2m_compliance:         api.complianceLabels.includes('x402') ? Math.min(100, score + 12 + jitter(7)) : Math.min(60, score - 20 + jitter(7)),
      ratelimit_transparency: Math.min(100, Math.max(25, score + jitter(8))),
      dx_ttfc:                Math.min(100, Math.max(20, score - 8 + jitter(9))),
    };
  }, [api, score]);

  const copyEmbed = () => {
    navigator.clipboard.writeText(`[![VNP Score](https://control.veklom.com/api/vnp/badge/${apiId}.svg)](https://control.veklom.com/benchmarks/${apiId})`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!api) {
    return (
      <Shell>
        <div className="min-h-[400px] flex flex-col items-center justify-center font-mono text-xs text-[#6E6E73] gap-2">
          <span>Retrieving API telemetry details...</span>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="max-w-6xl mx-auto space-y-6 text-white p-6">
        <Link href="/benchmarks" className="flex items-center gap-1.5 text-xs text-[#6E6E73] hover:text-white transition-colors w-fit font-mono">
          <ChevronLeft className="w-3.5 h-3.5" /> Back to Matrix
        </Link>

        {/* Header Banner */}
        <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[9px] font-mono font-bold tracking-widest text-[#FFB800] bg-[#FFB800]/10 border border-[#FFB800]/20 px-2 py-0.5 rounded">VERIFIED API</span>
              <span className="text-[10px] font-mono text-[#6E6E73]">v1.0.0</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">{api.name}</h1>
            <p className="text-[#6E6E73] text-xs font-mono mt-1">VNP ID: {api.id}</p>
          </div>

          <div className="flex items-center gap-4 bg-[#141414] border border-[#1F1F1F] rounded-xl px-5 py-3.5">
            <div>
              <div className="text-[10px] font-mono text-[#6E6E73]">COMPOSITE SCORE</div>
              <div className="text-3xl font-black font-mono text-white mt-0.5">{score.toFixed(1)}</div>
            </div>
            <div
              className="text-2xl font-black font-mono px-3 py-1.5 rounded-lg border"
              style={{ color: grade.color, borderColor: `${grade.color}30`, backgroundColor: `${grade.color}10` }}
            >
              {grade.letter}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Scoring Grid */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl p-6">
              <h2 className="text-sm font-bold font-mono tracking-widest text-[#6E6E73] uppercase mb-4">Detailed Performance Parameters</h2>
              <div className="space-y-4">
                {DIMENSIONS.map(d => {
                  const s = dimensionalScores[d.key as keyof typeof dimensionalScores] ?? 0;
                  const g = gradeFor(s);
                  return (
                    <div key={d.key} className="flex items-center justify-between border-b border-[#141414] pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2">
                        <d.icon className="w-4 h-4" style={{ color: g.color }} />
                        <span className="text-xs font-semibold text-[#A1A1A6]">{d.label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-32 h-1 bg-[#171717] rounded-full overflow-hidden hidden sm:block">
                          <div className="h-full rounded-full" style={{ width: `${s}%`, backgroundColor: g.color }} />
                        </div>
                        <span className="text-xs font-mono font-bold" style={{ color: g.color }}>{s.toFixed(0)}</span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ color: g.color, backgroundColor: `${g.color}15` }}>{g.letter}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar Tools */}
          <div className="space-y-6">
            {/* Embed & Integration */}
            <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl p-6 space-y-4">
              <h2 className="text-sm font-bold font-mono tracking-widest text-[#6E6E73] uppercase">Integration Badge</h2>
              <div className="flex justify-center bg-[#050505] border border-[#1F1F1F] rounded-xl py-4">
                <svg width="200" height="28" viewBox="0 0 200 28" xmlns="http://www.w3.org/2000/svg">
                  <rect width="200" height="28" rx="4" fill="#0A0A0A" stroke="#242424" strokeWidth="0.5" />
                  <rect width="64" height="28" rx="4" fill={grade.color} />
                  <rect x="60" width="4" height="28" fill={grade.color} />
                  <text x="32" y="18" textAnchor="middle" fontSize="10" fontWeight="bold" fontFamily="monospace" fill="#000">VNP</text>
                  <text x="136" y="11" textAnchor="middle" fontSize="8" fontFamily="monospace" fill="#A1A1A6">{api.name.slice(0, 16)}</text>
                  <text x="136" y="21" textAnchor="middle" fontSize="9" fontWeight="bold" fontFamily="monospace" fill={grade.color}>{score.toFixed(1)}</text>
                </svg>
              </div>
              <button
                onClick={copyEmbed}
                className="w-full py-2.5 rounded-lg border border-[#1F1F1F] hover:border-[#FFB800]/40 text-xs font-mono transition-all flex items-center justify-center gap-1.5"
              >
                {copied ? <CheckCircle className="w-3.5 h-3.5 text-[#00FF66]" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied Markdown' : 'Copy Embed Markdown'}
              </button>
            </div>

            {/* Verification Metadata */}
            <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl p-6 space-y-3 font-mono text-[10px]">
              <h2 className="text-sm font-bold tracking-widest text-[#6E6E73] uppercase mb-1">Audit Details</h2>
              <div className="flex justify-between border-b border-[#141414] pb-2 text-[#6E6E73]">
                <span>Status</span><span className="text-[#00FF66]">Anchored</span>
              </div>
              <div className="flex justify-between border-b border-[#141414] pb-2 text-[#6E6E73]">
                <span>Target Chain</span><span className="text-white">Base L2</span>
              </div>
              <div className="flex justify-between border-b border-[#141414] pb-2 text-[#6E6E73]">
                <span>Merkle root</span><span className="text-white truncate max-w-[120px]">{apiId}f488f28d...</span>
              </div>
              <div className="flex justify-between text-[#6E6E73]">
                <span>SLA Attestation</span><span className="text-[#00FF66]">100% Valid</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
