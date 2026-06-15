"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { api } from "@/lib/api";

interface PGLStatus {
  has_pgl_profile: boolean;
  requires_onboarding: boolean;
}

export default function Home() {
  const { me, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!me) {
      router.replace("/login");
      return;
    }

    // Check PGL onboarding status before redirecting to dashboard
    api<PGLStatus>("/api/v1/pgl/status")
      .then((status) => {
        if (status.requires_onboarding) {
          router.replace("/onboarding/pgl");
        } else {
          router.replace("/dashboard");
        }
      })
      .catch(() => {
        // On error, proceed to dashboard (fail open for UX)
        router.replace("/dashboard");
      });
  }, [loading, me, router]);

  return (
    <main className="min-h-screen grid place-items-center">
      <div className="text-ink-400 text-sm">
        <Link href="/login" className="underline">Continue to sign in</Link>
      </div>
    </main>
  );
}
