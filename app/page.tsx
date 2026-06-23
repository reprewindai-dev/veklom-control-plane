"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Shield, Globe, Zap, Server, Activity, Database, Key } from "lucide-react";
import InteractiveLandingTerminal from "@/components/terminal/InteractiveLandingTerminal";
import NetworkTopologyPanel from "@/components/vnp/NetworkTopologyPanel";
import StakingProtocol from "@/components/vnp/StakingProtocol";
import { Card } from "@/components/ui";

export default function Home() {
  const router = useRouter();

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
            <Link 
              href="/signup" 
              className="bg-white text-black px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6">
        {/* Background Mesh */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[1000px] h-[500px] bg-blue-500/20 blur-[120px] rounded-full opacity-50 mix-blend-screen" />
          <div className="absolute top-[30%] left-[50%] -translate-x-1/2 w-[800px] h-[400px] bg-violet-500/20 blur-[100px] rounded-full opacity-50 mix-blend-screen" />
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-6">
            The Sovereign <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">
              Agentic Runtime
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12">
            No hallucinations. Complete sovereignty. Veklom provides a cryptographically 
            verified execution environment for autonomous agents to interact, transact, and scale.
          </p>

          {/* The Hook: Interactive Terminal */}
          <div className="mb-20 transform transition-transform hover:scale-[1.01] duration-500">
            <InteractiveLandingTerminal />
          </div>
        </div>
      </section>

      {/* Value Scroll Section 1: Network Topology */}
      <section className="py-24 border-t border-white/5 bg-[#0F0F13] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium">
                <Globe className="w-4 h-4" />
                Veklom Nexus Protocol (VNP)
              </div>
              <h2 className="text-4xl font-bold">120 Nodes. Zero Trust.</h2>
              <p className="text-gray-400 text-lg leading-relaxed">
                Agents require verifiable truth. The VNP operates a global PBFT consensus swarm 
                that validates every API request, enforces Guardrails (PGL), and manages SLAs. 
                If a provider fails, the swarm slashes their stake automatically.
              </p>
              <ul className="space-y-4">
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
              </ul>
            </div>
            
            {/* Live Component Inject */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-transparent blur-2xl opacity-50 rounded-3xl -z-10" />
              <div className="border border-white/10 rounded-2xl overflow-hidden bg-[#0A0A0A] shadow-2xl">
                <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-mono text-gray-400">LIVE DATA FEED: api.veklom.com/v1/beacon/topology</span>
                </div>
                <div className="h-[500px] overflow-hidden p-6 relative">
                   <div className="transform scale-[0.85] origin-top-left w-[117%] h-[117%] pointer-events-none">
                     <NetworkTopologyPanel />
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Scroll Section 2: Autonomous Treasury */}
      <section className="py-24 border-t border-white/5 bg-[#0A0A0A] relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center flex-col-reverse lg:flex-row-reverse">
            <div className="space-y-8 lg:pl-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-medium">
                <Zap className="w-4 h-4" />
                x402 Micro-Staking
              </div>
              <h2 className="text-4xl font-bold">Autonomous Treasury.</h2>
              <p className="text-gray-400 text-lg leading-relaxed">
                Empower your agents with financial sovereignty. The x402 protocol handles micro-transactions, 
                SLA escrows, and yield generation natively. Complete with cryptographic proof of reserve and 
                Stripe payment rails.
              </p>
              
              <Link href="/signup" className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 font-medium transition-colors">
                Initialize your workspace <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            {/* Live Component Inject */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-violet-500/20 to-transparent blur-2xl opacity-50 rounded-3xl -z-10" />
              <div className="border border-white/10 rounded-2xl overflow-hidden bg-[#0F0F13] shadow-2xl">
                <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-mono text-gray-400">LIVE DATA FEED: api.veklom.com/v1/x402/staking/state</span>
                </div>
                <div className="h-[500px] overflow-hidden p-6 relative">
                   <div className="transform scale-[0.85] origin-top-left w-[117%] h-[117%] pointer-events-none">
                     <StakingProtocol />
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-600/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 max-w-4xl mx-auto text-center px-6">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">Stop simulating. Start executing.</h2>
          <p className="text-xl text-gray-400 mb-10">
            Join the enterprise network providing real cryptographic guarantees for agentic workflows.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/signup" 
              className="w-full sm:w-auto bg-white text-black px-8 py-4 rounded-lg font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-lg"
            >
              Initialize Sovereign Workspace
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/login" 
              className="w-full sm:w-auto bg-[#1A1A1A] border border-white/10 text-white px-8 py-4 rounded-lg font-bold hover:bg-[#222] transition-colors flex items-center justify-center text-lg"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-8 border-t border-white/5 text-center text-gray-500 text-sm bg-[#0A0A0A]">
        <p>© 2026 Veklom Corporation. All rights reserved.</p>
      </footer>
    </main>
  );
}
