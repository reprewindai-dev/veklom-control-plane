/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Share2, Sparkles, Check, Twitter, Cpu, Award } from 'lucide-react';
import { Player } from './types';

interface SharingHubProps {
  player: Player;
}

type CardTheme = 'calm_twilight' | 'cyberpunk_neon' | 'cosmic_slate';

export default function SharingHub({ player }: SharingHubProps) {
  const [theme, setTheme] = useState<CardTheme>('cosmic_slate');
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);

  const handleBroadcast = () => {
    setSharing(true);
    setShared(false);
    setTimeout(() => {
      setSharing(false);
      setShared(true);
    }, 2000);
  };

  const getThemeClasses = (t: CardTheme) => {
    switch (t) {
      case 'calm_twilight':
        return 'bg-gradient-to-br from-indigo-950/40 via-black/40 to-pink-950/40 border-white/10';
      case 'cyberpunk_neon':
        return 'bg-gradient-to-br from-[#00f3ff]/20 via-black/40 to-[#bc13fe]/20 border-white/10';
      case 'cosmic_slate':
      default:
        return 'bg-gradient-to-br from-white/10 via-white/5 to-[#bc13fe]/10 border-white/10';
    }
  };

  return (
    <div id="sharing-hub" className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#00f3ff]/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex justify-between items-center pb-4 mb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-[#00f3ff]" />
            <h3 className="font-mono text-sm tracking-widest text-[#00f3ff] uppercase">
              Neural Sharing Hub
            </h3>
          </div>
          <p className="text-xs text-white/50 mt-0.5 font-sans">
            Broadcast biometric achievements directly to external social platforms
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Card Style Selector */}
        <div className="flex justify-between items-center">
          <span className="text-xs font-mono text-white/50 uppercase">Select Hologram Skin:</span>
          <div className="flex gap-2">
            {(['cosmic_slate', 'calm_twilight', 'cyberpunk_neon'] as CardTheme[]).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`
                  text-[9px] font-mono uppercase px-2.5 py-1 rounded-md border transition-all cursor-pointer
                  ${theme === t
                    ? 'bg-[#00f3ff] text-black border-[#00f3ff] font-bold'
                    : 'bg-black/40 text-white/50 border-white/10 hover:border-white/20'
                  }
                `}
              >
                {t.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* The Holographic Broadcast Card */}
        <div className={`p-6 border rounded-2xl relative overflow-hidden shadow-2xl transition-all duration-500 ${getThemeClasses(theme)}`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rotate-45 translate-x-12 -translate-y-12 pointer-events-none"></div>

          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-[9px] font-mono bg-[#00f3ff]/20 border border-[#00f3ff]/30 text-[#00f3ff] px-2 py-0.5 rounded uppercase tracking-wider">
                M2M Athlete Ticket
              </span>
              <h4 className="text-lg font-bold text-white font-sans mt-2 tracking-wide">
                {player.username}
              </h4>
              <p className="text-[9px] font-mono text-white/40 mt-0.5 select-all">
                {player.walletAddress}
              </p>
            </div>
            <Award className="w-8 h-8 text-[#00f3ff] animate-pulse" />
          </div>

          <div className="grid grid-cols-3 gap-3 border-y border-white/10 py-4 mb-4 font-mono">
            <div className="text-center">
              <span className="text-[8px] text-white/40 uppercase block">Cardiac Coherence</span>
              <span className="text-sm font-bold text-red-400 mt-0.5 block">
                {player.performanceMetrics.avgCardiacCoherence.toFixed(2)}
              </span>
            </div>
            <div className="text-center border-x border-white/10">
              <span className="text-[8px] text-white/40 uppercase block">Peak EEG State</span>
              <span className="text-sm font-bold text-[#bc13fe] mt-0.5 block">
                {player.performanceMetrics.peakNeuralFrequency.toFixed(1)} Hz
              </span>
            </div>
            <div className="text-center">
              <span className="text-[8px] text-white/40 uppercase block">Total Wins</span>
              <span className="text-sm font-bold text-[#00f3ff] mt-0.5 block">
                {player.performanceMetrics.totalWins} Wins
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center text-[8px] font-mono text-white/40">
            <span className="flex items-center gap-1">
              <Cpu className="w-3 h-3 text-[#00f3ff]" /> INTERLINK-CAPI SYNCHRONIZED
            </span>
            <span>BASE MAINNET X402</span>
          </div>
        </div>

        {/* Broadcasting controls */}
        <div>
          <button
            onClick={handleBroadcast}
            disabled={sharing}
            className="w-full bg-gradient-to-r from-[#00f3ff] to-[#bc13fe] text-black font-black uppercase tracking-widest text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-[0_0_15px_rgba(0,243,255,0.4)] hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
          >
            {sharing ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-black" />
                ENCRYPTING TELEMETRY & PUBLISHING...
              </>
            ) : shared ? (
              <>
                <Check className="w-4 h-4 text-black" />
                BROADCAST PUBLISHED TO WARPCAST & X!
              </>
            ) : (
              <>
                <Twitter className="w-4 h-4 text-black" />
                BROADCAST ACHIEVEMENT TICKET
              </>
            )}
          </button>
        </div>

        {shared && (
          <div className="p-3 bg-green-950/40 border border-green-500/30 rounded-xl text-center text-[10px] font-mono text-green-300 animate-fade-in">
            [TRANSMISSION LOG]: Ticket signature dispatched to on-chain social routers. Your friends in the Base hub can now audit your biometric coherence score!
          </div>
        )}
      </div>
    </div>
  );
}
