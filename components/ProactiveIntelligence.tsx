'use client';

/**
 * ProactiveIntelligence — §12 Monitoring + §7.3 Budget + §5 Circuit Breaker + §8.3 Security + §13 Autonomous ML
 *
 * Polls the real backend endpoints every 10 seconds. Surfaces recommendations,
 * live status, and proactive actions WITHOUT waiting for the user to ask.
 *
 * Endpoints used (all per USER_MANUAL.md):
 *   GET /status                          → circuit_breaker state (§5)
 *   GET /api/v1/monitoring/alerts        → live alert feed (§12.3)
 *   GET /api/v1/insights                 → latency, error rate, provider split (§12.4)
 *   GET /api/v1/budget?budget_type=monthly → alert_level, % used (§7.3)
 *   GET /api/v1/security/stats           → security_score (§8.3)
 *   POST /api/v1/autonomous/quality/optimize → best provider recommendation (§13.3)
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';

import {
  Alert,
  Insights,
  Budget,
  SecStats,
  AiRec,
  Intelligence,
  CircuitBreakerStatus,
  BudgetAlert,
  SecuritySignal,
  RequestInsights,
  AIRecommendation,
  LiveAlerts,
  AllClear
} from './proactive-intelligence';

export function ProactiveIntelligence() {
  const [intel, setIntel] = useState<Intelligence>({
    circuit: null,
    alerts: [],
    insights: null,
    budget: null,
    security: null,
    aiRec: null,
    lastRefreshed: new Date(),
    loading: true,
  });
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    try {
      // Fire all 6 fetches in parallel — any individual failure is silenced
      const [statusRes, alertsRes, insightsRes, budgetRes, secRes, recRes] =
        await Promise.allSettled([
          fetch('/status').then((r) => r.json()),                                          // §5
          api<Alert[]>('/api/v1/monitoring/alerts'),                                       // §12.3
          api<Insights>('/api/v1/insights'),                                               // §12.4
          api<Budget>('/api/v1/budget?budget_type=monthly'),                               // §7.3
          api<SecStats>('/api/v1/security/stats'),                                         // §8.3
          api<AiRec>('/api/v1/autonomous/quality/optimize', {                              // §13.3
            method: 'POST',
            body: { operation_type: 'inference', target_quality: 0.85, max_cost: '0.005' },
          }),
        ]);

      setIntel({
        circuit:
          statusRes.status === 'fulfilled'
            ? (statusRes.value?.circuit_breaker ?? null)
            : null,
        alerts:
          alertsRes.status === 'fulfilled' && Array.isArray(alertsRes.value)
            ? alertsRes.value.filter((a) => !a.resolved)
            : [],
        insights:
          insightsRes.status === 'fulfilled' ? insightsRes.value : null,
        budget:
          budgetRes.status === 'fulfilled' ? budgetRes.value : null,
        security:
          secRes.status === 'fulfilled' ? secRes.value : null,
        aiRec:
          recRes.status === 'fulfilled' ? recRes.value : null,
        lastRefreshed: new Date(),
        loading: false,
      });
    } catch (e) {
      // Background widget — fail silently to not disrupt the main UI
      setIntel((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    refresh();
    intervalRef.current = setInterval(refresh, 10000); // 10s proactive loop

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refresh]);

  const { circuit, alerts, insights, budget, security, aiRec, lastRefreshed, loading } = intel;

  // Active alerts (not dismissed by user)
  const visibleAlerts = alerts.filter((a) => !dismissed.has(a.id));

  // Derived proactive signals
  const hasBudgetWarning = budget && ['warning', 'critical', 'exhausted'].includes(budget.alert_level);
  const hasCircuitIssue = circuit && circuit.state !== 'CLOSED';
  const hasSecurityIssue = security && (security.open > 0 || security.critical > 0);
  const hasHighError = insights && insights.error_rate_percent > 1.0;

  // Total active signals count
  const signalCount =
    visibleAlerts.length +
    (hasBudgetWarning ? 1 : 0) +
    (hasCircuitIssue ? 1 : 0) +
    (hasSecurityIssue ? 1 : 0) +
    (hasHighError ? 1 : 0);

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-bg-800/60 p-4 animate-pulse">
        <div className="h-4 w-48 bg-bg-700 rounded mb-3" />
        <div className="h-3 w-full bg-bg-700 rounded mb-2" />
        <div className="h-3 w-3/4 bg-bg-700 rounded" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-bg-800/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-brand-400" />
          <span className="text-[13px] font-semibold text-ink-100">Proactive Intelligence</span>
          {signalCount > 0 && (
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-500/20 border border-red-500/30 text-[10px] font-bold text-red-400">
              {signalCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-ink-600 font-mono">
            {lastRefreshed.toLocaleTimeString()}
          </span>
          <button
            onClick={refresh}
            className="p-1 rounded hover:bg-bg-700 transition-colors text-ink-500 hover:text-ink-200"
            title="Refresh now"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {circuit && <CircuitBreakerStatus circuit={circuit} />}
        {budget && <BudgetAlert budget={budget} hasBudgetWarning={!!hasBudgetWarning} />}
        {security && <SecuritySignal security={security} hasSecurityIssue={!!hasSecurityIssue} />}
        {insights && <RequestInsights insights={insights} hasHighError={!!hasHighError} />}
        {aiRec && <AIRecommendation aiRec={aiRec} />}
        <LiveAlerts alerts={visibleAlerts} setDismissed={setDismissed} />
        <AllClear signalCount={signalCount} loading={loading} />
      </div>
    </div>
  );
}
