"use client";
import { Card, Table } from "@/components/ui";
import { HardDrive, PlayCircle } from "lucide-react";

export function AuditLedger() {
  const mockPackets = [
    { hash: "0x8f7b...2c1e", event: "Memory Indexed", tenant: "tenant-A", time: "1m ago" },
    { hash: "0x4a2b...9d3f", event: "Semantic Search", tenant: "tenant-B", time: "3m ago" },
    { hash: "0x1e8c...5a2d", event: "API Request [Stripe]", tenant: "tenant-A", time: "10m ago" },
    { hash: "0x9f2a...7c1b", event: "Database Query", tenant: "tenant-C", time: "15m ago" },
  ];

  return (
    <Card className="flex flex-col h-full border-border">
      <div className="flex items-center gap-2 mb-4">
        <HardDrive className="text-brand-400" size={18} />
        <h2 className="text-lg font-medium text-white">Audit Sealing Ledger</h2>
      </div>
      <p className="text-sm text-ink-300 mb-4">Immutable, cryptographically sealed packets making execution history mathematically unforgeable for SOC2/HIPAA.</p>
      
      <div className="flex-1">
        <Table
          rows={mockPackets}
          rowKey={(r) => r.hash}
          columns={[
            { key: "hash", header: "SHA256 Hash", render: (r) => <span className="font-mono text-xs text-ink-300">{r.hash}</span> },
            { key: "event", header: "Event", render: (r) => <span className="text-white text-sm">{r.event}</span> },
            { key: "tenant", header: "Tenant", render: (r) => <span className="text-ink-400 text-xs">{r.tenant}</span> },
            { key: "replay", header: "Forensics", render: (r) => (
              <button className="text-brand-400 hover:text-brand-300 flex items-center gap-1 text-xs">
                <PlayCircle size={14} /> Replay
              </button>
            ) },
          ]}
        />
      </div>
    </Card>
  );
}
