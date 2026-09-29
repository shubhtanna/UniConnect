import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { getConnectionProfile } from "@/lib/profile-store";
import { requirePageSession } from "@/lib/auth";
import { recordProfileView } from "@/lib/discovery-insights";

const FEATURED_SKILL_COUNT = 12;

export default async function ConnectionProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const viewer = await requirePageSession();
  const profile = await getConnectionProfile(userId);
  if (!profile) notFound();

  if (profile.profileState !== "unclaimed") {
    after(async () => {
      await recordProfileView(viewer.id, userId).catch(() => undefined);
    });
  }

  const contactUrl = safeContactUrl(profile.contactLink);
  const linkedinUrl = safeExternalUrl(profile.linkedinUrl);
  const featuredSkills = profile.skills.slice(0, FEATURED_SKILL_COUNT);
  const additionalSkills = profile.skills.slice(FEATURED_SKILL_COUNT);

  return (
    <main className="grid-texture min-h-screen px-4 pb-28 pt-6 sm:px-8 sm:pt-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/connections?mode=browse"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted transition hover:text-teal"
          >
            ← Back to directory
          </Link>
          <p className="max-w-xl text-xs leading-5 text-muted sm:text-right">
            {profile.profileState === "unclaimed"
              ? "Prepared from approved Masters CV details. Contact information and the source resume remain private."
              : "Profile visits follow your named or anonymous preference in Discovery insights."}
          </p>
        </div>

        <section className="panel relative mt-5 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-teal via-white/25 to-amber" />

          <header className="relative overflow-hidden border-b border-line px-5 py-7 sm:px-8 sm:py-9">
            <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-teal/[0.07] blur-3xl" />
            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
              {profile.profilePhotoUrl ? (
                <Image
                  src={profile.profilePhotoUrl}
                  alt={profile.name + "'s profile photo"}
                  width={128}
                  height={128}
                  unoptimized
                  className="size-28 shrink-0 rounded-3xl border border-line object-cover shadow-card sm:size-32"
                />
              ) : (
                <div className="grid size-28 shrink-0 place-items-center rounded-3xl bg-gradient-to-br from-teal to-amber text-4xl font-black text-app shadow-card sm:size-32">
                  {profile.name.slice(0, 1).toUpperCase()}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-teal/25 bg-teal/[0.08] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-teal">
                    {profile.profileState === "unclaimed"
                      ? "MU class profile · unclaimed"
                      : "Verified MU student"}
                  </span>
                  <span className="rounded-full border border-line bg-white/[0.03] px-3 py-1 text-xs text-muted">
                    {profile.cohort}
                  </span>
                </div>
                <h1 className="mt-4 break-words text-3xl font-semibold tracking-[-0.045em] sm:text-5xl">
                  {profile.name}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
                  Discover their experience, interests, and the kind of
                  collaboration they are open to.
                </p>
              </div>

              {(linkedinUrl || contactUrl) && (
                <div className="flex shrink-0 flex-wrap gap-3 sm:flex-col">
                  {contactUrl && (
                    <a
                      className="primary-button !min-h-10 !px-5 !py-2"
                      href={contactUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Start a conversation
                    </a>
                  )}
                  {linkedinUrl && (
                    <a
                      className="secondary-button !min-h-10 !px-5 !py-2"
                      href={linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      LinkedIn ↗
                    </a>
                  )}
                </div>
              )}
            </div>
          </header>

          {profile.profileState === "unclaimed" && (
            <div className="mx-5 mt-5 rounded-2xl border border-amber/20 bg-amber/[0.05] p-4 text-sm leading-6 text-white/70 sm:mx-8">
              This starting profile is visible only inside the verified
              UniConnect network. Its owner can claim, review, and edit it after
              signing in with their official MU email.
            </div>
          )}

          <div className="grid gap-4 px-5 py-6 sm:px-8 sm:py-8 lg:grid-cols-2">
            <OverviewCard eyebrow="Looking for" icon="⌕">
              {profile.lookingFor ||
                "They have not added a specific collaboration request yet."}
            </OverviewCard>
            <OverviewCard eyebrow="Currently building" icon="↗">
              {profile.currentProject ||
                "They have not shared a current project yet."}
            </OverviewCard>
          </div>

          <div className="grid gap-8 border-t border-line px-5 py-7 sm:px-8 lg:grid-cols-[1.2fr_0.8fr]">
            <section>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="eyebrow">Capabilities</p>
                  <h2 className="mt-2 text-xl font-semibold">
                    Skills they bring
                  </h2>
                </div>
                <span className="text-xs text-muted">
                  {profile.skills.length} skill
                  {profile.skills.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {featuredSkills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-teal/25 bg-teal/[0.055] px-3 py-1.5 text-sm text-teal"
                  >
                    {skill}
                  </span>
                ))}
              </div>
              {additionalSkills.length > 0 && (
                <details className="mt-4">
                  <summary className="w-fit cursor-pointer rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-muted transition hover:border-teal/30 hover:text-ink">
                    Show {additionalSkills.length} more skills
                  </summary>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {additionalSkills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full border border-line bg-white/[0.025] px-3 py-1.5 text-sm text-muted"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </details>
              )}
            </section>

            <section>
              <p className="eyebrow">Interests</p>
              <h2 className="mt-2 text-xl font-semibold">
                Topics they are into
              </h2>
              {profile.interests.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {profile.interests.map((interest) => (
                    <span
                      key={interest}
                      className="rounded-full border border-amber/25 bg-amber/[0.055] px-3 py-1.5 text-sm text-amber"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-5 text-sm leading-6 text-muted">
                  No interests have been added yet.
                </p>
              )}
            </section>
          </div>
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <TimelineCard
            title="Experience"
            count={profile.workExperience.length}
          >
            {profile.workExperience.length > 0 ? (
              profile.workExperience.map((item, index) => (
                <div
                  className="relative border-l border-teal/25 pb-6 pl-5 last:pb-0"
                  key={item.company + "-" + index}
                >
                  <span className="absolute -left-1 top-1 size-2 rounded-full bg-teal" />
                  <h3 className="font-semibold text-ink">{item.role}</h3>
                  <p className="mt-1 text-sm text-muted">
                    {item.company}
                    {item.duration ? " · " + item.duration : ""}
                  </p>
                  {item.description && (
                    <p className="mt-2 text-sm leading-6 text-white/65">
                      {item.description}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <EmptyDetail text="No work experience has been added yet." />
            )}
          </TimelineCard>

          <TimelineCard title="Education" count={profile.education.length}>
            {profile.education.length > 0 ? (
              profile.education.map((item, index) => (
                <div
                  className="relative border-l border-amber/25 pb-6 pl-5 last:pb-0"
                  key={item.institution + "-" + index}
                >
                  <span className="absolute -left-1 top-1 size-2 rounded-full bg-amber" />
                  <h3 className="font-semibold text-ink">{item.degree}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    {item.institution}
                    {item.year ? " · " + item.year : ""}
                  </p>
                </div>
              ))
            ) : (
              <EmptyDetail text="No education details have been added yet." />
            )}
          </TimelineCard>
        </div>
      </div>
    </main>
  );
}

function OverviewCard({
  eyebrow,
  icon,
  children,
}: {
  eyebrow: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-app/55 p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-xl border border-line bg-white/[0.035] text-teal">
          {icon}
        </span>
        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
          {eyebrow}
        </h2>
      </div>
      <p className="mt-4 leading-7 text-white/80">{children}</p>
    </section>
  );
}

function TimelineCard({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="panel p-6 sm:p-7">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{title}</h2>
        <span className="rounded-full border border-line px-2.5 py-1 text-xs text-muted">
          {count}
        </span>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function EmptyDetail({ text }: { text: string }) {
  return (
    <p className="rounded-xl border border-dashed border-line p-5 text-sm text-muted">
      {text}
    </p>
  );
}

function safeExternalUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? value : "";
  } catch {
    return "";
  }
}

function safeContactUrl(value: string) {
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "mailto:" + value;
  if (
    value.startsWith("mailto:") &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.slice(7))
  )
    return value;
  return safeExternalUrl(value);
}
