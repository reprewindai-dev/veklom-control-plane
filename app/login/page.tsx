"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button, ErrorBox, GithubButton } from "@/components/ui";
import { AuthLayout } from "@/components/AuthLayout";

export default function LoginPage() {
  const { login, loginWithGithub } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | undefined>();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(undefined);
    try {
      await login(email, pw);
      router.replace("/onboarding/pgl");
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Sovereign sign-in"
      title="Welcome back"
      subtitle="Access your governed AI control plane — wallet, routing, compliance, and audit."
    >
      <GithubButton onClick={loginWithGithub} disabled={busy} />

      <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-widest text-ink-600">
        <span className="h-px flex-1 bg-border" />
        or with email
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="text-xs text-ink-400">Email</label>
          <input
            type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="input mt-1.5"
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs text-ink-400">Password</label>
            <Link href="/forgot-password" className="text-[11px] text-ink-400 hover:text-brand-400">Forgot password?</Link>
          </div>
          <input
            type="password" required value={pw} onChange={(e) => setPw(e.target.value)}
            placeholder="••••••••"
            className="input mt-1.5"
          />
        </div>
        {err && <ErrorBox message={err} />}
        <Button type="submit" loading={busy} className="w-full">
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="text-xs text-ink-400 mt-6 text-center">
        New to Veklom? <Link href="/signup" className="text-brand-400 hover:underline">Create an account</Link>
      </p>
    </AuthLayout>
  );
}
