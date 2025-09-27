"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, LogOut, LayoutDashboard, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useMemo, useState } from "react";

export function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<null | { email: string }>(null);
  const authEnabled = useMemo(
    () =>
      Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ),
    []
  );

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser({ email: data.user.email ?? "" });
    });
  }, []);

  const handleSignIn = async () => {
    const supabase = createClient();
    if (!supabase) {
      alert("Sign-in is not configured yet. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable authentication.");
      return;
    }
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const linkClass = (href: string) =>
    `transition hover:text-[var(--accent)] ${pathname === href ? "text-[var(--accent)]" : "text-slate-200/80"}`;

  const homeNavLink = (label: string, href: string) => (
    <Link
      key={label}
      href={href}
      className="text-sm font-medium text-slate-100/90 transition hover:text-white"
    >
      {label}
    </Link>
  );

  if (pathname === "/") {
    return (
      <header className="sticky top-0 z-30 w-full border-b border-transparent bg-[#191b2a]">
        <div className="mx-auto grid h-16 max-w-6xl grid-cols-[auto_1fr_auto] items-center px-4">
          {/* Left: Brand */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3">
              <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl">
                <Image
                  src="/imgs_lightning/1.png"
                  alt="BoilerKitt logo"
                  width={40}
                  height={40}
                  priority
                  className="h-10 w-10 rounded-lg object-cover"
                />
              </span>
              <span className="text-lg font-semibold lowercase tracking-tight text-slate-100/90">
                boilerkitt
              </span>
            </Link>
          </div>

          {/* Center: Main navigation */}
          <nav className="hidden items-center justify-center gap-6 whitespace-nowrap md:flex">
            {[
              { label: "Our Services", href: "/#services" },
              { label: "Pricing", href: "#pricing" },
              { label: "FAQ", href: "/#faq" },
              { label: "Case Studies", href: "#case-studies" },
              { label: "Docs", href: "/docs" },
            ].map((item) => homeNavLink(item.label, item.href))}
          </nav>

          {/* Right: Auth / Dashboard actions */}
          <div className="flex items-center justify-end gap-3 text-slate-100">
            {authEnabled && user ? (
              <>
                <Link
                  href="/dashboard"
                  className="hidden items-center gap-2 rounded-full border border-white/30 px-4 py-2 text-sm font-medium text-white/90 transition hover:bg-white/10 lg:inline-flex"
                >
                  <LayoutDashboard size={16} /> Dashboard
                </Link>
                <button
                  onClick={handleSignOut}
                  className="hidden items-center gap-2 rounded-full border border-white/30 px-4 py-2 text-sm font-medium text-white/90 transition hover:bg-white/10 xl:inline-flex"
                >
                  <LogOut size={16} /> Sign out
                </button>
              </>
            ) : authEnabled ? (
              <button
                onClick={handleSignIn}
                className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-4 py-2 text-sm font-medium text-white/90 transition hover:bg-white/10"
              >
                <LogIn size={16} /> Sign in
              </button>
            ) : (
              <span className="text-xs uppercase tracking-wider text-white/70">
                Auth coming soon
              </span>
            )}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-30 w-full border-b border-white/10 bg-[#101527]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 text-sm font-medium text-slate-100">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-base font-semibold tracking-tight text-white">
            BoilerKitt
          </Link>
          <nav className="hidden items-center gap-5 md:flex">
            <Link href="/" className={linkClass("/")}>Home</Link>
            <Link href="/pricing" className={linkClass("/pricing")}>
              Pricing
            </Link>
            <Link href="/docs" className={linkClass("/docs")}>
              Docs
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {authEnabled && user ? (
            <>
              <Link
                href="/dashboard"
                className="cta-secondary cta-compact inline-flex items-center gap-2 px-4 py-1.5 text-sm"
              >
                <LayoutDashboard size={16} /> Dashboard
              </Link>
              <Link
                href="/pricing#pricing"
                className="upgrade-cta cta-compact inline-flex items-center gap-2 px-4 py-1.5 text-sm"
              >
                Upgrade
              </Link>
              <button
                onClick={handleSignOut}
                className="cta-secondary cta-compact inline-flex items-center gap-2 px-4 py-1.5 text-sm"
              >
                <LogOut size={16} /> Sign out
              </button>
            </>
          ) : authEnabled ? (
            <button
              onClick={handleSignIn}
              className="cta-primary cta-compact inline-flex items-center gap-2 px-4 py-1.5 text-sm"
            >
              <LogIn size={16} /> Sign in
            </button>
          ) : null}
          {!authEnabled && (
            <span className="text-xs uppercase tracking-wider text-slate-300/70">
              Auth coming soon
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
