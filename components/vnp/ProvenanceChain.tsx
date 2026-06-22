"use client";

import { Fingerprint, Link as LinkIcon, Database, Shield } from "lucide-react";
import type { VNPProvenance } from "@/lib/vnp/types";

interface ProvenanceChainProps {
  provenance: VNPProvenance;
  compact?: boolean;
}

function truncHash(hash: string, len = 12): string {
  if (hash.length <= len * 2 + 3) return hash;
  return hash.substring(0, len) + "..." + hash.substring(hash.length - 6);
}

export default function ProvenanceChain({ provenance, compact = false }: ProvenanceChainProps) {
  const baseScanUrl = provenance.chainAnchorTx
    ? `https://basescan.org/tx/${provenance.chainAnchorTx}`
    : null;

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-[10px] font-mono text-[#6E6E73]">
        <Fingerprint className="w-3 h-3 text-[#FFB800]/50" />
        <span title={provenance.merkleRoot}>{truncHash(provenance.merkleRoot, 8)}</span>
        {baseScanUrl && (
          <a
            href={baseScanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#FFB800]/60 hover:text-[#FFB800] transition-colors"
          >
            <LinkIcon className="w-3 h-3" />
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4 rounded-xl border border-[#242424] bg-[#0A0A0A]/80">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-4 h-4 text-[#FFB800]" />
        <span className="text-xs font-semibold uppercase tracking-widest text-[#A1A1A6]">
          Cryptographic Provenance
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {/* Epoch */}
        <Row label="Epoch" value={provenance.epochId} />
        <Row
          label="Window"
          value={`${new Date(provenance.epochStart).toLocaleTimeString()} — ${new Date(provenance.epochEnd).toLocaleTimeString()}`}
        />

        {/* Merkle root */}
        <div className="flex items-start gap-2 py-1.5 border-b border-[#242424]/50">
          <span className="text-[11px] text-[#6E6E73] w-28 shrink-0">Merkle Root</span>
          <div className="flex items-center gap-2 min-w-0">
            <Fingerprint className="w-3 h-3 text-[#FFB800] shrink-0" />
            <code className="text-[11px] text-[#FFC94D] font-mono break-all">
              {provenance.merkleRoot}
            </code>
          </div>
        </div>

        {/* Chain anchor */}
        {provenance.chainAnchorTx && (
          <div className="flex items-start gap-2 py-1.5 border-b border-[#242424]/50">
            <span className="text-[11px] text-[#6E6E73] w-28 shrink-0">Base L2 Anchor</span>
            <div className="flex items-center gap-2 min-w-0">
              <Database className="w-3 h-3 text-[#37C9EC] shrink-0" />
              <a
                href={baseScanUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-[#37C9EC] font-mono break-all hover:text-[#7fdcf0] transition-colors"
              >
                {truncHash(provenance.chainAnchorTx, 16)}
              </a>
              {provenance.chainAnchorBlock && (
                <span className="text-[10px] text-[#6E6E73] font-mono">
                  Block #{provenance.chainAnchorBlock.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        )}

        <Row label="Measurements" value={provenance.measurementCount.toLocaleString()} />
        <Row label="Node Operators" value={provenance.nodeOperators.join(", ")} />
        <Row label="Harness" value={provenance.harnessVersion} />
        <Row label="Script Hash" value={truncHash(provenance.scriptHash, 16)} mono />
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 border-b border-[#242424]/50 last:border-0">
      <span className="text-[11px] text-[#6E6E73]">{label}</span>
      <span className={`text-[11px] text-[#E6E6E9] text-right ${mono ? "font-mono" : ""}`}>
        {value}
      </span>
    </div>
  );
}
