"use client";

import React, { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import {
  ArrowLeft,
  Shield,
  Activity,
  Globe,
  Lock,
  ExternalLink,
  AlertTriangle,
  Cpu,
} from "lucide-react";
import { fetcher } from "@/lib/api";

import type { BenchmarkApiEntry } from "@/lib/vnp/types";
import { computeVNPScore } from "@/lib/vnp/scoring";
import { gradeForScore, VNP_DIMENSIONS } from "@/lib/vnp/constants";
import {
  DimensionRadar,
  GradeBadge,
  ConfidenceBadge,
  RegionalBreakdown,
  DimensionBreakdown,
  ProvenanceChain,
} from "@/components/vnp";

export default function ApiDetailPage() {
  const params = useParams();
  const router = useRouter();
  const apiId = params.apiId as string;

  const { data: lbData, isLoading } = useSWR<BenchmarkApiEntry[]>(
    "/api/v1/benchmarks/leaderboard",
    fetcher,
    { refreshInterval: 10000 }
  );

  const apiEntry = useMemo(() => {
    const list = Array.isArray(lbData) ? lbData : [];
    return list.find((a) => a.id === apiId);
  }, [lbData, apiId]);

  const vnpScore = useMemo(() => {
    if (!apiEntry) return null;
    return computeVNPScore(apiEntry);
  }, [apiEntry]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center font-mono">
        <Cpu className="w-10 h-10 text-[#FFB800] animate-pulse mb-4" />
        <div className="text-[#FFB800] tracking-widest text-sm">LOADING SCORE REPORT...</div>
      </div>
    );
  }

  if (!apiEntry || !vnpScore) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center font-mono">
        <AlertTriangle className="w-10 h-10 text-[#FF5C6C] mb-4" />
        <div className="text-[#FF5C6C] tracking-widest text-sm mb-4">API NOT FOUND</div>
        <button
          onClick={() => router.push("/benchmarks")}
          className="flex items-center gap-2 text-[#FFB800] text-sm hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Leaderboard
        </button>
      </div>
    );
  }

  const band = gradeForScore(vnpScore.composite);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans">
      {/* Hero header */}
      <header className="px-8 py-8 border-b border-[#1A1A1A] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#FFB800]/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative z-10">
          {/* Back link */}
          <button
            onClick={() => router.push("/benchmarks")}
            className="flex items-center gap-1.5 text-[#A1A1A6] text-xs hover:text-[#FFB800] transition-colors mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="font-mono uppercase tracking-widest">Back to Leaderboard</span>
          </button>

          <div className="flex justify-between items-start gap-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2 py-0.5 rounded bg-[#FFB800]/10 border border-[#FFB800]/20 text-[#FFB800] font-mono text-[10px] font-bold tracking-widest uppercase">
                  VNP Score Report
                </span>
                <span
                  className="px-2 py-0.5 rounded border text-[10px] font-mono font-bold uppercase tracking-widest"
                  style={{
                    color: vnpScore.status === "active" ? "#3EE7A2" : "#FF9F43",
                    borderColor: vnpScore.status === "active" ? "rgba(62,231,162,0.3)" : "rgba(255,159,67,0.3)",
                    backgroundColor: vnpScore.status === "active" ? "rgba(62,231,162,0.1)" : "rgba(255,159,67,0.1)",
                  }}
                >
                  {vnpScore.status}
                </span>
              </div>
              <h1 className="text-4xl font-semibold tracking-tight mb-2">
                {vnpScore.apiName}
              </h1>
              <div className="text-[#A1A1A6] font-mono text-sm">
                {vnpScore.provider} &middot; {vnpScore.category}
              </div>
              {apiEntry.endpointUrl && (
                <a
                  href={apiEntry.endpointUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[#FFB800]/70 text-xs mt-2 hover:text-[#FFB800] transition-colors"
                >
                  {apiEntry.endpointUrl}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}

              <div className="mt-4">
                <ConfidenceBadge confidence={vnpScore.confidence} showDetail />
              </div>
            </div>

            <GradeBadge grade={vnpScore.grade} composite={vnpScore.composite} size="lg" />
          </div>
        </div>
      </header>

      <main className="p-8 space-y-8">
        {/* 10-Dimension Analysis */}
        <section>
          <SectionHeader icon={Activity} label="Dimensional Analysis" subtitle="10-dimension VNP scoring breakdown" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <DimensionBreakdown dimensions={vnpScore.dimensions} />
            </div>
            <div className="bg-[#0D0D0D] border border-[#242424] rounded-xl p-5">
              <DimensionRadar
                dimensions={vnpScore.dimensions}
                height={280}
                accentColor={band.color}
                showLabels
              />
              <div className="mt-4 text-center">
                <div className="text-[10px] font-mono text-[#6E6E73] uppercase tracking-widest">
                  Composite Score
                </div>
                <div className="text-3xl font-light tabular-nums mt-1" style={{ color: band.color }}>
                  {vnpScore.composite.toFixed(1)}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Regional Breakdown */}
        <section>
          <SectionHeader icon={Globe} label="Regional Performance" subtitle="Geographic latency and availability across 5 VNP regions" />
          <RegionalBreakdown regions={vnpScore.regions} />
        </section>

        {/* Badge embed */}
        <section>
          <SectionHeader icon={Shield} label="Score Badge" subtitle="Embeddable badge for your API documentation" />
          <div className="bg-[#0D0D0D] border border-[#242424] rounded-xl p-6 space-y-4">
            {/* SVG badge preview */}
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/[0.03] rounded-lg border border-[#1A1A1A]">
                <svg width="180" height="32" viewBox="0 0 180 32" xmlns="http://www.w3.org/2000/svg">
                  <rect width="80" height="32" rx="4" fill="#1A1A1A" />
                  <rect x="80" y="0" width="100" height="32" rx="4" fill={band.bgColor} stroke={band.borderColor} strokeWidth="1" />
                  <rect x="76" y="0" width="8" height="32" fill={band.bgColor} />
                  <text x="40" y="20" fill="#A1A1A6" textAnchor="middle" fontSize="11" fontFamily="monospace">VNP Score</text>
                  <text x="130" y="20" fill={band.color} textAnchor="middle" fontSize="12" fontFamily="monospace" fontWeight="bold">
                    {vnpScore.grade} {vnpScore.composite.toFixed(1)}
                  </text>
                </svg>
              </div>
              <div className="text-[10px] text-[#6E6E73]">
                <p>Embed this badge in your API documentation or repository README.</p>
              </div>
            </div>

            {/* Embed URLs */}
            <div className="space-y-2">
              <CodeBlock
                label="Badge URL"
                code={`${typeof window !== "undefined" ? window.location.origin : ""}/api/vnp/badge/${vnpScore.apiId}`}
              />
              <CodeBlock
                label="Markdown"
                code={`[![VNP Score](${typeof window !== "undefined" ? window.location.origin : ""}/api/vnp/badge/${vnpScore.apiId})](${typeof window !== "undefined" ? window.location.origin : ""}/benchmarks/${vnpScore.apiId})`}
              />
              <CodeBlock
                label="OpenAPI Extension"
                code={`x-vnp-score: ${vnpScore.composite.toFixed(1)}\nx-vnp-grade: ${vnpScore.grade}\nx-vnp-last-measured: ${vnpScore.lastMeasured}`}
              />
            </div>
          </div>
        </section>

        {/* Provenance */}
        <section>
          <SectionHeader icon={Lock} label="Cryptographic Provenance" subtitle="Measurement proof chain anchored on Base L2" />
          <ProvenanceChain provenance={vnpScore.provenance} />
        </section>
      </main>
    </div>
  );
}

function SectionHeader({ icon: Icon, label, subtitle }: { icon: React.ElementType; label: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 rounded-lg bg-[#FFB800]/10">
        <Icon className="w-4 h-4 text-[#FFB800]" />
      </div>
      <div>
        <h2 className="text-sm font-semibold text-white">{label}</h2>
        <p className="text-[11px] text-[#6E6E73]">{subtitle}</p>
      </div>
    </div>
  );
}

function CodeBlock({ label, code }: { label: string; code: string }) {
  return (
    <div className="bg-[#111111] border border-[#1A1A1A] rounded-lg p-3">
      <div className="text-[9px] font-mono text-[#6E6E73] uppercase tracking-widest mb-1.5">{label}</div>
      <code className="text-[11px] font-mono text-[#A1A1A6] break-all select-all">{code}</code>
    </div>
  );
}
