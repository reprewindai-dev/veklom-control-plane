"use client";
import { Card, Table } from "@/components/ui";
import { DollarSign } from "lucide-react";

export function X402Tracker() {
  const mockSpend = [
    { run: "run_8x99", agent: "Agent-110", route: "/api/v1/openai/gpt-4o", cost: "$0.012", limit: "$0.050", status: "Active" },
    { run: "run_7y88", agent: "Agent-109", route: "/api/v1/anthropic/claude-3-opus", cost: "$0.100", limit: "$0.100", status: "Halted (Cap Hit)" },
    { run: "run_6z77", agent: "Agent-112", route: "/api/v1/rag/search", cost: "$0.001", limit: "$0.010", status: "Completed" },
  ];

  return (
    <Card className="flex flex-col h-full border-border">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="text-brand-400" size={18} />
        <h2 className="text-lg font-medium text-white">x402 FinOps Micropayments</h2>
      </div>
      <p className="text-sm text-ink-300 mb-4">Base Network USDC Ledger: Granular budgets enforcing hard runtime constraints on infinite loops.</p>
      
      <div className="flex-1">
        <Table
          rows={mockSpend}
          rowKey={(r) => r.run}
          columns={[
            { key: "agent", header: "Agent", render: (r) => <span className="text-white font-medium">{r.agent}</span> },
            { key: "route", header: "Route", render: (r) => <span className="font-mono text-xs text-ink-400">{r.route}</span> },
            { key: "cost", header: "Spend", render: (r) => <span className="font-medium text-brand-300">{r.cost}</span> },
            { key: "status", header: "Status", render: (r) => (
              <span className={`text-xs px-1.5 py-0.5 rounded ${r.status.includes('Halted') ? 'bg-accent-red/20 text-accent-red' : 'bg-bg-700 text-ink-300'}`}>
                {r.status}
              </span>
            ) },
          ]}
        />
      </div>
    </Card>
  );
}
