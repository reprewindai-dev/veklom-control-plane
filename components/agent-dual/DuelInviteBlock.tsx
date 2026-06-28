/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DuelSession, DuelPlayer, WalletState } from './types';
import { Users, Copy, Plus, ArrowRight, Zap, CheckCircle2, ShieldAlert, Coins, RefreshCw, LogOut, Swords, Cpu } from 'lucide-react';

interface DuelInviteBlockProps {
  wallet: WalletState;
  activeDuel: DuelSession | null;
  onCreateDuel: () => void;
  onJoinDuel: (id: string) => void;
  onLeaveDuel: () => void;
  onToggleSimulatePeer: () => void;
  onPlaceSimulatedBet: (bets: { player: number; banker: number; tie: number }) => void;
  onSimulatePeerEject: () => void;
  isSimulatedPeerActive: boolean;
  onStartDuelCountdown: () => void;
}

export function DuelInviteBlock({
  wallet,
  activeDuel,
  onCreateDuel,
  onJoinDuel,
  onLeaveDuel,
  onToggleSimulatePeer,
  onPlaceSimulatedBet,
  onSimulatePeerEject,
  isSimulatedPeerActive,
  onStartDuelCountdown,
}: DuelInviteBlockProps) {
  const [joinInput, setJoinInput] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (!activeDuel) return;
    const inviteUrl = `${window.location.origin}${window.location.pathname}?duel=${activeDuel.id}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinInput.trim()) {
      onJoinDuel(joinInput.trim().toUpperCase());
    }
  };

  const myAddress = wallet.address || "0xMyWalletAddressPlaceholder";
  const myPlayer = activeDuel ? activeDuel.players[myAddress] : null;

  // Find the other player (the peer)
  const peerPlayerEntry = activeDuel 
    ? Object.entries(activeDuel.players).find(([addr]) => addr !== myAddress)
    : null;
  const peerAddress = peerPlayerEntry ? peerPlayerEntry[0] : null;
  const peerPlayer = peerPlayerEntry ? peerPlayerEntry[1] : null;

  return (
    <div id="duel-invite-terminal" className="bg-[#090b11] border border-white/10 rounded-lg p-5 font-sans relative overflow-hidden shadow-xl shadow-purple-900/5">
      {/* Glow decorative effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 blur-3xl pointer-events-none" />

      {/* Header section */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Swords className="w-4 h-4 text-purple-400 animate-pulse" />
          <h2 className="text-sm font-bold font-mono tracking-wider text-white uppercase">
            // Real-time Duel Routing Board
          </h2>
        </div>
        {activeDuel && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/30">
            LOBBY SYNC: ACTIVE
          </span>
        )}
      </div>

      {!activeDuel ? (
        <div className="space-y-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            Invite another connected wallet to a real-time <span className="text-purple-400 font-bold">head-to-head duel</span>! 
            You will stake USDC in the exact same consensus round loop, watch the packet sequence stream in unison, and eject independently. 
            The highest surviving ejector secures the ultimate bragging rights and claims a non-dilutive staking bonus.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Create Card */}
            <div className="bg-[#050609] border border-white/5 rounded-lg p-4 flex flex-col justify-between hover:border-purple-500/20 transition-colors">
              <div className="space-y-1 mb-4">
                <h3 className="text-xs font-bold font-mono text-white uppercase flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-purple-400" /> Host Duel Lobby
                </h3>
                <p className="text-[11px] text-slate-500">
                  Generate a unique session ID and share the secure link with a peer.
                </p>
              </div>
              <button
                id="btn-create-duel-lobby"
                onClick={onCreateDuel}
                className="w-full bg-purple-600/90 text-white hover:bg-purple-600 font-bold uppercase tracking-wider text-[11px] py-2 rounded transition-all duration-150 flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Initialize Lobby
              </button>
            </div>

            {/* Join Card */}
            <div className="bg-[#050609] border border-white/5 rounded-lg p-4 flex flex-col justify-between hover:border-purple-500/20 transition-colors">
              <div className="space-y-1 mb-3">
                <h3 className="text-xs font-bold font-mono text-white uppercase flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-400" /> Join Peer Session
                </h3>
                <p className="text-[11px] text-slate-500">
                  Enter a unique session ID or click an invite link to connect immediately.
                </p>
              </div>
              <form onSubmit={handleJoinSubmit} className="space-y-2">
                <div className="flex gap-1.5">
                  <input
                    id="duel-session-input"
                    type="text"
                    value={joinInput}
                    onChange={(e) => setJoinInput(e.target.value)}
                    placeholder="DUEL-XXXX"
                    className="flex-1 bg-[#090b11] border border-white/10 rounded px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-purple-500 uppercase"
                  />
                  <button
                    id="btn-join-duel-lobby"
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase text-[11px] px-3.5 rounded transition-colors flex items-center justify-center"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="bg-[#0c0d13]/50 border border-white/5 rounded-lg p-3.5">
            <h4 className="text-[10px] font-mono text-purple-400 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-purple-400" /> Duel PVP Staking Protocols:
            </h4>
            <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-500">
              <li>Both players synchronize to the exact same pre-shuffled consensus stream sequence.</li>
              <li>Ejections are resolved independently. Ejecting too early secures safe gains but might lose the Duel; waiting too long can trigger a total crash loss!</li>
              <li>You can open this page in a second browser window or tab to play against yourself in real-time.</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Active Lobby Status */}
          <div className="bg-[#050609] border border-white/10 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[9px] font-mono text-slate-500 uppercase block">Active Duel Session ID</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold font-mono text-purple-400 tracking-wider select-all">
                  {activeDuel.id}
                </span>
                <button
                  id="btn-copy-duel-link"
                  onClick={handleCopyLink}
                  title="Copy Invite Link"
                  className="p-1 hover:bg-white/5 rounded text-slate-400 hover:text-white transition-colors"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {!peerPlayer && (
                <button
                  id="btn-simulate-peer-duel"
                  onClick={onToggleSimulatePeer}
                  className="bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 border border-purple-500/30 font-bold uppercase text-[10px] px-3 py-1.5 rounded transition-all flex items-center gap-1.5"
                >
                  <Cpu className="w-3.5 h-3.5" /> Simulate Peer
                </button>
              )}
              <button
                id="btn-leave-duel-lobby"
                onClick={onLeaveDuel}
                className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 font-bold uppercase text-[10px] px-3 py-1.5 rounded transition-all flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" /> Leave Lobby
              </button>
            </div>
          </div>

          {/* Connected Players Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Player 1 (You) */}
            <div className="bg-[#050609] border border-emerald-500/15 rounded-lg p-4 relative">
              <div className="absolute top-2 right-2 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[8px] font-mono text-emerald-400 uppercase font-bold">You (Host)</span>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-[9px] font-mono text-slate-500 uppercase block">Wallet Connection</span>
                  <span className="text-xs font-mono text-white block truncate">
                    {wallet.address || "0xMyWalletAddressPlaceholder"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-950/40 p-2 rounded border border-white/5">
                    <span className="text-[8px] font-mono text-slate-500 uppercase block">USDC Bankroll</span>
                    <span className="text-xs font-bold font-mono text-emerald-400">
                      ${myPlayer ? myPlayer.balanceUsdc.toFixed(2) : wallet.balanceUsdc.toFixed(2)}
                    </span>
                  </div>
                  <div className="bg-slate-950/40 p-2 rounded border border-white/5">
                    <span className="text-[8px] font-mono text-slate-500 uppercase block">Active Stake</span>
                    <span className="text-xs font-bold font-mono text-purple-400">
                      ${myPlayer ? myPlayer.wagerAmount.toFixed(2) : "0.00"}
                    </span>
                  </div>
                </div>

                {/* Bets display */}
                <div className="space-y-1">
                  <span className="text-[8px] font-mono text-slate-500 uppercase block">My Prediction Stakes</span>
                  <div className="flex gap-1.5">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded flex-1 text-center border ${myPlayer && myPlayer.bets.player > 0 ? 'bg-blue-500/15 border-blue-500/30 text-blue-400' : 'bg-white/5 border-white/5 text-slate-500'}`}>
                      Agent A: ${myPlayer ? myPlayer.bets.player.toFixed(2) : "0.00"}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded flex-1 text-center border ${myPlayer && myPlayer.bets.banker > 0 ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' : 'bg-white/5 border-white/5 text-slate-500'}`}>
                      Agent B: ${myPlayer ? myPlayer.bets.banker.toFixed(2) : "0.00"}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded flex-1 text-center border ${myPlayer && myPlayer.bets.tie > 0 ? 'bg-purple-500/15 border-purple-500/30 text-purple-400' : 'bg-white/5 border-white/5 text-slate-500'}`}>
                      Tie: ${myPlayer ? myPlayer.bets.tie.toFixed(2) : "0.00"}
                    </span>
                  </div>
                </div>

                {/* Action feedback */}
                {myPlayer && (
                  <div className="pt-1.5">
                    {myPlayer.status === 'ready' && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 block text-center font-bold">
                        ✓ Stakes Locked
                      </span>
                    )}
                    {myPlayer.status === 'ejected' && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 block text-center font-bold">
                        ⚡ Ejected at {myPlayer.ejectedMulti?.toFixed(2)}x (Payout: ${myPlayer.payout.toFixed(2)})
                      </span>
                    )}
                    {myPlayer.status === 'crashed' && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 block text-center font-bold">
                        ⚠️ Network Crashed (Stake Burned)
                      </span>
                    )}
                    {myPlayer.status === 'pending' && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-500/10 text-slate-400 border border-slate-500/20 block text-center">
                        Waiting for bet allocation...
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Player 2 (Peer / Simulated) */}
            <div className={`bg-[#050609] border rounded-lg p-4 relative ${peerPlayer ? 'border-purple-500/15' : 'border-dashed border-white/10'}`}>
              {peerPlayer ? (
                <>
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
                    <span className="text-[8px] font-mono text-purple-400 uppercase font-bold">
                      {isSimulatedPeerActive ? "Simulated Peer" : "Connected Peer"}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-[9px] font-mono text-slate-500 uppercase block">Peer Address</span>
                      <span className="text-xs font-mono text-white block truncate select-all">
                        {peerAddress}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-950/40 p-2 rounded border border-white/5">
                        <span className="text-[8px] font-mono text-slate-500 uppercase block">USDC Bankroll</span>
                        <span className="text-xs font-bold font-mono text-emerald-400">
                          ${peerPlayer.balanceUsdc.toFixed(2)}
                        </span>
                      </div>
                      <div className="bg-slate-950/40 p-2 rounded border border-white/5">
                        <span className="text-[8px] font-mono text-slate-500 uppercase block">Active Stake</span>
                        <span className="text-xs font-bold font-mono text-purple-400">
                          ${peerPlayer.wagerAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Bets display */}
                    <div className="space-y-1">
                      <span className="text-[8px] font-mono text-slate-500 uppercase block">Peer Prediction Stakes</span>
                      <div className="flex gap-1.5">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded flex-1 text-center border ${peerPlayer.bets.player > 0 ? 'bg-blue-500/15 border-blue-500/30 text-blue-400' : 'bg-white/5 border-white/5 text-slate-500'}`}>
                          Agent A: ${peerPlayer.bets.player.toFixed(2)}
                        </span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded flex-1 text-center border ${peerPlayer.bets.banker > 0 ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' : 'bg-white/5 border-white/5 text-slate-500'}`}>
                          Agent B: ${peerPlayer.bets.banker.toFixed(2)}
                        </span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded flex-1 text-center border ${peerPlayer.bets.tie > 0 ? 'bg-purple-500/15 border-purple-500/30 text-purple-400' : 'bg-white/5 border-white/5 text-slate-500'}`}>
                          Tie: ${peerPlayer.bets.tie.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Simulation Controller controls */}
                    {isSimulatedPeerActive && activeDuel.status === 'lobby' && (
                      <div className="bg-purple-500/10 border border-purple-500/20 p-2 rounded space-y-1.5">
                        <span className="text-[8px] font-mono text-purple-400 uppercase tracking-widest block font-bold">
                          // Simulate Peer Bet:
                        </span>
                        <div className="flex gap-1">
                          <button
                            id="btn-sim-bet-a"
                            onClick={() => onPlaceSimulatedBet({ player: 5, banker: 0, tie: 0 })}
                            className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 font-bold text-[9px] py-1 rounded flex-1 border border-blue-500/20 uppercase"
                          >
                            Bet $5 Agent A
                          </button>
                          <button
                            id="btn-sim-bet-b"
                            onClick={() => onPlaceSimulatedBet({ player: 0, banker: 5, tie: 0 })}
                            className="bg-amber-600/20 hover:bg-amber-600/40 text-amber-400 font-bold text-[9px] py-1 rounded flex-1 border border-amber-500/20 uppercase"
                          >
                            Bet $5 Agent B
                          </button>
                          <button
                            id="btn-sim-bet-tie"
                            onClick={() => onPlaceSimulatedBet({ player: 0, banker: 0, tie: 2 })}
                            className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 font-bold text-[9px] py-1 rounded flex-1 border border-purple-500/20 uppercase"
                          >
                            Bet $2 Tie
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Actions / Status */}
                    <div className="pt-1.5">
                      {peerPlayer.status === 'ready' && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 block text-center font-bold">
                          ✓ Stakes Locked
                        </span>
                      )}
                      {peerPlayer.status === 'ejected' && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 block text-center font-bold">
                          ⚡ Ejected at {peerPlayer.ejectedMulti?.toFixed(2)}x (Payout: ${peerPlayer.payout.toFixed(2)})
                        </span>
                      )}
                      {peerPlayer.status === 'crashed' && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 block text-center font-bold">
                          ⚠️ Network Crashed (Stake Burned)
                        </span>
                      )}
                      {peerPlayer.status === 'pending' && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-500/10 text-slate-400 border border-slate-500/20 block text-center">
                          Waiting for bet allocation...
                        </span>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-6 text-center text-slate-500 space-y-2">
                  <Users className="w-6 h-6 text-slate-600 animate-pulse" />
                  <div>
                    <span className="text-xs font-bold block text-slate-400">Waiting for Peer</span>
                    <span className="text-[10px] block leading-normal px-2">
                      Share the Duel ID above or open a new browser tab/window to connect as Player 2.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Lobby Controller / Action Block */}
          {activeDuel.status === 'lobby' && (
            <div className="bg-slate-950/40 border border-white/5 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400">
                  <Zap className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-white block">Stakes Commit Status</span>
                  <p className="text-[11px] text-slate-500">
                    {!peerPlayer 
                      ? "Waiting for a second player to join the session ID..." 
                      : myPlayer?.status !== 'ready' && peerPlayer?.status !== 'ready'
                      ? "Place wagers on the board to lock in prediction stakes."
                      : myPlayer?.status !== 'ready'
                      ? "Lock in your prediction stake to complete prep phase."
                      : peerPlayer?.status !== 'ready'
                      ? "Waiting for connected peer to lock in stakes..."
                      : "All stakes successfully locked. Core routing synchronizers operational."}
                  </p>
                </div>
              </div>

              {peerPlayer && (
                <button
                  id="btn-initiate-duel-routing"
                  onClick={onStartDuelCountdown}
                  disabled={myPlayer?.status !== 'ready' || peerPlayer?.status !== 'ready'}
                  className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 font-bold uppercase tracking-wider text-xs px-6 py-2.5 rounded transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
                >
                  <Swords className="w-4 h-4" /> Initiate Duel
                </button>
              )}
            </div>
          )}

          {/* countdown mode */}
          {activeDuel.status === 'countdown' && (
            <div className="bg-gradient-to-r from-purple-950/40 to-indigo-950/40 border border-purple-500/20 rounded-lg p-5 flex flex-col items-center justify-center text-center space-y-2">
              <span className="text-[10px] font-mono text-purple-400 tracking-widest uppercase font-bold animate-pulse">
                // Synchronizing Routing Buffers
              </span>
              <div className="text-4xl font-extrabold font-mono text-white animate-bounce">
                {activeDuel.countdownSeconds}s
              </div>
              <p className="text-xs text-slate-400">
                Opening synchronized consensus stream... Prepare independent ejection triggers.
              </p>
            </div>
          )}

          {/* running mode active */}
          {activeDuel.status === 'running' && (
            <div className="bg-gradient-to-r from-purple-950/20 to-blue-950/20 border border-purple-500/20 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold font-mono text-emerald-400 uppercase">Consensus Duel Live</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-mono text-slate-500 block uppercase">Current Multiplier</span>
                  <span className="text-lg font-bold font-mono text-purple-400">
                    {activeDuel.multiplier.toFixed(2)}x
                  </span>
                </div>
              </div>

              {/* Simulated peer ejection controls */}
              {isSimulatedPeerActive && peerPlayer && peerPlayer.status === 'ready' && (
                <div className="bg-purple-950/40 border border-purple-500/20 p-2.5 rounded flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-purple-400 uppercase font-bold tracking-wider block">
                      // Local Simulated Controller:
                    </span>
                    <p className="text-[11px] text-slate-400">
                      As local developer, you can click here to eject the simulated Peer in real-time.
                    </p>
                  </div>
                  <button
                    id="btn-sim-peer-eject"
                    onClick={onSimulatePeerEject}
                    className="bg-gradient-to-r from-purple-600 to-purple-800 text-white hover:from-purple-500 hover:to-purple-700 font-bold uppercase text-[10px] px-4 py-2 rounded transition-all flex items-center gap-1.5 shadow"
                  >
                    <Zap className="w-3.5 h-3.5" /> Eject Peer Now
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Duel Ended Results */}
          {activeDuel.status === 'ended' && (
            <div className="bg-slate-950 border border-purple-500/20 rounded-lg p-5 space-y-4">
              <div className="text-center space-y-1">
                <span className="text-[9px] font-mono text-purple-400 uppercase block tracking-widest font-bold">
                  // Duel Settlement Summary
                </span>
                <h3 className="text-lg font-extrabold text-white uppercase flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Duel Round Concluded
                </h3>
              </div>

              <div className="bg-[#050609] p-4 rounded border border-white/5 space-y-3">
                <div className="grid grid-cols-2 gap-4 divide-x divide-white/5">
                  {/* Your Profit */}
                  <div className="text-center space-y-1">
                    <span className="text-[10px] font-mono text-slate-500 uppercase block">Your Payout</span>
                    <span className={`text-sm font-bold font-mono ${myPlayer && myPlayer.payout > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                      ${myPlayer ? myPlayer.payout.toFixed(2) : "0.00"} USDC
                    </span>
                    <span className="text-[9px] block text-slate-600">
                      {myPlayer && myPlayer.ejectedMulti ? `Ejected at ${myPlayer.ejectedMulti.toFixed(2)}x` : 'Crashed'}
                    </span>
                  </div>

                  {/* Peer Profit */}
                  <div className="text-center space-y-1 pl-4">
                    <span className="text-[10px] font-mono text-slate-500 uppercase block">Peer Payout</span>
                    <span className={`text-sm font-bold font-mono ${peerPlayer && peerPlayer.payout > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                      ${peerPlayer ? peerPlayer.payout.toFixed(2) : "0.00"} USDC
                    </span>
                    <span className="text-[9px] block text-slate-600">
                      {peerPlayer && peerPlayer.ejectedMulti ? `Ejected at ${peerPlayer.ejectedMulti.toFixed(2)}x` : 'Crashed'}
                    </span>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-3 mt-1 text-center">
                  {activeDuel.winnerAddress === myAddress ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded text-xs text-emerald-400 font-bold font-mono">
                      👑 VICTORY! You won the Head-to-Head Duel!
                    </div>
                  ) : activeDuel.winnerAddress === peerAddress ? (
                    <div className="bg-purple-500/10 border border-purple-500/20 p-2 rounded text-xs text-purple-400 font-bold font-mono">
                      🏆 Peer Secured the Winning Duel Ejection!
                    </div>
                  ) : (
                    <div className="bg-slate-500/10 border border-slate-500/20 p-2 rounded text-xs text-slate-400 font-bold font-mono">
                      🤝 DRAW! Both players settled or crashed equally.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2.5">
                <button
                  id="btn-duel-reset"
                  onClick={() => {
                    // Back to lobby
                    onToggleSimulatePeer();
                    onToggleSimulatePeer(); // Toggle to refresh state
                  }}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold uppercase text-[10.5px] py-2 px-4 rounded flex-1 transition-all flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Start New Duel Match
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
