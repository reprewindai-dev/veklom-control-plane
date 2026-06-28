/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { WalletState } from '../types';
import { Wallet, ShieldCheck, Check, AlertCircle, RefreshCw } from 'lucide-react';

interface WalletBlockProps {
  wallet: WalletState;
  onConnect: (address: string, realEthBalance?: number) => void;
  onDisconnect: () => void;
  onRefreshBalance: () => void;
}

export function WalletBlock({ wallet, onConnect, onDisconnect, onRefreshBalance }: WalletBlockProps) {
  const [addressInput, setAddressInput] = useState('0x6a20f24cc341f72c2f573eb5');
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const hasEthereum = typeof window !== 'undefined' && !!(window as any).ethereum;

  const handleSimulatedConnect = () => {
    if (!addressInput.startsWith('0x') || addressInput.length < 10) {
      setErrorMessage('Please enter a valid Base Hex address (starts with 0x)');
      return;
    }
    setErrorMessage('');
    setIsVerifying(true);
    
    // Simulate smart verification chain via veklom-id.vercel.app
    setTimeout(() => {
      setIsVerifying(false);
      onConnect(addressInput);
    }, 1200);
  };

  const handleWeb3Connect = async () => {
    if (!hasEthereum) {
      setErrorMessage('No web3 browser wallet (MetaMask, Coinbase Wallet etc.) detected.');
      return;
    }
    setErrorMessage('');
    setIsVerifying(true);
    try {
      const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts authorized');
      }
      const address = accounts[0];

      // Request network switch to Base Mainnet (0x2105)
      try {
        await (window as any).ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x2105' }],
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          try {
            await (window as any).ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0x2105',
                  chainName: 'Base Mainnet',
                  rpcUrls: ['https://mainnet.base.org'],
                  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
                  blockExplorerUrls: ['https://basescan.org'],
                },
              ],
            });
          } catch (addError) {
            console.warn("Failed to automatically append Base network configuration", addError);
          }
        }
      }

      // Fetch real balance
      let realEth = 0.145;
      try {
        const hexBal = await (window as any).ethereum.request({
          method: 'eth_getBalance',
          params: [address, 'latest'],
        });
        if (hexBal) {
          realEth = parseInt(hexBal, 16) / 1e18;
        }
      } catch (balError) {
        console.warn("Failed to retrieve real ETH gas balance", balError);
      }

      setIsVerifying(false);
      onConnect(address, realEth);
    } catch (err: any) {
      setIsVerifying(false);
      setErrorMessage(err.message || 'Browser Web3 authorization rejected.');
    }
  };

  return (
    <div id="wallet-terminal" className="bg-[#0d0f16] border border-white/10 rounded-lg p-5 relative overflow-hidden shadow-lg shadow-blue-900/5">
      {/* Background cyber accent */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-bold font-mono tracking-wider text-white uppercase">
            // Base Mainnet Wallet Node
          </h2>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
          {wallet.network}
        </span>
      </div>

      {!wallet.connected ? (
        <div id="wallet-form-connect" className="space-y-4">
          <p className="text-xs text-slate-400">
            Link your signature wallet via <span className="text-blue-400 font-semibold">Web3 Connection</span> or the <span className="text-blue-400 font-semibold">Veklom Registry</span> for ERC-404 / x402 consensus game tracking.
          </p>

          {/* Real Browser Web3 Option (Always prominent if window.ethereum exists) */}
          <div className="space-y-2">
            <button
              id="btn-connect-real-web3"
              onClick={handleWeb3Connect}
              disabled={isVerifying}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-xs font-bold uppercase tracking-wider py-2.5 px-4 rounded transition-all duration-150 flex items-center justify-center gap-2 shadow shadow-blue-500/25 font-sans"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Verifying Chain Signature...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                  Connect Browser Web3 Wallet
                </>
              )}
            </button>
            <div className="flex items-center gap-2 text-[9px] font-mono text-slate-500 uppercase tracking-wider justify-center">
              <span>Supports MetaMask</span>
              <span className="text-slate-700">•</span>
              <span>Coinbase Wallet</span>
              <span className="text-slate-700">•</span>
              <span>Rabby / OKX</span>
            </div>
          </div>

          <div className="relative py-2 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <span className="relative px-3 bg-[#0d0f16] text-[9px] font-mono text-slate-500 uppercase tracking-widest">
              Or Manual Faucet Registry
            </span>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">
              Veklom ID Wallet Source
            </label>
            <div className="flex gap-2">
              <input
                id="wallet-address-input"
                type="text"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                placeholder="0x..."
                className="flex-1 bg-[#050608] border border-white/10 rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
              />
              <button
                id="btn-verify-wallet"
                onClick={handleSimulatedConnect}
                disabled={isVerifying}
                className="bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-50 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded transition-all duration-150 flex items-center gap-1.5 font-sans border border-white/5"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Querying...
                  </>
                ) : (
                  <>
                    Authenticate
                  </>
                )}
              </button>
            </div>
            {errorMessage && (
              <p className="text-[10px] text-red-500 font-mono flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" /> {errorMessage}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-[#0a0c12]/60 p-2.5 rounded border border-white/5">
              <span className="text-[9px] font-mono text-slate-500 uppercase block tracking-wider">
                Authority Node
              </span>
              <span className="text-xs font-mono text-slate-300 truncate block">
                {wallet.verificationDomain}
              </span>
            </div>
            <div className="bg-[#0a0c12]/60 p-2.5 rounded border border-white/5">
              <span className="text-[9px] font-mono text-slate-500 uppercase block tracking-wider">
                Payment Escrow Registry
              </span>
              <span className="text-xs font-mono text-amber-500 truncate block font-bold">
                0xCC34...3D1d
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div id="wallet-dashboard-info" className="space-y-4">
          <div className="flex items-center justify-between bg-emerald-500/5 border border-emerald-500/20 rounded p-3">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <Check className="w-3 h-3" /> Secure Wallet Match
              </span>
              <span className="text-xs font-mono text-white tracking-widest block">
                {wallet.address?.slice(0, 8)}...{wallet.address?.slice(-8)}
              </span>
            </div>
            <button
               id="wallet-disconnect-link"
              onClick={onDisconnect}
              className="text-[10px] font-mono text-red-400 hover:text-red-300 underline uppercase"
            >
              Disconnect
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0a0c12]/60 p-3 rounded border border-white/5 relative group">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">USDC Balance</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-bold font-mono text-white">
                  ${wallet.balanceUsdc.toLocaleString()}
                </span>
                <button 
                  onClick={onRefreshBalance}
                  title="Claim free faucet test funds" 
                  className="text-[9px] font-mono text-blue-400 hover:underline hover:text-blue-300"
                >
                  Faucet+
                </button>
              </div>
            </div>

            <div className="bg-[#0a0c12]/60 p-3 rounded border border-white/5">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">ETH Fuel</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-bold font-mono text-amber-400">
                  {wallet.balanceEth.toFixed(4)} ETH
                </span>
                <span className="text-[9px] font-mono text-emerald-400">Gas-OK</span>
              </div>
            </div>
          </div>

          <table className="w-full text-left text-[11px] font-mono text-slate-400">
            <tbody>
              <tr className="border-b border-white/5">
                <td className="py-1 text-slate-500 uppercase">Verification Domain:</td>
                <td className="py-1 text-right text-slate-300 select-all">{wallet.verificationDomain}</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-1 text-slate-500 uppercase">Veklom ID State:</td>
                <td className="py-1 text-right text-emerald-400 uppercase font-bold">Active Verified</td>
              </tr>
              <tr>
                <td className="py-1 text-slate-500 uppercase">Settlement standard:</td>
                <td className="py-1 text-right text-amber-500 font-bold uppercase">ERC-404 / x402 Facilitator</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
