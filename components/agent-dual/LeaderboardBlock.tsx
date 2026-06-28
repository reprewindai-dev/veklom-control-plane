/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { LeaderboardEntry } from '../types';
import { Trophy, Award, Search, TrendingUp } from 'lucide-react';

interface LeaderboardBlockProps {
  entries: LeaderboardEntry[];
  userAddress: string | null;
}

export function LeaderboardBlock({ entries, userAddress }: LeaderboardBlockProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEntries = entries.filter((e) => {
    const term = searchTerm.toLowerCase();
    return (
      e.username.toLowerCase().includes(term) ||
      e.address.toLowerCase().includes(term)
    );
  });

  return (
    <div id="leaderboard-module" className="bg-[#0d0f16] border border-white/10 rounded-lg p-4 relative overflow-hidden shadow-lg shadow-blue-900/5">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          <h2 className="text-sm font-bold font-mono tracking-wider text-white uppercase flex items-center gap-1.5 font-sans">
            Global dApp Competitive Leaderboard
          </h2>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search address/node..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-[#050608] border border-white/10 rounded pl-8 pr-3 py-1 text-xs font-mono text-white focus:outline-none focus:border-blue-500 w-48 placeholder-slate-600"
          />
          <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-2" />
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[11px] font-mono text-slate-300">
          <thead>
            <tr className="border-b border-white/5 text-slate-500 text-left uppercase text-[9px] tracking-widest">
              <th className="pb-2 text-center w-10">PST</th>
              <th className="pb-2">Veklom Node Identity</th>
              <th className="pb-2 text-right">Net Profit</th>
              <th className="pb-2 text-right">Best Multi</th>
              <th className="pb-2 text-center">Streak</th>
              <th className="pb-2 text-right">Lane Bias</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredEntries.map((player) => {
               const isCurrentUser = userAddress && player.address.toLowerCase() === userAddress.toLowerCase();
              return (
                <tr
                  key={player.address}
                  className={`hover:bg-white/[0.01] transition-colors duration-100 ${
                    isCurrentUser ? 'bg-blue-500/5 font-bold border-l-2 border-blue-500' : ''
                  }`}
                >
                  {/* Position */}
                  <td className="py-2.5 text-center">
                    {player.rank <= 3 ? (
                      <span
                        className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold text-black ${
                          player.rank === 1
                            ? 'bg-amber-400'
                            : player.rank === 2
                            ? 'bg-slate-300'
                            : 'bg-amber-700'
                        }`}
                      >
                        {player.rank}
                      </span>
                    ) : (
                      <span className="text-slate-500 font-bold">{player.rank}</span>
                    )}
                  </td>
                  {/* Identity */}
                  <td className="py-2.5 max-w-[150px] truncate">
                    <div className="flex items-center gap-1.5">
                      <span className="text-white font-bold">{player.username}</span>
                      <span className="text-[9px] text-slate-500 font-normal">
                        ({player.address.slice(0, 6)}...{player.address.slice(-4)})
                      </span>
                    </div>
                  </td>
                  {/* Earnings */}
                  <td className="py-2.5 text-right text-emerald-400 font-bold">
                    +${player.totalWonUsdc.toLocaleString()} USDC
                  </td>
                  {/* Best multiplier */}
                  <td className="py-2.5 text-right text-amber-400 font-bold">
                    {player.bestMultiplier.toFixed(2)}x
                  </td>
                  {/* Streak */}
                  <td className="py-2.5 text-center">
                    {player.streak >= 3 ? (
                      <span className="inline-flex items-center gap-0.5 bg-red-500/15 border border-red-500/20 text-red-400 text-[10px] px-1.5 py-0.2 rounded font-bold uppercase animate-pulse">
                        <TrendingUp className="w-2.5 h-2.5" /> {player.streak} FLM
                      </span>
                    ) : (
                      <span className="text-slate-400">{player.streak} rds</span>
                    )}
                  </td>
                  {/* Agent preference */}
                  <td className="py-2.5 text-right">
                    <span
                      className={`text-[9px] uppercase px-1.5 py-0.5 block rounded text-center font-bold ${
                        player.agentPreference === 'Vector North'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : player.agentPreference === 'Quiet Switch'
                          ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                      }`}
                    >
                      {player.agentPreference}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
