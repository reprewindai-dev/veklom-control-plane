import React from 'react';
import { PGLAgent } from '../data/pglLoader';
import { Shield, Fingerprint, Activity, Terminal } from 'lucide-react';

interface Props {
  agents: PGLAgent[];
  onSelectAgent: (agent: PGLAgent) => void;
}

export default function PGLTerminalGrid({ agents, onSelectAgent }: Props) {
  return (
    <div className="w-full h-full flex flex-col p-6 space-y-6">
      <div className="flex items-center space-x-4 border-b border-[#00FF66]/20 pb-4">
        <Terminal className="w-6 h-6 text-[#00FF66]" />
        <h2 className="text-xl font-mono text-[#00FF66] tracking-widest uppercase">
          Agent Army Roster (PGL Synchronized)
        </h2>
        <div className="ml-auto flex items-center space-x-2 text-xs font-mono text-[#00E5FF]">
          <span className="animate-pulse w-2 h-2 rounded-full bg-[#00E5FF]" />
          <span>{agents.length} SECURE CHANNELS ACTIVE</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 overflow-y-auto pr-2 pb-20">
        {agents.map((agent) => (
          <div 
            key={agent.pgl_id}
            onClick={() => onSelectAgent(agent)}
            className="obsidian-glass-interactive p-4 rounded-sm border border-[#00FF66]/20 hover:border-[#00FF66]/60 cursor-pointer group flex flex-col space-y-3"
          >
            <div className="flex justify-between items-start">
              <h3 className="font-mono text-sm font-bold text-white group-hover:text-[#00FF66] transition-colors">
                {agent.agent.toUpperCase()}
              </h3>
              {agent.status === 'cleared' ? (
                <Shield className="w-4 h-4 text-[#00FF66]" />
              ) : (
                <Activity className="w-4 h-4 text-[#FFAB00]" />
              )}
            </div>

            <div className="flex flex-col space-y-1">
              <div className="text-[10px] font-mono text-gray-500 uppercase">PGL Signature</div>
              <div className="flex items-center space-x-2">
                <Fingerprint className="w-3 h-3 text-gray-400" />
                <span className="text-xs font-mono text-gray-300 truncate">
                  {agent.pgl_id}
                </span>
              </div>
            </div>

            <div className="flex flex-col space-y-1 pt-2 border-t border-white/5">
              <div className="text-[10px] font-mono text-gray-500 uppercase">Execution Run</div>
              <div className="text-xs font-mono text-[#00E5FF] truncate">
                {agent.run_id}
              </div>
            </div>
            
            <div className="mt-auto pt-2 flex items-center">
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-sm bg-[#00FF66]/10 text-[#00FF66]">
                {agent.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
