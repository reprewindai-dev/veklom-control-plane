/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, Cpu, Key, RefreshCw, Smartphone } from 'lucide-react';
import { Player } from '../types';

interface MFASectionProps {
  onAuthenticated: (player: Player) => void;
}

export default function MFASection({ onAuthenticated }: MFASectionProps) {
  const [username, setUsername] = useState('');
  const [walletAddress, setWalletAddress] = useState('0x3a74772e925b54F7dAD7FD95c9Ba30825033f970');
  const [loading, setLoading] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaSecret, setMfaSecret] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [error, setError] = useState('');

  const generateRandomWallet = () => {
    const chars = '0123456789abcdef';
    let addr = '0x';
    for (let i = 0; i < 40; i++) {
      addr += chars[Math.floor(Math.random() * 16)];
    }
    setWalletAddress(addr);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !walletAddress.trim()) {
      setError('Please input both username and wallet address.');
      return;
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      setError('Invalid Ethereum/Base wallet format. Must match 0x followed by 40 hex digits.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, walletAddress }),
      });
      const data = await response.json();

      if (response.ok && data.status === 'mfa_required') {
        setMfaRequired(true);
        setMfaSecret(data.mfaSecret);
      } else {
        setError(data.error || 'Authentication handshake failed.');
      }
    } catch (err) {
      setError('Connection to security gateway timed out.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(mfaCode)) {
      setError('MFA validation key must be exactly 6 numeric digits.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress, mfaCode }),
      });
      const data = await response.json();

      if (response.ok && data.status === 'authenticated') {
        onAuthenticated(data.player);
      } else {
        setError(data.error || 'Invalid multi-factor code.');
      }
    } catch (err) {
      setError('MFA gatekeeper service unavailable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="mfa-section-container" className="max-w-md w-full mx-auto bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-[#00f3ff]/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#bc13fe]/10 rounded-full blur-3xl -z-10"></div>

      <div className="text-center mb-8">
        <div className="inline-flex p-3 bg-black/40 border border-[#00f3ff]/30 rounded-2xl mb-4 shadow-inner">
          <ShieldCheck className="w-8 h-8 text-[#00f3ff] animate-pulse" />
        </div>
        <h2 className="text-xl font-black tracking-tighter uppercase leading-none italic text-[#00f3ff]">
          BINGO 2060 SECURITY PORTAL
        </h2>
        <p className="text-[10px] tracking-[0.2em] uppercase text-white/50 mt-2 font-mono">
          Establish cryptographic link to the Base Mainnet X402 rail
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-950/40 border border-red-500/30 rounded-lg text-xs text-red-300 font-mono flex items-start gap-2">
          <span className="font-bold">ALERT:</span> {error}
        </div>
      )}

      {!mfaRequired ? (
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold text-[#00f3ff] uppercase tracking-widest mb-2 font-mono">
              Neural Handle
            </label>
            <div className="relative">
              <Cpu className="absolute left-3 top-3.5 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="e.g. CyberAthlete_01"
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:border-[#00f3ff] focus:outline-none transition-colors font-mono text-white placeholder-white/30"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-[10px] font-bold text-[#00f3ff] uppercase tracking-widest font-mono">
                Base Wallet Address
              </label>
              <button
                type="button"
                onClick={generateRandomWallet}
                className="text-[10px] text-[#bc13fe] hover:text-[#bc13fe]/80 font-mono flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3 h-3" /> Gen New
              </button>
            </div>
            <div className="relative">
              <Key className="absolute left-3 top-3.5 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="0x..."
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs focus:border-[#00f3ff] focus:outline-none transition-colors font-mono text-[#bc13fe] placeholder-white/30"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#00f3ff] to-[#bc13fe] text-black font-black uppercase tracking-widest py-3 px-4 rounded-xl transition-all cursor-pointer font-mono text-xs shadow-[0_0_20px_rgba(0,243,255,0.4)] hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'CALIBRATING HANDSHAKE...' : 'ESTABLISH NEURAL LINK'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyMfa} className="space-y-6">
          <div className="p-4 bg-black/40 border border-[#bc13fe]/30 rounded-xl space-y-2">
            <p className="text-xs text-[#bc13fe] font-mono flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-[#bc13fe]" /> Secure Multi-Factor Key active
            </p>
            <p className="text-[10px] text-white/50 font-mono leading-relaxed">
              Verify your identity. Enter the 6-digit rolling authenticator passcode to bypass physical firewalls.
            </p>
            <div className="text-[10px] bg-black/50 px-3 py-1.5 rounded border border-white/10 font-mono text-[#00f3ff] select-all text-center">
              Secret: {mfaSecret}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#bc13fe] uppercase tracking-widest text-center mb-3 font-mono">
              Enter 6-Digit MFA Authorization Code
            </label>
            <input
              type="text"
              placeholder="000 000"
              maxLength={6}
              className="w-full bg-black/40 border border-[#bc13fe]/40 rounded-xl py-3.5 text-center text-xl font-mono tracking-widest focus:border-[#bc13fe] focus:outline-none focus:ring-1 focus:ring-[#bc13fe] text-[#bc13fe] placeholder-white/20"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setMfaRequired(false)}
              className="w-1/3 bg-white/5 hover:bg-white/10 border border-white/10 font-mono text-xs text-white/70 rounded-xl py-3 transition-colors cursor-pointer"
            >
              BACK
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-2/3 bg-gradient-to-r from-[#bc13fe] to-pink-600 hover:brightness-110 text-white font-black uppercase tracking-widest py-3 px-4 rounded-xl shadow-[0_0_20px_rgba(188,19,254,0.3)] cursor-pointer transition-all disabled:opacity-50 font-mono text-xs"
            >
              {loading ? 'SECURING CORE...' : 'VERIFY IDENTITY'}
            </button>
          </div>
        </form>
      )}

      <div className="mt-8 border-t border-white/10 pt-4 text-center">
        <p className="text-[10px] text-white/40 font-mono leading-relaxed">
          Authorized on-chain asset mapping under Base App ID 6a20f24cc341f72c2f573eb5.
        </p>
      </div>
    </div>
  );
}
