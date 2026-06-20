"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { MODULES, modulesByGroup } from "@/lib/modules";
import { meetsTier, TIER_LABEL } from "@/lib/tiers";
import * as Icons from "lucide-react";
import clsx from "clsx";
import { LogoWordmark } from "./Logo";
import { Pill } from "./telemetry";

const GROUP_TITLES: Record<string, string> = {
  overview: "Network",
  build: "Build",
  run: "Run",
  marketplace: "Veklom Nexus",
  govern: "Zero-Trust",
  workspace: "Treasury",
  admin: "Global",
};

// Modules that surface live telemetry — flagged with a LIVE badge in the rail.
const LIVE_SLUGS = new Set(["dashboard", "usage", "routing", "audit", "pipelines", "playground", "status", "deployments", "runtime", "benchmarks", "governance"]);

function Icon({ name, className, size = 16 }: { name: string; className?: string; size?: number }) {
  const C = (Icons as any)[name] || Icons.Circle;
  return <C className={className} size={size} />;
}

function EnvChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border border-border bg-white/[0.02] px-2 h-7 text-[10px] font-semibold uppercase tracking-wider text-ink-300 whitespace-nowrap font-mono">
      {children}
    </span>
  );
}

/** Functional ⌘K-style quick navigation across every module. */
function CommandSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [] as typeof MODULES;
    return MODULES.filter(
      (m) => m.label.toLowerCase().includes(term) || m.description.toLowerCase().includes(term) || m.slug.includes(term)
    ).slice(0, 7);
  }, [q]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function go(href: string) {
    setQ("");
    setOpen(false);
    inputRef.current?.blur();
    router.push(href);
  }

  return (
    <div className="relative w-full max-w-xl">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-bg-900/70 px-3 h-9 focus-within:border-brand-500/60 transition">
        <Icons.Search size={14} className="text-ink-600 shrink-0" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => q && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") setActive((a) => Math.min(a + 1, results.length - 1));
            if (e.key === "ArrowUp") setActive((a) => Math.max(a - 1, 0));
            if (e.key === "Enter" && results[active]) go(results[active].href);
          }}
          placeholder="Jump to module, deployment, log…"
          className="flex-1 bg-transparent text-sm text-ink-50 placeholder:text-ink-600 outline-none"
        />
        <kbd className="hidden sm:inline-flex items-center rounded border border-border px-1.5 text-[10px] text-ink-600 font-mono">⌘K</kbd>
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-30 mt-2 w-full rounded-xl border border-border-strong bg-bg-800/95 backdrop-blur-xl shadow-2xl overflow-hidden">
          {results.map((m, i) => (
            <button
              key={m.slug}
              onMouseDown={(e) => {
                e.preventDefault();
                go(m.href);
              }}
              onMouseEnter={() => setActive(i)}
              className={clsx(
                "flex w-full items-center gap-3 px-3 py-2 text-left transition",
                i === active ? "bg-brand-500/10" : "hover:bg-white/[0.03]"
              )}
            >
              <Icon name={m.icon} className="text-brand-400 shrink-0" />
              <span className="min-w-0">
                <span className="block text-sm text-ink-50 truncate">{m.label}</span>
                <span className="block text-[11px] text-ink-400 truncate">{m.description}</span>
              </span>
              <Icons.CornerDownLeft size={12} className="ml-auto text-ink-600 shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const { me, sub, tier, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !me) router.replace("/login");
  }, [loading, me, router]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="flex items-center gap-3 text-ink-400 text-sm">
          <span className="spinner" /> Loading your control plane…
        </div>
      </div>
    );
  }
  if (!me) return null;

  const groups = modulesByGroup();
  const orderedGroups: Array<keyof typeof groups> = ["overview", "build", "marketplace", "run", "insights", "govern", "workspace", "admin"];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-[248px] shrink-0 border-r border-border bg-bg-900/80 backdrop-blur px-3 py-4 flex-col">
        <Link href="/dashboard" className="flex items-start gap-2.5 px-2 py-1.5 mb-4">
          <LogoWordmark height={22} className="mt-0.5" />
          <span className="text-[8px] leading-[1.3] text-ink-600 uppercase tracking-[0.16em] font-semibold mt-0.5">
            Sovereign<br />Control Node
          </span>
        </Link>
        <nav className="flex-1 overflow-y-auto scroll-thin space-y-5 pr-1">
          {orderedGroups.map((g) => {
            if (!groups[g]) return null;
            if (g === "admin" && !me.is_superuser) return null;
            return (
              <div key={g}>
                <div className="px-2 text-[9px] uppercase tracking-[0.18em] text-ink-600 mb-1.5 font-semibold">
                  {GROUP_TITLES[g]}
                </div>
                <ul className="space-y-0.5">
                  {groups[g].map((m) => {
                    const active = pathname?.startsWith(m.href);
                    const locked = !meetsTier(tier, m.minTier);
                    return (
                      <li key={m.slug}>
                        <Link
                          href={m.href}
                          className={clsx(
                            "group relative flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] transition",
                            active
                              ? "bg-brand-500/[0.12] text-ink-50"
                              : "text-ink-200 hover:bg-white/[0.04] hover:text-ink-50",
                            locked && "opacity-55"
                          )}
                        >
                          {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full bg-brand-400" />}
                          <Icon name={m.icon} size={15} className={active ? "text-brand-400" : "text-ink-400 group-hover:text-ink-200"} />
                          <span className="flex-1 truncate">{m.label}</span>
                          {LIVE_SLUGS.has(m.slug) && !locked && (
                            <span className="flex items-center gap-1 text-[8px] font-bold tracking-wider text-accent-green">
                              <span className="w-1 h-1 rounded-full bg-accent-green animate-pulse" />LIVE
                            </span>
                          )}
                          {locked && <Icons.Lock size={11} className="text-ink-600" />}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* Sovereign-mode posture card */}
        <div className="mt-4 rounded-xl border border-border bg-white/[0.02] p-3">
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-[0.16em] text-ink-400 font-semibold">Sovereign Mode</span>
            <span className="flex items-center gap-1 text-[9px] font-bold tracking-wider text-accent-green">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-green" />ON-PREM
            </span>
          </div>
          <p className="mt-2 text-[10.5px] leading-snug text-ink-500">
            Every request evaluated by policy on Hetzner. AWS burst gated by tenant rule.
          </p>
          <div className="mt-2.5 flex items-center gap-1.5">
            <Pill tone="amber">Hetzner</Pill>
            <Pill tone="cyan">AWS</Pill>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 w-full">
        <header className="sticky top-0 z-20 h-14 border-b border-border glass flex items-center px-4 gap-3">
          {/* Env chips */}
          <div className="hidden md:flex items-center gap-1.5">
            <EnvChip>{(me.org_name || me.org_id || (me.email || "").split("@")[0] || "workspace").toUpperCase()}</EnvChip>
            <EnvChip>EU · SOVEREIGN</EnvChip>
          </div>

          {/* Command search */}
          <div className="flex-1 flex justify-center px-2">
            <CommandSearch />
          </div>

          {/* Right cluster */}
          <div className="flex items-center gap-2.5">
            <Link href="/subscriptions" title={`Plan: ${TIER_LABEL[tier]}`}>
              <span className="tier-badge" style={{ color: tierColor(tier) }}>{TIER_LABEL[tier]}</span>
            </Link>
            <Pill tone="green" dot className="hidden lg:inline-flex">Healthy</Pill>
            <Pill tone="cyan" className="hidden xl:inline-flex">EU-Sovereign</Pill>
            <span className="w-px h-5 bg-border hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-brand-500/15 border border-brand-500/30 grid place-items-center text-[11px] font-bold text-brand-400 shrink-0">
                {(me.email || "?").charAt(0).toUpperCase()}
              </div>
              <span className="text-xs text-ink-300 truncate max-w-[140px]">{me.email}</span>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              className="grid place-items-center w-8 h-8 rounded-lg text-ink-400 hover:text-accent-red hover:bg-white/[0.04] transition"
            >
              <Icons.LogOut size={15} />
            </button>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-y-auto scroll-thin">{children}</main>
      </div>
    </div>
  );
}

function tierColor(t: string) {
  switch (t) {
    case "enterprise": return "#A78BFA";
    case "sovereign": return "#3EE7A2";
    case "pro": return "#3FB6FF";
    case "starter": return "#FFB547";
    default: return "#8892AB";
  }
}
