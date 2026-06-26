"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowRight, Shield, Globe, Zap, Server, Activity, Lock } from "lucide-react";
import { motion } from "framer-motion";

// These components use useSWR + browser APIs — must skip SSR or the build explodes
const InteractiveLandingTerminal = dynamic(
  () => import("@/components/terminal/InteractiveLandingTerminal"),
  { ssr: false, loading: () => <div className="h-64 bg-white/5 rounded-xl animate-pulse" /> }
);
const NetworkTopologyPanel = dynamic(
  () => import("@/components/vnp/NetworkTopologyPanel"),
  { ssr: false, loading: () => <div className="h-[500px] bg-white/5 rounded-xl animate-pulse" /> }
);
const StakingProtocol = dynamic(
  () => import("@/components/vnp/StakingProtocol"),
  { ssr: false, loading: () => <div className="h-48 bg-white/5 rounded-xl animate-pulse" /> }
);

const fadeUpVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white overflow-x-hidden selection:bg-blue-500/30">

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0A0A0A]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <span className="font-bold text-white leading-none">V</span>
            </div>
            <span className="font-bold tracking-wide text-lg">VEKLOM</span>
          </div>
          <div className="flex items-center gap-6 text-sm font-medium">
            <Link href="/login" className="text-gray-400 hover:text-white transition-colors">Sign In</Link>
            <Link href="/signup" className="bg-white text-black px-4 py-2 rounded-md hover:bg-gray-200 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6">
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[1000px] h-[500px] bg-blue-500/20 blur-[120px] rounded-full opacity-50 mix-blend-screen" />
          <div className="absolute top-[30%] left-[50%] -translate-x-1/2 w-[800px] h-[400px] bg-violet-500/20 blur-[100px] rounded-full opacity-50 mix-blend-screen" />
        </div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="relative z-10 max-w-7xl mx-auto text-center"
        >
          <motion.h1 variants={fadeUpVariants} className="text-5xl lg:text-7xl font-bold tracking-tight mb-6">
            The Sovereign <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">
              Agentic Runtime
            </span>
          </motion.h1>
          <motion.p variants={fadeUpVariants} className="text-xl text-gray-400 max-w-2xl mx-auto mb-12">
            No hallucinations. Complete sovereignty. Veklom provides a cryptographically
            verified execution environment for autonomous agents to interact, transact, and scale.
          </motion.p>

          <motion.div variants={fadeUpVariants} className="mb-20">
            <InteractiveLandingTerminal />
          </motion.div>
        </motion.div>
      </section>

      {/* VNP Section */}
      <section className="py-24 border-t border-white/5 bg-[#0F0F13] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid lg:grid-cols-2 gap-16 items-center"
          >
            <div className="space-y-8">
              <motion.div variants={fadeUpVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium">
                <Globe className="w-4 h-4" />
                Veklom Nexus Protocol (VNP)
              </motion.div>
              <motion.h2 variants={fadeUpVariants} className="text-4xl font-bold">120 Nodes. Zero Trust.</motion.h2>
              <motion.p variants={fadeUpVariants} className="text-gray-400 text-lg leading-relaxed">
                Agents require verifiable truth. The VNP operates a global PBFT consensus swarm
                that validates every API request, enforces Guardrails (PGL), and manages SLAs.
                If a provider fails, the swarm slashes their stake automatically.
              </motion.p>
              <motion.ul variants={fadeUpVariants} className="space-y-4">
                {[
                  { icon: Activity, text: "Live cryptographic telemetry streaming" },
                  { icon: Shield, text: "Distributed Policy Guardrails (PGL)" },
                  { icon: Server, text: "Fault-tolerant routing across regions" }
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-300">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                      <item.icon className="w-4 h-4 text-blue-400" />
                    </div>
                    {item.text}
                  </li>
                ))}
              </motion.ul>
            </div>
            <motion.div variants={fadeUpVariants} className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-transparent blur-2xl opacity-50 rounded-3xl -z-10" />
              <div className="border border-white/10 rounded-2xl overflow-hidden bg-[#0A0A0A] shadow-2xl">
                <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-mono text-gray-400">LIVE: api.veklom.com/v1/beacon/topology</span>
                </div>
                <div className="h-[500px] overflow-hidden p-6 relative">
                  <div className="transform scale-[0.85] origin-top-left w-[117%] h-[117%] pointer-events-none">
                    <NetworkTopologyPanel />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* x402 Section */}
      <section className="py-24 border-t border-white/5 bg-[#0A0A0A] relative">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid lg:grid-cols-2 gap-16 items-center"
          >
            <div className="space-y-8 lg:pl-12">
              <motion.div variants={fadeUpVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-medium">
                <Zap className="w-4 h-4" />
                x402 Micro-Staking
              </motion.div>
              <motion.h2 variants={fadeUpVariants} className="text-4xl font-bold">Autonomous Treasury.</motion.h2>
              <motion.p variants={fadeUpVariants} className="text-gray-400 text-lg leading-relaxed">
                Empower your agents with financial sovereignty. The x402 protocol handles micro-transactions,
                SLA escrows, and yield generation natively — cryptographic proof of reserve included.
              </motion.p>
              <motion.div variants={fadeUpVariants}>
                <Link href="/signup" className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 font-medium transition-colors">
                  Initialize your workspace <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            </div>
            <motion.div variants={fadeUpVariants} className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-violet-500/20 to-transparent blur-2xl opacity-50 rounded-3xl -z-10" />
              <div className="border border-white/10 rounded-2xl overflow-hidden bg-[#0F0F13] shadow-2xl">
                <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                    <div className="w-3 h-3 rounded-full bg-green-500/50" />
                  </div>
                  <div className="ml-4 text-xs font-mono text-gray-500 flex items-center gap-2">
                    <Lock className="w-3 h-3" />
                    x402-protocol.ts
                  </div>
                </div>
                <div className="p-6">
                  <StakingProtocol />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-600/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="relative z-10 max-w-4xl mx-auto text-center px-6"
        >
          <motion.h2 variants={fadeUpVariants} className="text-4xl lg:text-5xl font-bold mb-6">Stop simulating. Start executing.</motion.h2>
          <motion.p variants={fadeUpVariants} className="text-xl text-gray-400 mb-10">
            Join the enterprise network providing real cryptographic guarantees for agentic workflows.
          </motion.p>
          <motion.div variants={fadeUpVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="w-full sm:w-auto bg-white text-black px-8 py-4 rounded-lg font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-lg">
              Initialize Sovereign Workspace <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/login" className="w-full sm:w-auto bg-[#1A1A1A] border border-white/10 text-white px-8 py-4 rounded-lg font-bold hover:bg-[#222] transition-colors flex items-center justify-center text-lg">
              Sign In
            </Link>
          </motion.div>
        </motion.div>
      </section>

      <footer className="py-8 border-t border-white/5 text-center text-gray-500 text-sm bg-[#0A0A0A]">
        <p>© 2026 Veklom Corporation. All rights reserved.</p>
      </footer>
    </main>
  );
}
