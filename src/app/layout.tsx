import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const title = "EVAA - Turn Your Newsletter Into A$10K/Month Business";
const description = "Authentication, billing, plan gating, and a polished Next.js UI powered by Supabase and Stripe — free and open source.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title,
  description,
  icons: {
    // Cache-bust with a version param to avoid favicon caching during dev
    icon: "/icons/icons8-newsletter-64.png?v=2",
    shortcut: "/icons/icons8-newsletter-64.png?v=2",
    apple: "/icons/icons8-newsletter-64.png?v=2",
  },
  openGraph: {
    title,
    description,
    url: "/",
    siteName: "EVAA",
    images: [{ url: "/OG-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/OG-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Navbar />
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
