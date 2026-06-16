// @ts-nocheck
"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Clipboard, Terminal, Shield, Cpu, Zap, Activity } from 'lucide-react';

interface Tool {
  name: string;
  description: string;
  inputSchema: any;
}

export const ToolExecutor: React.FC = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [args, setArgs] = useState<string>('{}');
  const [isJsonValid, setIsJsonValid] = useState(true);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTools();
  }, []);

  useEffect(() => {
    try {
      if (args.trim() === '') {
        setIsJsonValid(true);
        setJsonError(null);
        return;
      }
      JSON.parse(args);
      setIsJsonValid(true);
      setJsonError(null);
    } catch (e: any) {
      setIsJsonValid(false);
      setJsonError(e.message);
    }
  }, [args]);

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(args);
      setArgs(JSON.stringify(parsed, null, 2));
    } catch (e: any) {
      setError(`Format failed: ${e.message}`);
    }
  };

  const fetchTools = async () => {
    try {
      const res = await fetch('/api/mcp/tools');
      const data = await res.json();
      setTools(data.tools || []);
    } catch (e) {
      console.error('Failed to fetch tools', e);
    }
  };

  const handleRun = async () => {
    if (!selectedTool) return;
    if (!isJsonValid) {
      setError(`Cannot execute: ${jsonError}`);
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const parsedArgs = args.trim() === '' ? {} : JSON.parse(args);
      
      const res = await fetch('/api/mcp/tools/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: selectedTool.name, arguments: parsedArgs }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.details || 'Execution failed');
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 h-full bg-[#0b1219]/40 rounded-2xl border border-cyan-900/30 overflow-auto scrollbar-hide">
      <div className="flex items-center gap-2 mb-2">
        <Terminal className="w-5 h-5 text-cyan-400" />
        <h2 className="text-sm font-bold tracking-[0.2em] text-cyan-500 uppercase">MCP Tool Orchestrator</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tool List */}
        <div className="flex flex-col gap-2">
          <div className="text-[10px] uppercase tracking-widest text-cyan-500/50 mb-1">Available Primitives</div>
          <div className="flex flex-col gap-2">
            {tools.map((tool) => (
              <button
                key={tool.name}
                onClick={() => setSelectedTool(tool)}
                className={`flex flex-col p-3 rounded-xl border transition-all text-left ${
                  selectedTool?.name === tool.name
                    ? 'bg-cyan-500/10 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                    : 'bg-[#0f172a]/40 border-cyan-900/20 hover:border-cyan-500/30'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`text-sm font-medium ${selectedTool?.name === tool.name ? 'text-cyan-400' : 'text-slate-300'}`}>
                    {tool.name}
                  </span>
                  {selectedTool?.name === tool.name && <Zap className="w-3 h-3 text-cyan-400 fill-cyan-400" />}
                </div>
                <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {tool.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Execution Area */}
        <div className="flex flex-col gap-4">
          <AnimatePresence mode="wait">
            {selectedTool ? (
              <motion.div
                key={selectedTool.name}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex flex-col gap-4"
              >
                <div className="bg-[#0f172a]/60 p-4 rounded-xl border border-cyan-500/20 backdrop-blur-sm">
                  <div className="text-[10px] uppercase tracking-widest text-cyan-400 mb-3 flex items-center gap-2">
                    <Cpu className="w-3 h-3" /> Parameter Synthesis
                  </div>
                  
                  <div className="flex flex-col gap-2 relative">
                    <div className="flex justify-between items-center">
                      <label className="text-[9px] text-slate-500 uppercase tracking-tighter">Arguments (JSON)</label>
                      <button 
                        onClick={handleFormat}
                        className="text-[9px] text-cyan-500 hover:text-cyan-400 font-mono uppercase tracking-tighter"
                      >
                        [ Format ]
                      </button>
                    </div>
                    <textarea
                      value={args}
                      onChange={(e) => setArgs(e.target.value)}
                      className={`w-full h-32 bg-black/40 border rounded-lg p-3 font-mono text-xs outline-none transition-all ${
                        isJsonValid 
                          ? 'border-cyan-900/40 text-cyan-300 focus:border-cyan-500/50' 
                          : 'border-red-500/50 text-red-300 focus:border-red-500'
                      }`}
                      placeholder='{"param": "value"}'
                    />
                    {!isJsonValid && (
                      <div className="text-[8px] text-red-500 font-mono mt-1">
                        Parse Error: {jsonError}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleRun}
                    disabled={loading}
                    className={`mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-xs tracking-widest uppercase transition-all ${
                      loading
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                    }`}
                  >
                    {loading ? (
                      <Activity className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Play className="w-3 h-3 fill-current" />
                        Execute Primitive
                      </>
                    )}
                  </button>
                </div>

                {/* Result Display */}
                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-black/60 p-4 rounded-xl border border-green-500/20"
                  >
                    <div className="text-[10px] uppercase tracking-widest text-green-400 mb-2 flex items-center gap-2">
                      <Shield className="w-3 h-3" /> Execution Trace
                    </div>
                    <pre className="text-[10px] font-mono text-green-500/80 overflow-auto max-h-48 whitespace-pre-wrap">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </motion.div>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/10 p-4 rounded-xl border border-red-500/20"
                  >
                    <div className="text-[10px] uppercase tracking-widest text-red-400 mb-1">Fault Detected</div>
                    <p className="text-[10px] text-red-300 font-mono">{error}</p>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <div className="flex items-center justify-center h-64 border border-dashed border-cyan-900/30 rounded-xl bg-cyan-900/5">
                <div className="text-[10px] text-cyan-900 uppercase tracking-widest text-center">
                  Select a primitive<br />to begin execution
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

