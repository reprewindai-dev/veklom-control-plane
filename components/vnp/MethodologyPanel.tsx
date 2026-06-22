"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Scale,
  Shield,
  Globe,
  Database,
  Fingerprint,
  AlertTriangle,
  FileText,
  Lock,
  Activity,
  Users,
  Gavel,
  Server,
  Eye,
  Coins,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { VNP_DIMENSIONS, VNP_REGIONS, VNP_GRADE_BANDS, CONFIDENCE_THRESHOLDS, NORMALIZATION } from "@/lib/vnp/constants";
import type { VNPDimensionId } from "@/lib/vnp/types";

export default function MethodologyPanel() {
  const [expandedSection, setExpandedSection] = useState<string | null>("dimensions");

  const toggle = (id: string) =>
    setExpandedSection((prev) => (prev === id ? null : id));

  return (
    <div className="max-w-5xl space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-lg bg-[#FFB800]/10">
          <BookOpen className="w-5 h-5 text-[#FFB800]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">VNP Methodology v0.1</h2>
          <p className="text-[11px] text-[#6E6E73]">
            Locked specification — open, community-governed, real-time API benchmark scoring for machine-consumable trust
          </p>
        </div>
        <span className="ml-auto px-2 py-0.5 rounded border text-[9px] font-mono font-bold uppercase tracking-widest bg-[#FFB800]/10 text-[#FFB800] border-[#FFB800]/30">
          v0.1.0 LOCKED
        </span>
      </div>

      {/* Canonical Document Stack */}
      <div className="p-4 rounded-xl border border-[#FFB800]/20 bg-[#FFB800]/[0.03] mb-4">
        <div className="text-[10px] font-mono uppercase tracking-widest text-[#FFB800] mb-2">Normative Document Stack</div>
        <div className="grid grid-cols-3 gap-3">
          <DocRef title="Methodology Specification v0.1" status="LOCKED" desc="Dimensions, weights, formulas, anti-gaming" />
          <DocRef title="Governance Charter v1.0" status="OPEN COMMENT" desc="BGB/TSC model, WGs, elections, disputes" />
          <DocRef title="WABCG Charter" status="PUBLISHED" desc="W3C Community Group interim governance" />
        </div>
        <div className="text-[9px] text-[#FFB800]/60 mt-2 font-mono">
          Rule: If there is ever a mismatch between these docs, the normative specification wins.
        </div>
      </div>

      {/* Product Principles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Open Methodology", desc: "Published weights, formulas, thresholds", icon: BookOpen },
          { label: "Reproducible", desc: "Any party can verify from raw data", icon: Scale },
          { label: "Tail-Latency First", desc: "p99 weighted highest — outliers break agents", icon: Activity },
          { label: "Anti-Gaming", desc: "Randomized timing, rotating identities, spot checks", icon: Shield },
        ].map((p) => (
          <div key={p.label} className="p-3 rounded-lg border border-[#242424] bg-[#0D0D0D]">
            <p.icon className="w-4 h-4 text-[#FFB800] mb-2" />
            <div className="text-[11px] font-semibold text-white">{p.label}</div>
            <div className="text-[10px] text-[#6E6E73] mt-0.5">{p.desc}</div>
          </div>
        ))}
      </div>

      {/* 1. DIMENSIONS */}
      <Section
        id="dimensions"
        label="10-Dimension Scoring Model"
        icon={Scale}
        expanded={expandedSection === "dimensions"}
        onToggle={() => toggle("dimensions")}
      >
        <div className="space-y-2">
          <p className="text-[11px] text-[#A1A1A6] mb-3">
            Each API is measured across 10 dimensions with asymmetric weights summing to 1.0.
            Direction-aware normalization maps raw measurements to 0–100 scores.
            The weighting is intentionally asymmetric: p99 latency highest because outliers break agent pipelines,
            error/correctness next because fast-but-wrong is unusable.
          </p>
          <div className="space-y-1.5">
            {VNP_DIMENSIONS.map((dim) => {
              const norm = NORMALIZATION[dim.id as VNPDimensionId];
              return (
                <div key={dim.id} className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg border border-[#1A1A1A] bg-[#0A0A0A] hover:border-[#333] transition-colors">
                  <div className="col-span-4">
                    <div className="text-[11px] text-white font-medium">{dim.label}</div>
                    <div className="text-[9px] text-[#6E6E73]">{dim.description}</div>
                  </div>
                  <div className="col-span-2 text-center">
                    <div className="text-[10px] font-mono text-[#FFB800] font-bold">
                      {(dim.weight * 100).toFixed(0)}%
                    </div>
                    <div className="text-[8px] text-[#6E6E73]">weight</div>
                  </div>
                  <div className="col-span-2 text-center">
                    <div className="text-[10px] font-mono text-[#A1A1A6]">
                      {dim.direction === "lower" ? "↓ lower better" : "↑ higher better"}
                    </div>
                  </div>
                  <div className="col-span-2 text-center">
                    <div className="text-[10px] font-mono text-[#3EE7A2]">
                      {dim.direction === "lower" ? `≤${norm.ideal}${dim.unit}` : `≥${norm.ideal}${dim.unit}`}
                    </div>
                    <div className="text-[8px] text-[#6E6E73]">ideal</div>
                  </div>
                  <div className="col-span-2 text-center">
                    <div className="text-[10px] font-mono text-[#FF5C6C]">
                      {dim.direction === "lower" ? `≥${norm.poor}${dim.unit}` : `≤${norm.poor}${dim.unit}`}
                    </div>
                    <div className="text-[8px] text-[#6E6E73]">poor</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 p-3 rounded-lg border border-[#1A1A1A] bg-[#0A0A0A] font-mono text-[10px]">
            <div className="text-[#6E6E73] mb-1">{"// Composite Score Formula"}</div>
            <div className="text-[#A1A1A6]">
              {"VNP_Score = Σ(weight_i × normalized_score_i) for i ∈ [1..10]"}
            </div>
            <div className="text-[#6E6E73] mt-1">
              {"// Rounded to 1 decimal place. Weight sum validated at runtime: 1.000"}
            </div>
          </div>
        </div>
      </Section>

      {/* 2. GRADE BANDS */}
      <Section
        id="grading"
        label="Grade Bands (AAA → D)"
        icon={Shield}
        expanded={expandedSection === "grading"}
        onToggle={() => toggle("grading")}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-5 gap-2">
            {VNP_GRADE_BANDS.map((band) => (
              <div
                key={band.grade}
                className="p-3 rounded-lg border text-center"
                style={{
                  borderColor: band.borderColor,
                  backgroundColor: band.bgColor,
                }}
              >
                <div className="text-lg font-mono font-bold" style={{ color: band.color }}>
                  {band.grade}
                </div>
                <div className="text-[10px] font-mono text-[#A1A1A6]">
                  ≥ {band.min}
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 rounded-lg border border-[#1A1A1A] bg-[#0A0A0A] text-[10px]">
            <div className="text-[#A1A1A6]">90–100: World-class. Optimized for production and autonomous agents.</div>
            <div className="text-[#A1A1A6]">80–89: Solid, production-ready. Minor issues in niche scenarios.</div>
            <div className="text-[#A1A1A6]">70–79: Functional. Latency or reliability concerns for non-critical loads.</div>
            <div className="text-[#A1A1A6]">60–69: Developing. Multiple areas for improvement.</div>
            <div className="text-[#6E6E73]">{"<60: Not recommended for production without risk assessment."}</div>
          </div>
        </div>
      </Section>

      {/* 3. CONFIDENCE */}
      <Section
        id="confidence"
        label="Confidence Intervals"
        icon={Activity}
        expanded={expandedSection === "confidence"}
        onToggle={() => toggle("confidence")}
      >
        <div className="space-y-3">
          <p className="text-[11px] text-[#A1A1A6]">
            95% confidence intervals computed using 1.96 × σ / √n on the composite score distribution.
            Scores with insufficient sample counts are marked PROVISIONAL until enough measurements are collected.
          </p>
          <div className="grid grid-cols-4 gap-3">
            {[
              { level: "HIGH", min: CONFIDENCE_THRESHOLDS.high, color: "#3EE7A2" },
              { level: "MEDIUM", min: CONFIDENCE_THRESHOLDS.medium, color: "#FFB800" },
              { level: "LOW", min: CONFIDENCE_THRESHOLDS.low, color: "#FF9F43" },
              { level: "PROVISIONAL", min: 0, color: "#FF5C6C" },
            ].map((t) => (
              <div key={t.level} className="p-3 rounded-lg border border-[#242424] bg-[#0A0A0A]">
                <span className="text-[10px] font-mono font-bold tracking-widest" style={{ color: t.color }}>
                  {t.level}
                </span>
                <div className="text-[10px] text-[#6E6E73] mt-1">
                  ≥ {t.min} measurements
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 rounded-lg border border-[#1A1A1A] bg-[#0A0A0A] font-mono text-[10px] text-[#6E6E73]">
            {"confidence_width = 5.0 / √(measurement_count)"}
            <br />
            {"E.g. 100 measurements → CI = ±0.5 on composite score"}
          </div>
        </div>
      </Section>

      {/* 4. REGIONS */}
      <Section
        id="regions"
        label="5-Region Measurement Network"
        icon={Globe}
        expanded={expandedSection === "regions"}
        onToggle={() => toggle("regions")}
      >
        <div className="space-y-2">
          <p className="text-[11px] text-[#A1A1A6] mb-3">
            Geographic normalization subtracts baseline RTT to isolate API-layer performance from network distance.
            Regional scores are published separately — not hidden in a single global number.
          </p>
          {VNP_REGIONS.map((r) => (
            <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg border border-[#1A1A1A] bg-[#0A0A0A]">
              <Globe className="w-4 h-4 text-[#37C9EC] shrink-0" />
              <div className="flex-1">
                <div className="text-[11px] text-white font-medium">{r.label}</div>
                <div className="text-[10px] font-mono text-[#6E6E73]">{r.id}</div>
              </div>
              <div className="text-right">
                <div className="text-[11px] font-mono text-[#A1A1A6]">
                  {r.baselineRttMs}ms baseline
                </div>
              </div>
            </div>
          ))}
          <div className="p-3 rounded-lg border border-[#1A1A1A] bg-[#0A0A0A] text-[10px] text-[#6E6E73]">
            <div className="font-medium text-[#A1A1A6] mb-1">Node Operator Model</div>
            <div>• At least 3 independent node operators</div>
            <div>• No single operator controls {">"} 40% of capacity</div>
            <div>• Mixed providers: AWS, Azure, GCP, Hetzner, bare-metal</div>
            <div>• Stateless containerized k6 agents (Docker)</div>
          </div>
        </div>
      </Section>

      {/* 5. MEASUREMENT INFRASTRUCTURE */}
      <Section
        id="infrastructure"
        label="Measurement Infrastructure (k6 + eBPF)"
        icon={Server}
        expanded={expandedSection === "infrastructure"}
        onToggle={() => toggle("infrastructure")}
      >
        <div className="space-y-3">
          <p className="text-[11px] text-[#A1A1A6]">
            Grafana k6 is the primary open-source measurement engine. eBPF-derived replay traces
            make traffic more representative and harder to fingerprint.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border border-[#1A1A1A] bg-[#0A0A0A]">
              <div className="text-[11px] font-semibold text-[#FFB800] mb-1">Measurement Agent</div>
              <div className="text-[10px] text-[#6E6E73] space-y-0.5">
                <div>• k6 core with per-API scripts from OpenAPI 3.1</div>
                <div>• Docker image: veklom/vnp-agent:0.1.x</div>
                <div>• Signed JSON measurement records</div>
                <div>• Apache 2.0 licensed, publicly hosted</div>
              </div>
            </div>
            <div className="p-3 rounded-lg border border-[#1A1A1A] bg-[#0A0A0A]">
              <div className="text-[11px] font-semibold text-[#37C9EC] mb-1">Test Scenarios</div>
              <div className="text-[10px] text-[#6E6E73] space-y-0.5">
                <div>• Basic CRUD operations (GET, POST, PUT, DELETE)</div>
                <div>• Error scenarios (invalid input, auth failure)</div>
                <div>• Progressive load test (RPS ramp-up)</div>
                <div>• Stability test (1,000+ consecutive requests)</div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg border border-[#1A1A1A] bg-[#0A0A0A]">
              <div className="text-[10px] font-semibold text-[#A1A1A6] mb-1">Frequency</div>
              <div className="text-[10px] text-[#6E6E73]">Hourly (rolling 100-measurement window)</div>
              <div className="text-[10px] text-[#6E6E73]">30-day canonical score</div>
            </div>
            <div className="p-3 rounded-lg border border-[#1A1A1A] bg-[#0A0A0A]">
              <div className="text-[10px] font-semibold text-[#A1A1A6] mb-1">Storage</div>
              <div className="text-[10px] text-[#6E6E73]">ClickHouse raw store</div>
              <div className="text-[10px] text-[#6E6E73]">IPFS/Arweave weekly archive</div>
            </div>
            <div className="p-3 rounded-lg border border-[#1A1A1A] bg-[#0A0A0A]">
              <div className="text-[10px] font-semibold text-[#A1A1A6] mb-1">Protocol</div>
              <div className="text-[10px] text-[#6E6E73]">REST (OpenAPI 3.1) in v0.1</div>
              <div className="text-[10px] text-[#6E6E73]">gRPC, AsyncAPI in v0.2</div>
            </div>
          </div>
        </div>
      </Section>

      {/* 6. ANTI-GAMING */}
      <Section
        id="antigaming"
        label="Anti-Gaming Controls (5 Controls)"
        icon={Eye}
        expanded={expandedSection === "antigaming"}
        onToggle={() => toggle("antigaming")}
      >
        <div className="space-y-2">
          <p className="text-[11px] text-[#A1A1A6] mb-2">
            Operationally expensive to distinguish probes from real traffic. Five layers of integrity control.
          </p>
          {[
            { num: "1", title: "Randomized Measurement Timing", desc: "Poisson jitter ±15 minutes from expected interval. No fixed cron schedule. Providers cannot pre-warm caches at exact times." },
            { num: "2", title: "Rotating Node Identities", desc: "IP rotation daily (cloud + residential proxy). Randomized User-Agent, TLS cipher suites, and HTTP versions per request." },
            { num: "3", title: "Traffic Replay (eBPF-based)", desc: "Keploy-style eBPF capture generates realistic payloads and header patterns. Tests indistinguishable from real user traffic." },
            { num: "4", title: "Statistical Outlier Detection", desc: "Measurements >3σ from peer-group median are flagged. Consistently divergent nodes audited or removed." },
            { num: "5", title: "Spot Checks (Random Audits)", desc: "5% of measurements independently re-run by a different node operator. Results must match within 10% or flagged for dispute." },
          ].map((c) => (
            <div key={c.num} className="flex items-start gap-3 p-3 rounded-lg border border-[#1A1A1A] bg-[#0A0A0A]">
              <div className="w-6 h-6 rounded-full bg-[#FF5C6C]/10 border border-[#FF5C6C]/30 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-mono font-bold text-[#FF5C6C]">{c.num}</span>
              </div>
              <div>
                <div className="text-[11px] text-white font-medium">{c.title}</div>
                <div className="text-[10px] text-[#6E6E73] mt-0.5">{c.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* 7. PROVENANCE */}
      <Section
        id="provenance"
        label="Cryptographic Provenance (W3C PROV-aligned)"
        icon={Lock}
        expanded={expandedSection === "provenance"}
        onToggle={() => toggle("provenance")}
      >
        <div className="space-y-3">
          <p className="text-[11px] text-[#A1A1A6]">
            Inspired by W3C PROV model for provenance. Each measurement is a provenance-bearing object with
            enough metadata to reconstruct how it was produced. Hourly Merkle roots anchored on Base L2.
          </p>
          <div className="space-y-2">
            {[
              { step: "1", label: "Measurement Collection", desc: "k6 agents emit signed records from 5 regions with randomized timing" },
              { step: "2", label: "Validation Pipeline", desc: "Node signature verification, schema validation, outlier detection (3σ)" },
              { step: "3", label: "Merkle Construction", desc: "SHA-256 tree from all valid measurements in the scoring window" },
              { step: "4", label: "Score Computation", desc: "10-dimension normalization, weighting, confidence intervals" },
              { step: "5", label: "Chain Anchoring", desc: "Merkle root + score hash → Base L2 (EIP-155:8453). Raw data → IPFS/Arweave weekly" },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-3 p-3 rounded-lg border border-[#1A1A1A] bg-[#0A0A0A]">
                <div className="w-6 h-6 rounded-full bg-[#FFB800]/10 border border-[#FFB800]/30 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-mono font-bold text-[#FFB800]">{s.step}</span>
                </div>
                <div>
                  <div className="text-[11px] text-white font-medium">{s.label}</div>
                  <div className="text-[10px] text-[#6E6E73]">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 rounded-lg border border-[#1A1A1A] bg-[#0A0A0A] font-mono text-[10px]">
            <div className="text-[#6E6E73] mb-1">{"// Per-measurement record fields"}</div>
            <div className="text-[#A1A1A6] space-y-0.5">
              <div>{"api_id, measurement_id, timestamp, region, node_operator"}</div>
              <div>{"p50/p95/p99/p99.9, error_rate, validation_failure_rate"}</div>
              <div>{"peak_rps, tls_version, ratelimit_headers_present"}</div>
              <div>{"harness_version, script_hash, duration, total_requests"}</div>
              <div>{"node_signature, merkle_root, chain_anchor{tx, block}"}</div>
            </div>
          </div>
        </div>
      </Section>

      {/* 8. OPENAPI EXTENSION */}
      <Section
        id="openapi"
        label="OpenAPI x-vnp-score Extension"
        icon={FileText}
        expanded={expandedSection === "openapi"}
        onToggle={() => toggle("openapi")}
      >
        <div className="space-y-3">
          <p className="text-[11px] text-[#A1A1A6]">
            API providers publish VNP metadata in their OpenAPI documents. Agents reading OpenAPI can see current VNP score
            before payment and before routing.
          </p>
          <div className="p-3 rounded-lg border border-[#1A1A1A] bg-[#0A0A0A] font-mono text-[11px]">
            <div className="text-[#6E6E73] mb-2">{"# OpenAPI 3.1 info-level placement"}</div>
            <div className="space-y-0.5">
              <div><span className="text-[#A1A1A6]">x-vnp-score:</span> <span className="text-[#3EE7A2]">87.4</span></div>
              <div><span className="text-[#A1A1A6]">x-vnp-last-measured:</span> <span className="text-[#FFC94D]">&quot;2026-06-22T14:30:00Z&quot;</span></div>
              <div><span className="text-[#A1A1A6]">x-vnp-score-uri:</span> <span className="text-[#37C9EC]">&quot;https://control.veklom.com/api/vnp/score/&lt;apiId&gt;&quot;</span></div>
              <div><span className="text-[#A1A1A6]">x-vnp-score-window:</span> <span className="text-[#FFC94D]">&quot;30d-rolling&quot;</span></div>
              <div><span className="text-[#A1A1A6]">x-vnp-x402-ready:</span> <span className="text-[#3EE7A2]">true</span></div>
              <div><span className="text-[#A1A1A6]">x-vnp-confidence-interval:</span></div>
              <div className="pl-4"><span className="text-[#A1A1A6]">lower:</span> <span className="text-[#3EE7A2]">86.2</span></div>
              <div className="pl-4"><span className="text-[#A1A1A6]">upper:</span> <span className="text-[#3EE7A2]">88.6</span></div>
              <div className="pl-4"><span className="text-[#A1A1A6]">level:</span> <span className="text-[#3EE7A2]">0.95</span></div>
            </div>
          </div>
          <div className="p-3 rounded-lg border border-[#1A1A1A] bg-[#0A0A0A] text-[10px]">
            <div className="text-[#A1A1A6] font-medium mb-1">x402 / MPP Integration</div>
            <div className="text-[#6E6E73]">
              Payment manifests include x-vnp-score field or score URI. Agent logic: &quot;only pay for APIs with vnp_score ≥ X&quot;.
              Aligns with Linux Foundation x402 Foundation and Stripe MPP.
            </div>
          </div>
        </div>
      </Section>

      {/* 9. BASE ANCHOR CONTRACT */}
      <Section
        id="anchoring"
        label="Base L2 Anchor Contract (IVNPAnchorRegistry)"
        icon={Database}
        expanded={expandedSection === "anchoring"}
        onToggle={() => toggle("anchoring")}
      >
        <div className="space-y-3">
          <p className="text-[11px] text-[#A1A1A6]">
            Minimal append-only registry on Base (EIP-155:8453). No score calculation on-chain — only Merkle root anchoring.
            Cost {"<"}$0.001 per anchor. Raw data stored off-chain in ClickHouse with weekly IPFS/Arweave archival.
          </p>
          <div className="p-3 rounded-lg border border-[#1A1A1A] bg-[#0A0A0A] font-mono text-[11px]">
            <div className="text-[#6E6E73] mb-2">{"// Solidity Interface"}</div>
            <div className="space-y-0.5">
              <div className="text-[#A78BFA]">function</div>
              <div className="pl-2 text-[#FFB800]">publishAnchor(</div>
              <div className="pl-4 text-[#A1A1A6]">uint256 windowStart,</div>
              <div className="pl-4 text-[#A1A1A6]">uint256 windowEnd,</div>
              <div className="pl-4 text-[#A1A1A6]">bytes32 merkleRoot,</div>
              <div className="pl-4 text-[#A1A1A6]">bytes32 metadataHash,</div>
              <div className="pl-4 text-[#A1A1A6]">bytes32 scoreHash</div>
              <div className="pl-2 text-[#FFB800]">{") → uint256 anchorId"}</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-[10px]">
            <div className="p-2 rounded border border-[#1A1A1A] bg-[#0A0A0A]">
              <div className="text-[#3EE7A2] font-mono font-bold">No Deletion</div>
              <div className="text-[#6E6E73]">Anchors are immutable</div>
            </div>
            <div className="p-2 rounded border border-[#1A1A1A] bg-[#0A0A0A]">
              <div className="text-[#3EE7A2] font-mono font-bold">Minimal Gas</div>
              <div className="text-[#6E6E73]">Append-only writes</div>
            </div>
            <div className="p-2 rounded border border-[#1A1A1A] bg-[#0A0A0A]">
              <div className="text-[#3EE7A2] font-mono font-bold">Public Reads</div>
              <div className="text-[#6E6E73]">Anyone can verify via BaseScan</div>
            </div>
          </div>
          <div className="p-3 rounded-lg border border-[#1A1A1A] bg-[#0A0A0A] text-[10px]">
            <div className="text-[#A1A1A6] font-medium mb-1">Data Retention</div>
            <div className="text-[#6E6E73]">Immediate: ClickHouse (fast, queryable) • Public archive: IPFS weekly, Arweave permanent • Retention: 2yr raw, indefinite aggregates</div>
          </div>
        </div>
      </Section>

      {/* 10. DISPUTE RESOLUTION */}
      <Section
        id="disputes"
        label="3-Tier Dispute Resolution"
        icon={AlertTriangle}
        expanded={expandedSection === "disputes"}
        onToggle={() => toggle("disputes")}
      >
        <div className="space-y-3">
          <p className="text-[11px] text-[#A1A1A6]">
            Pragmatic three-tier model. Automated re-measurement first, then human review, then community arbitration.
            Scope: factual measurement disputes only — methodology challenges use the RFC process.
          </p>
          <div className="space-y-2">
            {[
              { tier: "Tier 1 — Automated Review (0–24h)", desc: "Provider submits dispute with evidence. System re-runs from 3 fresh nodes. If variance ≤5% from original → auto-reject. Decision recorded on-chain.", color: "#FFB800" },
              { tier: "Tier 2 — Technical Panel (1–5 days)", desc: "If variance >5%, escalates to 5-person panel (TSC members + community auditors). All evidence posted publicly. Majority vote, recorded on-chain.", color: "#37C9EC" },
              { tier: "Tier 3 — Community Arbitration (7–14 days)", desc: "UMA Optimistic Oracle model. Challenge bond required. Community members stake on outcomes. Loser's bond is slashed. Final and binding.", color: "#A78BFA" },
            ].map((t) => (
              <div key={t.tier} className="p-3 rounded-lg border border-[#1A1A1A] bg-[#0A0A0A]">
                <div className="text-[11px] font-semibold" style={{ color: t.color }}>{t.tier}</div>
                <div className="text-[10px] text-[#6E6E73] mt-0.5">{t.desc}</div>
              </div>
            ))}
          </div>
          <div className="p-3 rounded-lg border border-[#1A1A1A] bg-[#0A0A0A] text-[10px]">
            <div className="text-[#3EE7A2] font-medium mb-1">{"Allowed: "}<span className="text-[#6E6E73] font-normal">{'"Our score is wrong because the measurement was from a node in maintenance..."'}</span></div>
            <div className="text-[#FF5C6C] font-medium">{"Not Allowed: "}<span className="text-[#6E6E73] font-normal">{'"p99 latency should be weighted less" (use RFC process)'}</span></div>
          </div>
        </div>
      </Section>

      {/* 11. GOVERNANCE */}
      <Section
        id="governance"
        label="Governance Charter (BGB + TSC)"
        icon={Gavel}
        expanded={expandedSection === "governance"}
        onToggle={() => toggle("governance")}
      >
        <div className="space-y-3">
          <p className="text-[11px] text-[#A1A1A6]">
            OpenAPI-style separation of business and technical power. Two-board model under Linux Foundation Series / JDF.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border border-[#37C9EC]/20 bg-[#37C9EC]/[0.03]">
              <div className="text-[11px] font-semibold text-[#37C9EC] mb-2">Business Governing Board (BGB)</div>
              <div className="text-[10px] text-[#6E6E73] space-y-0.5">
                <div>• Funding, legal, trademark, operations</div>
                <div>• Annual public financial reports</div>
                <div className="text-[#FF5C6C] font-medium mt-1">Hard boundaries:</div>
                <div>• Cannot override TSC technical decisions</div>
                <div>• Cannot modify scoring to benefit a member</div>
                <div>• Cannot restrict public benchmark access</div>
              </div>
            </div>
            <div className="p-3 rounded-lg border border-[#FFB800]/20 bg-[#FFB800]/[0.03]">
              <div className="text-[11px] font-semibold text-[#FFB800] mb-2">Technical Steering Committee (TSC)</div>
              <div className="text-[10px] text-[#6E6E73] space-y-0.5">
                <div>• Max 9 seats (min 3 active)</div>
                <div>• Elected annually by contributors</div>
                <div>• 25% affiliation cap (max 2/9 from same company)</div>
                <div>• Owns methodology, measurement, disputes</div>
                <div>• Rough consensus model (IETF-style)</div>
                <div>• Monthly public status reports</div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg border border-[#1A1A1A] bg-[#0A0A0A] text-[10px]">
            <div className="text-[#A1A1A6] font-medium mb-1">Working Groups</div>
            <div className="grid grid-cols-3 gap-2 text-[#6E6E73]">
              <div>
                <div className="text-[#FFB800]">Methodology WG</div>
                <div>Scoring formula, dimensions, anti-gaming</div>
              </div>
              <div>
                <div className="text-[#37C9EC]">Infrastructure WG</div>
                <div>Node architecture, data pipeline</div>
              </div>
              <div>
                <div className="text-[#A78BFA]">Governance & Community WG</div>
                <div>Disputes, certification, onboarding</div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg border border-[#1A1A1A] bg-[#0A0A0A] text-[10px]">
            <div className="text-[#A1A1A6] font-medium mb-1">Decision Process</div>
            <div className="text-[#6E6E73] space-y-0.5">
              <div>1. Working group proposes change with rationale</div>
              <div>2. TSC chair assesses rough consensus (argument quality &gt; vote count)</div>
              <div>3. If consensus → approved, no vote needed</div>
              <div>4. If unclear → formal vote (5 of 9 TSC)</div>
              <div>5. 3-3-3 split → proposal rejected (supermajority required)</div>
            </div>
          </div>

          <div className="p-3 rounded-lg border border-[#1A1A1A] bg-[#0A0A0A] text-[10px]">
            <div className="text-[#A1A1A6] font-medium mb-1">Anti-Capture Rules</div>
            <div className="text-[#6E6E73] space-y-0.5">
              <div>• Mandatory recusal when employer is dispute subject</div>
              <div>• Public employer disclosure (updated quarterly)</div>
              <div>• 12-month cooling-off for ex-TSC members</div>
              <div>• No single sponsor &gt; 30% of annual budget</div>
            </div>
          </div>
        </div>
      </Section>

      {/* 12. IP FRAMEWORK */}
      <Section
        id="licensing"
        label="IP & Licensing Framework"
        icon={FileText}
        expanded={expandedSection === "licensing"}
        onToggle={() => toggle("licensing")}
      >
        <div className="space-y-3">
          <p className="text-[11px] text-[#A1A1A6]">
            Three-part licensing model for specifications, code, and published data. CSL provides explicit patent
            safety for independent implementations.
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg border border-[#A78BFA]/20 bg-[#A78BFA]/[0.03]">
              <div className="text-[11px] font-semibold text-[#A78BFA] mb-1">Specifications</div>
              <div className="text-[10px] font-mono text-[#A1A1A6]">CSL v1.0</div>
              <div className="text-[9px] text-[#6E6E73] mt-1">Community Specification License — royalty-free, perpetual patent grants</div>
            </div>
            <div className="p-3 rounded-lg border border-[#3EE7A2]/20 bg-[#3EE7A2]/[0.03]">
              <div className="text-[11px] font-semibold text-[#3EE7A2] mb-1">Code</div>
              <div className="text-[10px] font-mono text-[#A1A1A6]">Apache 2.0</div>
              <div className="text-[9px] text-[#6E6E73] mt-1">Measurement agents, SDKs, dashboards, test harnesses</div>
            </div>
            <div className="p-3 rounded-lg border border-[#FFB800]/20 bg-[#FFB800]/[0.03]">
              <div className="text-[11px] font-semibold text-[#FFB800] mb-1">Benchmark Data</div>
              <div className="text-[10px] font-mono text-[#A1A1A6]">CC BY 4.0</div>
              <div className="text-[9px] text-[#6E6E73] mt-1">All published results — permissive, commercial + non-commercial</div>
            </div>
          </div>
          <div className="p-3 rounded-lg border border-[#1A1A1A] bg-[#0A0A0A] text-[10px] text-[#6E6E73]">
            CLA: Automated via CLA Assistant bot on GitHub. One-time sign, &lt;2 minutes. Public list of signatories.
          </div>
        </div>
      </Section>

      {/* 13. WABCG CHARTER */}
      <Section
        id="wabcg"
        label="W3C Community Group (WABCG)"
        icon={Users}
        expanded={expandedSection === "wabcg"}
        onToggle={() => toggle("wabcg")}
      >
        <div className="space-y-3">
          <p className="text-[11px] text-[#A1A1A6]">
            Web API Benchmark Community Group — interim governance body prior to Linux Foundation Series.
            Open to all individuals, no membership fees.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border border-[#1A1A1A] bg-[#0A0A0A]">
              <div className="text-[10px] font-semibold text-[#A1A1A6] mb-1">Mission</div>
              <div className="text-[10px] text-[#6E6E73]">
                Develop and publish VNP as an open, community-governed, real-time API benchmark scoring standard.
              </div>
            </div>
            <div className="p-3 rounded-lg border border-[#1A1A1A] bg-[#0A0A0A]">
              <div className="text-[10px] font-semibold text-[#A1A1A6] mb-1">Scope</div>
              <div className="text-[10px] text-[#6E6E73]">
                Scoring methodology, measurement infrastructure, real-time benchmarks, anti-gaming, x402/MPP integrations, SDKs.
              </div>
            </div>
          </div>
          <div className="p-3 rounded-lg border border-[#1A1A1A] bg-[#0A0A0A] text-[10px]">
            <div className="text-[#A1A1A6] font-medium mb-1">Transition Plan</div>
            <div className="text-[#6E6E73] space-y-0.5">
              <div>Phase 1 (Month 0–1): W3C Community Group — interim governance</div>
              <div>Phase 2 (Month 1–3): Linux Foundation Series — formal legal entity, first TSC election</div>
              <div>Phase 3 (Month 6–12): Optional ISO TC 215 or W3C Working Group status</div>
            </div>
          </div>
          <div className="p-3 rounded-lg border border-[#1A1A1A] bg-[#0A0A0A] text-[10px]">
            <div className="text-[#A1A1A6] font-medium mb-1">Communication</div>
            <div className="text-[#6E6E73] space-y-0.5">
              <div>Mailing List: public-wabcg@w3.org (open archive)</div>
              <div>GitHub: github.com/VeklomNP (public, MIT license)</div>
              <div>Weekly steering: Thursdays 18:00 UTC (public, recorded)</div>
              <div>Monthly town hall: Open Q&A with all participants</div>
            </div>
          </div>
        </div>
      </Section>

      {/* 14. PUBLICATION MODEL */}
      <Section
        id="publication"
        label="Publication & Adoption Surfaces"
        icon={ExternalLink}
        expanded={expandedSection === "publication"}
        onToggle={() => toggle("publication")}
      >
        <div className="space-y-3">
          <p className="text-[11px] text-[#A1A1A6]">
            Benchmarks become standards when easy to reference, easy to embed, and hard to ignore. Six publication surfaces.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { num: "1", label: "Public Leaderboard", desc: "Live dashboard, rankings by category/region/time" },
              { num: "2", label: "REST/GraphQL Score API", desc: "/v1/score/{api_id} with composite, dimensions, CI, proof" },
              { num: "3", label: "SVG Badge Endpoint", desc: "Shields.io-style badge for READMEs and docs" },
              { num: "4", label: "OpenAPI Extension", desc: "x-vnp-score vendor extensions in OpenAPI 3.1" },
              { num: "5", label: "x402/MPP Integration", desc: "Score field in payment manifests for agent routing" },
              { num: "6", label: "Gateway Plugins (v0.2+)", desc: "Kong/Tyk, Postman, LangChain/MCP tool plugins" },
            ].map((s) => (
              <div key={s.num} className="p-3 rounded-lg border border-[#1A1A1A] bg-[#0A0A0A]">
                <div className="text-[10px] font-mono text-[#FFB800] mb-1">{s.num}</div>
                <div className="text-[10px] font-semibold text-white">{s.label}</div>
                <div className="text-[9px] text-[#6E6E73] mt-0.5">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* 15. 90-DAY PLAN */}
      <Section
        id="execution"
        label="90-Day Execution Plan"
        icon={Calendar}
        expanded={expandedSection === "execution"}
        onToggle={() => toggle("execution")}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg border border-[#FFB800]/20 bg-[#FFB800]/[0.03]">
              <div className="text-[11px] font-semibold text-[#FFB800] mb-2">Days 1–30: Lock & Publish</div>
              <div className="text-[10px] text-[#6E6E73] space-y-0.5">
                <div>• Finalize methodology v0.1</div>
                <div>• Publish governance charter</div>
                <div>• Create public GitHub org + W3C CG</div>
                <div>• Add licenses (CSL, Apache 2.0, CC BY)</div>
                <div>• Build k6-based agent image</div>
                <div>• Deploy 5 regional nodes</div>
                <div>• Implement Base L2 anchoring contract</div>
              </div>
            </div>
            <div className="p-3 rounded-lg border border-[#37C9EC]/20 bg-[#37C9EC]/[0.03]">
              <div className="text-[11px] font-semibold text-[#37C9EC] mb-2">Days 31–60: Measure & Anchor</div>
              <div className="text-[10px] text-[#6E6E73] space-y-0.5">
                <div>• Select 20–50 initial APIs</div>
                <div>• Implement all 10 dimensions</div>
                <div>• Start continuous measurement</div>
                <div>• Build operator + public dashboards</div>
                <div>• Implement dispute Tier 1 & 2</div>
                <div>• Tighten anti-gaming controls</div>
                <div>• Publish x-vnp-score schema draft</div>
              </div>
            </div>
            <div className="p-3 rounded-lg border border-[#3EE7A2]/20 bg-[#3EE7A2]/[0.03]">
              <div className="text-[11px] font-semibold text-[#3EE7A2] mb-2">Days 61–90: Public Launch</div>
              <div className="text-[10px] text-[#6E6E73] space-y-0.5">
                <div>• Launch public leaderboard</div>
                <div>• Ship /v1/score/&#123;api_id&#125; API</div>
                <div>• Ship SVG badge endpoint</div>
                <div>• x402/MPP manifest integration</div>
                <div>• Onboard 50+ APIs</div>
                <div>• First WABCG community meeting</div>
                <div>• Publish v0.2 roadmap</div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* 16. METHODOLOGY VERSIONING */}
      <Section
        id="versioning"
        label="Methodology Versioning & Change Control"
        icon={Lock}
        expanded={expandedSection === "versioning"}
        onToggle={() => toggle("versioning")}
      >
        <div className="space-y-3">
          <p className="text-[11px] text-[#A1A1A6]">
            v0.1 is LOCKED until 2027-06-22. Changing the methodology retroactively destroys score comparability.
            We lock the methodology first, measure honestly, publish results.
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg border border-[#FF5C6C]/20 bg-[#FF5C6C]/[0.03]">
              <div className="text-[10px] font-semibold text-[#FF5C6C]">Major (v0 → v1)</div>
              <div className="text-[9px] text-[#6E6E73] mt-1">Adding/removing dimensions. 2/3 TSC + 60-day notice + parallel scoring.</div>
            </div>
            <div className="p-3 rounded-lg border border-[#FFB800]/20 bg-[#FFB800]/[0.03]">
              <div className="text-[10px] font-semibold text-[#FFB800]">Minor (v0.1 → v0.2)</div>
              <div className="text-[9px] text-[#6E6E73] mt-1">Weight changes within existing dimensions. 2/3 TSC + 30-day comment.</div>
            </div>
            <div className="p-3 rounded-lg border border-[#3EE7A2]/20 bg-[#3EE7A2]/[0.03]">
              <div className="text-[10px] font-semibold text-[#3EE7A2]">Patch (v0.1.0 → v0.1.1)</div>
              <div className="text-[9px] text-[#6E6E73] mt-1">Bug fixes and measurement procedure clarifications.</div>
            </div>
          </div>
          <div className="p-3 rounded-lg border border-[#FFB800]/20 bg-[#FFB800]/[0.03] text-[10px]">
            <div className="text-[#FFB800] font-semibold mb-1">Current Lock Status</div>
            <div className="text-[#A1A1A6]">
              VNP Methodology v0.1.0 — LOCKED FOR MEASUREMENT. Open comment period closes 2026-06-30.
              Scoring begins 2026-07-01. Lock expires 2027-06-22.
            </div>
          </div>
        </div>
      </Section>

      {/* Footer */}
      <div className="p-4 rounded-xl border border-[#242424] bg-[#0D0D0D] text-[10px] text-[#6E6E73]">
        <div className="flex items-center gap-2 mb-2">
          <Fingerprint className="w-3.5 h-3.5 text-[#FFB800]" />
          <span className="text-[#A1A1A6] font-medium">Prior Art & References</span>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-0.5">
          <div>APImetrics CASC Score — multi-metric API quality index</div>
          <div>W3C PROV — provenance model for trust and reliability</div>
          <div>OpenAPI Initiative — BGB/TSC governance model</div>
          <div>Grafana k6 — open-source load testing engine</div>
          <div>Keploy — eBPF-based traffic capture and replay</div>
          <div>Linux Foundation x402 Foundation — machine payments</div>
          <div>MLPerf — benchmark versioning and reproducibility</div>
          <div>Stripe MPP — Machine Payments Protocol</div>
        </div>
      </div>
    </div>
  );
}

function Section({
  id,
  label,
  icon: Icon,
  expanded,
  onToggle,
  children,
}: {
  id: string;
  label: string;
  icon: React.ElementType;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#0D0D0D] border border-[#242424] rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 hover:bg-[#111111] transition-colors text-left"
      >
        <div className="p-1.5 rounded-lg bg-[#FFB800]/10">
          <Icon className="w-4 h-4 text-[#FFB800]" />
        </div>
        <span className="text-sm font-semibold text-white flex-1">{label}</span>
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-[#6E6E73]" />
        ) : (
          <ChevronRight className="w-4 h-4 text-[#6E6E73]" />
        )}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DocRef({ title, status, desc }: { title: string; status: string; desc: string }) {
  const statusColor = status === "LOCKED" ? "#FFB800" : status === "OPEN COMMENT" ? "#37C9EC" : "#3EE7A2";
  return (
    <div className="p-2.5 rounded-lg border border-[#1A1A1A] bg-[#0A0A0A]">
      <div className="text-[10px] font-semibold text-white mb-1">{title}</div>
      <span
        className="text-[8px] font-mono font-bold uppercase tracking-widest px-1 py-0.5 rounded border"
        style={{ color: statusColor, borderColor: statusColor + "40", backgroundColor: statusColor + "10" }}
      >
        {status}
      </span>
      <div className="text-[9px] text-[#6E6E73] mt-1">{desc}</div>
    </div>
  );
}
