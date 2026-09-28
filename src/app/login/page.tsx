import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return <main className="grid-texture relative min-h-screen bg-app text-ink"><div className="absolute left-1/4 top-1/4 size-72 rounded-full bg-teal/10 blur-[120px]" /><header className="relative mx-auto flex max-w-6xl px-6 py-7"><Logo /></header><section className="relative mx-auto grid max-w-6xl gap-16 px-6 pb-20 pt-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:pt-20"><div className="hidden lg:block"><p className="eyebrow">Private by design</p><h1 className="mt-6 text-6xl font-semibold leading-[1.02] tracking-[-0.055em]">Your campus network, <span className="gradient-text">finally searchable.</span></h1><p className="mt-6 max-w-md text-lg leading-8 text-muted">One verified identity. No password. No public profile. Just the MU community.</p></div><div className="panel mx-auto w-full max-w-xl p-7 shadow-card sm:p-10"><Link href="/" className="mb-9 inline-flex items-center gap-2 text-sm text-muted hover:text-ink">← Back to home</Link><LoginForm /></div></section></main>;
}
