"use client";
import React, { useState } from 'react';
import { PGLAgent } from '../data/pglLoader';
import { Play, Pause, Square, FastForward, Lock, TerminalSquare, AlertTriangle } from 'lucide-react';

interface Props {
  agent: PGLAgent;
  onClose: () => void;
}

export default function AgentReplayController({ agent, onClose }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    `[SYS] Initializing control uplink to ${agent.agent.toUpperCase()}...`,
    `[AUTH] Validating PGL Signature: ${agent.pgl_id}...`,
    `[AUTH] Signature verified. Deterministic lock engaged.`,
    `[RUN] Connected to execution block: ${agent.run_id}`
  ]);

  const handleSimulateReplay = () => {
    setIsPlaying(true);
    setLogs(prev => [...prev, `[CMD] Executing Replay Pipeline for ${agent.agent}...`]);
    
    // Mocking replay telemetry
    setTimeout(() => {
      setLogs(prev => [...prev, `[TRC] Fetching state nodes from MASTER_STATE.md...`]);
    }, 1000);
    setTimeout(() => {
      setLogs(prev => [...prev, `[TRC] Restoring memory embeddings...`]);
    }, 2000);
    setTimeout(() => {
      setLogs(prev => [...prev, `[TRC] Alignment synchronized. Ready.`]);
      setIsPlaying(false);
    }, 3500);
  };

  return (
    <div className="absolute inset-0 bg-[#030303]/95 backdrop-blur-md z-50 flex flex-col p-8">
      {/* Header Section */}
      <div className="flex items-center justify-between border-b border-[#00FF66]/30 pb-4 mb-6">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-xs font-mono border border-white/20 text-white hover:bg-white/5 transition-colors"
          >
            &lt; RETURN TO GRID
          </button>
          <div className="flex flex-col">
            <h1 className="text-2xl font-mono text-[#00E5FF] uppercase font-bold tracking-wider">
              {agent.agent} // REPLAY CONTROLLER
            </h1>
            <div className="flex items-center space-x-2 mt-1">
              <Lock className="w-3 h-3 text-[#00FF66]" />
              <span className="text-xs font-mono text-gray-400">
                PGL_LOCKED: {agent.pgl_id}
              </span>
            </div>
          </div>
        </div>
        
        {/* Playback Controls */}
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleSimulateReplay}
            disabled={isPlaying}
            className="p-3 bg-[#00FF66]/10 border border-[#00FF66]/50 text-[#00FF66] hover:bg-[#00FF66]/20 transition-colors disabled:opacity-50"
          >
            <Play className="w-5 h-5" />
          </button>
          <button className="p-3 border border-white/20 text-white hover:bg-white/5 transition-colors">
            <Pause className="w-5 h-5" />
          </button>
          <button className="p-3 border border-white/20 text-white hover:bg-white/5 transition-colors">
            <Square className="w-5 h-5" />
          </button>
          <button className="p-3 border border-white/20 text-white hover:bg-white/5 transition-colors">
            <FastForward className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Terminal View */}
      <div className="flex-1 flex flex-col border border-white/10 bg-[#0a0a0c] rounded-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-8 bg-white/5 border-b border-white/10 flex items-center px-4">
          <TerminalSquare className="w-4 h-4 text-gray-400 mr-2" />
          <span className="text-xs font-mono text-gray-400">root@veklom-pgl-terminal:~#</span>
        </div>
        
        <div className="flex-1 p-6 pt-12 overflow-y-auto font-mono text-sm space-y-2">
          {logs.map((log, i) => (
            <div key={i} className="flex space-x-4">
              <span className="text-gray-600">[{new Date().toISOString().split('T')[1].slice(0, -1)}]</span>
              <span className={
                log.includes('[SYS]') ? 'text-gray-300' :
                log.includes('[AUTH]') ? 'text-[#00FF66]' :
                log.includes('[CMD]') ? 'text-[#00E5FF]' :
                'text-white'
              }>
                {log}
              </span>
            </div>
          ))}
          {isPlaying && (
            <div className="flex space-x-4 animate-pulse">
              <span className="text-gray-600">[{new Date().toISOString().split('T')[1].slice(0, -1)}]</span>
              <span className="text-[#FFAB00]">_</span>
            </div>
          )}
        </div>
        
        {/* Alignment Warning */}
        <div className="h-12 bg-[#FFAB00]/10 border-t border-[#FFAB00]/30 flex items-center px-4 space-x-3">
          <AlertTriangle className="w-4 h-4 text-[#FFAB00]" />
          <span className="text-xs font-mono text-[#FFAB00]">
            DETERMINISTIC ALIGNMENT ENFORCED. ALL TOOL OUTPUTS WILL BE SYNCED WITH RUN {agent.run_id}.
          </span>
        </div>
      </div>
    </div>
  );
}
