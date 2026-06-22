import React from 'react';
import Link from 'next/link';
import { Shield, ChevronRight } from 'lucide-react';
import { SecStats } from './types';

export function SecuritySignal({ security, hasSecurityIssue }: { security: SecStats; hasSecurityIssue: boolean }) {
  return (
    <div className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${
      hasSecurityIssue
        ? 'border-red-500/20 bg-red-500/5'
        : 'border-border bg-bg-700/30'
    }`}>
      <Shield size={13} className={hasSecurityIssue ? 'text-red-400' : 'text-accent-green'} />
      <div className="flex-1 min-w-0">
        <span className={`text-[12px] font-semibold ${hasSecurityIssue ? 'text-red-400' : 'text-accent-green'}`}>
          Security Score: {security.security_score}/100
        </span>
        {security.open > 0 && (
          <p className="text-[11px] text-ink-400 mt-0.5">
            {security.critical > 0
              ? `🚨 ${security.critical} critical threat(s) open — immediate attention required.`
              : `${security.open} open security event(s) awaiting resolution.`}
          </p>
        )}
        {!hasSecurityIssue && (
          <p className="text-[11px] text-ink-500 mt-0.5">All events resolved · no open threats</p>
        )}
      </div>
      {hasSecurityIssue && (
        <Link href="/security" className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1 shrink-0">
          Review <ChevronRight size={10} />
        </Link>
      )}
    </div>
  );
}
