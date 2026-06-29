"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const CHAPTERS = [
  { id: "strategic-imperative", title: "1. The Strategic Imperative" },
  { id: "pgl-identity", title: "2. PGL Identity & Lineage" },
  { id: "seked-policy", title: "3. SEKED Policy Engine" },
  { id: "replayable-evidence", title: "4. Replayable Evidence" },
  { id: "operational-economic", title: "5. ConvergeOS & x402" },
  { id: "nexus-protocol", title: "6. Nexus Benchmarking" },
  { id: "sovereign-ai", title: "7. Sovereign AI Blueprint" },
  { id: "agent-duel-colosseum", title: "8. Agent Duel Colosseum" },
];


export default function DevSidebar() {
  const [activeId, setActiveId] = useState<string>("strategic-imperative");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-100px 0px -60% 0px" }
    );

    CHAPTERS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="w-64 shrink-0 hidden lg:block border-r border-[#242424] bg-[#0A0A0A] h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto py-8 px-4 custom-scrollbar">
      <div className="mb-6 px-3">
        <h3 className="text-xs font-mono font-bold tracking-widest text-[#6E6E73] uppercase mb-2">
          Whitepaper
        </h3>
        <div className="text-sm font-semibold text-white">Sovereign AI Accountability</div>
      </div>
      
      <nav className="space-y-1">
        {CHAPTERS.map((chapter) => {
          const isActive = activeId === chapter.id;
          
          return (
            <Link 
              key={chapter.id} 
              href={`#${chapter.id}`}
              className={`relative flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                isActive ? "text-white bg-white/5" : "text-[#A1A1A6] hover:text-white hover:bg-white/[0.02]"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebarActive"
                  className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#3EE7A2] rounded-r"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span className="truncate">{chapter.title}</span>
              {isActive && <ChevronRight className="w-3 h-3 ml-auto opacity-50" />}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
