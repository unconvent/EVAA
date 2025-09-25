"use client";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function AuthCallback() {
  const router = useRouter();
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      router.replace("/");
      return;
    }
    supabase.auth
      .exchangeCodeForSession(window.location.href)
      .then(() => router.replace("/dashboard"))
      .catch(() => router.replace("/"));
  }, [router]);
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <p className="text-gray-600">Signing you in…</p>
    </div>
  );
}
