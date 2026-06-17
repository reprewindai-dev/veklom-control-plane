'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Play, RotateCcw, ChevronRight, Lock, Terminal, AlertCircle, CheckCircle,
  Clock, Shield, Zap, Database, Cpu, Activity, GitFork, Layers, Flame
} from 'lucide-react';

const SCENARIOS = [
  { id: 'rogue_db', name: 'Rogue Database', description: 'Agent attempts unauthorized database modification', threat_level: 'CRITICAL', color: 'rose' },
  { id: 'prompt_injection', name: 'Prompt Injection', description: 'Malicious prompt injection attack simulation', threat_level: 'HIGH', color: 'orange' },
  { id: 'repo_mutation', name: 'Repository Mutation', description: 'Unauthorized code repository changes', threat_level: 'HIGH', color: 'orange' },
  { id: 'budget_loop', name: 'Budget Loop', description: 'Runaway spending without cost controls', threat_level: 'MEDIUM', color: 'yellow' },
  { id: 'quarantine', name: 'Quarantine Protocol', description: 'Test containment and isolation procedures', threat_level: 'MEDIUM', color: 'yellow' },
];

const PIPELINE_STEPS = [
  { step: 1, name: 'Received', icon: Terminal, desc: 'Intent received and queued' },
  { step: 2, name: 'Governing', icon: Shield, desc: 'Policy evaluation against constitution' },
  { step: 3, name: 'Compiled', icon: Cpu, desc: 'Deterministic plan compiled' },
  { step: 4, name: 'Committed', icon: Lock, desc: 'Cryptographic proof hash generated' },
  { step: 5, name: 'Routed', icon: GitFork, desc: 'Provider selected via routing matrix' },
  { step: 6, name: 'Executing', icon: Play, desc: 'Tool calls dispatched under policy' },
  { step: 7, name: 'Sealed', icon: CheckCircle, desc: 'Evidence ledger signed and immutable' },
];

const DEEP_LINKS = [
  {
    href: '/benchmarks/runtime-lab',
    title: 'Gateway Trust Contract',
    subtitle: '7-Step Deterministic Pipeline · EAT Token Generation · Cryptographic Evidence',
    icon: Shield,
    badge: 'FULL LAB',
    color: 'emerald',
  },
  {
    href: '/benchmarks/arena',
    title: 'Authority Arena',
    subtitle: 'CharacterCreator · Agent Builder · Compliance Scenario Sandbox',
    icon: Zap,
    badge: 'SANDBOX',
    color: 'violet',
  },
  {
    href: '/routing/live',
    title: 'Fault Matrix + SLO-Gate',
    subtitle: 'Chaos Injection · Ollama→Groq→Gemini Fallback · Gradient Field Routing',
    icon: Activity,
    badge: 'LIVE',
    color: 'amber',
  },
];

