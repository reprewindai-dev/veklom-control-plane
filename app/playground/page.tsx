'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronDown, Copy, Download, AlertTriangle, Clock, Zap, Cpu,
  Sparkles, Activity, Trophy, History, Trash2, RotateCcw,
  Thermometer, Brain, Code2, PenLine, BarChart2, ShieldCheck,
  Check, XCircle, Layers
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Shell from '@/components/Shell';
import { api } from '@/lib/api';
import { Pill } from '@/components/telemetry';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ModelResponse {
  response: string;
  model: string;
  provider: 'ollama' | 'groq';
  latency_ms: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost?: string;
  log_id?: string;
}

interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failures: number;
  threshold: number;
  cooldown_seconds: number;
}

interface HistoryEntry {
  id: string;
  timestamp: string;
  promptPreview: string;
  systemPrompt: string;
  userPrompt: string;
  modelA: string;
  modelB: string;
  responseA: ModelResponse | null;
  responseB: ModelResponse | null;
  temperature: number;
  maxTokens: number;
  winner: 'A' | 'B' | 'tie' | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

interface PresetEntry {
  label: string;
  icon: React.ReactNode;
  prompt: string;
}

const PRESET_SYSTEM_PROMPTS: Record<string, PresetEntry> = {
  code: {
    label: 'Code Assistant',
    icon: <Code2 size={12} />,
    prompt:
      'You are an expert software engineer. Provide clean, well-commented code with best practices. Always explain your reasoning and highlight potential edge cases or security considerations.',
  },
  creative: {
    label: 'Creative Writer',
    icon: <PenLine size={12} />,
    prompt:
      'You are a creative writing specialist. Generate vivid, engaging prose with rich narrative voice. Embrace metaphor, rhythm, and emotional resonance in all responses.',
  },
  analyst: {
    label: 'Data Analyst',
    icon: <BarChart2 size={12} />,
    prompt:
      'You are a senior data analyst. Approach every question with structured analytical thinking. Provide quantitative reasoning, identify patterns, and always cite assumptions explicitly.',
  },
  security: {
    label: 'Security Auditor',
    icon: <ShieldCheck size={12} />,
    prompt:
      'You are a cybersecurity expert and penetration tester. Analyze systems for vulnerabilities, provide threat models, and recommend mitigations. Always consider attacker perspective and defense-in-depth.',
  },
};

const QUICK_TEMPLATES = [
  'Compare these two approaches:',
  'Explain in simple terms:',
  'What are the risks of:',
  'Generate a governance policy for:',
];

const MAX_HISTORY = 5;
const STREAM_WORD_DELAY_MS = 30;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computeCostColor(costStr: string): string {
  const val = parseFloat(costStr || '0');
  if (val < 0.0005) return 'text-accent-green';
  if (val < 0.005) return 'text-brand-400';
  return 'text-red-400';
}

function formatCost(costStr: string): string {
  const val = parseFloat(costStr || '0');
  if (val === 0) return '$0.00000';
  return '$' + val.toFixed(5);
}

function temperatureLabel(temp: number): string {
  if (temp < 0.3) return 'Deterministic';
  if (temp < 0.7) return 'Focused';
  if (temp < 1.1) return 'Balanced';
  if (temp < 1.6) return 'Creative';
  return 'Chaotic';
}

function temperatureColor(temp: number): string {
  if (temp < 0.4) return '#60a5fa';
  if (temp < 1.0) return '#FFB800';
  if (temp < 1.6) return '#f97316';
  return '#ef4444';
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

function StreamingText({ text, isStreaming }: { text: string; isStreaming: boolean }) {
  return (
    <span>
      {text}
      {isStreaming && (
        <span className="inline-block w-[2px] h-[13px] ml-0.5 bg-brand-400 align-middle animate-pulse" />
      )}
    </span>
  );
}

function TokenCounterBar({ response, maxTokens }: { response: ModelResponse; maxTokens: number }) {
  const utilPct = Math.min(100, (response.total_tokens / maxTokens) * 100);
  const costColor = computeCostColor(response.cost || '0');

  return (
    <div className="space-y-2.5 mt-3">
      <div className="flex flex-wrap gap-1.5 font-mono">
        <span className="flex items-center gap-1 bg-[#151515] border border-[#242424] px-2 py-0.5 rounded text-[9px] text-ink-400">
          <span className="text-ink-600">PROMPT</span>
          <span className="text-brand-400 font-bold">{response.prompt_tokens}</span>
        </span>
        <span className="flex items-center gap-1 bg-[#151515] border border-[#242424] px-2 py-0.5 rounded text-[9px] text-ink-400">
          <span className="text-ink-600">COMPLETION</span>
          <span className="text-accent-green font-bold">{response.completion_tokens}</span>
        </span>
        <span className="flex items-center gap-1 bg-[#151515] border border-[#242424] px-2 py-0.5 rounded text-[9px] text-ink-400">
          <span className="text-ink-600">TOTAL</span>
          <span className="text-white font-bold">{response.total_tokens}</span>
        </span>
        <span className={clsx('flex items-center gap-1 bg-[#151515] border border-[#242424] px-2 py-0.5 rounded text-[9px] font-bold', costColor)}>
          {formatCost(response.cost || '0')}
        </span>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-[9px] font-mono text-ink-600">
          <span>TOKEN UTILIZATION</span>
          <span>{utilPct.toFixed(1)}% of {maxTokens}</span>
        </div>
        <div className="h-1 w-full bg-[#1a1a1a] rounded-full overflow-hidden">
          <motion.div
            className={clsx(
              'h-full rounded-full',
              utilPct < 60 ? 'bg-accent-green' : utilPct < 85 ? 'bg-brand-400' : 'bg-red-400'
            )}
            initial={{ width: 0 }}
            animate={{ width: utilPct + '%' }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  );
}

function LatencyComparisonBars({
  responseA,
  responseB,
  modelALabel,
  modelBLabel,
}: {
  responseA: ModelResponse;
  responseB: ModelResponse;
  modelALabel: string;
  modelBLabel: string;
}) {
  const maxLatency = Math.max(responseA.latency_ms, responseB.latency_ms, 1);
  const winnerIsA = responseA.latency_ms <= responseB.latency_ms;
  const fasterMs = winnerIsA ? responseA.latency_ms : responseB.latency_ms;
  const slowerMs = winnerIsA ? responseB.latency_ms : responseA.latency_ms;
  const ratio = slowerMs > 0 ? (slowerMs / Math.max(fasterMs, 1)).toFixed(1) : '1.0';
  const winnerLabel = winnerIsA ? 'Model A' : 'Model B';

  const effA =
    responseA.prompt_tokens > 0
      ? (responseA.completion_tokens / responseA.prompt_tokens).toFixed(2)
      : '—';
  const effB =
    responseB.prompt_tokens > 0
      ? (responseB.completion_tokens / responseB.prompt_tokens).toFixed(2)
      : '—';

  return (
    <motion.div
      className="card p-5 space-y-4"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-brand-400" />
          <span className="text-[10px] font-mono font-bold text-ink-400 uppercase tracking-wider">
            Latency Comparison
          </span>
        </div>
        <div className="flex items-center gap-1.5 bg-brand-500/10 border border-brand-500/30 px-2.5 py-1 rounded text-[10px] font-mono font-bold text-brand-400">
          <Trophy size={11} />
          {winnerLabel} was {ratio}x faster
        </div>
      </div>

      {/* Bar A */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px] font-mono">
          <div className="flex items-center gap-1.5">
            {winnerIsA && <Trophy size={10} className="text-brand-400" />}
            <span className={winnerIsA ? 'text-brand-400' : 'text-ink-500'}>
              Model A · {modelALabel}
            </span>
          </div>
          <span className={clsx('font-bold', winnerIsA ? 'text-brand-400' : 'text-ink-400')}>
            {responseA.latency_ms} ms
          </span>
        </div>
        <div className="h-2 w-full bg-[#1a1a1a] rounded-full overflow-hidden">
          <motion.div
            className={clsx(
              'h-full rounded-full',
              winnerIsA ? 'bg-brand-400' : 'bg-[#333]'
            )}
            style={winnerIsA ? { boxShadow: '0 0 8px rgba(255,184,0,0.5)' } : {}}
            initial={{ width: 0 }}
            animate={{ width: ((responseA.latency_ms / maxLatency) * 100) + '%' }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Bar B */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px] font-mono">
          <div className="flex items-center gap-1.5">
            {!winnerIsA && <Trophy size={10} className="text-brand-400" />}
            <span className={!winnerIsA ? 'text-brand-400' : 'text-ink-500'}>
              Model B · {modelBLabel}
            </span>
          </div>
          <span className={clsx('font-bold', !winnerIsA ? 'text-brand-400' : 'text-ink-400')}>
            {responseB.latency_ms} ms
          </span>
        </div>
        <div className="h-2 w-full bg-[#1a1a1a] rounded-full overflow-hidden">
          <motion.div
            className={clsx(
              'h-full rounded-full',
              !winnerIsA ? 'bg-brand-400' : 'bg-[#333]'
            )}
            style={!winnerIsA ? { boxShadow: '0 0 8px rgba(255,184,0,0.5)' } : {}}
            initial={{ width: 0 }}
            animate={{ width: ((responseB.latency_ms / maxLatency) * 100) + '%' }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
          />
        </div>
      </div>

      {/* Token Efficiency */}
      <div className="pt-2 border-t border-[#1e1e1e] grid grid-cols-2 gap-3">
        <div className="bg-[#111] border border-[#242424] rounded-lg p-3 space-y-1">
          <p className="text-[9px] font-mono text-ink-600 uppercase tracking-wider">Token Efficiency · A</p>
          <p className="text-base font-bold font-mono text-ink-200">{effA}</p>
          <p className="text-[9px] text-ink-600">completion / prompt</p>
        </div>
        <div className="bg-[#111] border border-[#242424] rounded-lg p-3 space-y-1">
          <p className="text-[9px] font-mono text-ink-600 uppercase tracking-wider">Token Efficiency · B</p>
          <p className="text-base font-bold font-mono text-ink-200">{effB}</p>
          <p className="text-[9px] text-ink-600">completion / prompt</p>
        </div>
      </div>
    </motion.div>
  );
}

function HistoryPanel({
  history,
  onRestore,
  onClear,
}: {
  history: HistoryEntry[];
  onRestore: (entry: HistoryEntry) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/[0.01] transition"
      >
        <div className="flex items-center gap-2.5">
          <History size={14} className="text-brand-400" />
          <span className="text-xs font-semibold text-ink-200 uppercase tracking-wider">Comparison History</span>
          {history.length > 0 && (
            <span className="bg-brand-500/20 border border-brand-500/30 text-brand-400 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">
              {history.length}
            </span>
          )}
        </div>
        <ChevronDown
          size={14}
          className={clsx('text-ink-500 transition-transform duration-200', open && 'rotate-180')}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="history-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-[#242424] pt-4 space-y-2">
              {history.length === 0 ? (
                <p className="text-[11px] text-ink-600 font-mono italic text-center py-4">
                  No runs recorded yet.
                </p>
              ) : (
                <>
                  <div className="flex justify-end">
                    <button
                      onClick={onClear}
                      className="flex items-center gap-1.5 text-[10px] text-ink-500 hover:text-red-400 transition font-mono"
                    >
                      <Trash2 size={10} />
                      Clear History
                    </button>
                  </div>
                  <div className="space-y-2">
                    {history.map((entry) => (
                      <button
                        key={entry.id}
                        onClick={() => onRestore(entry)}
                        className="w-full text-left bg-[#111] border border-[#1e1e1e] hover:border-brand-500/40 hover:bg-brand-500/5 rounded-lg p-3 transition group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-mono text-ink-500">{entry.timestamp}</p>
                            <p className="text-[11px] text-ink-200 mt-0.5 truncate">{entry.promptPreview}</p>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <span className="text-[9px] font-mono text-ink-600">
                                {entry.modelA} vs {entry.modelB}
                              </span>
                              {entry.winner && (
                                <span className="flex items-center gap-1 text-[9px] font-mono text-brand-400">
                                  <Trophy size={8} />
                                  Model {entry.winner} wins
                                </span>
                              )}
                              {entry.responseA && entry.responseB && (
                                <span className="text-[9px] font-mono text-ink-600">
                                  Δ {Math.abs(entry.responseA.latency_ms - entry.responseB.latency_ms)}ms
                                </span>
                              )}
                            </div>
                          </div>
                          <RotateCcw
                            size={12}
                            className="text-ink-600 group-hover:text-brand-400 transition shrink-0 mt-1"
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PlaygroundPage() {
  // Core state
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful AI assistant.');
  const [userPrompt, setUserPrompt] = useState('');
  const [maxTokens, setMaxTokens] = useState(2048);
  const [temperature, setTemperature] = useState(0.7);
  const [conversationId, setConversationId] = useState('');
  const [useMemory, setUseMemory] = useState(true);
  const [modelA, setModelA] = useState('ollama');
  const [modelB, setModelB] = useState('groq');

  // Response state
  const [responseA, setResponseA] = useState<ModelResponse | null>(null);
  const [responseB, setResponseB] = useState<ModelResponse | null>(null);

  // Streaming state
  const [displayTextA, setDisplayTextA] = useState('');
  const [displayTextB, setDisplayTextB] = useState('');
  const [isStreamingA, setIsStreamingA] = useState(false);
  const [isStreamingB, setIsStreamingB] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [circuitBreaker, setCircuitBreaker] = useState<CircuitBreakerState | null>(null);
  const [isSystemPromptOpen, setIsSystemPromptOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('');
  const [copiedA, setCopiedA] = useState(false);
  const [copiedB, setCopiedB] = useState(false);

  // History
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Streaming interval refs
  const streamIntervalA = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamIntervalB = useRef<ReturnType<typeof setInterval> | null>(null);

  const modelALabel = modelA === 'ollama' ? 'Qwen2.5:3b' : 'Llama-3.1-8b';
  const modelBLabel = modelB === 'ollama' ? 'Qwen2.5:3b' : 'Llama-3.1-8b';

  // ── Circuit Breaker Poll ──────────────────────────────────────────────────
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await api<any>('/api/v1/status');
        if (data && data.circuit_breaker) setCircuitBreaker(data.circuit_breaker);
      } catch (err) {
        console.error('Failed to fetch circuit breaker status:', err);
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Cleanup streaming on unmount
  useEffect(() => {
    return () => {
      if (streamIntervalA.current) clearInterval(streamIntervalA.current);
      if (streamIntervalB.current) clearInterval(streamIntervalB.current);
    };
  }, []);

  // ── Streaming typewriter ──────────────────────────────────────────────────
  const startStreaming = useCallback(
    (
      fullText: string,
      setDisplay: React.Dispatch<React.SetStateAction<string>>,
      setStreaming: React.Dispatch<React.SetStateAction<boolean>>,
      intervalRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>
    ) => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      const words = fullText.split(' ');
      let idx = 0;
      setDisplay('');
      setStreaming(true);
      intervalRef.current = setInterval(() => {
        idx++;
        setDisplay(words.slice(0, idx).join(' '));
        if (idx >= words.length) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          setStreaming(false);
        }
      }, STREAM_WORD_DELAY_MS);
    },
    []
  );

  // ── Execute single model ──────────────────────────────────────────────────
  const executeModel = async (model: string, isModelA: boolean) => {
    const fullPrompt = systemPrompt + '\n\n' + userPrompt;
    const targetModel = model === 'ollama' ? 'qwen2.5:3b' : 'llama-3.1-8b-instant';

    try {
      let predictedCost = '0.00000';
      try {
        const costData = await api<any>('/api/v1/cost/predict', {
          method: 'POST',
          body: {
            operation_type: 'inference',
            provider: model,
            input_text: userPrompt,
            model: targetModel,
          },
        });
        predictedCost = costData.predicted_cost || '0.00000';
      } catch (e) {
        console.warn('Cost prediction failed', e);
      }

      const execData = await api<ModelResponse>('/api/v1/exec', {
        method: 'POST',
        body: {
          prompt: fullPrompt,
          model: targetModel,
          conversation_id: useMemory && conversationId ? conversationId : undefined,
          use_memory: useMemory,
          max_tokens: maxTokens,
          temperature,
        },
      });

      execData.cost = predictedCost;

      if (isModelA) {
        setResponseA(execData);
        startStreaming(execData.response, setDisplayTextA, setIsStreamingA, streamIntervalA);
      } else {
        setResponseB(execData);
        startStreaming(execData.response, setDisplayTextB, setIsStreamingB, streamIntervalB);
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      const errResponse: ModelResponse = {
        response: 'Failed to execute: ' + errMsg,
        model: targetModel,
        provider: model as any,
        latency_ms: 0,
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
        cost: '0.00000',
      };
      if (isModelA) {
        setResponseA(errResponse);
        setDisplayTextA(errResponse.response);
        setIsStreamingA(false);
      } else {
        setResponseB(errResponse);
        setDisplayTextB(errResponse.response);
        setIsStreamingB(false);
      }
    }
  };

  // ── Run both ──────────────────────────────────────────────────────────────
  const runBoth = async () => {
    setError('');
    setLoading(true);
    setResponseA(null);
    setResponseB(null);
    setDisplayTextA('');
    setDisplayTextB('');
    setIsStreamingA(false);
    setIsStreamingB(false);
    try {
      await Promise.all([executeModel(modelA, true), executeModel(modelB, false)]);
    } catch (e) {
      setError('An error occurred executing prompts.');
    } finally {
      setLoading(false);
    }
  };

  // Save to history when both responses arrive
  useEffect(() => {
    if (!responseA || !responseB || loading) return;
    const winner: 'A' | 'B' | 'tie' =
      responseA.latency_ms < responseB.latency_ms
        ? 'A'
        : responseA.latency_ms > responseB.latency_ms
        ? 'B'
        : 'tie';
    const entry: HistoryEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      promptPreview: userPrompt.slice(0, 50) + (userPrompt.length > 50 ? '…' : ''),
      systemPrompt,
      userPrompt,
      modelA,
      modelB,
      responseA,
      responseB,
      temperature,
      maxTokens,
      winner,
    };
    setHistory((prev) => [entry, ...prev].slice(0, MAX_HISTORY));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [responseA, responseB]);

  // Restore from history
  const restoreEntry = (entry: HistoryEntry) => {
    setSystemPrompt(entry.systemPrompt);
    setUserPrompt(entry.userPrompt);
    setModelA(entry.modelA);
    setModelB(entry.modelB);
    setTemperature(entry.temperature);
    setMaxTokens(entry.maxTokens);
    setResponseA(entry.responseA);
    setResponseB(entry.responseB);
    if (entry.responseA) { setDisplayTextA(entry.responseA.response); setIsStreamingA(false); }
    if (entry.responseB) { setDisplayTextB(entry.responseB.response); setIsStreamingB(false); }
  };

  // Copy helpers
  const copyText = (text: string, isA: boolean) => {
    navigator.clipboard.writeText(text);
    if (isA) { setCopiedA(true); setTimeout(() => setCopiedA(false), 1800); }
    else { setCopiedB(true); setTimeout(() => setCopiedB(false), 1800); }
  };

  // Export audit
  const exportAudit = () => {
    const auditData = {
      timestamp: new Date().toISOString(),
      system_prompt: systemPrompt,
      user_prompt: userPrompt,
      parameters: { maxTokens, temperature, conversationId, useMemory },
      responses: {
        model_a: responseA ? {
          model: responseA.model, provider: responseA.provider,
          latency_ms: responseA.latency_ms,
          tokens: { prompt: responseA.prompt_tokens, completion: responseA.completion_tokens, total: responseA.total_tokens },
          cost: responseA.cost, log_id: responseA.log_id,
        } : null,
        model_b: responseB ? {
          model: responseB.model, provider: responseB.provider,
          latency_ms: responseB.latency_ms,
          tokens: { prompt: responseB.prompt_tokens, completion: responseB.completion_tokens, total: responseB.total_tokens },
          cost: responseB.cost, log_id: responseB.log_id,
        } : null,
      },
    };
    const blob = new Blob([JSON.stringify(auditData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'veklom_audit_' + Date.now() + '.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <Shell>
      <div className="space-y-5 animate-fade-up">

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-1">
          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-[0.18em] text-ink-600">
              Workspace · Execution Surface
            </span>
            <h1 className="text-[28px] font-semibold tracking-tight text-gradient">
              Sovereign Playground
            </h1>
            <p className="text-sm text-ink-400 max-w-2xl mt-1.5">
              Compare local and cloud models side-by-side with streaming output, token diagnostics, and latency analysis.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="flex items-center gap-1.5 bg-[#151515] border border-[#242424] px-2.5 py-1 rounded text-[9px] font-mono font-bold text-brand-400">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
              LIVE
            </span>
            <button
              onClick={exportAudit}
              disabled={!responseA && !responseB}
              className="btn btn-ghost group text-xs py-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              Export Audit
            </button>
          </div>
        </div>

        {/* ── Circuit Breaker Banner ─────────────────────────────────────────── */}
        {circuitBreaker && circuitBreaker.state !== 'CLOSED' && (
          <div className="card border-brand-500/30 bg-brand-500/5 p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-brand-400 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-xs text-brand-400">
                Circuit Breaker Active: {circuitBreaker.state}
              </p>
              <p className="text-[11px] text-ink-400 mt-0.5">
                Local inference pipeline overloaded. Auto-routing to secondary cloud providers.
              </p>
            </div>
            <Pill tone="amber">Auto-fallback active</Pill>
          </div>
        )}

        {/* ── Model Parameters (Collapsible) ────────────────────────────────── */}
        <div className="card overflow-hidden">
          <button
            onClick={() => setIsSystemPromptOpen(!isSystemPromptOpen)}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/[0.01] transition"
          >
            <div className="flex items-center gap-2.5">
              <Cpu size={14} className="text-brand-400" />
              <span className="text-xs font-semibold text-ink-200 uppercase tracking-wider">
                Model Parameters
              </span>
              <span className="text-[9px] font-mono text-ink-600 bg-[#1a1a1a] border border-[#242424] px-1.5 py-0.5 rounded">
                T={temperature.toFixed(2)} · {maxTokens}tk
              </span>
            </div>
            <ChevronDown
              className={clsx(
                'w-4 h-4 text-ink-500 transition-transform duration-200',
                isSystemPromptOpen && 'rotate-180'
              )}
            />
          </button>

          <AnimatePresence initial={false}>
            {isSystemPromptOpen && (
              <motion.div
                key="params-body"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 border-t border-[#242424] pt-5 space-y-5">

                  {/* Preset Roles */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-mono font-bold text-ink-600 uppercase tracking-wider">Preset Roles</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {Object.entries(PRESET_SYSTEM_PROMPTS).map(([key, val]) => (
                        <button
                          key={key}
                          onClick={() => { setSelectedPreset(key); setSystemPrompt(val.prompt); }}
                          className={clsx(
                            'flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[11px] font-mono transition',
                            selectedPreset === key
                              ? 'bg-brand-500/15 border-brand-500/50 text-brand-400'
                              : 'bg-[#111] border-[#1e1e1e] text-ink-400 hover:border-[#333] hover:text-ink-200'
                          )}
                        >
                          <span className="opacity-80">{val.icon}</span>
                          {val.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* System Prompt Textarea */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-mono font-bold text-ink-600 uppercase tracking-wider">System Prompt</p>
                    <textarea
                      value={systemPrompt}
                      onChange={(e) => { setSystemPrompt(e.target.value); setSelectedPreset(''); }}
                      className="input text-sm text-ink-200"
                      rows={3}
                      placeholder="Enter system prompt..."
                    />
                  </div>

                  {/* Sliders Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Temperature slider */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                          <Thermometer size={12} style={{ color: temperatureColor(temperature) }} />
                          <span className="text-[10px] font-mono font-bold text-ink-400 uppercase tracking-wider">Temperature</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-mono text-ink-600">{temperatureLabel(temperature)}</span>
                          <span className="font-mono text-[11px] font-bold" style={{ color: temperatureColor(temperature) }}>
                            {temperature.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      {/* Gradient track + invisible range input overlay */}
                      <div className="relative h-4 flex items-center">
                        <div className="absolute inset-x-0 h-1.5 rounded-full bg-gradient-to-r from-blue-500 via-brand-400 to-red-500 opacity-40" />
                        <div
                          className="absolute h-3.5 w-3.5 rounded-full border-2 border-[#0A0A0A] pointer-events-none transition-all"
                          style={{
                            left: 'calc(' + (temperature / 2) * 100 + '% - 7px)',
                            backgroundColor: temperatureColor(temperature),
                            boxShadow: '0 0 8px ' + temperatureColor(temperature) + '99',
                          }}
                        />
                        <input
                          type="range"
                          min="0" max="2" step="0.05"
                          value={temperature}
                          onChange={(e) => setTemperature(parseFloat(e.target.value))}
                          className="absolute inset-0 w-full opacity-0 cursor-pointer"
                        />
                      </div>
                      <div className="flex justify-between text-[9px] text-ink-600 font-mono">
                        <span>0.0 Cold</span><span>2.0 Chaotic</span>
                      </div>
                    </div>

                    {/* Max Tokens slider */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                          <Layers size={12} className="text-brand-400" />
                          <span className="text-[10px] font-mono font-bold text-ink-400 uppercase tracking-wider">Max Tokens</span>
                        </div>
                        <span className="font-mono text-[11px] font-bold text-brand-400">{maxTokens}</span>
                      </div>
                      <div className="relative h-4 flex items-center">
                        <div className="absolute inset-x-0 h-1.5 rounded-full bg-[#1e1e1e]" />
                        <div
                          className="absolute h-1.5 rounded-full bg-brand-400/50 transition-all"
                          style={{ width: ((maxTokens - 64) / (2048 - 64)) * 100 + '%' }}
                        />
                        <div
                          className="absolute h-3.5 w-3.5 rounded-full bg-brand-400 border-2 border-[#0A0A0A] pointer-events-none"
                          style={{
                            left: 'calc(' + ((maxTokens - 64) / (2048 - 64)) * 100 + '% - 7px)',
                            boxShadow: '0 0 6px rgba(255,184,0,0.5)',
                          }}
                        />
                        <input
                          type="range"
                          min="64" max="2048"
                          value={maxTokens}
                          onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                          className="absolute inset-0 w-full opacity-0 cursor-pointer"
                        />
                      </div>
                      <div className="flex justify-between text-[9px] text-ink-600 font-mono">
                        <span>64</span><span>2048</span>
                      </div>
                    </div>

                    {/* Memory Toggle */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-1.5">
                        <Brain size={12} className="text-brand-400" />
                        <span className="text-[10px] font-mono font-bold text-ink-400 uppercase tracking-wider">
                          Conv. Memory
                        </span>
                      </div>
                      <button
                        onClick={() => setUseMemory(!useMemory)}
                        className={clsx(
                          'flex items-center gap-2.5 px-3 py-2.5 rounded-lg border transition w-full',
                          useMemory
                            ? 'bg-brand-500/10 border-brand-500/40 text-brand-400'
                            : 'bg-[#111] border-[#1e1e1e] text-ink-500'
                        )}
                      >
                        <div className={clsx('w-7 h-4 rounded-full relative transition-colors', useMemory ? 'bg-brand-500' : 'bg-[#333]')}>
                          <div className={clsx('absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform', useMemory ? 'translate-x-3.5' : 'translate-x-0.5')} />
                        </div>
                        <span className="text-[11px] font-mono">{useMemory ? 'Enabled' : 'Disabled'}</span>
                      </button>
                      {useMemory ? (
                        <input
                          type="text"
                          value={conversationId}
                          onChange={(e) => setConversationId(e.target.value)}
                          placeholder="Conversation ID (optional)"
                          className="input text-xs"
                        />
                      ) : (
                        <p className="text-[9px] text-ink-600 font-mono">Isolated context execution only.</p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── User Prompt Input ──────────────────────────────────────────────── */}
        <div className="card p-5 space-y-3">
          <textarea
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            placeholder="Enter execution prompt..."
            className="input text-sm h-28 focus:ring-0 resize-none"
          />

          {/* Quick Templates */}
          <div className="flex flex-wrap gap-1.5">
            {QUICK_TEMPLATES.map((tpl) => (
              <button
                key={tpl}
                onClick={() => setUserPrompt((prev) => prev ? tpl + ' ' + prev : tpl + ' ')}
                className="flex items-center gap-1 bg-[#111] border border-[#1e1e1e] hover:border-brand-500/40 hover:bg-brand-500/5 hover:text-brand-400 text-ink-500 px-2.5 py-1 rounded-full text-[10px] font-mono transition"
              >
                <Sparkles size={9} className="text-brand-400/60" />
                {tpl}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 text-[10px] text-ink-500">
              <Activity size={11} className="text-brand-400 animate-pulse" />
              <span>Ollama Primary ↔ Groq Fallback · Network:</span>
              <span className="text-accent-green font-mono font-bold">ONLINE</span>
            </div>
            <button
              onClick={runBoth}
              disabled={loading || !userPrompt.trim()}
              className="btn btn-primary text-xs px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Activity size={13} className="animate-spin mr-1.5" />
                  Running both...
                </>
              ) : (
                '▶ Run Both Models'
              )}
            </button>
          </div>
        </div>

        {/* ── Error ─────────────────────────────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-2 text-red-400 text-xs font-mono bg-red-500/5 border border-red-500/20 p-3 rounded-lg">
            <XCircle size={13} />
            {error}
          </div>
        )}

        {/* ── Side-by-Side Comparison ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* ── MODEL A ── */}
          <div className="card overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 border-b border-[#242424] bg-white/[0.01] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                <span className="text-[10px] font-mono font-bold text-ink-500 uppercase tracking-wider">Model A Pipeline</span>
                {isStreamingA && (
                  <span className="flex items-center gap-1 bg-brand-500/20 border border-brand-500/40 px-2 py-0.5 rounded text-[9px] font-mono font-bold text-brand-400">
                    <span className="w-1 h-1 rounded-full bg-brand-400 animate-pulse" />
                    STREAMING
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {responseA && (
                  <button onClick={() => copyText(responseA.response, true)} className="p-1 text-ink-600 hover:text-ink-200 transition" title="Copy">
                    {copiedA ? <Check size={12} className="text-accent-green" /> : <Copy size={12} />}
                  </button>
                )}
                <select
                  value={modelA}
                  onChange={(e) => setModelA(e.target.value)}
                  className="bg-bg-950 border border-border rounded px-2.5 py-1 text-xs text-brand-400 font-mono outline-none"
                >
                  <option value="ollama">Ollama (Qwen2.5:3b)</option>
                  <option value="groq">Groq (Llama-3.1-8b)</option>
                </select>
              </div>
            </div>
            <div className="flex-1">
              {loading && !responseA ? (
                <div className="p-10 flex flex-col items-center justify-center gap-3">
                  <div className="flex gap-1">
                    {[0, 0.15, 0.3].map((delay, i) => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: delay + 's' }} />
                    ))}
                  </div>
                  <p className="text-[10px] text-ink-600 font-mono">Executing inference...</p>
                </div>
              ) : responseA ? (
                <div className="p-5 space-y-3">
                  <div className="prose prose-invert max-w-none text-xs text-ink-200 bg-black/30 p-4 rounded-xl border border-border/40 min-h-[140px] max-h-[380px] overflow-y-auto font-sans leading-relaxed">
                    {isStreamingA
                      ? <StreamingText text={displayTextA} isStreaming={isStreamingA} />
                      : <ReactMarkdown>{responseA.response}</ReactMarkdown>
                    }
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 bg-[#111] border border-[#1e1e1e] px-2.5 py-1.5 rounded-lg">
                      <Clock size={10} className="text-brand-400" />
                      <span className="text-[10px] font-mono text-ink-300 font-bold">{responseA.latency_ms} ms</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-[#111] border border-[#1e1e1e] px-2.5 py-1.5 rounded-lg">
                      <Cpu size={10} className="text-brand-400" />
                      <span className="text-[10px] font-mono text-ink-300 font-bold">{responseA.model}</span>
                    </div>
                  </div>
                  {!isStreamingA && <TokenCounterBar response={responseA} maxTokens={maxTokens} />}
                </div>
              ) : (
                <div className="p-10 text-center text-xs text-ink-600 font-mono italic">Awaiting execution results...</div>
              )}
            </div>
          </div>

          {/* ── MODEL B ── */}
          <div className="card overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 border-b border-[#242424] bg-white/[0.01] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-ink-500" />
                <span className="text-[10px] font-mono font-bold text-ink-500 uppercase tracking-wider">Model B Pipeline</span>
                {isStreamingB && (
                  <span className="flex items-center gap-1 bg-brand-500/20 border border-brand-500/40 px-2 py-0.5 rounded text-[9px] font-mono font-bold text-brand-400">
                    <span className="w-1 h-1 rounded-full bg-brand-400 animate-pulse" />
                    STREAMING
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {responseB && (
                  <button onClick={() => copyText(responseB.response, false)} className="p-1 text-ink-600 hover:text-ink-200 transition" title="Copy">
                    {copiedB ? <Check size={12} className="text-accent-green" /> : <Copy size={12} />}
                  </button>
                )}
                <select
                  value={modelB}
                  onChange={(e) => setModelB(e.target.value)}
                  className="bg-bg-950 border border-border rounded px-2.5 py-1 text-xs text-brand-400 font-mono outline-none"
                >
                  <option value="groq">Groq (Llama-3.1-8b)</option>
                  <option value="ollama">Ollama (Qwen2.5:3b)</option>
                </select>
              </div>
            </div>
            <div className="flex-1">
              {loading && !responseB ? (
                <div className="p-10 flex flex-col items-center justify-center gap-3">
                  <div className="flex gap-1">
                    {[0, 0.15, 0.3].map((delay, i) => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-ink-500 animate-bounce" style={{ animationDelay: delay + 's' }} />
                    ))}
                  </div>
                  <p className="text-[10px] text-ink-600 font-mono">Executing inference...</p>
                </div>
              ) : responseB ? (
                <div className="p-5 space-y-3">
                  <div className="prose prose-invert max-w-none text-xs text-ink-200 bg-black/30 p-4 rounded-xl border border-border/40 min-h-[140px] max-h-[380px] overflow-y-auto font-sans leading-relaxed">
                    {isStreamingB
                      ? <StreamingText text={displayTextB} isStreaming={isStreamingB} />
                      : <ReactMarkdown>{responseB.response}</ReactMarkdown>
                    }
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 bg-[#111] border border-[#1e1e1e] px-2.5 py-1.5 rounded-lg">
                      <Clock size={10} className="text-brand-400" />
                      <span className="text-[10px] font-mono text-ink-300 font-bold">{responseB.latency_ms} ms</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-[#111] border border-[#1e1e1e] px-2.5 py-1.5 rounded-lg">
                      <Cpu size={10} className="text-brand-400" />
                      <span className="text-[10px] font-mono text-ink-300 font-bold">{responseB.model}</span>
                    </div>
                  </div>
                  {!isStreamingB && <TokenCounterBar response={responseB} maxTokens={maxTokens} />}
                </div>
              ) : (
                <div className="p-10 text-center text-xs text-ink-600 font-mono italic">Awaiting execution results...</div>
              )}
            </div>
          </div>
        </div>

        {/* ── Latency Comparison (appears after both complete) ──────────────── */}
        <AnimatePresence>
          {responseA && responseB && !isStreamingA && !isStreamingB && (
            <LatencyComparisonBars
              responseA={responseA}
              responseB={responseB}
              modelALabel={modelALabel}
              modelBLabel={modelBLabel}
            />
          )}
        </AnimatePresence>

        {/* ── History Panel ─────────────────────────────────────────────────── */}
        <HistoryPanel history={history} onRestore={restoreEntry} onClear={() => setHistory([])} />

      </div>
    </Shell>
  );
}
