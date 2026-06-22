import React from 'react';
import Link from 'next/link';
import { Cpu, ArrowRight } from 'lucide-react';
import { AiRec } from './types';

export function AIRecommendation({ aiRec }: { aiRec: AiRec }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-brand-500/20 bg-brand-500/5 px-3 py-2.5">
      <Cpu size={13} className="text-brand-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="text-[12px] font-semibold text-brand-300">
          Recommended: {aiRec.recommended_provider} · {aiRec.recommended_model}
        </span>
        <p className="text-[11px] text-ink-400 mt-0.5">
          Quality {(aiRec.expected_quality * 100).toFixed(0)}% · Cost ${aiRec.expected_cost} ·
          Best match for your current workload pattern.
        </p>
      </div>
      <Link href="/routing" className="text-[10px] text-brand-400 hover:text-brand-300 flex items-center gap-1 shrink-0">
        Apply <ArrowRight size={10} />
      </Link>
    </div>
  );
}