export default function RuntimePage() {
  const [selectedScenario, setSelectedScenario] = useState(SCENARIOS[0]);
  const [activeStep, setActiveStep] = useState(0);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [eat, setEat] = useState<string | null>(null);

  const runDemo = async () => {
    setRunning(true);
    setCompleted(false);
    setActiveStep(0);
    setEat(null);

    for (let i = 1; i <= 7; i++) {
      await new Promise((r) => setTimeout(r, 480));
      setActiveStep(i);
    }

    const token = `EAT-${Math.random().toString(36).substr(2, 6).toUpperCase()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    setEat(token);
    setRunning(false);
    setCompleted(true);
  };

  const reset = () => {
    setActiveStep(0);
    setRunning(false);
    setCompleted(false);
    setEat(null);
  };

  const threatColor: Record<string, string> = {
    CRITICAL: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    HIGH: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    MEDIUM: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              ● RUNTIME ENFORCEMENT
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Runtime Enforcement Hub</h1>
          <p className="text-slate-400 mt-1.5 max-w-2xl">
            The crown jewel. Every AI action passes through a 7-step deterministic pipeline — governed, compiled, committed, and sealed with cryptographic proof before any tool executes.
          </p>
        </div>

        {/* Deep Links to Full Labs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {DEEP_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="group bg-slate-900 border border-slate-700 hover:border-slate-500 rounded-xl p-5 transition-all hover:shadow-lg hover:shadow-black/20"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg bg-${link.color}-500/10 border border-${link.color}-500/20`}>
                    <Icon className={`w-5 h-5 text-${link.color}-400`} />
                  </div>
                  <span className={`text-[9px] font-mono font-bold tracking-widest text-${link.color}-400 bg-${link.color}-500/10 border border-${link.color}-500/20 px-2 py-0.5 rounded-full`}>
                    {link.badge}
                  </span>
                </div>
                <h3 className="text-white font-semibold mb-1 group-hover:text-emerald-300 transition">{link.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{link.subtitle}</p>
                <div className="flex items-center gap-1 mt-3 text-xs text-slate-500 group-hover:text-slate-300 transition">
                  Open Full Lab <ChevronRight className="w-3 h-3" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Quick Demo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scenario Picker */}
          <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
            <div className="bg-slate-950 px-5 py-4 border-b border-slate-700 flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <h3 className="text-white font-semibold text-sm">Threat Scenario</h3>
            </div>
            <div className="p-4 space-y-2">
              {SCENARIOS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedScenario(s); reset(); }}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition ${
                    selectedScenario.id === s.id
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{s.name}</span>
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${threatColor[s.threat_level]}`}>
                      {s.threat_level}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{s.description}</p>
                </button>
              ))}
            </div>
            <div className="px-4 pb-4 flex gap-3">
              <button
                onClick={runDemo}
                disabled={running}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-semibold rounded-lg transition text-sm flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                {running ? 'Enforcing...' : 'Run Pipeline Demo'}
              </button>
              <button
                onClick={reset}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Pipeline Visualizer */}
          <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
            <div className="bg-slate-950 px-5 py-4 border-b border-slate-700 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <h3 className="text-white font-semibold text-sm">Execution Pipeline — {selectedScenario.name}</h3>
            </div>
            <div className="p-4 space-y-2">
              {PIPELINE_STEPS.map((step) => {
                const Icon = step.icon;
                const isDone = activeStep >= step.step;
                const isActive = activeStep === step.step && running;
                return (
                  <div
                    key={step.step}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all ${
                      isDone
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : isActive
                        ? 'bg-blue-500/10 border-blue-500/30'
                        : 'bg-slate-800/40 border-slate-700/50'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      isDone ? 'bg-emerald-500/20' : isActive ? 'bg-blue-500/20' : 'bg-slate-700'
                    }`}>
                      {isDone ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 font-mono">STEP {step.step}</span>
                        <span className={`text-sm font-semibold ${isDone ? 'text-emerald-300' : isActive ? 'text-blue-300' : 'text-slate-400'}`}>
                          {step.name}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{step.desc}</p>
                    </div>
                    {isDone && (
                      <span className="text-[10px] font-mono text-emerald-500 shrink-0">✓ SEALED</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* EAT Token */}
            {eat && (
              <div className="mx-4 mb-4 p-4 bg-emerald-950/50 border border-emerald-500/30 rounded-lg">
                <div className="text-[9px] font-mono uppercase tracking-widest text-emerald-400 mb-1">
                  Execution Authorization Token Issued
                </div>
                <code className="text-emerald-300 font-mono text-sm font-bold">{eat}</code>
                <p className="text-xs text-emerald-600 mt-1">Pipeline sealed. All 7 steps cryptographically verified.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer nav to full experiences */}
        <div className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
          <div>
            <p className="text-sm font-semibold text-white">Need the full experience?</p>
            <p className="text-xs text-slate-400">The Gateway Trust Contract lab includes EAT signing, policy presets, and the full evidence ledger.</p>
          </div>
          <Link
            href="/benchmarks/runtime-lab"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg transition flex items-center gap-2"
          >
            Open Full Lab <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </div>
  );
}
