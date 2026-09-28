import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getConnectionProfile } from "@/lib/profile-store";
import { requireCompleteUser } from "@/lib/auth";
import { recordProfileView } from "@/lib/discovery-insights";

export default async function ConnectionProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const viewer = await requireCompleteUser();
  const profile = await getConnectionProfile(userId);
  if (!profile) notFound();
  if (profile.profileState !== "unclaimed") {
    await recordProfileView(viewer.id, userId).catch(() => undefined);
  }

  return (
    <main className="min-h-screen px-4 pb-28 pt-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <Link href="/connections" className="text-sm font-semibold text-muted hover:text-teal">
          ← Back to search
        </Link>
        {profile.profileState === "unclaimed" ? (
          <p className="mt-3 text-xs text-muted">This class profile was prepared from the Masters CV and has not yet been claimed by its owner.</p>
        ) : (
          <p className="mt-3 text-xs text-muted">Profile visits appear in Discovery insights according to your named/anonymous preference.</p>
        )}
        <section className="panel mt-6 p-6 sm:p-9">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            {profile.profilePhotoUrl ? (
              <Image
                src={profile.profilePhotoUrl}
                alt={`${profile.name}'s profile photo`}
                width={112}
                height={112}
                unoptimized
                className="size-28 rounded-full border border-line object-cover"
              />
            ) : (
              <div className="grid size-28 place-items-center rounded-full bg-gradient-to-br from-teal to-amber text-3xl font-black text-app">
                {profile.name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="eyebrow">{profile.profileState === "unclaimed" ? "MU class profile · unclaimed" : "Verified MU student"}</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">{profile.name}</h1>
              <p className="mt-2 text-muted">{profile.cohort}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                {safeExternalUrl(profile.linkedinUrl) && (
                  <a className="secondary-button !min-h-10 !px-5 !py-2" href={profile.linkedinUrl} target="_blank" rel="noreferrer">LinkedIn ↗</a>
                )}
                {safeContactUrl(profile.contactLink) && (
                  <a className="primary-button !min-h-10 !px-5 !py-2" href={safeContactUrl(profile.contactLink)!} target="_blank" rel="noreferrer">Contact</a>
                )}
              </div>
            </div>
          </div>

          {profile.profileState === "unclaimed" && (
            <div className="mt-7 rounded-2xl border border-amber/25 bg-amber/5 p-4 text-sm leading-6 text-white/75">
              This profile is visible to verified UniConnect students using approved structured Masters CV information. Contact details and the original resume remain private. The owner can claim and edit it after signing in with their MU email.
            </div>
          )}

          <div className="mt-9 grid gap-7 border-t border-line pt-8 lg:grid-cols-2">
            <ProfileSection title="Skills"><div className="flex flex-wrap gap-2">{profile.skills.map((skill) => <span key={skill} className="rounded-full border border-teal/30 bg-teal/5 px-3 py-1.5 text-sm text-teal">{skill}</span>)}</div></ProfileSection>
            {profile.interests.length > 0 && <ProfileSection title="Into"><div className="flex flex-wrap gap-2">{profile.interests.map((interest) => <span key={interest} className="rounded-full border border-amber/30 bg-amber/5 px-3 py-1.5 text-sm text-amber">{interest}</span>)}</div></ProfileSection>}
            <ProfileSection title="Looking for"><p>{profile.lookingFor}</p></ProfileSection>
            {profile.currentProject && <ProfileSection title="Current project"><p>{profile.currentProject}</p></ProfileSection>}
            {profile.workExperience.length > 0 && <ProfileSection title="Experience"><div className="space-y-4">{profile.workExperience.map((item, index) => <div key={`${item.company}-${index}`}><p className="font-semibold text-ink">{item.role} · {item.company}</p><p className="text-sm">{item.duration}</p>{item.description && <p className="mt-1">{item.description}</p>}</div>)}</div></ProfileSection>}
            {profile.education.length > 0 && <ProfileSection title="Education"><div className="space-y-4">{profile.education.map((item, index) => <div key={`${item.institution}-${index}`}><p className="font-semibold text-ink">{item.degree}</p><p>{item.institution} · {item.year}</p></div>)}</div></ProfileSection>}
          </div>
        </section>
      </div>
    </main>
  );
}

function ProfileSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">{title}</h2><div className="mt-3 leading-7 text-white/75">{children}</div></section>;
}

function safeExternalUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? value : "";
  } catch { return ""; }
}

function safeContactUrl(value: string) {
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return `mailto:${value}`;
  if (value.startsWith("mailto:") && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.slice(7))) return value;
  return safeExternalUrl(value);
}
