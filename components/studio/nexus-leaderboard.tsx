"use client";
import { Card, Table } from "@/components/ui";
import { BarChart2, CheckCircle2, ShieldAlert } from "lucide-react";

export function NexusLeaderboard() {
  const mockLeaderboard = [
    { stack: "LangChain (OpenAI)", adherence: "99.1%", latency: "1.2s", cost: "$0.02/run", safe: true },
    { stack: "CrewAI (Anthropic)", adherence: "98.5%", latency: "2.4s", cost: "$0.08/run", safe: true },
    { stack: "AutoGPT (Local Llama)", adherence: "84.2%", latency: "0.8s", cost: "$0.00/run", safe: false },
  ];

  return (
    <Card className="flex flex-col h-full border-border">
      <div className="flex items-center gap-2 mb-4">
        <BarChart2 className="text-brand-400" size={18} />
        <h2 className="text-lg font-medium text-white">Nexus Protocol: BYOS Certification</h2>
      </div>
      <p className="text-sm text-ink-300 mb-4">Is this framework safe for production? Benchmarking custom agent stacks on policy adherence and overhead.</p>
      
      <div className="flex-1">
        <Table
          rows={mockLeaderboard}
          rowKey={(r) => r.stack}
          columns={[
            { key: "stack", header: "Framework / Model", render: (r) => <span className="text-white font-medium">{r.stack}</span> },
            { key: "adherence", header: "Policy Adherence", render: (r) => (
              <span className={parseFloat(r.adherence) > 95 ? "text-accent-green" : "text-accent-red"}>{r.adherence}</span>
            ) },
            { key: "latency", header: "Overhead", render: (r) => <span className="text-ink-300">{r.latency}</span> },
            { key: "safe", header: "Prod Ready", render: (r) => (
              r.safe ? <CheckCircle2 className="text-accent-green" size={16} /> : <ShieldAlert className="text-accent-red" size={16} />
            ) },
          ]}
        />
      </div>
    </Card>
  );
}
