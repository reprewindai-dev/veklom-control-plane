import React from 'react';
import Link from 'next/link';
import { TrendingUp, ChevronRight } from 'lucide-react';
import { Insights } from './types';

export function RequestInsights({ insights, hasHighError }: { insights: Insights; hasHighError: boolean }) {
  return (
    <div className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${
      hasHighError ? 'border-amber-500/20 bg-amber-500/5' : 'border-border bg-bg-700/30'
    }`}>
      <TrendingUp size={13} className={hasHighError ? 'text-amber-400' : 'text-brand-400'} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className={`text-[12px] font-semibold ${hasHighError ? 'text-amber-400' : 'text-ink-100'}`}>
            {insights.total_requests_today.toLocaleString()} requests today
          </span>
          <span className={`text-[10px] font-mono ${hasHighError ? 'text-amber-400' : 'text-ink-500'}`}>
            {insights.error_rate_percent}% err
          </span>
        </div>
        <p className="text-[11px] text-ink-500 mt-0.5">
          {`Avg ${insights.avg_latency_ms}ms · `}
          {insights.top_models[0]
            ? `Top: ${insights.top_models[0].model} (${insights.top_models[0].calls} calls)`
            : 'No model activity yet'}
          {` · Local ${((insights.provider_split?.ollama ?? 0) * 100).toFixed(0)}%`}
        </p>
        {hasHighError && (
          <p className="text-[11px] text-amber-400/80 mt-0.5">
            ⚠️ Error rate above 1% — check logs or provider health.
          </p>
        )}
      </div>
      <Link href="/insights" className="text-[10px] text-ink-400 hover:text-ink-200 flex items-center gap-1 shrink-0">
        Details <ChevronRight size={10} />
      </Link>
    </div>
  );
}
