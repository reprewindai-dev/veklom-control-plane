/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { EscrowState } from '../types';
import { Shield, Coins, ExternalLink, Flame, Info, CheckCircle2 } from 'lucide-react';

interface FacilitatorBlockProps {
  escrow: EscrowState;
  onDepositCollateral: (amount: number) => void;
}

export function FacilitatorBlock({ escrow, onDepositCollateral }: FacilitatorBlockProps) {
  const [depositAmount, setDepositAmount] = useState('250');
  const [depositSuccess, setDepositSuccess] = useState(false);

  const handleApplyStake = () => {
    const val = parseFloat(depositAmount);
    if (isNaN(val) || val <= 0) return;
    onDepositCollateral(val);
    setDepositSuccess(true);
    setTimeout(() => setDepositSuccess(false), 2500);
  };

  return (
    <div id="facilitator-security-card" className="bg-[#0d0f16] border border-white/10 rounded-lg p-5 relative shadow-lg shadow-blue-900/5">
      <div className="absolute top-0 left-0 w-1/3 h-1 bg-gradient-to-r from-blue-600 to-indigo-800" />

      <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-500" />
          <h2 className="text-sm font-bold font-mono tracking-wider text-white uppercase">
            // x402 Escrow Facilitator Registry
          </h2>
        </div>
        <span className="text-[10px] font-mono text-amber-400 uppercase flex items-center gap-1">
          <Flame className="w-3 h-3 animate-pulse text-amber-400" /> Live Protocol
        </span>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#0a0c12]/60 p-3 rounded border border-white/5 text-center">
            <span className="text-[10px] font-mono text-slate-500 uppercase block">Total Volume Secured</span>
            <span className="text-2xl font-bold font-mono text-emerald-400 block mt-1 tracking-tight">
              ${escrow.totalSecuredUsdc.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[9px] font-mono text-slate-500 block mt-0.5">Base Mainnet Pool</span>
          </div>

          <div className="bg-[#0a0c12]/60 p-3 rounded border border-white/5 text-center">
            <span className="text-[10px] font-mono text-slate-500 uppercase block">Settlement Commission</span>
            <span className="text-2xl font-bold font-mono text-amber-500 block mt-1">
              {escrow.facilitatorFeePercent.toFixed(2)}%
            </span>
            <span className="text-[9px] font-mono text-slate-500 block mt-0.5">150 Basis Points</span>
          </div>
        </div>

        {/* Technical Registry Table */}
        <div className="bg-[#050608] p-3 rounded border border-white/5 text-xs font-mono space-y-2">
          <div className="flex justify-between items-center text-[10px] text-slate-400 pb-1.5 border-b border-white/5">
            <span className="font-bold">// Contract Registry Credentials</span>
            <span className="text-blue-400 flex items-center gap-0.5 select-all hover:text-blue-300">
              0xCC34...3D1d <ExternalLink className="w-2.5 h-2.5" />
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 uppercase">Cross-Platform Standard:</span>
            <span className="text-slate-300">ERC-404 / x402 Minting Hub</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 uppercase">Collateral Ledger:</span>
            <span className="text-emerald-400 uppercase font-semibold">Safe-MultiSig Compliant</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 uppercase">Audit Verification status:</span>
            <span className="text-amber-500 uppercase font-bold">Passed (veklom-id.vercel.app)</span>
          </div>
        </div>

        {/* Stake deposit simulation */}
        <div id="facilitator-collateral-action" className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-[11px] font-mono text-slate-400 uppercase tracking-widest block font-medium">
              Inject Liquidity to Pool (USDC)
            </label>
            <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
              <Info className="w-3 h-3" /> Faucet mock stake
            </span>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-mono font-bold">$</span>
              <input
                id="escrow-inject-input"
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-[#050608] border border-white/10 rounded pl-8 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              id="btn-escrow-deposit"
              onClick={handleApplyStake}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded transition-colors duration-150 flex items-center gap-1 font-sans"
            >
              <Coins className="w-3.5 h-3.5" /> Commit Collateral
            </button>
          </div>

          {depositSuccess && (
            <p className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 mt-1 animate-pulse">
              <CheckCircle2 className="w-3.5 h-3.5" /> Stake successfully authorized! Facilitator pool limits expanded.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
