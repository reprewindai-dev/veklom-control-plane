"use client";
import React, { useEffect, useState } from 'react';
import { ShieldCheck, Activity, Brain, BookOpen, Users, Award } from 'lucide-react';
import { QuantumAgentTrustScore as AgentTrustScoreType } from '../types';

export const AgentTrustScore: React.FC = () => {
  const [scores, setScores] = useState<AgentTrustScoreType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/agents/trust-scores')
      .then((res) => res.json())
      .then((data) => {
        setScores(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch trust scores', err);
        // Fallback or empty state
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-white/50 p-6 font-mono text-xs">Loading Trust Scores...</div>;

  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
      <div className="flex items-center gap-2 mb-6">
        <ShieldCheck size={20} className="text-emerald-400" />
        <h2 className="text-sm font-mono uppercase tracking-widest text-white/80">Agent Trust Scores</h2>
      </div>

      <div className="space-y-6">
        {scores.length > 0 ? scores.map((agent) => (
          <div key={agent.id} className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white uppercase">{agent.name}</h3>
                <span className="text-[10px] font-mono text-white/40">{agent.id}</span>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400">{agent.totalScore}</div>
                <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${getTierColor(agent.trustTier)}`}>
                    {agent.trustTier}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2">
              <MetricBar icon={<Activity size={12}/>} label="Perf" value={agent.performance} />
              <MetricBar icon={<Brain size={12}/>} label="Behav" value={agent.behavioral} />
              <MetricBar icon={<BookOpen size={12}/>} label="Sem" value={agent.semantic} />
              <MetricBar icon={<Award size={12}/>} label="Gov" value={agent.governance} />
              <MetricBar icon={<Users size={12}/>} label="Soc" value={agent.social} />
            </div>
          </div>
        )) : (
          <div className="text-white/20 font-mono text-[10px] uppercase text-center py-10 border border-dashed border-white/5 rounded-xl">
            No agent trust telemetry registered in this cycle.
          </div>
        )}
      </div>
    </div>
  );
};

const getTierColor = (tier: string) => {
  switch(tier) {
    case 'T1': return 'bg-emerald-500/20 text-emerald-400';
    case 'T2': return 'bg-blue-500/20 text-blue-400';
    case 'T3': return 'bg-amber-500/20 text-amber-400';
    default: return 'bg-red-500/20 text-red-400';
  }
};

const MetricBar = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: number }) => (
  <div className="flex flex-col items-center gap-1">
    <div className="h-16 w-3 bg-white/5 rounded-full overflow-hidden relative">
      <div className="absolute bottom-0 w-full bg-cyan-400/50" style={{ height: `${value}%` }} />
    </div>
    <div className="text-[10px] text-white/40 uppercase">{label}</div>
  </div>
);
