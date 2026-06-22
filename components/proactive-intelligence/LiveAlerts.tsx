import React from 'react';
import { AlertTriangle, XCircle, BellRing } from 'lucide-react';
import { Alert } from './types';
import { severityColor } from './utils';

export function LiveAlerts({ alerts, setDismissed }: { alerts: Alert[]; setDismissed: React.Dispatch<React.SetStateAction<Set<string>>> }) {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] uppercase tracking-widest text-ink-600 font-medium px-1">
        Live Alerts
      </p>
      {alerts.slice(0, 4).map((alert) => (
        <div
          key={alert.id}
          className={`flex items-start gap-2.5 rounded-lg border px-3 py-2 text-[12px] ${severityColor(alert.severity)}`}
        >
          {alert.severity === 'CRITICAL' ? (
            <XCircle size={12} className="mt-0.5 shrink-0" />
          ) : alert.severity === 'WARNING' ? (
            <AlertTriangle size={12} className="mt-0.5 shrink-0" />
          ) : (
            <BellRing size={12} className="mt-0.5 shrink-0" />
          )}
          <span className="flex-1 leading-relaxed">{alert.message}</span>
          <button
            onClick={() => setDismissed((prev) => new Set([...prev, alert.id]))}
            className="text-ink-600 hover:text-ink-400 transition-colors mt-0.5 shrink-0"
            title="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
