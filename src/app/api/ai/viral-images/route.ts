import { NextResponse } from "next/server";
import Replicate from "replicate";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  title?: string;
  style?: string;
  aspectRatio?: "16:9" | "4:3" | "3:2" | "1:1";
  keywords?: string;
  lessVirality?: boolean;
};

const ONE_HOUR = 1000 * 60 * 60;
const COOLDOWNS: Record<string, number> = {
  free: ONE_HOUR * 24 * 7, // 7 days
  pro: ONE_HOUR * 48, // 48 hours
  legendary: 0,
};

function formatRemaining(ms: number) {
  const totalSeconds = Math.ceil(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const parts = [] as string[];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes && !days) parts.push(`${minutes}m`);
  return parts.join(" ") || `${totalSeconds}s`;
}

function buildPrompt({ title, style, keywords, lessVirality, aspectRatio }: Required<Pick<Body, "title" | "style" | "aspectRatio">> & Pick<Body, "keywords" | "lessVirality">) {
  // Non‑vertical (thumbnail) — leaner template per spec
  const lines: string[] = [];
  lines.push(`Make a viral thumbnail for a post titled "${title}"`);
  if (lessVirality) lines.push(`Title grabs attention. Visuals spark curiosity.`);
  else lines.push(`Title grabs attention. Visuals spark curiosity. Designed to farm engagement.`);
  lines.push('');
  lines.push(`Engaging, eye‑catching visuals. ${style}.`);
  // (No reference image branch in this version)
  lines.push(
    lessVirality
      ? `Bold, creative visuals; highlight action/emotion; captivate the viewer.`
      : `Viral, bold, creative visuals; highlight action/emotion; hook and captivate.`
  );
  if (keywords && String(keywords).trim()) lines.push(`\nAdditional keywords: ${String(keywords).trim()}`);
  // Do not mention placeholder/reference AR; aspect ratio is handled via the model parameter.
  return lines.join('\n');
}

function parseReplicateOutput(output: unknown): string | null {
  if (!output) return null;
  if (typeof output === "string") return output;
  if (Array.isArray(output)) {
    const first = output[0];
    if (!first) return null;
    if (typeof first === "string") return first;
    if (typeof first === "object" && first !== null && "image" in first) {
      const img = (first as { image?: unknown }).image;
      if (typeof img === "string") return img;
    }
  }
  if (typeof output === "object" && output !== null) {
    const obj = output as Record<string, unknown>;
    if (typeof obj.url === "string") return obj.url as string;
    if (typeof obj.image === "string") return obj.image as string;
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Body;
    const title = (body.title || "").trim();
    const style = (body.style || "").trim();
    const aspectRatio = (body.aspectRatio || "16:9") as Body["aspectRatio"];
    const keywords = body.keywords || "";
    const lessVirality = Boolean(body.lessVirality);

    if (!title || !style) {
      return NextResponse.json({ error: "Title and style are required" }, { status: 400 });
    }

    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) {
      return NextResponse.json({ error: "Replicate is not configured on the server." }, { status: 503 });
    }

    // Resolve user + plan (like Viral Notes)
    const supabase = await createServerSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase is not configured on the server." }, { status: 503 });
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ error: "Supabase admin is not configured on the server." }, { status: 503 });
    }

    // Latest subscription row for plan
    const { data: sub } = await admin
      .from("subscriptions")
      .select("plan, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const plan = (sub?.plan ?? "free").toLowerCase();
    const cooldownMs = COOLDOWNS[plan] ?? COOLDOWNS.free;

    // Read profiles.images_last_run_at
    const { data: profileRow, error: profileError } = await admin
      .from("profiles")
      .select("images_last_run_at")
      .eq("id", user.id)
      .maybeSingle();
    if (!profileError && cooldownMs > 0) {
      const last = profileRow?.images_last_run_at ? new Date(profileRow.images_last_run_at) : null;
      if (last && !Number.isNaN(last.getTime())) {
        const elapsed = Date.now() - last.getTime();
        const remaining = cooldownMs - elapsed;
        if (remaining > 0) {
          const retryAt = new Date(last.getTime() + cooldownMs).toISOString();
          return NextResponse.json(
            { error: `Please wait ${formatRemaining(remaining)} before generating new images.`, retry_at: retryAt },
            { status: 429 }
          );
        }
      }
    }

    // Stamp images_last_run_at immediately when allowed
    if (cooldownMs > 0) {
      await admin
        .from("profiles")
        .update({ images_last_run_at: new Date().toISOString() })
        .eq("id", user.id);
    }

    const replicate = new Replicate({ auth: token });
    const prompt = buildPrompt({ title, style, keywords, lessVirality, aspectRatio: aspectRatio || "16:9" });

    // Prepare SSE response
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    const headers: HeadersInit = {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    };

    const response = new Response(stream.readable, { headers });

    (async () => {
      try {
        // Emit prompt
        await writer.write(encoder.encode(`data: ${JSON.stringify({ status: "prompt", prompt })}\n\n`));

        const imageUrls: string[] = [];
        const errors: string[] = [];
        const COUNT = 2; // fixed per run

        for (let i = 0; i < COUNT; i++) {
          try {
            await writer.write(encoder.encode(`data: ${JSON.stringify({ status: "generating", message: `Starting generation ${i + 1}/${COUNT}` })}\n\n`));

            const input: Record<string, unknown> = {
              prompt,
              image_input: [],
              aspect_ratio: aspectRatio || "16:9",
              output_format: "png",
              // Force a single output per run; we loop twice for 2 images total
              num_outputs: 1,
            };

            let output: unknown;
            try {
              // Primary model MUST be google/nano-banana
              output = await replicate.run("google/nano-banana", { input });
            } catch (primaryErr) {
              // Fallback model
              try {
                output = await replicate.run("black-forest-labs/FLUX.1-schnell", { input });
              } catch {
                throw primaryErr instanceof Error ? primaryErr : new Error("Image generation failed");
              }
            }

            const url = parseReplicateOutput(output);
            if (!url) throw new Error("No image URL returned by the model");

            imageUrls.push(url);
            await writer.write(encoder.encode(`data: ${JSON.stringify({ status: "success", imageUrl: url, index: i })}\n\n`));
          } catch (err) {
            const message = err instanceof Error ? err.message : "Generation failed";
            errors.push(message);
            await writer.write(encoder.encode(`data: ${JSON.stringify({ status: "error", message })}\n\n`));
          }
        }

        await writer.write(
          encoder.encode(
            `data: ${JSON.stringify({ status: "complete", imageUrls, errors, successCount: imageUrls.length })}\n\n`
          )
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unexpected error";
        await writer.write(encoder.encode(`data: ${JSON.stringify({ status: "error", message })}\n\n`));
      } finally {
        await writer.close();
      }
    })();

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
