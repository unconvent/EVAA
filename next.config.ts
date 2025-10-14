import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Ensure browsers requesting /favicon.ico get our PNG icon
      { source: "/favicon.ico", destination: "/icons/icons8-newsletter-64.png" },
    ];
  },
  async headers() {
    return [
      {
        source: "/favicon.ico",
        headers: [
          // Help during development to see favicon changes immediately
          { key: "Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
};

export default nextConfig;
