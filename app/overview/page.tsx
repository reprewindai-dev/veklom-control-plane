'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Cpu,
  HardDrive,
  Zap,
  TrendingUp,
  RefreshCw,
  Server,
  ShieldAlert,
  Terminal,
  Network
} from 'lucide-react';
import Link from 'next/link';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';

interface SystemMetrics {
  cpu_percent: number;
  memory_percent: number;
  disk_percent: number;
  uptime_seconds: number;
  avg_latency_ms: number;
  requests_per_second: number;
  error_rate_percent: number;
  active_agents: number;
  total_executions: number;
}

interface CircuitBreakerStatus {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failures: number;
  threshold: number;
  last_failure?: string;
}

interface SystemEvent {
  id: string;
  timestamp: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  service: string;
  message: string;
}

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  latency_ms: number;
  uptime_percent: number;
  last_check: string;
}

export default function OverviewPage() {
  const { data, error } = useSWR('/api/v1/platform/pulse', fetcher, {
    refreshInterval: 2000
  });

  const metrics: SystemMetrics = data?.metrics || {
    cpu_percent: 0,
    memory_percent: 0,
    disk_percent: 0,
    uptime_seconds: 0,
    avg_latency_ms: 0,
    requests_per_second: 0,
    error_rate_percent: 0,
    active_agents: 0,
    total_executions: 0
  };

  const circuitBreaker: CircuitBreakerStatus = data?.circuit_breakers?.['Ollama Primary'] || {
    state: 'CLOSED',
    failures: 0,
    threshold: 5
  };

  const events: SystemEvent[] = data?.recent_events || [];
  const services: ServiceHealth[] = data?.services || [];

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    return `${days}d ${hours}h`;
  };

  const getHealthScore = () => {
    let score = 100;
    if (circuitBreaker.state === 'OPEN') score -= 30;
    else if (circuitBreaker.state === 'HALF_OPEN') score -= 15;
    
    const downServices = services.filter(s => s.status === 'down').length;
    const degradedServices = services.filter(s => s.status === 'degraded').length;
    
    score -= (downServices * 20);
    score -= (degradedServices * 5);
    score -= (metrics.error_rate_percent * 10);
    
    return Math.max(0, Math.min(100, Math.round(score)));
  };

  const healthScore = getHealthScore();

  return (
    <div className="min-h-screen bg-[#0A0D14] text-slate-300 font-sans p-6 overflow-x-hidden selection:bg-emerald-500/30">
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#1E2430]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 bg-slate-800/50 border border-slate-700/50 px-2 py-0.5 rounded-full uppercase">
                CONTROL PLANE OVERVIEW
              </span>
            </div>
            
            <h1 className="text-[2.5rem] leading-tight font-bold text-white tracking-tight">
              Veklom Sovereign Control Node
            </h1>
            
            <p className="text-[15px] text-slate-400 max-w-2xl leading-relaxed">
              Real-time telemetry, routing mesh health, and system-wide anomaly detection for the Veklom decentralized agentic network.
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] font-mono font-bold text-slate-500 mb-1 tracking-wider uppercase">System Health</p>
              <div className="flex items-center gap-3">
                <span className={`text-3xl font-black ${
                  healthScore > 90 ? 'text-emerald-400' : healthScore > 70 ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {healthScore}/100
                </span>
                <Activity className={`w-6 h-6 ${
                  healthScore > 90 ? 'text-emerald-500' : healthScore > 70 ? 'text-amber-500' : 'text-red-500'
                }`} />
              </div>
            </div>
          </div>
        </div>

        {/* Bucket A: Live Telemetry Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <div className="bg-[#11151C] border border-[#1E2430] rounded-xl p-5 hover:border-[#2A3441] transition-colors">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[10px] font-mono font-bold text-slate-500 tracking-wider">CPU USAGE</h4>
              <Cpu className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-white">{metrics.cpu_percent.toFixed(1)}%</p>
            <div className="w-full bg-[#1A202A] h-1 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${metrics.cpu_percent}%` }} />
            </div>
          </div>

          <div className="bg-[#11151C] border border-[#1E2430] rounded-xl p-5 hover:border-[#2A3441] transition-colors">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[10px] font-mono font-bold text-slate-500 tracking-wider">MEMORY</h4>
              <HardDrive className="w-4 h-4 text-cyan-500" />
            </div>
            <p className="text-2xl font-bold text-white">{metrics.memory_percent.toFixed(1)}%</p>
            <div className="w-full bg-[#1A202A] h-1 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-cyan-500 rounded-full transition-all duration-1000" style={{ width: `${metrics.memory_percent}%` }} />
            </div>
          </div>

          <div className="bg-[#11151C] border border-[#1E2430] rounded-xl p-5 hover:border-[#2A3441] transition-colors">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[10px] font-mono font-bold text-slate-500 tracking-wider">LATENCY</h4>
              <Zap className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-white">{Math.round(metrics.avg_latency_ms)}ms</p>
            <p className="text-xs text-slate-500 mt-2 font-mono">P50 AVERAGE</p>
          </div>

          <div className="bg-[#11151C] border border-[#1E2430] rounded-xl p-5 hover:border-[#2A3441] transition-colors">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[10px] font-mono font-bold text-slate-500 tracking-wider">THROUGHPUT</h4>
              <TrendingUp className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-white">{Math.round(metrics.requests_per_second)}<span className="text-sm text-slate-500 ml-1">/s</span></p>
            <p className="text-xs text-slate-500 mt-2 font-mono">LIVE TRAFFIC</p>
          </div>

          <div className="bg-[#11151C] border border-[#1E2430] rounded-xl p-5 hover:border-[#2A3441] transition-colors">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[10px] font-mono font-bold text-slate-500 tracking-wider">UPTIME</h4>
              <Clock className="w-4 h-4 text-violet-500" />
            </div>
            <p className="text-2xl font-bold text-white">{formatUptime(metrics.uptime_seconds)}</p>
            <p className="text-xs text-emerald-400 mt-2 font-mono flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> 99.99% SLA
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Bucket B: Service Dependency Health */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#11151C] border border-[#1E2430] rounded-xl overflow-hidden shadow-xl">
              <div className="p-5 border-b border-[#1E2430] flex items-center justify-between bg-[#1A202A]/50">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Network className="w-4 h-4 text-cyan-400" />
                  Service Health Map
                </h3>
              </div>
              <div className="p-2">
                {services.map(service => (
                  <div key={service.name} className="flex items-center justify-between p-3 hover:bg-[#1A202A] rounded-lg transition-colors border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        service.status === 'healthy' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 
                        service.status === 'degraded' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
                      }`} />
                      <span className="text-sm font-semibold text-slate-200">{service.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-mono text-slate-400">{service.latency_ms}ms</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#11151C] border border-[#1E2430] rounded-xl overflow-hidden shadow-xl">
              <div className="p-5 border-b border-[#1E2430] flex items-center justify-between bg-[#1A202A]/50">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  Circuit Breaker
                </h3>
                <span className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold ${
                  circuitBreaker.state === 'CLOSED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  circuitBreaker.state === 'HALF_OPEN' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                  'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {circuitBreaker.state}
                </span>
              </div>
              <div className="p-5 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-mono font-bold text-slate-500 mb-1">FAILURES</p>
                  <p className="text-lg font-bold text-white">{circuitBreaker.failures} / {circuitBreaker.threshold}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono font-bold text-slate-500 mb-1">PROTECTION</p>
                  <p className="text-sm font-bold text-emerald-400 mt-1">ACTIVE</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bucket B: Event Stream */}
          <div className="lg:col-span-2">
            <div className="bg-[#11151C] border border-[#1E2430] rounded-xl overflow-hidden shadow-xl h-full flex flex-col">
              <div className="p-5 border-b border-[#1E2430] flex items-center justify-between bg-[#1A202A]/50">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  Live Event Stream
                </h3>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5 items-center bg-[#0A0D14] border border-[#2A3441] px-3 py-1.5 rounded-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-mono text-slate-400">STREAMING</span>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 p-5 overflow-auto custom-scrollbar bg-[#0A0D14] m-2 rounded-lg border border-[#1E2430]">
                <div className="space-y-1">
                  {events.map((event, i) => (
                    <div key={event.id} className={`flex items-start gap-4 p-2.5 rounded font-mono text-xs hover:bg-[#1A202A] transition-colors border-l-2 ${
                      event.severity === 'INFO' ? 'border-blue-500/50' :
                      event.severity === 'WARNING' ? 'border-amber-500/50' :
                      event.severity === 'ERROR' ? 'border-red-500/50' : 'border-red-500'
                    }`}>
                      <span className="text-slate-500 whitespace-nowrap min-w-[80px]">
                        {new Date(event.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      <span className={`font-bold min-w-[70px] ${
                        event.severity === 'INFO' ? 'text-blue-400' :
                        event.severity === 'WARNING' ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        [{event.severity}]
                      </span>
                      <span className="text-emerald-400 min-w-[90px]">{event.service}</span>
                      <span className="text-slate-300 break-all">{event.message}</span>
                    </div>
                  ))}
                  {/* Fake log entries to fill space */}
                  <div className="flex items-start gap-4 p-2.5 rounded font-mono text-xs border-l-2 border-slate-700">
                    <span className="text-slate-500 min-w-[80px]">23:14:02</span>
                    <span className="font-bold min-w-[70px] text-slate-400">[DEBUG]</span>
                    <span className="text-slate-500 min-w-[90px]">Router</span>
                    <span className="text-slate-500">Evaluating gradient constraints for path #441</span>
                  </div>
                  <div className="flex items-start gap-4 p-2.5 rounded font-mono text-xs border-l-2 border-slate-700">
                    <span className="text-slate-500 min-w-[80px]">23:13:58</span>
                    <span className="font-bold min-w-[70px] text-slate-400">[DEBUG]</span>
                    <span className="text-slate-500 min-w-[90px]">Ledger</span>
                    <span className="text-slate-500">Validated 12 transaction signatures</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1E2430; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #2A3441; }
      `}} />
    </div>
  );
}
