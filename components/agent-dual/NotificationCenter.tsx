/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Flame, Star, Wallet, BellRing } from 'lucide-react';
import { PushNotification } from './types';

interface NotificationCenterProps {
  notifications: PushNotification[];
  onClear: () => void;
}

export function NotificationCenter({ notifications, onClear }: NotificationCenterProps) {
  return (
    <div id="alerts-console" className="bg-[#0d0f16] border border-white/10 rounded-lg p-4 h-full flex flex-col justify-between shadow-lg shadow-blue-900/5">
      {/* Block Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <BellRing className="w-4 h-4 text-blue-400" />
          <h2 className="text-xs font-bold font-mono tracking-widest text-[#d4dbe8] uppercase">
            // Real-Time Push Transactions Feed
          </h2>
        </div>
        {notifications.length > 0 && (
          <button
            onClick={onClear}
            className="text-[9px] font-mono text-slate-500 hover:text-slate-300 uppercase tracking-widest"
          >
            Clear Log
          </button>
        )}
      </div>

      {/* Notifications list */}
      <div id="notifications-body" className="flex-1 space-y-2 overflow-y-auto max-h-[220px] scrollbar-thin scrollbar-thumb-slate-800 pr-1">
        {notifications.length === 0 ? (
          <div className="text-center py-6 text-slate-600 font-mono text-[10px] uppercase tracking-widest">
            Listening for contract telemetry events...
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className="p-2 w-full text-left rounded bg-[#050608] border border-white/5 flex items-start gap-2.5 animate-slide-in"
            >
              <div className="mt-0.5">
                {notif.type === 'jackpot' && (
                  <div className="p-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-500">
                    <Star className="w-3.5 h-3.5" />
                  </div>
                )}
                {notif.type === 'tx_success' && (
                  <div className="p-1 rounded bg-green-500/10 border border-green-500/30 text-emerald-400">
                    <Wallet className="w-3.5 h-3.5" />
                  </div>
                )}
                {notif.type === 'collapse' && (
                  <div className="p-1 rounded bg-red-500/10 border border-red-500/30 text-red-400">
                    <Flame className="w-3.5 h-3.5 text-red-500" />
                  </div>
                )}
                {notif.type === 'agent_win' && (
                  <div className="p-1 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400">
                    <Star className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-mono text-white leading-tight font-bold">{notif.message}</p>
                <p className="text-[9px] font-mono text-slate-500 mt-0.5 truncate select-all">{notif.sub}</p>
              </div>
              <span className="text-[8px] font-mono text-slate-600 self-center shrink-0">
                {notif.timestamp}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-white/5 pt-2 mt-2">
        <p className="text-[9px] font-mono text-slate-600 uppercase text-center tracking-widest">
          Telemetry channel cryptographically signed via Base Mainnet consensus
        </p>
      </div>
    </div>
  );
}
