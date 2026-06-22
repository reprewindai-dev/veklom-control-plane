import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export function AllClear({ signalCount, loading }: { signalCount: number; loading: boolean }) {
  if (signalCount > 0 || loading) return null;

  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-accent-green/20 bg-accent-green/5 px-3 py-2.5">
      <CheckCircle2 size={13} className="text-accent-green shrink-0" />
      <div>
        <span className="text-[12px] font-semibold text-accent-green">All systems nominal</span>
        <p className="text-[11px] text-ink-500 mt-0.5">
          No active alerts · circuit closed · budget on track · security clear
        </p>
      </div>
    </div>
  );
}
