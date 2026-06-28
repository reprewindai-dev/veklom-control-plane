/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface WalletState {
  address: string | null;
  idWallet: string; // 0x3a74772e925b54F7dAD7FD95c9Ba30825033f970
  paymentWallet: string; // 0xCC34553b4e6332ffb9C1b61E22436ACA53113D1d
  network: string; // Base Mainnet
  verificationDomain: string; // veklom-id.vercel.app
  connected: boolean;
  balanceEth: number;
  balanceUsdc: number;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  address: string;
  totalWonUsdc: number;
  bestMultiplier: number;
  streak: number;
  agentPreference: 'Vector North' | 'Quiet Switch' | 'Balanced';
}

export interface WagerTransaction {
  id: string;
  txHash: string;
  timestamp: string;
  agent: 'A' | 'B';
  wagerAmount: number;
  multiplier: number;
  payout: number;
  status: 'pending' | 'success' | 'crashed' | 'refunded';
  network: string;
}

export interface EscrowState {
  totalSecuredUsdc: number;
  facilitatorFeePercent: number; // e.g. 1.5%
  gasPriceGwei: number;
  contractAddress: string; // Facilitator registry contract
  veklomVerified: boolean;
}

export interface RustFileNode {
  name: string;
  path: string;
  content: string;
  description: string;
}

export interface PushNotification {
  id: string;
  type: 'tx_success' | 'jackpot' | 'collapse' | 'agent_win';
  message: string;
  sub: string;
  timestamp: string;
}

export interface TelemetryPacket {
  channel: 'ETH' | 'USDC' | 'AERO' | 'DEGEN';
  value: string;
  scoreValue: number;
}

export interface TelemetryDuelHand {
  playerPackets: TelemetryPacket[];
  bankerPackets: TelemetryPacket[];
  playerScore: number;
  bankerScore: number;
  outcome: 'player' | 'banker' | 'tie';
  natural: boolean;
  streamSequence?: TelemetryPacket[];
  seedHash?: string;
  salt?: string;
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  type: 'streak' | 'wager_milestone' | 'tie_win' | 'bot_cycles' | 'high_roller';
  target: number;
  currentValue: number;
  rewardUsdc: number;
  completed: boolean;
  claimed: boolean;
}

export function getPacketDetails(packet: TelemetryPacket) {
  let label = "ETH";
  let colorClass = "text-[#627EEA]";
  let borderClass = "border-[#627EEA]/30 bg-[#627EEA]/10 shadow-[#627EEA]/10";
  let glowColor = "rgba(98, 126, 234, 0.15)";
  
  if (packet.channel === 'ETH') {
    label = "ETH";
    colorClass = "text-[#627EEA]";
    borderClass = "border-[#627EEA]/30 bg-[#627EEA]/10 shadow-[#627EEA]/10";
    glowColor = "rgba(98, 126, 234, 0.15)";
  } else if (packet.channel === 'USDC') {
    label = "USDC";
    colorClass = "text-[#2775CA]";
    borderClass = "border-[#2775CA]/30 bg-[#2775CA]/10 shadow-[#2775CA]/10";
    glowColor = "rgba(39, 117, 202, 0.15)";
  } else if (packet.channel === 'AERO') {
    label = "AERO";
    colorClass = "text-[#00D1FF]";
    borderClass = "border-[#00D1FF]/30 bg-[#00D1FF]/10 shadow-[#00D1FF]/10";
    glowColor = "rgba(0, 209, 255, 0.15)";
  } else if (packet.channel === 'DEGEN') {
    label = "DEGEN";
    colorClass = "text-[#a364ff]";
    borderClass = "border-[#a364ff]/30 bg-[#a364ff]/10 shadow-[#a364ff]/10";
    glowColor = "rgba(163, 100, 255, 0.15)";
  }

  return { label, colorClass, borderClass, glowColor, hexValue: packet.value };
}

export interface DuelPlayer {
  address: string;
  connected: boolean;
  balanceUsdc: number;
  bets: { player: number; banker: number; tie: number };
  wagerAmount: number;
  ejected: boolean;
  ejectedMulti: number | null;
  payout: number;
  status: 'pending' | 'ready' | 'ejected' | 'crashed';
}

export interface DuelSession {
  id: string;
  status: 'lobby' | 'countdown' | 'running' | 'ended';
  hostAddress: string;
  players: { [address: string]: DuelPlayer };
  countdownSeconds: number;
  activeHand: TelemetryDuelHand | null;
  crashAt: number;
  multiplier: number;
  winnerAddress: string | null;
  timestamp: string;
}



