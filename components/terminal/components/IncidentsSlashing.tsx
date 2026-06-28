"use client";
import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Coins, 
  TrendingDown, 
  Activity, 
  ShieldAlert, 
  CheckCircle, 
  Play, 
  Clock, 
  DollarSign,
  Layers,
  ArrowDownRight,
  ExternalLink
} from 'lucide-react';

interface SlashingIncident {
  id: string;
  timestamp: string;
  target: string;
  region: string;
  type: string;
  details: string;
  slashedAmount: number;
  evidenceHash: string;
  txHash: string;
  headerStake: string;
  headerResult: string;
  status: 'slashed' | 'pending' | 'resolved';
}

export default function IncidentsSlashing() {
  const [totalStaked, setTotalStaked] = useState<number>(450000);
  const [totalSlashed, setTotalSlashed] = useState<number>(12450);
  const [yieldRate, setYieldRate] = useState<number>(8.4);
  const [activeValidators, setActiveValidators] = useState<number>(15);

  const [incidents, setIncidents] = useState<SlashingIncident[]>([
    {
      id: 'slash-01',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      target: 'did:vnp:api:anthropic-claude3',
      region: 'AP-SOUTHEAST (Singapore)',
      type: 'Latency SLA Breach',
      details: 'Measured latency: 680ms | Allowed SLA threshold: 350ms',
      slashedAmount: 250,
      evidenceHash: '0x3a4b89968a41bc9eb92f153a4c495914ab77de0fc855b7fca4b76a086a9f4e2',
      txHash: '0x8de9fc855b7fca4b76a086a9f4e242a4b89968a41bc9eb92f153a4c495914ab77',
      headerStake: 'yield=8.4%; slashed=12200',
      headerResult: 'SLA_VIOLATED_SLASHED',
      status: 'slashed'
    },
    {
      id: 'slash-02',
      timestamp: new Date(Date.now() - 3600000 * 8).toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      target: 'did:vnp:api:openai-gpt4o',
      region: 'US-EAST (N. Virginia)',
      type: 'Uptime Outage Failure',
      details: 'HTTP Status: 503 Service Unavailable | Availability: 0.00%',
      slashedAmount: 1000,
      evidenceHash: '0x7fca4b76a086a9f4e242a4b89968a41bc9eb92f153a4c495914ab77de0fc855b',
      txHash: '0x3e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      headerStake: 'yield=8.4%; slashed=11200',
      headerResult: 'OUTAGE_DETECTED_SLASHED',
      status: 'slashed'
    },
    {
      id: 'slash-03',
      timestamp: new Date(Date.now() - 3600000 * 18).toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      target: 'did:vnp:api:stripe-payments',
      region: 'EU-WEST (Frankfurt)',
      type: 'Cryptographic Signature Fault',
      details: 'Ed25519 payload signature check failed: BadSignatureError',
      slashedAmount: 500,
      evidenceHash: '0x2a2491a61c3a649fb92080a4c8996fa127be41e4649b934ca495991b7852b3de',
      txHash: '0x9fb92427ae41e4649b934ca495991b7852b855e3b0c44298fc1c149afbf4c899',
      headerStake: 'yield=8.5%; slashed=10700',
      headerResult: 'SIGNATURE_INVALID_SLASHED',
      status: 'slashed'
    }
  ]);

  // Simulators
  const triggerSimulation = (type: 'latency' | 'outage' | 'signature') => {
    let target = '';
    let region = '';
    let typeStr = '';
    let details = '';
    let amount = 0;
    let headerResult = '';

    if (type === 'latency') {
      target = 'did:vnp:api:openai-gpt4o';
      region = 'US-WEST (Oregon)';
      typeStr = 'Latency SLA Breach';
      details = 'Measured latency: 842ms | Allowed SLA threshold: 200ms';
      amount = 250;
      headerResult = 'SLA_VIOLATED_SLASHED';
    } else if (type === 'outage') {
      target = 'did:vnp:api:stripe-payments';
      region = 'AP-NORTHEAST (Tokyo)';
      typeStr = 'Uptime Outage Failure';
      details = 'HTTP Status: 502 Bad Gateway | Connection Reset by Peer';
      amount = 1000;
      headerResult = 'OUTAGE_DETECTED_SLASHED';
    } else {
      target = 'did:vnp:api:gemini-pro';
      region = 'AP-SOUTHEAST (Singapore)';
      typeStr = 'Cryptographic Signature Fault';
      details = 'Ingested x-vnp-signature does not verify against public_key';
      amount = 500;
      headerResult = 'SIGNATURE_INVALID_SLASHED';
    }

    const newSlashedTotal = totalSlashed + amount;
    const newYield = parseFloat((yieldRate - 0.05).toFixed(2));

    // Update global performance bond pools
    setTotalSlashed(newSlashedTotal);
    setYieldRate(newYield);

    const newIncident: SlashingIncident = {
      id: `slash-sim-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      target,
      region,
      type: typeStr,
      details,
      slashedAmount: amount,
      evidenceHash: '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join(''),
      txHash: '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join(''),
      headerStake: `yield=${newYield}%; slashed=${newSlashedTotal}`,
      headerResult,
      status: 'slashed'
    };

    setIncidents(prev => [newIncident, ...prev]);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#030303] text-white/90 overflow-hidden font-sans border-l border-white/5 relative">
      
      {/* SLA Grid overlay */}
      <div className="absolute inset-0 grid-overlay opacity-20 pointer-events-none z-0" />
      
      {/* Header bar */}
      <div className="h-12 border-b border-white/10 shrink-0 bg-void-black/80 backdrop-blur flex items-center justify-between px-6 z-10 select-none">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4.5 h-4.5 text-[#FF003C] animate-pulse" />
          <span className="text-xs font-bold tracking-widest uppercase text-white">SLA INCIDENTS & SLASHING LEDGER</span>
        </div>
        <div className="text-[10px] font-mono text-white/40 uppercase">
          Zero-Trust Rule Enforcer: <span className="text-[#00FF66]">Active</span>
        </div>
      </div>

      {/* Main content grid */}
      <div className="flex-grow overflow-y-auto p-6 flex flex-col gap-6 z-10 relative">
        
        {/* Performance metrics row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          <div className="p-4 bg-void-metal/40 border border-white/5 rounded-xl flex flex-col gap-1">
            <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">TOTAL STAKED BONDS</span>
            <div className="text-[20px] font-bold font-mono text-[#00E5FF] text-glow-cyan flex items-center gap-1.5 mt-1">
              <Coins className="w-5 h-5 text-[#00E5FF]" />
              {totalStaked.toLocaleString()} VNP
            </div>
            <span className="text-[9.5px] text-white/30">Active SLA performance bonds</span>
          </div>

          <div className="p-4 bg-void-metal/40 border border-white/5 rounded-xl flex flex-col gap-1">
            <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">SLASHED PERFORMANCE</span>
            <div className="text-[20px] font-bold font-mono text-[#FF003C] text-glow-red flex items-center gap-1.5 mt-1">
              <TrendingDown className="w-5 h-5 text-[#FF003C]" />
              -{totalSlashed.toLocaleString()} VNP
            </div>
            <span className="text-[9.5px] text-white/30">Slashed yield from SLA breaches</span>
          </div>

          <div className="p-4 bg-void-metal/40 border border-white/5 rounded-xl flex flex-col gap-1">
            <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">STAKING POOL YIELD</span>
            <div className="text-[20px] font-bold font-mono text-[#00FF66] text-glow-emerald flex items-center gap-1.5 mt-1">
              <Activity className="w-5 h-5 text-[#00FF66]" />
              {yieldRate}% APY
            </div>
            <span className="text-[9.5px] text-white/30">Dynamic yield adjusted per slash</span>
          </div>

          <div className="p-4 bg-void-metal/40 border border-white/5 rounded-xl flex flex-col gap-1">
            <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">HEALTHY VALIDATORS</span>
            <div className="text-[20px] font-bold font-mono text-white/80 flex items-center gap-1.5 mt-1">
              <CheckCircle className="w-5 h-5 text-[#00FF66]" />
              {activeValidators} / 15
            </div>
            <span className="text-[9.5px] text-white/30">Active node validators reporting</span>
          </div>

        </div>

        {/* Layout Split: Left (Incidents Log), Right (Simulators & Rules) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow items-stretch">
          
          {/* SLA Logs ticker (Left) */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            <div className="text-[10px] font-mono tracking-wider text-white/30 uppercase">SLA SLASHING LOG TICKER</div>
            <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
              {incidents.map(inc => (
                <div 
                  key={inc.id}
                  className="p-4 bg-void-metal/30 border border-[#FF003C]/20 hover:border-[#FF003C]/40 transition-all rounded-lg flex flex-col gap-3 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#FF003C]/2 rounded-full blur-2xl pointer-events-none" />
                  
                  {/* Title & Metadata */}
                  <div className="flex justify-between items-start border-b border-white/5 pb-2 shrink-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-[#FF003C]/10 text-[#FF003C] border border-[#FF003C]/20 uppercase">SLASHED</span>
                        <span className="text-xs font-bold text-white/80">{inc.type}</span>
                      </div>
                      <div className="text-[9px] text-white/40 font-mono mt-1 uppercase">
                        {inc.target} — {inc.region}
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-xs font-bold text-[#FF003C]">-{inc.slashedAmount} VNP</div>
                      <div className="text-[8.5px] text-white/30 flex items-center gap-1 justify-end"><Clock className="w-2.5 h-2.5" /> {inc.timestamp}</div>
                    </div>
                  </div>

                  {/* Details */}
                  <p className="text-xs text-white/70 leading-normal">{inc.details}</p>

                  {/* Response Headers & Proofs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-black/40 border border-white/5 p-3 rounded font-mono text-[9px]">
                    <div>
                      <div className="text-white/30 uppercase mb-1">Parsed Response Headers</div>
                      <div className="text-white/60"><span className="text-violet-400">X-VNP-Stake:</span> {inc.headerStake}</div>
                      <div className="text-[#FF003C] font-semibold mt-0.5"><span className="text-violet-400">X-VNP-Stake-Result:</span> {inc.headerResult}</div>
                    </div>
                    <div>
                      <div className="text-white/30 uppercase mb-1">Cryptographic Sign-Off</div>
                      <div className="text-white/50 truncate" title={inc.evidenceHash}>Evidence: {inc.evidenceHash}</div>
                      <div className="text-[#00E5FF] truncate flex items-center gap-1 mt-0.5" title={inc.txHash}>
                        <span>Anchor: {inc.txHash}</span>
                        <ExternalLink className="w-2.5 h-2.5 text-[#00E5FF]/60" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Simulation Tools (Right) */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            
            {/* Simulation controls card */}
            <div className="p-5 border border-white/10 rounded-xl bg-void-metal/80 backdrop-blur flex flex-col gap-4">
              <div>
                <h3 className="text-xs font-bold tracking-wider uppercase text-white/80">SLA Incident Simulator</h3>
                <p className="text-[10px] text-white/40 mt-0.5">Trigger artificial SLA anomalies to test the Zero-Trust interception pipeline</p>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => triggerSimulation('latency')}
                  className="w-full p-3 bg-black/40 border border-white/5 hover:border-[#FF003C]/30 hover:bg-[#FF003C]/5 text-left text-xs font-mono rounded-lg cursor-pointer flex justify-between items-center transition-all group"
                >
                  <div>
                    <div className="font-semibold text-white/80 group-hover:text-white">Latency Threshold Breach</div>
                    <div className="text-[8.5px] text-white/30 uppercase mt-0.5">Trigger 842ms Spike / Slashes 250 VNP</div>
                  </div>
                  <Play className="w-3.5 h-3.5 text-white/30 group-hover:text-[#FF003C] transition-colors" />
                </button>

                <button
                  onClick={() => triggerSimulation('outage')}
                  className="w-full p-3 bg-black/40 border border-white/5 hover:border-[#FF003C]/30 hover:bg-[#FF003C]/5 text-left text-xs font-mono rounded-lg cursor-pointer flex justify-between items-center transition-all group"
                >
                  <div>
                    <div className="font-semibold text-white/80 group-hover:text-white">HTTP 502/503 Service Outage</div>
                    <div className="text-[8.5px] text-white/30 uppercase mt-0.5">Trigger Outage / Slashes 1000 VNP</div>
                  </div>
                  <Play className="w-3.5 h-3.5 text-white/30 group-hover:text-[#FF003C] transition-colors" />
                </button>

                <button
                  onClick={() => triggerSimulation('signature')}
                  className="w-full p-3 bg-black/40 border border-white/5 hover:border-[#FF003C]/30 hover:bg-[#FF003C]/5 text-left text-xs font-mono rounded-lg cursor-pointer flex justify-between items-center transition-all group"
                >
                  <div>
                    <div className="font-semibold text-white/80 group-hover:text-white">Cryptographic Signature Fault</div>
                    <div className="text-[8.5px] text-white/30 uppercase mt-0.5">Mismatched Ed25519 / Slashes 500 VNP</div>
                  </div>
                  <Play className="w-3.5 h-3.5 text-white/30 group-hover:text-[#FF003C] transition-colors" />
                </button>
              </div>
            </div>

            {/* Zero-Trust Middleware Enforcer rules info card */}
            <div className="p-5 border border-white/10 rounded-xl bg-void-metal/85 backdrop-blur flex flex-col gap-3 font-mono text-[9.5px]">
              <div className="text-[#00FF66] font-bold tracking-wider uppercase flex items-center gap-1.5 border-b border-white/5 pb-2">
                <Layers className="w-3.5 h-3.5 text-[#00FF66]" /> ZERO-TRUST MIDDLEWARE RULES
              </div>
              
              <div className="flex flex-col gap-3.5">
                <div>
                  <div className="text-white/30 uppercase font-semibold">RULE_01: SLA Threshold Gate</div>
                  <p className="text-white/60 mt-0.5 leading-normal">API gateway continuously inspects `X-VNP-Stake-Result`. Any request returning `SLA_VIOLATED_SLASHED` redirects routing to the standby provider in <span className="text-[#00E5FF]">sub-15ms</span>.</p>
                </div>
                <div>
                  <div className="text-white/30 uppercase font-semibold">RULE_02: Outage Fallback</div>
                  <p className="text-white/60 mt-0.5 leading-normal">On `OUTAGE_DETECTED_SLASHED`, the middleware drops connection immediately and recovers from local cache, triggering a Slash Event to slash the validator's performance bond.</p>
                </div>
                <div>
                  <div className="text-white/30 uppercase font-semibold">RULE_03: Fail-Closed Protection</div>
                  <p className="text-white/60 mt-0.5 leading-normal">Zero-Trust middleware denies any inbound API execution that cannot resolve its target identity and signatures through the PGL IdentityRAG mechanism.</p>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
