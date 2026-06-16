// @ts-nocheck
"use client";
import React from 'react';
import { motion } from 'motion/react';
import { Share2, Activity, Link2, BookOpen } from 'lucide-react';
import { SSRNSignal } from '../types';

interface SignalIngestionFeedProps {
  signals: SSRNSignal[];
}

export const SignalIngestionFeed: React.FC<SignalIngestionFeedProps> = ({ signals }) => {
  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Share2 size={18} className="text-purple-400" />
          <h2 className="text-sm font-mono uppercase tracking-widest text-white/80">Signal Ingestion Feed (Pillar II)</h2>
        </div>
        <div className="px-2 py-0.5 bg-purple-400/10 border border-purple-400/20 rounded">
            <span className="text-[9px] font-mono text-purple-400 uppercase font-bold">Scanning SSRN Nodes</span>
        </div>
      </div>

      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {signals.map((s, i) => (
          <motion.div 
            key={s.node}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5 group hover:border-purple-400/30 transition-all"
          >
            <div className="flex items-center gap-3 w-2/3">
                <BookOpen size={12} className="text-white/20" />
                <span className="text-[10px] font-mono text-white/70 truncate">{s.node}</span>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-mono font-bold text-purple-400">{s.match_strength.toFixed(2)}%</span>
                    <span className="text-[8px] font-mono text-white/20 uppercase tracking-tighter">Strength</span>
                </div>
                <div className="p-1 px-2 rounded bg-emerald-400/5 text-emerald-400">
                    <Link2 size={10} />
                </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center gap-3 p-3 bg-white/5 border border-dashed border-white/10 rounded-xl">
         <Activity size={14} className="text-white/20 animate-pulse" />
         <p className="text-[9px] font-mono text-white/30 truncate uppercase">
            Bridge: Historical Heuristics ingested at {new Date().toLocaleTimeString()}
         </p>
      </div>
    </div>
  );
};

