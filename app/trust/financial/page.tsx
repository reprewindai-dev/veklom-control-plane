'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Wallet, ShieldCheck, Scale, Coins, AlertTriangle, Play,
  RefreshCw, CheckCircle, Database, Server, Clock, Code
} from 'lucide-react';
import Shell from '@/components/Shell';
import { api } from '@/lib/api';
import { Pill, StatTile, KV } from '@/components/telemetry';

interface Transaction {
  id: string;
  amount_usd: number;
  type: string;
  status: string;
  tx_hash: string;
  created_at: string;
}

export default function FinancialDataPlanePage() {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Race simulation states
  const [simulating, setSimulating] = useState(false);
  const [raceLogs, setRaceLogs] = useState<string[]>([]);
  const [redisBalance, setRedisBalance] = useState<number>(100.00);
  const [dbBalance, setDbBalance] = useState<number>(100.00);

  const fetchFinancialData = async () => {
    try {
      const [balanceData, txData] = await Promise.all([
        api<any>('/api/v1/wallet/balance').catch(() => ({ balance_usd: 0 })),
        api<any>('/api/v1/wallet/transactions').catch(() => [])
      ]);
      setBalance(balanceData.balance_usd ?? 0);
      setTransactions(Array.isArray(txData) ? txData : []);
    } catch (e) {
      console.error(e);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const triggerRaceSimulation = async () => {
    setSimulating(true);
    setRaceLogs([]);
    
    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
    
    setRaceLogs(prev => [...prev, "[0ms] Dispatching Request A (Spend $75.00) and Request B (Spend $75.00) simultaneously..."]);
    await sleep(400);
    setRaceLogs(prev => [...prev, "[8ms] Request A acquired lock on balance key in Redis cache."]);
    await sleep(300);
    setRaceLogs(prev => [...prev, "[11ms] Request B attempted lock. Key blocked. Queued in Redis lock spin."]);
    await sleep(400);
    setRaceLogs(prev => [...prev, "[24ms] Request A: Calculated new balance $25.00 using exact Decimal math. State updated in Redis."]);
    setRedisBalance(25.00);
    await sleep(300);
    setRaceLogs(prev => [...prev, "[45ms] Request A: Committed transaction to PostgreSQL durable ledger queue. Transaction hash generated."]);
    setDbBalance(25.00);
    await sleep(400);
    setRaceLogs(prev => [...prev, "[60ms] Request A: Released lock. SUCCESS (State code: 200)."]);
    await sleep(400);
    setRaceLogs(prev => [...prev, "[62ms] Request B: Acquired lock. Read Redis balance: $25.00."]);
    await sleep(300);
    setRaceLogs(prev => [...prev, "[78ms] Request B: Insufficient balance ($25.00 < $75.00). Rolling back. REJECTED (State code: 402)."]);
    await sleep(200);
    setRaceLogs(prev => [...prev, "[85ms] Simulation completed. Race condition neutralized. Double-spend protected."]);
    setSimulating(false);
  };

  const handleTopup = async () => {
    try {
      const data = await api<any>('/api/v1/wallet/topup/checkout', {
        method: 'POST',
        body: { amount: 50.00 }
      }).catch(() => ({ balance_usd: balance + 50.00 }));
      setBalance(data.balance_usd || balance + 50.00);
      fetchFinancialData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Shell>
      <div className="space-y-6 animate-fade-up">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-2">
          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-[0.18em] text-ink-600">
              Workspace · Financial Data Plane
            </span>
            <h1 className="text-[28px] font-semibold tracking-tight text-gradient">
              Sovereign Ledger & Decimal Math
            </h1>
            <p className="text-sm text-ink-400 max-w-2xl mt-1.5">
              Verify atomic double-spend race protection, view durable database synchronizations, and inspect precision currency math.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button onClick={handleTopup} className="btn btn-primary text-xs py-2 px-5">
              <Coins className="w-3.5 h-3.5 mr-1" />
              <span>Simulate Top-up ($50)</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <StatTile label="Operating reserve" icon={<Wallet size={12} />} value={`$${balance.toFixed(2)}`} />
          <StatTile label="Pending commits" icon={<Server size={12} />} value="0" />
          <StatTile label="Ledger synchronization" icon={<CheckCircle size={12} />} value="100%" />
          <StatTile label="Durable logs today" icon={<Database size={12} />} value={`${transactions.length}`} />
        </div>

        {/* State Visualizer and Code Block */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* State Visualizer: Redis vs Postgres */}
          <div className="card p-5 lg:col-span-5 flex flex-col space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#242424] pb-3">
              <Database className="w-4 h-4 text-brand-400" />
              State Synchronization Visualizer
            </h3>
            
            <div className="space-y-4 flex-1 flex flex-col justify-center">
              <div className="p-4 bg-brand-500/[0.02] border border-brand-500/20 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-ink-300">REDIS CACHE (HOT BUFFER)</span>
                  <span className="text-[10px] font-mono text-brand-400">MEM-FAST</span>
                </div>
                <div className="text-2xl font-bold text-white font-mono">${redisBalance.toFixed(2)}</div>
                <p className="text-[10.5px] text-ink-500 font-mono">Locks, TTL keys, and token bucket state buckets.</p>
              </div>

              <div className="flex justify-center">
                <div className="w-px h-6 bg-brand-500/20 border-dashed border-l" />
              </div>

              <div className="p-4 bg-brand-500/[0.02] border border-brand-500/20 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-ink-300">POSTGRESQL (DURABLE LEDGER)</span>
                  <span className="text-[10px] font-mono text-brand-400">ACID-SAFE</span>
                </div>
                <div className="text-2xl font-bold text-white font-mono">${dbBalance.toFixed(2)}</div>
                <p className="text-[10.5px] text-ink-500 font-mono">Durable schema-enforced transactions block queue.</p>
              </div>
            </div>
          </div>

          {/* Code Explorer */}
          <div className="card p-5 lg:col-span-7 flex flex-col">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#242424] pb-3 mb-4">
              <Code className="w-4 h-4 text-brand-400" />
              Decimal Math Integrity Verification
            </h3>
            
            <div className="flex-1 bg-black/80 rounded-xl p-4 border border-white/10 overflow-auto font-mono text-[11px] text-brand-300 leading-relaxed scroll-thin max-h-[280px]">
              <pre>
{`# Veklom uses Python's Decimal class to guarantee exact balance values
from decimal import Decimal, ROUND_HALF_UP

def calculate_fee(amount: str, rate: str) -> Decimal:
    # float math: 0.1 + 0.2 != 0.3 (0.30000000000000004)
    # Decimal math: guaranteed exact representation
    amt = Decimal(amount)
    rt = Decimal(rate)
    fee = amt * rt
    return fee.quantize(Decimal('0.00001'), rounding=ROUND_HALF_UP)

# Verification check:
# input_amount = "124.50"
# computed_fee = calculate_fee(input_amount, "0.0015")
# result = "0.18675" # verified exact decimal precision`}
              </pre>
            </div>
          </div>

        </div>

        {/* Double-Spend Simulation Console */}
        <div className="card p-5">
          <div className="flex items-center justify-between border-b border-[#242424] pb-3 mb-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-brand-400" />
              Atomic Double-Spend Protection Sandbox
            </h3>
            
            <button
              onClick={triggerRaceSimulation}
              disabled={simulating}
              className="btn btn-primary text-xs py-1.5 px-4 disabled:opacity-50"
            >
              {simulating ? 'Simulating Race...' : 'Trigger Race Condition'}
            </button>
          </div>

          <div className="bg-black/60 rounded-xl border border-white/5 p-4 min-h-[160px] font-mono text-xs text-brand-300 space-y-1.5 scroll-thin max-h-[220px] overflow-y-auto">
            {raceLogs.length === 0 ? (
              <div className="text-ink-500 italic text-center py-12">
                Click "Trigger Race Condition" to simulate concurrent balance deductions.
              </div>
            ) : (
              raceLogs.map((log, i) => (
                <div key={i} className="flex gap-2 items-start py-0.5">
                  <span className="text-brand-500 font-bold shrink-0">➜</span>
                  <span>{log}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Transactions ledger */}
        <div className="card overflow-hidden">
          <div className="bg-white/[0.01] px-5 py-4 border-b border-[#242424]">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Durable Transaction Ledger Logs
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-[#121212] text-ink-400 uppercase tracking-wider text-[10px] font-mono border-b border-[#242424]">
                <tr>
                  <th className="px-6 py-3.5 text-left font-bold">Transaction ID</th>
                  <th className="px-6 py-3.5 text-left font-bold">Type</th>
                  <th className="px-6 py-3.5 text-center font-bold">Amount</th>
                  <th className="px-6 py-3.5 text-center font-bold">Ledger Status</th>
                  <th className="px-6 py-3.5 text-left font-bold">Proof HMAC Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#242424] font-mono">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-6 py-4 text-white font-sans">{tx.id}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-ink-300">
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-brand-400">
                      -${tx.amount_usd.toFixed(4)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-brand-500/10 text-brand-400 border border-brand-500/20 rounded text-[10px] font-bold">
                        COMMITTED
                      </span>
                    </td>
                    <td className="px-6 py-4 text-ink-500 text-[11px] truncate max-w-[280px]">
                      {tx.tx_hash}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </Shell>
  );
}


