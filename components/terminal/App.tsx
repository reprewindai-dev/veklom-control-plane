/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
"use client";

import React, { useState, useEffect } from 'react';
import { controlStore } from './data/simulation';
import { AgentNode, VeklomRun, Delegate, TelemetryTick } from './types';
import Sidebar from './components/Sidebar';
import SwarmMap from './components/SwarmMap';
import RunSpine from './components/RunSpine';
import CouncilMatrix from './components/CouncilMatrix';
import DataGrid from './components/DataGrid';
import LiveTelemetry from './components/LiveTelemetry';
import { Radio, Flame, Cpu, Gauge, AlertOctagon } from 'lucide-react';

export default function App() {
  // Primary Navigation State
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Real-time ticking UTC clock for Geometric Balance theme
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const pad = (num: number) => String(num).padStart(2, '0');
      setCurrentTime(`${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())} UTC`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Local Reactive State mirroring our central control simulation store
  const [agents, setAgents] = useState<AgentNode[]>([]);
  const [runs, setRuns] = useState<VeklomRun[]>([]);
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [logs, setLogs] = useState<TelemetryTick[]>([]);
  const [liveMetrics, setLiveMetrics] = useState(controlStore.liveMetrics);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  // Sync to simulation ticks
  useEffect(() => {
    // Initial load
    setAgents([...controlStore.agents]);
    setRuns([...controlStore.runs]);
    setDelegates([...controlStore.delegates]);
    setLogs([...controlStore.logs]);
    setLiveMetrics({ ...controlStore.liveMetrics });

    // Trigger the live PGL handshake immediately on boot!
    controlStore.initializeFromHandshake();

    // Subscribe to periodic simulation dispatch intervals (WebSockets mock)
    const unsubscribe = controlStore.subscribe(() => {
      setAgents([...controlStore.agents]);
      setRuns([...controlStore.runs]);
      setDelegates([...controlStore.delegates]);
      setLogs([...controlStore.logs]);
      setLiveMetrics({ ...controlStore.liveMetrics });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Update a single agent properties (Reboot / Diagnostics actions)
  const handleAgentUpdate = (id: string, updatedFields: Partial<AgentNode>) => {
    controlStore.agents = controlStore.agents.map(a => {
      if (a.id === id) {
        return { ...a, ...updatedFields };
      }
      return a;
    });
    setAgents([...controlStore.agents]);
  };

  // Propose standard motion on the Legislative Matrix
  const handleVotePropose = (proposalName: string) => {
    // Shift votes of delegates on proposals
    controlStore.delegates = controlStore.delegates.map((d, index) => {
      // Create random distribution of yes/no/abstain represents weight shifts
      const options: ('yea' | 'nay' | 'abstain' | 'pending')[] = ['yea', 'yea', 'yea', 'yea', 'nay', 'abstain'];
      const nextVote = options[Math.floor(Math.random() * options.length)];
      return {
        ...d,
        vote: nextVote as any,
        weight: Math.floor(Math.random() * 15) + 10 // Shift weights slightly
      };
    });

    controlStore.logs.unshift({
      timestamp: new Date().toISOString(),
      source: 'Council',
      message: `LEGISLATURE: Motion initiated. Recalculating representative weights.`,
      type: 'warn'
    });
  };

  // Handle high priority manual execution injection
  const handleTriggerManualOverride = async (intentText: string, policyText: string) => {
    const newRun = await controlStore.triggerManualRun(intentText, policyText);
    setSelectedRunId(newRun.id);
    setActiveTab('spine'); // Shift view to spine to show live lock progression!
  };

  return (
    <div className="w-screen h-screen bg-[#030303] text-white/90 overflow-hidden flex flex-col font-sans border-4 border-[#0A0A0C] relative">
      
      {/* 1. Futuristic Scanline CRT overlay for cinematic feel */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-electric-cyan/2 w-full animate-scanline pointer-events-none z-50" />
      
      {/* Top Navigation Bar */}
      <header className="h-12 border-b border-white/10 flex items-center justify-between px-4 bg-black/40 backdrop-blur-md z-50 shrink-0 select-none">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#00E5FF] shadow-[0_0_8px_#00E5FF]"></div>
            <span className="text-xs font-bold tracking-[0.2em] uppercase">UACP v5 Control Plane</span>
          </div>
          <div className="h-4 w-px bg-white/20"></div>
          <div className="flex items-center gap-4 font-mono text-[10px] text-white/50 bg-black/50 px-2 py-1 rounded border border-white/10">
            <span className="text-white/30">CAPI_NODE:</span>
            <select 
              className="bg-transparent text-white/80 outline-none cursor-pointer hover:text-white transition-colors"
              onChange={(e) => {
                import('./data/pglLoader').then(m => m.setCapiBaseUrl(e.target.value));
              }}
              defaultValue="https://api.veklom.com"
            >
              <option value="https://api.veklom.com" className="bg-black text-white">Backend Core 1 (api.veklom.com)</option>
              <option value="https://cappo.veklom.com" className="bg-black text-white">Backend Core 2 (cappo-backend)</option>
              <option value="https://veklom-id-59uw.vercel.app" className="bg-black text-white">Edge Instance 1 (veklom-id)</option>
              <option value="https://mcpapi.vercel.app" className="bg-black text-white">Edge Instance 2 (mcpapi)</option>
            </select>
            <div className="w-px h-3 bg-white/20"></div>
            <span>LATENCY: 4MS</span>
            <span className="text-[#00FF66]">OS_HEALTH: 100%</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[9px] text-white/40 leading-none uppercase">ARBITEROS STATUS</div>
              <div className="text-[10px] font-mono text-[#00FF66] uppercase">ENFORCING / MODE_01</div>
            </div>
            <div className="w-24 h-1.5 bg-white/10 overflow-hidden">
              <div className="w-3/4 h-full bg-[#00FF66] shadow-[0_0_4px_#00FF66]"></div>
            </div>
          </div>
          <div className="text-xs font-mono tabular-nums text-white/70">{currentTime}</div>
        </div>
      </header>

      {/* Main Content Split Frame */}
      <div className="flex-grow flex overflow-hidden relative">
        {/* 2. Primary Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          mcpHeartbeat={liveMetrics.mcpIOHeartbeat}
          throughput={liveMetrics.throughput}
          agentsCount={agents.length}
        />

        {/* 3. Central Application Viewport */}
        <main className="flex-grow flex flex-col justify-between overflow-y-auto overflow-x-hidden relative min-w-0 border-l border-white/5">
          
          {/* VIEW CONTAINER */}
          <div className="flex-grow overflow-y-auto overflow-x-hidden relative bg-[#030303]">
            {activeTab === 'overview' && (
              <SwarmMap 
                agents={agents} 
                onAgentUpdate={handleAgentUpdate}
              />
            )}

            {activeTab === 'spine' && (
              <RunSpine 
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
"use client";

import React, { useState, useEffect } from 'react';
import { controlStore } from './data/simulation';
import { AgentNode, VeklomRun, Delegate, TelemetryTick } from './types';
import Sidebar from './components/Sidebar';
import SwarmMap from './components/SwarmMap';
import RunSpine from './components/RunSpine';
import CouncilMatrix from './components/CouncilMatrix';
import DataGrid from './components/DataGrid';
import LiveTelemetry from './components/LiveTelemetry';
import { Radio, Flame, Cpu, Gauge, AlertOctagon } from 'lucide-react';

export default function App() {
  // Primary Navigation State
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Real-time ticking UTC clock for Geometric Balance theme
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const pad = (num: number) => String(num).padStart(2, '0');
      setCurrentTime(`${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())} UTC`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Local Reactive State mirroring our central control simulation store
  const [agents, setAgents] = useState<AgentNode[]>([]);
  const [runs, setRuns] = useState<VeklomRun[]>([]);
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [logs, setLogs] = useState<TelemetryTick[]>([]);
  const [liveMetrics, setLiveMetrics] = useState(controlStore.liveMetrics);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  // Sync to simulation ticks
  useEffect(() => {
    // Initial load
    setAgents([...controlStore.agents]);
    setRuns([...controlStore.runs]);
    setDelegates([...controlStore.delegates]);
    setLogs([...controlStore.logs]);
    setLiveMetrics({ ...controlStore.liveMetrics });

    // Trigger the live PGL handshake immediately on boot!
    controlStore.initializeFromHandshake();

    // Subscribe to periodic simulation dispatch intervals (WebSockets mock)
    const unsubscribe = controlStore.subscribe(() => {
      setAgents([...controlStore.agents]);
      setRuns([...controlStore.runs]);
      setDelegates([...controlStore.delegates]);
      setLogs([...controlStore.logs]);
      setLiveMetrics({ ...controlStore.liveMetrics });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Update a single agent properties (Reboot / Diagnostics actions)
  const handleAgentUpdate = (id: string, updatedFields: Partial<AgentNode>) => {
    controlStore.agents = controlStore.agents.map(a => {
      if (a.id === id) {
        return { ...a, ...updatedFields };
      }
      return a;
    });
    setAgents([...controlStore.agents]);
  };

  // Propose standard motion on the Legislative Matrix
  const handleVotePropose = (proposalName: string) => {
    // Shift votes of delegates on proposals
    controlStore.delegates = controlStore.delegates.map((d, index) => {
      // Create random distribution of yes/no/abstain represents weight shifts
      const options: ('yea' | 'nay' | 'abstain' | 'pending')[] = ['yea', 'yea', 'yea', 'yea', 'nay', 'abstain'];
      const nextVote = options[Math.floor(Math.random() * options.length)];
      return {
        ...d,
        vote: nextVote as any,
        weight: Math.floor(Math.random() * 15) + 10 // Shift weights slightly
      };
    });

    controlStore.logs.unshift({
      timestamp: new Date().toISOString(),
      source: 'Council',
      message: `LEGISLATURE: Motion initiated. Recalculating representative weights.`,
      type: 'warn'
    });
  };

  // Handle high priority manual execution injection
  const handleTriggerManualOverride = async (intentText: string, policyText: string) => {
    const newRun = await controlStore.triggerManualRun(intentText, policyText);
    setSelectedRunId(newRun.id);
    setActiveTab('spine'); // Shift view to spine to show live lock progression!
  };

  return (
    <div className="w-screen h-screen bg-[#030303] text-white/90 overflow-hidden flex flex-col font-sans border-4 border-[#0A0A0C] relative">
      
      {/* 1. Futuristic Scanline CRT overlay for cinematic feel */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-electric-cyan/2 w-full animate-scanline pointer-events-none z-50" />
      
      {/* Top Navigation Bar */}
      <header className="h-12 border-b border-white/10 flex items-center justify-between px-4 bg-black/40 backdrop-blur-md z-50 shrink-0 select-none">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#00E5FF] shadow-[0_0_8px_#00E5FF]"></div>
            <span className="text-xs font-bold tracking-[0.2em] uppercase">UACP v5 Control Plane</span>
          </div>
          <div className="h-4 w-px bg-white/20"></div>
          <div className="flex items-center gap-4 font-mono text-[10px] text-white/50 bg-black/50 px-2 py-1 rounded border border-white/10">
            <span className="text-white/30">CAPI_NODE:</span>
            <select 
              className="bg-transparent text-white/80 outline-none cursor-pointer hover:text-white transition-colors"
              onChange={(e) => {
                import('./data/pglLoader').then(m => m.setCapiBaseUrl(e.target.value));
              }}
              defaultValue="https://api.veklom.com"
            >
              <option value="https://api.veklom.com" className="bg-black text-white">Backend Core 1 (api.veklom.com)</option>
              <option value="https://cappo.veklom.com" className="bg-black text-white">Backend Core 2 (cappo-backend)</option>
              <option value="https://veklom-id-59uw.vercel.app" className="bg-black text-white">Edge Instance 1 (veklom-id)</option>
              <option value="https://mcpapi.vercel.app" className="bg-black text-white">Edge Instance 2 (mcpapi)</option>
            </select>
            <div className="w-px h-3 bg-white/20"></div>
            <span>LATENCY: 4MS</span>
            <span className="text-[#00FF66]">OS_HEALTH: 100%</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[9px] text-white/40 leading-none uppercase">ARBITEROS STATUS</div>
              <div className="text-[10px] font-mono text-[#00FF66] uppercase">ENFORCING / MODE_01</div>
            </div>
            <div className="w-24 h-1.5 bg-white/10 overflow-hidden">
              <div className="w-3/4 h-full bg-[#00FF66] shadow-[0_0_4px_#00FF66]"></div>
            </div>
          </div>
          <div className="text-xs font-mono tabular-nums text-white/70">{currentTime}</div>
        </div>
      </header>

      {/* Main Content Split Frame */}
      <div className="flex-grow flex overflow-hidden relative">
        {/* 2. Primary Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          mcpHeartbeat={liveMetrics.mcpIOHeartbeat}
          throughput={liveMetrics.throughput}
          agentsCount={agents.length}
        />

        {/* 3. Central Application Viewport */}
        <main className="flex-grow flex flex-col justify-between overflow-y-auto overflow-x-hidden relative min-w-0 border-l border-white/5">
          
          {/* VIEW CONTAINER */}
          <div className="flex-grow overflow-y-auto overflow-x-hidden relative bg-[#030303]">
            {activeTab === 'overview' && (
              <SwarmMap 
                agents={agents} 
                onAgentUpdate={handleAgentUpdate}
              />
            )}

            {activeTab === 'spine' && (
              <RunSpine 
                runs={runs}
                selectedRunId={selectedRunId}
                onSelectRun={setSelectedRunId}
              />
            )}

            {activeTab === 'runs' && (
              <DataGrid 
                runs={runs}
              />
            )}

            {activeTab === 'committee' && (
              <CouncilMatrix 
                delegates={delegates}
                onVotePropose={handleVotePropose}
              />
            )}
          </div>

          {/* 4. Live Telemetry Console Ticker */}
          <div className="h-48 border-t border-white/[0.05] bg-[#030303] shrink-0 relative z-10 select-none">
            <LiveTelemetry
              logs={logs}
              metrics={liveMetrics}
              onTriggerManualOverride={handleTriggerManualOverride}
            />
          </div>

        </main>
      </div>

      {/* System Footer Bar */}
      <footer className="h-6 border-t border-white/10 bg-black flex items-center justify-between px-4 text-[9px] font-mono text-white/30 shrink-0 select-none">
        <div className="flex gap-4">
          <span>ENCRYPT: TLS_1.3_CHACHA20_POLY1305</span>
          <span>SESSION: B82-ALPHA-77</span>
        </div>
        <div className="flex gap-4">
          <span className="text-[#00FF66]">● UACP_CORE_UP</span>
          <span className="text-[#00E5FF]">● MCP_BUS_CONNECTED</span>
        </div>
      </footer>

    </div>
  );
}
