import { NextResponse } from "next/server";
import Replicate from "replicate";
import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { prompt } = (await req.json().catch(() => ({}))) as {
      prompt?: string;
    };

    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: "Replicate is not configured on the server." },
        { status: 503 }
      );
    }

    // Require authenticated user and check plan
    const supabase = await createServerSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured." }, { status: 503 });
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const plan = (sub?.plan ?? "free").toLowerCase();
    if (plan !== "pro" && plan !== "legendary") {
      return NextResponse.json(
        { error: "Please upgrade your plan to use this feature." },
        { status: 402 }
      );
    }

    const replicate = new Replicate({ auth: token });

    const input = {
      prompt:
        prompt?.trim() ||
        "A beautiful realistic aerial photo of victoria falls taken with a medium format camera. An amazing award winning photograph, natural lighting, intense, vivid, atmospheric.",
      go_fast: true,
      guidance: 4,
      strength: 0.9,
      image_size: "optimize_for_quality",
      lora_scale: 1,
      aspect_ratio: "16:9",
      output_format: "webp",
      enhance_prompt: true,
      output_quality: 80,
      negative_prompt: " ",
      num_inference_steps: 50,
    } as Record<string, unknown>;

    // Qwen image model
    const output: unknown = await replicate.run("qwen/qwen-image", { input });

    const urls: string[] = [];
    const pushIfUrl = (v: unknown) => {
      if (!v) return;
      if (typeof v === "string" && /^https?:\/\//.test(v)) urls.push(v);
      else if (typeof v === "object") {
        const obj = v as Record<string, unknown>;
        const u = obj?.url as unknown;
        if (typeof u === "string") urls.push(u);
        else if (typeof u === "function") {
          try {
            const res = (u as () => unknown)();
            if (typeof res === "string") urls.push(res);
          } catch {}
        }
      }
    };

    if (Array.isArray(output)) {
      for (const item of output) pushIfUrl(item);
    } else {
      pushIfUrl(output);
    }

    if (!urls.length) {
      return NextResponse.json(
        { error: "Image generation returned no URL." },
        { status: 502 }
      );
    }

    return NextResponse.json({ images: urls });
  } catch (error) {
    console.error("Image generation error", error);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
