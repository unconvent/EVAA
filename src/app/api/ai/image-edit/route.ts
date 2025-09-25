import { NextResponse } from "next/server";
import Replicate from "replicate";
import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: "Replicate is not configured on the server." },
        { status: 503 }
      );
    }

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

    // Only LEGENDARY plan may use image editor
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const plan = (sub?.plan ?? "free").toLowerCase();
    if (plan !== "legendary") {
      return NextResponse.json(
        { error: "Image editor is available only to LEGENDARY subscribers." },
        { status: 402 }
      );
    }

    const form = await req.formData();
    const prompt = String(form.get("prompt") || "").trim();
    const model = String(form.get("model") || "qwen/qwen-image-edit");
    const file = form.get("image");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "Image file is required." }, { status: 400 });
    }

    const replicate = new Replicate({ auth: token });

    // Build input based on selected model
    let input: Record<string, unknown>;
    if (model === "google/nano-banana") {
      input = {
        prompt: prompt ||
          "Change the backdrop to a beautiful parisian style vintage cafe. Natural lighting, cinematic mood.",
        image_input: [file],
        output_format: "jpg",
      } as Record<string, unknown>;
    } else if (model === "qwen/qwen-image-edit") {
      input = {
        image: file,
        prompt: prompt || "Enhance this photo with natural lighting and cinematic tone.",
        go_fast: false,
        aspect_ratio: "match_input_image",
        output_format: "webp",
        output_quality: 80,
      } as Record<string, unknown>;
    } else {
      return NextResponse.json({ error: "Unsupported model." }, { status: 400 });
    }

    const output: unknown = await replicate.run(model, { input });

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
        { error: "Image edit returned no URL." },
        { status: 502 }
      );
    }

    return NextResponse.json({ images: urls });
  } catch (error) {
    console.error("Image edit error", error);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
