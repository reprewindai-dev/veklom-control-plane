import React from 'react';
import Shell from "@/components/Shell";
import TierGate from "@/components/TierGate";
import TriageTelemetry from "@/components/telemetry/TriageTelemetry";

export const metadata = {
  title: "Interlink Console - Veklom Control Plane",
};

export default function InterlinkPage() {
  return (
    <Shell>
      <TierGate required="sovereign" feature="Interlink">
        <div className="w-full h-[calc(100vh-4rem)] flex flex-col xl:flex-row overflow-hidden bg-[#030303]">
          <div className="flex-grow h-full relative min-w-0">
            <iframe 
              src="https://interlink.veklom.com/ui" 
              className="w-full h-full border-none"
              title="Interlink Covenant Console Treasury"
            />
          </div>
          <div className="w-full xl:w-96 shrink-0 h-full border-t xl:border-t-0 xl:border-l border-white/5 bg-[#030303]/85 overflow-y-auto">
            <TriageTelemetry context="interlink" />
          </div>
        </div>
      </TierGate>
    </Shell>
  );
}
