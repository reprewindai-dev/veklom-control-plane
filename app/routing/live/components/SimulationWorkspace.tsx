// @ts-nocheck
"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Sliders, ShieldX, CheckCircle, Radio, Settings, AlertTriangle, ShieldCheck, Clock, ExternalLink } from 'lucide-react';
import { FailureEvent, FaultParameter, SimulationStep } from '../types';
import TopologyMap from './TopologyMap';

interface SimulationWorkspaceProps {
  event: FailureEvent;
  onEmitLogs: (newLogs: string[]) => void;
  onClearLogs: () => void;
}

export default function SimulationWorkspace({ event, onEmitLogs, onClearLogs }: SimulationWorkspaceProps) {
  const [params, setParams] = useState<FaultParameter[]>(event.parameters);
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1800); // ms per step
  const [activeActor, setActiveActor] = useState<string>('Client');
  const timerRef = useRef<any>(null);

  // Sync parameter presets when selected failure mode changes
  useEffect(() => {
    setParams(event.parameters);
    stopSimulation();
    setCurrentStep(-1);
    setActiveActor('Client');
  }, [event]);

  const handleParamChange = (id: string, value: any) => {
    setParams(prev => prev.map(p => p.id === id ? { ...p, value } : p));
    
    // Add real-time tuning log
    const param = params.find(p => p.id === id);
    if (param) {
      const displayVal = typeof value === 'boolean' ? (value ? 'ENABLED' : 'DISABLED') : `${value}${param.unit || ''}`;
      onEmitLogs([`[${new Date().toLocaleTimeString()}] TUNING: System param \`${param.name}\` dynamically scaled to ${displayVal}.`]);
    }
  };

  const stopSimulation = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsSimulating(false);
  };

  const startSimulation = () => {
    stopSimulation();
    setCurrentStep(0);
    setIsSimulating(true);
    
    onClearLogs();
    onEmitLogs([
      `>> INITIALIZING RUNBOOK SCENARIO: ${event.name.toUpperCase()} <<`,
      `[CONFIG] Triggering fault path inside ${event.componentAffected}...`,
      `[CONFIG] Security Model: ${event.lockType} | Standby Threshold: ${event.recoveryTtl}`
    ]);
  };

  const stepThroughSimulation = () => {
    if (currentStep < 0 || currentStep >= event.scenarioSteps.length) {
      stopSimulation();
      return;
    }

    const step = event.scenarioSteps[currentStep];
    setActiveActor(step.actor);

    // Build real-time customized logs incorporating parameter selections
    let logMessage = step.description;
    
    // Inject dynamic parameter values into simulation descriptions
    if (event.id === 'worker-compute-lag') {
      const lag = params.find(p => p.id === 'lag-duration')?.value || 12000;
      const ttl = params.find(p => p.id === 'idempotency-ttl')?.value || 5;
      
      if (step.id === 2) {
        logMessage = `Worker VM 01 enters expensive computation thread. Simulated cycle clock configured to reach ${lag}ms.`;
      } else if (step.id === 3) {
        logMessage = `Compute duration of Worker VM 01 (${lag}ms) surpasses hard limits set by ROUTING_IDEMPOTENCY_TTL_SECONDS (${ttl}s). Redis drops lock key.`;
      }
    } else if (event.id === 'redis-node-outage') {
      const timeout = params.find(p => p.id === 'connection-timeout')?.value || 1500;
      const retries = params.find(p => p.id === 'retry-attempts')?.value || 3;
      
      if (step.id === 2) {
        logMessage = `Proxy attempts socket connection to port 6379, remaining silent for timeout limit of ${timeout}ms before giving up.`;
      } else if (step.id === 3) {
        logMessage = `All routing targets checked. Attempt threshold limit (${retries} retries) fully breached, raising a critical SocketException database pool error.`;
      }
    } else if (event.id === 'async-client-retries') {
      const trigger = params.find(p => p.id === 'client-retry-interval')?.value || 1200;
      const weight = params.find(p => p.id === 'computation-weight')?.value || 3500;
      
      if (step.id === 2) {
        logMessage = `Worker VM is spinning complex engine parsing calculation loops taking approx ${weight}ms.`;
      } else if (step.id === 3) {
        logMessage = `Impatient client does not hear back within ${trigger}ms boundary. Client fires duplicate request payload with UUID tx_7762.`;
      }
    } else if (event.id === 'physical-node-crash') {
      const lease = params.find(p => p.id === 'lock-lease-time')?.value || 60;
      const reboot = params.find(p => p.id === 'recovery-gap')?.value || 15;
      
      if (step.id === 2) {
        logMessage = `Worker Node 04 creates exclusive ownership lease inside Redis, acquiring lock with active ex=${lease}s TTL parameter.`;
      } else if (step.id === 5) {
        logMessage = `Redis internal master lease timer hits zero after ${lease} seconds. Lock is dropped from memory structures. [Standby reboot: ${reboot}s]`;
      }
    } else if (event.id === 'heterogeneous-node-drift') {
      const precision = params.find(p => p.id === 'precision-decimals')?.value || 15;
      const isBig = params.find(p => p.id === 'is-big-endian')?.value || false;
      
      if (step.id === 1) {
        logMessage = `Complex double precision arithmetic payload containing ${precision} decimals scheduled concurrently on Intel AMD64 & Graviton ARM64 servers.`;
      } else if (step.id === 5) {
        logMessage = `Output serialized using struct.pack("<d") forcing little-endian layout. Native client-end Endian: ${isBig ? 'BIG ENDIAN (Inverting bytes)' : 'LITTLE ENDIAN (Direct passage)'}.`;
      }
    }

    // Build the array of messages to emit
    const logsToEmit = [];
    const timestamp = new Date().toLocaleTimeString();
    logsToEmit.push(`[${timestamp}] [${step.actor.toUpperCase()}] STATUS: ${step.status === 'success' || step.status === 'mitigated' ? 'SECURED' : 'INFO'} - ${logMessage}`);
    
    if (step.codeSnippet) {
      logsToEmit.push(`  ↳ Code Reference Executed: ${step.codeSnippet}`);
    }
    
    onEmitLogs(logsToEmit);

    // Advanced lookups next step
    if (currentStep === event.scenarioSteps.length - 1) {
      setIsSimulating(false);
      onEmitLogs([
        `>> SCENARIO COMPLETE: Mitigations validated and locked. Safety verified. <<`,
        `[STATUS] Standby Target Node State: Nominal. Routing Matrix resolved.`
      ]);
      setCurrentStep(-1);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  // Run scenario step sequence
  useEffect(() => {
    if (isSimulating) {
      timerRef.current = setTimeout(() => {
        stepThroughSimulation();
      }, simulationSpeed);
    }
    return () => clearTimeout(timerRef.current);
  }, [isSimulating, currentStep, simulationSpeed, event]);

  // Determine current system mitigation success indicators from param tuning
  const calculateSafetyPrognosis = () => {
    if (event.id === 'worker-compute-lag') {
      const lag = params.find(p => p.id === 'lag-duration')?.value || 12000;
      const ttl = params.find(p => p.id === 'idempotency-ttl')?.value || 5;
      if (lag < ttl * 1000) {
        return {
          status: 'Excellent',
          color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
          desc: 'Calculation completes comfortably before Redis lock expires. No failover lock race matches and standard response succeeds immediately.'
        };
      }
      return {
        status: 'Mitigated Lock Match',
        color: 'text-amber-600 bg-amber-50 border-amber-100',
        desc: 'Lag duration causes lock drop, but LUA complete verification acts as safety-net to reject out-of-order writes gracefully with a clean 409 Conflict.'
      };
    } else if (event.id === 'redis-node-outage') {
      const retries = params.find(p => p.id === 'retry-attempts')?.value || 3;
      if (retries <= 1) {
        return {
          status: 'High Alert Failback',
          color: 'text-rose-600 bg-rose-50 border-rose-100',
          desc: 'With retry limits set low, system falls into degraded mode almost immediately upon packet drop. telemetry warns pager duty.'
        };
      }
      return {
        status: 'Clean Standby Fallback',
        color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
        desc: 'Retry loop handles transient socket drops; if Redis stays dark, asyncio core recaptures Rust Router cleanly inside finally block avoiding leaks.'
      };
    } else if (event.id === 'async-client-retries') {
      const trigger = params.find(p => p.id === 'client-retry-interval')?.value || 1200;
      const weight = params.find(p => p.id === 'computation-weight')?.value || 3500;
      if (trigger >= weight) {
        return {
          status: 'Direct Response Flow',
          color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
          desc: 'Client is patient enough to wait for full background thread execution. Native flow completes without triggering duplicate race parameters.'
        };
      }
      return {
        status: 'NX-Gate Blocked Retry',
        color: 'text-blue-600 bg-blue-50 border-blue-100',
        desc: 'Client triggers duplicates early but the atomic SET NX lock matches instantly, skipping double compute queues and returning 202 Location polling targets.'
      };
    } else if (event.id === 'physical-node-crash') {
      const lease = params.find(p => p.id === 'lock-lease-time')?.value || 60;
      const reboot = params.find(p => p.id === 'recovery-gap')?.value || 15;
      if (reboot > lease) {
        return {
          status: 'High Recovery Latency',
          color: 'text-amber-600 bg-amber-50 border-amber-100',
          desc: 'Reboot window of container surpasses lock lease. Client retry can claim the vacant slot prior to container starting up, creating re-queue latency.'
        };
      }
      return {
        status: 'Self-Healing Failover',
        color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
        desc: 'Lease matches safe standby windows. Container spins back up inside healthy boundaries, picking up outstanding task states cleanly with zero corruption.'
      };
    } else {
      return {
        status: 'Guaranteed Reproducibility',
        color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
        desc: 'IEEE 754 encoding completely standardizes the byte allocation regardless of CPU CISC/RISC instruction formats, achieving perfect file logging consistency.'
      };
    }
  };

  const prognosis = calculateSafetyPrognosis();

  return (
    <div className="space-y-6">
      {/* Top Layout Grid: Topology & Step Execution Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Visual Topology Map */}
        <div className="lg:col-span-2 space-y-6">
          <TopologyMap
            activeActor={isSimulating && currentStep >= 0 ? event.scenarioSteps[Math.max(0, currentStep - 1)].actor : 'Client'}
            systemStatus={isSimulating ? 'simulating' : event.severity === 'critical' ? 'failed' : 'healthy'}
          />

          {/* Interactive Step Timeline Viewer */}
          <div className="border border-slate-100 bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-display font-medium text-slate-800 text-sm tracking-tight">Deterministic Incident Sequence</h4>
                <p className="text-[11px] text-slate-500 font-mono">Sequential Resolution Steps (Standard Operating Procedure)</p>
              </div>
              <div className="text-[11px] font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded">
                Active: {currentStep < 0 ? 'IDLE' : `${currentStep + 1} / ${event.scenarioSteps.length}`}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {event.scenarioSteps.map((step, idx) => {
                const isStepActive = isSimulating && currentStep === idx;
                const isStepCompleted = currentStep > idx || currentStep === -1 && !isSimulating;
                
                return (
                  <div
                    key={step.id}
                    id={`simulation-step-${step.id}`}
                    className={`p-3 rounded-lg border text-xs transition-all duration-300 flex gap-2.5 items-start ${
                      isStepActive
                        ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-100'
                        : isStepCompleted
                        ? 'border-slate-100 bg-slate-50 opacity-80'
                        : 'border-slate-100 bg-white opacity-40'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full text-[10px] font-mono flex items-center justify-center font-bold shrink-0 transition-colors ${
                      isStepActive
                        ? 'bg-indigo-600 text-white'
                        : isStepCompleted
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-400'
                    }`}>
                      {step.id}
                    </span>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-slate-800 font-display">{step.title}</span>
                        <span className="text-[9px] font-mono uppercase bg-slate-100 text-slate-500 px-1 py-0.2 rounded shrink-0">
                          {step.actor}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-slate-500">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dynamic Controls / Mitigation Configurator */}
        <div className="space-y-6">
          <div className="border border-slate-100 bg-white rounded-xl p-5 shadow-sm flex flex-col h-full justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-3.5 border-b border-slate-50">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <div>
                  <h4 className="font-display font-medium text-slate-800 text-sm tracking-tight">Parametric Controls</h4>
                  <p className="text-[10px] text-slate-400 font-mono">Tweak conditions in real-time</p>
                </div>
              </div>

              <div id="param-sliders-list" className="space-y-4">
                {params.map(param => (
                  <div key={param.id} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-slate-700 font-display">{param.name}</span>
                      <span className="font-mono bg-indigo-50 text-indigo-700 text-[10px] px-1.5 py-0.5 rounded font-bold">
                        {typeof param.value === 'boolean' ? (param.value ? 'ON' : 'OFF') : `${param.value}${param.unit || ''}`}
                      </span>
                    </div>

                    {param.type === 'slider' && (
                      <input
                        type="range"
                        id={`input-param-${param.id}`}
                        min={param.min}
                        max={param.max}
                        value={param.value}
                        onChange={(e) => handleParamChange(param.id, Number(e.target.value))}
                        className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
                      />
                    )}

                    {param.type === 'toggle' && (
                      <button
                        onClick={() => handleParamChange(param.id, !param.value)}
                        id={`btn-param-toggle-${param.id}`}
                        className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-xs text-left transition-all ${
                          param.value 
                            ? 'border-indigo-600 bg-indigo-50/20 text-indigo-950 font-medium'
                            : 'border-slate-100 bg-slate-50/50 text-slate-600'
                        }`}
                      >
                        <span>Enable Parameter</span>
                        <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${param.value ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'}`}>
                          {param.value && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                      </button>
                    )}

                    <p className="text-[10px] text-slate-400 leading-normal">
                      {param.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-50 mt-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-400">Simulation Interval:</span>
                <select
                  value={simulationSpeed}
                  onChange={(e) => setSimulationSpeed(Number(e.target.value))}
                  className="text-[10px] text-slate-600 font-mono bg-slate-50 rounded border border-slate-100 px-1 py-0.5"
                >
                  <option value={900}>Fast (0.9s)</option>
                  <option value={1800}>Nominal (1.8s)</option>
                  <option value={3000}>Step-by-step (3s)</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {!isSimulating ? (
                  <button
                    onClick={startSimulation}
                    id="btn-trigger-simulation"
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer select-none transition-all duration-150 shadow"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Runbook Simulation</span>
                  </button>
                ) : (
                  <button
                    onClick={stopSimulation}
                    id="btn-halt-simulation"
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold cursor-pointer select-none transition-all duration-150"
                  >
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>Halt Execution</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    stopSimulation();
                    setCurrentStep(-1);
                    setParams(event.parameters);
                    onClearLogs();
                  }}
                  id="btn-reset-simulation"
                  className="p-2 border border-slate-100 hover:bg-slate-50 rounded-lg text-slate-500 transition-colors"
                  title="Reset Simulation Workspace"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Safety Analysis Output Badge/Card */}
      <div id="simulation-prognosis-alert" className={`border rounded-xl p-4 transition-all duration-300 ${prognosis.color}`}>
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0">
            {prognosis.status === 'Excellent' || prognosis.status === 'Clean Standby Fallback' || prognosis.status === 'Direct Response Flow' || prognosis.status === 'Guaranteed Reproducibility' ? (
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            ) : prognosis.status === 'High Alert Failback' || prognosis.status === 'High Recovery Latency' ? (
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            ) : (
              <Radio className="w-5 h-5 text-indigo-500 animate-pulse" />
            )}
          </div>
          <div className="space-y-1">
            <h5 className="font-display font-semibold text-xs tracking-tight flex items-center gap-2">
              System Resiliency Forecast: <span className="font-mono text-[10px] tracking-wide uppercase font-bold decoration-dotted underline">{prognosis.status}</span>
            </h5>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              {prognosis.desc}
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Visual Playpen for active event code */}
      <div className="border border-slate-100 bg-slate-50/50 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-indigo-600 animate-spin-slow" />
            <div>
              <h4 className="font-display font-medium text-slate-800 text-sm tracking-tight text-slate-900">Mitigation Layout Kernel</h4>
              <p className="text-[10px] text-slate-400 font-mono">Production code references triggered by system callbacks</p>
            </div>
          </div>
        </div>

        <pre className="bg-slate-950 border border-slate-800 p-4.5 rounded-lg text-xs text-indigo-300 font-mono overflow-x-auto shadow-inner leading-relaxed">
          <code>{event.codeReference}</code>
        </pre>
      </div>

    </div>
  );
}

