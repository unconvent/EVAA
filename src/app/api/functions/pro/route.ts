import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createServerSupabase();
  if (!supabase)
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("subscriptions")
    .select("plan,status")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!data || (data.plan ?? "").toLowerCase() === "free") {
    return NextResponse.json({ error: "Requires PRO plan" }, { status: 402 });
  }

  return NextResponse.json({
    message: "Pro analyze complete",
    insights: ["trend-up", "outlier-detected"],
  });
}
