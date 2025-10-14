"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Home } from "lucide-react";

export function FloatingActions() {
  const router = useRouter();
  const items = [
    { icon: Home, alt: "Home", href: "/dashboard", title: "Home" },
    { src: "/icons/note.png", alt: "Viral Notes", href: "/dashboard/viral-notes", title: "Viral Notes" },
    { src: "/icons/image.png", alt: "Viral Images", href: "/dashboard/viral-images", title: "Viral Images" },
  ] as const;

  return (
    <div className="fixed left-4 top-1/2 z-40 -translate-y-1/2 md:left-6">
      <div className="flex w-14 flex-col items-center gap-3 rounded-2xl border border-white/10 bg-black/40 p-2 text-xs text-white shadow-[0_20px_50px_rgba(6,8,18,0.45)] backdrop-blur-md">
        {items.map((it) => (
          <button
            key={it.href}
            onClick={() => router.push(it.href)}
            aria-label={it.title}
            title={it.title}
            className="group h-12 w-12 overflow-hidden rounded-full border border-white/10 bg-white/10 transition hover:bg-white/20"
          >
            <span className="relative inline-flex h-12 w-12 items-center justify-center">
              {"src" in it && it.src ? (
                <Image
                  src={it.src}
                  alt={it.alt}
                  width={36}
                  height={36}
                  className="object-contain opacity-90 transition group-hover:opacity-100"
                />
              ) : (
                <Home size={22} className="text-white/90 transition group-hover:text-white" />
              )}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
