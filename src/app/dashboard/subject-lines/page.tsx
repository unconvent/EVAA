import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { SubjectLineStudio } from "@/components/subject-line-studio";

export const dynamic = "force-dynamic";

// Resolve the user's active plan using the same approach as the dashboard:
// read latest row from `subscriptions` and separately fetch the last studio run timestamp.
type PlanInfo = { plan: string; interval: string | null; lastRunAt: string | null };

async function resolvePlan(
  client: Awaited<ReturnType<typeof createServerSupabase>>,
  userId: string
): Promise<PlanInfo> {
  const fallback: PlanInfo = { plan: "free", interval: null, lastRunAt: null };
  if (!client) return fallback;

  // Get latest subscription record for plan/interval (interval currently not used for cooldowns)
  const { data: sub, error: subError } = await client
    .from("subscriptions")
    .select("plan, interval, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Fetch last run timestamp from profiles if present (ignore schema missing)
  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("subject_last_run_at")
    .eq("id", userId)
    .maybeSingle();

  const lastRunAt = profileError && profileError.code === "42703" ? null : profile?.subject_last_run_at ?? null;

  if (subError && !sub) {
    // If no subscription row found or query failed, fall back to free
    return { plan: "free", interval: null, lastRunAt };
  }

  return {
    plan: sub?.plan ?? "free",
    interval: sub?.interval ?? null,
    lastRunAt,
  };
}

export default async function SubjectLinesPage() {
  const supabase = await createServerSupabase();
  if (!supabase) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-slate-100">
        <h1 className="text-2xl font-semibold text-white">Supabase not configured</h1>
        <p className="mt-3 text-[var(--muted)]">
          Add NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY to enable authentication and the studio.
        </p>
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/pricing?signin=required");
  }

  let planInfo: PlanInfo;
  try {
    planInfo = await resolvePlan(supabase, user.id);
  } catch (error) {
    console.error("Failed to fetch plan for subject line studio", error);
    planInfo = { plan: "free", interval: null, lastRunAt: null };
  }

  const plan = planInfo.plan ?? "free";
  const interval = planInfo.interval ?? null;
  const lastRunAt = planInfo.lastRunAt;

  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <div className="mb-8">
        <Link href="/dashboard" className="text-sm text-[var(--muted)] transition hover:text-white">
          ← Back to dashboard
        </Link>
      </div>
      <SubjectLineStudio plan={plan} interval={interval} lastRunAt={lastRunAt} userId={user.id} />
    </main>
  );
}
