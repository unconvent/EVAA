import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const POLLINATIONS_URL = "https://enter.pollinations.ai/api/generate/v1/chat/completions";
export const dynamic = "force-dynamic";

// Free: limit to 1 run per 24h; Pro/Legendary: unlimited (no cooldown)
const COOLDOWNS: Record<string, number> = {
  free: 1000 * 60 * 60 * 24,
  pro: 0,
  legendary: 0,
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
  const { data: subscription } = await client
    .from("subscriptions")
    .select("plan, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const plan = subscription?.plan ?? "free";

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("notes_last_run_at")
    .eq("id", userId)
    .maybeSingle();

  if (!profileError) {
    return { plan, lastRunAt: profile?.notes_last_run_at ?? null, canStoreLastRun: true };
  }
  if (profileError.code === "42703") {
    return { plan, lastRunAt: null, canStoreLastRun: false };
  }
  throw profileError;
}

type NoteType = "trust" | "awareness" | "clarity";

export async function POST(req: Request) {
  try {
    const { topic, noteType } = (await req.json().catch(() => ({}))) as {
      topic?: string;
      noteType?: NoteType;
    };
    if (!topic || typeof topic !== "string" || !topic.trim()) {
      return NextResponse.json({ error: "Describe your topic first." }, { status: 400 });
    }

    const apiKey = process.env.POLLINATIONS_API_TOKEN;
    const model = process.env.POLLINATIONS_MODEL || "openai-large";
    if (!apiKey) {
      console.error("POLLINATIONS_API_TOKEN is not configured.");
      return NextResponse.json({ error: "Pollinations API is not configured on the server." }, { status: 503 });
    }

    const supabase = await createServerSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase is not configured on the server." }, { status: 503 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createAdminClient();
    if (!admin) {
      console.error("Supabase admin client unavailable; set SUPABASE_SERVICE_ROLE_KEY.");
      return NextResponse.json({ error: "Supabase service role key missing on the server." }, { status: 503 });
    }

    let planInfo;
    try {
      planInfo = await fetchPlanInfo(admin, user.id);
    } catch (e) {
      console.error("Failed to load profile for notes generation", e);
      return NextResponse.json({ error: "Unable to verify plan." }, { status: 500 });
    }

    const plan = (planInfo.plan || "free").toLowerCase();
    const cooldownMs = COOLDOWNS[plan] ?? COOLDOWNS.free;
    const lastRun = planInfo.lastRunAt ? new Date(planInfo.lastRunAt) : null;
    const now = Date.now();
    if (cooldownMs > 0 && lastRun && !Number.isNaN(lastRun.getTime())) {
      const elapsed = now - lastRun.getTime();
      const remaining = cooldownMs - elapsed;
      if (remaining > 0) {
        const retryAt = new Date(lastRun.getTime() + cooldownMs).toISOString();
        return NextResponse.json(
          { error: `Please wait ${formatRemaining(remaining)} before generating new notes.`, retry_at: retryAt },
          { status: 429 }
        );
      }
    }

    if (planInfo.canStoreLastRun) {
      const timestamp = new Date(now).toISOString();
      const { error: updateError } = await admin
        .from("profiles")
        .update({ notes_last_run_at: timestamp })
        .eq("id", user.id);
      if (updateError && updateError.code !== "42703") {
        console.error("Failed to store notes cooldown timestamp", updateError);
      }
    }

    const typeLabel = noteType === "trust" ? "trust" : noteType === "clarity" ? "clarity" : noteType === "awareness" ? "awareness" : undefined;

    const typeBlock = (() => {
      if (noteType === "trust") {
        return (
          "A Trust Note solves the problem : \"Everyone in this space sounds the same. Who's actually real?\"\n" +
          "It solves it by:\n" +
          "Showing behind-the-scenes of your reality\n" +
          "Admitting uncomfortable truths\n" +
          "Sharing what you're actually struggling with\n" +
          "These Notes make them think: \"This person gets it. They're not full of shit.\"\n\n"
        );
      }
      if (noteType === "clarity") {
        return (
          "A Clarity Note solves the Problem: \"I know I need help but I don't know what's available.\"\n" +
          "It solves it by:\n" +
          "Telling them exactly what you offer\n" +
          "Showing who it's for and who it's not for\n" +
          "Making it easy to say yes or no\n" +
          "These Notes make them think: \"Oh, that's exactly what I need.\"\n\n"
        );
      }
      if (noteType === "awareness") {
        return (
          "An Awareness Note solves the Problem: \"I don't even know this solution exists.\"\n" +
          "It solves it by:\n" +
          "Teaching something valuable for free\n" +
          "Showing a glimpse of your methodology\n" +
          "Making them want to learn more\n" +
          "These Notes make them think: \"I need to follow this person.\"\n\n"
        );
      }
      return "";
    })();

    const userPrompt = `USER TOPIC = ${topic.trim()}\n\n` +
      // High-level goal
      `Write exactly 5 highly engaging ${typeLabel ? typeLabel + " " : ""} notes designed to go viral on the USER TOPIC above. Keep them punchy, impactful, and useful. No fluff.\n\n` +
      // Composition requirements
      "Of the 5 notes: write 4 as SHORT-FORM and 1 as LONG-FORM.\n\n" +
      // Insert the type characteristics block if present
      typeBlock +
      // Short-form spec
      "SHORT-FORM (4 notes):\n" +
      "- Begin with a STRONG hook (max 10 words).\n" +
      "- After the hook, continue for 4–9 lines.\n" +
      "- Vary the line counts across the 4 notes (e.g., 4, 7, 3, 9). They must NOT all have the same number of lines.\n" +
      "- Each line is a short, sweet sentence on its own line.\n" +
      "- Every sentence should stand on its own and deliver tangible value.\n" +
      "- Each note, as a whole, must deliver real value, connect emotionally, educate or entertain.\n\n" +
      // Long-form spec
      "LONG-FORM (1 note):\n" +
      "- Educational, personal, and story-driven.\n" +
      "- At least 400 words.\n" +
      "- Structured with short lines (one sentence per line) for readability.\n\n" +
      // Style guidance
      "Style & Constraints:\n" +
      "- Challenge assumptions, reframe ideas, or create urgency.\n" +
      "- Natural, conversational, sharp. Avoid jargon, fancy words, and emojis.\n" +
      "- Optimistic but grounded—no empty inspiration.\n" +
      "- If the topic is about Substack, highlight consistency, value, the long game, and Substack's organic advantages.\n" +
      "- Each sentence on a new line. Maximize readability.\n" +
      "- DO NOT end notes with a question.\n\n" +
      // Hooks guidance (click-baity but high-signal)
      "Hooks must be eye-catching and creative, triggering emotion and curiosity without low-value clickbait. Prefer: specific numbers, surprising stats, bold contrasts, time-bound stakes, social proof, or counterintuitive insight. Use vivid, imperative verbs and write in second person to create immediacy. No question marks. Follow the hook with a re-hook in the first sentence.\n\n" +
      // Output format + hard bans
      "Separate each note with the markdown delimiter ###---###.\n" +
      "Output only the notes and nothing else—no explanations or extra text.\n" +
      "HARD BANS (must comply):\n" +
      "- Do NOT number, label, or preface anything (no 'SHORT-FORM', 'LONG-FORM', 'Note', 'Hook', etc.).\n" +
      "- Do NOT include headings or markdown formatting (no **bold**, _italics_, # headings, > blockquotes, or code fences).\n" +
      "- Do NOT use bullet markers at the start of lines (- , * , • , 1. , (1), etc.).\n" +
      "- Begin each note directly with the hook text on the first line, then the remaining lines of the note.\n" +
      "- Never include the words 'Hook', 'Short-form', or 'Long-form' anywhere in the output.";


      const seed = Math.floor(Math.random() * 0x7fffffff);

      const llmRes = await fetch(POLLINATIONS_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: userPrompt }],
          seed,
        }),
      });
  
      if (!llmRes.ok) {
        const errorText = await llmRes.text().catch(() => "Unable to read Pollinations response");
        console.error("Pollinations request failed", llmRes.status, errorText);
        return NextResponse.json(
          { error: "Pollinations request failed. Check server logs for details." },
          { status: 502 }
        );
      }
  
      const reader = llmRes.body?.getReader();
      if (!reader) {
        console.error("Pollinations response missing body");
        return NextResponse.json(
          { error: "Pollinations response was empty." },
          { status: 502 }
        );
      }
  
      const decoder = new TextDecoder();
      let buffer = "";
      let output = "";
  
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
  
        let idx;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, idx).trim();
          buffer = buffer.slice(idx + 1);
  
          if (!line || line.startsWith(":")) continue;
          if (line === "data: [DONE]") {
            buffer = "";
            break;
          }
  
          if (line.startsWith("data:")) {
            const payload = line.slice(5).trim();
            if (!payload) continue;
            try {
              const json = JSON.parse(payload);
              const token =
                json.choices?.[0]?.delta?.content ||
                json.choices?.[0]?.message?.content ||
                "";
              if (token) output += token;
            } catch {
              // ignore non-JSON chunks
            }
          }
        }
      }
  
      if (!output.trim()) {
        console.error("Pollinations stream returned no content");
        return NextResponse.json(
          { error: "Pollinations response was empty." },
          { status: 502 }
        );
      }
  
      return new Response(output, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
        },
      });
  } catch (error) {
    console.error("Viral notes generator error", error);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
