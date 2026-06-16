// @ts-nocheck
"use client";
import { useState } from "react";
import { HARDENED_FILES, CodeFile } from "../data/hardenedCode";
import { FileCode, Clipboard, Check, Download, AlertCircle, Cpu } from "lucide-react";

export default function CodeExplorer() {
  const [selectedIdx, setSelectedIdx] = useState(1); // default to ledger_impl.py
  const [copied, setCopied] = useState(false);

  const file: CodeFile = HARDENED_FILES[selectedIdx];

  const handleCopy = () => {
    navigator.clipboard.writeText(file.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const docFile = new Blob([file.code], { type: "text/plain" });
    element.href = URL.createObjectURL(docFile);
    element.download = file.name;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div id="code-explorer-root" className="grid grid-cols-1 lg:grid-cols-4 gap-6 bg-white/40 p-4 sm:p-6 rounded-none border border-[#141414] shadow-[4px_4px_0px_0px_rgba(20,20,20,0.15)]">
      {/* File Sidebar */}
      <div className="lg:col-span-1 space-y-3">
        <h3 className="text-xs font-black uppercase tracking-widest text-[#141414] mb-3 px-2 flex items-center gap-2">
          <FileCode className="h-4 w-4 text-[#141414]" />
          Hardened File Tree
        </h3>
        <div className="space-y-1">
          {HARDENED_FILES.map((f, idx) => {
            const isSelected = selectedIdx === idx;
            return (
              <button
                key={f.path}
                id={`btn-code-file-${f.name.replace(/\./g, "-")}`}
                onClick={() => {
                  setSelectedIdx(idx);
                  setCopied(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-none transition-all duration-150 flex items-center justify-between group border ${
                  isSelected
                    ? "bg-[#141414] text-[#E4E3E0] font-bold border-[#141414]"
                    : "text-[#141414] hover:bg-[#141414]/10 bg-white/20 border-[#141414]/10"
                }`}
              >
                <div className="truncate pr-1">
                  <div className="text-sm font-mono truncate">{f.name}</div>
                  <div className={`text-[10px] truncate mt-0.5 font-mono ${isSelected ? 'text-[#E4E3E0]/70' : 'text-slate-500'}`}>{f.path}</div>
                </div>
                <span className={`status-pill shrink-0 ${
                  isSelected 
                    ? "border-white/50 text-white bg-[#141414]" 
                    : f.language === "sql" 
                    ? "bg-indigo-100 text-indigo-900 border-indigo-900/50" 
                    : "bg-amber-100 text-amber-900 border-amber-900/50"
                }`}>
                  {f.language}
                </span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Improvement Indicator */}
        <div className="hidden lg:block bg-white/70 p-4 rounded-none border border-[#141414] mt-4 space-y-3 shadow-[2px_2px_0px_rgba(20,20,20,0.1)]">
          <h4 className="text-xs font-bold text-[#141414] flex items-center gap-1.5 uppercase tracking-wider">
            <Cpu className="h-3.5 w-3.5 text-[#141414]" />
            File Context
          </h4>
          <p className="text-xs text-[#141414]/80 leading-relaxed font-sans">
            {file.description}
          </p>
        </div>
      </div>

      {/* Editor & Enhancements Block */}
      <div className="lg:col-span-3 space-y-4 flex flex-col">
        {/* Banner with File path & Copy Operations */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-[#141414] text-[#E4E3E0] px-4 py-3 rounded-none border border-[#141414] gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-none bg-[#00FF00] shadow-[0_0_8px_#00FF00]" />
            <span className="text-xs font-mono tracking-tight">{file.path}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="copy-to-clipboard-btn"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase cursor-pointer rounded-none bg-[#E4E3E0] text-[#141414] border border-[#E4E3E0] hover:invert transition-all"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Clipboard className="h-3.5 w-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
            <button
              id="download-code-file-btn"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase cursor-pointer rounded-none bg-[#E4E3E0] text-[#141414] border border-[#E4E3E0] hover:invert transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* Double pane: code displaying & corresponding production fixes */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          {/* Main IDE editor screen */}
          <div className="xl:col-span-3 bg-white p-4 rounded-none border border-[#141414] font-mono text-xs overflow-auto max-h-[480px] min-h-[300px] shadow-inner text-[#141414] relative">
            <pre className="whitespace-pre">{file.code}</pre>
          </div>

          {/* Side panel displaying specific production hardening details */}
          <div className="xl:col-span-2 bg-white/70 p-4 rounded-none border border-[#141414] flex flex-col justify-between shadow-[2px_2px_0px_rgba(20,20,20,0.1)]">
            <div>
              <h4 className="text-xs font-bold text-[#141414] flex items-center gap-1.5 uppercase tracking-wider mb-3">
                <AlertCircle className="h-4 w-4 text-[#141414]" />
                Hardening Audits
              </h4>
              <ul className="space-y-3">
                {file.improvements.map((imp, i) => (
                  <li key={i} className="flex gap-2 text-[#141414]">
                    <span className="font-extrabold text-[#141414] shrink-0 select-none text-xs">{i + 1}.</span>
                    <span className="text-xs leading-relaxed font-sans">{imp}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-[#141414]/10 text-[10px] text-[#141414]/60 leading-relaxed font-mono">
              VERIFIED COMPATIBLE: FastMCP 1.0.4 • Redis 7.2 • PostgreSQL (numeric 18,6)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

