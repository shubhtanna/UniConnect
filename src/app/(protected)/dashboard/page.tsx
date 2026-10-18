import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { requirePageSession } from "@/lib/auth";
import { canonicalizeCohort, getCachedDirectorySnapshot } from "@/lib/directory";
import { getProfileByUserId } from "@/lib/profile-store";
import { suggestClassmates } from "@/lib/suggestions";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requirePageSession();
  const [profile, directory] = await Promise.all([
    getProfileByUserId(user.id),
    getCachedDirectorySnapshot().catch(() => []),
  ]);
  const suggestions = profile
    ? suggestClassmates({ userId: user.id, skills: profile.skills, interests: profile.interests ?? [] }, directory)
    : [];
  const cohortCount = new Set(directory.map((item) => canonicalizeCohort(item.cohort))).size;
  const nextStep = !profile?.currentProject
    ? { title: "Tell the network what you're building.", body: "Your current project helps AI search surface you to the right people.", href: "/profile/setup?edit=1", cta: "Add your project" }
    : !profile.interests?.length
      ? { title: "Add a few interests.", body: "Interests power the classmate suggestions on this page and the directory filters.", href: "/profile/setup?edit=1", cta: "Add interests" }
      : { title: "Ask for the exact person you need.", body: "Describe a collaborator in plain English — a designer into D2C, someone who has raised funding — and AI search finds them.", href: "/connections?mode=search", cta: "Try AI people search" };

  return (
    <main className="min-h-screen px-5 pb-28 pt-8 sm:px-10 sm:pt-10 lg:px-12">
      <div className="mx-auto max-w-6xl">
        {profile?.origin === "masters_cv" && !profile.preloadedNoticeAcknowledgedAt && (
          <section className="mb-8 rounded-2xl border border-teal/35 bg-gradient-to-r from-teal/10 to-amber/10 p-6" role="status">
            <p className="eyebrow">Profile ready for review</p>
            <h2 className="mt-3 text-xl font-semibold">Your profile was prepared from the Masters&apos; CV we already had.</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/75">Please check the details and change anything you want. You can also add a photo or upload a newer resume.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/profile/setup?edit=1" className="primary-button">Review and edit</Link>
              <form action="/api/profile/acknowledge-import" method="post"><button type="submit" className="secondary-button">Got it</button></form>
            </div>
          </section>
        )}
        <p className="eyebrow">Dashboard</p>
        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">Welcome back, {profile?.name.split(" ")[0]}.</h1>
            <p className="mt-3 text-muted">Your MU network is ready when you are.</p>
          </div>
          <Link href="/profile" className="secondary-button w-fit">View profile</Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
          <DashboardCard number={directory.length} label="Students on UniConnect" href="/connections?mode=browse" />
          <DashboardCard number={cohortCount} label={cohortCount === 1 ? "Cohort connected" : "Cohorts connected"} href="/connections?mode=browse" />
          <DashboardCard number="AI" label="People search" href="/connections?mode=search" />
          <DashboardCard number="#" label="Brainstorm groups" href="/groups" />
        </div>

        <section className="panel mt-8 p-6 sm:p-8" aria-labelledby="suggested-title">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Suggested for you</p>
              <h2 id="suggested-title" className="mt-3 text-2xl font-semibold">Classmates to meet</h2>
            </div>
            <Link href="/connections?mode=browse" className="text-sm font-semibold text-teal hover:underline">Browse everyone →</Link>
          </div>
          {suggestions.length ? (
            <ul className="mt-6 grid gap-3 md:grid-cols-3">
              {suggestions.map((person) => (
                <li key={person.userId}>
                  <Link href={`/connections/${person.userId}`} className="flex h-full items-center gap-4 rounded-2xl border border-line bg-black/20 p-4 transition hover:border-white/20">
                    {person.profilePhotoUrl ? (
                      <Image src={person.profilePhotoUrl} alt="" width={48} height={48} unoptimized className="size-12 shrink-0 rounded-xl object-cover" />
                    ) : (
                      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-teal to-amber font-bold text-app" aria-hidden="true">{person.name.slice(0, 1).toUpperCase()}</span>
                    )}
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{person.name}</span>
                      <span className="block truncate text-xs text-muted">{canonicalizeCohort(person.cohort)}</span>
                      <span className="mt-1 block truncate text-xs text-teal">Shared: {person.shared.join(", ")}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
              As more classmates join and you add skills and interests, people you have something in common with will appear here.
            </p>
          )}
        </section>

        <section className="panel mt-6 p-6 sm:p-8">
          <p className="eyebrow">Suggested next step</p>
          <h2 className="mt-4 text-2xl font-semibold">{nextStep.title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{nextStep.body}</p>
          <Link href={nextStep.href} className="primary-button mt-6">{nextStep.cta}</Link>
        </section>
      </div>
    </main>
  );
}

function DashboardCard({ number, label, href }: { number: number | string; label: string; href: string }) {
  return (
    <Link href={href} className="panel block p-5 transition hover:-translate-y-1 hover:border-white/20 sm:p-6">
      <span className="gradient-text text-3xl font-bold">{number}</span>
      <h2 className="mt-4 text-sm font-semibold sm:mt-6 sm:text-base">{label} →</h2>
    </Link>
  );
}
