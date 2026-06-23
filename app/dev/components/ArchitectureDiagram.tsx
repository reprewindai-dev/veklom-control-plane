"use client";

import { motion } from "framer-motion";
import { Shield, Brain, ArrowRight, Database, Code2 } from "lucide-react";

export default function ArchitectureDiagram() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
  };

  return (
    <div className="hidden xl:block w-80 shrink-0 sticky top-16 h-[calc(100vh-4rem)] pt-12 pr-6">
      <div className="bg-[#0A0A0A] border border-[#242424] rounded-xl p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-2 opacity-5">
          <Shield className="w-32 h-32" />
        </div>
        
        <h4 className="text-[#A1A1A6] font-mono text-[10px] font-bold tracking-widest uppercase mb-6 border-b border-[#242424] pb-2">
          Governed Execution Flow
        </h4>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="relative space-y-6"
        >
          {/* Step 1 */}
          <motion.div variants={itemVariants} className="flex gap-3 relative z-10">
            <div className="w-8 h-8 rounded-lg bg-[#37C9EC]/10 border border-[#37C9EC]/30 flex items-center justify-center shrink-0">
              <Brain className="w-4 h-4 text-[#37C9EC]" />
            </div>
            <div>
              <div className="text-white text-sm font-semibold">1. Intent → Plan</div>
              <div className="text-[#6E6E73] text-xs mt-1">Structured agent goals compiled into a plan.</div>
            </div>
          </motion.div>

          {/* Connection Line */}
          <div className="absolute left-4 top-8 bottom-8 w-px bg-gradient-to-b from-[#37C9EC]/30 via-[#3EE7A2]/30 to-[#FFB800]/30 z-0" />

          {/* Step 2 */}
          <motion.div variants={itemVariants} className="flex gap-3 relative z-10">
            <div className="w-8 h-8 rounded-lg bg-[#3EE7A2]/10 border border-[#3EE7A2]/30 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-[#3EE7A2]" />
            </div>
            <div>
              <div className="text-white text-sm font-semibold">2. Policy Check</div>
              <div className="text-[#6E6E73] text-xs mt-1">SEKED engine validates against strict constraints.</div>
            </div>
          </motion.div>

          {/* Step 3 */}
          <motion.div variants={itemVariants} className="flex gap-3 relative z-10">
            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
              <Code2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-white text-sm font-semibold">3. Execution</div>
              <div className="text-[#6E6E73] text-xs mt-1">Sandboxed routing via FastMCP gateway.</div>
            </div>
          </motion.div>

          {/* Step 4 */}
          <motion.div variants={itemVariants} className="flex gap-3 relative z-10">
            <div className="w-8 h-8 rounded-lg bg-[#FFB800]/10 border border-[#FFB800]/30 flex items-center justify-center shrink-0">
              <Database className="w-4 h-4 text-[#FFB800]" />
            </div>
            <div>
              <div className="text-white text-sm font-semibold">4. Audit Evidence</div>
              <div className="text-[#6E6E73] text-xs mt-1">Signed, immutable SHA-256 hashed packets.</div>
            </div>
          </motion.div>

        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="mt-8 pt-4 border-t border-[#242424] text-xs text-center text-[#6E6E73]"
        >
          Live PGL Tracking Active
        </motion.div>
      </div>
    </div>
  );
}
