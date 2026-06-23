"use client";

import { Info, X, Zap } from "lucide-react";
import { useState } from "react";

export function CopilotGuide({ title, description, benefits }: { title: string, description: string, benefits: string[] }) {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 max-w-sm w-full bg-[#0a0a0a] border border-brand-500/30 rounded-xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-bottom-5">
      <div className="bg-gradient-to-r from-brand-500/20 to-transparent p-4 flex items-start justify-between border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400">
            <Zap size={16} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Copilot Guide</h3>
            <p className="text-xs text-brand-400">{title}</p>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-ink-400 hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>
      <div className="p-4 space-y-4">
        <p className="text-sm text-ink-300 leading-relaxed">
          {description}
        </p>
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Why this matters</h4>
          <ul className="space-y-2">
            {benefits.map((benefit, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-ink-300">
                <Info size={14} className="text-brand-500 shrink-0 mt-0.5" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
