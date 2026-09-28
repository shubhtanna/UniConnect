"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Logo } from "@/components/Logo";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "⌂" },
  { href: "/profile", label: "My profile", icon: "◎" },
  { href: "/connections?mode=browse", label: "Student directory", icon: "☷" },
  { href: "/connections?mode=search", label: "AI people search", icon: "⌕" },
  { href: "/insights", label: "Discovery insights", icon: "◇" },
  { href: "/groups", label: "Brainstorm groups", icon: "#" },
  { href: "/feed?type=community", label: "Community feed", icon: "◫" },
  { href: "/feed?type=spotlight", label: "Venture showcase", icon: "✦" },
];

export function AppShell({
  children,
  email,
}: {
  children: React.ReactNode;
  email: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isActive = (href: string) => {
    const [path, query] = href.split("?");
    if (pathname !== path && !pathname.startsWith(`${path}/`)) return false;
    if (!query) return true;
    return [...new URLSearchParams(query)].every(
      ([key, value]) => searchParams.get(key) === value,
    );
  };
  return (
    <div className="min-h-screen bg-app text-ink">
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
      <nav
        className="fixed inset-x-3 bottom-3 z-40 flex items-center gap-1 overflow-x-auto rounded-2xl border border-line bg-elevated/95 p-2 shadow-card backdrop-blur md:hidden"
        aria-label="Mobile navigation"
      >
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex min-w-[4.5rem] flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 ${isActive(item.href) ? "bg-teal/10 text-teal" : "text-muted"}`}
            aria-label={item.label}
            aria-current={isActive(item.href) ? "page" : undefined}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-[10px] leading-tight">
              {item.label.split(" ")[0]}
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
