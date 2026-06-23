import { ReactNode } from "react";
import Link from "next/link";
import { Shield, Activity, HardDrive, DollarSign, BarChart2, ShieldAlert } from "lucide-react";

export const metadata = {
  title: "Sovereign Alignment Dashboard | Veklom Studio",
};

export default function StudioLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-900 text-ink-100 flex flex-col">
      <header className="border-b border-border bg-bg-800/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="font-bold text-xl tracking-tight text-white flex items-center gap-2">
              <Shield className="text-brand-500" size={24} />
              Veklom <span className="text-brand-400 font-medium">Studio</span>
            </div>
            <nav className="hidden md:flex items-center gap-1 text-sm font-medium ml-4">
              <Link href="/studio" className="px-3 py-1.5 rounded-md hover:bg-bg-700 text-ink-200 hover:text-white transition-colors">Overview</Link>
              <Link href="/studio/pgl" className="px-3 py-1.5 rounded-md hover:bg-bg-700 text-ink-200 hover:text-white transition-colors">PGL Lineage</Link>
              <Link href="/studio/seked" className="px-3 py-1.5 rounded-md hover:bg-bg-700 text-ink-200 hover:text-white transition-colors">SEKED Gates</Link>
              <Link href="/studio/audit" className="px-3 py-1.5 rounded-md hover:bg-bg-700 text-ink-200 hover:text-white transition-colors">Audit Ledger</Link>
              <Link href="/studio/finops" className="px-3 py-1.5 rounded-md hover:bg-bg-700 text-ink-200 hover:text-white transition-colors">x402 FinOps</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs font-mono bg-accent-green/10 text-accent-green px-2 py-1 rounded border border-accent-green/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
              SOVEREIGN ENFORCEMENT ACTIVE
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
