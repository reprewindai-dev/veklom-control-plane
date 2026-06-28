/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { Sparkles, Trophy, CheckCircle2, Zap } from 'lucide-react';

interface HolographicBoardProps {
  calledNumbers: number[];
  playerCard: number[][]; // 5x5 grid [col][row]
  predictedPattern: string;
  onSelectNumber: (num: number) => void;
  selectedNumbers: number[]; // numbers selected by player's neural link
  isOffline: boolean;
  onClaimWin: () => void;
  claimedWins: number;
}

export default function HolographicBoard({
  calledNumbers,
  playerCard,
  predictedPattern,
  onSelectNumber,
  selectedNumbers,
  isOffline,
  onClaimWin,
  claimedWins,
}: HolographicBoardProps) {
  
  // Helper to determine if a cell is marked (called by AI or selected by player)
  const cellStatus = useMemo(() => {
    const status: { [key: number]: { called: boolean; selected: boolean } } = {};
    for (let col = 0; col < 5; col++) {
      for (let row = 0; row < 5; row++) {
        if (col === 2 && row === 2) continue; // FREE space
        const val = playerCard[col]?.[row];
        if (val) {
          status[val] = {
            called: calledNumbers.includes(val),
            selected: selectedNumbers.includes(val),
          };
        }
      }
    }
    return status;
  }, [playerCard, calledNumbers, selectedNumbers]);

  // Check if a cell coordinate is active
  const isCellMarked = (col: number, row: number) => {
    if (col === 2 && row === 2) return true; // FREE Space
    const val = playerCard[col]?.[row];
    if (!val) return false;
    // Marked if called by AI caller OR selected telepathically by user
    return calledNumbers.includes(val) || selectedNumbers.includes(val);
  };

  // Evaluate pattern wins
  const evaluation = useMemo(() => {
    const rows = [0, 1, 2, 3, 4];
    const cols = [0, 1, 2, 3, 4];

    // Check individual rows
    const rowsStatus = rows.map(r => cols.every(c => isCellMarked(c, r)));
    // Check individual cols
    const colsStatus = cols.map(c => rows.every(r => isCellMarked(c, r)));
    
    // Diagonals
    const d1 = [0, 1, 2, 3, 4].every(i => isCellMarked(i, i)); // top-left to bottom-right
    const d2 = [0, 1, 2, 3, 4].every(i => isCellMarked(i, 4 - i)); // top-right to bottom-left

    // Four corners
    const fourCorners = isCellMarked(0, 0) && isCellMarked(4, 0) && isCellMarked(0, 4) && isCellMarked(4, 4);

    // X-Pattern
    const xPattern = d1 && d2;

    // Outer Ring
    const outerRing = 
      cols.every(c => isCellMarked(c, 0)) && // top row
      cols.every(c => isCellMarked(c, 4)) && // bottom row
      rows.every(r => isCellMarked(0, r)) && // left col
      rows.every(r => isCellMarked(4, r));   // right col

    // Check active requested pattern
    let isWon = false;
    const lowerPattern = predictedPattern.toLowerCase();
    
    if (lowerPattern.includes('x-pattern')) {
      isWon = xPattern;
    } else if (lowerPattern.includes('corners')) {
      isWon = fourCorners;
    } else if (lowerPattern.includes('outer') || lowerPattern.includes('ring')) {
      isWon = outerRing;
    } else if (lowerPattern.includes('cross') || lowerPattern.includes('cosmic')) {
      // Cosmic Cross (middle col + middle row)
      isWon = cols.every(c => isCellMarked(c, 2)) && rows.every(r => isCellMarked(2, r));
    } else {
      // Full House or generic: check if any row, col, or diagonal matches
      isWon = rowsStatus.some(Boolean) || colsStatus.some(Boolean) || d1 || d2;
    }

    return {
      isWon,
      rowsStatus,
      colsStatus,
      d1,
      d2,
      fourCorners,
      xPattern,
      outerRing
    };
  }, [playerCard, calledNumbers, selectedNumbers, predictedPattern]);

  return (
    <div id="holographic-board" className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden shadow-[0_0_50px_rgba(0,243,255,0.1)]">
      {/* Absolute Neon Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#00f3ff]/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex w-2.5 h-2.5 rounded-full bg-[#00f3ff] animate-pulse shadow-[0_0_8px_#00f3ff]"></span>
            <h3 className="font-mono text-sm tracking-widest text-[#00f3ff] uppercase">
              Holographic Matrix
            </h3>
          </div>
          <p className="text-xs text-white/50 font-sans mt-0.5">
            Active patterns synchronized on Base.org Network
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-center">
            <div className="text-[9px] font-mono text-[#00f3ff] uppercase">Target Pattern</div>
            <div className="text-xs font-bold text-white tracking-wide uppercase font-sans mt-0.5">
              {predictedPattern}
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-center">
            <div className="text-[9px] font-mono text-[#bc13fe] uppercase">Claims Secure</div>
            <div className="text-xs font-bold text-white tracking-wide font-sans mt-0.5 flex items-center justify-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-yellow-400" /> {claimedWins} Wins
            </div>
          </div>
        </div>
      </div>

      {/* Grid Display */}
      <div className="grid grid-cols-5 gap-3 max-w-md mx-auto relative">
        <div className="absolute top-0 right-4 text-[9px] font-mono text-[#00f3ff]/30 select-none">GRID_ID: 6a20f24cc341f</div>
        
        {/* Column Headers */}
        {['B', 'I', 'N', 'G', 'O'].map((letter) => (
          <div
            key={letter}
            className="text-center font-black text-2xl py-2 rounded-lg text-white/20 font-sans tracking-[0.5em] italic"
          >
            {letter}
          </div>
        ))}

        {/* Board Cells */}
        {[0, 1, 2, 3, 4].map((rowIdx) => (
          <React.Fragment key={`row-${rowIdx}`}>
            {[0, 1, 2, 3, 4].map((colIdx) => {
              const isFree = colIdx === 2 && rowIdx === 2;
              const value = playerCard[colIdx]?.[rowIdx];
              const marked = isCellMarked(colIdx, rowIdx);
              const called = isFree ? true : calledNumbers.includes(value);

              return (
                <button
                  key={`cell-${colIdx}-${rowIdx}`}
                  onClick={() => !isFree && value && onSelectNumber(value)}
                  disabled={isFree || marked}
                  className={`
                    relative aspect-square rounded border flex flex-col items-center justify-center transition-all duration-300 overflow-hidden cursor-pointer group text-2xl font-mono
                    ${isFree 
                      ? 'bg-[#bc13fe]/30 border border-[#bc13fe] text-xs font-bold text-center text-white p-1'
                      : marked
                        ? called
                          ? 'bg-[#00f3ff]/40 border border-[#00f3ff] text-white shadow-[inset_0_0_15px_rgba(0,243,255,0.5)]'
                          : 'bg-[#bc13fe]/30 border border-[#bc13fe] text-white shadow-[inset_0_0_15px_rgba(188,19,254,0.5)]'
                        : 'bg-white/5 border border-white/10 hover:bg-[#00f3ff]/20 text-white/80 hover:text-white'
                    }
                  `}
                >
                  {isFree ? (
                    <div className="flex flex-col items-center">
                      <Sparkles className="w-4 h-4 text-pink-400 animate-pulse" />
                      <span className="text-[9px] font-bold text-white tracking-widest uppercase mt-0.5 font-mono">
                        FREE
                      </span>
                    </div>
                  ) : (
                    <>
                      <span className="z-10">
                        {value ? String(value).padStart(2, '0') : ''}
                      </span>
                      
                      {/* Biometric overlay tags on active items */}
                      {marked && (
                        <span className="absolute bottom-1 text-[7px] font-mono z-10 px-1 rounded opacity-80 scale-90 origin-bottom bg-black/60 text-white">
                          {called ? 'AI' : 'M2M'}
                        </span>
                      )}

                      {/* Cool futuristic background hover lines */}
                      <span className="absolute inset-0 bg-gradient-to-t from-[#00f3ff]/10 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
                    </>
                  )}
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {/* Claim Win Callout */}
      {evaluation.isWon && (
        <div className="mt-6 p-4 bg-black/40 border border-[#ff4e00]/40 rounded-xl text-center shadow-lg animate-bounce">
          <div className="flex justify-center mb-2">
            <CheckCircle2 className="w-8 h-8 text-[#ff4e00]" />
          </div>
          <h4 className="text-md font-bold text-white tracking-wide uppercase font-mono text-[#ff4e00]">
            Winning Pattern Detected!
          </h4>
          <p className="text-xs text-slate-300 font-mono mt-1">
            Holographic verification alignment perfect
          </p>
          <button
            onClick={onClaimWin}
            className="mt-3 bg-[#ff4e00] px-10 py-3 rounded-full text-sm font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(255,78,0,0.4)] text-white hover:brightness-110 cursor-pointer transition-all active:scale-[0.98]"
          >
            BINGO!
          </button>
        </div>
      )}

      {/* Manual Selection Guideline */}
      <div className="mt-4 flex items-center justify-between text-[10px] font-mono text-white/40 px-1 border-t border-white/10 pt-3">
        <span className="flex items-center gap-1">
          <Zap className="w-3 h-3 text-[#00f3ff]" /> Hover cell for quantum prediction
        </span>
        <span>
          Base App ID: {'6a20f24cc341f72c2f573eb5'.substring(0, 8)}...
        </span>
      </div>
    </div>
  );
}
