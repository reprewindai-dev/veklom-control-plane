/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React, { useState, useEffect, useRef } from 'react';
import { WalletState, LeaderboardEntry, WagerTransaction, EscrowState, PushNotification, TelemetryPacket, TelemetryDuelHand, DailyChallenge, getPacketDetails, DuelSession, DuelPlayer } from '@/components/agent-dual/types';
import { ArenaChart } from '@/components/agent-dual/ArenaChart';
import { WalletBlock } from '@/components/agent-dual/WalletBlock';
import { FacilitatorBlock } from '@/components/agent-dual/FacilitatorBlock';
import { LeaderboardBlock } from '@/components/agent-dual/LeaderboardBlock';
import { NotificationCenter } from '@/components/agent-dual/NotificationCenter';
import { RustCodeViewer } from '@/components/agent-dual/RustCodeViewer';
import { ChallengesBlock } from '@/components/agent-dual/ChallengesBlock';
import { QuantumReplayModal } from '@/components/agent-dual/QuantumReplayModal';
import { DuelInviteBlock } from '@/components/agent-dual/DuelInviteBlock';
import { FlameMeter } from '@/components/agent-dual/FlameMeter';
import { 
  Flame, 
  Coins, 
  HelpCircle, 
  ShieldAlert, 
  TrendingUp, 
  Play, 
  ShieldCheck, 
  Activity, 
  RefreshCw,
  Award,
  BookOpen,
  Cpu,
  Sparkles,
  Eye,
  Swords,
  Settings,
  Tv,
  Search,
  Copy,
  Check
} from 'lucide-react';

// Pre-seeded competitive players for realism
const INITIAL_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, username: "Veklom Prime", address: "0x3a74772e925b54F7dAD7FD95c9Ba30825033f970", totalWonUsdc: 42050, bestMultiplier: 18.52, streak: 5, agentPreference: 'Vector North' },
  { rank: 2, username: "Base Degen Pro", address: "0x6a20f24cc341f72c2f573eb5", totalWonUsdc: 24100, bestMultiplier: 8.41, streak: 3, agentPreference: 'Quiet Switch' },
  { rank: 3, username: "Facilitator Node", address: "0xCC34553b4e6332ffb9C1b61E22436ACA53113D1d", totalWonUsdc: 15890, bestMultiplier: 4.82, streak: 0, agentPreference: 'Balanced' },
  { rank: 4, username: "Gas Guzzling Whale", address: "0x9812A54f42E1BC177aF8125C7cb4bf190e227091", totalWonUsdc: 8400, bestMultiplier: 3.12, streak: 2, agentPreference: 'Vector North' },
  { rank: 5, username: "Arbitrage Runner", address: "0xDf42A8C11ffab4E51CDc77a942B59190e44b9E6B", totalWonUsdc: 3950, bestMultiplier: 2.15, streak: 1, agentPreference: 'Balanced' }
];

const INITIAL_CHALLENGES: DailyChallenge[] = [
  {
    id: "challenge-wager",
    title: "Venture Liquidity Block",
    description: "Commit an accumulated total of $5.00 USDC or more in Agent Duel stream wagers.",
    type: "wager_milestone",
    target: 5.0,
    currentValue: 0.0,
    rewardUsdc: 1.50,
    completed: false,
    claimed: false
  },
  {
    id: "challenge-streak",
    title: "Streak Commandeer",
    description: "Achieve a win/eject streak of at least 3 consecutive successful rounds.",
    type: "streak",
    target: 3,
    currentValue: 0,
    rewardUsdc: 2.00,
    completed: false,
    claimed: false
  },
  {
    id: "challenge-tie",
    title: "Quantum Equilibrium",
    description: "Participate in a round that settles on a TIE outcome (Pays 8:1 - pays out 9x total return).",
    type: "tie_win",
    target: 1,
    currentValue: 0,
    rewardUsdc: 5.00,
    completed: false,
    claimed: false
  },
  {
    id: "challenge-bot",
    title: "HFT Network Routine",
    description: "Trigger the automated M2M HFT bot to run for at least 5 complete cycle iterations.",
    type: "bot_cycles",
    target: 5,
    currentValue: 0,
    rewardUsdc: 1.00,
    completed: false,
    claimed: false
  },
  {
    id: "challenge-roller",
    title: "Whale Node Venture",
    description: "Place a total single wager size of $1.00 USDC or higher in a single dual cycle.",
    type: "high_roller",
    target: 1.00,
    currentValue: 0.0,
    rewardUsdc: 3.50,
    completed: false,
    claimed: false
  }
];

