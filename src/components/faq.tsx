"use client";

import { useState } from "react";

export type FaqItem = { q: string; a: string };

export function FAQ({ items, title }: { items: FaqItem[]; title?: string }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="mt-12">
      {title ? (
        <h2 className="text-center text-3xl font-semibold text-white">{title}</h2>
      ) : null}
      <div className="mx-auto mt-6 max-w-3xl divide-y divide-white/10 overflow-hidden rounded-3xl border border-white/10">
        {items.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={item.q} className="bg-black/30">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-white hover:bg-white/5"
                aria-expanded={isOpen}
                aria-controls={`faq-${i}`}
              >
                <span className="text-sm font-medium">{item.q}</span>
                <svg
                  className={`h-4 w-4 flex-none transition-transform ${isOpen ? "rotate-180" : "rotate-0"}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              {isOpen ? (
                <div id={`faq-${i}`} className="px-5 pb-5 text-sm text-[var(--muted)]">
                  {item.a}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

