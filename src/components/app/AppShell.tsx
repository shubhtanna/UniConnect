"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/Logo";

const navItems = [
  { href: "/dashboard", label: "Dashboard", short: "Home", icon: "⌂", mobilePrimary: true },
  { href: "/profile", label: "My profile", short: "Profile", icon: "◎" },
  { href: "/connections?mode=browse", label: "Student directory", short: "Directory", icon: "☷", mobilePrimary: true },
  { href: "/connections?mode=search", label: "AI people search", short: "AI search", icon: "⌕", mobilePrimary: true },
  { href: "/insights", label: "Discovery insights", short: "Insights", icon: "◇" },
  { href: "/groups", label: "Brainstorm groups", short: "Groups", icon: "#" },
  { href: "/feed?type=community", label: "Community feed", short: "Feed", icon: "◫", mobilePrimary: true },
  { href: "/feed?type=spotlight", label: "Venture showcase", short: "Showcase", icon: "✦" },
];
const DEFAULT_VIEWS = new Set(["browse", "community"]);
const mobilePrimaryItems = navItems.filter((item) => item.mobilePrimary);
const mobileMoreItems = navItems.filter((item) => !item.mobilePrimary);

export function AppShell({
  children,
  email,
}: {
  children: React.ReactNode;
  email: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const [pendingHref, setPendingHref] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
  useEffect(() => {
    setPendingHref("");
    setMoreOpen(false);
  }, [pathname, query]);
  useEffect(() => {
    if (!moreOpen) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && setMoreOpen(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [moreOpen]);
  const isActive = (href: string) => {
    const [path, query] = href.split("?");
    if (pathname !== path && !pathname.startsWith(`${path}/`)) return false;
    if (!query) return true;
    // A missing parameter means the page's default view (browse / community).
    return [...new URLSearchParams(query)].every(([key, value]) => {
      const current = searchParams.get(key);
      return current === value || (current === null && DEFAULT_VIEWS.has(value));
    });
  };
  return (
    <div
      className="min-h-screen bg-app text-ink"
      aria-busy={Boolean(pendingHref)}
    >
      {pendingHref && (
        <div
          className="fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden bg-teal/15"
          role="progressbar"
          aria-label="Opening page"
        >
          <span className="block h-full w-2/3 animate-pulse bg-gradient-to-r from-teal to-amber" />
        </div>
      )}
      <a
        href="#main-content"
        className="sr-only fixed left-4 top-4 z-[100] rounded-full bg-teal px-4 py-2 font-semibold text-app focus:not-sr-only"
      >
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-line bg-[#0d0d0d] px-4 py-6 md:flex">
        <Link
          href="/dashboard"
          aria-label="UniConnect dashboard"
          className="flex items-center gap-3 px-2"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-teal to-amber font-black text-app">
            U
          </span>
          <span className="text-lg font-bold">UniConnect</span>
        </Link>
        <nav
          className="mt-10 flex flex-1 flex-col gap-1.5"
          aria-label="Primary navigation"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              onMouseEnter={() => router.prefetch(item.href)}
              onFocus={() => router.prefetch(item.href)}
              onClick={() => {
                if (!isActive(item.href)) setPendingHref(item.href);
              }}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-xl border px-3 text-sm font-medium transition ${isActive(item.href) ? "border-teal/40 bg-teal/10 text-teal" : "border-transparent text-muted hover:border-line hover:bg-white/5 hover:text-ink"}`}
            >
              <span
                className="grid w-6 place-items-center text-lg"
                aria-hidden="true"
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <form action="/api/auth/sign-out" method="post">
          <button
            className="flex w-full items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2 text-left text-xs font-bold text-muted hover:text-ink"
            type="submit"
            title={`Sign out ${email}`}
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/5">
              {email.slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0">
              <span className="block truncate">{email}</span>
              <span className="font-normal">Sign out</span>
            </span>
          </button>
        </form>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-app/90 px-5 py-4 backdrop-blur md:hidden">
        <Logo />
        <form action="/api/auth/sign-out" method="post">
          <button className="text-sm text-muted" type="submit">
            Sign out
          </button>
        </form>
      </header>
      <div id="main-content" tabIndex={-1} className="md:pl-64">
        {children}
      </div>
      {moreOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Close menu"
            onClick={() => setMoreOpen(false)}
          />
          <div
            id="mobile-more-menu"
            className="absolute inset-x-3 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] rounded-2xl border border-line bg-elevated p-2 shadow-card"
          >
            <div className="grid grid-cols-2 gap-1">
              {mobileMoreItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  onClick={() => {
                    if (!isActive(item.href)) setPendingHref(item.href);
                    setMoreOpen(false);
                  }}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium ${isActive(item.href) ? "bg-teal/10 text-teal" : "text-ink hover:bg-white/5"}`}
                >
                  <span className="grid w-6 place-items-center text-lg" aria-hidden="true">
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              ))}
            </div>
            <p className="mt-2 truncate border-t border-line px-3 pt-3 text-xs text-muted">
              Signed in as {email}
            </p>
          </div>
        </div>
      )}
      <nav
        className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-50 grid grid-cols-5 gap-1 rounded-2xl border border-line bg-elevated/95 p-1.5 shadow-card backdrop-blur md:hidden"
        aria-label="Mobile navigation"
      >
        {mobilePrimaryItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            onTouchStart={() => router.prefetch(item.href)}
            onClick={() => {
              if (!isActive(item.href)) setPendingHref(item.href);
            }}
            className={`flex min-h-12 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 ${isActive(item.href) ? "bg-teal/10 text-teal" : "text-muted"}`}
            aria-label={item.label}
            aria-current={isActive(item.href) ? "page" : undefined}
          >
            <span className="text-lg leading-none" aria-hidden="true">{item.icon}</span>
            <span className="w-full truncate text-center text-[11px] leading-tight">
              {item.short}
            </span>
          </Link>
        ))}
        <button
          type="button"
          onClick={() => setMoreOpen((open) => !open)}
          aria-expanded={moreOpen}
          aria-controls="mobile-more-menu"
          className={`flex min-h-12 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 ${moreOpen || mobileMoreItems.some((item) => isActive(item.href)) ? "bg-teal/10 text-teal" : "text-muted"}`}
        >
          <span className="text-lg leading-none" aria-hidden="true">⋯</span>
          <span className="text-[11px] leading-tight">More</span>
        </button>
      </nav>
    </div>
  );
}
