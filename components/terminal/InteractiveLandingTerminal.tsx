"use client";

import React, { useState, useEffect, useRef } from "react";
import { Terminal as TerminalIcon, ChevronRight, CheckCircle2, AlertTriangle, Play, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface TerminalLine {
  text: string;
  type: "input" | "output" | "system" | "error" | "success" | "warning";
}

const BOOT_SEQUENCE = [
  { text: "Initializing ConvergeOS Kernel v0.9.4...", delay: 400, type: "system" },
  { text: "Mounting Secure Enclaves (SEKED)... [OK]", delay: 300, type: "success" },
  { text: "Establishing VNP PBFT Consensus...", delay: 500, type: "system" },
  { text: "Connected to 120 global validator nodes.", delay: 200, type: "success" },
  { text: "Ready. Type a command to interact.", delay: 200, type: "output" },
];

export default function InteractiveLandingTerminal() {
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [input, setInput] = useState("");
  const [isBooting, setIsBooting] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const [showCTA, setShowCTA] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Handle boot sequence
  useEffect(() => {
    let currentDelay = 0;
    
    BOOT_SEQUENCE.forEach((step, index) => {
      currentDelay += step.delay;
      setTimeout(() => {
        setLines(prev => [...prev, { text: step.text, type: step.type as any }]);
        if (index === BOOT_SEQUENCE.length - 1) {
          setIsBooting(false);
          // Auto focus after boot
          setTimeout(() => inputRef.current?.focus(), 100);
        }
      }, currentDelay);
    });
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  const processCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    setLines(prev => [...prev, { text: `guest@veklom-edge:~$ ${trimmed}`, type: "input" }]);
    
    setTimeout(() => {
      if (trimmed.toLowerCase() === "help") {
        setLines(prev => [...prev, 
          { text: "Available commands:", type: "output" },
          { text: "  deploy agent  - Launch an autonomous treasury agent", type: "output" },
          { text: "  status        - Check network consensus health", type: "output" },
          { text: "  clear         - Clear terminal output", type: "output" },
        ]);
      } else if (trimmed.toLowerCase() === "clear") {
        setLines([]);
      } else if (trimmed.toLowerCase() === "status") {
        setLines(prev => [...prev, 
          { text: "[VNP Network] 120/120 Validators Active", type: "success" },
          { text: "[x402 Protocol] Staking Escrow Online", type: "success" },
          { text: "[PGL] Guardrails Enforced", type: "success" }
        ]);
      } else if (trimmed.toLowerCase() === "deploy agent" || trimmed.toLowerCase().includes("deploy")) {
        setLines(prev => [...prev, 
          { text: "[+] Authenticating with x402 Gateway...", type: "system" },
          { text: "[!] ACCESS DENIED: Unregistered Node Identity", type: "error" },
          { text: "[?] A verified Sovereign Workspace is required to deploy agents.", type: "warning" },
        ]);
        setTimeout(() => setShowCTA(true), 1000);
      } else {
        // Generic response
        setLines(prev => [...prev, 
          { text: `Command received: '${trimmed}'. Simulating execution...`, type: "system" },
          { text: `[+] Analyzing Intent...`, type: "system" },
          { text: `[!] Action requires Level 4 Authority.`, type: "warning" },
        ]);
        setTimeout(() => setShowCTA(true), 1500);
      }
    }, 400);

    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      processCommand(input);
    }
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto z-20">
      {/* Glow effect */}
      <motion.div 
        animate={{ opacity: isFocused ? 0.7 : 0.4 }}
        className="absolute -inset-0.5 bg-gradient-to-r from-[#FFB800]/20 to-[#FFB800]/10 blur-2xl rounded-2xl" 
      />
      
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.2, duration: 0.8 }}
        className={`relative bg-[#0A0A0A]/80 backdrop-blur-xl border ${isFocused ? 'border-[#FFB800]/50 shadow-[0_0_30px_rgba(255,184,0,0.15)]' : 'border-[#1A1A1A]'} rounded-2xl overflow-hidden transition-all duration-300`}
        onClick={() => inputRef.current?.focus()}
      >
        {/* Terminal Header */}
        <div className="flex items-center px-4 py-3 bg-[#111111]/90 border-b border-[#1A1A1A]">
          <div className="flex gap-2 mr-4">
            <div className="w-3 h-3 rounded-full bg-rose-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#A1A1A6] mx-auto">
            <TerminalIcon className="w-3 h-3" />
            guest@veklom-edge — bash
          </div>
        </div>

        {/* Terminal Body */}
        <div 
          ref={scrollRef}
          className="p-6 h-[400px] overflow-y-auto font-mono text-sm sm:text-base custom-scrollbar"
        >
          <div className="space-y-2">
            <AnimatePresence>
              {lines.map((line, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`
                  ${line.type === 'input' ? 'text-white' : ''}
                  ${line.type === 'output' ? 'text-[#A1A1A6]' : ''}
                  ${line.type === 'system' ? 'text-[#FFB800]' : ''}
                  ${line.type === 'success' ? 'text-emerald-400' : ''}
                  ${line.type === 'error' ? 'text-rose-400' : ''}
                  ${line.type === 'warning' ? 'text-amber-400' : ''}
                  flex items-start gap-2 break-all
                `}>
                  {line.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
                  {line.type === 'error' && <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
                  {line.type === 'system' && <Play className="w-4 h-4 shrink-0 mt-0.5" />}
                  <span>{line.text}</span>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Input Line */}
            {!isBooting && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center text-white mt-4">
                <span className="text-emerald-400 mr-2 shrink-0">guest@veklom-edge:~$</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  className="bg-transparent border-none outline-none flex-1 font-mono text-white placeholder-[#333] w-full"
                  placeholder="type a command (e.g., 'deploy agent')"
                  autoComplete="off"
                  spellCheck="false"
                />
              </motion.div>
            )}
            
            {/* Blinking cursor effect when waiting during boot */}
            {isBooting && (
              <div className="w-2 h-5 bg-[#A1A1A6] animate-pulse mt-2" />
            )}
          </div>
        </div>
        
        {/* Call To Action overlay */}
        <div className={`absolute bottom-0 left-0 w-full p-4 transition-all duration-500 transform ${showCTA ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
          <div className="bg-gradient-to-r from-[#FFB800] to-[#E0A100] p-[1px] rounded-xl shadow-2xl">
            <div className="bg-[#0A0A0A] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#FFB800]/20 flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5 text-[#FFB800]" />
                </div>
                <div>
                  <h4 className="text-white font-medium">Ready to deploy real agents?</h4>
                  <p className="text-[#A1A1A6] text-xs mt-0.5">Initialize your cryptographically verified workspace.</p>
                </div>
              </div>
              <button 
                onClick={() => router.push('/signup')}
                className="w-full sm:w-auto whitespace-nowrap bg-white text-black hover:bg-gray-200 px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                Initialize Workspace
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
