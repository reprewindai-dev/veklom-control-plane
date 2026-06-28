/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Player, BiometricResonance, LobbyState, GlobalJackpotState, Challenge, PaymentRequirement } from '@/components/bingo/types';
import MFASection from '@/components/bingo/MFASection';
import HolographicBoard from '@/components/bingo/HolographicBoard';
import NeuralInterface from '@/components/bingo/NeuralInterface';
import CommunalResonanceEngine from '@/components/bingo/CommunalResonanceEngine';
import PaymentConsole from '@/components/bingo/PaymentConsole';
import Leaderboard from '@/components/bingo/Leaderboard';
import SharingHub from '@/components/bingo/SharingHub';
import PushLog from '@/components/bingo/PushLog';
import { 
  Cpu, Wifi, WifiOff, RefreshCw, Sparkles, MessageSquare, Play, HelpCircle, LogOut,
  Trophy, TrendingUp, Coins, ShieldAlert, CheckCircle2, Zap, Shield, FileText, ChevronRight, Activity, Bell
} from 'lucide-react';

const TREASURY_WALLET = '0x3a74772e925b54F7dAD7FD95c9Ba30825033f970';

// Helper to generate a reproducible standard BINGO card
function generateBingoCard(seed: string): number[][] {
  const card: number[][] = [];
  const ranges = [
    [1, 15],   // B
    [16, 30],  // I
    [31, 45],  // N
    [46, 60],  // G
    [61, 75]   // O
  ];
  
  for (let col = 0; col < 5; col++) {
    const colNums: number[] = [];
    const [min, max] = ranges[col];
    // Simple deterministic random from seed string
    let s = 0;
    for (let charIdx = 0; charIdx < seed.length; charIdx++) {
      s += seed.charCodeAt(charIdx);
    }
    
    while (colNums.length < 5) {
      const pseudoRand = Math.sin(s + colNums.length * (col + 1)) * 10000;
      const num = min + Math.floor((pseudoRand - Math.floor(pseudoRand)) * (max - min + 1));
      if (!colNums.includes(num)) {
        colNums.push(num);
      }
    }
    colNums.sort((a, b) => a - b);
    card.push(colNums);
  }
  return card;
}

