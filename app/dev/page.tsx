"use client";

import DevSidebar from "./components/DevSidebar";
import WhitepaperContent from "./components/WhitepaperContent";
import ArchitectureDiagram from "./components/ArchitectureDiagram";
import { TopNav } from "@/components/TopNav";

export default function DevPortal() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white selection:bg-[#3EE7A2]/30 selection:text-white">
      {/* Optional: if TopNav is used globally, we keep it, else we build a minimal one */}
      <TopNav />
      
      <div className="flex max-w-[1600px] mx-auto pt-16">
        {/* Left Sidebar */}
        <DevSidebar />

        {/* Main Content Pane */}
        <div className="flex-1 min-w-0 flex justify-center">
          <WhitepaperContent />
        </div>

        {/* Right Flow Diagram */}
        <ArchitectureDiagram />
      </div>
    </main>
  );
}
