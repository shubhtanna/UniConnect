"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "⌂" },
  { href: "/profile", label: "Profile", icon: "◎" },
  { href: "/connections", label: "Find connections", icon: "⌕" },
  { href: "/insights", label: "Discovery insights", icon: "◇" },
  { href: "/groups", label: "Brainstorm groups", icon: "#" },
  { href: "/feed", label: "Feed", icon: "◫" },
];

export function AppShell({ children, email }: { children: React.ReactNode; email: string }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-app text-ink">
      <a href="#main-content" className="sr-only fixed left-4 top-4 z-[100] rounded-full bg-teal px-4 py-2 font-semibold text-app focus:not-sr-only">Skip to content</a>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-20 flex-col items-center border-r border-line bg-[#0d0d0d] py-6 md:flex">
        <Link href="/dashboard" aria-label="UniConnect dashboard" className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-teal to-amber font-black text-app">U</Link>
        <nav className="mt-12 flex flex-1 flex-col gap-3" aria-label="Primary navigation">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} title={item.label} aria-label={item.label} aria-current={pathname.startsWith(item.href) ? "page" : undefined} className={`grid size-11 place-items-center rounded-xl border text-xl transition ${pathname.startsWith(item.href) ? "border-teal/40 bg-teal/10 text-teal" : "border-transparent text-muted hover:border-line hover:bg-white/5 hover:text-ink"}`}>
              {item.icon}
            </Link>
          ))}
        </nav>
        <form action="/api/auth/sign-out" method="post">
          <button className="grid size-11 place-items-center rounded-full border border-line bg-surface text-xs font-bold text-muted hover:text-ink" type="submit" title={`Sign out ${email}`}>
            {email.slice(0, 1).toUpperCase()}
          </button>
        </form>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-app/90 px-5 py-4 backdrop-blur md:hidden">
        <Logo />
        <form action="/api/auth/sign-out" method="post"><button className="text-sm text-muted" type="submit">Sign out</button></form>
      </header>
      <div id="main-content" tabIndex={-1} className="md:pl-20">{children}</div>
      <nav className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-2xl border border-line bg-elevated/95 p-2 shadow-card backdrop-blur md:hidden" aria-label="Mobile navigation">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className={`grid size-11 place-items-center rounded-xl text-xl ${pathname.startsWith(item.href) ? "bg-teal/10 text-teal" : "text-muted"}`} aria-label={item.label} aria-current={pathname.startsWith(item.href) ? "page" : undefined}>{item.icon}</Link>
        ))}
      </nav>
    </div>
  );
}
