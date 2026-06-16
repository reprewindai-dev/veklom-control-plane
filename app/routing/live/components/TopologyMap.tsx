// @ts-nocheck
"use client";
import React from 'react';
import { Network, Database, ShieldAlert, Cpu, FileText, ArrowRight } from 'lucide-react';

interface TopologyMapProps {
  activeActor: string;
  systemStatus: 'healthy' | 'degraded' | 'failed' | 'simulating';
}

export default function TopologyMap({ activeActor, systemStatus }: TopologyMapProps) {
  const actors = [
    { id: 'Client', label: 'Client Gateway', icon: Network, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { id: 'API Proxy', label: 'Rust API Proxy', icon: ShieldAlert, color: 'text-purple-600 bg-purple-50 border-purple-200' },
    { id: 'Redis Lock Gate', label: 'Redis Lock Gate', icon: Database, color: 'text-rose-600 bg-rose-50 border-rose-200' },
    { id: 'Worker VM', label: 'Worker Knative VM', icon: Cpu, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { id: 'Audit Logger', label: 'Telemetry Auditing', icon: FileText, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  ];

  const getSystemPulseColor = () => {
    switch (systemStatus) {
      case 'healthy':
        return 'bg-emerald-500 shadow-emerald-200';
      case 'degraded':
        return 'bg-amber-500 shadow-amber-200 animate-pulse';
      case 'failed':
        return 'bg-rose-500 shadow-rose-200 animate-ping';
      case 'simulating':
        return 'bg-blue-600 shadow-blue-200 animate-pulse';
      default:
        return 'bg-slate-400';
    }
  };

  return (
    <div id="system-topology-map" className="border border-slate-100 rounded-xl bg-slate-50/50 p-6 shadow-sm overflow-hidden relative">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display font-medium text-slate-800 text-sm tracking-tight">Active Topology Vector</h3>
          <p className="text-[11px] text-slate-500 font-mono">Routing Path and Node Interaction Mapping</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-block w-2.5 h-2.5 rounded-full ${getSystemPulseColor()} shadow`} />
          <span className="text-[11px] font-mono text-slate-600 capitalize">System: {systemStatus}</span>
        </div>
      </div>

      {/* Connection SVG lines behind */}
      <div className="relative grid grid-cols-5 gap-4 items-center justify-center">
        {/* SVG background overlay for connections */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <svg className="w-full h-full" style={{ minHeight: '80px' }}>
            <defs>
              <linearGradient id="blue-purple" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0.4" />
              </linearGradient>
              <linearGradient id="purple-rose" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.4" />
              </linearGradient>
              <linearGradient id="rose-amber" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.4" />
              </linearGradient>
              <linearGradient id="amber-emerald" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.4" />
              </linearGradient>
            </defs>
            {/* Draw connectors */}
            <path d="M 10%,50 L 90%,50" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-200" />
            
            {/* Pulsing signal dot based on state */}
            {activeActor && (
              <circle
                r="4"
                className="fill-blue-500 animate-pulse"
                style={{
                  cx: activeActor === 'Client' ? '10%' :
                      activeActor === 'API Proxy' ? '30%' :
                      activeActor === 'Redis Lock Gate' ? '50%' :
                      activeActor === 'Worker VM' ? '70%' : '90%',
                  cy: '50',
                  transition: 'cx 0.4s ease-in-out'
                }}
              />
            )}
          </svg>
        </div>

        {actors.map((actor, idx) => {
          const isActive = activeActor === actor.id;
          const ActorIcon = actor.icon;
          return (
            <div
              key={actor.id}
              id={`topology-actor-${actor.id}`}
              className={`z-10 flex flex-col items-center text-center transition-all duration-300 ${
                isActive ? 'scale-105 filter drop-shadow-md' : 'opacity-60 grayscale-[30%] hover:opacity-90'
              }`}
            >
              <div key={actor.id + '-badge'} className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 transition-all duration-300 ${
                isActive ? 'border-indigo-600 bg-white ring-4 ring-indigo-50 text-indigo-700' : actor.color
              }`}>
                <ActorIcon className="w-5 h-5" />
              </div>
              <span className={`mt-2.5 text-[11px] font-medium tracking-tight ${
                isActive ? 'text-indigo-950 font-semibold' : 'text-slate-600'
              }`}>
                {actor.label}
              </span>
              <span className="text-[9px] font-mono mt-0.5 text-slate-400 uppercase">
                Node [0{idx + 1}]
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-5 border-t border-slate-100 pt-3 flex flex-wrap gap-2.5 items-center justify-between text-[11px] font-mono text-slate-500">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> API Entry Socket: 3000
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Handshake Protocol: TCP Async
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Validation Engine: IEEE 754
        </span>
      </div>
    </div>
  );
}

