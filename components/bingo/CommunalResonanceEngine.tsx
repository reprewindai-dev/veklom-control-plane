/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Heart, Cpu, Users, Zap, Sparkles, Activity, Flame, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { BiometricResonance } from '../types';

interface CommunalResonanceEngineProps {
  playerResonance: BiometricResonance;
  lobbyName: string;
  activePlayersCount: number;
  isGameActive: boolean;
  calledNumbersCount: number;
}

interface PeerResonance {
  id: string;
  name: string;
  isBot: boolean;
  coherence: number;
  focus: number;
  frequency: number;
  attunementRate: number;
}

export default function CommunalResonanceEngine({
  playerResonance,
  lobbyName,
  activePlayersCount,
  isGameActive,
  calledNumbersCount,
}: CommunalResonanceEngineProps) {
  const [peers, setPeers] = useState<PeerResonance[]>([]);
  const [collectiveCoherence, setCollectiveCoherence] = useState<number>(75.4);
  const [coherenceTrend, setCoherenceTrend] = useState<'rising' | 'stable' | 'spiking'>('stable');
  const [resonanceWaves, setResonanceWaves] = useState<number[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize peer nodes
  useEffect(() => {
    const peerNames = [
      { name: 'Quantum-Neural-Bot-X', isBot: true },
      { name: 'EIP-3009-Validator-1', isBot: true },
      { name: 'Human-0x71C9...8a4f', isBot: false },
      { name: 'Syndicate-Node-402', isBot: true },
      { name: 'Human-0x3dE1...f67b', isBot: false },
      { name: 'Delta-Mind-9', isBot: true },
    ];

    const initialPeers = peerNames.slice(0, Math.max(3, Math.min(peerNames.length, activePlayersCount))).map((p, idx) => ({
      id: `peer-${idx}`,
      name: p.name,
      isBot: p.isBot,
      coherence: 0.65 + Math.random() * 0.25,
      focus: 70 + Math.floor(Math.random() * 25),
      frequency: 10.5 + Math.random() * 25,
      attunementRate: 75 + Math.floor(Math.random() * 20),
    }));

    setPeers(initialPeers);
  }, [activePlayersCount]);

  // Handle continuous real-time changes to simulate low-latency biometric synchronization
  useEffect(() => {
    const interval = setInterval(() => {
      // Modulate peer biometrics to sync closer to playerResonance if player focus is high
      setPeers((prevPeers) =>
        prevPeers.map((peer) => {
          const targetCoherence = playerResonance.cardiac_coherence;
          const delta = targetCoherence - peer.coherence;
          const step = delta * 0.15; // smooth attraction rate
          
          return {
            ...peer,
            coherence: Number(Math.max(0.1, Math.min(1.0, peer.coherence + step + (Math.random() * 0.04 - 0.02))).toFixed(3)),
            focus: Math.max(10, Math.min(100, peer.focus + Math.floor(Math.random() * 6 - 3))),
            frequency: Number(Math.max(1.0, Math.min(100.0, peer.frequency + (Math.random() * 2 - 1))).toFixed(1)),
            attunementRate: Math.max(50, Math.min(100, Math.round(100 - Math.abs(peer.coherence - targetCoherence) * 100))),
          };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [playerResonance]);

  // Calculate global resonance metrics
  useEffect(() => {
    if (peers.length === 0) return;
    
    const totalCoherence = peers.reduce((acc, p) => acc + p.coherence, 0) + playerResonance.cardiac_coherence;
    const avgCoherence = (totalCoherence / (peers.length + 1)) * 100;
    
    setCollectiveCoherence((prev) => {
      const diff = avgCoherence - prev;
      if (diff > 1.5) {
        setCoherenceTrend('spiking');
      } else if (diff > 0.2) {
        setCoherenceTrend('rising');
      } else {
        setCoherenceTrend('stable');
      }
      return Number(avgCoherence.toFixed(1));
    });
  }, [peers, playerResonance]);

  // Feed live pulse wave telemetry to canvas
  useEffect(() => {
    let animationFrameId: number;
    let offset = 0;

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // We draw 3 overlapping sinewaves to depict collective biological/cognitive resonance
      const drawWave = (amplitude: number, frequency: number, color: string, lineWidth: number, speed: number) => {
        ctx.beginPath();
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = color;
        
        for (let x = 0; x < width; x++) {
          const y = height / 2 + 
            Math.sin(x * frequency + offset * speed) * amplitude * Math.sin(x * 0.005);
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      };

      // Modulate waves according to current Collective Coherence percentage
      const resonanceFactor = collectiveCoherence / 100;
      
      // Background slow ambient field wave (Alpha frequency)
      drawWave(18 * resonanceFactor, 0.008, 'rgba(188, 19, 254, 0.15)', 2, 0.02);
      
      // Mid-level synchrony wave (Beta frequency)
      drawWave(12 * resonanceFactor, 0.015, 'rgba(0, 243, 255, 0.3)', 1.5, 0.05);
      
      // Fast active coherence wave (Gamma frequency / Heart rhythm)
      drawWave(6 * (playerResonance.cardiac_coherence), 0.03, 'rgba(239, 68, 68, 0.5)', 2.5, 0.08);

      offset += 1;
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [collectiveCoherence, playerResonance]);

  const getStatusColor = (coherence: number) => {
    if (coherence > 85) return 'text-red-400';
    if (coherence > 70) return 'text-purple-400';
    return 'text-[#00f3ff]';
  };

  const getStatusBadge = (coherence: number) => {
    if (coherence > 90) return 'HYPER-RESONATING';
    if (coherence > 75) return 'SYNAPSE ATTUNED';
    if (coherence > 60) return 'ENTRAINED';
    return 'CALIBRATING';
  };

  return (
    <div id="communal-resonance-panel" className="bg-gradient-to-br from-[#0c0f1d] via-black/90 to-black border border-[#bc13fe]/30 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden shadow-[0_0_40px_rgba(188,19,254,0.1)]">
      {/* Absolute Decorative Glows */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-[#00f3ff]/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#bc13fe]/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex items-center gap-2 pb-3 mb-4 border-b border-white/10">
        <Activity className="w-5 h-5 text-[#bc13fe] animate-pulse" />
        <div>
          <h4 className="font-mono text-xs tracking-widest text-white uppercase font-bold flex items-center gap-1.5">
            Communal Resonance Engine <span className="text-[8px] bg-[#00f3ff]/20 text-[#00f3ff] px-1.5 py-0.5 rounded border border-[#00f3ff]/30 animate-pulse">BIOMETRIC SYNC v2</span>
          </h4>
          <p className="text-[9px] text-white/50 font-mono uppercase tracking-wider">Collective Emotional Resonance Array</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Real-time Collective Waveform Monitor */}
        <div className="bg-black/60 border border-white/5 rounded-xl p-3 relative overflow-hidden">
          <div className="absolute top-2 left-3 flex items-center gap-1.5 z-10">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span>
            <span className="font-mono text-[9px] text-white/40 uppercase tracking-widest">Biometric Synchrony Map</span>
          </div>

          <div className="absolute top-2 right-3 z-10 font-mono text-[9px] text-white/40 uppercase flex items-center gap-1">
            Coherence Level: 
            <span className={`font-bold ${
              coherenceTrend === 'spiking' ? 'text-red-400 animate-bounce' : coherenceTrend === 'rising' ? 'text-green-400' : 'text-slate-300'
            }`}>
              {collectiveCoherence}%
            </span>
          </div>

          {/* SVG/Canvas Heart-Rate Synthesizer Display */}
          <div className="h-24 w-full flex items-center justify-center relative mt-3">
            <canvas 
              ref={canvasRef} 
              width={340} 
              height={96} 
              className="w-full h-full opacity-90"
            />
            {isGameActive && calledNumbersCount > 0 && (
              <div className="absolute bottom-1 right-2 flex items-center gap-1 text-[8px] text-[#00f3ff]/70 font-mono bg-[#00f3ff]/10 border border-[#00f3ff]/20 px-1.5 py-0.5 rounded">
                <Flame className="w-2.5 h-2.5 text-amber-500 animate-bounce" /> {calledNumbersCount} DRAWS ACTIVE
              </div>
            )}
          </div>
        </div>

        {/* Global Active Consciousness Matrix Grid */}
        <div className="space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="font-mono text-[10px] text-white/50 uppercase tracking-wider">Active Competitor Nodes:</span>
            <span className="font-mono text-[10px] text-[#00f3ff] font-bold">{peers.length + 1} Mind Units</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Player Node card */}
            <div className="bg-white/5 border border-[#bc13fe]/30 rounded-xl p-2.5 font-mono text-[9px] space-y-1 relative">
              <div className="flex justify-between items-center">
                <span className="text-white font-bold truncate">YOU (Local Mind)</span>
                <span className="text-[7px] bg-red-500/20 text-red-400 px-1 rounded uppercase tracking-widest">HOST</span>
              </div>
              <div className="space-y-0.5 text-white/60">
                <div className="flex justify-between">
                  <span>Coherence:</span>
                  <span className="text-[#bc13fe] font-bold">{(playerResonance.cardiac_coherence * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Brainwave:</span>
                  <span className="text-[#00f3ff]">{playerResonance.neural_frequency_hz.toFixed(1)}Hz</span>
                </div>
                <div className="flex justify-between">
                  <span>Resonance state:</span>
                  <span className="text-amber-400 font-bold">{playerResonance.cardiac_coherence > 0.85 ? 'ELEVATED' : 'STABLE'}</span>
                </div>
              </div>
            </div>

            {/* Peer Node cards */}
            {peers.map((peer, i) => (
              <div key={peer.id} className="bg-white/5 border border-white/5 rounded-xl p-2.5 font-mono text-[9px] space-y-1 relative">
                <div className="flex justify-between items-center">
                  <span className="text-white/80 truncate">{peer.name}</span>
                  <span className={`text-[7px] px-1 rounded uppercase tracking-widest ${peer.isBot ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'}`}>
                    {peer.isBot ? 'M2M' : 'HUMAN'}
                  </span>
                </div>
                <div className="space-y-0.5 text-white/50">
                  <div className="flex justify-between">
                    <span>Coherence:</span>
                    <span className={`${getStatusColor(peer.coherence * 100)} font-bold`}>{(peer.coherence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Brainwave:</span>
                    <span>{peer.frequency.toFixed(1)}Hz</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Attunement:</span>
                    <span className="text-green-400 font-bold">{peer.attunementRate}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low-latency emotional response mechanism explanation */}
        <div className="p-3 bg-[#00f3ff]/5 border border-[#00f3ff]/20 rounded-xl space-y-1.5 font-mono text-[9px] text-white/70">
          <div className="font-bold text-[#00f3ff] uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#00f3ff]" /> Sensory Synchronicity & Win Response:
          </div>
          <p className="text-white/60 leading-relaxed text-[8.5px]">
            When a matching row/diagonal is finalized, the **Communal Emotional Resonance Engine** broadcasts a sudden wave of biometric coherence spike across all participant channels simultaneously. 
          </p>
          <div className="flex items-center gap-1 text-green-400 font-bold text-[8px] bg-green-950/40 border border-green-500/30 p-1.5 rounded mt-1">
            <CheckCircle2 className="w-3 h-3 text-green-400 shrink-0" /> Shared payouts are split automatically into corresponding wallets 24/7!
          </div>
        </div>
      </div>
    </div>
  );
}
