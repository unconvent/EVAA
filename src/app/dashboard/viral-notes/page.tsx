import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { ViralNotesStudio } from "@/components/viral-notes-studio";
import { FloatingActions } from "@/components/floating-actions";

export const dynamic = "force-dynamic";

type PlanInfo = { plan: string; interval: string | null; lastRunAt: string | null };

async function resolvePlan(client: Awaited<ReturnType<typeof createServerSupabase>>, userId: string): Promise<PlanInfo> {
  const fallback: PlanInfo = { plan: "free", interval: null, lastRunAt: null };
  if (!client) return fallback;
  const { data: sub } = await client
    .from("subscriptions")
    .select("plan, interval, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("subject_last_run_at")
    .eq("id", userId)
    .maybeSingle();
  const lastRunAt = profileError && profileError.code === "42703" ? null : profile?.subject_last_run_at ?? null;
  return { plan: sub?.plan ?? "free", interval: sub?.interval ?? null, lastRunAt };
}

export default async function ViralNotesPage() {
  const supabase = await createServerSupabase();
  if (!supabase) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-slate-100">
        <h1 className="text-2xl font-semibold text-white">Supabase not configured</h1>
        <p className="mt-3 text-[var(--muted)]">Add NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY to enable authentication and the studio.</p>
      </div>
    );
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/pricing?signin=required");
  let planInfo: PlanInfo = { plan: "free", interval: null, lastRunAt: null };
  try { planInfo = await resolvePlan(supabase, user.id); } catch {}
  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <FloatingActions />
      <div className="mb-8">
        <Link href="/dashboard" className="text-sm text-[var(--muted)] transition hover:text-white">← Back to dashboard</Link>
      </div>
      <ViralNotesStudio plan={planInfo.plan} interval={planInfo.interval} lastRunAt={planInfo.lastRunAt} userId={user.id} />
    </main>
  );
}
