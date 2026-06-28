"use client";

import React, { useState } from 'react';
import { LedgerBlock, NotificationLog } from '@/components/fault-matrix/types';
import GridSimulator from '@/components/fault-matrix/GridSimulator';
import AnomalyDetector from '@/components/fault-matrix/AnomalyDetector';
import AlertSystem from '@/components/fault-matrix/AlertSystem';
import LedgerViewer from '@/components/fault-matrix/LedgerViewer';
import CarbonController from '@/components/fault-matrix/CarbonController';
import { Layers, Activity, Bell, Shield, Leaf, HeartPulse } from 'lucide-react';
import Shell from "@/components/Shell";
import { ModuleHeader } from "@/components/telemetry";

export default function FaultMatrixPage() {
  const [activeTab, setActiveTab] = useState<'pathfinder' | 'anomaly' | 'alerts' | 'ledger' | 'carbon'>('pathfinder');
  
  // Historical Pre-Seeded Ledger Blocks
  const [ledger, setLedger] = useState<LedgerBlock[]>([
    {
      blockNumber: 84281382,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      txHash: "5v6F8pTxUdBwMy9e28d5ecd23e4f406b03de43890z8b9n",
      eventType: 'PROOF',
      agentId: "AGT-001",
      action: "Verify little-endian IEEE-754 serialization",
      gasPaidLamports: 5000,
      pdaAddress: "PDA_OOBE_SEED_01_little_endian",
      memo: "Validated little-endian IEEE-754 bytes to prevent heterogeneous ARM64 / x86-64 float drift",
      replayable: true
    },
    {
      blockNumber: 84281381,
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      txHash: "9z4ff866c7d1bc132bcb01ce817ed6c3d24440c23d3a",
      eventType: 'AUTHORITY',
      agentId: "AGT-004",
      action: "Configure MCP boundary permissions",
      gasPaidLamports: 5000,
      pdaAddress: "PDA_OOBE_BOUND_04_mcp",
      memo: "Affirmed L4 semantic tool invocation credentials hidden from the probabilistic reasoning plane",
      replayable: true
    },
    {
      blockNumber: 84281380,
      timestamp: new Date(Date.now() - 10800000).toISOString(),
      txHash: "3ddf9be5c28fe27dad143a5dc76eea25222ad1dd68934",
      eventType: 'IDENTITY',
      agentId: "AGT-102",
      action: "Registered sovereign OOBE client node",
      gasPaidLamports: 10000,
      pdaAddress: "PDA_OOBE_CLIENT_102_sovereign",
      memo: "Dispatched sovereign identity marker verifying planning & context loading limits",
      replayable: true
    }
  ]);

  const [notificationLog, setNotificationLog] = useState<NotificationLog[]>([]);

  // Consolidated real-time Telemetry metrics shared across components
  const [telemetry, setTelemetry] = useState<Record<string, { value: number; unit: string }>>({
    "Pathfinding Compute Load": { value: 0, unit: "Hz" },
    "Active System Thread Locks": { value: 0, unit: "Units" },
    "Active Cell Compute Latency": { value: 48, unit: "ms" },
    "Gradient Deviation Magnitude": { value: 12, unit: "mRad" },
    "Regional Grid Intensity": { value: 15, unit: "gCO2/kWh" },
    "Outbound Energy Footprint": { value: 0, unit: "mJ" },
    "Telemetry Stream Accuracy": { value: 100, unit: "%" },
    "Veklom Network Response Delay": { value: 48, unit: "ms" }
  });

  const handleAppendLedger = (eventType: string, action: string, memo: string, agentId: string = "SYS-000") => {
    const nextBlockNum = (ledger[0]?.blockNumber || 84281382) + 1;
    const randomHex = () => Math.random().toString(16).substring(2, 10);
    const txHash = `${randomHex()}${randomHex()}${randomHex()}${randomHex()}`;
    const pdaAddress = `pda_seed_${eventType.toLowerCase()}_${Math.random().toString(36).substring(2, 8)}`;

    const newBlock: LedgerBlock = {
      blockNumber: nextBlockNum,
      timestamp: new Date().toISOString(),
      txHash,
      eventType,
      agentId,
      action,
      gasPaidLamports: 5000,
      pdaAddress,
      memo,
      replayable: true
    };

    setLedger(prev => [newBlock, ...prev]);
  };

  const handleStateUpdate = (resourceName: string, value: number, unit: string) => {
    setTelemetry(prev => ({
      ...prev,
      [resourceName]: { value, unit }
    }));
  };

  const handleTriggerRealtimeNotification = (title: string, message: string, payload: object) => {
    const id = `NTF-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const timestamp = new Date().toISOString();
    
    const log: NotificationLog = {
      id,
      timestamp,
      type: "ANOMALY_TRIGGERED",
      message: `${title}: ${message}`,
      payload: JSON.stringify(payload, null, 2),
      status: 'delivered'
    };

    setNotificationLog(prev => [log, ...prev].slice(0, 15));
  };

  return (
    <Shell>
      <ModuleHeader
        breadcrumb="Operations · Fault Matrix"
        title="Agentic Authority Runtime"
        subtitle="Monitor grid routing, inject probabilistic faults, and audit the sovereign ledger."
      />
      
      <div className="bg-[#05070a] text-slate-300 font-sans antialiased rounded-xl overflow-hidden border border-cyan-500/20">
        <main className="w-full flex flex-col gap-6 p-6">
          
          {/* Global Live Telemetry Stream Grid (Top HUD) */}
          <section className="bg-[#0a0c14]/90 border border-cyan-500/20 p-4 rounded-xl shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/2 to-transparent pointer-events-none"></div>
            <div className="flex items-center gap-2 mb-3 relative z-10">
              <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold">
                Live Substrate Telemetry Stream
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 relative z-10">
              {Object.entries(telemetry).map(([key, value]) => {
                let metricColor = "text-white";
                if (key.includes("Response Delay") && value.value > 150) metricColor = "text-amber-400 animate-pulse";
                else if (key.includes("Stream Accuracy") && value.value < 50) metricColor = "text-red-400 animate-pulse";
                else if (value.value > 0 && typeof value.value === "number") metricColor = "text-cyan-400";

                return (
                  <div key={key} className="bg-[#0d1117] p-2.5 rounded-lg border border-slate-800/80 font-mono text-xs hover:border-cyan-500/20 transition-all">
                    <span className="text-[9px] text-slate-500 block truncate uppercase tracking-wider">{key}</span>
                    <span className={`text-sm font-bold block mt-1 ${metricColor}`}>
                      {value.value.toLocaleString(undefined, { maximumFractionDigits: 1 })} <span className="text-[9px] font-normal text-slate-500">{value.unit}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Navigation Tabs Bar */}
          <nav className="flex overflow-x-auto bg-[#0a0c14] p-1.5 rounded-xl border border-cyan-500/20 gap-2 custom-scroll max-w-full">
            <button
              onClick={() => setActiveTab('pathfinder')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-mono font-semibold tracking-wider uppercase transition-all whitespace-nowrap cursor-pointer border ${
                activeTab === 'pathfinder' 
                  ? 'bg-[#0d1117] text-cyan-400 border-cyan-500/30 font-bold shadow-[0_0_12px_rgba(34,211,238,0.15)] animate-pulse' 
                  : 'text-slate-400 border-transparent hover:text-cyan-300 hover:bg-cyan-950/10'
              }`}
            >
              <Layers className="w-4 h-4" /> 🚧 OOBE Substrate Runbook
            </button>
            <button
              onClick={() => setActiveTab('anomaly')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-mono font-semibold tracking-wider uppercase transition-all whitespace-nowrap cursor-pointer border ${
                activeTab === 'anomaly' 
                  ? 'bg-[#0d1117] text-cyan-400 border-cyan-500/30 font-bold shadow-[0_0_12px_rgba(34,211,238,0.15)] animate-pulse' 
                  : 'text-slate-400 border-transparent hover:text-cyan-300 hover:bg-cyan-950/10'
              }`}
            >
              <Activity className="w-4 h-4" /> 📈 Probabilistic Anomaly Monitor
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-mono font-semibold tracking-wider uppercase transition-all whitespace-nowrap cursor-pointer border ${
                activeTab === 'alerts' 
                  ? 'bg-[#0d1117] text-cyan-400 border-cyan-500/30 font-bold shadow-[0_0_12px_rgba(34,211,238,0.15)]' 
                  : 'text-slate-400 border-transparent hover:text-cyan-300 hover:bg-cyan-950/10'
              }`}
            >
              <Bell className="w-4 h-4" /> 🔔 Real-Time Notice Engine
            </button>
            <button
              onClick={() => setActiveTab('ledger')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-mono font-semibold tracking-wider uppercase transition-all whitespace-nowrap cursor-pointer border ${
                activeTab === 'ledger' 
                  ? 'bg-[#0d1117] text-cyan-400 border-cyan-500/30 font-bold shadow-[0_0_12px_rgba(34,211,238,0.15)] animate-pulse' 
                  : 'text-slate-400 border-transparent hover:text-cyan-300 hover:bg-cyan-950/10'
              }`}
            >
              <Shield className="w-4 h-4" /> ⛓️ Sovereign Auditing Ledger
            </button>
            <button
              onClick={() => setActiveTab('carbon')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-mono font-semibold tracking-wider uppercase transition-all whitespace-nowrap cursor-pointer border ${
                activeTab === 'carbon' 
                  ? 'bg-[#0d1117] text-cyan-400 border-cyan-500/30 font-bold shadow-[0_0_12px_rgba(34,211,238,0.15)]' 
                  : 'text-slate-400 border-transparent hover:text-cyan-300 hover:bg-cyan-950/10'
              }`}
            >
              <Leaf className="w-4 h-4" /> 🌿 CALB Green Controller
            </button>
          </nav>

          {/* Tab Modules Routing Hub */}
          <section className="flex-1 w-full relative">
            
            <div className={`${activeTab === 'pathfinder' ? 'block animate-fade-in' : 'hidden'}`}>
              <GridSimulator 
                onAppendLedger={handleAppendLedger} 
                onStateUpdate={handleStateUpdate} 
              />
            </div>

            <div className={`${activeTab === 'anomaly' ? 'block animate-fade-in' : 'hidden'}`}>
              <AnomalyDetector 
                onAppendLedger={handleAppendLedger} 
                onStateUpdate={handleStateUpdate}
                onTriggerRealtimeNotification={handleTriggerRealtimeNotification}
              />
            </div>

            <div className={`${activeTab === 'alerts' ? 'block animate-fade-in' : 'hidden'}`}>
              <AlertSystem 
                onAppendLedger={handleAppendLedger} 
                onStateUpdate={handleStateUpdate}
                notificationLog={notificationLog}
                setNotificationLog={setNotificationLog}
              />
            </div>

            <div className={`${activeTab === 'ledger' ? 'block animate-fade-in' : 'hidden'}`}>
              <LedgerViewer 
                ledger={ledger} 
                onAppendLedger={handleAppendLedger} 
              />
            </div>

            <div className={`${activeTab === 'carbon' ? 'block animate-fade-in' : 'hidden'}`}>
              <CarbonController 
                onAppendLedger={handleAppendLedger} 
                onStateUpdate={handleStateUpdate} 
              />
            </div>

          </section>
        </main>
      </div>
    </Shell>
  );
}
