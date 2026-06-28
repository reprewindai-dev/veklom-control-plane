/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Award, Heart, Cpu, Trophy } from 'lucide-react';
import { LeaderboardEntry } from './types';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentPlayerWallet: string;
}

export default function Leaderboard({ entries, currentPlayerWallet }: LeaderboardProps) {
  return (
    <div id="leaderboard-panel" className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden">
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#bc13fe]/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex justify-between items-center pb-4 mb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400 animate-pulse" />
            <h3 className="font-mono text-sm tracking-widest text-[#00f3ff] uppercase">
              Global Neural Leaderboard
            </h3>
          </div>
          <p className="text-xs text-white/50 mt-0.5 font-sans">
            Rankings calibrated by average cardiac coherence and wins
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead>
            <tr className="border-b border-white/10 text-white/40 text-[10px] uppercase tracking-wider pb-2">
              <th className="py-2.5 font-semibold">Rank</th>
              <th className="py-2.5 font-semibold">Athlete Name</th>
              <th className="py-2.5 font-semibold text-center">Wins</th>
              <th className="py-2.5 font-semibold text-center">Avg Coherence</th>
              <th className="py-2.5 font-semibold text-center">Peak EEG</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {entries.map((player, index) => {
              const isCurrent = player.walletAddress.toLowerCase() === currentPlayerWallet.toLowerCase();
              return (
                <tr
                  key={player.walletAddress}
                  className={`
                    transition-colors duration-200
                    ${isCurrent ? 'bg-white/10 text-white font-bold' : 'hover:bg-white/5 text-white/80'}
                  `}
                >
                  <td className="py-3 pl-1 flex items-center gap-1">
                    {index === 0 && <Award className="w-4 h-4 text-yellow-400" />}
                    {index === 1 && <Award className="w-4 h-4 text-slate-300" />}
                    {index === 2 && <Award className="w-4 h-4 text-amber-500" />}
                    {index > 2 && <span className="w-4 text-center block text-white/40">{index + 1}</span>}
                  </td>
                  <td className="py-3">
                    <span className={isCurrent ? 'text-[#00f3ff] font-bold' : 'text-white'}>
                      {player.username}
                    </span>
                    <span className="block text-[8px] text-white/40 font-mono tracking-tighter mt-0.5">
                      {player.walletAddress.slice(0, 8)}...{player.walletAddress.slice(-8)}
                    </span>
                  </td>
                  <td className="py-3 text-center font-bold text-white">
                    {player.wins}
                  </td>
                  <td className="py-3 text-center">
                    <span className="inline-flex items-center gap-1 text-red-400 font-semibold text-xs">
                      <Heart className="w-3 h-3 text-red-500 animate-pulse" /> {player.avgCardiacCoherence.toFixed(2)}
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    <span className="inline-flex items-center gap-1 text-[#bc13fe]">
                      <Cpu className="w-3 h-3 text-[#bc13fe]" /> {player.peakNeuralFrequency.toFixed(1)} Hz
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-5 p-3 bg-black/40 border border-white/10 rounded-xl text-[10px] text-white/40 font-mono leading-relaxed text-center">
        Leaderboard updates every block. Maintain extreme cardiac synchronization to stay ranked in the top tier!
      </div>
    </div>
  );
}
