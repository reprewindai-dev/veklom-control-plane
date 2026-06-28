import React from 'react';

export const metadata = {
  title: "Interlink Console - Veklom Control Plane",
};

export default function InterlinkPage() {
  return (
    <div className="w-full h-screen overflow-hidden bg-[#030303]">
      <iframe 
        src="https://interlink.veklom.com/ui" 
        className="w-full h-full border-none"
        title="Interlink Covenant Console Treasury"
      />
    </div>
  );
}
