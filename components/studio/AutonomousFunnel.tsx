"use client";

import { Card } from "@/components/ui";
import { Database, Filter, CheckCircle, Zap } from "lucide-react";
import { useApi } from "@/hooks/useApi";

export function AutonomousFunnel() {
  // Use adaptive polling via SWR to keep this live without thrashing the backend
  const { data } = useApi<{ 
    bronze: number, 
    silver: number, 
    gold: number,
    threshold: number,
    confidence: number 
  }>("/api/v1/autonomous/stats", { refreshInterval: 5000 });

  const stats = data || { bronze: 1420, silver: 850, gold: 89, threshold: 100, confidence: 99.8 };
  const percentToAutonomous = Math.min(100, Math.round((stats.gold / stats.threshold) * 100));

  return (
    <Card className="col-span-full border-brand-500/20 bg-brand-500/5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 blur-[100px] rounded-full" />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 relative z-10 gap-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Zap className="text-brand-400" />
            Autonomous Self-Learning Funnel
          </h3>
          <p className="text-sm text-ink-300 mt-1">
            Real-time deterministic grading of execution data. Only perfect "Gold" data trains the network.
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-black/40 p-3 rounded-lg border border-white/5">
          <div className="text-right">
            <div className="text-xs font-semibold uppercase tracking-wider text-ink-400">System Confidence</div>
            <div className="text-lg font-mono text-brand-400">{stats.confidence}%</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        <div className="p-5 rounded-xl bg-black/40 border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#cd7f32]" />
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-[#cd7f32]" />
              <h4 className="font-semibold text-white">Bronze Tier</h4>
            </div>
            <span className="font-mono text-xl text-white">{stats.bronze}</span>
          </div>
          <p className="text-xs text-ink-400">Raw execution logs. Suboptimal latency or low confidence. Excluded from training.</p>
        </div>

        <div className="p-5 rounded-xl bg-black/40 border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#c0c0c0]" />
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-[#c0c0c0]" />
              <h4 className="font-semibold text-white">Silver Tier</h4>
            </div>
            <span className="font-mono text-xl text-white">{stats.silver}</span>
          </div>
          <p className="text-xs text-ink-400">Structurally valid. High completion rate but missed strict safety or latency limits.</p>
        </div>

        <div className="p-5 rounded-xl bg-brand-500/10 border border-brand-500/30 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#ffd700]" />
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-[#ffd700]" />
              <h4 className="font-semibold text-white">Gold Tier</h4>
            </div>
            <span className="font-mono text-xl text-brand-400">{stats.gold} / {stats.threshold}</span>
          </div>
          <p className="text-xs text-ink-300">Perfect mathematical execution. Absolute truth used for autonomous model training.</p>
          
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-brand-300">Training Threshold</span>
              <span className="text-brand-400 font-mono">{percentToAutonomous}%</span>
            </div>
            <div className="w-full bg-black/60 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-brand-500 h-1.5 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${percentToAutonomous}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
