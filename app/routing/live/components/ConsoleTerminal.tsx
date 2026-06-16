// @ts-nocheck
"use client";
import React, { useRef, useEffect } from 'react';
import { Terminal, Trash2, Copy, Check, ShieldAlert } from 'lucide-react';

interface ConsoleTerminalProps {
  logs: string[];
  onClear: () => void;
}

export default function ConsoleTerminal({ logs, onClear }: ConsoleTerminalProps) {
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    // Scroll to bottom whenever logs update
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleCopyLogs = () => {
    const rawText = logs.map(line => line.replace(/\[\d{2}:\d{2}:\d{2}\]/g, '')).join('\n');
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="system-console-terminal" className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl h-80">
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2 text-slate-400 font-mono">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span>telemetry_stream_stdout</span>
          <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-800 text-slate-300 border border-slate-700">STDOUT / CJS</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLogs}
            id="btn-copy-terminal-logs"
            className="p-1 px-2 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 font-mono text-[10px]"
            title="Copy entire log output" 
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
          <button
            onClick={onClear}
            id="btn-clear-terminal-logs"
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
            title="Clear active system logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Log Console */}
      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2">
            <ShieldAlert className="w-8 h-8 text-slate-700 stroke-[1.5]" />
            <span className="text-[11px] tracking-wider text-slate-500">NO ACTIVE LOG SIGNALS. TRIGGER A FAILURE SEQUENCE ABOVE.</span>
          </div>
        ) : (
          logs.map((log, idx) => {
            // Context highlights
            let logColor = 'text-slate-300';
            if (log.includes('CRITICAL') || log.includes('SocketException') || log.includes('Out of Memory') || log.includes('thermal overload') || log.includes('failed')) {
              logColor = 'text-rose-400 font-medium';
            } else if (log.includes('SUCCESS') || log.includes('mitigated') || log.includes('Perfect Match') || log.includes('409 Conflict') || log.includes('202 Accepted') || log.includes('reclaimed')) {
              logColor = 'text-emerald-400';
            } else if (log.includes('WARN') || log.includes('timeout') || log.includes('exceeded') || log.includes('Duplicate') || log.includes('thermal') || log.includes('drift')) {
              logColor = 'text-amber-400';
            } else if (log.includes('redis.set') || log.includes('struct.pack') || log.includes('redis.eval')) {
              logColor = 'text-indigo-300 font-medium';
            } else if (log.startsWith('>>')) {
              logColor = 'text-blue-400';
            }

            return (
              <div key={idx} id={`terminal-log-line-${idx}`} className={`leading-relaxed break-all flex gap-2 ${logColor}`}>
                <span className="text-slate-600 select-none">{idx + 1}</span>
                <span>{log}</span>
              </div>
            );
          })
        )}
        <div ref={terminalEndRef} />
      </div>

      {/* Embedded Terminal Footer Status */}
      <div className="bg-slate-950 border-t border-slate-800 px-4 py-1.5 text-[10px] text-slate-500 font-mono flex justify-between items-center">
        <span>Encoding: IEEE 754 LE</span>
        <span>Buffer Status: Nominal</span>
      </div>
    </div>
  );
}

