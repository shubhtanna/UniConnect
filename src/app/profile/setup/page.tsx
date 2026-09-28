import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireVerifiedUser } from "@/lib/auth";
import { getProfileByUserId } from "@/lib/profile-store";
import { Logo } from "@/components/Logo";
import { ProfileSetupForm } from "@/components/profile/ProfileSetupForm";

export const metadata: Metadata = { title: "Set up your profile" };

export default async function ProfileSetupPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const user = await requireVerifiedUser();
  const { edit } = await searchParams;
  const profile = await getProfileByUserId(user.id);
  if (user.isProfileComplete && edit !== "1") redirect("/dashboard");

  return (
    <main className="grid-texture min-h-screen bg-app text-ink">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-7">
        <Logo />
        <div className="flex items-center gap-5">
          <span className="hidden text-sm text-muted sm:block">{user.email}</span>
          <form action="/api/auth/sign-out" method="post"><button type="submit" className="text-sm font-semibold text-muted hover:text-ink">Sign out</button></form>
        </div>
      </header>
      <ProfileSetupForm initialProfile={profile} />
    </main>
  );
}
