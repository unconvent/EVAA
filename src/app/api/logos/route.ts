import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

export async function GET() {
  try {
    const dir = path.join(process.cwd(), "public", "logos");
    const entries = await fs.readdir(dir).catch(() => [] as string[]);
    const allowed = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"]);
    const files = entries
      .filter((f) => allowed.has(path.extname(f).toLowerCase()))
      .map((f) => `/logos/${f}`);
    return NextResponse.json({ files });
  } catch (error) {
    console.error("Failed to list logos", error);
    return NextResponse.json({ files: [] });
  }
}

