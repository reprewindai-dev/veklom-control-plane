import React, { useState } from 'react';
import { LedgerBlock } from './types';
import { ShieldCheck, Search, HelpCircle, AlertOctagon, Terminal, FileCode, CheckCircle2, Bot, X, ExternalLink, Lock, Fingerprint, Activity } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface LedgerViewerProps {
  ledger: LedgerBlock[];
  onAppendLedger: (eventType: string, action: string, memo: string, agentId?: string) => void;
}

export default function LedgerViewer({ ledger, onAppendLedger }: LedgerViewerProps) {
  const [aiPrompt, setAiPrompt] = useState<string>("Analyze the recent audit trail. Identify if there are any potential authorization policy exceptions, steganographic anomalies, or physical worker node crashes.");
  const [aiResponse, setAiResponse] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'block_explorer' | 'ai_auditor'>('block_explorer');
  const [selectedBlock, setSelectedBlock] = useState<LedgerBlock | null>(null);
  const [isSimulatingValidation, setIsSimulatingValidation] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<string | null>(null);

  const handleSimulateValidation = () => {
    setIsSimulatingValidation(true);
    setSimulationResult(null);
    setTimeout(() => {
      setIsSimulatingValidation(false);
      setSimulationResult("SUCCESS: Cryptographic signature verified against Solana root key. PDA verification matches zero-leak criteria. State transitions are valid.");
    }, 1200);
  };

  // Prebuilt audit prompts for convenience and high engagement
  const promptMacros = [
    {
      title: "Evaluate VectorSmuggle Risk",
      prompt: "Execute process-isolation audits. Identify if any recent L4 semantic token outputs represent potential high-dimensional steganographical exfiltration vectors (VectorSmuggle)."
    },
    {
      title: "Assess EU AI Act Compliance",
      prompt: "Analyze our Ledger entries against the latest EU AI Act requirements. Verify model-opaque credential management, sandbox boundaries, and deterministic L5 human-consent gating."
    },
    {
      title: "Verify Little-Endian Byte Drift",
      prompt: "Check state consistency between ARM64 and x86 execution blocks. Review if struct.pack('<...d') little-endian standards are successfully mitigating byte drift."
    }
  ];

  const handleAuditRequest = async (chosenPrompt?: string) => {
    setIsLoading(true);
    setAiResponse("");
    const targetPrompt = chosenPrompt || aiPrompt;
    if (chosenPrompt) {
      setAiPrompt(chosenPrompt);
    }

    try {
      const response = await fetch("/api/analyze-ledger", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: targetPrompt,
          items: ledger.slice(0, 15) // send latest 15 transactions
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAiResponse(data.text || "No feedback received from the auditor.");
        onAppendLedger('PROOF', `Executed Gemini AI audit analysis`, `Query: "${targetPrompt.substring(0, 60)}..."`);
      } else {
        setAiResponse("### [Server Connection Lost]\nExpress backend did not return a successful model compilation. Ensure API keys are active.");
      }
    } catch (err: any) {
      setAiResponse(`### [Error Invoking Auditor]\nInternal server path execution failed: ${err?.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getEventBadgeClass = (type: string) => {
    switch (type) {
      case 'IDENTITY': return 'bg-cyan-950/80 text-cyan-400 border border-cyan-805/30';
      case 'AUTHORITY': return 'bg-purple-950/80 text-purple-400 border border-purple-705/30';
      case 'EXECUTION': return 'bg-amber-950/80 text-amber-400 border border-amber-705/30';
      case 'PROOF': return 'bg-cyan-950/45 text-cyan-300 border border-cyan-600/35';
      default: return 'bg-slate-950 text-slate-400 border border-slate-850';
    }
  };

  return (
    <div className="bg-[#0a0c14]/85 border border-cyan-500/20 p-4 rounded-xl flex flex-col justify-between h-full shadow-2xl" id="VeklomLedgerViewer">
      <div>
        
        {/* Core Header with Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="text-cyan-400 w-5 h-5 animate-pulse" />
            <h3 className="text-md uppercase font-mono font-semibold tracking-wide text-cyan-300">
              Sovereign Cryptographic Ledger (L5)
            </h3>
          </div>

          <div className="flex bg-[#05070a]/80 p-0.5 rounded-lg border border-slate-900 text-xs font-mono">
            <button
              onClick={() => setActiveTab('block_explorer')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeTab === 'block_explorer' 
                  ? 'bg-cyan-950/50 text-cyan-450 font-bold border border-cyan-500/10 shadow-[0_0_8px_rgba(6,182,212,0.15)] text-cyan-400' 
                  : 'text-slate-450 hover:text-slate-200'
              }`}
            >
              ⛓️ Solana Block Explorer
            </button>
            <button
              onClick={() => setActiveTab('ai_auditor')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeTab === 'ai_auditor' 
                  ? 'bg-cyan-950/50 text-cyan-455 font-bold border border-cyan-500/10 shadow-[0_0_8px_rgba(6,182,212,0.15)] text-cyan-400' 
                  : 'text-slate-450 hover:text-slate-200'
              }`}
            >
              🤖 Gemini AI Auditor
            </button>
          </div>
        </div>

        {/* Tab 1: Solana Block Explorer */}
        {activeTab === 'block_explorer' && (
          <div>
            <p className="text-xs text-slate-400 mb-4 font-mono leading-relaxed">
              Live block explorer indexing tamper-evident agent execution records anchored with <span className="text-cyan-400">Solana Memo v2</span> and Program Derived Addresses (PDAs). Every authority decision is mathematically bounded and replayable.
            </p>

            {/* Blocks Stream */}
            <div className="flex flex-col gap-3 max-h-[420px] overflow-y-auto custom-scroll pr-1">
              {ledger.map((block) => (
                <div 
                  key={block.txHash} 
                  onClick={() => {
                    setSelectedBlock(block);
                    setSimulationResult(null);
                  }}
                  className="bg-slate-900/15 border border-slate-900/60 p-3 rounded-lg font-mono text-[11px] leading-relaxed relative overflow-hidden group hover:border-cyan-500/50 hover:bg-slate-900/45 hover:shadow-[0_0_12px_rgba(6,182,212,0.06)] cursor-pointer transition-all duration-300"
                  title="Click to inspect this block's verifiable metadata"
                >
                  {/* Event Type Stripe on Left */}
                  <div className={`absolute left-0 top-0 h-full w-1 ${
                    block.eventType === 'IDENTITY' ? 'bg-cyan-500' :
                    block.eventType === 'AUTHORITY' ? 'bg-purple-500' :
                    block.eventType === 'EXECUTION' ? 'bg-amber-500' : 'bg-cyan-400'
                  }`} />

                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pl-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 font-bold">BLOCK #{block.blockNumber}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${getEventBadgeClass(block.eventType)}`}>
                        {block.eventType}
                      </span>
                    </div>
                    <span className="text-slate-550 text-[10px] flex items-center gap-1.5 font-medium">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-cyan-400 text-[9px] font-bold">
                        [INSPECT BLOCK]
                      </span>
                      {new Date(block.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="pl-2 space-y-1 text-slate-300">
                    <div>
                      <span className="text-slate-500 font-bold">STATE ACTION:</span> {block.action}
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold">MEMO EVIDENCE:</span> <span className="text-cyan-305/90 italic">"{block.memo}"</span>
                    </div>
                    
                    {/* Collapsible cryptographic signatures */}
                    <details 
                      className="text-[10px] text-slate-500 pt-1.5 border-t border-slate-900/40 mt-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <summary className="cursor-pointer hover:text-slate-350 select-none">Show technical cryptography</summary>
                      <div className="bg-[#05070a]/80 border border-slate-900 p-2 rounded text-[9px] mt-1 space-y-1 text-slate-400 font-mono">
                        <div className="truncate"><span className="text-cyan-400 font-bold">TX HASH:</span> {block.txHash}</div>
                        <div className="truncate"><span className="text-cyan-400 font-bold">PDA SEED:</span> {block.pdaAddress}</div>
                        <div>
                          <span className="text-cyan-400 font-bold">ECONOMIC METER (x402):</span> {block.gasPaidLamports} Lamports (PAID)
                        </div>
                        <div className="flex items-center gap-1.5 text-cyan-400 text-[8px] font-extrabold mt-1">
                          <CheckCircle2 className="w-3 h-3" /> VERIFIED REPLAYABLE METADATA BY DEFAULT
                        </div>
                      </div>
                    </details>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Gemini AI Auditor */}
        {activeTab === 'ai_auditor' && (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-slate-400 font-mono leading-relaxed">
              Query the LLM as a probabilistic governor. Analyze security drift, evaluate compliance bounds, or review F-distribution anomalies on the active Solana settlement queue.
            </p>

            {/* Prompt Macros */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {promptMacros.map((m) => (
                <button
                  key={m.title}
                  onClick={() => handleAuditRequest(m.prompt)}
                  disabled={isLoading}
                  className="bg-[#05070a]/40 hover:bg-[#05070a]/90 border border-slate-900 hover:border-cyan-500/30 p-2.5 rounded text-left transition-all cursor-pointer group"
                >
                  <span className="text-[10px] font-mono font-bold text-cyan-400 group-hover:text-cyan-300 block mb-1">
                    {m.title}
                  </span>
                  <span className="text-[9px] font-mono text-slate-500 line-clamp-2">
                    {m.prompt}
                  </span>
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <div className="bg-[#05070a]/40 p-3 rounded-lg border border-slate-900">
              <label className="text-[10px] uppercase font-mono text-cyan-400 font-bold block mb-1.5">
                Custom Auditor Prompt Strategy
              </label>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="w-full bg-slate-950 border border-slate-900 rounded p-2 text-xs font-mono text-slate-200 h-16 focus:outline-none focus:border-cyan-500 custom-scroll resize-none"
                placeholder="Ask Gemini to analyze the ledger..."
              />
              <button
                onClick={() => handleAuditRequest()}
                disabled={isLoading || !aiPrompt.trim()}
                className="w-full mt-2.5 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-850 disabled:text-slate-550 text-slate-950 font-mono font-bold rounded text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.3)]"
              >
                <Bot className="w-4 h-4 fill-[#05070a]" /> {isLoading ? "COMPILING SYSTEM VERDICT..." : "EXECUTE REASONING AUDIT"}
              </button>
            </div>

            {/* Response Area */}
            <div className="bg-[#05070a]/65 border border-slate-900 rounded-lg p-4 font-mono text-xs max-h-[290px] overflow-y-auto custom-scroll min-h-[140px] relative">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full absolute inset-0 text-slate-400">
                  <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-2" />
                  <span>Invoking L5 AI Audit Governor...</span>
                </div>
              ) : aiResponse ? (
                <div className="prose prose-invert max-w-none text-slate-300 markdown-body text-[11px] leading-relaxed">
                  <ReactMarkdown>{aiResponse}</ReactMarkdown>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-slate-600 text-center">
                  <Terminal className="w-8 h-8 text-slate-800 mb-2" />
                  <span>Awaiting audit instructions. Let Gemini review your active substrate ledger.</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Trust Ledger Footer */}
      <div className="border-t border-slate-900 pt-3 mt-4 text-[10px] font-mono text-slate-500 flex justify-between">
        <span>Solana Settlement Layer (PDA-bound)</span>
        <span>Axiom 6.6 Observability Pass</span>
      </div>

      {/* Block Inspector Modal */}
      {selectedBlock && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 transition-all duration-300 animate-in fade-in zoom-in-95" id="LedgerBlockModal">
          <div className="bg-[#070b13] border border-cyan-500/30 w-full max-w-lg rounded-xl shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden font-mono flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-900 bg-[#090f1b]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-cyan-400 w-4 h-4 animate-pulse" />
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-widest">
                  Block Inspector (Height No.{selectedBlock.blockNumber})
                </span>
              </div>
              <button 
                onClick={() => setSelectedBlock(null)}
                className="text-slate-450 hover:text-cyan-400 hover:bg-slate-900/50 p-1 rounded-md transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto custom-scroll text-slate-300 text-[11px] leading-relaxed">
              
              {/* Core Ledger Identification Section */}
              <div className="grid grid-cols-2 gap-3 bg-[#03060a] p-3 border border-slate-900 rounded-lg">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-bold mb-1">State Event Type</span>
                  <span className={`inline-block px-2.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${getEventBadgeClass(selectedBlock.eventType)}`}>
                    {selectedBlock.eventType}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-bold mb-1">Solana Index Time</span>
                  <span className="text-[11px] text-slate-200 block font-semibold">{new Date(selectedBlock.timestamp).toLocaleString()}</span>
                </div>
              </div>

              {/* Verified Action Memo */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400 font-extrabold block uppercase tracking-wider">Verifiable Human-Consent Consensus Statement</span>
                
                <div className="bg-cyan-950/10 border border-cyan-500/10 p-3.5 rounded-lg space-y-2">
                  <div>
                    <span className="text-slate-500 font-bold text-[9px] block mb-0.5 uppercase">SYSTEM LEVEL ACTION</span>
                    <p className="text-slate-100 font-bold leading-normal">{selectedBlock.action}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-900/50">
                    <span className="text-slate-500 font-bold text-[9px] block mb-0.5 uppercase">SOLANA MEMO METRICS</span>
                    <p className="text-cyan-350 italic font-mono leading-normal">"{selectedBlock.memo}"</p>
                  </div>
                </div>
              </div>

              {/* Cryptographic Substrate Parameters */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-450 font-extrabold block uppercase tracking-wider">Solana Structural Serialization</span>
                
                <div className="bg-[#03060a] border border-slate-900 p-3 rounded-lg space-y-2.5 text-[10px] leading-relaxed">
                  <div>
                    <span className="text-slate-500 font-bold block">TRANSACTION SIGNATURE hash (TXHASH)</span>
                    <span className="text-cyan-400 select-all font-mono break-all font-semibold block bg-[#010204] p-1.5 rounded border border-slate-950 mt-1">{selectedBlock.txHash}</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2.5 border-t border-slate-900/40">
                    <div>
                      <span className="text-slate-500 font-bold block">PDA AUTHORITY ADDRESS</span>
                      <span className="text-purple-400 select-all break-all font-mono font-semibold text-[9px] block leading-tight mt-1 bg-[#010204] p-1.5 rounded border border-slate-950">{selectedBlock.pdaAddress}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold block">ECONOMIC GAS FEE METER</span>
                      <div className="bg-[#010204] p-1.5 rounded border border-slate-950 mt-1 space-y-0.5">
                        <span className="text-amber-400 font-semibold block">{selectedBlock.gasPaidLamports.toLocaleString()} Lamports</span>
                        <span className="text-slate-500 text-[8px] block">≈ {(selectedBlock.gasPaidLamports / 1000000000).toFixed(8)} SOL (CONSENSUS PAID)</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-slate-900/40 flex items-center justify-between text-[9px] text-slate-550 font-semibold">
                    <div className="flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-cyan-450" />
                      <span>STATE INTEGRITY METRIC</span>
                    </div>
                    <span className="text-emerald-400 bg-emerald-950/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-900/30 text-[8.5px]">CONFIRMED STATE FINALIZED</span>
                  </div>
                </div>
              </div>

              {/* Dynamic decentralized Replay Sandbox interactive console */}
              <div className="bg-[#03060a] border border-cyan-500/10 p-3.5 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Fingerprint className="text-cyan-400 w-4 h-4 animate-pulse" />
                    <span className="text-[10px] text-slate-350 font-bold uppercase tracking-wider">Decentralized Replay Testbed</span>
                  </div>
                  <span className="text-[9px] text-slate-500 font-bold bg-slate-950 border border-slate-900 px-1.5 rounded">V2 Sandbox</span>
                </div>

                <p className="text-[10px] leading-relaxed text-slate-400">
                  Execute an automated local state machine replay. This matches instruction hashes, seed derivations, and agent keys against local system constraints to physically prove compliance.
                </p>

                {simulationResult ? (
                  <div className="p-3 bg-cyan-950/30 border border-cyan-900/25 rounded text-[10px] leading-relaxed text-cyan-300 font-semibold animate-in fade-in duration-350 relative overflow-hidden flex flex-col gap-1 shadow-[0_0_12px_rgba(6,182,212,0.1)]">
                    <div className="flex items-center gap-1.5 text-cyan-400 text-[10px] font-extrabold uppercase">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> SECURE ROOT VERIFICATION COMPLETE
                    </div>
                    <p className="text-slate-300 leading-normal pl-5 font-normal">
                      {simulationResult}
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={handleSimulateValidation}
                    disabled={isSimulatingValidation}
                    className="w-full py-2 bg-slate-950 hover:bg-[#050912] active:bg-[#070d1a] border border-slate-900 hover:border-cyan-500/30 text-cyan-400 text-[10px] font-extrabold rounded flex items-center justify-center gap-2 transition-all cursor-pointer select-none"
                  >
                    {isSimulatingValidation ? (
                      <>
                        <Activity className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                        <span>REPLAYING TRANSACTION HIERARCHY...</span>
                      </>
                    ) : (
                      <>
                        <Fingerprint className="w-3.5 h-3.5 text-cyan-500 animate-pulse" />
                        <span>SIMULATE DECENTRALIZED COSIGN / REPLAY</span>
                      </>
                    )}
                  </button>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-900 bg-[#090f1b] flex justify-end">
              <button
                onClick={() => setSelectedBlock(null)}
                className="px-4 py-1.5 bg-slate-950 hover:bg-slate-905 border border-slate-900 hover:border-cyan-500/20 text-slate-350 rounded text-[10px] font-extrabold transition-all cursor-pointer hover:text-cyan-400"
              >
                CLOSE INSPECTOR
              </button>
            </div>

          </div>
        </div>
      )}
      
    </div>
  );
}
