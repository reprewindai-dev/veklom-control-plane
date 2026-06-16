"use client";

import clsx from "clsx";
import { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Github } from "lucide-react";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex items-start gap-4 mb-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gradient">{title}</h1>
        {subtitle && <p className="text-sm text-ink-400 mt-1.5 max-w-2xl">{subtitle}</p>}
      </div>
      {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className, hover }: { children: ReactNode; className?: string; hover?: boolean }) {
  return <div className={clsx("card p-5", hover && "card-hover", className)}>{children}</div>;
}

export function StatCard({ label, value, hint, accent }: { label: string; value: ReactNode; hint?: string; accent?: string }) {
  return (
    <Card hover className="min-w-0 relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-brand-500/10 blur-2xl" />
      <div className="text-[11px] uppercase tracking-widest text-ink-400">{label}</div>
      <div className={clsx("mt-1.5 text-3xl font-semibold tracking-tight", accent)}>{value}</div>
      {hint && <div className="text-xs text-ink-400 mt-1">{hint}</div>}
    </Card>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <span className={clsx("spinner", className)} aria-hidden />;
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <Card className="text-center py-10">
      <div className="text-ink-200">{title}</div>
      {hint && <div className="text-xs text-ink-400 mt-1">{hint}</div>}
    </Card>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-accent-red/40 bg-accent-red/10 px-4 py-3 text-accent-red text-sm">
      <AlertTriangle size={16} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function SuccessBox({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-accent-green/40 bg-accent-green/10 px-4 py-3 text-accent-green text-sm">
      <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("skeleton rounded-md", className)} />;
}

export function GithubButton({ onClick, label = "Continue with GitHub", disabled }: { onClick?: () => void; label?: string; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="btn btn-ghost w-full">
      <Github size={16} />
      {label}
    </button>
  );
}

export function Table<T>({
  rows, columns, empty, rowKey,
}: {
  rows: T[];
  columns: { key: string; header: string; render: (r: T) => ReactNode; width?: string }[];
  empty?: string;
  rowKey: (r: T) => string;
}) {
  if (!rows || rows.length === 0) return <Empty title={empty || "No records"} />;
  return (
    <Card className="overflow-x-auto p-0">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-widest text-ink-400 border-b border-border">
            {columns.map((c) => (
              <th key={c.key} className="px-4 py-3 font-medium" style={{ width: c.width }}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={rowKey(r)} className="border-b border-border/60 last:border-0 hover:bg-bg-700/40">
              {columns.map((c) => (
                <td key={c.key} className="px-4 py-3 align-top">{c.render(r)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

export function Button({ children, onClick, variant = "primary", type = "button", disabled, loading, className, size }: {
  children: ReactNode; onClick?: () => void; variant?: "primary" | "ghost" | "danger" | "outline"; type?: "button" | "submit"; disabled?: boolean; loading?: boolean; className?: string; size?: "sm" | "md" | "lg";
}) {
  return (
    <button
      type={type} onClick={onClick} disabled={disabled || loading}
      className={clsx(
        "btn",
        variant === "primary" && "btn-primary",
        variant === "ghost" && "btn-ghost",
        variant === "danger" && "bg-accent-red/20 hover:bg-accent-red/30 text-accent-red border border-accent-red/40",
        variant === "outline" && "bg-transparent hover:bg-white/5 text-ink-200 border border-white/20",
        className
      )}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}
