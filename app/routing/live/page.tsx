// @ts-nocheck
"use client";
import React, { useState, useEffect } from 'react';
import { FAULT_MATRIX_DATA } from './data';
import MatrixTable from './components/MatrixTable';
import SimulationWorkspace from './components/SimulationWorkspace';
import ConsoleTerminal from './components/ConsoleTerminal';
import { ShieldCheck, HardDrive, Cpu, Activity, Clock, ShieldX, Flame } from 'lucide-react';

export default function App() {
  const [selectedEventId, setSelectedEventId] = useState<string>(FAULT_MATRIX_DATA[0].id);
  const [logs, setLogs] = useState<string[]>([]);
  const [utcTime, setUtcTime] = useState<string>('');

  // Find active failure event object
  const activeEvent = FAULT_MATRIX_DATA.find(e => e.id === selectedEventId) || FAULT_MATRIX_DATA[0];

  // Initialize status logs and UTC Clock
  useEffect(() => {
    // Elegant real-time clock representing system accuracy
    const timer = setInterval(() => {
      const now = new Date();
      setUtcTime(now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    }, 1000);

    const initialLogs = [
      `[${new Date().toLocaleTimeString()}] >> INITIAL STATUS: Gradient Field Routing Kernel initialized successfully.`,
      `[${new Date().toLocaleTimeString()}] >> SYSTEM: Standby Router cluster connected via secure TLS link on port 3000.`,
      `[${new Date().toLocaleTimeString()}] >> SYSTEM: Telemetry buffer set to routing_idempotency_ttl=5s.`,
      `[${new Date().toLocaleTimeString()}] >> VERIFY: Float math packed structures verified against IEEE 754 standards.`
    ];
    setLogs(initialLogs);

    return () => clearInterval(timer);
  }, []);

  const handleEmitLogs = (newLogs: string[]) => {
    setLogs(prev => [...prev, ...newLogs]);
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  const triggerChaosInjectionSweep = () => {
    onClearLogsAndInject();
  };

  const onClearLogsAndInject = () => {
    setLogs([
      `[${new Date().toLocaleTimeString()}] ⚠ DISPATCHER ACTIONS: Initiating Chaos Injection Sweep across all 5 failover matrices...`,
      `[${new Date().toLocaleTimeString()}] [CHAOS-INJECT] Simulating concurrency surges. Loading worker registers...`,
      `[${new Date().toLocaleTimeString()}] [WORKER] Host CPU page-fault threshold breached. Scheduling queue retries.`,
      `[${new Date().toLocaleTimeString()}] [REDIS] Injecting socket latency. Connection pool timeouts triggered.`,
      `[${new Date().toLocaleTimeString()}] [SERIALIZATION] Asserting cross-platform double compliance. Checked pack structures.`,
      `[${new Date().toLocaleTimeString()}] SUMMARY: Chaos completed gracefully. Standard mitigation loops withstood total load. System overall state remain NOMINAL. [Secured]`
    ]);
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-800 font-sans flex flex-col antialiased">
      
      {/* Top Professional Header Banner */}
      <header className="border-b border-slate-100 bg-white shadow-xs px-6 py-4 flex flex-col sm:flex-row gap-4 items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-md shadow-indigo-100 shrink-0">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-semibold text-lg text-slate-900 tracking-tight">
                Gradient Field Routing Fault Matrix
              </h1>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded-full font-mono font-medium flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-emerald-500" />
                Active Runbook
              </span>
            </div>
            <p className="text-xs text-slate-500 tracking-normal">
              Interactive sandbox simulating routing engine deterministic behaviors under cluster degradation events.
            </p>
          </div>
        </div>

        {/* System metrics tags */}
        <div className="flex flex-wrap items-center gap-4.5 text-xs font-mono">
          <div className="hidden md:flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[11px] text-slate-600 font-semibold">{utcTime || 'Synchronization...'}</span>
          </div>

          <button
            onClick={triggerChaosInjectionSweep}
            id="btn-chaos-injection"
            className="flex items-center gap-1.5 py-1.5 px-3.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-100 text-[11px] rounded-lg font-semibold font-mono transition-colors cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5 animate-bounce" />
            <span>Chaos Sweep</span>
          </button>
        </div>
      </header>

      {/* Main Core View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Core System Resiliency Widgets / SLA stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Router Resilience</p>
              <h3 className="font-display font-semibold text-sm text-slate-800">99.98% Compliant</h3>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Distributed Lock</p>
              <h3 className="font-display font-semibold text-sm text-slate-800">LUA_COMPLETE_MATCH</h3>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Byte Alignment</p>
              <h3 className="font-display font-semibold text-sm text-slate-800">IEEE 754 Double</h3>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Failover Speed</p>
              <h3 className="font-display font-semibold text-sm text-slate-800">Instant Async-Recycle</h3>
            </div>
          </div>
        </div>

        {/* Dashboard 2-Column Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Fault Matrix Card Index */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
              <MatrixTable
                events={FAULT_MATRIX_DATA}
                selectedEventId={selectedEventId}
                onSelectEvent={setSelectedEventId}
              />
            </div>
            
            {/* Short Helpful Guidance Tips */}
            <div className="border border-slate-100 bg-white rounded-xl p-5 shadow-sm space-y-3">
              <h4 className="font-display font-semibold text-xs text-slate-800">Runbook Instructions</h4>
              <ul className="text-[11px] text-slate-500 space-y-2 list-disc pl-4 leading-relaxed">
                <li>Choose a specific cluster degradation scenario on the left panel.</li>
                <li>Tune the failure parameters using the sliders under <strong>Parametric Controls</strong> to simulate various system thresholds.</li>
                <li>Press <strong>Runbook Simulation</strong> to step through the automated incident recovery logic live.</li>
                <li>Monitor stdout telemetry inside the real-time Console down below to review response packages.</li>
              </ul>
            </div>
          </div>

          {/* Right Column - Workstage and Topology */}
          <div className="lg:col-span-2 space-y-6">
            <SimulationWorkspace
              event={activeEvent}
              onEmitLogs={handleEmitLogs}
              onClearLogs={handleClearLogs}
            />
          </div>
        </div>

        {/* Full-width System Console Log Terminal */}
        <div className="pt-2">
          <ConsoleTerminal
            logs={logs}
            onClear={handleClearLogs}
          />
        </div>
      </main>

      {/* Modern Humble Footer */}
      <footer className="border-t border-slate-100 bg-white py-4 px-6 text-center text-xs text-slate-400 font-mono mt-auto flex flex-col md:flex-row gap-2.5 items-center justify-between">
        <span>Systems Integrity Auditing Framework</span>
        <span>Standard ISO/IEC IEEE 754 Compiler Compliant Layout</span>
      </footer>

    </div>
  );
}

