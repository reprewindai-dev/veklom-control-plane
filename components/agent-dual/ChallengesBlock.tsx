import React from 'react';
import { DailyChallenge } from './types';
import { Award, CheckCircle2, Lock, Sparkles, Coins, Flame, Cpu, Trophy, ArrowRight } from 'lucide-react';

interface ChallengesBlockProps {
  challenges: DailyChallenge[];
  onClaimReward: (id: string) => void;
  onClaimAll: () => void;
  bankroll: number;
}

export function ChallengesBlock({ challenges, onClaimReward, onClaimAll, bankroll }: ChallengesBlockProps) {
  const completedCount = challenges.filter(c => c.completed).length;
  const claimedCount = challenges.filter(c => c.claimed).length;
  const unclaimedCount = challenges.filter(c => c.completed && !c.claimed).length;
  const totalRewardsPotential = challenges.reduce((acc, c) => acc + c.rewardUsdc, 0);
  const totalRewardsClaimed = challenges.filter(c => c.claimed).reduce((acc, c) => acc + c.rewardUsdc, 0);

  const getChallengeIcon = (type: DailyChallenge['type']) => {
    switch (type) {
      case 'streak':
        return <Flame className="w-5 h-5 text-orange-500" />;
      case 'wager_milestone':
        return <Coins className="w-5 h-5 text-amber-500" />;
      case 'tie_win':
        return <Trophy className="w-5 h-5 text-emerald-500" />;
      case 'bot_cycles':
        return <Cpu className="w-5 h-5 text-blue-500 animate-pulse" />;
      case 'high_roller':
        return <Sparkles className="w-5 h-5 text-pink-500" />;
      default:
        return <Award className="w-5 h-5 text-indigo-500" />;
    }
  };

  return (
    <div id="challenges-block-container" className="space-y-6">
      
      {/* Overview Stat Panel - Bento Grid Style */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Stat 1: Total Progress */}
        <div className="bg-[#0d0f16] border border-white/10 rounded-lg p-4 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block font-bold">
              Mission Completion
            </span>
            <div className="text-2xl font-black font-mono text-white">
              {completedCount} <span className="text-slate-600 text-lg">/ {challenges.length}</span>
            </div>
            <p className="text-[9px] font-mono text-slate-400">Daily objectives secured</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* Stat 2: Total Claimed */}
        <div className="bg-[#0d0f16] border border-white/10 rounded-lg p-4 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block font-bold">
              Bonus Claimed
            </span>
            <div className="text-2xl font-black font-mono text-emerald-400">
              ${totalRewardsClaimed.toFixed(2)} <span className="text-slate-600 text-[11px]">USDC</span>
            </div>
            <p className="text-[9px] font-mono text-slate-400">Credited to active bankroll</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Coins className="w-6 h-6" />
          </div>
        </div>

        {/* Stat 3: Potential Reward */}
        <div className="bg-[#0d0f16] border border-white/10 rounded-lg p-4 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block font-bold">
              Cumulative Reward Pool
            </span>
            <div className="text-2xl font-black font-mono text-amber-500">
              ${totalRewardsPotential.toFixed(2)} <span className="text-slate-600 text-[11px]">USDC</span>
            </div>
            <p className="text-[9px] font-mono text-slate-400">Max potential daily drop</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
            <Trophy className="w-6 h-6" />
          </div>
        </div>

        {/* Stat 4: Action Block */}
        <div className="bg-[#0d0f16] border border-white/10 rounded-lg p-4 flex flex-col justify-between shadow-md">
          <div className="space-y-1 flex items-center justify-between">
            <div>
              <span className="text-[9px] font-mono text-slate-500 uppercase block font-bold">Unclaimed Drops</span>
              <div className="text-lg font-black font-mono text-blue-400">{unclaimedCount} pending</div>
            </div>
          </div>
          <button
            disabled={unclaimedCount === 0}
            onClick={onClaimAll}
            className="w-full mt-2 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:scale-95 disabled:opacity-30 disabled:scale-100 transition-all text-black font-mono text-[10px] uppercase font-black rounded-md tracking-wider flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" /> Claim All Rewards
          </button>
        </div>

      </div>

      {/* Main Challenge List Panel */}
      <div className="bg-[#0b0c10] border border-white/10 rounded-lg p-5 space-y-4 shadow-lg shadow-blue-500/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
          <div>
            <h3 className="text-sm font-bold font-sans text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
              Daily Challenges Registry
            </h3>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
              Fulfill live cryptographic milestones to deploy additional USDC from protocol reserves.
            </p>
          </div>
          <span className="text-[9px] font-mono bg-blue-500/10 text-blue-400 tracking-wider py-1 px-2.5 rounded border border-blue-500/20 uppercase">
            Resets daily at 00:00 UTC
          </span>
        </div>

        <div className="space-y-4">
          {challenges.map((challenge) => {
            const percentage = Math.min(100, Math.floor((challenge.currentValue / challenge.target) * 100));
            
            return (
              <div 
                key={challenge.id}
                className={`p-4 rounded-lg border transition-all ${
                  challenge.claimed
                    ? 'bg-[#06070a]/40 border-white/[0.03] opacity-60'
                    : challenge.completed
                    ? 'bg-[#0d1512]/60 border-emerald-500/30 hover:border-emerald-500/50 shadow-md shadow-emerald-500/2'
                    : 'bg-[#0d0f16]/90 border-white/5 hover:border-white/10'
                } flex flex-col md:flex-row md:items-center justify-between gap-4`}
              >
                
                {/* Challenge Description & Info */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div className={`p-2.5 rounded-lg border shrink-0 ${
                    challenge.claimed
                      ? 'bg-black/40 border-white/5'
                      : challenge.completed
                      ? 'bg-emerald-500/10 border-emerald-500/20'
                      : 'bg-black/30 border-white/10'
                  }`}>
                    {getChallengeIcon(challenge.type)}
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className={`text-xs font-bold leading-none ${challenge.claimed ? 'text-slate-400 line-through' : 'text-white'}`}>
                        {challenge.title}
                      </h4>
                      {challenge.claimed ? (
                        <span className="text-[8px] font-mono font-bold uppercase tracking-wider bg-slate-500/10 text-slate-400 px-1.5 py-0.5 rounded border border-white/5">
                          ✓ Claimed
                        </span>
                      ) : challenge.completed ? (
                        <span className="text-[8px] font-mono font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30 animate-pulse">
                          🔥 Ready to Claim
                        </span>
                      ) : (
                        <span className="text-[8px] font-mono font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">
                          In Progress
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal font-sans">
                      {challenge.description}
                    </p>

                    {/* Progress Bar & Numeric Indicator */}
                    <div className="space-y-1.5 pt-1.5 max-w-md">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-slate-500">Progress:</span>
                        <span className={challenge.completed ? 'text-emerald-400 font-bold' : 'text-slate-350'}>
                          {challenge.currentValue.toFixed(challenge.type === 'wager_milestone' || challenge.type === 'high_roller' ? 2 : 0)} / {challenge.target.toFixed(challenge.type === 'wager_milestone' || challenge.type === 'high_roller' ? 2 : 0)} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-black/40 rounded-full border border-white/[0.03] overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 rounded-full ${
                            challenge.claimed
                              ? 'bg-slate-600'
                              : challenge.completed
                              ? 'bg-gradient-to-r from-[#10b981] to-[#059669]'
                              : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reward & Call To Action */}
                <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-3 shrink-0 border-t md:border-t-0 border-white/[0.04] pt-3.5 md:pt-0">
                  <div className="md:text-right font-mono">
                    <span className="text-[8px] uppercase tracking-wider text-slate-500 block">Reward Drop</span>
                    <span className={`text-sm font-black flex items-center gap-1 ${challenge.claimed ? 'text-slate-500' : 'text-[#f59e0b]'}`}>
                      <Coins className="w-3.5 h-3.5" />
                      +${challenge.rewardUsdc.toFixed(2)} USDC
                    </span>
                  </div>

                  {!challenge.completed ? (
                    <button 
                      disabled
                      className="py-1 px-3 border border-white/5 bg-white/[0.02] rounded font-mono text-[9px] uppercase font-bold text-slate-500 cursor-not-allowed flex items-center gap-1"
                    >
                      <Lock className="w-3 h-3" /> Locked
                    </button>
                  ) : challenge.claimed ? (
                    <button 
                      disabled
                      className="py-1 px-3 border border-white/5 bg-slate-500/5 rounded font-mono text-[9px] uppercase font-bold text-slate-500 cursor-not-allowed flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3 text-slate-500" /> Settled
                    </button>
                  ) : (
                    <button
                      onClick={() => onClaimReward(challenge.id)}
                      className="py-1.5 px-4.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black rounded font-mono text-[10px] uppercase font-black tracking-wider transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-md shadow-emerald-500/10 flex items-center gap-1 border border-emerald-400/20"
                    >
                      Claim Drop <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* Cybernetic telemetry checklist box */}
      <div className="bg-[#0d0f16] border border-white/10 rounded-lg p-5 font-mono text-[11px] text-slate-500 shadow-md">
        <div className="flex items-center gap-1.5 text-slate-400 mb-2 uppercase font-bold text-xs">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>// Cryptography Proof of Active Play</span>
        </div>
        <p className="leading-relaxed">
          The Daily challenges system utilizes multi-dimensional verification. In-game streaks, wager sizes, and automated HFT bot triggers update on the fly on base block confirmations. Claiming rewards directly injects new, non-dilutive USDC credits into your balance instantly.
        </p>
      </div>

    </div>
  );
}