export default function App() {
  // 1. Navigation tab state
  const [activeTab, setActiveTab] = useState<'arena' | 'escrow' | 'rust-specs' | 'challenges' | 'duel' | 'explorer'>('arena');

  // 1b. Duel Invite Real-time States
  const [activeDuel, setActiveDuel] = useState<DuelSession | null>(null);
  const [isSimulatedPeerActive, setIsSimulatedPeerActive] = useState<boolean>(false);
  const channelRef = useRef<BroadcastChannel | null>(null);

  // 1bb. Base Chain Live Simulation States
  const [blockHeight, setBlockHeight] = useState<number>(18429104);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedTxId, setCopiedTxId] = useState<string | null>(null);

  // Live increment blocks with real L2 speed (~2s)
  useEffect(() => {
    const timer = setInterval(() => {
      setBlockHeight((prev) => prev + 1);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  // 1c. Configurable CRT Scanline States
  const [scanlinesEnabled, setScanlinesEnabled] = useState<boolean>(true);
  const [scanlineIntensity, setScanlineIntensity] = useState<number>(0.04);
  const [showDisplaySettings, setShowDisplaySettings] = useState<boolean>(false);

  // 2. Wallet state
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    idWallet: "0x3a74772e925b54F7dAD7FD95c9Ba30825033f970",
    paymentWallet: "0xCC34553b4e6332ffb9C1b61E22436ACA53113D1d",
    network: "Base Mainnet",
    verificationDomain: "veklom-id.vercel.app",
    connected: false,
    balanceEth: 0.145,
    balanceUsdc: 250 // Starting faucet balance in USDC
  });

  // 3. Web3 Escrow Facilitator state
  const [escrow, setEscrow] = useState<EscrowState>({
    totalSecuredUsdc: 145890.30,
    facilitatorFeePercent: 1.50,
    gasPriceGwei: 15,
    contractAddress: "0xCC34553b4e6332ffb9C1b61E22436ACA53113D1d",
    veklomVerified: true
  });

  // 4. Game states
  const [bankroll, setBankroll] = useState(250); // Synchronised with wallet.balanceUsdc
  const [roundIndex, setRoundIndex] = useState(1);
  const [winStreak, setWinStreak] = useState(0);
  const [bestMulti, setBestMulti] = useState(0);

  // Challenges progress state
  const [challenges, setChallenges] = useState<DailyChallenge[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('agent_duel_challenges_v1');
        if (saved) return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("localStorage challenges read error:", e);
    }
    return INITIAL_CHALLENGES;
  });

  useEffect(() => {
    try {
      localStorage.setItem('agent_duel_challenges_v1', JSON.stringify(challenges));
    } catch (e) {
      console.warn("localStorage challenges write error:", e);
    }
  }, [challenges]);

  // High Precision Telemetry Duel States
  const [bets, setBets] = useState<{ player: number; banker: number; tie: number }>({ player: 0, banker: 0, tie: 0 });
  const [activeChip, setActiveChip] = useState<number>(0.10);
  const [previousBets, setPreviousBets] = useState<{ player: number; banker: number; tie: number }>({ player: 0, banker: 0, tie: 0 });
  const [activeHand, setActiveHand] = useState<TelemetryDuelHand | null>(null);
  const [visiblePacketsCount, setVisiblePacketsCount] = useState<number>(0);

  // M2M High frequency bot states
  const [m2mEnabled, setM2mEnabled] = useState<boolean>(false);
  const [m2mStrategy, setM2mStrategy] = useState<'smart' | 'martingale' | 'tie-hunt' | 'random'>('smart');
  const [m2mLogs, setM2mLogs] = useState<{ id: string; time: string; msg: string; type: 'info' | 'success' | 'warn' | 'error' | 'metric' }[]>([]);
  const [m2mSpeed, setM2mSpeed] = useState<number>(1);

  // Computed properties for 100% downstream compatibility
  const wagerAmount = Number((bets.player + bets.banker + bets.tie).toFixed(2));
  const selectedAgent = bets.player >= bets.banker ? 'A' : 'B';
  
  const [phase, setPhase] = useState<'idle' | 'running' | 'crashed' | 'ejected'>('idle');
  const [multiplier, setMultiplier] = useState(1.0);
  const [chartPoints, setChartPoints] = useState<{t: number, m: number}[]>([]);
  const [roundWinner, setRoundWinner] = useState<'A' | 'B' | null>(null);

  // 5. Historical lists & Telemetry push notifications
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [roundFeed, setRoundFeed] = useState<WagerTransaction[]>([]);
  const [lastTenCrashes, setLastTenCrashes] = useState<number[]>([1.45, 2.10, 1.12, 3.50, 1.85, 1.20, 5.40, 1.05, 2.30, 1.60]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(INITIAL_LEADERBOARD);

  // Replay state
  const [lastLostRound, setLastLostRound] = useState<{
    hand: TelemetryDuelHand;
    bets: { player: number; banker: number; tie: number };
    finalMulti: number;
    ejectedMulti: number | null;
    wager: number;
    payout: number;
    timestamp: string;
  } | null>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('agent_duel_last_lost_round_v2');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.hand && Array.isArray(parsed.hand.playerPackets)) {
            return parsed;
          } else {
            // Outdated format or invalid, clear it
            localStorage.removeItem('agent_duel_last_lost_round_v2');
          }
        }
      }
    } catch (e) {
      console.warn("localStorage lastLostRound read error:", e);
    }
    return null;
  });

  const [isReplayModalOpen, setIsReplayModalOpen] = useState(false);

  useEffect(() => {
    try {
      if (lastLostRound) {
        localStorage.setItem('agent_duel_last_lost_round_v2', JSON.stringify(lastLostRound));
      }
    } catch (e) {
      console.warn("localStorage lastLostRound write error:", e);
    }
  }, [lastLostRound]);

  // 6. Game Engine Refs for exact performance loops
  const crashAt = useRef(1.0);
  const timerId = useRef<any>(null);
  const startTime = useRef(0);
  const botTimerId = useRef<any>(null);

  // Refs for M2M persistent telemetry
  const m2mLastResult = useRef<'win' | 'loss' | 'tie' | 'none'>('none');
  const m2mLastWager = useRef<number>(0.05);
  
  // Audio Context lazy init
  const audioCtx = useRef<AudioContext | null>(null);

  // Synchronise bankroll whenever wallet state is loaded
  useEffect(() => {
    if (wallet.connected) {
      setBankroll(wallet.balanceUsdc);
    } else {
      setBankroll(bankroll === 250 ? 250 : bankroll); // Keep current bankroll to allow micro payout increments
    }
  }, [wallet.connected, wallet.balanceUsdc]);

  // Clean-up active intervals and bot timers on unmount
  useEffect(() => {
    return () => {
      if (timerId.current) clearInterval(timerId.current);
      if (botTimerId.current) clearTimeout(botTimerId.current);
    };
  }, []);

  // M2M Automated Bot Routine Loop
  useEffect(() => {
    if (!m2mEnabled) {
      if (botTimerId.current) {
        clearTimeout(botTimerId.current);
        botTimerId.current = null;
      }
      return;
    }

    const runSpeedDelay = Math.max(200, 2500 / m2mSpeed);

    if (phase === 'idle') {
      const makeBotBet = () => {
        if (bankroll <= 0.05) {
          addM2mLog("Bankroll exhausted below micro-par thresholds. Pausing bot.", "error");
          setM2mEnabled(false);
          return;
        }

        let newBets = { player: 0, banker: 0, tie: 0 };
        let strategyName = '';
        let chosenWager = 0.05;

        if (m2mStrategy === 'martingale') {
          strategyName = 'Martingale (Double)';
          if (m2mLastResult.current === 'loss') {
            chosenWager = Math.min(m2mLastWager.current * 2, bankroll, 10.00);
            addM2mLog(`[Bot Loss] Doubling stake: $${chosenWager.toFixed(2)} USDC`, "warn");
          } else {
            chosenWager = 0.05;
            addM2mLog(`[Bot Win/Tie] Restoring base stake: $0.05 USDC`, "info");
          }
          newBets.banker = chosenWager;
          m2mLastWager.current = chosenWager;
        } else if (m2mStrategy === 'tie-hunt') {
          strategyName = 'Tie Hunt (8x)';
          chosenWager = 0.10;
          newBets.tie = chosenWager;
          addM2mLog(`[Bot Hunt] Allocating $0.10 USDC Tie micro-hedge`, "info");
        } else if (m2mStrategy === 'random') {
          strategyName = 'Random Walker';
          const options: ('player'|'banker'|'tie')[] = ['player', 'banker', 'tie'];
          const spot = options[Math.floor(Math.random() * options.length)];
          const chips = [0.01, 0.05, 0.10, 0.25, 1.00];
          chosenWager = chips[Math.floor(Math.random() * chips.length)];
          if (chosenWager > bankroll) chosenWager = 0.01;
          newBets[spot] = chosenWager;
          addM2mLog(`[Bot Rand] Random allocation: $${chosenWager.toFixed(2)} on [${spot.toUpperCase()}]`, "info");
        } else {
          strategyName = 'Smart Adaptive';
          const spot = Math.random() < 0.53 ? 'banker' : 'player'; 
          chosenWager = 0.25;
          if (chosenWager > bankroll) chosenWager = 0.05;
          newBets[spot] = chosenWager;
          if (bankroll > 2.0 && Math.random() < 0.3) {
            newBets.tie = 0.05; 
          }
          addM2mLog(`[Bot Smart] Grid trend bet: $${chosenWager.toFixed(2)} on [${spot.toUpperCase()}]`, "info");
        }

        setBets(newBets);
        addM2mLog(`[HFT Block committed] Stack: $${(newBets.player + newBets.banker + newBets.tie).toFixed(2)} USDC via ${strategyName}`, "metric");

        botTimerId.current = setTimeout(() => {
          setPhase((p) => {
            if (p === 'idle') {
              setTimeout(() => {
                initiateRoute();
              }, 50);
            }
            return p;
          });
        }, 300);
      };

      botTimerId.current = setTimeout(makeBotBet, runSpeedDelay);
    } 
    
    else if (phase === 'running') {
      let targetMulti = 1.35;
      if (m2mStrategy === 'martingale') {
        targetMulti = 1.18; 
      } else if (m2mStrategy === 'tie-hunt') {
        targetMulti = 1.65 + Math.random() * 1.5; 
      } else if (m2mStrategy === 'random') {
        targetMulti = 1.10 + Math.random() * 2.0;
      } else {
        targetMulti = 1.22 + Math.random() * 0.35; 
      }

      const checkAndEject = () => {
        if (multiplier >= targetMulti) {
          addM2mLog(`[Escrow Trigger] Target reached (${targetMulti.toFixed(2)}x near ${multiplier.toFixed(2)}x). Signing eject...`, "success");
          triggerEject();
        } else {
          botTimerId.current = setTimeout(checkAndEject, 100);
        }
      };

      botTimerId.current = setTimeout(checkAndEject, 100);
    } 
    
    else if (phase === 'crashed' || phase === 'ejected') {
      const reloadRound = () => {
        addM2mLog(`Block reconciliations successful. Launching next cycle...`, "info");
        setPhase('idle');
      };
      botTimerId.current = setTimeout(reloadRound, runSpeedDelay * 1.2);
    }

    return () => {
      if (botTimerId.current) clearTimeout(botTimerId.current);
    };
  }, [m2mEnabled, phase, multiplier, bankroll, m2mStrategy, m2mSpeed]);

  // Audio helper function to execute synthesizer sound events
  const playSfx = (freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.15, delay = 0) => {
    try {
      const AudioCtxClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      
      if (!audioCtx.current) {
        audioCtx.current = new AudioCtxClass();
      }
      const ctx = audioCtx.current;
      if (!ctx) return;
      
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = type;
      osc.frequency.value = freq;
      
      gainNode.gain.setValueAtTime(volume, ctx.currentTime + delay);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration);
    } catch (e) {
      // Audio not supported or blocked by user gesture
    }
  };

  const addNotification = (type: 'tx_success' | 'jackpot' | 'collapse' | 'agent_win', message: string, sub: string) => {
    const newNotif: PushNotification = {
      id: Math.random().toString(),
      type,
      message,
      sub,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    setNotifications((prev) => [newNotif, ...prev].slice(0, 50));
  };

  const updateChallengeProgress = (
    type: DailyChallenge['type'], 
    value: number, 
    mode: 'add' | 'max' | 'set' = 'add'
  ) => {
    setChallenges((prev) => 
      prev.map((c) => {
        if (c.type !== type || c.completed) return c;
        
        let nextVal = c.currentValue;
        if (mode === 'add') {
          nextVal += value;
        } else if (mode === 'max') {
          nextVal = Math.max(nextVal, value);
        } else if (mode === 'set') {
          nextVal = value;
        }
        
        const completed = nextVal >= c.target;
        if (completed && !c.completed) {
          addNotification(
            'tx_success',
            'Daily Challenge Complete!',
            `✓ Secured objective "${c.title}". Return to Challenges tab to claim +$${c.rewardUsdc.toFixed(2)} USDC!`
          );
          playSfx(880, 0.15, 'sine', 0.2);
          setTimeout(() => playSfx(1046, 0.25, 'sine', 0.2), 100);
        }
        
        return {
          ...c,
          currentValue: nextVal,
          completed
        };
      })
    );
  };

  const handleClaimReward = (challengeId: string) => {
    setChallenges((prev) => 
      prev.map((c) => {
        if (c.id === challengeId && c.completed && !c.claimed) {
          setBankroll((current) => current + c.rewardUsdc);
          setWallet((prevWallet) => ({
            ...prevWallet,
            balanceUsdc: prevWallet.balanceUsdc + c.rewardUsdc
          }));
          
          addNotification(
            'jackpot',
            'Mission Drop Dispatched',
            `+$${c.rewardUsdc.toFixed(2)} USDC bonus cleared into active bankroll.`
          );
          playSfx(1046, 0.3, 'sine', 0.2);
          setTimeout(() => playSfx(1318, 0.4, 'sine', 0.2), 150);
          
          return { ...c, claimed: true };
        }
        return c;
      })
    );
  };

  const handleClaimAllChallenges = () => {
    let totalClaimed = 0;
    setChallenges((prev) => {
      const updated = prev.map((c) => {
        if (c.completed && !c.claimed) {
          totalClaimed += c.rewardUsdc;
          return { ...c, claimed: true };
        }
        return c;
      });

      if (totalClaimed > 0) {
        setBankroll((current) => current + totalClaimed);
        setWallet((prevWallet) => ({
          ...prevWallet,
          balanceUsdc: prevWallet.balanceUsdc + totalClaimed
        }));
        
        addNotification(
          'jackpot',
          'All Mission Drops Dispatched',
          `+$${totalClaimed.toFixed(2)} USDC bonuses added simultaneously.`
        );
        playSfx(1046, 0.3, 'sine', 0.2);
        setTimeout(() => playSfx(1318, 0.4, 'sine', 0.2), 120);
        setTimeout(() => playSfx(1567, 0.5, 'sine', 0.2), 240);
      }
      return updated;
    });
  };

  const handleWalletConnect = (address: string, realEthBalance?: number) => {
    setWallet((prev) => ({
      ...prev,
      connected: true,
      address,
      balanceEth: realEthBalance !== undefined ? realEthBalance : prev.balanceEth,
    }));
    addNotification(
      'tx_success', 
      'Veklom Identity Handshake Completed', 
      `Linked address ${address.slice(0, 8)}...`
    );
  };

  const handleWalletDisconnect = () => {
    setWallet((prev) => ({ ...prev, connected: false, address: null }));
    addNotification(
      'collapse', 
      'Wallet Decoupled', 
      'Identity registry context cleared from workspace.'
    );
  };

  const handleFaucetDeposit = () => {
    // Faucet claims
    setWallet((prev) => ({ ...prev, balanceUsdc: prev.balanceUsdc + 250 }));
    addNotification(
      'tx_success',
      'Gas Faucet Dispensed',
      '+$250 USDC test-fuel credited to wallet.'
    );
    playSfx(587, 0.2, 'sine', 0.1);
  };

  const handleEscrowDeposit = (amount: number) => {
    setEscrow((prev) => ({ ...prev, totalSecuredUsdc: prev.totalSecuredUsdc + amount }));
    if (wallet.connected) {
      setWallet((prev) => ({ ...prev, balanceUsdc: Math.max(0, prev.balanceUsdc - amount) }));
    }
    addNotification(
      'tx_success',
      'Escrow Collateral Boosted',
      `Locked $${amount} USDC securely in registry.`
    );
    playSfx(659, 0.25, 'triangle', 0.15);
  };

  const handleRebet = () => {
    if (phase !== 'idle') return;
    const totalProposed = Number((previousBets.player + previousBets.banker + previousBets.tie).toFixed(2));
    if (totalProposed > bankroll) {
      addNotification('collapse', 'Rebet Failed', 'Insufficient balance to repeat previous bets.');
      return;
    }
    setBets(previousBets);
    playSfx(587, 0.15, 'sine', 0.1);
  };

  const handleDoubleBets = () => {
    if (phase !== 'idle') return;
    const proposedBets = {
      player: Number((bets.player * 2).toFixed(2)),
      banker: Number((bets.banker * 2).toFixed(2)),
      tie: Number((bets.tie * 2).toFixed(2)),
    };
    const totalProposed = proposedBets.player + proposedBets.banker + proposedBets.tie;
    if (totalProposed > bankroll) {
      addNotification('collapse', 'Double Failed', 'Double wager exceeds bankroll USDC.');
      return;
    }
    setBets(proposedBets);
    playSfx(659, 0.15, 'sine', 0.1);
  };

  const handleClearBets = () => {
    if (phase !== 'idle') return;
    setBets({ player: 0, banker: 0, tie: 0 });
    playSfx(330, 0.15, 'sine', 0.1);
  };

  // --- REAL-TIME PVP DUEL CONVENIENCE HANDLERS ---
  const resolveDuelPayouts = (
    players: { [address: string]: DuelPlayer },
    hand: TelemetryDuelHand,
    finalCrashMulti: number
  ) => {
    const outcome = hand.outcome;
    const updatedPlayers = { ...players };

    Object.keys(updatedPlayers).forEach((addr) => {
      const p = updatedPlayers[addr];
      let totalPayout = 0;
      const totalWager = p.wagerAmount;

      if (p.status === 'ejected' && p.ejectedMulti) {
        const multi = p.ejectedMulti;
        if (outcome === 'player') {
          totalPayout = p.bets.player * multi * 2.0;
        } else if (outcome === 'banker') {
          totalPayout = p.bets.banker * multi * 1.95;
        } else if (outcome === 'tie') {
          totalPayout = p.bets.tie * multi * 9.0;
          totalPayout += (p.bets.player + p.bets.banker) * multi;
        }
        p.payout = Number(totalPayout.toFixed(2));
      } else {
        p.payout = 0;
      }
    });

    let winnerAddress: string | null = null;
    let highestEjectMulti = 0;

    Object.keys(updatedPlayers).forEach((addr) => {
      const p = updatedPlayers[addr];
      if (p.status === 'ejected' && p.ejectedMulti && p.ejectedMulti > highestEjectMulti) {
        highestEjectMulti = p.ejectedMulti;
        winnerAddress = addr;
      }
    });

    return { players: updatedPlayers, winnerAddress };
  };

  // Broadcast synchronizer effect
  useEffect(() => {
    if (!activeDuel?.id) {
      if (channelRef.current) {
        channelRef.current.close();
        channelRef.current = null;
      }
      return;
    }

    const channelId = `quantum_duel_lobby_${activeDuel.id}`;
    const bChannel = new BroadcastChannel(channelId);
    channelRef.current = bChannel;

    bChannel.onmessage = (event) => {
      const data = event.data;
      if (!data || !data.type) return;

      const myAddress = wallet.address || "0xMyWalletAddressPlaceholder";

      switch (data.type) {
        case 'PEER_JOINED': {
          setActiveDuel((prev) => {
            if (!prev) return null;
            const updatedPlayers = { ...prev.players };
            if (!updatedPlayers[data.address]) {
              updatedPlayers[data.address] = {
                address: data.address,
                connected: true,
                balanceUsdc: data.balanceUsdc || 250,
                bets: { player: 0, banker: 0, tie: 0 },
                wagerAmount: 0,
                ejected: false,
                ejectedMulti: null,
                payout: 0,
                status: 'pending'
              };
              addNotification('tx_success', 'Peer Connected', `Peer wallet ${data.address.slice(0, 6)}... joined the lobby.`);
              
              // Host replies with host details
              bChannel.postMessage({
                type: 'HOST_INFO',
                address: myAddress,
                balanceUsdc: wallet.balanceUsdc
              });
            }
            return { ...prev, players: updatedPlayers };
          });
          break;
        }

        case 'HOST_INFO': {
          setActiveDuel((prev) => {
            if (!prev) return null;
            const updatedPlayers = { ...prev.players };
            if (!updatedPlayers[data.address]) {
              updatedPlayers[data.address] = {
                address: data.address,
                connected: true,
                balanceUsdc: data.balanceUsdc || 250,
                bets: { player: 0, banker: 0, tie: 0 },
                wagerAmount: 0,
                ejected: false,
                ejectedMulti: null,
                payout: 0,
                status: 'pending'
              };
            }
            return { ...prev, players: updatedPlayers, hostAddress: data.address };
          });
          break;
        }

        case 'BET_UPDATE': {
          setActiveDuel((prev) => {
            if (!prev) return null;
            const updatedPlayers = { ...prev.players };
            if (updatedPlayers[data.address]) {
              const totalWager = data.bets.player + data.bets.banker + data.bets.tie;
              updatedPlayers[data.address] = {
                ...updatedPlayers[data.address],
                bets: data.bets,
                wagerAmount: totalWager,
                status: totalWager > 0 ? 'ready' : 'pending'
              };
            }
            return { ...prev, players: updatedPlayers };
          });
          break;
        }

        case 'START_COUNTDOWN': {
          setPhase('idle');
          setBets({ player: 0, banker: 0, tie: 0 });
          setActiveHand(data.hand);
          crashAt.current = data.crashAt;
          setRoundWinner(data.hand.outcome === 'player' ? 'A' : 'B');

          setActiveDuel((prev) => {
            if (!prev) return null;
            const updatedPlayers = { ...prev.players };
            Object.keys(updatedPlayers).forEach((addr) => {
              updatedPlayers[addr].status = 'ready';
              updatedPlayers[addr].ejected = false;
              updatedPlayers[addr].ejectedMulti = null;
              updatedPlayers[addr].payout = 0;
            });
            return {
              ...prev,
              status: 'countdown',
              countdownSeconds: 3,
              activeHand: data.hand,
              crashAt: data.crashAt,
              players: updatedPlayers
            };
          });
          break;
        }

        case 'TICK': {
          setPhase('running');
          setMultiplier(data.multiplier);
          setChartPoints((prev) => [...prev, { t: data.elapsed, m: data.multiplier }]);
          
          if (data.elapsed >= 1.0 && data.elapsed < 2.0) {
            setVisiblePacketsCount(1);
          } else if (data.elapsed >= 2.0 && data.elapsed < 3.0) {
            setVisiblePacketsCount(2);
          } else if (data.elapsed >= 3.0) {
            setVisiblePacketsCount(3);
          }

          setActiveDuel((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              status: 'running',
              multiplier: data.multiplier
            };
          });
          break;
        }

        case 'EJECT': {
          setActiveDuel((prev) => {
            if (!prev) return null;
            const updatedPlayers = { ...prev.players };
            if (updatedPlayers[data.address]) {
              updatedPlayers[data.address] = {
                ...updatedPlayers[data.address],
                status: 'ejected',
                ejected: true,
                ejectedMulti: data.multiplier
              };
              addNotification('tx_success', 'Peer Ejected', `Wallet ${data.address.slice(0, 6)}... ejected securely at ${data.multiplier.toFixed(2)}x.`);
            }
            return { ...prev, players: updatedPlayers };
          });
          break;
        }

        case 'CRASH': {
          setPhase('crashed');
          setMultiplier(data.finalMulti);
          setVisiblePacketsCount(3);
          
          setActiveDuel((prev) => {
            if (!prev) return null;
            const updatedPlayers = { ...prev.players };
            
            Object.keys(updatedPlayers).forEach((addr) => {
              if (updatedPlayers[addr].status === 'ready') {
                updatedPlayers[addr].status = 'crashed';
              }
            });

            const finalDuelState = resolveDuelPayouts(updatedPlayers, prev.activeHand!, data.finalMulti);

            // Credit local balance
            const myAddress = wallet.address || "0xMyWalletAddressPlaceholder";
            const myPayout = finalDuelState.players[myAddress]?.payout || 0;
            const newBalance = Number((bankroll + myPayout).toFixed(2));
            if (wallet.connected) {
              setWallet((v) => ({ ...v, balanceUsdc: newBalance }));
            } else {
              setBankroll(newBalance);
            }

            return {
              ...prev,
              status: 'ended',
              multiplier: data.finalMulti,
              players: finalDuelState.players,
              winnerAddress: finalDuelState.winnerAddress
            };
          });
          break;
        }
      }
    };

    return () => {
      bChannel.close();
    };
  }, [activeDuel?.id, wallet.address, wallet.balanceUsdc]);

  // Synchronize local bets with active duel
  useEffect(() => {
    if (!activeDuel || activeDuel.status !== 'lobby') return;
    const myAddress = wallet.address || "0xMyWalletAddressPlaceholder";
    
    setActiveDuel((prev) => {
      if (!prev) return null;
      const updatedPlayers = { ...prev.players };
      if (updatedPlayers[myAddress]) {
        const totalWager = bets.player + bets.banker + bets.tie;
        updatedPlayers[myAddress] = {
          ...updatedPlayers[myAddress],
          bets: bets,
          wagerAmount: totalWager,
          status: totalWager > 0 ? 'ready' : 'pending'
        };
      }
      return { ...prev, players: updatedPlayers };
    });

    if (channelRef.current) {
      channelRef.current.postMessage({
        type: 'BET_UPDATE',
        address: myAddress,
        bets: bets,
        balanceUsdc: wallet.balanceUsdc
      });
    }
  }, [bets, activeDuel?.id, wallet.address, wallet.balanceUsdc]);

  // Countdown clock effect
  useEffect(() => {
    if (!activeDuel || activeDuel.status !== 'countdown') return;

    const timer = setTimeout(() => {
      if (activeDuel.countdownSeconds > 1) {
        setActiveDuel((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            countdownSeconds: prev.countdownSeconds - 1
          };
        });
      } else {
        startDuelRunningLoop();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [activeDuel?.status, activeDuel?.countdownSeconds]);

  // Handle URL Session Join
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const duelId = params.get('duel');
    if (duelId && wallet.connected) {
      handleJoinDuel(duelId);
      setActiveTab('duel');
    }
  }, [wallet.connected]);

  const handleCreateDuel = () => {
    const id = "DUEL-" + Math.random().toString(36).substring(2, 6).toUpperCase();
    const myAddress = wallet.address || "0xMyWalletAddressPlaceholder";
    const session: DuelSession = {
      id,
      status: 'lobby',
      hostAddress: myAddress,
      players: {
        [myAddress]: {
          address: myAddress,
          connected: true,
          balanceUsdc: wallet.balanceUsdc,
          bets: { player: 0, banker: 0, tie: 0 },
          wagerAmount: 0,
          ejected: false,
          ejectedMulti: null,
          payout: 0,
          status: 'pending'
        }
      },
      countdownSeconds: 0,
      activeHand: null,
      crashAt: 0,
      multiplier: 1.0,
      winnerAddress: null,
      timestamp: new Date().toLocaleTimeString()
    };
    setActiveDuel(session);
    addNotification('tx_success', 'Duel Lobby Created', `Lobby initialized with Session ID ${id}. Share with a friend.`);
  };

  const handleJoinDuel = (id: string) => {
    const myAddress = wallet.address || "0xMyWalletAddressPlaceholder";
    const session: DuelSession = {
      id,
      status: 'lobby',
      hostAddress: "0xHostAddressPlaceholder",
      players: {
        [myAddress]: {
          address: myAddress,
          connected: true,
          balanceUsdc: wallet.balanceUsdc,
          bets: { player: 0, banker: 0, tie: 0 },
          wagerAmount: 0,
          ejected: false,
          ejectedMulti: null,
          payout: 0,
          status: 'pending'
        }
      },
      countdownSeconds: 0,
      activeHand: null,
      crashAt: 0,
      multiplier: 1.0,
      winnerAddress: null,
      timestamp: new Date().toLocaleTimeString()
    };
    setActiveDuel(session);
    
    setTimeout(() => {
      if (channelRef.current) {
        channelRef.current.postMessage({
          type: 'PEER_JOINED',
          address: myAddress,
          balanceUsdc: wallet.balanceUsdc
        });
      }
    }, 300);

    addNotification('tx_success', 'Joined Duel Lobby', `Successfully connected to Session ID ${id}. Waiting for host...`);
  };

  const handleLeaveDuel = () => {
    setActiveDuel(null);
    setIsSimulatedPeerActive(false);
    addNotification('collapse', 'Left Duel Session', 'You have disconnected from the PVP lobby.');
  };

  const handleToggleSimulatePeer = () => {
    if (!activeDuel) return;
    const peerAddress = "0xPeerWallet" + Math.random().toString(36).substring(2, 6).toUpperCase();
    
    setIsSimulatedPeerActive((prev) => {
      const nextVal = !prev;
      setActiveDuel((duel) => {
        if (!duel) return null;
        const updatedPlayers = { ...duel.players };
        if (nextVal) {
          updatedPlayers[peerAddress] = {
            address: peerAddress,
            connected: true,
            balanceUsdc: 250,
            bets: { player: 0, banker: 0, tie: 0 },
            wagerAmount: 0,
            ejected: false,
            ejectedMulti: null,
            payout: 0,
            status: 'pending'
          };
          addNotification('tx_success', 'Simulated Peer Added', `Simulated Peer address connected: ${peerAddress}`);
        } else {
          const myAddress = wallet.address || "0xMyWalletAddressPlaceholder";
          Object.keys(updatedPlayers).forEach((addr) => {
            if (addr !== myAddress) {
              delete updatedPlayers[addr];
            }
          });
          addNotification('collapse', 'Simulated Peer Removed', 'Peer disconnected from the lobby.');
        }
        return { ...duel, players: updatedPlayers };
      });
      return nextVal;
    });
  };

  const handlePlaceSimulatedBet = (simBets: { player: number; banker: number; tie: number }) => {
    if (!activeDuel) return;
    const myAddress = wallet.address || "0xMyWalletAddressPlaceholder";
    const peerEntry = Object.entries(activeDuel.players).find(([addr]) => addr !== myAddress);
    if (!peerEntry) return;
    const peerAddress = peerEntry[0];

    setActiveDuel((prev) => {
      if (!prev) return null;
      const updatedPlayers = { ...prev.players };
      const totalWager = simBets.player + simBets.banker + simBets.tie;
      updatedPlayers[peerAddress] = {
        ...updatedPlayers[peerAddress],
        bets: simBets,
        wagerAmount: totalWager,
        balanceUsdc: Number((updatedPlayers[peerAddress].balanceUsdc - totalWager).toFixed(2)),
        status: 'ready'
      };
      return { ...prev, players: updatedPlayers };
    });
    playSfx(660, 0.05, 'sine', 0.1);
  };

  const handleSimulatePeerEject = () => {
    if (!activeDuel || activeDuel.status !== 'running') return;
    const finalMulti = multiplier;
    const myAddress = wallet.address || "0xMyWalletAddressPlaceholder";
    const peerEntry = Object.entries(activeDuel.players).find(([addr]) => addr !== myAddress);
    if (!peerEntry) return;
    const peerAddress = peerEntry[0];

    setActiveDuel((prev) => {
      if (!prev) return null;
      const updatedPlayers = { ...prev.players };
      if (updatedPlayers[peerAddress] && updatedPlayers[peerAddress].status === 'ready') {
        const outcome = prev.activeHand?.outcome || 'player';
        let payout = 0;
        if (outcome === 'player') {
          payout = updatedPlayers[peerAddress].bets.player * finalMulti * 2.0;
        } else if (outcome === 'banker') {
          payout = updatedPlayers[peerAddress].bets.banker * finalMulti * 1.95;
        } else if (outcome === 'tie') {
          payout = updatedPlayers[peerAddress].bets.tie * finalMulti * 9.0;
          payout += (updatedPlayers[peerAddress].bets.player + updatedPlayers[peerAddress].bets.banker) * finalMulti;
        }

        updatedPlayers[peerAddress] = {
          ...updatedPlayers[peerAddress],
          status: 'ejected',
          ejected: true,
          ejectedMulti: finalMulti,
          payout: Number(payout.toFixed(2))
        };
        
        addNotification('tx_success', `Peer Ejected at ${finalMulti.toFixed(2)}x`, `Peer secured potential payout of $${payout.toFixed(2)} USDC.`);
      }

      const allFinished = Object.values(updatedPlayers).every(p => (p as DuelPlayer).status === 'ejected' || (p as DuelPlayer).status === 'crashed');
      if (allFinished) {
        clearInterval(timerId.current);
        setPhase('ejected');
        setVisiblePacketsCount(3);
        setLastTenCrashes((prev) => [...prev.slice(1), crashAt.current]);
        
        const finalDuelState = resolveDuelPayouts(updatedPlayers, prev.activeHand!, crashAt.current);
        
        const myPayout = finalDuelState.players[myAddress]?.payout || 0;
        const newBalance = Number((bankroll + myPayout).toFixed(2));
        if (wallet.connected) {
          setWallet((v) => ({ ...v, balanceUsdc: newBalance }));
        } else {
          setBankroll(newBalance);
        }

        return {
          ...prev,
          status: 'ended',
          players: finalDuelState.players,
          winnerAddress: finalDuelState.winnerAddress
        };
      }

      return { ...prev, players: updatedPlayers };
    });
    playSfx(587.33, 0.2, 'sine', 0.25);
  };

  const handleStartDuelCountdown = () => {
    if (!activeDuel || activeDuel.status !== 'lobby') return;
    
    const hand = executeRoutingSync();
    
    let generatedCrashAt = 1.0;
    const randomSample = Math.random();
    if (randomSample < 0.03) {
      generatedCrashAt = 1.0;
    } else {
      const p = 0.99 / (1 - Math.random());
      generatedCrashAt = Math.max(1.01, Math.min(p, 100.0));
    }

    const myAddress = wallet.address || "0xMyWalletAddressPlaceholder";
    const totalWager = Number((bets.player + bets.banker + bets.tie).toFixed(2));
    const newBalance = Number((bankroll - totalWager).toFixed(2));
    if (wallet.connected) {
      setWallet((prev) => ({ ...prev, balanceUsdc: newBalance }));
    } else {
      setBankroll(newBalance);
    }

    setActiveDuel((prev) => {
      if (!prev) return null;
      const updatedPlayers = { ...prev.players };
      
      Object.keys(updatedPlayers).forEach((addr) => {
        updatedPlayers[addr].status = 'ready';
        updatedPlayers[addr].ejected = false;
        updatedPlayers[addr].ejectedMulti = null;
        updatedPlayers[addr].payout = 0;
      });

      return {
        ...prev,
        status: 'countdown',
        countdownSeconds: 3,
        activeHand: hand,
        crashAt: generatedCrashAt,
        players: updatedPlayers
      };
    });

    if (channelRef.current) {
      channelRef.current.postMessage({
        type: 'START_COUNTDOWN',
        hand,
        crashAt: generatedCrashAt
      });
    }

    setActiveHand(hand);
    crashAt.current = generatedCrashAt;
    setRoundWinner(hand.outcome === 'player' ? 'A' : 'B');
    setPhase('idle');
    setMultiplier(1.0);
    setChartPoints([{ t: 0, m: 1.0 }]);
    setVisiblePacketsCount(0);
  };

  const startDuelRunningLoop = () => {
    setPhase('running');
    setMultiplier(1.0);
    setChartPoints([{ t: 0, m: 1.0 }]);
    setVisiblePacketsCount(0);

    setActiveDuel((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        status: 'running',
        multiplier: 1.0
      };
    });

    playSfx(220, 0.4, 'sawtooth', 0.12);
    playSfx(440, 0.3, 'sine', 0.1);

    startTime.current = performance.now();

    timerId.current = setInterval(() => {
      const elapsed = (performance.now() - startTime.current) / 1000;
      const nextMulti = Math.pow(Math.E, elapsed * 0.3);
      setMultiplier(nextMulti);
      setChartPoints((prev) => [...prev, { t: elapsed, m: nextMulti }]);

      if (elapsed >= 1.0 && elapsed < 2.0) {
        setVisiblePacketsCount(1);
      } else if (elapsed >= 2.0 && elapsed < 3.0) {
        setVisiblePacketsCount(2);
      } else if (elapsed >= 3.0) {
        setVisiblePacketsCount(3);
      }

      const myAddress = wallet.address || "0xMyWalletAddressPlaceholder";
      if (activeDuel && activeDuel.hostAddress === myAddress && channelRef.current) {
        channelRef.current.postMessage({
          type: 'TICK',
          multiplier: nextMulti,
          elapsed
        });
      }

      if (nextMulti >= crashAt.current) {
        clearInterval(timerId.current);
        triggerCrash(crashAt.current);
      }
    }, 50);
  };

  const addM2mLog = (msg: string, type: 'info' | 'success' | 'warn' | 'error' | 'metric' = 'info') => {
    const timeFull = new Date();
    const time = timeFull.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + '.' + String(timeFull.getMilliseconds()).padStart(3, '0');
    setM2mLogs((prev) => [{ id: Math.random().toString(), time, msg, type }, ...prev].slice(0, 50));
  };

  const executeRoutingSync = (): TelemetryDuelHand => {
    const channels: ('ETH' | 'USDC' | 'AERO' | 'DEGEN')[] = ['ETH', 'USDC', 'AERO', 'DEGEN'];
    const values = ['0x01', '0x02', '0x03', '0x04', '0x05', '0x06', '0x07', '0x08', '0x09', '0x0A', '0x0B', '0x0C', '0x0D'];
    
    const fetchPacket = (): TelemetryPacket => {
      const channel = channels[Math.floor(Math.random() * channels.length)];
      const value = values[Math.floor(Math.random() * values.length)];
      let scoreValue = 0;
      if (value === '0x01') scoreValue = 1;
      else if (['0x0A', '0x0B', '0x0C', '0x0D'].includes(value)) scoreValue = 0;
      else scoreValue = parseInt(value.replace('0x0', ''), 10);
      return { channel, value, scoreValue };
    };

    // Generate upcoming stream sequence for quantum auditability
    const streamSequence: TelemetryPacket[] = [];
    for (let i = 0; i < 10; i++) {
      streamSequence.push(fetchPacket());
    }
    const seedHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
    const salt = 'quantum_duel_salt_' + Math.floor(Math.random() * 100000000);

    const p1 = fetchPacket();
    const p2 = fetchPacket();
    const b1 = fetchPacket();
    const b2 = fetchPacket();

    let pScore = (p1.scoreValue + p2.scoreValue) % 10;
    let bScore = (b1.scoreValue + b2.scoreValue) % 10;

    const playerPackets = [p1, p2];
    const bankerPackets = [b1, b2];

    // Natural Check (8 or 9)
    if (pScore >= 8 || bScore >= 8) {
      const outcome = pScore > bScore ? 'player' : bScore > pScore ? 'banker' : 'tie';
      return {
        playerPackets,
        bankerPackets,
        playerScore: pScore,
        bankerScore: bScore,
        outcome,
        natural: true,
        streamSequence,
        seedHash,
        salt
      };
    }

    // Player draw logic: draws third packet on 0-5
    let p3: TelemetryPacket | null = null;
    if (pScore <= 5) {
      p3 = fetchPacket();
      playerPackets.push(p3);
      pScore = (pScore + p3.scoreValue) % 10;
    }

    // Banker draw logic
    if (p3 === null) {
      if (bScore <= 5) {
        const b3 = fetchPacket();
        bankerPackets.push(b3);
        bScore = (bScore + b3.scoreValue) % 10;
      }
    } else {
      const p3Val = p3.scoreValue;
      let bDraw = false;
      if (bScore <= 2) bDraw = true;
      else if (bScore === 3 && p3Val !== 8) bDraw = true;
      else if (bScore === 4 && [2, 3, 4, 5, 6, 7].includes(p3Val)) bDraw = true;
      else if (bScore === 5 && [4, 5, 6, 7].includes(p3Val)) bDraw = true;
      else if (bScore === 6 && [6, 7].includes(p3Val)) bDraw = true;

      if (bDraw) {
        const b3 = fetchPacket();
        bankerPackets.push(b3);
        bScore = (bScore + b3.scoreValue) % 10;
      }
    }

    const outcome = pScore > bScore ? 'player' : bScore > pScore ? 'banker' : 'tie';
    return {
      playerPackets,
      bankerPackets,
      playerScore: pScore,
      bankerScore: bScore,
      outcome,
      natural: false,
      streamSequence,
      seedHash,
      salt
    };
  };

  // Launch routing crash loop
  const initiateRoute = () => {
    if (phase === 'running') return;
    
    const totalWager = Number((bets.player + bets.banker + bets.tie).toFixed(2));
    if (totalWager <= 0) {
      addNotification('collapse', 'Pre-flight Check Failed', 'Please place at least one micropayment chip on the betting board.');
      return;
    }
    if (totalWager > bankroll) {
      addNotification('collapse', 'Execution Blocked', 'Insufficient USDC balance to fulfill stake.');
      return;
    }

    // Set engine states
    setPhase('running');
    setMultiplier(1.0);
    setChartPoints([{ t: 0, m: 1.0 }]);

    // Update daily challenges progress on wager commit
    updateChallengeProgress('wager_milestone', totalWager, 'add');
    updateChallengeProgress('high_roller', totalWager, 'max');

    // Trigger Quantum Telemetry Duel!
    const hand = executeRoutingSync();
    setActiveHand(hand);
    setVisiblePacketsCount(0); // Flip packets progressively inside loop

    // Generate random crash logic (with standard 3% house edge)
    const randomSample = Math.random();
    if (randomSample < 0.03) {
      crashAt.current = 1.0;
    } else {
      const p = 0.99 / (1 - Math.random());
      crashAt.current = Math.max(1.01, Math.min(p, 100.0));
    }

    // Pick winning agent randomly based on Telemetry outcome
    setRoundWinner(hand.outcome === 'player' ? 'A' : 'B');

    // Deduct stake from active bankroll with high precision
    const newBalance = Number((bankroll - totalWager).toFixed(2));
    if (wallet.connected) {
      setWallet((prev) => ({ ...prev, balanceUsdc: newBalance }));
    } else {
      setBankroll(newBalance);
    }

    addNotification(
      'tx_success',
      'Quantum Wager Locked',
      `Locked $${totalWager.toFixed(2)} USDC on Duel Routing Board.`
    );

    // Play starting hum
    playSfx(220, 0.4, 'sawtooth', 0.12);
    playSfx(440, 0.3, 'sine', 0.1);

    startTime.current = performance.now();
    
    // Core game ticking clock
    timerId.current = setInterval(() => {
      const elapsed = (performance.now() - startTime.current) / 1000;
      const nextMulti = Math.pow(Math.E, elapsed * 0.3);
      setMultiplier(nextMulti);
      setChartPoints((prev) => [...prev, { t: elapsed, m: nextMulti }]);

      // Reveal Telemetry packets progressively to build rich tension!
      if (elapsed >= 1.0 && elapsed < 2.0) {
        setVisiblePacketsCount((prev) => Math.max(prev, 1));
      } else if (elapsed >= 2.0 && elapsed < 3.0) {
        setVisiblePacketsCount((prev) => Math.max(prev, 2));
      } else if (elapsed >= 3.0) {
        setVisiblePacketsCount((prev) => Math.max(prev, 3));
      }

      // Random audio tick
      if (Math.random() < 0.2) {
        playSfx(250 + nextMulti * 50, 0.04, 'square', 0.05);
      }

      // Check crash ceiling
      if (nextMulti >= crashAt.current) {
        clearInterval(timerId.current);
        triggerCrash(crashAt.current);
      }
    }, 50);
  };

  const triggerCrash = (finalMulti: number) => {
    setLastTenCrashes((prev) => [...prev.slice(1), finalMulti]);

    if (activeDuel) {
      setPhase('crashed');
      setMultiplier(finalMulti);
      setVisiblePacketsCount(3);
      
      const myAddress = wallet.address || "0xMyWalletAddressPlaceholder";
      const peerPlayerEntry = Object.entries(activeDuel.players).find(([addr]) => addr !== myAddress);
      const peerAddress = peerPlayerEntry ? peerPlayerEntry[0] : null;

      setActiveDuel((prev) => {
        if (!prev) return null;
        const updatedPlayers = { ...prev.players };
        
        Object.keys(updatedPlayers).forEach((addr) => {
          if (updatedPlayers[addr].status === 'ready') {
            updatedPlayers[addr].status = 'crashed';
          }
        });

        const finalDuelState = resolveDuelPayouts(updatedPlayers, prev.activeHand!, finalMulti);
        
        const myPayout = finalDuelState.players[myAddress]?.payout || 0;
        const totalWager = finalDuelState.players[myAddress]?.wagerAmount || 0;
        const isActualWin = myPayout > totalWager;

        const newBalance = Number((bankroll + myPayout).toFixed(2));
        if (wallet.connected) {
          setWallet((v) => ({ ...v, balanceUsdc: newBalance }));
        } else {
          setBankroll(newBalance);
        }

        const txHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
        const newTx: WagerTransaction = {
          id: Math.random().toString(),
          txHash,
          timestamp: new Date().toLocaleTimeString(),
          agent: selectedAgent,
          wagerAmount: totalWager,
          multiplier: finalMulti,
          payout: myPayout,
          status: isActualWin ? 'success' : 'crashed',
          network: wallet.network
        };
        setRoundFeed((prevFeed) => [newTx, ...prevFeed]);

        addNotification(
          isActualWin ? 'tx_success' : 'collapse',
          isActualWin ? `Duel Finished - Secured $${myPayout.toFixed(2)} USDC` : 'Duel Finished - Lost Stake',
          isActualWin ? `Ejected safely at ${updatedPlayers[myAddress].ejectedMulti?.toFixed(2)}x.` : `Matrix crashed at ${finalMulti.toFixed(2)}x before ejection.`
        );

        return {
          ...prev,
          status: 'ended',
          players: finalDuelState.players,
          winnerAddress: finalDuelState.winnerAddress
        };
      });

      if (channelRef.current) {
        channelRef.current.postMessage({
          type: 'CRASH',
          finalMulti: finalMulti
        });
      }

      playSfx(130, 0.08, 'sawtooth', 0.3);
      playSfx(82, 0.5, 'triangle', 0.3, 0.08);
      return;
    }

    setPhase('crashed');
    setMultiplier(finalMulti);
    setVisiblePacketsCount(3); // ensure all packets are shown
    
    // Play explosion chords
    playSfx(130, 0.08, 'sawtooth', 0.3);
    playSfx(82, 0.5, 'triangle', 0.3, 0.08);

    const totalWager = Number((bets.player + bets.banker + bets.tie).toFixed(2));

    if (activeHand) {
      setLastLostRound({
        hand: activeHand,
        bets: { ...bets },
        finalMulti,
        ejectedMulti: null,
        wager: totalWager,
        payout: 0,
        timestamp: new Date().toLocaleTimeString()
      });
    }

    addNotification(
      'collapse',
      `Matrix Collapsed at ${finalMulti.toFixed(2)}x`,
      `Your active stake of $${totalWager.toFixed(2)} USDC is lost to the network crash.`
    );

    // Save previous bets for rebet
    setPreviousBets(bets);
    // Clear current bets
    setBets({ player: 0, banker: 0, tie: 0 });

    // Save history
    const txHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
    const newTx: WagerTransaction = {
      id: Math.random().toString(),
      txHash,
      timestamp: new Date().toLocaleTimeString(),
      agent: bets.player >= bets.banker ? 'A' : 'B',
      wagerAmount: totalWager,
      multiplier: finalMulti,
      payout: 0,
      status: 'crashed',
      network: wallet.network
    };
    setRoundFeed((prev) => [newTx, ...prev]);

    // Update streak stats
    setWinStreak(0);
    setRoundIndex((r) => r + 1);

    // Update daily challenges on crash finish
    if (activeHand?.outcome === 'tie') {
      updateChallengeProgress('tie_win', 1, 'add');
    }
    if (m2mEnabled) {
      updateChallengeProgress('bot_cycles', 1, 'add');
    }

    // Save statistics in local leaderboard if connected
    if (wallet.connected) {
      updateLeaderboardStats(wallet.address!, -totalWager, finalMulti, false);
    }

    m2mLastResult.current = 'loss';
  };

  const triggerEject = () => {
    if (phase !== 'running') return;
    
    const finalMulti = multiplier;

    if (activeDuel) {
      const myAddress = wallet.address || "0xMyWalletAddressPlaceholder";
      
      setActiveDuel((prev) => {
        if (!prev) return null;
        const updatedPlayers = { ...prev.players };
        if (updatedPlayers[myAddress]) {
          const outcome = prev.activeHand?.outcome || 'player';
          let payout = 0;
          if (outcome === 'player') {
            payout = updatedPlayers[myAddress].bets.player * finalMulti * 2.0;
          } else if (outcome === 'banker') {
            payout = updatedPlayers[myAddress].bets.banker * finalMulti * 1.95;
          } else if (outcome === 'tie') {
            payout = updatedPlayers[myAddress].bets.tie * finalMulti * 9.0;
            payout += (updatedPlayers[myAddress].bets.player + updatedPlayers[myAddress].bets.banker) * finalMulti;
          }
          
          updatedPlayers[myAddress] = {
            ...updatedPlayers[myAddress],
            status: 'ejected',
            ejected: true,
            ejectedMulti: finalMulti,
            payout: Number(payout.toFixed(2))
          };
          
          addNotification('tx_success', `You Ejected at ${finalMulti.toFixed(2)}x`, `Secured potential payout of $${payout.toFixed(2)} USDC.`);
        }
        
        const allFinished = Object.values(updatedPlayers).every(p => (p as DuelPlayer).status === 'ejected' || (p as DuelPlayer).status === 'crashed');
        if (allFinished) {
          clearInterval(timerId.current);
          setPhase('ejected');
          setVisiblePacketsCount(3);
          setLastTenCrashes((prev) => [...prev.slice(1), crashAt.current]);
          
          const finalDuelState = resolveDuelPayouts(updatedPlayers, prev.activeHand!, crashAt.current);
          
          const myPayout = finalDuelState.players[myAddress]?.payout || 0;
          const newBalance = Number((bankroll + myPayout).toFixed(2));
          if (wallet.connected) {
            setWallet((v) => ({ ...v, balanceUsdc: newBalance }));
          } else {
            setBankroll(newBalance);
          }

          if (finalMulti > bestMulti) {
            setBestMulti(finalMulti);
          }

          return {
            ...prev,
            status: 'ended',
            players: finalDuelState.players,
            winnerAddress: finalDuelState.winnerAddress
          };
        }
        
        return {
          ...prev,
          players: updatedPlayers
        };
      });

      if (channelRef.current) {
        channelRef.current.postMessage({
          type: 'EJECT',
          address: myAddress,
          multiplier: finalMulti
        });
      }
      
      playSfx(587.33, 0.2, 'sine', 0.25);
      return;
    }

    clearInterval(timerId.current);
    setPhase('ejected');
    setVisiblePacketsCount(3); // reveal final packets
    setLastTenCrashes((prev) => [...prev.slice(1), crashAt.current]);

    const totalWager = Number((bets.player + bets.banker + bets.tie).toFixed(2));
    
    // Calculate Payout based on real telemetry outcome!
    let totalPayout = 0;
    let detailsMsg = '';
    const outcome = activeHand ? activeHand.outcome : 'player';

    if (outcome === 'player') {
      const win = bets.player * finalMulti * 2.0;
      totalPayout += win;
      if (bets.player > 0) detailsMsg += `Player Win (2x): +$${win.toFixed(2)} USDC. `;
    } else if (outcome === 'banker') {
      const win = bets.banker * finalMulti * 1.95; // Banker commission
      totalPayout += win;
      if (bets.banker > 0) detailsMsg += `Banker Win (1.95x): +$${win.toFixed(2)} USDC. `;
    } else if (outcome === 'tie') {
      const win = bets.tie * finalMulti * 9.0; // 8:1 pays 9x total return
      const pushRefund = (bets.player + bets.banker) * finalMulti; // Push player/banker bets
      totalPayout += win + pushRefund;
      if (bets.tie > 0) detailsMsg += `Equal Tie Win (9x): +$${win.toFixed(2)} USDC! `;
      if (bets.player > 0 || bets.banker > 0) detailsMsg += `Refunding Player/Banker slots. `;
    }

    const pnl = Number((totalPayout - totalWager).toFixed(2));

    // Credit user state with high precision
    const newBalance = Number((bankroll + totalPayout).toFixed(2));
    if (wallet.connected) {
      setWallet((prev) => ({ ...prev, balanceUsdc: newBalance }));
    } else {
      setBankroll(newBalance);
    }

    if (finalMulti > bestMulti) {
      setBestMulti(finalMulti);
    }

    const isActualWin = totalPayout > totalWager;

    if (activeHand && !isActualWin) {
      setLastLostRound({
        hand: activeHand,
        bets: { ...bets },
        finalMulti: crashAt.current,
        ejectedMulti: finalMulti,
        wager: totalWager,
        payout: totalPayout,
        timestamp: new Date().toLocaleTimeString()
      });
    }

    addNotification(
      isActualWin ? 'tx_success' : 'collapse',
      isActualWin ? `Ejection Confirmed: +$${pnl.toFixed(2)} USDC` : 'Ejected with Deficit',
      `Withdrew securely at ${finalMulti.toFixed(2)}x. ${detailsMsg || 'No matching winning predictions.'}`
    );

    // Sound payout progression
    if (isActualWin) {
      playSfx(523, 0.12, 'sine', 0.15);
      playSfx(659, 0.12, 'sine', 0.15, 0.08);
      playSfx(784, 0.25, 'sine', 0.15, 0.16);
      setWinStreak((s) => s + 1);
      m2mLastResult.current = 'win';
    } else {
      playSfx(300, 0.35, 'sawtooth', 0.1);
      setWinStreak(0);
      m2mLastResult.current = totalPayout > 0 ? 'tie' : 'loss';
    }

    // Save previous bets for rebet
    setPreviousBets(bets);
    // Clear current bets
    setBets({ player: 0, banker: 0, tie: 0 });

    // Save history
    const txHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
    const newTx: WagerTransaction = {
      id: Math.random().toString(),
      txHash,
      timestamp: new Date().toLocaleTimeString(),
      agent: bets.player >= bets.banker ? 'A' : 'B',
      wagerAmount: totalWager,
      multiplier: finalMulti,
      payout: totalPayout,
      status: 'success',
      network: wallet.network
    };
    setRoundFeed((prev) => [newTx, ...prev]);

    // Update Daily Challenges on ejection finish
    if (isActualWin) {
      updateChallengeProgress('streak', winStreak + 1, 'max');
    }
    if (activeHand?.outcome === 'tie') {
      updateChallengeProgress('tie_win', 1, 'add');
    }
    if (m2mEnabled) {
      updateChallengeProgress('bot_cycles', 1, 'add');
    }

    setRoundIndex((r) => r + 1);

    if (wallet.connected) {
      updateLeaderboardStats(wallet.address!, pnl, finalMulti, isActualWin);
    }
  };

  const updateLeaderboardStats = (addr: string, pnl: number, multiReached: number, won: boolean) => {
    setLeaderboard((prev) => {
      const idx = prev.findIndex((e) => e.address.toLowerCase() === addr.toLowerCase());
      let updated = [...prev];

      if (idx !== -1) {
        const current = updated[idx];
        updated[idx] = {
          ...current,
          totalWonUsdc: current.totalWonUsdc + pnl,
          bestMultiplier: Math.max(current.bestMultiplier, multiReached),
          streak: won ? current.streak + 1 : 0
        };
      } else {
        // Add new player to leaderboard
        updated.push({
          rank: 99, // position calculated next
          username: "You (Veklom Node)",
          address: addr,
          totalWonUsdc: pnl,
          bestMultiplier: multiReached,
          streak: won ? 1 : 0,
          agentPreference: selectedAgent === 'A' ? 'Vector North' : 'Quiet Switch'
        });
      }

      // Sort and recalculate ranks
      return updated
        .sort((a, b) => b.totalWonUsdc - a.totalWonUsdc)
        .map((item, index) => ({ ...item, rank: index + 1 }));
    });
  };

  const handleResetSimulator = () => {
    if (timerId.current) clearInterval(timerId.current);
    if (botTimerId.current) clearTimeout(botTimerId.current);
    setWallet((prev) => ({ ...prev, balanceUsdc: 250 }));
    setBankroll(250);
    setRoundIndex(1);
    setWinStreak(0);
    setBestMulti(0);
    setBets({ player: 0, banker: 0, tie: 0 });
    setPreviousBets({ player: 0, banker: 0, tie: 0 });
    setActiveChip(0.10);
    setActiveHand(null);
    setVisiblePacketsCount(0);
    setPhase('idle');
    setMultiplier(1.0);
    setChartPoints([]);
    setRoundFeed([]);
    setNotifications([]);
    setLeaderboard(INITIAL_LEADERBOARD);
    setM2mEnabled(false);
    setM2mLogs([]);
    addNotification('tx_success', 'Simulator Reset', 'Telemetry metrics flushed to baseline parameters.');
    playSfx(440, 0.3, 'sine', 0.1);
  };

  // 10. Global Hotkeys for Ultra-Addictive, Fast-Paced Arcade Action
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside any form field
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA' || (document.activeElement as HTMLElement)?.isContentEditable) {
        return;
      }
      
      const key = e.key.toLowerCase();
      
      if (e.key === ' ') {
        e.preventDefault(); // Stop page scrolling
        if (phase === 'running') {
          triggerEject();
        } else if (phase === 'idle') {
          initiateRoute();
        }
      } else if (key === 'e' && phase === 'idle') {
        e.preventDefault();
        initiateRoute();
      } else if (key === 'c' && phase === 'idle') {
        e.preventDefault();
        setBets(prev => ({
          player: Number((prev.player * 2).toFixed(2)),
          banker: Number((prev.banker * 2).toFixed(2)),
          tie: Number((prev.tie * 2).toFixed(2))
        }));
        playSfx(440, 0.08, 'sine', 0.1);
      } else if (key === 'x' && phase === 'idle') {
        e.preventDefault();
        setBets({ player: 0, banker: 0, tie: 0 });
        playSfx(220, 0.1, 'sine', 0.1);
      } else if (key === 'r' && phase === 'idle') {
        e.preventDefault();
        if (previousBets.player > 0 || previousBets.banker > 0 || previousBets.tie > 0) {
          setBets(previousBets);
          playSfx(330, 0.12, 'sine', 0.15);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [phase, bets, previousBets, wallet.address]);

  return (
    <div 
      className="scanlines-overlay select-none"
      style={{
        '--scanline-opacity': scanlinesEnabled ? scanlineIntensity : 0,
        '--scanline-display': scanlinesEnabled ? 'block' : 'none',
      } as React.CSSProperties}
    >
      <div className="shell min-h-screen">
        <div className="flex flex-col min-h-screen bg-[#050608] text-[#e0e2e5]">
          
          {/* TOP BAR / NAVIGATION */}
          <header className="border-b border-white/10 px-4 py-4 md:px-8 flex flex-col md:flex-row gap-4 items-center justify-between bg-[#0a0c12] backdrop-blur-md shrink-0">
            
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-800 rounded flex items-center justify-center shadow-lg shadow-blue-900/20 shrink-0">
                <Flame className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-widest text-[#e0e2e5] uppercase flex items-center gap-1.5 leading-none">
                  Agent Duel <span className="text-[9px] bg-blue-500/10 text-blue-400 py-1 px-1.5 rounded font-mono font-normal">v402-LIVE</span>
                </h1>
                <p className="text-[10px] font-mono text-blue-400 opacity-80 mt-1 uppercase tracking-wider">
                  ID: veklom_base_001 · Base Mainnet
                </p>
              </div>
            </div>

            {/* Dashboard Headers */}
            <div className="flex flex-wrap items-center gap-4 md:gap-6 font-mono text-xs">
              <div id="stat-sec-bankroll" className="bg-black/40 px-3 py-1.5 rounded border border-white/5">
                <span className="text-[9px] text-slate-500 uppercase block tracking-wider font-bold">Bankroll Pool</span>
                <span className="text-sm font-bold text-blue-400 block">${bankroll.toLocaleString()} USDC</span>
              </div>
              <div id="stat-sec-round" className="bg-black/40 px-3 py-1.5 rounded border border-white/5">
                <span className="text-[9px] text-slate-500 uppercase block tracking-wider font-bold">Cycle Index</span>
                <span className="text-sm font-bold text-slate-300 block">#{roundIndex}</span>
              </div>
              <div id="stat-sec-streak" className="bg-black/40 px-3 py-1.5 rounded border border-white/5">
                <span className="text-[9px] text-slate-500 uppercase block tracking-wider font-bold">FLM Streak</span>
                <span className="text-sm font-bold text-emerald-400 block">{winStreak} Rds</span>
              </div>
              <div id="stat-sec-best" className="bg-black/40 px-3 py-1.5 rounded border border-white/5">
                <span className="text-[9px] text-slate-500 uppercase block tracking-wider font-bold">Session Max</span>
                <span className="text-sm font-bold text-amber-500 block">
                  {bestMulti > 0 ? `${bestMulti.toFixed(2)}x` : '—'}
                </span>
              </div>
              {/* CRT Config Trigger and Dropdown */}
              <div className="relative">
                <button
                  id="btn-crt-settings"
                  onClick={() => setShowDisplaySettings(!showDisplaySettings)}
                  className={`px-3 py-2 border rounded transition-colors text-[10px] uppercase font-bold flex items-center gap-1.5 shrink-0 ${
                    showDisplaySettings 
                      ? 'bg-blue-600/10 border-blue-500/50 text-blue-400' 
                      : 'border-white/10 hover:border-blue-500/30 text-slate-500 hover:text-blue-400'
                  }`}
                >
                  <Tv className="w-3.5 h-3.5" />
                  CRT FX: {scanlinesEnabled ? `${Math.round(scanlineIntensity * 100)}%` : 'OFF'}
                </button>

                {showDisplaySettings && (
                  <div className="absolute right-0 mt-2 w-64 bg-[#0a0c12]/95 border border-white/10 rounded-md p-4 shadow-xl z-50 font-sans backdrop-blur-md">
                    <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                      <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 font-mono uppercase">
                        <Settings className="w-3.5 h-3.5 text-blue-400 animate-spin" style={{ animationDuration: '6s' }} /> Display Config
                      </span>
                      <button 
                        onClick={() => setShowDisplaySettings(false)}
                        className="text-slate-500 hover:text-slate-300 text-xs font-bold px-1.5 py-0.5 rounded border border-white/5 bg-white/5"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-4">
                      {/* Toggle CRT Scanlines */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-400">CRT Scanlines</span>
                        <button
                          id="toggle-scanlines-btn"
                          onClick={() => setScanlinesEnabled(!scanlinesEnabled)}
                          className={`px-2.5 py-1 text-[10px] font-bold font-mono rounded border transition-colors ${
                            scanlinesEnabled
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              : 'bg-red-500/10 border-red-500/30 text-red-400'
                          }`}
                        >
                          {scanlinesEnabled ? 'ENABLED' : 'DISABLED'}
                        </button>
                      </div>

                      {/* Intensity slider */}
                      {scanlinesEnabled && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-[11px] font-mono text-slate-400">
                            <span>Scanline Opacity</span>
                            <span className="text-blue-400 font-bold">{Math.round(scanlineIntensity * 100)}%</span>
                          </div>
                          <input
                            id="scanline-intensity-slider"
                            type="range"
                            min="0"
                            max="0.25"
                            step="0.01"
                            value={scanlineIntensity}
                            onChange={(e) => setScanlineIntensity(parseFloat(e.target.value))}
                            className="w-full accent-blue-500 bg-white/10 h-1 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="flex justify-between text-[9px] font-mono text-slate-600 uppercase">
                            <span>Sharp</span>
                            <span>Medium</span>
                            <span>Heavy</span>
                          </div>
                        </div>
                      )}

                      <div className="border-t border-white/5 pt-2 text-[10px] text-slate-500 leading-relaxed font-mono">
                        Adjusting CRT scanlines controls grid pattern density to enhance legibility and eye comfort.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                id="btn-hard-reset"
                onClick={handleResetSimulator}
                className="px-3 py-2 border border-white/10 hover:border-red-500/30 text-slate-500 hover:text-red-400 rounded transition-colors text-[10px] uppercase font-bold text-center shrink-0"
              >
                Reset Setup
              </button>
            </div>
          </header>

          {/* MAIN TABS MENU */}
          <div className="border-b border-white/5 px-4 md:px-8 py-2 flex items-center gap-1 bg-[#0a0c12] shrink-0">
            <button
              onClick={() => setActiveTab('arena')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors border ${
                activeTab === 'arena'
                  ? 'bg-white/5 border-white/10 text-white font-semibold'
                  : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-blue-400" /> Cyber Arena
            </button>
            <button
              onClick={() => setActiveTab('escrow')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors border ${
                activeTab === 'escrow'
                  ? 'bg-white/5 border-white/10 text-white font-semibold'
                  : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" /> x402 Facilitator
            </button>
            <button
              onClick={() => setActiveTab('challenges')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors border relative ${
                activeTab === 'challenges'
                  ? "bg-white/5 border-white/10 text-white font-semibold"
                  : "bg-transparent border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              <Award className="w-3.5 h-3.5 text-amber-500" /> Daily Challenges
              {challenges.filter(c => c.completed && !c.claimed).length > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('rust-specs')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors border ${
                activeTab === 'rust-specs'
                  ? "bg-white/5 border-white/10 text-white font-semibold"
                  : "bg-transparent border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-400" /> Rust Architecture
            </button>
            <button
              id="btn-tab-duel"
              onClick={() => setActiveTab('duel')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors border relative ${
                activeTab === 'duel'
                  ? 'bg-white/5 border-white/10 text-white font-semibold'
                  : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <Swords className="w-3.5 h-3.5 text-purple-400 animate-pulse" /> Consensus Duel
              {activeDuel && activeDuel.status === 'lobby' && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-purple-500 rounded-full animate-pulse" />
              )}
            </button>
            <button
              id="btn-tab-explorer"
              onClick={() => setActiveTab('explorer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors border relative ${
                activeTab === 'explorer'
                  ? 'bg-white/5 border-white/10 text-white font-semibold'
                  : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-blue-400" /> Base Explorer
              {roundFeed.length > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[8px] font-bold font-mono bg-blue-500 text-white rounded-full leading-none">
                  {roundFeed.length}
                </span>
              )}
            </button>
          </div>

          <main className="flex-1 p-4 md:p-8 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
            
            {/* TAB CONTENT: ARENA */}
            {activeTab === 'arena' && (
              <div id="tab-arena-view" className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* Visual game crash panel (Main Area) */}
                <div className="lg:col-span-2 space-y-6">

                  {/* Real-time Duel Active Banner */}
                  {activeDuel && (
                    <div className="bg-gradient-to-r from-purple-950/40 to-indigo-950/40 border border-purple-500/30 rounded-lg p-3.5 flex items-center justify-between font-sans">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400">
                          <Swords className="w-4 h-4 text-purple-400 animate-pulse" />
                        </div>
                        <div>
                          <span className="text-white font-bold block uppercase font-mono tracking-wider text-[11px]">ACTIVE DUEL: {activeDuel.id}</span>
                          <span className="text-slate-400 text-[10px] block font-mono mt-0.5">
                            {activeDuel.status === 'lobby' && "LOBBY OPEN: Place stakes on the table and prepare to initiate."}
                            {activeDuel.status === 'countdown' && `SYNCHRONIZING SECURE TUNNELS... Launching in ${activeDuel.countdownSeconds}s`}
                            {activeDuel.status === 'running' && "SYNCHRONIZED CONSENSUS STREAM LIVE! Monitor peer independent eject status."}
                            {activeDuel.status === 'ended' && "PVP ROUND CONCLUDED. Review payouts and results in the Duel panel."}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setActiveTab('duel')}
                          className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30 rounded px-3 py-1.5 text-[10px] font-bold font-mono uppercase transition-all"
                        >
                          View Board
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Real-time Multiplier Trend Index */}
                  <div id="multiplier-trend-panel" className="bg-[#0b0c10] border border-white/10 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-blue-500/5">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-white font-bold uppercase font-mono tracking-wider text-[11px]">Consensus Trend Index</span>
                      </div>
                      <span className="text-slate-400 text-[10px] block font-sans">
                        Last 10 round multiplier outcomes of the Veklom protocol.
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 flex-1 justify-end flex-wrap sm:flex-nowrap">
                      {/* Trend line SVG sparkline */}
                      <div className="flex items-center gap-2 bg-[#0d0f16] border border-white/5 rounded px-3 py-1.5 shrink-0">
                        <div className="text-[9px] font-mono text-slate-500 uppercase leading-none text-right">
                          <span className="text-emerald-400 font-bold block">{Math.max(...lastTenCrashes).toFixed(1)}x</span>
                          <span className="text-slate-600 block mt-1">Trend</span>
                        </div>
                        <svg className="w-24 h-8 overflow-visible" viewBox="0 0 100 30" id="trend-sparkline-svg">
                          <line x1="0" y1="15" x2="100" y2="15" stroke="rgba(255,255,255,0.03)" strokeDasharray="2 2" />
                          <path
                            d={(() => {
                              const transformed = lastTenCrashes.map(v => Math.log(v));
                              const minT = Math.min(...transformed);
                              const maxT = Math.max(...transformed);
                              const rangeT = maxT - minT || 1;
                              return lastTenCrashes.map((val, idx) => {
                                const x = (idx / 9) * 100;
                                const y = 30 - 3 - ((Math.log(val) - minT) / rangeT) * 24;
                                return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                              }).join(' ');
                            })()}
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="drop-shadow-[0_0_4px_rgba(59,130,246,0.5)]"
                          />
                          {lastTenCrashes.map((val, idx) => {
                            const transformed = lastTenCrashes.map(v => Math.log(v));
                            const minT = Math.min(...transformed);
                            const maxT = Math.max(...transformed);
                            const rangeT = maxT - minT || 1;
                            const x = (idx / 9) * 100;
                            const y = 30 - 3 - ((Math.log(val) - minT) / rangeT) * 24;
                            const isNewest = idx === 9;
                            return (
                              <circle
                                key={idx}
                                cx={x}
                                cy={y}
                                r={isNewest ? 3 : 1.5}
                                fill={isNewest ? '#f43f5e' : val >= 2.0 ? '#10b981' : '#3b82f6'}
                                className={isNewest ? 'animate-ping' : ''}
                              />
                            );
                          })}
                        </svg>
                      </div>

                      {/* Pill list of results */}
                      <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full sm:max-w-[340px] md:max-w-none scrollbar-none">
                        {lastTenCrashes.map((val, idx) => (
                          <div 
                            key={idx} 
                            className={`px-2 py-1 rounded text-[10px] font-bold font-mono border transition-all hover:scale-105 duration-200 shrink-0 ${
                              val >= 2.0 
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                : val >= 1.2
                                ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                : 'bg-red-500/10 border-red-500/20 text-red-400'
                            }`}
                            title={`Round ${idx + 1}`}
                          >
                            {val.toFixed(2)}x
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Flame Meter Component: Visual progress for win streak */}
                  <FlameMeter winStreak={winStreak} />
                  
                  {/* Cyber Crash Arena Stage */}
                  <div className="bg-[#0d0f16] border border-white/10 rounded-lg p-4 relative overflow-hidden aspect-[16/8] md:aspect-[16/7] min-h-[220px] shadow-lg shadow-blue-900/5">
                    <ArenaChart points={chartPoints} phase={phase} currentMulti={multiplier} />

                    {/* Centered large multiplier display overlay */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-center">
                      <div className={`text-4xl md:text-6xl font-bold font-mono tracking-tight transition-all drop-shadow-lg ${
                        phase === 'crashed'
                          ? 'text-red-500 scale-95 blur-[0.5px]'
                          : phase === 'ejected'
                          ? 'text-emerald-400 scale-105'
                          : multiplier >= 3.0
                          ? 'text-amber-500'
                          : 'text-blue-400'
                      }`}>
                        {phase === 'crashed' ? 'COLLAPSE' : `${multiplier.toFixed(2)}x`}
                      </div>
                      <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mt-1">
                        {phase === 'running' 
                          ? 'Trace in progress...' 
                          : phase === 'crashed' 
                          ? `FRACTURED AT ${crashAt.current.toFixed(2)}x` 
                          : phase === 'ejected'
                          ? 'EJECT SUCCESS'
                          : 'Awaiting route initialization'}
                      </div>
                    </div>

                    {/* Left corner details */}
                    <div className="absolute bottom-3 left-4 pointer-events-none font-mono text-[9px] uppercase space-y-1 text-slate-500">
                      <div>Protocol ID: veklom_base_001</div>
                      <div>Secured: 0xCC34...3D1d</div>
                    </div>
                  </div>

                  {/* Quantum Telemetry Packet Registry Visualizer */}
                  <div className="bg-[#0b0c10] border border-white/10 rounded-lg p-5 space-y-4 shadow-lg shadow-blue-500/5">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2 flex-wrap gap-2">
                       <span className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                        <span>// Quantum Telemetry Registry Sync</span>
                      </span>
                      <div className="flex items-center gap-2">
                        {lastLostRound && (
                          <button
                            onClick={() => setIsReplayModalOpen(true)}
                            className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 rounded text-[10px] font-mono text-red-400 font-extrabold uppercase tracking-wider transition-all duration-150 animate-pulse cursor-pointer shadow shadow-red-500/5"
                          >
                            <Eye className="w-3.5 h-3.5" /> Quantum Replay
                          </button>
                        )}
                        {activeHand && (
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                            activeHand.natural ? 'bg-amber-500/20 text-yellow-400 border border-amber-500/30' : 'bg-slate-500/10 text-slate-400'
                          }`}>
                            {activeHand.natural ? '⚡ Natural 8/9!' : 'Standard Settlement'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* PLAYER TELEMETRY CONTAINER */}
                      <div className={`p-4 rounded border transition-all ${
                        activeHand && activeHand.outcome === 'player' && phase !== 'running'
                          ? 'bg-blue-500/10 border-blue-500 shadow-md shadow-blue-500/10'
                          : 'bg-[#06070a]/90 border-white/5'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold text-blue-400 font-sans flex items-center gap-1">
                            ⚡ AGENT A (Vector North)
                          </span>
                          {activeHand && visiblePacketsCount >= 2 && (
                            <span className="text-xs font-mono font-bold bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">
                              {visiblePacketsCount >= 3 ? activeHand.playerScore : ((activeHand.playerPackets[0].scoreValue + activeHand.playerPackets[1].scoreValue) % 10)} Pts
                            </span>
                          )}
                        </div>
                        
                        <div className="flex gap-2 min-h-[90px] items-center justify-center bg-black/20 rounded p-2 border border-white/[0.02]">
                          {activeHand ? (
                            activeHand.playerPackets.map((packet, idx) => {
                              const isVisible = (idx < 2 && visiblePacketsCount >= idx + 1) || (idx === 2 && visiblePacketsCount >= 3);
                              if (!isVisible) {
                                  return (
                                    <div key={idx} className="w-14 h-20 bg-blue-950/20 border border-blue-500/20 text-blue-500/30 font-mono text-center rounded flex items-center justify-center text-[10px] select-none animate-pulse">
                                      [🔒]
                                    </div>
                                  );
                                }
                                const details = getPacketDetails(packet);
                                return (
                                  <div 
                                    key={idx} 
                                    className={`w-14 h-20 rounded border flex flex-col justify-between p-2 select-none font-mono text-center shadow-lg transition-all animate-[slideIn_0.25s_ease-out] ${details.borderClass}`}
                                    style={{ boxShadow: `0 4px 12px ${details.glowColor}` }}
                                  >
                                    <div className="text-[8px] font-bold text-slate-500 text-left leading-none">
                                      {details.label}
                                    </div>
                                    <div className={`text-xs font-black tracking-tighter ${details.colorClass}`}>
                                      {details.hexValue}
                                    </div>
                                    <div className="text-[8px] text-right text-slate-400 font-extrabold leading-none">
                                      WGT:{packet.scoreValue}
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">// Awaiting block deal...</span>
                            )}
                          </div>
                        </div>
  
                        {/* BANKER TELEMETRY CONTAINER */}
                        <div className={`p-4 rounded border transition-all ${
                          activeHand && activeHand.outcome === 'banker' && phase !== 'running'
                            ? 'bg-amber-500/10 border-amber-500 shadow-md shadow-amber-500/10'
                            : 'bg-[#06070a]/90 border-white/5'
                        }`}>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-amber-500 font-sans flex items-center gap-1">
                              🌀 AGENT B (Quiet Switch)
                            </span>
                            {activeHand && visiblePacketsCount >= 2 && (
                              <span className="text-xs font-mono font-bold bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded border border-amber-500/20">
                                {visiblePacketsCount >= 3 ? activeHand.bankerScore : ((activeHand.bankerPackets[0].scoreValue + activeHand.bankerPackets[1].scoreValue) % 10)} Pts
                              </span>
                            )}
                          </div>
  
                          <div className="flex gap-2 min-h-[90px] items-center justify-center bg-black/20 rounded p-2 border border-white/[0.02]">
                            {activeHand ? (
                              activeHand.bankerPackets.map((packet, idx) => {
                                const isVisible = (idx < 2 && visiblePacketsCount >= idx + 1) || (idx === 2 && visiblePacketsCount >= 3);
                                if (!isVisible) {
                                  return (
                                    <div key={idx} className="w-14 h-20 bg-amber-950/20 border border-amber-500/20 text-amber-500/30 font-mono text-center rounded flex items-center justify-center text-[10px] select-none animate-pulse">
                                      [🔒]
                                    </div>
                                  );
                                }
                                const details = getPacketDetails(packet);
                                return (
                                  <div 
                                    key={idx} 
                                    className={`w-14 h-20 rounded border flex flex-col justify-between p-2 select-none font-mono text-center shadow-lg transition-all animate-[slideIn_0.25s_ease-out] ${details.borderClass}`}
                                    style={{ boxShadow: `0 4px 12px ${details.glowColor}` }}
                                  >
                                    <div className="text-[8px] font-bold text-slate-500 text-left leading-none">
                                      {details.label}
                                    </div>
                                    <div className={`text-xs font-black tracking-tighter ${details.colorClass}`}>
                                      {details.hexValue}
                                    </div>
                                    <div className="text-[8px] text-right text-slate-400 font-extrabold leading-none">
                                      WGT:{packet.scoreValue}
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">// Awaiting block deal...</span>
                            )}
                          </div>
                        </div>
                      </div>

                    {/* Winner Outcome Banner Strip */}
                    {activeHand && phase !== 'running' && (
                      <div className={`p-2 rounded text-center font-mono text-xs font-bold uppercase tracking-wider animate-pulse ${
                        activeHand.outcome === 'player'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : activeHand.outcome === 'banker'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {activeHand.outcome === 'player' 
                          ? '⚡ VECTOR NORTH (A) WINS THE TELEMETRY DUEL!' 
                          : activeHand.outcome === 'banker' 
                          ? '🌀 QUIET SWITCH (B) WINS THE TELEMETRY DUEL!' 
                          : '🤝 QUANTUM EQUILIBRIUM TIE SETTLEMENT!'}
                      </div>
                    )}
                  </div>

                  {/* Chips Selection Bar for high precision betting */}
                  <div className="bg-[#0d0f16] border border-white/10 rounded-lg p-4 space-y-3.5 shadow-lg shadow-blue-900/5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2">
                      <div>
                        <h3 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-widest">
                          // Micropayment Chip Selector
                        </h3>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">Pick active chip, then tap Routing board below to stack stakes</p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button 
                          disabled={phase !== 'idle'} 
                          onClick={handleRebet}
                          className="px-2.5 py-1 border border-white/10 hover:border-blue-500/30 rounded bg-white/5 hover:bg-white/10 transition-colors font-mono text-[9px] uppercase font-bold text-slate-350 disabled:opacity-30"
                        >
                          Rebet Prev
                        </button>
                        <button 
                          disabled={phase !== 'idle'} 
                          onClick={handleDoubleBets}
                          className="px-2.5 py-1 border border-white/10 hover:border-amber-500/30 rounded bg-white/5 hover:bg-white/10 transition-colors font-mono text-[9px] uppercase font-bold text-slate-355 disabled:opacity-30"
                        >
                          Double
                        </button>
                        <button 
                          disabled={phase !== 'idle'} 
                          onClick={handleClearBets}
                          className="px-2.5 py-1 border border-red-500/10 hover:border-red-500/30 rounded bg-red-500/5 hover:bg-red-500/10 transition-colors font-mono text-[9px] uppercase font-bold text-red-400 disabled:opacity-30"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-2.5 py-1.5 flex-wrap">
                      {[
                        { value: 0.01, label: '1¢', color: 'from-blue-600 to-cyan-500 shadow-blue-500/20 text-white border-blue-400' },
                        { value: 0.05, label: '5¢', color: 'from-purple-600 to-pink-500 shadow-purple-500/20 text-white border-purple-400' },
                        { value: 0.10, label: '10¢', color: 'from-pink-600 to-rose-500 shadow-pink-500/20 text-white border-pink-400' },
                        { value: 0.25, label: '25¢', color: 'from-amber-600 to-yellow-500 shadow-amber-500/20 text-white border-amber-400' },
                        { value: 1.00, label: '$1', color: 'from-emerald-600 to-teal-500 shadow-emerald-500/20 text-white border-emerald-400' },
                        { value: 5.00, label: '$5', color: 'from-red-650 to-orange-550 shadow-red-500/20 text-white border-red-400' }
                      ].map((chip) => {
                        const isSelected = activeChip === chip.value;
                        return (
                          <button
                            key={chip.value}
                            disabled={phase !== 'idle'}
                            onClick={() => {
                              setActiveChip(chip.value);
                              playSfx(523, 0.04, 'sine', 0.08);
                            }}
                            className={`w-11 h-11 rounded-full bg-gradient-to-br ${chip.color} border flex flex-col items-center justify-center relative cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-md ${
                              isSelected 
                                ? 'ring-4 ring-offset-2 ring-offset-[#0d0f16] ring-blue-500 scale-110 duration-150 rotate-12' 
                                : 'opacity-85'
                            } disabled:opacity-40 disabled:scale-100`}
                          >
                            <div className="absolute inset-0.5 rounded-full border border-dashed border-white/20 pointer-events-none" />
                            <span className="text-[10px] font-black font-mono tracking-tighter leading-none">{chip.label}</span>
                            <span className="text-[6px] font-mono opacity-80 mt-0.5 leading-none">USDC</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* GRAND NEON AGENT DUEL ROUTING INTERACTIVE STAKE SPACES */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    {/* PLAYER NEON AREA */}
                    <div
                      onClick={() => {
                        if (phase !== 'idle') return;
                        const proposed = Number((bets.player + activeChip).toFixed(2));
                        if (proposed + bets.banker + bets.tie > bankroll) {
                          addNotification('collapse', 'Allocation Blocked', 'Insufficient bankroll USDC.');
                          return;
                        }
                        setBets((prev) => ({ ...prev, player: proposed }));
                        playSfx(880, 0.05, 'sine', 0.15);
                      }}
                      className={`p-4 rounded-lg border text-left transition-all relative ${
                        bets.player > 0
                          ? 'bg-blue-500/5 border-blue-500 shadow-md shadow-blue-500/5'
                          : 'bg-[#0d0f16] border-white/5 hover:border-blue-500/20'
                      } ${phase !== 'idle' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-black font-sans text-blue-400 tracking-wider">⚡ AGENT A (Vector)</span>
                        <span className="text-[8px] font-mono text-slate-500 font-bold bg-[#050608]/90 px-1 py-0.5 rounded border border-white/5 uppercase">
                          PAYS 1:1
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-400 tracking-wider uppercase block">Vector North Bias</span>
                      
                      <div className="flex items-baseline justify-between mt-3 pt-2 border-t border-white/[0.03]">
                        <span className="text-[9px] font-mono text-slate-500 uppercase">Staked:</span>
                        <span className="text-sm font-black font-mono text-blue-400">${bets.player.toFixed(2)}</span>
                      </div>

                      {bets.player > 0 && (
                        <div className="absolute -top-1 right-2 w-4 h-4 rounded-full bg-blue-500 border border-white/30 text-[8px] font-black font-mono text-white flex items-center justify-center animate-bounce">
                          •
                        </div>
                      )}
                    </div>

                    {/* TIE EQUILIBRIUM NEON AREA */}
                    <div
                      onClick={() => {
                        if (phase !== 'idle') return;
                        const proposed = Number((bets.tie + activeChip).toFixed(2));
                        if (proposed + bets.player + bets.banker > bankroll) {
                          addNotification('collapse', 'Allocation Blocked', 'Insufficient bankroll USDC.');
                          return;
                        }
                        setBets((prev) => ({ ...prev, tie: proposed }));
                        playSfx(880, 0.05, 'sine', 0.15);
                      }}
                      className={`p-4 rounded-lg border text-left transition-all relative ${
                        bets.tie > 0
                          ? 'bg-emerald-500/5 border-emerald-500 shadow-md shadow-emerald-500/5'
                          : 'bg-[#0d0f16] border-white/5 hover:border-emerald-500/20'
                      } ${phase !== 'idle' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-black font-sans text-emerald-400 tracking-wider">🤝 TIE</span>
                        <span className="text-[8px] font-mono text-emerald-400 font-bold bg-[#050608]/90 px-1 py-0.5 rounded border border-emerald-500/20 uppercase">
                          PAYS 8:1
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-400 tracking-wider uppercase block">Equilibrium state</span>
                      
                      <div className="flex items-baseline justify-between mt-3 pt-2 border-t border-white/[0.03]">
                        <span className="text-[9px] font-mono text-slate-500 uppercase">Staked:</span>
                        <span className="text-sm font-black font-mono text-emerald-400">${bets.tie.toFixed(2)}</span>
                      </div>

                      {bets.tie > 0 && (
                        <div className="absolute -top-1 right-2 w-4 h-4 rounded-full bg-emerald-500 border border-white/30 text-[8px] font-black font-mono text-white flex items-center justify-center animate-bounce">
                          •
                        </div>
                      )}
                    </div>

                    {/* BANKER NEON AREA */}
                    <div
                      onClick={() => {
                        if (phase !== 'idle') return;
                        const proposed = Number((bets.banker + activeChip).toFixed(2));
                        if (proposed + bets.player + bets.tie > bankroll) {
                          addNotification('collapse', 'Allocation Blocked', 'Insufficient bankroll USDC.');
                          return;
                        }
                        setBets((prev) => ({ ...prev, banker: proposed }));
                        playSfx(880, 0.05, 'sine', 0.15);
                      }}
                      className={`p-4 rounded-lg border text-left transition-all relative ${
                        bets.banker > 0
                          ? 'bg-amber-500/5 border-amber-500 shadow-md shadow-amber-500/5'
                          : 'bg-[#0d0f16] border-white/5 hover:border-amber-500/20'
                      } ${phase !== 'idle' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-black font-sans text-amber-500 tracking-wider">🌀 AGENT B (Switch)</span>
                        <span className="text-[8px] font-mono text-slate-500 font-bold bg-[#050608]/90 px-1 py-0.5 rounded border border-white/5 uppercase">
                          PAYS 1:1 (-5%)
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-400 tracking-wider uppercase block">Quiet Switch Bias</span>
                      
                      <div className="flex items-baseline justify-between mt-3 pt-2 border-t border-white/[0.03]">
                        <span className="text-[9px] font-mono text-slate-500 uppercase">Staked:</span>
                        <span className="text-sm font-black font-mono text-amber-500">${bets.banker.toFixed(2)}</span>
                      </div>

                      {bets.banker > 0 && (
                        <div className="absolute -top-1 right-2 w-4 h-4 rounded-full bg-amber-500 border border-white/30 text-[8px] font-black font-mono text-white flex items-center justify-center animate-bounce">
                          •
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Core Action & Stake Selection Controls */}
                  <div className="bg-[#0d0f16] border border-white/10 p-5 rounded-lg flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg shadow-blue-900/5">
                    <div className="w-full md:w-auto">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-2 font-bold">
                        Combined Stake Allocation
                      </span>
                      <div className="text-sm font-black font-mono text-white flex items-baseline gap-2">
                        <span className="text-lg text-amber-500">${wagerAmount.toFixed(2)} USDC</span> staked on this cycle
                      </div>
                      <div className="text-[10px] text-slate-550 font-mono mt-1">
                        Remainder Bankroll pool: <span className="text-slate-350">${bankroll >= wagerAmount ? (bankroll - wagerAmount).toFixed(2) : '0.00'} USDC</span>
                      </div>
                    </div>

                    <div className="w-full md:w-auto shrink-0">
                      {phase !== 'running' ? (
                        <button
                          id="btn-trigger-route"
                          onClick={initiateRoute}
                          disabled={bankroll <= 0 || wagerAmount <= 0}
                          className="w-full md:w-auto py-3 px-10 bg-gradient-to-br from-blue-600 to-indigo-800 hover:from-blue-500 hover:to-indigo-700 disabled:opacity-40 rounded-lg text-white font-sans font-extrabold text-sm uppercase tracking-widest transition-all shadow-lg shadow-blue-900/40 select-none cursor-pointer flex items-center justify-center gap-2 border border-blue-500/35"
                        >
                          <Play className="w-4 h-4 fill-white text-white" /> Initiate Route Trace
                        </button>
                      ) : (
                        <button
                          id="btn-click-eject"
                          onClick={triggerEject}
                          className="w-full md:w-auto py-3 px-10 bg-gradient-to-r from-amber-500 to-[#ff6d00] hover:brightness-110 rounded-lg text-black font-sans font-extrabold text-sm uppercase tracking-widest transition-all animate-pulse shadow-md shadow-amber-500/10 cursor-pointer flex items-center justify-center gap-2"
                        >
                          🚀 Eject & Claim Position
                        </button>
                      )}
                    </div>
                  </div>

                </div>

                {/* Cyber Sideboards (Wallet connect & Feed Notification log) */}
                <div className="space-y-6">
                  {/* Web3 Node Wallet details */}
                  <WalletBlock
                    wallet={wallet}
                    onConnect={handleWalletConnect}
                    onDisconnect={handleWalletDisconnect}
                    onRefreshBalance={handleFaucetDeposit}
                  />

                  {/* M2M SYSTEM AUTOMATION & HFT BOT CONSOLE */}
                  <div className="bg-[#0b0c10] border border-white/10 rounded-lg p-5 font-mono space-y-4 shadow-lg shadow-emerald-500/5">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <div className="flex items-center gap-1.5 text-slate-350">
                        <Cpu className={`w-4 h-4 text-emerald-400 ${m2mEnabled ? 'animate-spin' : ''}`} />
                        <span className="text-xs font-bold uppercase tracking-wider">M2M Automated HFT Bot</span>
                      </div>
                      <button
                        onClick={() => {
                          const newState = !m2mEnabled;
                          setM2mEnabled(newState);
                          if (newState) {
                            addM2mLog("HFT Core spawned. Automated network bidding initiated...", "success");
                            playSfx(523, 0.1, 'sine', 0.15);
                          } else {
                            addM2mLog("HFT Core halted by user sign-off.", "warn");
                            playSfx(330, 0.1, 'sine', 0.15);
                          }
                        }}
                        className={`px-3 py-1 text-[10px] uppercase font-black tracking-widest rounded transition-all border ${
                          m2mEnabled
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/15 animate-pulse'
                            : 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                        }`}
                      >
                        {m2mEnabled ? '● Bot Active' : '○ Bot Dormant'}
                      </button>
                    </div>

                    {/* Strategy Selector */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">
                        Network Strategy Algorithm
                      </label>
                      <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                        {[
                          { id: 'smart', label: 'Adaptive Trend' },
                          { id: 'martingale', label: 'Martingale (2x)' },
                          { id: 'tie-hunt', label: 'Tie Hunt (8x)' },
                          { id: 'random', label: 'Random Walk' }
                        ].map((strat) => (
                          <button
                            key={strat.id}
                            disabled={phase !== 'idle' && m2mEnabled}
                            onClick={() => {
                              setM2mStrategy(strat.id as any);
                              addM2mLog(`Switched algorithm to [${strat.label.toUpperCase()}]`, "info");
                              playSfx(784, 0.05, 'sine', 0.1);
                            }}
                            className={`py-1.5 px-2 text-left rounded border transition-all ${
                              m2mStrategy === strat.id
                                ? 'bg-emerald-500/10 border-emerald-500/80 text-emerald-400 font-bold'
                                : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                            }`}
                          >
                            {strat.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Speed / Clock multiplier controls */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">
                          Clock Multiplier (Hz / Speed)
                        </label>
                        <span className="text-[10px] text-emerald-400 font-bold">{m2mSpeed}x cycles</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 5, 10].map((speed) => (
                          <button
                            key={speed}
                            onClick={() => {
                              setM2mSpeed(speed);
                              addM2mLog(`Execution velocity set to ${speed}x scale.`, "info");
                              playSfx(440 + speed * 40, 0.04, 'sine', 0.1);
                            }}
                            className={`flex-1 py-1 text-center text-[10px] rounded border font-bold transition-all ${
                              m2mSpeed === speed
                                ? 'bg-blue-500/15 border-blue-500/80 text-blue-400'
                                : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                            }`}
                          >
                            {speed}x
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Live Terminal outputs */}
                    <div className="space-y-1.5 pb-1">
                      <label className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">
                        Live Telemetry Terminal Stream
                      </label>
                      <div className="h-32 bg-[#050608] rounded border border-white/5 p-2 overflow-y-auto space-y-1 text-[9px] antialiased select-text">
                        {m2mLogs.length > 0 ? (
                          m2mLogs.map((log) => {
                            let textClass = 'text-slate-400';
                            if (log.type === 'success') textClass = 'text-emerald-400 font-semibold';
                            else if (log.type === 'warn') textClass = 'text-amber-400';
                            else if (log.type === 'error') textClass = 'text-red-400 font-black animate-pulse';
                            else if (log.type === 'metric') textClass = 'text-blue-400';

                            return (
                              <div key={log.id} className="flex gap-1.5 leading-relaxed font-mono">
                                <span className="text-[8px] text-slate-600 shrink-0 font-normal">[{log.time}]</span>
                                <span className={textClass}>{log.msg}</span>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-slate-600 italic text-[9px]">// Awaiting automated trigger initialization...</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Real-time Telemetry Notifier */}
                  <NotificationCenter
                    notifications={notifications}
                    onClear={() => setNotifications([])}
                  />
                  
                  {/* Mini instruction FAQ */}
                  <div className="bg-[#0d0f16] border border-white/10 rounded-lg p-5 font-mono text-[11px] text-slate-500 shadow-lg shadow-blue-900/5">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1.5 uppercase font-bold text-xs">
                      <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                      <span>// Protocol Rules</span>
                    </div>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Choose Vector North [⚡] or Quiet Switch [🌀] as your primary lane racer.</li>
                      <li>Initiate route. Multiplier grows exponentially.</li>
                      <li>Ensure you Eject before the random network collapse occurs. If hijacked, staked USDC is forfeited.</li>
                    </ul>
                  </div>
                </div>

                {/* Scoreboards (Full width below) */}
                <div className="lg:col-span-3">
                  <LeaderboardBlock entries={leaderboard} userAddress={wallet.address} />
                </div>

              </div>
            )}

            {/* TAB CONTENT: ESCROW FACILITATOR */}
            {activeTab === 'escrow' && (
              <div id="tab-escrow-view" className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                <div className="lg:col-span-2">
                  <div className="bg-[#0d0f16] border border-white/10 rounded-lg p-6 space-y-4 shadow-lg shadow-blue-900/5">
                    <h2 className="text-lg font-bold text-white uppercase font-sans flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-amber-500" />
                      dApp Escrow Collaterals & Settlement Pool
                    </h2>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      This application operates asynchronously under the standard <span className="text-white">x402 Facilitator Protocol</span>. 
                      Collateral allocations and settlement cycles are logged permanently on the Base Mainnet blockchain. 
                      Every wager committed during the Agent Duel game interacts directly with the on-chain escrow, triggering automatic distribution of prizes when players eject prior to network crash bounds.
                    </p>

                    <div className="bg-[#050608] p-4 rounded-lg border border-white/5 space-y-3">
                      <span className="text-[10px] font-mono text-slate-500 uppercase block font-bold">
                        // Facilitator Standard Parameters (Base.org)
                      </span>
                      <table className="w-full text-left text-xs font-mono text-slate-300">
                        <thead>
                          <tr className="border-b border-white/5 text-slate-500 text-[10px]">
                            <th className="pb-1 uppercase">Metric Parameters</th>
                            <th className="pb-1 text-right uppercase">Values</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          <tr>
                            <td className="py-2">Base Mainnet Escrow Address</td>
                            <td className="py-2 text-right text-amber-400 select-all">0xCC34553b4e6332ffb9C1b61E22436ACA53113D1d</td>
                          </tr>
                          <tr>
                            <td className="py-2">Liquidity Standard</td>
                            <td className="py-2 text-right text-white font-bold">ERC-404 / Fractional Liquid Nodes</td>
                          </tr>
                          <tr>
                            <td className="py-2">Minimum Collateral Locked</td>
                            <td className="py-2 text-right text-emerald-400">$2,500 USDC</td>
                          </tr>
                          <tr>
                            <td className="py-2">Facilitator Gas Fee Percent</td>
                            <td className="py-2 text-right">1.50%</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div>
                  <FacilitatorBlock escrow={escrow} onDepositCollateral={handleEscrowDeposit} />
                </div>

              </div>
            )}

            {/* TAB CONTENT: DAILY CHALLENGES */}
            {activeTab === 'challenges' && (
              <div id="tab-challenges-view">
                <ChallengesBlock
                  challenges={challenges}
                  onClaimReward={handleClaimReward}
                  onClaimAll={handleClaimAllChallenges}
                  bankroll={bankroll}
                />
              </div>
            )}

            {/* TAB CONTENT: RUST CODE ARCHITECTURE */}
            {activeTab === 'rust-specs' && (
              <div id="tab-rust-view" className="space-y-4">
                <div className="bg-[#0d0f16] border border-white/10 p-5 rounded-lg space-y-2 shadow-lg shadow-blue-900/5">
                  <h2 className="text-base font-bold text-white uppercase font-sans flex items-center gap-2">
                    <Coins className="w-5 h-5 text-blue-400" />
                    High-Performance Multi-File Rust backend Configs
                  </h2>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Below is the live code preview of the clean, production-grade Rust architecture designed for local and containerized deployments. 
                    This layout leverages the <span className="text-white">Axum Web Framework</span> for lightweight asynchronous routing, 
                    <span className="text-white">SQLx</span> for asynchronous PostgreSQL connections, and standard <span className="text-white">Tracing Telemetry</span> JSON formatting.
                  </p>
                </div>

                <RustCodeViewer />
              </div>
            )}

            {/* TAB CONTENT: CONSENSUS DUEL */}
            {activeTab === 'duel' && (
              <div id="tab-duel-view" className="space-y-6">
                <DuelInviteBlock
                  wallet={wallet}
                  activeDuel={activeDuel}
                  onCreateDuel={handleCreateDuel}
                  onJoinDuel={handleJoinDuel}
                  onLeaveDuel={handleLeaveDuel}
                  onToggleSimulatePeer={handleToggleSimulatePeer}
                  onPlaceSimulatedBet={handlePlaceSimulatedBet}
                  onSimulatePeerEject={handleSimulatePeerEject}
                  isSimulatedPeerActive={isSimulatedPeerActive}
                  onStartDuelCountdown={handleStartDuelCountdown}
                />
              </div>
            )}

            {/* TAB CONTENT: BASE L2 BLOCKCHAIN EXPLORER */}
            {activeTab === 'explorer' && (
              <div id="tab-explorer-view" className="space-y-6 font-mono">
                {/* Explorer Welcome & Live Stats Banner */}
                <div className="bg-gradient-to-r from-[#0d111c] to-[#07090e] border border-white/10 rounded-lg p-5 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg shadow-blue-500/5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <h2 className="text-sm font-bold text-white uppercase tracking-wider">// Base Mainnet L2 Sandboxed Ledger Explorer</h2>
                    </div>
                    <p className="text-xs text-slate-400">
                      Real-time transactional audit log for the Veklom x402 Game Engine. All consensus stakes, ejections, and settlements are permanently logged with zero latency.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/30 px-3 py-1.5 rounded text-blue-400 text-xs">
                    <Cpu className="w-3.5 h-3.5 animate-spin" />
                    <span>L2 Gas: <span className="font-bold">0.005 Gwei ($0.00003)</span></span>
                  </div>
                </div>

                {/* Network Statistics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-[#0c0d12] border border-white/5 p-4 rounded-lg">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest block">Base Block Height</span>
                    <span className="text-lg font-bold text-white block mt-1">#{blockHeight.toLocaleString()}</span>
                    <span className="text-[9px] text-emerald-400 font-semibold mt-0.5 block flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Secured (L2 Instant)
                    </span>
                  </div>
                  
                  <div className="bg-[#0c0d12] border border-white/5 p-4 rounded-lg">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest block">Contract Transactions</span>
                    <span className="text-lg font-bold text-blue-400 block mt-1">{(roundFeed.length + 1547).toLocaleString()}</span>
                    <span className="text-[9px] text-slate-400 mt-0.5 block">Total verified executions</span>
                  </div>

                  <div className="bg-[#0c0d12] border border-white/5 p-4 rounded-lg">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest block">x402 Pool Liquidity</span>
                    <span className="text-lg font-bold text-amber-500 block mt-1">${(145890.30 + (wallet.address ? 250 : 0)).toLocaleString(undefined, {minimumFractionDigits: 2})} USDC</span>
                    <span className="text-[9px] text-emerald-400 font-semibold mt-0.5 block flex items-center gap-1">
                      Verified Escrow OK
                    </span>
                  </div>

                  <div className="bg-[#0c0d12] border border-white/5 p-4 rounded-lg">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest block">Settlement Time</span>
                    <span className="text-lg font-bold text-white block mt-1">~2.0 Seconds</span>
                    <span className="text-[9px] text-slate-400 mt-0.5 block">Average Base block interval</span>
                  </div>
                </div>

                {/* Search Bar / Query Interface */}
                <div className="bg-[#0d0f16] border border-white/10 p-4 rounded-lg flex gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search by Transaction Hash (0x...) or Action Type (Stake, Eject, Crash)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#050608] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs uppercase font-bold"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Main Transaction Ledger Section */}
                <div className="bg-[#0d0f16] border border-white/10 rounded-lg overflow-hidden shadow-lg shadow-blue-900/5">
                  <div className="px-5 py-4 border-b border-white/10 bg-[#0a0c12] flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-400" />
                      Verified L2 Transaction Ledger ({roundFeed.length} Game Rounds logged this session)
                    </h3>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase font-bold">
                      Real-time Feed
                    </span>
                  </div>

                  {roundFeed.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      <div className="max-w-md mx-auto space-y-2">
                        <p className="text-slate-400 font-bold uppercase tracking-wide">// No Transaction Ledger Records Yet</p>
                        <p className="text-slate-500 text-[11px] leading-relaxed">
                          Place a chip on the betting grid and trigger a round trace inside the <span className="text-blue-400">Cyber Arena</span>. Complete transactions will automatically appear here on Basescan in real time!
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-[#050608] text-[10px] text-slate-500 uppercase tracking-wider border-b border-white/5">
                          <tr>
                            <th className="py-3 px-4">Tx Hash</th>
                            <th className="py-3 px-4">Method / Action</th>
                            <th className="py-3 px-4">Block Height</th>
                            <th className="py-3 px-4">Age / Time</th>
                            <th className="py-3 px-4">From Address</th>
                            <th className="py-3 px-4">Escrow Value</th>
                            <th className="py-3 px-4 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {roundFeed
                            .filter((tx) => {
                              if (!searchQuery) return true;
                              const query = searchQuery.toLowerCase();
                              return (
                                tx.txHash.toLowerCase().includes(query) ||
                                tx.status.toLowerCase().includes(query) ||
                                (tx.payout > 0 ? 'eject payout' : 'stake commit').includes(query)
                              );
                            })
                            .map((tx, idx) => {
                              const block = blockHeight - (idx * 3) - 1;
                              const secondsAgo = (idx * 5) + 3;
                              const formattedAge = secondsAgo < 60 ? `${secondsAgo}s ago` : `${Math.floor(secondsAgo / 60)}m ${secondsAgo % 60}s ago`;
                              const isWin = tx.payout > tx.wagerAmount;
                              
                              return (
                                <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors group">
                                  {/* Tx Hash */}
                                  <td className="py-3.5 px-4 font-mono">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-blue-400 font-bold group-hover:underline cursor-pointer select-all">
                                        {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-8)}
                                      </span>
                                      <button
                                        onClick={() => {
                                          navigator.clipboard.writeText(tx.txHash);
                                          setCopiedTxId(tx.id);
                                          setTimeout(() => setCopiedTxId(null), 1500);
                                          playSfx(587.33, 0.08, 'sine', 0.1);
                                        }}
                                        title="Copy Tx Hash"
                                        className="text-slate-500 hover:text-slate-300 transition-colors"
                                      >
                                        {copiedTxId === tx.id ? (
                                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                                        ) : (
                                          <Copy className="w-3 h-3" />
                                        )}
                                      </button>
                                    </div>
                                  </td>

                                  {/* Method */}
                                  <td className="py-3.5 px-4">
                                    {tx.status === 'success' ? (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                        Secure Eject / Claim
                                      </span>
                                    ) : tx.status === 'crashed' ? (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-red-500/10 border border-red-500/20 text-red-400">
                                        Consensus Collapse
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-500/10 border border-blue-500/20 text-blue-400">
                                        Stake Escrow Commit
                                      </span>
                                    )}
                                  </td>

                                  {/* Block Height */}
                                  <td className="py-3.5 px-4 font-mono text-slate-400">
                                    #{block.toLocaleString()}
                                  </td>

                                  {/* Age */}
                                  <td className="py-3.5 px-4 text-slate-400 font-sans">
                                    {formattedAge}
                                  </td>

                                  {/* From */}
                                  <td className="py-3.5 px-4 font-mono">
                                    <span className="text-slate-400 select-all">
                                      {wallet.address ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` : '0xMyWalletAddress...'}
                                    </span>
                                  </td>

                                  {/* Escrow Value */}
                                  <td className="py-3.5 px-4 font-mono font-bold">
                                    {tx.status === 'success' ? (
                                      <span className="text-emerald-400">+${tx.payout.toFixed(2)} USDC</span>
                                    ) : (
                                      <span className="text-slate-300">-${tx.wagerAmount.toFixed(2)} USDC</span>
                                    )}
                                  </td>

                                  {/* Status */}
                                  <td className="py-3.5 px-4 text-right">
                                    <div className="inline-flex items-center gap-1.5 bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30 text-[10px] font-black uppercase leading-none">
                                      <Check className="w-3 h-3 stroke-[3]" />
                                      <span>Success</span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Bytecode Argument Decoder Section (Provides extreme technical authenticity) */}
                {roundFeed.length > 0 && (
                  <div className="bg-[#0b0c10] border border-white/10 p-5 rounded-lg space-y-3">
                    <div className="flex items-center gap-1.5 text-white uppercase text-xs font-bold">
                      <Cpu className="w-4 h-4 text-blue-400" />
                      <span>// Live EVM Decoder Inspector</span>
                    </div>
                    <p className="text-slate-400 text-xs">
                      Below is the raw decrypted ABI bytecode payloads compiled on-chain for the most recent game transaction:
                    </p>
                    <div className="bg-[#050608] border border-white/5 rounded p-3 text-[10px] text-slate-400 space-y-2">
                      <div className="flex justify-between border-b border-white/[0.03] pb-1.5">
                        <span className="text-slate-500">Contract ABI Function:</span>
                        <span className="text-blue-400 font-bold">executeEscrowEject(address player, uint256 wager, uint256 ejectMulti)</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-slate-500 block">Raw Input Payload (Data):</span>
                        <div className="bg-black/40 p-2 rounded text-[9px] text-amber-500 select-all break-all leading-relaxed">
                          0x438df9a2000000000000000000000000{wallet.address?.slice(2) || '3a74772e925b54F7dAD7FD95c9Ba30825033f970'}000000000000000000000000000000000000000000000000000000000000004c00000000000000000000000000000000000000000000000000000000000000a5
                        </div>
                      </div>
                      <div className="flex justify-between pt-1 text-[9px]">
                        <span>Gas Limit: <span className="text-white">65,000</span></span>
                        <span>Gas Price: <span className="text-white">0.00501 Gwei</span></span>
                        <span>Facilitator Nonce: <span className="text-amber-500">#{roundFeed.length + 84}</span></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

          </main>

          {/* FOOTER */}
          <footer className="border-t border-white/5 p-4 text-center font-mono text-[10px] text-slate-600 bg-[#0a0c12]/75 select-none shrink-0">
            Agent Duel Node · Cryptographic state verification standard · Signed sessions on Base Mainnet · 0x3a74...f970
          </footer>

        </div>
      </div>

      <QuantumReplayModal
        isOpen={isReplayModalOpen}
        onClose={() => setIsReplayModalOpen(false)}
        replayData={lastLostRound}
      />
    </div>
  );
}
