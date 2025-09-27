import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  const background = "#0c1325";
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: 64,
          background,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 16,
            background: "rgba(255,255,255,0.08)",
            color: "#fff",
            borderRadius: 9999,
            padding: "8px 16px",
            fontSize: 24,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          BoilerKitt
        </div>
        <div
          style={{
            marginTop: 24,
            color: "#fff",
            fontSize: 64,
            fontWeight: 800,
            lineHeight: 1.1,
            textShadow: "0 6px 18px rgba(0,0,0,0.25)",
          }}
        >
          An amazing, FREE, Open‑source SaaS Boilerplate
        </div>
        <div
          style={{
            marginTop: 18,
            color: "rgba(255,255,255,0.92)",
            fontSize: 28,
            maxWidth: 900,
          }}
        >
          Next.js App Router • Supabase Auth • Stripe Billing
        </div>
      </div>
    ),
    { ...size }
  );
}
