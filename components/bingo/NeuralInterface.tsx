/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Cpu, Heart, Eye, RefreshCw, Radio, Sparkles } from 'lucide-react';
import { BiometricResonance } from './types';

interface NeuralInterfaceProps {
  resonance: BiometricResonance;
  onChangeResonance: (res: BiometricResonance) => void;
  isTelepathyActive: boolean;
  onToggleTelepathy: (active: boolean) => void;
  onSimulateSpike: () => void;
}

export default function NeuralInterface({
  resonance,
  onChangeResonance,
  isTelepathyActive,
  onToggleTelepathy,
  onSimulateSpike,
}: NeuralInterfaceProps) {
  const [coherenceHistory, setCoherenceHistory] = useState<number[]>([]);
  const [waveHistory, setWaveHistory] = useState<number[]>([]);

  // Generate continuous neural telemetry line waves
  useEffect(() => {
    const timer = setInterval(() => {
      setCoherenceHistory((prev) => {
        const next = [...prev, resonance.cardiac_coherence + (Math.random() * 0.08 - 0.04)];
        if (next.length > 25) next.shift();
        return next;
      });

      setWaveHistory((prev) => {
        const next = [...prev, resonance.neural_frequency_hz + (Math.random() * 2 - 1)];
        if (next.length > 25) next.shift();
        return next;
      });
    }, 400);

    return () => clearInterval(timer);
  }, [resonance]);

  // Handle slider changes
  const handleSliderChange = (field: keyof BiometricResonance, val: number) => {
    onChangeResonance({
      ...resonance,
      [field]: val,
    });
  };

  const getBrainwaveState = (hz: number) => {
    if (hz < 4) return 'Delta (Deep Synaptic Sleep)';
    if (hz < 8) return 'Theta (Subconscious Flow)';
    if (hz < 12) return 'Alpha (Relaxed Alertness)';
    if (hz < 30) return 'Beta (Active Telepathic Action)';
    return 'Gamma (Hyper-Cognitive Transcendence)';
  };

  // Convert array to SVG path
  const generateSvgPath = (data: number[], min: number, max: number) => {
    if (data.length === 0) return '';
    const width = 240;
    const height = 50;
    const step = width / (data.length - 1 || 1);
    
    return data
      .map((val, idx) => {
        const x = idx * step;
        // Normalize val
        const norm = (val - min) / ((max - min) || 1);
        const y = height - (norm * (height - 8) + 4);
        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  };

  return (
    <div id="neural-interface-panel" className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden shadow-[0_0_50px_rgba(188,19,254,0.05)]">
      {/* Absolute Glows */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#bc13fe]/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex justify-between items-center pb-4 mb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#bc13fe] animate-pulse" />
            <h3 className="font-mono text-sm tracking-widest text-[#bc13fe] uppercase">
              Neural Link Calibration
            </h3>
          </div>
          <p className="text-xs text-white/50 mt-0.5 font-sans">
            Tune direct brain-machine communication arrays
          </p>
        </div>

        <button
          onClick={onSimulateSpike}
          className="text-[10px] font-mono text-[#00f3ff] hover:text-[#00f3ff]/80 border border-[#00f3ff]/30 px-2.5 py-1 rounded bg-black/40 cursor-pointer flex items-center gap-1.5 transition-colors"
        >
          <Sparkles className="w-3 h-3 text-[#00f3ff]" /> Biometric Spike
        </button>
      </div>

      {/* Telepathy Link Switch */}
      <div className="mb-6 p-4 bg-black/40 border border-white/10 rounded-xl flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="text-xs font-bold text-white tracking-wide uppercase font-sans">
            Neural Telepathy Active
          </div>
          <p className="text-[10px] text-white/40 font-mono leading-tight">
            Direct real-time pattern selections via neuro-signal
          </p>
        </div>
        <button
          onClick={() => onToggleTelepathy(!isTelepathyActive)}
          className={`
            w-12 h-6 rounded-full p-1 transition-colors duration-300 cursor-pointer relative
            ${isTelepathyActive ? 'bg-[#00f3ff] shadow-[0_0_8px_#00f3ff]' : 'bg-white/10 border border-white/20'}
          `}
        >
          <div
            className={`
              w-4 h-4 rounded-full bg-black shadow-md transition-transform duration-300
              ${isTelepathyActive ? 'translate-x-6' : 'translate-x-0'}
            `}
          ></div>
        </button>
      </div>

      <div className="space-y-6">
        {/* Cardiac Coherence */}
        <div className="space-y-2">
          <div className="flex justify-between items-end text-xs">
            <span className="font-mono text-white/70 flex items-center gap-1.5 uppercase">
              <Heart className="w-3.5 h-3.5 text-[#bc13fe] animate-pulse" /> Cardiac Coherence
            </span>
            <span className="font-mono font-bold text-[#bc13fe] text-lg">
              {(resonance.cardiac_coherence * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#bc13fe] shadow-[0_0_10px_#bc13fe] transition-all duration-300"
              style={{ width: `${resonance.cardiac_coherence * 100}%` }}
            ></div>
          </div>
          <input
            type="range"
            min={0.1}
            max={1.0}
            step={0.01}
            value={resonance.cardiac_coherence}
            onChange={(e) => handleSliderChange('cardiac_coherence', parseFloat(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#bc13fe]"
          />
          {/* Waveform Visualization */}
          <div className="h-12 bg-black/40 border border-white/10 rounded-lg p-1 relative flex items-center justify-between">
            <div className="text-[9px] font-mono text-white/40 uppercase pl-2">ECG Wave</div>
            <svg className="w-48 h-10 text-[#bc13fe]" viewBox="0 0 240 50">
              <path
                d={generateSvgPath(coherenceHistory, 0, 1.2)}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Neural Frequency */}
        <div className="space-y-2">
          <div className="flex justify-between items-end text-xs">
            <span className="font-mono text-white/70 flex items-center gap-1.5 uppercase">
              <Cpu className="w-3.5 h-3.5 text-[#00f3ff]" /> Brainwave Frequency
            </span>
            <span className="font-mono font-bold text-[#00f3ff] text-lg">
              {resonance.neural_frequency_hz.toFixed(1)} Hz
            </span>
          </div>
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#00f3ff] shadow-[0_0_10px_#00f3ff] transition-all duration-300"
              style={{ width: `${Math.min(resonance.neural_frequency_hz, 100)}%` }}
            ></div>
          </div>
          <input
            type="range"
            min={1.0}
            max={100.0}
            step={0.5}
            value={resonance.neural_frequency_hz}
            onChange={(e) => handleSliderChange('neural_frequency_hz', parseFloat(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00f3ff]"
          />
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono text-white/40">
              State: <span className="text-[#00f3ff] font-bold">{getBrainwaveState(resonance.neural_frequency_hz)}</span>
            </span>
          </div>
          {/* Waveform Visualization */}
          <div className="h-12 bg-black/40 border border-white/10 rounded-lg p-1 relative flex items-center justify-between">
            <div className="text-[9px] font-mono text-white/40 uppercase pl-2">EEG Alpha</div>
            <svg className="w-48 h-10 text-[#00f3ff]" viewBox="0 0 240 50">
              <path
                d={generateSvgPath(waveHistory, 0, 110)}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Attention Focus */}
        <div className="space-y-2">
          <div className="flex justify-between items-end text-xs">
            <span className="font-mono text-white/70 flex items-center gap-1.5 uppercase">
              <Eye className="w-3.5 h-3.5 text-[#00f3ff]" /> Attention Focus
            </span>
            <span className="font-mono font-bold text-[#00f3ff] text-lg">
              {resonance.attention_focus_percentage.toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            min={10}
            max={100}
            step={1}
            value={resonance.attention_focus_percentage}
            onChange={(e) => handleSliderChange('attention_focus_percentage', parseFloat(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00f3ff]"
          />
          <div className="w-full bg-white/10 rounded-full h-1 overflow-hidden">
            <div
              className="bg-[#00f3ff] h-full rounded-full transition-all duration-300 shadow-[0_0_10px_#00f3ff]"
              style={{ width: `${resonance.attention_focus_percentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="mt-6 p-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-mono text-white/40">
        <span className="font-bold text-[#00f3ff]">COLLECTIVE RESONANCE ADVICE:</span> Tuning Brainwaves above 30Hz while keeping Cardiac Coherence near 0.90 triggers hyper-synchronistic automated on-chain caller alerts!
      </div>
    </div>
  );
}
