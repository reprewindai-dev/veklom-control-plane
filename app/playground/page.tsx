'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ShieldCheck, Activity, Zap, Cpu,
  Sparkles, Check, AlertTriangle, Layers, Fingerprint, Network, ShieldAlert,
  Database, GitBranch, Swords, Send, User, Bot
} from 'lucide-react';
import Shell from '@/components/Shell';
import { api, duelApi } from '@/lib/api';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: 'user' | 'agent1' | 'agent2' | 'system';
  content: string;
  timestamp: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STREAM_WORD_DELAY_MS = 25;

function StreamingText({ text, isStreaming }: { text: string; isStreaming: boolean }) {
  return (
    <span className="font-mono text-[13px] leading-relaxed text-ink-200 whitespace-pre-wrap">
      {text}
      {isStreaming && (
        <span className="inline-block w-[6px] h-[14px] ml-1 bg-brand-400 align-middle animate-pulse" />
      )}
    </span>
  );
}

export default function SwarmAssemblyMatrix() {
  const [executionMode, setExecutionMode] = useState<'CAPI' | 'DUEL'>('DUEL');
  
  // Debate State
  const [topic, setTopic] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Agents
  const [agent1Theme, setAgent1Theme] = useState('Crypto Native Maxy');
  const [agent2Theme, setAgent2Theme] = useState('Traditional Finance Skeptic');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, displayText]);

  // Cleanup streaming on unmount
  useEffect(() => {
    return () => {
      if (streamInterval.current) clearInterval(streamInterval.current);
    };
  }, []);

  const startStreaming = useCallback((messageId: string, fullText: string) => {
    if (streamInterval.current) clearInterval(streamInterval.current);
    const words = fullText.split(' ');
    let idx = 0;
    setDisplayText('');
    setStreamingMessageId(messageId);
    
    streamInterval.current = setInterval(() => {
      idx++;
      setDisplayText(words.slice(0, idx).join(' '));
      if (idx >= words.length) {
        clearInterval(streamInterval.current!);
        streamInterval.current = null;
        setStreamingMessageId(null);
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content: fullText } : m));
      }
    }, STREAM_WORD_DELAY_MS);
  }, []);

  const runCapiTest = async () => {
    if (!topic.trim()) return;
    setError('');
    setLoading(true);
    
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: topic, timestamp: new Date().toLocaleTimeString() };
    setMessages(prev => [...prev, userMsg]);
    setTopic('');

    try {
      // Route to Main API
      const execData = await api<any>('/api/v1/exec', {
        method: 'POST',
        body: { prompt: topic, model: 'llama-3.1-8b-instant', use_memory: false, max_tokens: 1024, temperature: 0.2 },
      });
      
      const agentMsgId = (Date.now() + 1).toString();
      const agentMsg: ChatMessage = { id: agentMsgId, role: 'system', content: '', timestamp: new Date().toLocaleTimeString() };
      setMessages(prev => [...prev, agentMsg]);
      startStreaming(agentMsgId, execData.response || 'No response generated.');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Execution Failed');
    } finally {
      setLoading(false);
    }
  };

  const runAgentDuel = async () => {
    if (!topic.trim()) return;
    setError('');
    setLoading(true);

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: `Topic: ${topic}\nAgent 1: ${agent1Theme}\nAgent 2: ${agent2Theme}`, timestamp: new Date().toLocaleTimeString() };
    setMessages(prev => [...prev, userMsg]);
    
    try {
      // We ping the duel API to generate the next turn. 
      // If the backend has a /api/chat route, we use it. We'll simulate a multi-step debate here by chaining.
      const payload = {
        messages: [{ role: 'user', content: topic }],
        agent1Params: { theme: agent1Theme },
        agent2Params: { theme: agent2Theme },
      };

      // Try hitting the Vercel Edge API
      let replyText = '';
      try {
        const response = await duelApi<any>('/api/chat', {
          method: 'POST',
          body: payload
        });
        replyText = response.response || response.message || response.content || JSON.stringify(response);
      } catch (duelErr) {
        // Fallback to main API if Duel API is unreachable/unstructured
        const fallback = await api<any>('/api/v1/exec', {
          method: 'POST',
          body: { prompt: `Simulate a debate between ${agent1Theme} and ${agent2Theme} about ${topic}. Provide Agent 1's opening argument.`, model: 'llama-3.1-8b-instant', max_tokens: 500 }
        });
        replyText = fallback.response;
      }

      const agentMsgId = (Date.now() + 1).toString();
      const agentMsg: ChatMessage = { id: agentMsgId, role: 'agent1', content: '', timestamp: new Date().toLocaleTimeString() };
      setMessages(prev => [...prev, agentMsg]);
      startStreaming(agentMsgId, replyText);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Duel Execution Failed');
    } finally {
      setLoading(false);
      setTopic('');
    }
  };

  return (
    <Shell>
      <div className="space-y-6 animate-fade-up max-w-[1400px] mx-auto h-[calc(100vh-100px)] flex flex-col">

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-2 border-b border-[#242424] pb-6 shrink-0">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded bg-brand-500/20 text-brand-400">
                <Layers size={14} />
              </span>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-brand-400 font-bold">
                Control Plane · Swarm Operations
              </span>
            </div>
            <h1 className="text-[32px] font-bold tracking-tight text-white">
              Swarm Assembly & Debug Matrix
            </h1>
            <p className="text-sm text-ink-400 max-w-3xl">
              Construct, test, and pit autonomous agents against each other. 
              Live-wire multi-backend routing between the main CAPI node and the Base Duel Arena.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="flex items-center gap-2 bg-[#0a0a0a] border border-[#333] px-3 py-1.5 rounded text-[10px] font-mono font-bold text-accent-green">
              <Network size={12} />
              Dual-Node Active
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
          
          {/* ── Left Column: Configuration ────────────────────── */}
          <div className="lg:col-span-4 space-y-4 flex flex-col h-full overflow-y-auto custom-scrollbar">
            
            {/* Mode Selector */}
            <div className="bg-[#111] border border-[#242424] rounded-xl p-1 flex relative shrink-0">
              <div 
                className="absolute inset-y-1 transition-all duration-300 ease-out bg-[#1a1a1a] border border-[#333] rounded-lg shadow-sm"
                style={{
                  left: executionMode === 'CAPI' ? '4px' : 'calc(50% + 2px)',
                  width: 'calc(50% - 6px)',
                }}
              />
              <button 
                onClick={() => setExecutionMode('CAPI')}
                className={clsx(
                  "relative flex-1 flex flex-col items-center justify-center gap-1 py-3 px-4 rounded-lg z-10 transition-colors",
                  executionMode === 'CAPI' ? "text-white" : "text-ink-500 hover:text-ink-300"
                )}
              >
                <Database size={16} className={executionMode === 'CAPI' ? "text-ink-300" : ""} />
                <span className="text-[11px] font-bold tracking-wide">CAPI Gateway</span>
              </button>
              <button 
                onClick={() => setExecutionMode('DUEL')}
                className={clsx(
                  "relative flex-1 flex flex-col items-center justify-center gap-1 py-3 px-4 rounded-lg z-10 transition-colors",
                  executionMode === 'DUEL' ? "text-brand-400" : "text-ink-500 hover:text-ink-300"
                )}
              >
                <Swords size={16} />
                <span className="text-[11px] font-bold tracking-wide">Agent Duel Arena</span>
              </button>
            </div>

            <div className="bg-[#0a0a0a] border border-[#242424] rounded-xl p-5 shadow-xl shrink-0">
              <h3 className="text-[11px] font-mono font-bold text-ink-300 uppercase tracking-widest flex items-center gap-2 mb-4">
                <Activity size={14} className="text-brand-400" /> Active Backend Target
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-[#111] border border-brand-500/20 rounded-lg">
                  <div>
                    <p className="text-[10px] font-mono font-bold text-white mb-0.5">
                      {executionMode === 'DUEL' ? 'Base Agent Duel Node' : 'Main CAPI Inference Node'}
                    </p>
                    <p className="text-[9px] font-mono text-ink-500">
                      {executionMode === 'DUEL' ? 'veklom-agent-duel.vercel.app' : 'api.veklom.com (Hetzner)'}
                    </p>
                  </div>
                  <span className="flex items-center gap-1 text-[9px] font-mono font-bold text-accent-green px-2 py-1 bg-emerald-500/10 rounded">
                    <Check size={10} /> WIRED
                  </span>
                </div>
              </div>
            </div>

            {/* Duel Config */}
            <AnimatePresence>
              {executionMode === 'DUEL' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-[#050505] border border-[#242424] rounded-xl p-5 shadow-xl space-y-4">
                    <h3 className="text-[11px] font-mono font-bold text-ink-300 uppercase tracking-widest flex items-center gap-2 mb-2">
                      <Swords size={14} className="text-brand-400" /> Combatant Assembly
                    </h3>
                    
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-mono text-ink-500 uppercase tracking-widest">Agent Alpha Profile</label>
                      <input 
                        value={agent1Theme} onChange={e => setAgent1Theme(e.target.value)}
                        className="w-full bg-[#111] border border-[#242424] rounded-lg px-3 py-2 text-xs font-mono text-brand-300 focus:border-brand-500/50 outline-none"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-mono text-ink-500 uppercase tracking-widest">Agent Beta Profile</label>
                      <input 
                        value={agent2Theme} onChange={e => setAgent2Theme(e.target.value)}
                        className="w-full bg-[#111] border border-[#242424] rounded-lg px-3 py-2 text-xs font-mono text-red-300 focus:border-red-500/50 outline-none"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
          </div>

          {/* ── Right Column: Execution Stream ───────────────────────────── */}
          <div className="lg:col-span-8 flex flex-col h-full min-h-0 bg-[#050505] border border-[#242424] rounded-xl overflow-hidden shadow-2xl relative">
            
            {/* Output Header */}
            <div className="px-5 py-3 border-b border-[#242424] bg-[#0a0a0a] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded bg-[#1a1a1a] border border-[#333]">
                  <Sparkles size={12} className={loading || streamingMessageId ? "text-brand-400" : "text-ink-600"} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Debug Matrix Output</h3>
                  <p className="text-[10px] font-mono text-ink-500">Live Socket Connection</p>
                </div>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar flex flex-col gap-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-ink-600 space-y-4">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#333] flex items-center justify-center">
                    <Cpu size={24} className="text-ink-500 opacity-50" />
                  </div>
                  <p className="text-xs uppercase tracking-widest font-mono">System Idle - Awaiting Assembly</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={clsx(
                    "max-w-[85%] p-4 rounded-xl",
                    msg.role === 'user' ? "bg-[#111] border border-[#333] self-end" :
                    msg.role === 'agent1' ? "bg-brand-500/5 border border-brand-500/20 self-start" :
                    msg.role === 'agent2' ? "bg-red-500/5 border border-red-500/20 self-start" :
                    "bg-[#0a0a0a] border border-[#242424] self-start"
                  )}>
                    <div className="flex items-center gap-2 mb-2">
                      {msg.role === 'user' && <User size={12} className="text-ink-400" />}
                      {(msg.role === 'agent1' || msg.role === 'agent2' || msg.role === 'system') && <Bot size={12} className={msg.role === 'agent1' ? 'text-brand-400' : msg.role === 'agent2' ? 'text-red-400' : 'text-emerald-400'} />}
                      <span className="text-[10px] font-mono font-bold text-ink-500 uppercase tracking-widest">
                        {msg.role === 'user' ? 'Operator' : msg.role === 'agent1' ? agent1Theme : msg.role === 'agent2' ? agent2Theme : 'CAPI Node'}
                      </span>
                      <span className="text-[9px] font-mono text-ink-600 ml-auto">{msg.timestamp}</span>
                    </div>
                    {streamingMessageId === msg.id ? (
                      <StreamingText text={displayText} isStreaming={true} />
                    ) : (
                      <div className="font-mono text-[13px] leading-relaxed text-ink-200 whitespace-pre-wrap">{msg.content}</div>
                    )}
                  </div>
                ))
              )}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-xs font-mono flex items-start gap-3">
                  <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                  <p>Execution Terminated: {error}</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-4 bg-[#111] border-t border-[#242424] shrink-0">
              <div className="relative">
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      executionMode === 'DUEL' ? runAgentDuel() : runCapiTest();
                    }
                  }}
                  placeholder={executionMode === 'DUEL' ? "Enter a debate topic to initiate the Base Swarm..." : "Enter a CAPI execution intent..."}
                  className="w-full bg-[#0a0a0a] border border-[#242424] rounded-xl pl-4 pr-14 py-3 text-[13px] font-mono text-white placeholder-ink-600 focus:outline-none focus:border-brand-500/50 resize-none h-[60px]"
                />
                <button
                  onClick={executionMode === 'DUEL' ? runAgentDuel : runCapiTest}
                  disabled={loading || !topic.trim()}
                  className="absolute right-2 top-2 p-2 rounded-lg bg-brand-500 text-black hover:bg-brand-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </Shell>
  );
}