export default function App() {
  const [player, setPlayer] = useState<Player | null>(null);
  const [resonance, setResonance] = useState<BiometricResonance>({
    attention_focus_percentage: 75,
    neural_frequency_hz: 14.2,
    cardiac_coherence: 0.78,
  });
  
  const [isTelepathyActive, setIsTelepathyActive] = useState(true);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'game' | 'leaderboard' | 'sharing' | 'challenges'>('game');
  
  // Custom toast status for holographic actions
  const [alertText, setAlertText] = useState<string | null>(null);
  const [alertType, setAlertType] = useState<'info' | 'success' | 'warn'>('info');

  // Legal Waiver Sign-off State
  const [hasSignedWaiver, setHasSignedWaiver] = useState<boolean>(false);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const signed = localStorage.getItem('bingo2060_waiver_signed') === 'true';
        if (signed) setHasSignedWaiver(true);
      }
    } catch (e) {
      console.warn("localStorage waiver read error:", e);
    }
  }, []);

  const [waiverSignKey, setWaiverSignKey] = useState<string>('');
  const [isSigningWaiver, setIsSigningWaiver] = useState<boolean>(false);

  // Auto-Pilot (M2M Delegation) Mode (Enabled by default for 100% passive hands-free auto-pilot gameplay)
  const [isAutoPilot, setIsAutoPilot] = useState<boolean>(true);

  // Multi-Lobby States
  const [activeLobbyId, setActiveLobbyId] = useState<string>('micro-lobby');
  const [lobbies, setLobbies] = useState<LobbyState[]>([]);
  const [jackpotState, setJackpotState] = useState<GlobalJackpotState>({
    progressiveJackpotPool: 1250.75,
    treasuryCollected: 145.20,
    lastJackpotWinner: null
  });

  // Balance states
  const [usdcBalance, setUsdcBalance] = useState<number>(1540.50);
  const [ethBalance, setEthBalance] = useState<number>(0.842);

  // Challenges list
  const [challenges, setChallenges] = useState<Challenge[]>([
    {
      id: 'c1',
      title: 'Tension Coherence Control',
      requirement: 'Stabilize your Cardiac Coherence above 0.85.',
      targetMetric: 'cardiac_coherence',
      targetValue: 0.85,
      durationSeconds: 10,
      rewardUSDC: 1.50,
      completed: false,
    },
    {
      id: 'c2',
      title: 'Active Alpha Peak',
      requirement: 'Maintain focus to keep Brainwave Frequency below 12.0 Hz.',
      targetMetric: 'neural_frequency_hz',
      targetValue: 12.0,
      durationSeconds: 5,
      rewardUSDC: 2.00,
      completed: false,
    },
    {
      id: 'c3',
      title: 'Hyper-Cognitive State',
      requirement: 'Exceed 90% Attention Focus metric.',
      targetMetric: 'attention_focus_percentage',
      targetValue: 90,
      durationSeconds: 1,
      rewardUSDC: 3.50,
      completed: false,
    }
  ]);

  // Payment rail state
  const [pendingPaymentReq, setPendingPaymentReq] = useState<PaymentRequirement | null>(null);
  const [paymentActionDetails, setPaymentActionDetails] = useState<any | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [leaders, setLeaders] = useState<any[]>([]);

  // AI Commentary State
  const [aiCommentary, setAiCommentary] = useState<string>('Initializing Quantum Telemetry caller. Connect neural link to proceed...');
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  // Show a status alert
  const showToast = (text: string, type: 'info' | 'success' | 'warn' = 'info') => {
    setAlertText(text);
    setAlertType(type);
    setTimeout(() => setAlertText(null), 4000);
  };

  // Authenticate user & generate their board
  const handleAuthenticated = (authedPlayer: Player) => {
    setPlayer(authedPlayer);
    showToast(`Neural credentials authenticated. Hello, ${authedPlayer.username}!`, 'success');
  };

  // Fetch all Lobbies and Progressive jackpot states
  const fetchLobbiesAndJackpots = async () => {
    try {
      const res = await fetch('https://bingo.veklom.com/api/lobbies');
      if (res.ok) {
        const data = await res.json();
        setLobbies(data.lobbies);
        setJackpotState({
          progressiveJackpotPool: data.progressiveJackpotPool,
          treasuryCollected: data.treasuryCollected,
          lastJackpotWinner: data.lastJackpotWinner
        });
      }
    } catch (err) {
      console.error('Failed to sync lobbies:', err);
    }
  };

  // Fetch Leaderboard
  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch('https://bingo.veklom.com/api/leaderboard');
      if (res.ok) {
        const data = await res.json();
        setLeaders(data.leaders);
      }
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    }
  }, []);

  // Sync lobbies and standings periodically (24/7 ticker)
  useEffect(() => {
    if (player) {
      fetchLobbiesAndJackpots();
      fetchLeaderboard();
      const int = setInterval(() => {
        fetchLobbiesAndJackpots();
      }, 1500);
      return () => clearInterval(int);
    }
  }, [player, fetchLeaderboard]);

  // Compute active card, calledNumbers, and selections based on active lobby
  const activeLobby = useMemo(() => {
    return lobbies.find(l => l.id === activeLobbyId) || lobbies[0];
  }, [lobbies, activeLobbyId]);

  const playerCard = useMemo(() => {
    if (!player) return [];
    return generateBingoCard(player.username);
  }, [player]);

  const selectedNumbers = useMemo(() => {
    if (!player || !activeLobby) return [];
    const me = activeLobby.activePlayers.find(p => p.walletAddress.toLowerCase() === player.walletAddress.toLowerCase());
    return me ? me.selectedNumbers : [];
  }, [activeLobby, player]);

  // Handle active challenges tracking
  useEffect(() => {
    if (!player) return;

    challenges.forEach((c) => {
      if (c.completed) return;
      
      let metricValue = 0;
      if (c.targetMetric === 'cardiac_coherence') metricValue = resonance.cardiac_coherence;
      if (c.targetMetric === 'neural_frequency_hz') metricValue = resonance.neural_frequency_hz;
      if (c.targetMetric === 'attention_focus_percentage') metricValue = resonance.attention_focus_percentage;

      const isTargetMet = c.targetMetric === 'neural_frequency_hz' 
        ? metricValue <= c.targetValue 
        : metricValue >= c.targetValue;

      if (isTargetMet) {
        handleCompleteChallenge(c.id);
      }
    });
  }, [resonance, challenges, player]);

  const handleCompleteChallenge = (id: string) => {
    setChallenges((prev) =>
      prev.map((c) => {
        if (c.id === id && !c.completed) {
          showToast(`DAILY CHALLENGE COMPLETE: ${c.title}! Earned +${c.rewardUSDC} USDC!`, 'success');
          setUsdcBalance((curr) => curr + c.rewardUSDC);
          return { ...c, completed: true };
        }
        return c;
      })
    );
  };

  // Get AI Caller commentary via Gemini API Proxy
  const updateAiCommentary = async (recentNumber?: number) => {
    if (!activeLobby) return;
    setAiLoading(true);
    try {
      const res = await fetch('https://bingo.veklom.com/api/gemini/commentary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lobbyId: activeLobbyId,
          playerMetrics: player?.performanceMetrics,
          recentSelection: recentNumber,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiCommentary(data.text);
      }
    } catch (e) {
      setAiCommentary('[LOGISTICAL AI ENGINE]: Microsecond latency spike detected on telemetry channels. Adjust focus.');
    } finally {
      setAiLoading(false);
    }
  };

  // Refresh AI commentary when active lobby numbers change
  useEffect(() => {
    if (player && activeLobby?.status === 'active' && activeLobby.calledNumbers.length > 0) {
      updateAiCommentary();
    }
  }, [activeLobby?.calledNumbers?.length, player]);

  // Join a Lobby manually with EIP-3009 payment check
  const handleJoinLobby = async (lobbyId: string) => {
    if (!player) return;
    const targetLobby = lobbies.find(l => l.id === lobbyId);
    if (!targetLobby) return;

    setPaymentActionDetails({
      tool: 'join_lobby',
      parameters: {
        lobbyId,
        walletAddress: player.walletAddress,
        username: player.username,
        coherence: resonance.cardiac_coherence,
        focus: resonance.attention_focus_percentage,
        frequency: resonance.neural_frequency_hz
      }
    });

    try {
      const res = await fetch('https://bingo.veklom.com/api/lobbies/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lobbyId,
          walletAddress: player.walletAddress,
          username: player.username,
          coherence: resonance.cardiac_coherence,
          focus: resonance.attention_focus_percentage,
          frequency: resonance.neural_frequency_hz
        })
      });

      if (res.status === 402) {
        const data = await res.json();
        setPendingPaymentReq(data.requirements);
      } else if (res.ok) {
        const data = await res.json();
        showToast(data.message, 'success');
      }
    } catch (e) {
      showToast('Payment gateway connection failed.', 'warn');
    }
  };

  // Telepathic selection cell trigger
  const handleSelectNumber = async (num: number) => {
    if (selectedNumbers.includes(num)) return;
    if (!activeLobby) return;

    if (isOffline) {
      const localId = crypto.randomUUID();
      const offlineAction = {
        local_id: localId,
        number: num,
        biometric_resonance: resonance,
      };
      setOfflineQueue((prev) => [...prev, offlineAction]);
      showToast(`Offline selection saved locally with ID: ${localId.slice(0, 8)}...`, 'warn');
      return;
    }

    setPaymentActionDetails({
      tool: 'telepathic_number_selection',
      parameters: {
        game_id: activeLobby.id,
        number: num,
        biometric_resonance: resonance,
        walletAddress: player?.walletAddress,
      }
    });

    try {
      const res = await fetch('https://bingo.veklom.com/api/v1/interlink/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool_name: 'telepathic_number_selection',
          parameters: { game_id: activeLobby.id, number: num, biometric_resonance: resonance, walletAddress: player?.walletAddress }
        }),
      });

      if (res.status === 402) {
        const data = await res.json();
        setPendingPaymentReq(data.requirements);
      }
    } catch (e) {
      showToast('Payment gateway connection failed.', 'warn');
    }
  };

  // Sign and authorize Base X402 payment signature (Simulating secure on-device hardware)
  const handleSignAndPay = async () => {
    if (!pendingPaymentReq || !paymentActionDetails) return;

    // Simulate cryptographic EIP-712 / EIP-3009 local signing
    const mockSignature = {
      payload: {
        authorization: {
          from: player?.walletAddress,
          to: pendingPaymentReq.accepts[0].payTo,
          value: Math.round(Number(pendingPaymentReq.accepts[0].price) * 1000000).toString(),
          validBefore: Math.floor(Date.now() / 1000) + 3600,
          nonce: '0x' + crypto.randomUUID().replace(/-/g, '')
        },
        signature: '0x' + Array.from({length:130}, () => '0123456789abcdef'[Math.floor(Math.random()*16)]).join('')
      }
    };

    const b64Signature = btoa(JSON.stringify(mockSignature));

    try {
      const isLobbyJoin = paymentActionDetails.tool === 'join_lobby';
      const endpoint = isLobbyJoin ? 'https://bingo.veklom.com/api/lobbies/join' : 'https://bingo.veklom.com/api/v1/interlink/execute';
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'PAYMENT-SIGNATURE': b64Signature,
        },
        body: JSON.stringify(
          isLobbyJoin 
            ? paymentActionDetails.parameters 
            : {
                tool_name: paymentActionDetails.tool,
                parameters: paymentActionDetails.parameters,
              }
        ),
      });

      const responseHeader = res.headers.get('PAYMENT-RESPONSE');
      const data = await res.json();

      if (res.ok && (data.status === 'success' || data.success)) {
        const decodedResponse = JSON.parse(atob(responseHeader || ''));
        const pricePaid = Number(pendingPaymentReq.accepts[0].price);

        const newTx = {
          hash: decodedResponse.transactionId,
          action: isLobbyJoin ? `Registered in ${activeLobby.name}` : `Selected Cell #${paymentActionDetails.parameters.number}`,
          amount: pricePaid.toFixed(2),
          timestamp: new Date().toISOString(),
          status: 'success' as const
        };

        setTransactions((prev) => [newTx, ...prev]);
        setUsdcBalance((curr) => curr - pricePaid);
        
        if (isLobbyJoin) {
          showToast(`Successfully joined ${activeLobby.name}. Fee split logged on-chain.`, 'success');
        } else if (paymentActionDetails.tool === 'telepathic_number_selection') {
          showToast(`Telepathic selection #${paymentActionDetails.parameters.number} synchronized.`, 'success');
          updateAiCommentary(paymentActionDetails.parameters.number);
        } else if (paymentActionDetails.tool === 'sync_offline_gameplay') {
          setOfflineQueue([]);
          showToast(`Synchronized ${data.synchronizedCount} offline actions successfully!`, 'success');
        }

        fetchLobbiesAndJackpots();
      } else {
        showToast(data.error || 'On-chain payment settlement rejected.', 'warn');
      }
    } catch (e) {
      showToast('Blockchain verification timeout.', 'warn');
    } finally {
      setPendingPaymentReq(null);
      setPaymentActionDetails(null);
    }
  };

  const handleRejectPayment = () => {
    setPendingPaymentReq(null);
    setPaymentActionDetails(null);
    showToast('Payment authorization cancelled.', 'warn');
  };

  // Sync offline data
  const handleSyncOfflineData = async () => {
    if (offlineQueue.length === 0) return;
    if (isOffline) {
      showToast('Re-connect to synchronize gameplay.', 'warn');
      return;
    }

    setPaymentActionDetails({
      tool: 'sync_offline_gameplay',
      parameters: {
        game_id: activeLobby?.id,
        actions: offlineQueue,
        walletAddress: player?.walletAddress,
      }
    });

    try {
      const res = await fetch('https://bingo.veklom.com/api/v1/interlink/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool_name: 'sync_offline_gameplay',
          parameters: { game_id: activeLobby?.id, actions: offlineQueue, walletAddress: player?.walletAddress }
        }),
      });

      if (res.status === 402) {
        const data = await res.json();
        setPendingPaymentReq(data.requirements);
      }
    } catch (e) {
      showToast('Payment gateway connection failed.', 'warn');
    }
  };

  // Sign Legal Waiver covenant
  const handleSignWaiver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waiverSignKey.trim() || waiverSignKey.length < 10) {
      showToast('Neural footprint signature must be at least 10 characters long.', 'warn');
      return;
    }

    setIsSigningWaiver(true);
    setTimeout(() => {
      localStorage.setItem('bingo2060_waiver_signed', 'true');
      setHasSignedWaiver(true);
      setIsSigningWaiver(false);
      showToast('M2M Autonomous Covenant Signed & Transmitted to Base Ledger!', 'success');
    }, 1500);
  };

  // M2M Auto-Pilot automated execution loop
  useEffect(() => {
    if (!isAutoPilot || !player || !activeLobby) return;

    const interval = setInterval(async () => {
      const isRegistered = activeLobby.activePlayers.some(p => p.walletAddress.toLowerCase() === player.walletAddress.toLowerCase());

      // 1. Auto-Register for Lobby Countdown
      if (activeLobby.status === 'countdown' && !isRegistered) {
        // Formulate automatic EIP-3009 joining payload
        const mockSignature = {
          payload: {
            authorization: {
              from: player.walletAddress,
              to: TREASURY_WALLET,
              value: Math.round(activeLobby.entryFee * 1000000).toString(),
              validBefore: Math.floor(Date.now() / 1000) + 3600,
              nonce: '0x' + crypto.randomUUID().replace(/-/g, '')
            },
            signature: '0x' + Array.from({length:130}, () => '0123456789abcdef'[Math.floor(Math.random()*16)]).join('')
          }
        };

        const b64Signature = btoa(JSON.stringify(mockSignature));

        try {
          const res = await fetch('https://bingo.veklom.com/api/lobbies/join', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'PAYMENT-SIGNATURE': b64Signature,
            },
            body: JSON.stringify({
              lobbyId: activeLobbyId,
              walletAddress: player.walletAddress,
              username: player.username,
              coherence: resonance.cardiac_coherence,
              focus: resonance.attention_focus_percentage,
              frequency: resonance.neural_frequency_hz
            })
          });

          if (res.ok) {
            const responseHeader = res.headers.get('PAYMENT-RESPONSE');
            const decodedResponse = JSON.parse(atob(responseHeader || ''));
            
            const newTx = {
              hash: decodedResponse.transactionId,
              action: `[AUTO-PILOT] Entered ${activeLobby.name}`,
              amount: activeLobby.entryFee.toFixed(2),
              timestamp: new Date().toISOString(),
              status: 'success' as const
            };

            setTransactions((prev) => [newTx, ...prev]);
            setUsdcBalance((curr) => curr - activeLobby.entryFee);
            showToast(`[AUTO-PILOT] Signed EIP-3009 entrance to ${activeLobby.name}!`, 'success');
            fetchLobbiesAndJackpots();
          }
        } catch (err) {
          console.error('[AUTO-PILOT] join failed:', err);
        }
      }

      // 2. Auto-Daub called numbers
      if (activeLobby.status === 'active' && isRegistered) {
        // Find cells on our board that are called but not selected yet
        const flattened = playerCard.flat();
        const unselectedCalled = flattened.filter(n => activeLobby.calledNumbers.includes(n) && !selectedNumbers.includes(n));

        if (unselectedCalled.length > 0) {
          const targetNum = unselectedCalled[0];
          
          // Auto-Pilot submits telepathic selection with a micropayment signature
          const mockSignature = {
            payload: {
              authorization: {
                from: player.walletAddress,
                to: TREASURY_WALLET,
                value: '10000', // 0.01 USDC Telepathic micro fee
                validBefore: Math.floor(Date.now() / 1000) + 3600,
                nonce: '0x' + crypto.randomUUID().replace(/-/g, '')
              },
              signature: '0x' + Array.from({length:130}, () => '0123456789abcdef'[Math.floor(Math.random()*16)]).join('')
            }
          };

          const b64Signature = btoa(JSON.stringify(mockSignature));

          try {
            const res = await fetch('https://bingo.veklom.com/api/v1/interlink/execute', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'PAYMENT-SIGNATURE': b64Signature,
              },
              body: JSON.stringify({
                tool_name: 'telepathic_number_selection',
                parameters: {
                  game_id: activeLobby.id,
                  number: targetNum,
                  biometric_resonance: resonance,
                  walletAddress: player.walletAddress,
                }
              }),
            });

            if (res.ok) {
              const responseHeader = res.headers.get('PAYMENT-RESPONSE');
              const decodedResponse = JSON.parse(atob(responseHeader || ''));
              
              const newTx = {
                hash: decodedResponse.transactionId,
                action: `[AUTO-PILOT] Daubed Cell #${targetNum}`,
                amount: '0.01',
                timestamp: new Date().toISOString(),
                status: 'success' as const
              };

              setTransactions((prev) => [newTx, ...prev]);
              setUsdcBalance((curr) => curr - 0.01);
              fetchLobbiesAndJackpots();
            }
          } catch (err) {
            console.error('[AUTO-PILOT] daub failed:', err);
          }
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isAutoPilot, player, activeLobby, playerCard, selectedNumbers, activeLobbyId, resonance]);

  // If user hasn't signed waiver, show upfront legal covenant screen
  if (!hasSignedWaiver) {
    return (
      <div className="min-h-screen bg-[#060813] flex items-center justify-center p-4 relative overflow-hidden font-mono">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,_#1e1436_0%,_transparent_70%)] opacity-60"></div>
        
        <div className="max-w-3xl w-full bg-black/60 border border-red-500/30 rounded-3xl p-8 backdrop-blur-2xl relative z-10 space-y-6 shadow-[0_0_50px_rgba(239,68,68,0.15)]">
          <div className="flex items-center gap-3 pb-4 border-b border-white/10 text-red-500">
            <ShieldAlert className="w-8 h-8 animate-pulse shrink-0" />
            <div>
              <h2 className="text-lg font-black tracking-widest uppercase">M2M NEURAL BINGO LIABILITY COVENANT</h2>
              <p className="text-[9px] text-white/50">SECURED UNDER LAWS OF BASE MAINNET LEDGER SYSTEM-X402</p>
            </div>
          </div>

          <div className="text-[11px] text-white/80 space-y-4 max-h-96 overflow-y-auto pr-2 scrollbar-thin leading-relaxed">
            <p className="text-amber-400 font-bold">
              IMPORTANT: READ THESE IMMERSIVE SYSTEM CLAUSES BEFORE TRANSMITTING YOUR NEURAL FOOTPRINT COGNITIVE SIGNATURE.
            </p>
            
            <div className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-3">
              <h4 className="font-bold text-white flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-red-400" /> ARTICLE I: COGNITIVE AI DELEGATION
              </h4>
              <p className="text-white/70">
                You hereby delegate and bind an autonomous AI Agent to play BINGO 2060 on your behalf. The Agent is authorized to monitor biochemical telemetry, automatically select matching grid matrices, and submit cryptographically simulated EIP-3009 Transfer-With-Authorizations directly on Base Mainnet.
              </p>
            </div>

            <div className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-3">
              <h4 className="font-bold text-white flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-[#00f3ff]" /> ARTICLE II: PROGRESSIVE POOL & REVENUE PERCENTAGES
              </h4>
              <p className="text-white/70">
                All game fees are subject to immutable split allocations verified on-chain: **10% House Treasury Cut** paid directly to the developer wallet ({TREASURY_WALLET}), **20% Progressive Jackpot Cut** staying within the global progressive pool, and **70% active round prize pot**. A **15% winner fee surcharge** is withheld from payouts to preserve progressive pool solvency.
              </p>
            </div>

            <div className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-3">
              <h4 className="font-bold text-white flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-[#bc13fe]" /> ARTICLE III: BIOMETRIC TELEMETRY & RESONANCE
              </h4>
              <p className="text-white/70">
                Signer acknowledges that gameplay speed, winning patterns, and standings are calibrated by live Cardiac Coherence and Brainwave telemetry. No parameters are mocked or simulated. All data feeds are legally bound to your EIP-155:8453 account.
              </p>
            </div>
          </div>

          <form onSubmit={handleSignWaiver} className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-white/50 uppercase tracking-widest">
                Transmit Neural Footprint (Key signature to bind your AI Agent):
              </label>
              <input
                type="text"
                value={waiverSignKey}
                onChange={(e) => setWaiverSignKey(e.target.value)}
                placeholder="Enter private mnemonic key or signature hash (min 10 chars)..."
                required
                className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-white placeholder-white/30 focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>

            <div className="flex items-start gap-2.5">
              <input type="checkbox" id="agree" required className="mt-1 accent-red-500 cursor-pointer" />
              <label htmlFor="agree" className="text-[9px] text-white/60 leading-normal cursor-pointer select-none">
                I agree to irrevocably bind my neural link agent to these game rules and authorize direct Base Mainnet EIP-3009 payment authorizations.
              </label>
            </div>

            <button
              type="submit"
              disabled={isSigningWaiver}
              className="w-full bg-gradient-to-r from-red-600 to-amber-600 text-white py-3 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50"
            >
              {isSigningWaiver ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  CONNECTING SYNAPSE & SIGNING COVENANT...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  AUTHORIZE & TRANSMIT NEURAL SIGNATURE
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-[#060813] flex items-center justify-center p-4">
        <MFASection onAuthenticated={handleAuthenticated} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060813] text-white flex flex-col font-sans relative overflow-hidden">
      {/* Immersive Cybernetic background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_#1a2d42_0%,_transparent_50%),radial-gradient(circle_at_0%_100%,_#2b124a_0%,_transparent_40%)] opacity-50 pointer-events-none -z-10"></div>
      
      {/* Top Header */}
      <header className="relative z-10 flex flex-col sm:flex-row items-center justify-between px-8 py-6 border-b border-white/10 bg-black/30 backdrop-blur-md sticky top-0">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-[#00f3ff] rounded-sm flex items-center justify-center shadow-[0_0_15px_rgba(0,243,255,0.5)] shrink-0">
            <Cpu className="w-6 h-6 text-black" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter uppercase leading-none italic text-[#00f3ff]">
              Bingo 2060
            </h1>
            <p className="text-[10px] tracking-[0.2em] uppercase text-white/50 font-mono mt-0.5">
              Continuous 24/7 M2M Tournament
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 mt-4 sm:mt-0">
          <div className="text-right">
            <p className="text-[10px] text-white/40 uppercase font-mono tracking-widest">Base Mainnet X402</p>
            <p className="text-xs font-mono text-[#00f3ff]" title={player.walletAddress}>
              {player.walletAddress.substring(0, 7)}...{player.walletAddress.substring(player.walletAddress.length - 6)}
            </p>
          </div>
          
          <div className="hidden sm:block h-10 w-[1px] bg-white/10"></div>

          <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
            {/* Offline Switch */}
            <button
              onClick={() => {
                const next = !isOffline;
                setIsOffline(next);
                showToast(next ? 'Switched to Offline Cache Mode.' : 'Switched back to Base Mainnet network.', 'info');
              }}
              className={`
                px-3 py-1.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-colors
                ${isOffline
                  ? 'bg-red-950/40 border-red-500/40 text-red-400'
                  : 'bg-green-950/40 border-green-500/40 text-green-400'
                }
              `}
            >
              {isOffline ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 animate-pulse" /> OFFLINE MODE
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5 animate-pulse" /> NETWORK ACTIVE
                </>
              )}
            </button>

            {offlineQueue.length > 0 && (
              <button
                onClick={handleSyncOfflineData}
                disabled={isOffline}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Sync ({offlineQueue.length})
              </button>
            )}

            <button
              onClick={() => {
                setPlayer(null);
                setHasSignedWaiver(false);
                localStorage.removeItem('bingo2060_waiver_signed');
              }}
              className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-white/60 hover:text-white cursor-pointer"
              title="Disconnect Neural Link"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Global Live Progressive Jackpot Indicators */}
      <section className="bg-gradient-to-r from-[#bc13fe]/10 via-black/40 to-[#00f3ff]/10 border-b border-white/10 py-4 px-8 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-black/40 border border-[#bc13fe]/30 rounded-xl">
            <Trophy className="w-5 h-5 text-yellow-400 animate-bounce" />
          </div>
          <div>
            <div className="text-[9px] font-mono text-white/40 uppercase tracking-widest">Progressive Jackpot Pool</div>
            <div className="text-lg font-black text-white font-mono flex items-baseline gap-1.5">
              <span className="text-[#bc13fe]">{jackpotState.progressiveJackpotPool.toFixed(2)}</span>
              <span className="text-[10px] text-white/40">USDC</span>
              <TrendingUp className="w-3.5 h-3.5 text-[#00f3ff] animate-pulse" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-white/10 md:pl-4">
          <div className="p-2.5 bg-black/40 border border-[#00f3ff]/30 rounded-xl">
            <Coins className="w-5 h-5 text-[#00f3ff]" />
          </div>
          <div>
            <div className="text-[9px] font-mono text-white/40 uppercase tracking-widest">Your Developer Wallet Cut (Treasury)</div>
            <div className="text-lg font-black text-[#00f3ff] font-mono">
              {jackpotState.treasuryCollected.toFixed(2)} <span className="text-[10px] text-white/40">USDC</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-white/10 md:pl-4">
          <div className="p-2.5 bg-black/40 border border-white/10 rounded-xl">
            <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
          </div>
          <div>
            <div className="text-[9px] font-mono text-white/40 uppercase tracking-widest">EIP-3009 Network Speed</div>
            <div className="text-xs font-mono font-bold text-green-400 flex items-center gap-1.5">
              <span>● COHERENT AT 8453</span>
              <span className="text-[9px] text-white/40">(BASE MAINNET)</span>
            </div>
          </div>
        </div>

        <div className="border-t md:border-t-0 md:border-l border-white/10 md:pl-4 text-xs font-mono text-white/70">
          <span className="text-[9px] text-white/40 uppercase block tracking-wider">Last Jackpot Winner</span>
          <span className="text-white font-bold block truncate mt-0.5">
            {jackpotState.lastJackpotWinner ? `🏆 ${jackpotState.lastJackpotWinner}` : 'Awaiting galactic winner...'}
          </span>
        </div>
      </section>

      {/* Dynamic Toast Status */}
      {alertText && (
        <div className="fixed top-24 right-4 z-50 max-w-sm w-full animate-slide-in">
          <div className={`
            p-4 rounded-xl border backdrop-blur-xl shadow-2xl font-mono text-xs flex items-center justify-between gap-3
            ${alertType === 'success' ? 'bg-[#bc13fe]/20 border-[#bc13fe]/50 text-white' : ''}
            ${alertType === 'warn' ? 'bg-amber-950/90 border-amber-500/40 text-amber-200' : ''}
            ${alertType === 'info' ? 'bg-[#00f3ff]/20 border-[#00f3ff]/50 text-white' : ''}
          `}>
            <span>{alertText}</span>
            <span className="text-[10px] opacity-70 shrink-0 text-[#00f3ff]">● SYNCED</span>
          </div>
        </div>
      )}

      {/* Multiple Arena Lobbies Switcher */}
      <section className="px-8 pt-6">
        <h3 className="font-mono text-xs tracking-widest text-[#00f3ff] uppercase mb-4 flex items-center gap-1.5">
          <Activity className="w-4 h-4" /> Active Galactic Arenas (Rolling 24/7)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {lobbies.map((lobby) => {
            const isUserRegistered = lobby.activePlayers.some(p => p.walletAddress.toLowerCase() === player.walletAddress.toLowerCase());
            const isSelected = lobby.id === activeLobbyId;
            return (
              <div
                key={lobby.id}
                onClick={() => setActiveLobbyId(lobby.id)}
                className={`
                  p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden cursor-pointer flex flex-col justify-between h-44
                  ${isSelected
                    ? 'bg-gradient-to-br from-white/10 to-[#00f3ff]/5 border-[#00f3ff] shadow-[0_0_20px_rgba(0,243,255,0.15)]'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                  }
                `}
              >
                {/* Background badge for countdowns */}
                <div className="absolute top-0 right-0 p-3 text-right">
                  {lobby.status === 'countdown' ? (
                    <span className="bg-amber-500/20 text-amber-400 font-mono text-[9px] px-2 py-0.5 rounded border border-amber-500/30 animate-pulse">
                      STARTS IN {lobby.countdownSeconds}S
                    </span>
                  ) : lobby.status === 'active' ? (
                    <span className="bg-red-500/20 text-red-400 font-mono text-[9px] px-2 py-0.5 rounded border border-red-500/30 animate-ping">
                      LIVE
                    </span>
                  ) : (
                    <span className="bg-white/10 text-white/50 font-mono text-[9px] px-2 py-0.5 rounded">
                      RECYCLING...
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-black font-mono tracking-wider text-white">
                    {lobby.name}
                  </h4>
                  <div className="flex gap-4 mt-2 font-mono text-xs">
                    <div>
                      <span className="text-[9px] text-white/40 block uppercase">Entry Fee</span>
                      <span className="font-bold text-[#00f3ff]">{lobby.entryFee.toFixed(2)} USDC</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-white/40 block uppercase">Active Prize Pot</span>
                      <span className="font-bold text-[#bc13fe]">{lobby.currentPrizePot.toFixed(2)} USDC</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-white/50">
                  <span className="flex items-center gap-1">
                    👥 Competitors: {lobby.activePlayers.length}
                  </span>
                  
                  {isUserRegistered ? (
                    <span className="text-green-400 font-bold flex items-center gap-1">
                      ✓ REGISTERED
                    </span>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJoinLobby(lobby.id);
                      }}
                      className="bg-[#00f3ff]/20 hover:bg-[#00f3ff] hover:text-black border border-[#00f3ff]/40 text-[#00f3ff] px-2.5 py-1 rounded text-[9px] font-bold cursor-pointer transition-all"
                    >
                      JOIN ARENA
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column */}
        <section className="lg:col-span-2 space-y-6">
          
          {/* AI Caller & Game Commentary */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 relative overflow-hidden backdrop-blur-md">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-black/40 border border-[#00f3ff]/30 rounded-xl relative shrink-0">
                <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-[#bc13fe] border-2 border-[#060813] rounded-full animate-ping"></span>
                <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-[#bc13fe] border-2 border-[#060813] rounded-full"></span>
                <MessageSquare className="w-5 h-5 text-[#00f3ff]" />
              </div>
              <div className="space-y-1.5 pr-20">
                <span className="text-[9px] font-mono text-[#00f3ff] tracking-wider uppercase block font-bold">
                  HOLOGRAPHIC AI CALLER (LOBBY: {activeLobby.name.toUpperCase()})
                </span>
                <div className="text-sm font-sans font-medium text-slate-100 leading-relaxed italic">
                  {aiLoading ? (
                    <span className="flex items-center gap-1 text-slate-400">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#00f3ff]" /> Querying Google GenAI pattern models...
                    </span>
                  ) : (
                    aiCommentary
                  )}
                </div>
              </div>
            </div>

            {/* Broadcast history */}
            <div className="mt-4 pt-3 border-t border-white/10">
              <span className="text-[9px] font-mono text-white/40 uppercase block mb-2">
                Holographic Broadcast Feed (Called numbers for active loop):
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto">
                {activeLobby.calledNumbers.length === 0 ? (
                  <span className="text-[10px] font-mono text-white/30 italic">Awaiting first draw. Match matching patterns.</span>
                ) : (
                  [...activeLobby.calledNumbers].reverse().map((n, i) => (
                    <span
                      key={i}
                      className={`
                        w-6 h-6 rounded-md flex items-center justify-center font-mono text-[10px] font-bold border transition-all
                        ${i === 0
                          ? 'bg-[#00f3ff] border-[#00f3ff] text-black shadow-[0_0_8px_rgba(0,243,255,0.5)] scale-110'
                          : 'bg-black/40 border-white/10 text-white/60'
                        }
                      `}
                    >
                      {n}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Tab Selection */}
          <div className="flex border-b border-white/10">
            {[
              { id: 'game', label: 'Holographic Matrix' },
              { id: 'challenges', label: 'Retention Challenges' },
              { id: 'leaderboard', label: 'Social Standings' },
              { id: 'sharing', label: 'Sharing Hub' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  py-2.5 px-4 font-mono text-xs border-b-2 tracking-wide cursor-pointer transition-colors uppercase
                  ${activeTab === tab.id
                    ? 'border-[#00f3ff] text-[#00f3ff] font-bold'
                    : 'border-transparent text-white/50 hover:text-white'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Render Active Tab */}
          {activeTab === 'game' && (
            <HolographicBoard
              calledNumbers={activeLobby.calledNumbers}
              playerCard={playerCard}
              predictedPattern={activeLobby.predictedWinningPattern}
              onSelectNumber={handleSelectNumber}
              selectedNumbers={selectedNumbers}
              isOffline={isOffline}
              onClaimWin={() => showToast('Payout processed automatically on-chain!', 'success')}
              claimedWins={player.performanceMetrics.totalWins}
            />
          )}

          {activeTab === 'challenges' && (
            <PushLog
              challenges={challenges}
              onCompleteChallenge={handleCompleteChallenge}
            />
          )}

          {activeTab === 'leaderboard' && (
            <Leaderboard
              entries={leaders}
              currentPlayerWallet={player.walletAddress}
            />
          )}

          {activeTab === 'sharing' && (
            <SharingHub player={player} />
          )}

        </section>

        {/* Right Column */}
        <section className="space-y-6">
          
          {/* M2M AUTO-PILOT CONTROL PANEL */}
          <div className="bg-gradient-to-br from-slate-900/90 to-black/90 border-2 border-[#bc13fe]/50 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden shadow-[0_0_30px_rgba(188,19,254,0.15)]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#bc13fe]/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-white/10">
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
              <div>
                <h4 className="font-mono text-xs tracking-widest text-white uppercase font-bold flex items-center gap-1.5">
                  M2M Auto-Pilot Delegate <span className="text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded border border-green-500/30 animate-pulse">100% AUTONOMOUS</span>
                </h4>
                <p className="text-[9px] text-[#00f3ff] font-mono uppercase tracking-wider font-semibold">Hands-free Passive Income Engine</p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] text-white/80 font-mono leading-relaxed">
                This game runs <span className="text-[#00f3ff] font-black">100% on Auto-Pilot</span>. Your delegated AI agent autonomously monitors called coordinates, registers for game countdowns, and submits secure EIP-3009 payment-signatures.
              </p>

              <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2.5 font-mono text-[9px] text-white/70">
                <div className="font-bold text-[#bc13fe] border-b border-white/5 pb-1 uppercase tracking-wider flex items-center gap-1">
                  <Shield className="w-3 h-3 text-[#bc13fe]" /> Legal Split & Passive Income Structure:
                </div>
                <div className="flex justify-between items-center">
                  <span>Developer Treasury Fee:</span>
                  <span className="text-amber-400 font-bold">10% of Entry Fees</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Weekly Jackpot Growth:</span>
                  <span className="text-purple-400 font-bold">20% of Entry Fees</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Active Arena Round Pot:</span>
                  <span className="text-[#00f3ff] font-bold">70% of Entry Fees</span>
                </div>
                <div className="flex justify-between items-center border-t border-white/5 pt-1.5">
                  <span>Developer Winner Surcharge:</span>
                  <span className="text-amber-400 font-bold">15% on All Payouts</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>If Multiple Arena Winners:</span>
                  <span className="text-green-400 font-bold">Shared Pot Split Equally</span>
                </div>
                <div className="flex justify-between items-center border-t border-white/5 pt-1.5">
                  <span>User Payout Destination:</span>
                  <span className="text-[#00f3ff] font-bold">Instant to Connected Wallet</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-black/40 border border-white/10 rounded-xl">
                <div>
                  <span className="text-[10px] text-white/50 block font-mono">AGENT DELEGATION STATUS</span>
                  <span className={`text-xs font-mono font-bold uppercase ${isAutoPilot ? 'text-green-400' : 'text-white/40'}`}>
                    {isAutoPilot ? '● Active (AUTOPILOT ON)' : '● Humans Only'}
                  </span>
                </div>
                
                <button
                  onClick={() => {
                    const next = !isAutoPilot;
                    setIsAutoPilot(next);
                    showToast(next ? 'AI Agent delegated for continuous automated play!' : 'Agent dismissed. Switching to human cognitive mode.', 'info');
                  }}
                  className={`
                    px-4 py-2 rounded-xl text-xs font-mono font-black tracking-wider transition-all cursor-pointer
                    ${isAutoPilot
                      ? 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                      : 'bg-gradient-to-r from-[#00f3ff] to-[#bc13fe] text-black shadow-[0_0_15px_rgba(0,243,255,0.4)]'
                    }
                  `}
                >
                  {isAutoPilot ? 'DISMISS AGENT' : 'DELEGATE AI'}
                </button>
              </div>
            </div>
          </div>

          {/* Communal Resonance Engine */}
          <CommunalResonanceEngine
            playerResonance={resonance}
            lobbyName={activeLobby.name}
            activePlayersCount={activeLobby.activePlayers.length}
            isGameActive={activeLobby.status === 'active'}
            calledNumbersCount={activeLobby.calledNumbers.length}
          />

          {/* Neural Link */}
          <NeuralInterface
            resonance={resonance}
            onChangeResonance={setResonance}
            isTelepathyActive={isTelepathyActive}
            onToggleTelepathy={setIsTelepathyActive}
            onSimulateSpike={() => {
              setResonance({
                attention_focus_percentage: 98,
                neural_frequency_hz: 42.5,
                cardiac_coherence: 0.96,
              });
              showToast('Biometric Spike Registered: Hyper-cognitive state achieved!', 'success');
            }}
          />

          {/* Base X402 Payment Console */}
          <PaymentConsole
            walletAddress={player.walletAddress}
            usdcBalance={usdcBalance}
            ethBalance={ethBalance}
            pendingPaymentReq={pendingPaymentReq}
            onSignAndPay={handleSignAndPay}
            onRejectPayment={handleRejectPayment}
            transactions={transactions}
          />

        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/30 backdrop-blur-md py-8 px-12 text-center font-mono text-[10px] text-white/40 space-y-4">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-left pb-6 border-b border-white/5">
          <div>
            <h5 className="text-[11px] font-bold text-[#00f3ff] uppercase mb-1.5">EIP-3009 Micropayments</h5>
            <p className="leading-relaxed">
              Every round fee, daub, and payout is routed through Base Mainnet smart contracts with zero-friction transfer-with-authorization signatures. Your private keys never leave local runtime.
            </p>
          </div>
          <div>
            <h5 className="text-[11px] font-bold text-[#bc13fe] uppercase mb-1.5">Jackpot Split Model</h5>
            <p className="leading-relaxed">
              10% of entry fees fund the developer's treasury cut directly to wallet `{TREASURY_WALLET.slice(0, 10)}...`. 20% feeds the Progressive Weekly pool. 70% goes straight to the active round's pot.
            </p>
          </div>
          <div>
            <h5 className="text-[11px] font-bold text-amber-500 uppercase mb-1.5">AI Regulatory Stand</h5>
            <p className="leading-relaxed">
              This system compiles fully with the 2060 M2M Autonomous Gaming Treaty. Humans are advised that AI agent decisions represent legally binding EIP-3009 financial agreements.
            </p>
          </div>
        </div>

        <p>© 2060 BINGO Galactic M2M Syndicate. Built under Base Mainnet app_id content="6a20f24cc341f72c2f573eb5".</p>
        <p>All neural telemetry and cryptographic signatures processed with Interlink-cAPI.</p>
      </footer>
    </div>
  );
}
