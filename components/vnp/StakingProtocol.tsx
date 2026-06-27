"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Wallet,
  Server,
  Users,
  CheckCircle,
  AlertTriangle,
  Zap,
  DollarSign,
  Globe,
  ChevronDown,
  ChevronUp,
  Clock,
  Lock,
  Activity,
  Download,
} from "lucide-react";
import useSWR from "swr";
import { api, fetcher } from "@/lib/api";
import { ethers } from "ethers";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
  BarChart as RBarChart,
  Bar,
  Cell,
} from "recharts";

import type { BenchmarkApiEntry } from "@/lib/vnp/types";
import type {
  ProviderBondView,
  EpochSettlement,
  VerifierNode,
  BondStatusLevel,
} from "@/lib/vnp/staking-types";

// ============ Helpers ============

const fmtUSD = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
const fmtMs = (n: number) => `${n.toFixed(1)}ms`;

const STATUS_COLORS: Record<BondStatusLevel, { bg: string; border: string; text: string; label: string }> = {
  healthy: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", label: "Healthy" },
  warning: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", label: "Warning" },
  breaching: { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400", label: "Breaching" },
  critical: { bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-400", label: "Critical" },
};

// ============ Staking Market Types ============

interface StakingMarket {
  id: string;
  title: string;
  category: string;
  yesPrice: number;
  noPrice: number;
  volume: number;
  poolYes: number;
  poolNo: number;
  resolutionDate: string;
  targetApi: string;
  resolved: boolean;
  outcome?: string | null;
}

// ============ Main Component ============

interface StakingProtocolProps {
  apis?: BenchmarkApiEntry[];
}

export default function StakingProtocol({ apis = [] }: StakingProtocolProps) {
  // ---- Markets ----
  const { data: marketData, mutate: mutateMarkets } = useSWR<StakingMarket[]>(
    "/api/v1/x402/staking/markets",
    fetcher,
    { refreshInterval: 10000 },
  );
  const markets = Array.isArray(marketData) ? marketData : [];

  // ---- Backend State ----
  const { data: stateData } = useSWR<any>(
    "/api/v1/x402/staking/state",
    fetcher,
    { refreshInterval: 10000 },
  );

  const providers: ProviderBondView[] = stateData?.providers || [];
  const protocolStats = stateData?.protocolStats || {
    totalValueBonded: 0, activeApis: 0, activeVerifiers: 0, totalPenalties: 0, settlementRate: 100, epochsProcessed: 0
  };
  const settlements: EpochSettlement[] = stateData?.settlements || [];
  const verifiers: VerifierNode[] = stateData?.verifiers || [];
  const kdeCurves = stateData?.kdeCurves || {};
  const VNP_PARAMS = stateData?.vnpParams || { k: 3, lambda: 2.0 };

  // ---- KDE for selected API ----
  const [selectedKdeApiId, setSelectedKdeApiId] = useState<string>("");

  useEffect(() => {
    if (apis.length > 0 && !selectedKdeApiId) {
      setSelectedKdeApiId(apis[0].id);
    }
  }, [apis, selectedKdeApiId]);

  const kdeData = kdeCurves[selectedKdeApiId] || null;

  // ---- Staking State ----
  const [selectedMarketId, setSelectedMarketId] = useState<string>("");
  const [stakeAmount, setStakeAmount] = useState<string>("10");
  const [stakeOutcome, setStakeOutcome] = useState<"YES" | "NO">("YES");
  const [stakePending, setStakePending] = useState(false);
  const [stakeResult, setStakeResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [expandedBond, setExpandedBond] = useState<string | null>(null);

  useEffect(() => {
    if (markets.length > 0 && !selectedMarketId) {
      setSelectedMarketId(markets[0].id);
    }
  }, [markets, selectedMarketId]);

  // ---- Wallet Registration ----
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  const connectWallet = async () => {
    if (typeof (window as any).ethereum === "undefined") {
      alert("Please install MetaMask to connect your wallet.");
      return;
    }
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setWalletAddress(address);
    } catch (err) {
      console.error("Failed to connect wallet", err);
    }
  };

  const registerAsVerifier = async () => {
    if (!walletAddress) return;
    setIsRegistering(true);
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      
      const message = `Register Veklom Verifier Node\nAddress: ${walletAddress}\nNonce: ${Date.now()}`;
      const signature = await signer.signMessage(message);
      
      const res = await api<{ success: boolean; message?: string }>("/api/v1/x402/staking/register-verifier", {
        body: {
          message,
          signature,
          asn: "AS12345", // Mock ASN for v1
          region: "us-east-1"
        }
      });
      
      if (res.success) {
        alert("Successfully registered as a Verifier Node!");
      } else {
        alert("Registration failed: " + res.message);
      }
    } catch (err) {
      console.error("Failed to register", err);
      alert("Error during registration.");
    } finally {
      setIsRegistering(false);
    }
  };

  const handleStake = useCallback(async () => {
    if (!selectedMarketId || stakePending) return;
    const amount = parseFloat(stakeAmount);
    if (!amount || amount <= 0) {
      setStakeResult({ ok: false, msg: "Enter a valid amount" });
      return;
    }
    setStakePending(true);
    setStakeResult(null);
    try {
      const res = await api<{ success: boolean; new_balance: number; volume: number; yesPrice: number; noPrice: number }>(
        "/api/v1/x402/staking/stake",
        { body: { market_id: selectedMarketId, outcome: stakeOutcome, amount } },
      );
      setStakeResult({ ok: true, msg: `Staked $${amount.toFixed(2)} on ${stakeOutcome}. New balance: $${res.new_balance.toFixed(2)}` });
      mutateMarkets();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Stake failed";
      setStakeResult({ ok: false, msg });
    } finally {
      setStakePending(false);
    }
  }, [selectedMarketId, stakeAmount, stakeOutcome, stakePending, mutateMarkets]);

  const stakeNum = parseFloat(stakeAmount) || 0;
  const netStake = Math.round(stakeNum * (1 - 0.025));

  return (
    <div className="space-y-8">
      {/* Protocol Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Value Bonded", value: fmtUSD(protocolStats.totalValueBonded), icon: Wallet, color: "text-[#FFB800]" },
          { label: "Active APIs", value: String(protocolStats.activeApis), icon: Server, color: "text-cyan-400" },
          { label: "Active Verifiers", value: String(protocolStats.activeVerifiers), icon: Users, color: "text-violet-400" },
          { label: "Settlement Rate", value: `${protocolStats.settlementRate}%`, icon: CheckCircle, color: "text-emerald-400" },
          { label: "Total Penalties", value: fmtUSD(protocolStats.totalPenalties), icon: AlertTriangle, color: "text-rose-400" },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#A1A1A6]">{stat.label}</span>
            </div>
            <div className={`text-2xl font-medium ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Continuous Slashing Function */}
      <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <Zap className="w-4 h-4 text-[#FFB800]" />
          <span className="text-xs font-mono uppercase tracking-widest text-[#A1A1A6]">Continuous Slashing Function</span>
        </div>
        <div className="font-mono text-sm text-white/90 bg-[#111111] border border-[#1A1A1A] rounded-lg px-4 py-3">
          <span className="text-[#FFB800]">Penalty(t)</span> ={" "}
          <span className="text-[#A1A1A6]">{"{"}</span>{" "}
          <span className="text-emerald-400">0</span>{" "}
          <span className="text-[#A1A1A6]">if</span>{" "}
          |S<sub>o</sub>(t) - S<sub>p</sub>| {"<="} k{"*"}&sigma;(t) ;{" "}
          <span className="text-rose-400">&lambda;</span> {"*"} (|S<sub>o</sub>(t) - S<sub>p</sub>| - k{"*"}&sigma;(t)){" "}
          <span className="text-[#A1A1A6]">otherwise {"}"}</span>
          <span className="text-[#A1A1A6] ml-4">{"// k="}{VNP_PARAMS.k}{", λ="}{VNP_PARAMS.lambda}</span>
        </div>
      </div>

      {/* Provider Bond Registry */}
      <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl overflow-hidden">
        <div className="p-5 flex items-center gap-3 border-b border-[#1A1A1A]">
          <Lock className="w-4 h-4 text-[#FFB800]" />
          <span className="text-sm font-semibold">Provider Bond Registry</span>
          <span className="ml-auto text-[10px] font-mono text-[#A1A1A6] tracking-widest uppercase">USDC Performance Bonds</span>
        </div>
        <div className="grid grid-cols-7 gap-2 px-5 py-3 border-b border-[#1A1A1A] bg-[#111111] text-[10px] font-mono uppercase tracking-widest text-[#A1A1A6]">
          <div className="col-span-2">API / Provider</div>
          <div>Target p95</div>
          <div>Observed p95</div>
          <div>Deviation</div>
          <div>Status</div>
          <div className="text-right">Bond&nbsp;&nbsp;Penalty/Ep</div>
        </div>
        {providers.map((p) => {
          const sc = STATUS_COLORS[p.status];
          const isExpanded = expandedBond === p.apiId;
          return (
            <div key={p.apiId}>
              <div
                className="grid grid-cols-7 gap-2 px-5 py-3 items-center hover:bg-[#111111] transition-colors cursor-pointer"
                onClick={() => setExpandedBond(isExpanded ? null : p.apiId)}
              >
                <div className="col-span-2">
                  <div className="text-sm text-white">{p.name}</div>
                  <div className="text-[10px] font-mono text-[#A1A1A6]">{p.provider}</div>
                </div>
                <div className="font-mono text-sm text-[#A1A1A6]">{fmtMs(p.targetP95Ms)}</div>
                <div className="font-mono text-sm text-white">{fmtMs(p.observedP95Ms)}</div>
                <div className="font-mono text-sm text-[#A1A1A6]">{p.deviation.deviationMs.toFixed(1)}ms</div>
                <div>
                  <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-mono ${sc.bg} ${sc.border} ${sc.text} border`}>
                    {sc.label}
                  </span>
                </div>
                <div className="text-right font-mono text-xs">
                  <span className="text-[#A1A1A6]">{fmtUSD(p.bondAmountUsdc)}</span>
                  <span className="text-rose-400 ml-2">{p.deviation.penaltyUsdc > 0 ? `-${fmtUSD(p.deviation.penaltyUsdc)}` : "$0"}</span>
                  {isExpanded ? <ChevronUp className="w-3 h-3 inline ml-1" /> : <ChevronDown className="w-3 h-3 inline ml-1" />}
                </div>
              </div>
              {isExpanded && (
                <div className="px-5 py-4 bg-[#111111] border-t border-[#1A1A1A] grid grid-cols-4 gap-4 text-xs">
                  <div>
                    <div className="text-[#A1A1A6] mb-1">Tolerance Band</div>
                    <div className="text-white font-mono">&plusmn;{p.deviation.toleranceMs.toFixed(1)}ms (k={VNP_PARAMS.k})</div>
                  </div>
                  <div>
                    <div className="text-[#A1A1A6] mb-1">Excess Deviation</div>
                    <div className="text-white font-mono">{p.deviation.excessMs.toFixed(1)}ms</div>
                  </div>
                  <div>
                    <div className="text-[#A1A1A6] mb-1">Consensus Score</div>
                    <div className="text-white font-mono">{p.consensus.finalScore.toFixed(1)}ms</div>
                  </div>
                  <div>
                    <div className="text-[#A1A1A6] mb-1">Total Slashed</div>
                    <div className="text-rose-400 font-mono">{fmtUSD(p.slashedTotalUsdc)}</div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {providers.length === 0 && (
          <div className="p-10 text-center text-[#6E6E73] text-sm">Awaiting leaderboard data...</div>
        )}
      </div>

      {/* Settlement Feed + Stake Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Settlement Feed */}
        <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold">Live Settlement Feed</span>
            <span className="ml-auto flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              EPOCH {protocolStats.epochsProcessed}
            </span>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
            {settlements.length > 0 ? settlements.map((s) => (
              <div key={s.apiId} className="flex items-center justify-between py-2 border-b border-[#1A1A1A] last:border-0 text-xs">
                <div>
                  <span className="text-white">{s.apiName}</span>
                  <span className="text-[#A1A1A6] ml-2">{fmtMs(s.observedP95Ms)} / {fmtMs(s.targetP95Ms)}</span>
                </div>
                <div className="font-mono">
                  {s.penaltyUsdc > 0 ? (
                    <span className="text-rose-400">-{fmtUSD(s.penaltyUsdc)}</span>
                  ) : (
                    <span className="text-emerald-400">OK</span>
                  )}
                </div>
              </div>
            )) : (
              <div className="text-[#A1A1A6] text-sm text-center py-4">Awaiting measurement data...</div>
            )}
          </div>
        </div>

        {/* Stake on SLA Performance */}
        <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="w-4 h-4 text-[#FFB800]" />
            <span className="text-sm font-semibold">Stake on SLA Performance</span>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-[#A1A1A6] block mb-2">Select Market</label>
              <select
                value={selectedMarketId}
                onChange={(e) => setSelectedMarketId(e.target.value)}
                className="w-full bg-[#111111] border border-[#1A1A1A] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#FFB800]/40"
              >
                {markets.map((m) => <option key={m.id} value={m.id} className="bg-[#111111]">{m.title}</option>)}
                {markets.length === 0 && <option value="">No markets available</option>}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-[#A1A1A6] block mb-2">Stake Amount (USDC)</label>
              <input
                type="number"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                placeholder="10.00"
                className="w-full bg-[#111111] border border-[#1A1A1A] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#FFB800]/40"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStakeOutcome("YES")}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  stakeOutcome === "YES"
                    ? "bg-emerald-500/20 border border-emerald-500/50 text-emerald-400"
                    : "bg-[#111111] border border-[#1A1A1A] text-[#A1A1A6] hover:text-white"
                }`}
              >
                YES — Meets SLA
              </button>
              <button
                onClick={() => setStakeOutcome("NO")}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  stakeOutcome === "NO"
                    ? "bg-rose-500/20 border border-rose-500/50 text-rose-400"
                    : "bg-[#111111] border border-[#1A1A1A] text-[#A1A1A6] hover:text-white"
                }`}
              >
                NO — Breaches SLA
              </button>
            </div>

            <div className="text-[10px] font-mono text-[#A1A1A6]">
              Platform fee: 2.5% | Net stake after fee: <span className="text-white">${netStake}</span>
            </div>

            <button
              onClick={handleStake}
              disabled={!selectedMarketId || stakePending}
              className="w-full py-2.5 rounded-lg text-sm font-medium bg-[#FFB800]/10 border border-[#FFB800]/30 text-[#FFB800] hover:bg-[#FFB800]/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {stakePending ? "Processing..." : `Stake ${stakeOutcome} — $${stakeNum.toFixed(2)} USDC`}
            </button>

            {stakeResult && (
              <div className={`text-xs font-mono p-2 rounded ${stakeResult.ok ? "text-emerald-400 bg-emerald-500/10" : "text-rose-400 bg-rose-500/10"}`}>
                {stakeResult.msg}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Challenge Market */}
      <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-4 h-4 text-[#FFB800]" />
          <span className="text-sm font-semibold">Challenge Market</span>
          <span className="ml-auto text-[10px] font-mono text-[#A1A1A6] tracking-widest uppercase">Two-Tier Dispute Resolution</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#111111] border border-[#1A1A1A] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-semibold text-emerald-400">Tier A</span>
              <span className="text-[10px] font-mono text-[#A1A1A6]">Lightweight Challenge</span>
            </div>
            <div className="space-y-1.5 text-xs text-[#A1A1A6]">
              <div><span className="text-white font-mono">Stake: ${VNP_PARAMS.challengeTierA.min} - ${VNP_PARAMS.challengeTierA.max} USDC</span></div>
              <div>Evidence: Signed request/response pair + latency + timestamp</div>
              <div>Resolution: Auto-checked against verifier distribution</div>
              <div>Speed: Sub-second (smart contract validation)</div>
            </div>
            <div className="mt-3 text-[10px] text-emerald-400 font-mono">99% of challenges resolve at this tier</div>
          </div>

          <div className="bg-[#111111] border border-[#1A1A1A] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-semibold text-rose-400">Tier B</span>
              <span className="text-[10px] font-mono text-[#A1A1A6]">Escalation</span>
            </div>
            <div className="space-y-1.5 text-xs text-[#A1A1A6]">
              <div><span className="text-white font-mono">Stake: ${VNP_PARAMS.challengeTierB.min} - ${VNP_PARAMS.challengeTierB.max} USDC</span></div>
              <div>Trigger: Deviation {">"} X&sigma; AND contradicts consensus</div>
              <div>Resolution: Commit-reveal + deeper audit</div>
              <div>Speed: 6-48 hours (KDE consensus + governance review)</div>
            </div>
            <div className="mt-3 text-[10px] text-rose-400 font-mono">Reserved for systemic threshold breaches</div>
          </div>
        </div>
      </div>

      {/* x402 Micro-Staking */}
      <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <Globe className="w-4 h-4 text-[#FFB800]" />
          <span className="text-sm font-semibold">x402 Micro-Staking Integration</span>
          <span className="ml-auto text-[10px] font-mono text-[#A1A1A6] tracking-widest uppercase">HTTP 402 Payment Required</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="text-xs font-mono text-[#A1A1A6] mb-2">X-VNP-Stake Header Schema</div>
            <pre className="bg-[#111111] border border-[#1A1A1A] rounded-lg p-4 text-xs font-mono text-white/80 overflow-x-auto">
{`{
  "version": 1,
  "api_id": "0x...",
  "stake_usdc": "0.001",
  "epoch_hint": ${protocolStats.epochsProcessed},
  "agent": "did:veklom:agent-123",
  "nonce": "...",
  "signature": "0x..."
}`}
            </pre>
          </div>
          <div>
            <div className="text-xs font-mono text-[#A1A1A6] mb-2">Settlement Architecture</div>
            <div className="space-y-3">
              {[
                "Agent attaches micro-stake ($0.001 USDC) to x402 payment header",
                "Off-chain aggregator batches outcomes per epoch",
                "If API meets VNP target: agent stake earns fractional yield from provider bond",
                "If API fails: auto-slash triggers micro-refund + penalty from provider bond",
                "Periodic on-chain settlement (net balances) on Base L2 — sub-$0.001 per anchor",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3 text-xs text-[#A1A1A6]">
                  <span className="w-5 h-5 rounded-full bg-[#FFB800]/10 border border-[#FFB800]/20 text-[#FFB800] text-[9px] font-mono flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Verifier Network */}
      <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl overflow-hidden">
        <div className="p-5 flex items-center gap-3 border-b border-[#1A1A1A]">
          <Globe className="w-4 h-4 text-[#FFB800]" />
          <span className="text-sm font-semibold">Verifier Network</span>
          <span className="ml-auto text-[10px] font-mono text-[#A1A1A6]">
            W<sub>i</sub> = Stake<sub>i</sub> * log(Reputation<sub>i</sub> + 1) * Diversity<sub>i</sub>
          </span>
        </div>
        <div className="grid grid-cols-8 gap-2 px-5 py-3 border-b border-[#1A1A1A] bg-[#111111] text-[10px] font-mono uppercase tracking-widest text-[#A1A1A6]">
          <div className="col-span-2">Node / Region</div>
          <div>Stake</div>
          <div>Reputation</div>
          <div>Diversity</div>
          <div>Weight</div>
          <div>Measurements</div>
          <div className="text-right">Accuracy&nbsp;&nbsp;Status</div>
        </div>
        {verifiers.map((v) => (
          <div key={v.address} className="grid grid-cols-8 gap-2 px-5 py-3 items-center border-b border-[#1A1A1A] last:border-0 hover:bg-[#111111] transition-colors">
            <div className="col-span-2">
              <div className="text-sm text-white font-mono">{v.address}</div>
              <div className="text-[10px] text-[#A1A1A6]">{v.region} / {v.asn}</div>
            </div>
            <div className="font-mono text-sm text-[#FFB800]">${v.stake.toLocaleString()}</div>
            <div className="font-mono text-sm text-[#A1A1A6]">{v.reputation}</div>
            <div className="font-mono text-sm text-cyan-400">{v.diversityScore.toFixed(2)}</div>
            <div className="font-mono text-sm text-white">{v.weight.toLocaleString()}</div>
            <div className="font-mono text-sm text-[#A1A1A6]">{v.measurementCount.toLocaleString()}</div>
            <div className="text-right flex items-center justify-end gap-2">
              <span className="font-mono text-sm text-[#A1A1A6]">{v.accuracy.toFixed(1)}%</span>
              <span className="px-2 py-0.5 rounded text-[9px] uppercase font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                Active
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* KDE Consensus Visualization */}
      {kdeData && (
        <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-semibold">KDE Consensus — Measurement Distribution</span>
            <select
              value={selectedKdeApiId}
              onChange={(e) => setSelectedKdeApiId(e.target.value)}
              className="ml-auto bg-[#111111] border border-[#1A1A1A] rounded-lg px-3 py-1 text-xs text-white outline-none"
            >
              {apis.map((a) => <option key={a.id} value={a.id} className="bg-[#111111]">{a.name}</option>)}
            </select>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={kdeData.curve.points.map((x: number, i: number) => ({ x: Math.round(x), d: kdeData.curve.density[i] }))}>
                <defs>
                  <linearGradient id="densityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFB800" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#FFB800" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" />
                <XAxis dataKey="x" tick={{ fill: "#A1A1A6", fontSize: 10 }} label={{ value: "Latency (ms)", position: "insideBottom", offset: -5, fill: "#6E6E73", fontSize: 10 }} />
                <YAxis tick={{ fill: "#A1A1A6", fontSize: 10 }} label={{ value: "Density", angle: -90, position: "insideLeft", fill: "#6E6E73", fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: "#111111", border: "1px solid #1A1A1A", borderRadius: 8, fontSize: 11 }}
                  labelFormatter={(v) => `${v}ms`}
                  formatter={(v) => [(v as number).toFixed(6), "Density"]}
                />
                <ReferenceLine x={Math.round(kdeData.consensus.finalScore)} stroke="#FFB800" strokeDasharray="4 4" label={{ value: "Consensus", fill: "#FFB800", fontSize: 9 }} />
                <Area type="monotone" dataKey="d" stroke="#FFB800" fill="url(#densityGrad)" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4 text-xs">
            <div className="bg-[#111111] rounded-lg p-3">
              <div className="text-[#A1A1A6] mb-1">KDE Mode ({(VNP_PARAMS.consensusWeights.kde * 100)}%)</div>
              <div className="text-white font-mono">{kdeData.consensus.kdeMode.toFixed(1)}ms</div>
            </div>
            <div className="bg-[#111111] rounded-lg p-3">
              <div className="text-[#A1A1A6] mb-1">Historical EWMA ({(VNP_PARAMS.consensusWeights.historical * 100)}%)</div>
              <div className="text-white font-mono">{kdeData.consensus.historicalEwma.toFixed(1)}ms</div>
            </div>
            <div className="bg-[#111111] rounded-lg p-3">
              <div className="text-[#A1A1A6] mb-1">Shadow Probe ({(VNP_PARAMS.consensusWeights.shadow * 100)}%)</div>
              <div className="text-white font-mono">{kdeData.consensus.shadowProbe.toFixed(1)}ms</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
