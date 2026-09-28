import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { requireCompleteUser } from "@/lib/auth";
import { getProfileByUserId } from "@/lib/profile-store";

export default async function ProfilePage() {
  const user = await requireCompleteUser();
  const profile = await getProfileByUserId(user.id);
  if (!profile) notFound();
  const completion = Math.round(
    ([
      profile.name,
      profile.cohort,
      profile.skills.length,
      profile.lookingFor,
      profile.currentProject,
    ].filter(Boolean).length /
      5) *
      100,
  );
  return (
    <main className="grid-texture min-h-screen px-6 pb-28 pt-10 sm:px-10 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">My profile</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em]">
              Your campus identity.
            </h1>
            <p className="mt-3 text-muted">
              Keep this current so the right classmates can discover you.
            </p>
          </div>
          <Link href="/profile/setup?edit=1" className="primary-button w-fit">
            Edit profile
          </Link>
        </div>
        <section className="panel relative mt-10 overflow-hidden p-7 sm:p-10">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-teal via-white/30 to-amber" />
          <div className="flex flex-col gap-7 lg:flex-row lg:items-center">
            {profile.profilePhotoUrl ? (
              <Image
                src={profile.profilePhotoUrl}
                alt={profile.name}
                width={144}
                height={144}
                unoptimized
                className="size-36 rounded-[2rem] border border-line object-cover shadow-card"
              />
            ) : (
              <div
                className="grid size-36 place-items-center rounded-[2rem] bg-gradient-to-br from-teal to-amber text-5xl font-black text-app"
                aria-label={`${profile.name} profile placeholder`}
              >
                {profile.name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <span className="rounded-full border border-teal/30 bg-teal/10 px-3 py-1 text-xs text-teal">
                {profile.cohort}
              </span>
              <h2 className="mt-4 text-4xl font-semibold tracking-tight">
                {profile.name}
              </h2>
              <p className="mt-3 max-w-3xl leading-7 text-white/75">
                <strong className="text-ink">Looking for:</strong>{" "}
                {profile.lookingFor}
              </p>
            </div>
            <div className="w-full rounded-2xl border border-line bg-black/20 p-5 lg:w-56">
              <div className="flex items-end justify-between">
                <span className="text-sm text-muted">Profile strength</span>
                <strong className="gradient-text text-2xl">
                  {completion}%
                </strong>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal to-amber"
                  style={{ width: `${completion}%` }}
                />
              </div>
              <p className="mt-3 text-xs leading-5 text-muted">
                Complete profiles appear in more relevant searches.
              </p>
            </div>
          </div>
          <div className="mt-9 border-t border-line pt-7">
            <p className="eyebrow">Skills</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-line bg-white/5 px-3 py-1.5 text-xs text-white/80"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
          {profile.interests.length > 0 && (
            <div className="mt-6">
              <p className="eyebrow">Into</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.interests.map((interest) => (
                  <span
                    key={interest}
                    className="rounded-full border border-amber/30 bg-amber/5 px-3 py-1.5 text-xs text-amber"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
          {profile.currentProject && (
            <div className="mt-9 border-t border-line pt-7">
              <p className="eyebrow">Currently building</p>
              <p className="mt-3 max-w-3xl leading-7 text-white/80">
                {profile.currentProject}
              </p>
            </div>
          )}
        </section>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <DetailCard title="Experience">
            {profile.workExperience.length ? (
              profile.workExperience.map((item) => (
                <div
                  className="border-l border-teal/30 py-1 pb-6 pl-5 last:pb-1"
                  key={`${item.company}-${item.role}`}
                >
                  <p className="font-semibold">{item.role}</p>
                  <p className="mt-1 text-sm text-muted">
                    {item.company} · {item.duration}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/70">
                    {item.description}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted">No experience added yet.</p>
            )}
          </DetailCard>
          <DetailCard title="Education">
            {profile.education.length ? (
              profile.education.map((item) => (
                <div
                  className="border-l border-amber/30 py-1 pb-6 pl-5 last:pb-1"
                  key={`${item.institution}-${item.degree}`}
                >
                  <p className="font-semibold">{item.degree}</p>
                  <p className="mt-1 text-sm text-muted">
                    {item.institution} · {item.year}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted">No education added yet.</p>
            )}
          </DetailCard>
        </div>
      </div>
    </main>
  );
}
function DetailCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="panel p-6 sm:p-8">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}
