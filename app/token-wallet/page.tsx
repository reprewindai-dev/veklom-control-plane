"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TokenWalletAliasPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/wallet");
  }, [router]);

  return (
    <main className="min-h-screen grid place-items-center">
      <div className="text-ink-400 text-sm">Opening token wallet...</div>
    </main>
  );
}
