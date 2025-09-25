import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const TOGETHER_CHAT_URL = "https://api.together.xyz/v1/chat/completions";

const COOLDOWNS: Record<string, number> = {
  free: 1000 * 60 * 60 * 3,
  pro: 1000 * 60 * 3,
  legendary: 1000 * 30,
};

function formatRemaining(ms: number) {
  const totalSeconds = Math.ceil(ms / 1000);
  if (totalSeconds >= 3600) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const suffix = minutes ? ` ${minutes}m` : "";
    return `${hours}h${suffix}`;
  }
  if (totalSeconds >= 60) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const suffix = seconds ? ` ${seconds}s` : "";
    return `${minutes}m${suffix}`;
  }
  return `${totalSeconds}s`;
}

export const runtime = "nodejs";

async function fetchPlanInfo(client: ReturnType<typeof createAdminClient>, userId: string) {
  const fallback = { plan: "free", lastRunAt: null as string | null, canStoreLastRun: false };
  if (!client) return fallback;

  // 1) Source of truth for plan: latest subscriptions row
  const { data: subscription, error: subError } = await client
    .from("subscriptions")
    .select("plan, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (subError && !subscription) {
    // If subscriptions lookup fails, fall back to free plan
    console.warn("Failed to read subscriptions for plan; defaulting to free", subError);
  }

  const plan = subscription?.plan ?? "free";

  // 2) Last run timestamp comes from profiles.subject_last_run_at. Missing column is OK.
  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("subject_last_run_at")
    .eq("id", userId)
    .maybeSingle();

  if (!profileError) {
    return {
      plan,
      lastRunAt: profile?.subject_last_run_at ?? null,
      canStoreLastRun: true,
    };
  }

  if (profileError.code === "42703") {
    // Column missing in this project; skip persistence
    return {
      plan,
      lastRunAt: null,
      canStoreLastRun: false,
    };
  }

  throw profileError;
}

export async function POST(req: Request) {
  try {
    const { audience } = (await req.json().catch(() => ({}))) as {
      audience?: string;
    };

    if (!audience || typeof audience !== "string" || !audience.trim()) {
      return NextResponse.json(
        { error: "Describe the audience, niche, or offer first." },
        { status: 400 }
      );
    }

    const apiKey = process.env.TOGETHER_API_KEY;
    if (!apiKey) {
      console.error("TOGETHER_API_KEY is not configured.");
      return NextResponse.json(
        { error: "Together AI is not configured on the server." },
        { status: 503 }
      );
    }

    const supabase = await createServerSupabase();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase is not configured on the server." },
        { status: 503 }
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    if (!admin) {
      console.error("Supabase admin client unavailable; set SUPABASE_SERVICE_ROLE_KEY.");
      return NextResponse.json(
        { error: "Supabase service role key missing on the server." },
        { status: 503 }
      );
    }

    let planInfo;
    try {
      planInfo = await fetchPlanInfo(admin, user.id);
    } catch (profileError) {
      console.error("Failed to load profile for subject line generation", profileError);
      return NextResponse.json(
        { error: "Unable to verify plan. Please try again later." },
        { status: 500 }
      );
    }

    const plan = planInfo.plan.toLowerCase();
    const cooldownMs = COOLDOWNS[plan] ?? COOLDOWNS.free;
    const lastRun = planInfo.lastRunAt ? new Date(planInfo.lastRunAt) : null;
    const now = Date.now();

    if (lastRun && !Number.isNaN(lastRun.getTime())) {
      const elapsed = now - lastRun.getTime();
      const remaining = cooldownMs - elapsed;
      if (remaining > 0) {
        const retryAt = new Date(lastRun.getTime() + cooldownMs).toISOString();
        return NextResponse.json(
          {
            error: `Please wait ${formatRemaining(remaining)} before generating new subject lines.`,
            retry_at: retryAt,
          },
          { status: 429 }
        );
      }
    }

    if (planInfo.canStoreLastRun) {
      const timestamp = new Date(now).toISOString();
      const { error: updateError } = await admin
        .from("profiles")
        .update({ subject_last_run_at: timestamp })
        .eq("id", user.id);

      if (updateError && updateError.code !== "42703") {
        console.error("Failed to store subject line cooldown timestamp", updateError);
      }
    }

    const systemPrompt =
      "You are a veteran direct-response copywriter who mastered Eugene Schwartz's Breakthrough Advertising. " +
      "You write concise, curiosity-driven subject lines that trigger desire and urgency without sounding spammy.";

    const userPrompt = `Audience or ideal customer: ${audience.trim()}

` +
      "Write 12 email subject lines that would achieve extremely high open rates. " +
      "Use the teachings and frameworks from Breakthrough Advertising. Each subject line must stand on its own, without numbering, explanations, or extra copy. Output only the 12 subject lines, one per line.";

    const togetherResponse = await fetch(TOGETHER_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
        max_tokens: 64000,
        reasoning_effort: "medium",
      }),
    });

    if (!togetherResponse.ok || !togetherResponse.body) {
      const errorText = await togetherResponse.text().catch(() => "Unable to read Together AI response");
      console.error("Together AI request failed", togetherResponse.status, errorText);
      return NextResponse.json(
        { error: "Together AI request failed. Check server logs for details." },
        { status: 502 }
      );
    }

    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    let closed = false;
    const closeWriter = async () => {
      if (!closed) {
        closed = true;
        await writer.close();
      }
    };

    (async () => {
      const reader = togetherResponse.body!.getReader();
      let buffer = "";
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let newlineIndex;
          while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
            const line = buffer.slice(0, newlineIndex).trim();
            buffer = buffer.slice(newlineIndex + 1);
            if (!line || line.startsWith(":")) continue;
            if (line === "data: [DONE]") {
              await closeWriter();
              return;
            }
            if (line.startsWith("data:")) {
              const payload = line.slice(5).trim();
              if (!payload) continue;
              try {
                const json = JSON.parse(payload);
                const token = json.choices?.[0]?.delta?.content;
                if (token) {
                  await writer.write(encoder.encode(token));
                }
              } catch (parseError) {
                console.error("Failed to parse Together AI chunk", parseError, payload);
              }
            }
          }
        }
      } catch (streamError) {
        console.error("Together AI stream error", streamError);
        await writer.abort(streamError);
        return;
      }
      await closeWriter();
    })();

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Subject line generator error", error);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
