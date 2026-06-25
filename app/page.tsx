"use client";
export const dynamic = "force-dynamic";

// minimal homepage stub to ensure clean CI build

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Veklom Control Plane</h1>
        <p className="text-sm text-slate-400 mt-3">Homepage temporarily simplified to allow CI build. Restoring full UI shortly.</p>
      </div>
    </main>
  );
}

