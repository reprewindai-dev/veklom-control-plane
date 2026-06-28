import React, { useMemo } from 'react';
import { Flame, FlameKindling, Zap, Trophy, Flame as FlameIcon } from 'lucide-react';

interface FlameMeterProps {
  winStreak: number;
}

export const FlameMeter: React.FC<FlameMeterProps> = ({ winStreak }) => {
  const streakLevel = useMemo(() => {
    if (winStreak === 0) return { title: 'Cold Engine', desc: 'No active streak. Initialize arena route.', color: 'text-slate-500', barColor: 'bg-slate-700', bgGlow: 'from-slate-500/0 to-transparent', label: 'STABLE' };
    if (winStreak === 1) return { title: 'First Spark', desc: 'Combustion started. Keep predicting.', color: 'text-orange-400', barColor: 'bg-orange-500 shadow-orange-500/50', bgGlow: 'from-orange-500/5 to-transparent', label: 'IGNITED' };
    if (winStreak === 2) return { title: 'Thermal Build', desc: 'Escrow heat rising. Streak active.', color: 'text-amber-400', barColor: 'bg-amber-500 shadow-amber-500/50', bgGlow: 'from-amber-500/10 to-transparent', label: 'WARMING' };
    if (winStreak === 3) return { title: 'Plasma Blaze', desc: 'Double damage unlocked. Eject sequence pristine.', color: 'text-red-500', barColor: 'bg-red-500 shadow-red-500/50', bgGlow: 'from-red-500/15 to-transparent', label: 'HOT STREAK' };
    if (winStreak === 4) return { title: 'Nuclear fusion', desc: 'Base gas optimizing. Viral multipliers expected.', color: 'text-pink-500', barColor: 'bg-gradient-to-r from-red-500 to-pink-500 shadow-pink-500/50', bgGlow: 'from-pink-500/20 to-transparent', label: 'OVERDRIVE' };
    if (winStreak >= 5 && winStreak < 8) return { title: 'Cosmic Inferno', desc: 'Total protocol domination. Unstoppable state.', color: 'text-purple-400', barColor: 'bg-gradient-to-r from-pink-500 to-purple-500 shadow-purple-500/60', bgGlow: 'from-purple-500/25 to-transparent', label: 'UNSTOPPABLE' };
    return { title: 'Singularity Breach', desc: 'x402 hyper-consensus reached. Base.org Protocol Legend.', color: 'text-cyan-400 animate-pulse', barColor: 'bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-400 shadow-cyan-400/80', bgGlow: 'from-cyan-400/30 via-purple-500/20 to-transparent', label: 'GOD-MODE' };
  }, [winStreak]);

  // Calculate percentage fill up to a target max streak of 8 for complete visual peak
  const percentage = Math.min((winStreak / 8) * 100, 100);

  // Generate embers/particles dynamically based on streak intensity
  const embers = useMemo(() => {
    const count = Math.min(winStreak * 3, 24);
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 2}s`,
      size: Math.random() * 4 + 2,
      duration: `${Math.random() * 1.5 + 1}s`,
    }));
  }, [winStreak]);

  return (
    <div 
      id="flame-meter-panel" 
      className={`relative bg-[#0d0f16] border transition-all duration-300 rounded-lg p-4 overflow-hidden shadow-lg ${
        winStreak > 0 
          ? 'border-orange-500/30 shadow-orange-500/5' 
          : 'border-white/10 shadow-blue-900/5'
      }`}
    >
      {/* Dynamic Glowing Background Accent */}
      <div className={`absolute inset-0 bg-gradient-to-b ${streakLevel.bgGlow} pointer-events-none transition-all duration-500`} />

      {/* Floating Spark Particles */}
      {winStreak > 0 && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {embers.map((ember) => (
            <div
              key={ember.id}
              className={`absolute bottom-0 rounded-full bg-gradient-to-t ${
                winStreak >= 5 ? 'from-purple-400 to-cyan-300' : winStreak >= 3 ? 'from-red-500 to-orange-400' : 'from-orange-500 to-yellow-300'
              } opacity-70`}
              style={{
                left: ember.left,
                width: `${ember.size}px`,
                height: `${ember.size}px`,
                animation: `ember-rise ${ember.duration} infinite ease-out`,
                animationDelay: ember.delay,
              }}
            />
          ))}
        </div>
      )}

      {/* Styled animation for embers */}
      <style>{`
        @keyframes ember-rise {
          0% {
            transform: translateY(0) scale(1) rotate(0deg);
            opacity: 0.8;
          }
          100% {
            transform: translateY(-80px) scale(0) rotate(180deg);
            opacity: 0;
          }
        }
      `}</style>

      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Side: Fire Icon and Streak status text */}
        <div className="flex items-center gap-3.5">
          <div className="relative shrink-0">
            {/* Outer halo pulsing glow */}
            {winStreak > 0 && (
              <span className={`absolute inset-0 rounded-full bg-orange-500/20 animate-ping`} />
            )}
            
            <div className={`p-2.5 rounded-lg border transition-all duration-300 ${
              winStreak >= 5 
                ? 'bg-purple-950/40 border-purple-500/30' 
                : winStreak >= 3 
                ? 'bg-red-950/40 border-red-500/30' 
                : winStreak > 0 
                ? 'bg-orange-950/40 border-orange-500/30' 
                : 'bg-slate-900/60 border-white/5'
            }`}>
              {winStreak >= 5 ? (
                <Trophy className={`w-6 h-6 ${streakLevel.color}`} />
              ) : (
                <Flame className={`w-6 h-6 transition-transform duration-300 ${streakLevel.color} ${winStreak > 0 ? 'scale-110 animate-bounce' : ''}`} />
              )}
            </div>

            {/* Float badge with streak count */}
            {winStreak > 0 && (
              <div className="absolute -top-1.5 -right-1.5 bg-[#050608] border border-orange-500/50 text-orange-400 text-[10px] font-mono font-black rounded-full w-5 h-5 flex items-center justify-center shadow-lg animate-pulse">
                {winStreak}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                {streakLevel.title}
              </h3>
              <span className={`text-[9px] font-black font-mono px-2 py-0.5 rounded tracking-widest leading-none ${
                winStreak >= 5 
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 animate-pulse' 
                  : winStreak >= 3 
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                  : winStreak > 0 
                  ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' 
                  : 'bg-slate-800 text-slate-500 border border-white/5'
              }`}>
                {streakLevel.label}
              </span>
            </div>
            <p className="text-slate-400 font-sans text-xs leading-none">
              {streakLevel.desc}
            </p>
          </div>
        </div>

        {/* Right Side: Visual Meter Bar with Segmented Steps */}
        <div className="flex-1 max-w-md w-full space-y-2">
          <div className="flex justify-between items-end font-mono text-[10px]">
            <span className="text-slate-500 uppercase font-bold">Consensus Heat Rating</span>
            <span className={`font-bold uppercase tracking-wider ${streakLevel.color}`}>
              {winStreak > 0 ? `${(winStreak * 12.5).toFixed(0)}% Thermal Max` : '0% Idle'}
            </span>
          </div>

          {/* Heat Progression bar with Segment division */}
          <div className="relative h-3 bg-black/50 rounded-full border border-white/10 overflow-hidden p-0.5">
            {/* Background segments grids */}
            <div className="absolute inset-y-0 inset-x-2.5 flex justify-between pointer-events-none z-10 opacity-30">
              {[1, 2, 3, 4, 5, 6, 7].map((step) => (
                <div key={step} className="w-[1px] h-full bg-white/40" />
              ))}
            </div>

            {/* Filled streak heat progress */}
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${streakLevel.barColor}`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Level segments indicator ticks */}
          <div className="flex justify-between font-mono text-[9px] text-slate-500 px-1 select-none">
            <span>START</span>
            <span>LEVEL 2</span>
            <span>LEVEL 4</span>
            <span>LEVEL 6</span>
            <span className="text-orange-400 font-black">SUPERNOVA</span>
          </div>
        </div>
      </div>
    </div>
  );
};
