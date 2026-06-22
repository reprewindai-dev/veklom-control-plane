import React from 'react';
import Link from 'next/link';
import { DollarSign, ChevronRight } from 'lucide-react';
import { Budget } from './types';
import { budgetColor } from './utils';

export function BudgetAlert({ budget, hasBudgetWarning }: { budget: Budget; hasBudgetWarning: boolean }) {
  return (
    <div className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${
      hasBudgetWarning
        ? budget.alert_level === 'exhausted'
          ? 'border-red-500/30 bg-red-500/5'
          : 'border-amber-500/20 bg-amber-500/5'
        : 'border-border bg-bg-700/30'
    }`}>
      <DollarSign size={13} className={budgetColor(budget.alert_level)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className={`text-[12px] font-semibold ${budgetColor(budget.alert_level)}`}>
            Budget: {budget.percent_used.toFixed(1)}% used
          </span>
          <span className="text-[10px] text-ink-500 font-mono">
            ${budget.current_spend} / ${budget.amount}
          </span>
        </div>
        {hasBudgetWarning && (
          <p className="text-[11px] text-ink-400 mt-0.5">
            {budget.alert_level === 'exhausted'
              ? '⛔ Budget exhausted — all AI calls are blocked (HTTP 402). Increase limit immediately.'
              : budget.alert_level === 'critical'
              ? `⚠️ Budget critical. Forecast: exhausted by ${budget.forecast_exhaustion_date ? new Date(budget.forecast_exhaustion_date).toLocaleDateString() : 'soon'}.`
              : `Budget at warning threshold. ${budget.remaining} remaining this month.`}
          </p>
        )}
        {!hasBudgetWarning && (
          <p className="text-[11px] text-ink-500 mt-0.5">
            ${budget.remaining} remaining · on track
          </p>
        )}
      </div>
      {hasBudgetWarning && (
        <Link href="/budget" className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 shrink-0">
          Manage <ChevronRight size={10} />
        </Link>
      )}
    </div>
  );
}
