/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Bell, Shield, CalendarCheck, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Challenge } from '../types';

interface PushLogProps {
  challenges: Challenge[];
  onCompleteChallenge: (id: string) => void;
}

export default function PushLog({ challenges, onCompleteChallenge }: PushLogProps) {
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [pushLogs, setPushLogs] = useState<Array<{ id: string; message: string; timestamp: string }>>([
    {
      id: '1',
      message: 'Daily challenge portal synced: Maintain 85% cardiac coherence to claim USDC awards.',
      timestamp: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: '2',
      message: 'Base mainnet tournament active: Galactic Ring pattern payout multiplier increased by 1.5x.',
      timestamp: new Date(Date.now() - 7200000).toISOString()
    }
  ]);

  // Request notification permission
  const handleSubscribe = async () => {
    setSubscribing(true);
    
    // Simulate web subscription delay
    setTimeout(async () => {
      setSubscribed(true);
      setSubscribing(false);
      
      // If Notification API is available, ask for standard permission
      if ('Notification' in window) {
        try {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            new Notification('BINGO 2060 SYSTEM ALIGNMENT', {
              body: 'Holographic push alerts successfully configured! Standard Base Mainnet alerts are active.',
              icon: '/favicon.ico'
            });
          }
        } catch (e) {
          console.warn('Standard notifications permission request omitted under context limits.');
        }
      }
      
      // Append a fresh subscription log
      setPushLogs((prev) => [
        {
          id: String(Date.now()),
          message: 'Secure subscription locked. App token mapped under Base ID 6a20f24cc341f72c2f573eb5.',
          timestamp: new Date().toISOString()
        },
        ...prev
      ]);
    }, 1500);
  };

  // Poll server for new alerts/notifications
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch('/api/push/alerts');
        if (res.ok) {
          const data = await res.json();
          if (data.alerts && data.alerts.length > 0) {
            // Merge with local logs, using id to avoid duplicates
            setPushLogs((prev) => {
              const prevIds = new Set(prev.map(p => p.id));
              const newItems = data.alerts
                .filter((a: any) => !prevIds.has(a.id))
                .map((a: any) => ({
                  id: a.id,
                  message: a.message,
                  timestamp: a.timestamp || new Date().toISOString()
                }));
              return [...newItems, ...prev];
            });
          }
        }
      } catch (e) {
        // Silently capture fetch exceptions
      }
    };

    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div id="push-notification-panel" className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-32 h-32 bg-[#bc13fe]/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 mb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#00f3ff]" />
            <h3 className="font-mono text-sm tracking-widest text-[#00f3ff] uppercase">
              Push Alert & Daily Challenge Console
            </h3>
          </div>
          <p className="text-xs text-white/50 mt-0.5 font-sans">
            Configure system telemetry alerts and complete retention goals
          </p>
        </div>

        <button
          onClick={handleSubscribe}
          disabled={subscribed || subscribing}
          className={`
            text-[10px] font-mono uppercase px-3.5 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5
            ${subscribed
              ? 'bg-green-950/40 border-green-500/40 text-green-400 font-bold'
              : 'bg-gradient-to-r from-[#00f3ff] to-[#bc13fe] text-black font-black uppercase tracking-widest shadow-[0_0_10px_rgba(0,243,255,0.4)]'
            }
          `}
        >
          <Shield className="w-3.5 h-3.5" />
          {subscribing ? 'SUBSCRIBING...' : subscribed ? 'PUSH ACTIVE' : 'ENABLE SECURE PUSH ALERTS'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Daily Challenges */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 font-mono text-xs text-[#bc13fe] uppercase">
            <CalendarCheck className="w-4 h-4 text-[#bc13fe]" />
            Active Retention Challenges
          </div>

          <div className="space-y-3">
            {challenges.map((c) => (
              <div
                key={c.id}
                className={`
                  p-4 rounded-xl border transition-all duration-300 relative overflow-hidden
                  ${c.completed
                    ? 'bg-green-950/20 border-green-500/30 text-green-300'
                    : 'bg-white/5 border border-white/10 hover:border-[#bc13fe]/30'
                  }
                `}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${c.completed ? 'bg-green-500/20 text-green-400' : 'bg-[#bc13fe]/20 text-[#bc13fe] border border-[#bc13fe]/30'}`}>
                        {c.rewardUSDC.toFixed(2)} USDC
                      </span>
                      <h4 className="text-xs font-bold text-white tracking-wide font-sans">{c.title}</h4>
                    </div>
                    <p className="text-[10px] text-white/50 font-mono leading-relaxed">{c.requirement}</p>
                  </div>

                  {c.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                  ) : (
                    <button
                      onClick={() => onCompleteChallenge(c.id)}
                      className="text-[9px] font-mono text-[#bc13fe] hover:text-[#bc13fe]/80 bg-black/40 border border-white/10 px-2 py-1 rounded cursor-pointer shrink-0 transition-colors"
                    >
                      CLAIM
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Push Notification Log */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 font-mono text-xs text-[#00f3ff] uppercase">
            <Zap className="w-4 h-4 text-[#00f3ff]" />
            Holographic Push Logs
          </div>

          <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
            {pushLogs.map((log) => (
              <div
                key={log.id}
                className="bg-black/40 border border-white/10 rounded-xl p-3 space-y-1 font-mono text-[10px] text-white/70"
              >
                <div className="flex justify-between items-center text-[8px] text-white/40">
                  <span className="text-[#00f3ff]">TELEMETRY BROADCAST</span>
                  <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="leading-relaxed">{log.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
