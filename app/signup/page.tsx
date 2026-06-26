"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button, ErrorBox, SuccessBox, GithubButton } from "@/components/ui";
import { AuthLayout } from "@/components/AuthLayout";

const MIN_PW = 8;

export default function SignupPage() {
  const { signup, loginWithGithub } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | undefined>();
  const [ok, setOk] = useState<string | undefined>();

  const pwTooShort = pw.length > 0 && pw.length < MIN_PW;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(undefined); setOk(undefined);
    if (pw.length < MIN_PW) {
      setErr(`Password must be at least ${MIN_PW} characters.`);
      return;
    }
    setBusy(true);
    try {
      const { autoSignedIn } = await signup(email, pw, name || undefined);
      if (autoSignedIn) {
        setOk("Account created. Taking you to your workspace onboarding…");
        router.replace("/onboarding/pgl");
      } else {
        setOk("Account created. Please sign in to continue.");
        setTimeout(() => router.replace("/login"), 1400);
      }
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="14-day free trial"
      title="Create your account"
      subtitle="Spin up a governed AI workspace in minutes. No credit card required to start."
    >
      <GithubButton onClick={loginWithGithub} label="Sign up with GitHub" disabled={busy} />

      <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-widest text-ink-600">
        <span className="h-px flex-1 bg-border" />
        or with email
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="text-xs text-ink-400">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Lovelace" className="input mt-1.5" />
        </div>
        <div>
          <label className="text-xs text-ink-400">Work email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className="input mt-1.5" />
        </div>
        <div>
          <label className="text-xs text-ink-400">Password</label>
          <input type="password" required value={pw} onChange={(e) => setPw(e.target.value)} placeholder="At least 8 characters" className="input mt-1.5" />
          <div className="mt-1.5 text-[11px]">
            <span className={pwTooShort ? "text-accent-amber" : "text-ink-600"}>
              {pwTooShort ? `${MIN_PW - pw.length} more character${MIN_PW - pw.length === 1 ? "" : "s"} needed` : `Minimum ${MIN_PW} characters`}
            </span>
          </div>
        </div>
        {err && <ErrorBox message={err} />}
        {ok && <SuccessBox message={ok} />}
        <Button type="submit" loading={busy} disabled={!!ok} className="w-full">
          {busy ? "Creating…" : "Create account"}
        </Button>
      </form>

      <p className="text-xs text-ink-400 mt-6 text-center">
        Already have an account? <Link href="/login" className="text-brand-400 hover:underline">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
