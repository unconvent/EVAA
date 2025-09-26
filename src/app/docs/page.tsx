import fs from "fs/promises";
import path from "path";
import { FAQ, type FaqItem } from "@/components/faq";
import { DocsFloater } from "@/components/docs/floater";

export default async function DocsPage() {
  async function read(file: string) {
    try {
      const p = path.join(process.cwd(), file);
      return await fs.readFile(p, "utf8");
    } catch {
      return "";
    }
  }

  const overview = await read("WHAT-THIS-BOILERPLATE-CAN-DO.md");
  const guide = await read("GUIDE.md");
  const playbooks = [
    { id: "playbooks-overview", title: "Playbooks Overview", file: "build-ship-launch-playbooks/README.md" },
    { id: "playbooks-outline", title: "Project Outline & Architecture", file: "build-ship-launch-playbooks/outline.md" },
    { id: "playbooks-design", title: "Design System & UI Standards", file: "build-ship-launch-playbooks/design.md" },
    { id: "playbooks-interaction", title: "Interaction & UX Playbook", file: "build-ship-launch-playbooks/interaction.md" },
    { id: "playbooks-todo", title: "Project TODOs", file: "build-ship-launch-playbooks/todo.md" },
  ] as const;
  const playbookContents = await Promise.all(playbooks.map(async p => ({ ...p, content: await read(p.file) })));

  const faqs: FaqItem[] = [
    {
      q: "Is BoilerKitt really free and open source?",
      a: "Yes. It’s free and open source forever. Use it for personal or commercial projects, modify it, and ship your product without vendor lock‑in.",
    },
    {
      q: "Is this a hosted service or a codebase?",
      a: "It’s a starter codebase. You run it locally, deploy it yourself, and bring your own Supabase/Stripe keys. The pricing page and plan logic are example code.",
    },
    {
      q: "What’s included out of the box?",
      a: "Google sign‑in, Supabase profiles + RLS, Stripe subscriptions with Checkout + Portal, plan gating, example AI features (Together AI + Replicate), and a polished Next.js UI.",
    },
    {
      q: "Can I remove or change the AI features?",
      a: "Absolutely. They’re examples to show server‑side gating and streaming. Keep them, swap the models, or delete them entirely.",
    },
    {
      q: "What happens after I click Let’s Go?",
      a: "You sign in and land on the dashboard where you can try the sample features and explore the plan logic. In your fork you can replace this flow with your own onboarding.",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 text-slate-100">
      {/* Floating nav widget */}
      <DocsFloater />
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-semibold text-white">BoilerKitt Documentation</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Everything you need to use and customize this free, open‑source SaaS boilerplate.</p>
        <nav className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-[var(--muted)]">
          <a href="#overview" className="hover:text-white">Overview</a>
          <span>•</span>
          <a href="#guide" className="hover:text-white">Guide</a>
          <span>•</span>
          <a href="#playbooks" className="hover:text-white">Playbooks</a>
          <span>•</span>
          <a href="#faq" className="hover:text-white">FAQs</a>
        </nav>
      </header>

      <section id="overview" className="rounded-3xl border border-white/10 bg-black/30 p-6 shadow-[0_24px_60px_rgba(6,8,18,0.45)]">
        <h2 className="text-2xl font-semibold text-white">What This Boilerplate Can Do</h2>
        <pre className="mt-4 whitespace-pre-wrap text-sm text-[var(--muted)]">{overview}</pre>
      </section>

      <section id="guide" className="mt-10 rounded-3xl border border-white/10 bg-black/30 p-6 shadow-[0_24px_60px_rgba(6,8,18,0.45)]">
        <h2 className="text-2xl font-semibold text-white">Guide</h2>
        <pre className="mt-4 whitespace-pre-wrap text-sm text-[var(--muted)]">{guide}</pre>
      </section>

      <section id="playbooks" className="mt-10 rounded-3xl border border-white/10 bg-black/30 p-6 shadow-[0_24px_60px_rgba(6,8,18,0.45)]">
        <h2 className="text-2xl font-semibold text-white">Playbooks</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">Action-oriented guides for building and shipping. Edit files under <code>build-ship-launch-playbooks/</code>.</p>
        <div className="mt-6 space-y-8">
          {playbookContents.map(pb => (
            <div key={pb.id} id={pb.id}>
              <h3 className="text-lg font-semibold text-white">{pb.title}</h3>
              <pre className="mt-3 whitespace-pre-wrap text-sm text-[var(--muted)]">{pb.content}</pre>
            </div>
          ))}
        </div>
      </section>

      <section id="faq" className="mt-12">
        <FAQ items={faqs} title="FAQs" />
      </section>
    </div>
  );
}
