import React, { useState, useEffect } from 'react';
import { TelemetryDuelHand, TelemetryPacket, getPacketDetails } from './types';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  RotateCcw, 
  X, 
  ShieldCheck, 
  Eye, 
  BookOpen, 
  Sparkles, 
  TrendingUp, 
  Coins, 
  Flame,
  ArrowRight,
  HelpCircle,
  Hash
} from 'lucide-react';

interface QuantumReplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  replayData: {
    hand: TelemetryDuelHand;
    bets: { player: number; banker: number; tie: number };
    finalMulti: number;
    ejectedMulti: number | null;
    wager: number;
    payout: number;
    timestamp: string;
  } | null;
}

export function QuantumReplayModal({ isOpen, onClose, replayData }: QuantumReplayModalProps) {
  if (!isOpen || !replayData || !replayData.hand || !Array.isArray(replayData.hand.playerPackets) || !Array.isArray(replayData.hand.bankerPackets) || replayData.hand.playerPackets.length < 2 || replayData.hand.bankerPackets.length < 2) return null;

  const { hand, bets, finalMulti, ejectedMulti, wager, payout, timestamp } = replayData;

  // Build the playback steps dynamically based on whether there were third cards dealt
  // Step 0: Initial Stakes
  // Step 1: Initial deal (Player 1st Card & Banker 1st Card)
  // Step 2: Initial deal completed (Player 2nd Card & Banker 2nd Card)
  // Step 3: Natural evaluation
  // (Optional) Step 4: Player 3rd Card Draw Decision
  // (Optional) Step 5: Banker 3rd Card Draw Decision
  // Step 6: Final score evaluation
  // Step 7: Flight simulation & crash breakdown
  
  interface ReplayStep {
    id: number;
    title: string;
    description: string;
    ruleDetail?: string;
    state: {
      playerPackets: TelemetryPacket[];
      bankerPackets: TelemetryPacket[];
      playerScore: number;
      bankerScore: number;
      visibleCount: number; // number of packets visible (1 to 3) in active lanes
      phase: 'setup' | 'initial_deal' | 'deal_complete' | 'rule_check' | 'final_reveal' | 'simulation';
    };
  }

  const generateSteps = (): ReplayStep[] => {
    const steps: ReplayStep[] = [];
    if (!hand || !Array.isArray(hand.playerPackets) || !Array.isArray(hand.bankerPackets) || hand.playerPackets.length < 2 || hand.bankerPackets.length < 2) {
      return steps;
    }
    const pCards = hand.playerPackets;
    const bCards = hand.bankerPackets;

    // Step 0: Initial Stakes
    steps.push({
      id: 0,
      title: "Tactical Stake Deployment",
      description: "Initial micropayment allocations are committed to the network lanes before dealing.",
      ruleDetail: `Allocated: Player Lane ($${bets.player.toFixed(2)} USDC) | Banker Lane ($${bets.banker.toFixed(2)} USDC) | Tie Lane ($${bets.tie.toFixed(2)} USDC). Total stake: $${wager.toFixed(2)} USDC.`,
      state: {
        playerPackets: [],
        bankerPackets: [],
        playerScore: 0,
        bankerScore: 0,
        visibleCount: 0,
        phase: 'setup'
      }
    });

    // Step 1: First Token Deal
    steps.push({
      id: 1,
      title: "First Active Block Allocation",
      description: "Agent A and Agent B lanes receive their first active ecosystem token block from the pre-shuffled stream.",
      ruleDetail: `Agent A receives block [${pCards[0].value}] of token ${pCards[0].channel} (weight: ${pCards[0].scoreValue}). Agent B receives block [${bCards[0].value}] of token ${bCards[0].channel} (weight: ${bCards[0].scoreValue}).`,
      state: {
        playerPackets: [pCards[0]],
        bankerPackets: [bCards[0]],
        playerScore: pCards[0].scoreValue,
        bankerScore: bCards[0].scoreValue,
        visibleCount: 1,
        phase: 'initial_deal'
      }
    });

    // Step 2: Second Token Deal
    const initialPlayerScore = (pCards[0].scoreValue + pCards[1].scoreValue) % 10;
    const initialBankerScore = (bCards[0].scoreValue + bCards[1].scoreValue) % 10;
    steps.push({
      id: 2,
      title: "Initial Token Routing Sequence Complete",
      description: "Both lanes receive their second ecosystem token block, completing the initial 2-token consensus sequence.",
      ruleDetail: `Agent A receives block [${pCards[1].value}] of token ${pCards[1].channel} -> weight is now ${initialPlayerScore}. Agent B receives block [${bCards[1].value}] of token ${bCards[1].channel} -> weight is now ${initialBankerScore}.`,
      state: {
        playerPackets: [pCards[0], pCards[1]],
        bankerPackets: [bCards[0], bCards[1]],
        playerScore: initialPlayerScore,
        bankerScore: initialBankerScore,
        visibleCount: 2,
        phase: 'deal_complete'
      }
    });

    // Step 3: Natural evaluation / Rule Check
    const hasNatural = initialPlayerScore >= 8 || initialBankerScore >= 8;
    steps.push({
      id: 3,
      title: "Natural Consensus Evaluation",
      description: "The protocol checks for a 'Natural Weight Threshold' (score of 8 or 9) which triggers immediate block settlement.",
      ruleDetail: hasNatural 
        ? `Natural Target Achieved! Agent A has ${initialPlayerScore} weight, Agent B has ${initialBankerScore} weight. Stand-off rules active. No further token blocks dispatched.`
        : `No natural threshold weights (8 or 9) detected. Agent A lane has ${initialPlayerScore} weight and Agent B has ${initialBankerScore} weight. Standard third-token block routing initiated.`,
      state: {
        playerPackets: [pCards[0], pCards[1]],
        bankerPackets: [bCards[0], bCards[1]],
        playerScore: initialPlayerScore,
        bankerScore: initialBankerScore,
        visibleCount: 2,
        phase: 'rule_check'
      }
    });

    let currentPCards = [pCards[0], pCards[1]];
    let currentBCards = [bCards[0], bCards[1]];
    let currentPScore = initialPlayerScore;
    let currentBScore = initialBankerScore;
    let stepCount = 4;

    // Step 4: Player 3rd Card (if applicable)
    const playerDrewThird = pCards.length === 3;
    if (playerDrewThird) {
      currentPCards = [pCards[0], pCards[1], pCards[2]];
      currentPScore = hand.playerScore;
      steps.push({
        id: stepCount++,
        title: "Agent A Third Token Allocation",
        description: "Agent A weight is 5 or less, which mandates an automatic third token block routing.",
        ruleDetail: `Agent A draws block [${pCards[2].value}] of token ${pCards[2].channel} (weight: ${pCards[2].scoreValue}), recalculating total weight to ${currentPScore} (${initialPlayerScore} + ${pCards[2].scoreValue} % 10).`,
        state: {
          playerPackets: [...currentPCards],
          bankerPackets: [...currentBCards],
          playerScore: currentPScore,
          bankerScore: currentBScore,
          visibleCount: 3,
          phase: 'rule_check'
        }
      });
    } else if (!hasNatural) {
      steps.push({
        id: stepCount++,
        title: "Agent A Consensus Stabilizes",
        description: "Agent A weight is 6 or 7, which dictates a mandatory Stand (no third token block routed).",
        ruleDetail: `Agent A stays with a weight of ${currentPScore}. Agent B will draw on 5 or less, and stand on 6 or 7.`,
        state: {
          playerPackets: [...currentPCards],
          bankerPackets: [...currentBCards],
          playerScore: currentPScore,
          bankerScore: currentBScore,
          visibleCount: 2,
          phase: 'rule_check'
        }
      });
    }

    // Step 5: Banker 3rd Card (if applicable)
    const bankerDrewThird = bCards.length === 3;
    if (bankerDrewThird) {
      currentBCards = [bCards[0], bCards[1], bCards[2]];
      currentBScore = hand.bankerScore;
      
      let bankerExplanation = "";
      if (!playerDrewThird) {
        bankerExplanation = `Agent B weight is ${initialBankerScore} (5 or less) while Agent A stood. Agent B draws third block.`;
      } else {
        const p3Value = pCards[2].scoreValue;
        bankerExplanation = `Agent B weight is ${initialBankerScore}. Agent A third block weight was ${p3Value}. Under formal protocols, Agent B must draw an additional block.`;
      }

      steps.push({
        id: stepCount++,
        title: "Agent B Third Token Allocation",
        description: "Agent B draws a third token block based on complex consensus routing protocols.",
        ruleDetail: `${bankerExplanation} Agent B draws block [${bCards[2].value}] of token ${bCards[2].channel} (weight: ${bCards[2].scoreValue}) -> total weight is now ${currentBScore}.`,
        state: {
          playerPackets: [...currentPCards],
          bankerPackets: [...currentBCards],
          playerScore: currentPScore,
          bankerScore: currentBScore,
          visibleCount: 3,
          phase: 'rule_check'
        }
      });
    } else if (!hasNatural) {
      let bankerStandExplanation = "";
      if (!playerDrewThird) {
        bankerStandExplanation = `Agent B has ${initialBankerScore} weight (6 or 7) and must stand.`;
      } else {
        bankerStandExplanation = `Agent B has ${initialBankerScore} weight and Agent A's third block weight was ${pCards[2].scoreValue}, which dictates Stand according to the consensus matrix.`;
      }
      steps.push({
        id: stepCount++,
        title: "Agent B Consensus Stabilizes",
        description: "Agent B stands according to the formal protocol consensus rules.",
        ruleDetail: `${bankerStandExplanation} Agent B weight stays at ${currentBScore}.`,
        state: {
          playerPackets: [...currentPCards],
          bankerPackets: [...currentBCards],
          playerScore: currentPScore,
          bankerScore: currentBScore,
          visibleCount: playerDrewThird ? 3 : 2,
          phase: 'rule_check'
        }
      });
    }

    // Step 6: Final Consensus Evaluation
    steps.push({
      id: stepCount++,
      title: "Consensus Settlement",
      description: "The final lane weights are compared and the winning lane is declared.",
      ruleDetail: `Player Score: ${hand.playerScore} | Banker Score: ${hand.bankerScore}. Outcome: ${hand.outcome.toUpperCase()}.`,
      state: {
        playerPackets: [...pCards],
        bankerPackets: [...bCards],
        playerScore: hand.playerScore,
        bankerScore: hand.bankerScore,
        visibleCount: 3,
        phase: 'final_reveal'
      }
    });

    // Step 7: Flight Simulation
    steps.push({
      id: stepCount++,
      title: "Cyber Crash Simulation",
      description: "Analysis of the flight multiplier and user's decision timing.",
      ruleDetail: ejectedMulti 
        ? `You ejected at ${ejectedMulti.toFixed(2)}x, but lost because the winning lane did not match your bet. The crash occurred at ${finalMulti.toFixed(2)}x.`
        : `The system crashed at ${finalMulti.toFixed(2)}x. You did not eject in time, resulting in a total loss.`,
      state: {
        playerPackets: [...pCards],
        bankerPackets: [...bCards],
        playerScore: hand.playerScore,
        bankerScore: hand.bankerScore,
        visibleCount: 3,
        phase: 'simulation'
      }
    });

    return steps;
  };

  const steps = generateSteps();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const currentStep = steps[currentStepIndex];

  // Auto playback effect
  useEffect(() => {
    let timer: any = null;
    if (isPlaying) {
      timer = setInterval(() => {
        if (currentStepIndex < steps.length - 1) {
          setCurrentStepIndex(prev => prev + 1);
        } else {
          setIsPlaying(false);
        }
      }, 1800);
    }
    return () => clearInterval(timer);
  }, [isPlaying, currentStepIndex, steps.length]);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleReset = () => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };

  // Educational Strategy Analysis
  const getBettingFeedback = () => {
    const playerBet = bets.player;
    const bankerBet = bets.banker;
    const tieBet = bets.tie;

    let analysis = "";
    let riskFactor = "Balanced";
    let edgeMsg = "";

    if (tieBet > playerBet && tieBet > bankerBet) {
      riskFactor = "Speculative / High Risk";
      edgeMsg = "Tie bets pay a high 8:1 (9x return), but carry a 14.36% house edge. This is mathematically inefficient for long-term consistency.";
    } else if (bankerBet > playerBet) {
      riskFactor = "Conservative / Analytical";
      edgeMsg = "The Banker lane carries the lowest house edge in Agent Duel at 1.06%. Placing stakes here is statistically optimal over large cycles.";
    } else {
      riskFactor = "Standard Tactical";
      edgeMsg = "The Player lane has a thin 1.24% house edge. It pays a full 1:1 (2x return) without commission charges, making it a solid tactical option.";
    }

    if (hand.outcome === 'player' && playerBet > 0) {
      analysis = `Correct lane selection! You backed Vector North (Player) which won ${hand.playerScore} to ${hand.bankerScore}. However, you failed to secure profit due to flight ejection timing.`;
    } else if (hand.outcome === 'banker' && bankerBet > 0) {
      analysis = `Correct lane selection! You backed Quiet Switch (Banker) which won ${hand.bankerScore} to ${hand.playerScore}. However, you failed to secure profit due to flight ejection timing.`;
    } else if (hand.outcome === 'tie' && tieBet > 0) {
      analysis = `Outstanding lane selection! You predicted the Rare Tie which settled successfully! However, you failed to secure profit due to flight ejection timing.`;
    } else {
      const placedLanes = [];
      if (playerBet > 0) placedLanes.push("Player");
      if (bankerBet > 0) placedLanes.push("Banker");
      if (tieBet > 0) placedLanes.push("Tie");
      
      analysis = `Mismatch error. You backed [${placedLanes.join(', ')}] but the round settled on [${hand.outcome.toUpperCase()}]. In Agent Duel, even if you eject, your wager only wins if it matches the final round outcome.`;
    }

    return { analysis, riskFactor, edgeMsg };
  };

  const getEjectionFeedback = () => {
    const { riskFactor } = getBettingFeedback();
    
    if (ejectedMulti) {
      return {
        rating: "Over-Cautious / Defensive",
        percentage: "Conservative (80% Safety First)",
        msg: `You withdrew safely at ${ejectedMulti.toFixed(2)}x, but did not hold matching bets for the winning lane. Since the lane was a mismatch, you lost your stake anyway. Had you matched the winning lane, you would have secured +$${payout.toFixed(2)} USDC.`
      };
    } else {
      const avgCrash = 1.80;
      const severity = finalMulti < 1.20 ? "Instant Spike Collapse" : "Velocity Cap Out";
      const tips = finalMulti < 1.20 
        ? "This crash was an unavoidable low multiplier anomaly. Sustainable strategies imply setting a pre-programmed autoeject at 1.10x to outrun these spikes."
        : `The system reached ${finalMulti.toFixed(2)}x. Statistically, ejections below ${avgCrash}x hold a 62% survival probability. Aiming for smaller, frequent drops secures the bankroll.`;

      return {
        rating: "Greed Threshold Violation",
        percentage: "Zero-Safety (100% Exposure)",
        msg: `System crashed at ${finalMulti.toFixed(2)}x before ejection commands were broadcasted. Your total wager of $${wager.toFixed(2)} USDC was entirely burned. ${tips}`
      };
    }
  };

  const bettingFeedback = getBettingFeedback();
  const ejectionFeedback = getEjectionFeedback();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fadeIn">
      
      {/* Modal Card wrapper */}
      <div className="relative w-full max-w-4xl bg-[#090a0f] border border-white/10 rounded-xl overflow-hidden shadow-2xl shadow-blue-500/10 flex flex-col max-h-[90vh]">
        
        {/* Futuristic Grid Header */}
        <div className="bg-gradient-to-r from-blue-950/40 to-slate-950 border-b border-white/10 p-4.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Eye className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold font-sans text-white uppercase tracking-wider">
                  Quantum Replay & Transparency Audit
                </h2>
                <span className="text-[8px] font-mono font-bold uppercase tracking-widest px-1.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded">
                  Loss Debriefing
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                Block verification of deal timestamp {timestamp} • Stake: ${wager.toFixed(2)} USDC
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Outer Split Panels */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* LEFT SIDE: Interactive Simulator (8 columns) */}
          <div className="lg:col-span-8 space-y-4 flex flex-col justify-between">
            
            {/* Simulation Player Container */}
            <div className="bg-[#050609] border border-white/5 rounded-lg p-5 flex-1 flex flex-col justify-between min-h-[360px]">
              
              {/* Step Title Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3">
                <div className="space-y-1">
                  <span className="text-[8px] font-mono text-blue-400 uppercase tracking-widest font-bold">
                    [ Step {currentStepIndex + 1} of {steps.length} ] — {currentStep.title}
                  </span>
                  <p className="text-xs text-slate-350 leading-relaxed font-sans font-medium">
                    {currentStep.description}
                  </p>
                </div>
                <div className="text-[10px] font-mono bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 uppercase shrink-0">
                  {currentStep.state.phase.replace('_', ' ')}
                </div>
              </div>

              {/* Telemetry Duel Layout visualization for the current step */}
              <div className="grid grid-cols-2 gap-4 py-3 my-auto">
                
                {/* PLAYER SPACE */}
                <div className={`p-4 rounded border transition-all ${
                  currentStep.state.phase !== 'setup' && hand.outcome === 'player' && currentStepIndex === steps.length - 1
                    ? 'bg-blue-500/10 border-blue-500 shadow-md shadow-blue-500/10'
                    : 'bg-[#0b0c11]/80 border-white/5'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold text-blue-400 font-sans flex items-center gap-1">
                      ⚡ AGENT A (Vector North)
                    </span>
                    {currentStep.state.playerPackets.length > 0 && (
                      <span className="text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">
                        {currentStep.state.playerScore} Pts
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2 min-h-[84px] items-center justify-center bg-black/40 rounded p-2.5 border border-white/[0.02]">
                    {currentStep.state.playerPackets.length > 0 ? (
                      currentStep.state.playerPackets.map((packet, idx) => {
                        const details = getPacketDetails(packet);
                        return (
                          <div 
                            key={idx} 
                            className={`w-12 h-16 rounded border flex flex-col justify-between p-1.5 select-none font-mono text-center shadow-lg transition-all animate-[scaleIn_0.15s_ease-out] ${details.borderClass}`}
                            style={{ boxShadow: `0 4px 10px ${details.glowColor}` }}
                          >
                            <div className="text-[7px] font-bold text-slate-500 text-left leading-none">
                              {details.label}
                            </div>
                            <div className={`text-[10px] font-black tracking-tighter ${details.colorClass}`}>
                              {details.hexValue}
                            </div>
                            <div className="text-[7px] text-right text-slate-400 font-extrabold leading-none">
                              WGT:{packet.scoreValue}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <span className="text-[9px] font-mono text-slate-600 uppercase tracking-wider">// Stakes placed</span>
                    )}
                  </div>
                  <div className="text-center mt-2 font-mono text-[9px] text-slate-500">
                    Active Bet: <span className="text-white font-bold">${bets.player.toFixed(2)} USDC</span>
                  </div>
                </div>

                {/* BANKER SPACE */}
                <div className={`p-4 rounded border transition-all ${
                  currentStep.state.phase !== 'setup' && hand.outcome === 'banker' && currentStepIndex === steps.length - 1
                    ? 'bg-amber-500/10 border-amber-500 shadow-md shadow-amber-500/10'
                    : 'bg-[#0b0c11]/80 border-white/5'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold text-amber-500 font-sans flex items-center gap-1">
                      🌀 AGENT B (Quiet Switch)
                    </span>
                    {currentStep.state.bankerPackets.length > 0 && (
                      <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20">
                        {currentStep.state.bankerScore} Pts
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2 min-h-[84px] items-center justify-center bg-black/40 rounded p-2.5 border border-white/[0.02]">
                    {currentStep.state.bankerPackets.length > 0 ? (
                      currentStep.state.bankerPackets.map((packet, idx) => {
                        const details = getPacketDetails(packet);
                        return (
                          <div 
                            key={idx} 
                            className={`w-12 h-16 rounded border flex flex-col justify-between p-1.5 select-none font-mono text-center shadow-lg transition-all animate-[scaleIn_0.15s_ease-out] ${details.borderClass}`}
                            style={{ boxShadow: `0 4px 10px ${details.glowColor}` }}
                          >
                            <div className="text-[7px] font-bold text-slate-500 text-left leading-none">
                              {details.label}
                            </div>
                            <div className={`text-[10px] font-black tracking-tighter ${details.colorClass}`}>
                              {details.hexValue}
                            </div>
                            <div className="text-[7px] text-right text-slate-400 font-extrabold leading-none">
                              WGT:{packet.scoreValue}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <span className="text-[9px] font-mono text-slate-600 uppercase tracking-wider">// Stakes placed</span>
                    )}
                  </div>
                  <div className="text-center mt-2 font-mono text-[9px] text-slate-500">
                    Active Bet: <span className="text-white font-bold">${bets.banker.toFixed(2)} USDC</span>
                  </div>
                </div>

              </div>

              {/* Step Rule Text Explanation Box */}
              <div className="bg-[#0b0d14] border border-blue-500/10 rounded p-3 text-[11px] font-mono text-slate-400 mt-2">
                <div className="flex items-start gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-blue-400 block tracking-wider">// Rule Compliance Engine Log</span>
                    <p className="leading-relaxed text-slate-300">{currentStep.ruleDetail}</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Playback Controls and Slider */}
            <div className="bg-[#0b0c10] border border-white/10 rounded-lg p-3.5 space-y-3">
              
              {/* Timeline Slider */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-500 shrink-0">Progress:</span>
                <div className="flex-1 h-1.5 bg-black rounded-full overflow-hidden flex relative">
                  {steps.map((step, idx) => (
                    <button
                      key={step.id}
                      onClick={() => {
                        setCurrentStepIndex(idx);
                        setIsPlaying(false);
                      }}
                      className={`flex-1 h-full border-r border-black/30 transition-colors ${
                        idx <= currentStepIndex
                          ? 'bg-blue-500'
                          : 'bg-slate-800 hover:bg-slate-700'
                      }`}
                      title={step.title}
                    />
                  ))}
                </div>
                <span className="text-[10px] font-mono text-blue-400 shrink-0">
                  {Math.floor(((currentStepIndex + 1) / steps.length) * 100)}%
                </span>
              </div>

              {/* Action Control Panel */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={currentStepIndex === 0}
                    onClick={handlePrev}
                    className="p-2 border border-white/5 bg-white/5 hover:bg-white/10 active:scale-95 text-slate-350 hover:text-white rounded disabled:opacity-20 disabled:scale-100 transition-all cursor-pointer"
                    title="Previous step"
                  >
                    <SkipBack className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="py-1.5 px-4 bg-blue-500 hover:bg-blue-400 active:scale-95 text-black rounded font-mono text-[10px] uppercase font-black tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                    title={isPlaying ? "Pause simulation" : "Play simulation"}
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-3 h-3 fill-black" /> Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 fill-black" /> Play Replay
                      </>
                    )}
                  </button>

                  <button
                    disabled={currentStepIndex === steps.length - 1}
                    onClick={handleNext}
                    className="p-2 border border-white/5 bg-white/5 hover:bg-white/10 active:scale-95 text-slate-350 hover:text-white rounded disabled:opacity-20 disabled:scale-100 transition-all cursor-pointer"
                    title="Next step"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={handleReset}
                    className="p-2 border border-white/5 bg-white/5 hover:bg-white/10 active:scale-95 text-slate-350 hover:text-white rounded transition-all cursor-pointer"
                    title="Reset to step 1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-[9px] font-mono text-slate-500 uppercase tracking-wider hidden sm:block">
                  Press PLAY to auto-advance round frames
                </div>
              </div>

            </div>

          </div>

          {/* RIGHT SIDE: Educational Feedback & Cryptographic Deck Audit (4 columns) */}
          <div className="lg:col-span-4 space-y-4 flex flex-col justify-between">
            
            {/* Strategy Feedback Panels */}
            <div className="space-y-4">
              
              {/* Panel 1: Wager Analysis */}
              <div className="bg-[#0b0c10] border border-white/10 rounded-lg p-4 space-y-3 shadow-md">
                <div className="flex items-center gap-1.5 border-b border-white/5 pb-2">
                  <Coins className="w-4 h-4 text-amber-500" />
                  <span className="text-[10px] font-mono uppercase font-black tracking-widest text-slate-300">
                    Wager Allocator Review
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between font-mono text-[10px]">
                    <span className="text-slate-500">Risk Profile:</span>
                    <span className="text-amber-500 font-bold">{bettingFeedback.riskFactor}</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed font-sans text-[11px]">
                    {bettingFeedback.analysis}
                  </p>
                  <p className="text-[10px] font-mono bg-[#0c0d13] p-2 rounded border border-white/5 text-slate-500 leading-normal">
                    💡 <span className="text-slate-350">{bettingFeedback.edgeMsg}</span>
                  </p>
                </div>
              </div>

              {/* Panel 2: Flight Ejection Review */}
              <div className="bg-[#0b0c10] border border-white/10 rounded-lg p-4 space-y-3 shadow-md">
                <div className="flex items-center gap-1.5 border-b border-white/5 pb-2">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <span className="text-[10px] font-mono uppercase font-black tracking-widest text-slate-300">
                    Ejection Protocol Review
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between font-mono text-[10px]">
                    <span className="text-slate-500">Patience Quotient:</span>
                    <span className="text-blue-400 font-bold">{ejectionFeedback.rating}</span>
                  </div>
                  <div className="flex items-center justify-between font-mono text-[10px]">
                    <span className="text-slate-500">Crash Point reached:</span>
                    <span className="text-red-400 font-black">{finalMulti.toFixed(2)}x</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed font-sans text-[11px]">
                    {ejectionFeedback.msg}
                  </p>
                </div>
              </div>

              {/* Panel 3: Cryptographic Deck Shoe Audit */}
              <div className="bg-[#0b0c10] border border-white/10 rounded-lg p-4 space-y-3 shadow-md">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] font-mono uppercase font-black tracking-widest text-slate-300">
                      Transparency Shoe Audit
                    </span>
                  </div>
                  <span className="text-[8px] font-mono text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-1 py-0.2 rounded border border-emerald-500/20">
                    Verified
                  </span>
                </div>
                
                <div className="space-y-3 text-xs">
                  <p className="text-slate-500 text-[10px] leading-relaxed">
                    Under the quantum protocol, the pre-shuffled stream sequence was hashed and locked beforehand. This sequence confirms exactly what ecosystem tokens were stacked next in the consensus stream:
                  </p>

                  {/* Upcoming tokens container */}
                  <div className="space-y-1.5">
                    <span className="text-[8px] font-mono uppercase text-slate-500 tracking-wider block font-bold">
                      // Top of the Remaining Ecosystem Token Stream:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {hand.streamSequence ? (
                        hand.streamSequence.slice(0, 7).map((packet, idx) => {
                          const details = getPacketDetails(packet);
                          return (
                            <div 
                              key={idx} 
                              className={`w-9 h-12 rounded border flex flex-col justify-between p-1 select-none font-mono text-center shadow transition-all hover:-translate-y-0.5 group ${details.borderClass}`}
                              title={`Next Segment #${idx + 1} in stream array`}
                            >
                              <div className="text-[6px] font-bold text-slate-500 text-left leading-none">
                                {details.label}
                              </div>
                              <div className={`text-[8px] font-black tracking-tighter ${details.colorClass}`}>
                                {details.hexValue}
                              </div>
                              <div className="text-[5px] text-right text-slate-400 leading-none">
                                WGT:{packet.scoreValue}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <span className="text-[9px] font-mono text-slate-600 font-bold uppercase tracking-wider">// Array offline</span>
                      )}
                    </div>
                  </div>

                  {/* Seed / Cryptography details */}
                  <div className="space-y-2 border-t border-white/5 pt-2.5">
                    <div>
                      <div className="flex items-center justify-between text-[9px] font-mono text-slate-500">
                        <span>Block Verification Seed:</span>
                        <Hash className="w-3 h-3" />
                      </div>
                      <div className="text-[8px] font-mono text-slate-400 bg-black/60 p-1 rounded border border-white/5 select-all break-all leading-normal">
                        {hand.seedHash || "0x000000000000000000000"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] font-mono text-slate-500">
                        Active Salt:
                      </div>
                      <div className="text-[8px] font-mono text-slate-400 bg-black/60 p-1 rounded border border-white/5 select-all break-all leading-normal">
                        {hand.salt || "quantum_duel_salt_0000"}
                      </div>
                    </div>
                    <div className="text-[8px] font-mono text-slate-600 leading-normal text-right">
                      Verification Formula: SHA256(seed + salt)
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* Footer info strip */}
        <div className="bg-[#050608] border-t border-white/5 px-5 py-3 text-right">
          <button
            onClick={onClose}
            className="py-1.5 px-5 bg-white/5 hover:bg-white/10 active:scale-95 text-slate-300 rounded font-mono text-[10px] uppercase font-bold tracking-wider transition-all border border-white/10 hover:text-white cursor-pointer"
          >
            Acknowledge & Close
          </button>
        </div>

      </div>

    </div>
  );
}
