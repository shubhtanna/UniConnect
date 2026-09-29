import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="grid-texture relative min-h-dvh overflow-x-hidden bg-app text-ink lg:flex lg:h-dvh lg:flex-col lg:overflow-hidden">
      <div className="pointer-events-none absolute left-1/4 top-1/3 size-72 rounded-full bg-teal/10 blur-[120px]" />

      <header className="relative mx-auto flex w-full max-w-7xl shrink-0 items-center justify-between px-5 py-5 sm:px-6 lg:px-8 lg:py-4">
        <Logo />
        <Link
          href="/"
          className="hidden text-sm font-medium text-muted transition hover:text-ink sm:block"
        >
          Back to home
        </Link>
      </header>

      <section className="relative mx-auto grid w-full max-w-7xl flex-1 gap-8 px-5 pb-8 pt-3 sm:px-6 lg:min-h-0 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:gap-14 lg:px-8 lg:py-5">
        <div className="hidden lg:block">
          <p className="eyebrow">Private by design</p>
          <h1 className="mt-5 max-w-xl text-5xl font-semibold leading-[1.01] tracking-[-0.055em] xl:text-6xl">
            Your campus network,{" "}
            <span className="gradient-text">finally searchable.</span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-muted xl:text-lg xl:leading-8">
            One verified identity. No password. No public profile. Just the MU
            community.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 text-xs text-muted">
            <span className="rounded-full border border-line bg-white/[0.03] px-3 py-2">
              ✓ MU-only access
            </span>
            <span className="rounded-full border border-line bg-white/[0.03] px-3 py-2">
              ✓ Secure one-time code
            </span>
          </div>
        </div>

        <div className="panel mx-auto w-full max-w-xl p-6 shadow-card sm:p-8 lg:max-h-full lg:overflow-y-auto">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted transition hover:text-ink sm:hidden"
          >
            ← Back to home
          </Link>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
