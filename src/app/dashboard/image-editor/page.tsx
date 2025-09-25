import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { ImageEditor } from "@/components/image-editor";

export const dynamic = "force-dynamic";

export default async function ImageEditorPage() {
  const supabase = await createServerSupabase();
  if (!supabase) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-slate-100">
        <h1 className="text-2xl font-semibold text-white">Supabase not configured</h1>
        <p className="mt-3 text-[var(--muted)]">
          Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable authentication for the demo.
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

  let plan: string = "free";
  try {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    plan = sub?.plan ?? "free";
  } catch {}

  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <div className="mb-8">
        <Link href="/dashboard" className="text-sm text-[var(--muted)] transition hover:text-white">
          ← Back to dashboard
        </Link>
      </div>
      <ImageEditor plan={plan} />
    </main>
  );
}

