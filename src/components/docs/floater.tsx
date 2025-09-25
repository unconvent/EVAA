"use client";

export function DocsFloater() {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="fixed right-4 top-1/2 z-40 -translate-y-1/2 md:right-6">
      <div className="flex w-12 flex-col items-center gap-3 rounded-2xl border border-white/10 bg-black/40 p-2 text-xs text-white shadow-[0_20px_50px_rgba(6,8,18,0.45)] backdrop-blur-md md:w-14">
        <button
          onClick={() => scrollTo("overview")}
          aria-label="Go to Overview"
          className="h-9 w-9 rounded-full border border-white/10 bg-white/10 transition hover:bg-white/20 md:h-10 md:w-10"
          title="Overview"
        >
          O
        </button>
        <button
          onClick={() => scrollTo("guide")}
          aria-label="Go to Guide"
          className="h-9 w-9 rounded-full border border-white/10 bg-white/10 transition hover:bg-white/20 md:h-10 md:w-10"
          title="Guide"
        >
          G
        </button>
        <button
          onClick={() => scrollTo("faq")}
          aria-label="Go to FAQs"
          className="h-9 w-9 rounded-full border border-white/10 bg-white/10 transition hover:bg-white/20 md:h-10 md:w-10"
          title="FAQs"
        >
          F
        </button>
      </div>
    </div>
  );
}

