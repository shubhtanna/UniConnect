import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { TestAccessClient } from "@/components/auth/TestAccessClient";

export const metadata: Metadata = {
  title: "Private tester access",
  robots: { index: false, follow: false },
};

export default function TestAccessPage() {
  return (
    <main className="grid-texture relative flex min-h-dvh flex-col bg-app text-ink">
      <header className="mx-auto flex w-full max-w-7xl items-center px-5 py-5 sm:px-6 lg:px-8">
        <Logo />
      </header>
      <section className="relative mx-auto flex w-full max-w-7xl flex-1 items-center justify-center px-5 pb-16 sm:px-6 lg:px-8">
        <div className="panel w-full max-w-xl p-8 shadow-card sm:p-12">
          <TestAccessClient />
        </div>
      </section>
    </main>
  );
}
