"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Fingerprint, ChevronRight, ChevronLeft, Shield, User, Mail, Info } from 'lucide-react';

export default function GenomeLedgerOnboarding() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: 'Anthony Millwater',
    secureEmail: 'reprewindai@gmail.com'
  });

  return (
    <div className="w-full h-full bg-[#030303] flex flex-col font-sans relative overflow-hidden">
      {/* Background Decorative Rings */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 -translate-x-1/2 w-[600px] h-[600px] border border-white/5 rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 -translate-x-1/2 w-[400px] h-[400px] border border-white/10 rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 -translate-x-1/2 w-[200px] h-[200px] border border-white/20 rounded-full pointer-events-none" />

      <div className="flex-grow flex p-20 gap-20 items-center justify-center relative z-10">

        {/* Left Side: Branding */}
        <div className="w-1/3 flex flex-col gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-light text-white tracking-tight">
              Genome <span className="text-hazard-amber font-bold">Ledger</span>
            </h1>
            <p className="text-white/40 text-sm leading-relaxed max-w-sm">
              Provisioning Sovereign Authority node. Establishing secure telemetry and immutable operational chains.
            </p>
          </div>

          <div className="mt-20 relative">
            <div className="w-48 h-48 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xl flex flex-col items-center justify-center gap-4 group hover:border-hazard-amber/30 transition-all">
              <div className="p-4 rounded-full bg-hazard-amber/10 text-hazard-amber">
                <Fingerprint size={32} />
              </div>
              <div className="text-center">
                <div className="text-white font-bold text-sm">{formData.fullName}</div>
                <div className="text-white/30 text-[10px] font-mono">{formData.secureEmail}</div>
              </div>

              {/* Pulsing indicator */}
              <div className="absolute -inset-4 border border-hazard-amber/5 rounded-full animate-pulse" />
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-1/2 max-w-xl flex flex-col gap-8">
          <div className="flex items-center gap-2 text-hazard-amber/60">
             <User size={14} />
             <span className="text-[10px] font-mono uppercase tracking-[0.2em]">Operator Identity</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-white tracking-tight">Identify the Operator</h2>
            <p className="text-white/40 text-sm">Who operates this sovereign node?</p>
          </div>

          <div className="p-8 bg-[#0a0a0c] border border-white/10 rounded-2xl space-y-6 relative overflow-hidden">
             <div className="flex gap-4">
                <div className="p-3 rounded-xl bg-hazard-amber/10 text-hazard-amber h-fit">
                   <Info size={20} />
                </div>
                <div className="space-y-2">
                   <h3 className="text-sm font-bold text-hazard-amber uppercase">Why this matters</h3>
                   <p className="text-[11px] text-white/40 leading-relaxed">
                      Establishing a cryptographically bound Operator Identity ensures that all autonomous actions trace back to an authorized human. This prevents unauthorized usage and guarantees compliance with enterprise security models.
                   </p>
                </div>
             </div>

             <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="space-y-2">
                   <label className="text-[10px] font-mono uppercase text-white/30 tracking-widest">Full Name</label>
                   <input
                     type="text"
                     value={formData.fullName}
                     onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                     className="w-full bg-[#030303] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-hazard-amber/50 transition-all"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-mono uppercase text-white/30 tracking-widest">Secure Email</label>
                   <input
                     type="email"
                     value={formData.secureEmail}
                     onChange={(e) => setFormData({...formData, secureEmail: e.target.value})}
                     className="w-full bg-[#030303] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-hazard-amber/50 transition-all"
                   />
                </div>
             </div>
          </div>

          <div className="flex items-center justify-between mt-4">
             <button
               onClick={() => setStep(s => Math.max(1, s - 1))}
               className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 text-white/60 text-sm font-bold hover:bg-white/10 transition-all"
             >
                <ChevronLeft size={18} />
                Go Back
             </button>
             <button
               className="flex items-center gap-2 px-8 py-3 rounded-xl bg-hazard-amber text-black text-sm font-bold hover:bg-hazard-amber/80 transition-all shadow-[0_0_20px_rgba(255,171,0,0.2)]"
             >
                Proceed
                <ChevronRight size={18} />
             </button>
          </div>

          <div className="flex justify-center mt-10">
             <button className="text-[10px] font-mono text-white/20 uppercase tracking-widest hover:text-white/40 transition-colors">
                Skip initialization (Replay Mode)
             </button>
          </div>
        </div>

      </div>

      {/* Footer Progress */}
      <div className="absolute bottom-10 left-10 right-10 flex items-center justify-between">
         <div className="w-1/3 h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '14.28%' }}
              className="h-full bg-hazard-amber"
            />
         </div>
         <span className="text-[10px] font-mono text-white/30">01 / 07</span>
      </div>
    </div>
  );
}
