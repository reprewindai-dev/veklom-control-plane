import React from 'react';
import Link from 'next/link';
import { Activity, ChevronRight } from 'lucide-react';
import { CircuitState } from './types';
import { circuitColor } from './utils';

export function CircuitBreakerStatus({ circuit }: { circuit: CircuitState }) {
  return (
    <div className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${
      circuit.state === 'CLOSED'
        ? 'border-accent-green/20 bg-accent-green/5'
        : circuit.state === 'HALF_OPEN'
        ? 'border-amber-500/20 bg-amber-500/5'
        : 'border-red-500/20 bg-red-500/5'
    }`}>
      <Activity size={13} className={circuitColor(circuit.state)} />
      <div className="flex-1 min-w-0">
        <span className={`text-[12px] font-semibold ${circuitColor(circuit.state)}`}>
          LLM Circuit: {circuit.state}
        </span>
        {circuit.state === 'OPEN' && (
          <p className="text-[11px] text-ink-400 mt-0.5">
            Ollama unreachable — routing to Groq fallback. Auto-recovers in {circuit.cooldown_seconds}s.
          </p>
        )}
        {circuit.state === 'HALF_OPEN' && (
          <p className="text-[11px] text-amber-400/70 mt-0.5">
            Probing Ollama… {circuit.failures}/{circuit.threshold} failures. Recovery in progress.
          </p>
        )}
        {circuit.state === 'CLOSED' && (
          <p className="text-[11px] text-ink-500 mt-0.5">
            Local inference healthy · {circuit.failures} recent failures
          </p>
        )}
      </div>
      {circuit.state !== 'CLOSED' && (
        <Link href="/status" className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 shrink-0">
          Monitor <ChevronRight size={10} />
        </Link>
      )}
    </div>
  );
}
