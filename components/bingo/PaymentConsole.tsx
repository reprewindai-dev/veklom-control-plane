/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Wallet, ShieldAlert, FileSignature, ArrowUpRight, CheckCircle, HelpCircle } from 'lucide-react';
import { PaymentRequirement } from './types';

interface PaymentConsoleProps {
  walletAddress: string;
  usdcBalance: number;
  ethBalance: number;
  pendingPaymentReq: PaymentRequirement | null;
  onSignAndPay: () => void;
  onRejectPayment: () => void;
  transactions: Array<{
    hash: string;
    action: string;
    amount: string;
    timestamp: string;
    status: 'success' | 'failed';
  }>;
}

export default function PaymentConsole({
  walletAddress,
  usdcBalance,
  ethBalance,
  pendingPaymentReq,
  onSignAndPay,
  onRejectPayment,
  transactions,
}: PaymentConsoleProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div id="payment-console-container" className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden">
      {/* Glow */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-[#00f3ff]/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex justify-between items-center pb-4 mb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-[#00f3ff]" />
            <h3 className="font-mono text-sm tracking-widest text-[#00f3ff] uppercase">
              Base Mainnet X402 Ledger
            </h3>
          </div>
          <p className="text-xs text-white/50 mt-0.5 font-sans">
            Secured on-chain settlement for M2M interactions
          </p>
        </div>

        <div className="text-right">
          <div className="text-[10px] font-mono text-[#bc13fe] uppercase">Base Mainnet Wallet</div>
          <div className="text-xs font-mono font-bold text-[#bc13fe] tracking-wide">
            {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          </div>
        </div>
      </div>

      {/* Account Balances Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-3">
          <span className="text-[9px] font-mono text-white/40 uppercase block">USDC Balance (8453)</span>
          <span className="text-lg font-bold font-mono text-[#00f3ff]">
            {usdcBalance.toFixed(2)} <span className="text-xs text-white/40 font-sans">USDC</span>
          </span>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-3">
          <span className="text-[9px] font-mono text-white/40 uppercase block">ETH Fuel (Gas)</span>
          <span className="text-lg font-bold font-mono text-[#bc13fe]">
            {ethBalance.toFixed(4)} <span className="text-xs text-white/40 font-sans">ETH</span>
          </span>
        </div>
      </div>

      {/* x402 Intercept Prompt */}
      {pendingPaymentReq ? (
        <div className="mb-6 p-5 bg-black/40 border border-[#00f3ff]/40 rounded-xl space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-black/50 rounded-lg text-[#00f3ff] border border-[#00f3ff]/30">
              <ShieldAlert className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h4 className="text-xs font-black text-[#00f3ff] tracking-widest uppercase font-mono">
                HTTP 402 - PAYMENT REQUIRED
              </h4>
              <p className="text-[10px] text-white/70 font-mono leading-relaxed mt-1">
                The Interlink-cAPI Gateway intercepted a telepathic selection requiring on-chain signature.
              </p>
            </div>
          </div>

          <div className="border-y border-white/10 py-3 space-y-2 font-mono text-[10px]">
            <div className="flex justify-between">
              <span className="text-white/40">Target Action:</span>
              <span className="text-[#00f3ff] font-bold max-w-[180px] truncate">{pendingPaymentReq.resource.description}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Payment Scheme:</span>
              <span className="text-[#bc13fe] font-bold">{pendingPaymentReq.accepts[0].scheme.toUpperCase()} EIP-3009</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Service Fee:</span>
              <span className="text-[#00f3ff] font-bold">{pendingPaymentReq.accepts[0].price} USDC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Base Mainnet Gas:</span>
              <span className="text-[#bc13fe]">~0.00012 ETH (Sponsored)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Pay To Wallet:</span>
              <span className="text-[#bc13fe] text-[9px]">{pendingPaymentReq.accepts[0].payTo.slice(0, 10)}...{pendingPaymentReq.accepts[0].payTo.slice(-10)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-[9px] text-white/50 font-mono hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle className="w-3 h-3 text-[#00f3ff]" /> {showDetails ? 'Hide' : 'Show'} Cryptographic Separator details
            </button>
            
            {showDetails && (
              <pre className="text-[8px] bg-black/60 p-3 rounded-lg text-[#00f3ff]/75 font-mono whitespace-pre-wrap leading-normal border border-white/10">
                {`{
  domain: {
    name: "USD Coin",
    version: "2",
    chainId: 8453,
    verifyingContract: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
  },
  types: {
    TransferWithAuthorization: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "validBefore", type: "uint256" },
      { name: "nonce", type: "bytes32" }
    ]
  },
  message: {
    from: "${walletAddress}",
    to: "${pendingPaymentReq.accepts[0].payTo}",
    value: "100000", // 0.10 USDC (6 decimals)
    validBefore: ${Math.floor(Date.now() / 1000) + 3600},
    nonce: "0x${Array.from({length:64},()=>'0123456789abcdef'[Math.floor(Math.random()*16)]).join('')}"
  }
}`}
              </pre>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onRejectPayment}
              className="w-1/3 border border-white/10 hover:bg-white/5 font-mono text-[10px] text-white/60 rounded-xl py-2.5 transition-colors cursor-pointer"
            >
              REJECT
            </button>
            <button
              onClick={onSignAndPay}
              className="w-2/3 bg-gradient-to-r from-[#00f3ff] to-[#bc13fe] text-black font-black text-[10px] font-mono tracking-widest py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(0,243,255,0.4)] cursor-pointer hover:brightness-110 active:scale-[0.98] transition-all"
            >
              <FileSignature className="w-4 h-4 text-black" /> SIGN & AUTHORIZE RAIL
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-black/40 border border-white/10 rounded-xl text-center">
          <p className="text-[10px] text-white/40 font-mono leading-relaxed">
            [X402 ACTIVE STATUS]: Monitoring HTTP interceptors. Telepathic selections require EIP-3009 secure signatures.
          </p>
        </div>
      )}

      {/* Transaction History Ledger */}
      <div>
        <h4 className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-3">
          On-Chain Action Registry (Base Mainnet)
        </h4>

        {transactions.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-white/10 rounded-xl">
            <p className="text-[10px] font-mono text-white/30">No actions synced on-chain yet</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {transactions.map((tx, idx) => (
              <div
                key={idx}
                className="bg-black/40 border border-white/10 rounded-lg p-2.5 flex items-center justify-between text-xs font-mono"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-white font-sans text-[11px] font-semibold">{tx.action}</span>
                  </div>
                  <div className="text-[9px] text-white/40">
                    TX: <span className="text-[#00f3ff]/80 hover:underline cursor-pointer select-all">{tx.hash.slice(0, 10)}...{tx.hash.slice(-10)}</span>
                  </div>
                </div>

                <div className="text-right space-y-0.5">
                  <span className="text-[#00f3ff] font-bold">-{tx.amount} USDC</span>
                  <div className="text-[8px] text-white/40">{new Date(tx.timestamp).toLocaleTimeString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
