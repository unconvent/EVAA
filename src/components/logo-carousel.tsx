"use client";

import { useEffect, useState } from "react";

export function LogoCarousel() {
  const [logos, setLogos] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/logos");
        const json = await res.json().catch(() => ({ files: [] }));
        const files: string[] = Array.isArray(json.files) ? json.files : [];
        const pool = Array.from(new Set(files));
        const take = pool.slice(0, Math.min(10, pool.length));
        const list = [...take, ...take]; // duplicate for seamless scroll
        if (active) setLogos(list);
      } catch {
        if (active) setLogos([]);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="relative mx-auto mt-12 w-full max-w-5xl overflow-hidden py-2 pt-8">
      <div className="logos-track flex items-center gap-16 opacity-80">
        {logos.map((src, i) => (
          <img key={`${src}-${i}`} src={src} alt={`logo-${i}`} width={120} height={40} className="h-10 w-28 shrink-0 rounded-md object-contain opacity-70 grayscale transition hover:opacity-100 hover:grayscale-0" />
        ))}
      </div>
      <style jsx>{`
        .logos-track {
          animation: marquee 28s linear infinite;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
