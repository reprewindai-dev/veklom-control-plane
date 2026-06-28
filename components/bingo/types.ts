/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Player {
  username: string;
  walletAddress: string;
  mfaEnabled: boolean;
  mfaSecret: string;
  performanceMetrics: {
    totalWins: number;
    avgCardiacCoherence: number;
    peakNeuralFrequency: number;
    attentionScore: number;
  };
}

export interface BiometricResonance {
  attention_focus_percentage: number;
  neural_frequency_hz: number;
  cardiac_coherence: number;
}

export interface TelepathicSelection {
  id: string;
  gameId: string;
  number: number;
  biometricResonance: BiometricResonance;
  localOfflineId?: string;
  x402TransactionHash?: string;
  synchronizedAt?: string;
  status: 'pending_sync' | 'synced' | 'unpaid';
}

export interface GameState {
  id: string;
  status: 'lobby' | 'active' | 'completed';
  predictedWinningPattern: string; // e.g. "X-Pattern", "Outer Ring", "Four Corners", "Full House"
  calledNumbers: number[];
  startedAt?: string;
  endedAt?: string;
}

export interface LeaderboardEntry {
  username: string;
  walletAddress: string;
  wins: number;
  avgCardiacCoherence: number;
  peakNeuralFrequency: number;
}

export interface PaymentRequirement {
  x402Version: number;
  error: string;
  resource: {
    url: string;
    description: string;
    mimeType: string;
  };
  accepts: Array<{
    scheme: string;
    network: string;
    price: string;
    asset: string;
    payTo: string;
    extra: {
      app_id: string;
    };
  }>;
}

export interface Challenge {
  id: string;
  title: string;
  requirement: string;
  targetMetric: 'cardiac_coherence' | 'attention_focus_percentage' | 'neural_frequency_hz';
  targetValue: number;
  durationSeconds: number;
  rewardUSDC: number;
  completed: boolean;
}

export interface LobbyPlayer {
  username: string;
  walletAddress: string;
  isBot: boolean;
  card: number[][];
  selectedNumbers: number[];
  coherence: number;
  focus: number;
  frequency: number;
}

export interface LobbyState {
  id: string;
  name: string;
  entryFee: number;
  status: 'countdown' | 'active' | 'completed';
  countdownSeconds: number;
  calledNumbers: number[];
  activePlayers: LobbyPlayer[];
  currentPrizePot: number;
  winners: string[];
  predictedWinningPattern: string;
}

export interface GlobalJackpotState {
  progressiveJackpotPool: number;
  treasuryCollected: number;
  lastJackpotWinner: string | null;
}

