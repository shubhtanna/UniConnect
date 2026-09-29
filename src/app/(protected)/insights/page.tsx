import Image from "next/image";
import Link from "next/link";
import { requirePageSession } from "@/lib/auth";
import { getDiscoveryInsights } from "@/lib/discovery-insights";
import { ViewModeControl } from "@/components/insights/ViewModeControl";

export const metadata = { title: "Discovery insights" };

export default async function InsightsPage() {
  const user = await requirePageSession();
  const insights = await getDiscoveryInsights(user.id);
  return <main className="min-h-screen px-5 pb-28 pt-9 sm:px-10 lg:px-12"><div className="mx-auto max-w-6xl">
    <p className="eyebrow">Discovery insights</p><h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em]">Who may be looking for you.</h1><p className="mt-3 max-w-2xl text-muted">Useful signals for starting conversations—not popularity scores.</p>
    <section className="panel mt-8 p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-semibold">When you view a profile</h2><p className="mt-1 text-sm text-muted">Named shows your profile. Anonymous records only an anonymous visit. Your current choice applies to future views.</p></div><ViewModeControl initialMode={insights.viewMode} /></div></section>
    <section className="mt-9"><div className="flex items-end justify-between"><div><p className="eyebrow">Reverse matches</p><h2 className="mt-2 text-2xl font-semibold">People who may need what you know</h2></div><span className="text-sm text-muted">{insights.peopleLookingForYou.length} matches</span></div>
      {insights.peopleLookingForYou.length ? <div className="mt-5 grid gap-4 lg:grid-cols-2">{insights.peopleLookingForYou.map(({ profile, matches }) => <article key={profile.userId} className="panel p-5"><div className="flex gap-4"><Avatar name={profile.name} url={profile.profilePhotoUrl} /><div className="min-w-0"><h3 className="font-semibold">{profile.name}</h3><p className="mt-1 text-xs text-muted">{profile.cohort}</p><p className="mt-3 text-sm leading-6 text-white/75">Looking for: {profile.lookingFor}</p><p className="mt-2 text-xs text-teal">Matches your {matches.slice(0, 3).join(", ")}</p></div></div><Link href={`/connections/${profile.userId}`} className="secondary-button mt-4 w-full !min-h-10 !py-2">View profile</Link></article>)}</div> : <Empty text="Add specific skills and interests, or wait for classmates to update what they need." />}
    </section>
    <section className="mt-10"><div className="flex items-end justify-between"><div><p className="eyebrow">Last 30 days</p><h2 className="mt-2 text-2xl font-semibold">Recent profile viewers</h2></div>{insights.anonymousViewers > 0 && <span className="text-sm text-muted">+ {insights.anonymousViewers} anonymous</span>}</div>
      {insights.recentViewers.length ? <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{insights.recentViewers.map((viewer) => <Link href={`/connections/${viewer.userId}`} key={viewer.userId} className="panel flex items-center gap-3 p-4 transition hover:border-white/20"><Avatar name={viewer.name} url={viewer.profilePhotoUrl} small /><div><h3 className="font-semibold">{viewer.name}</h3><p className="text-xs text-muted">{viewer.cohort} · {new Date(viewer.lastViewedAt).toLocaleDateString()}</p></div></Link>)}</div> : <Empty text="No named profile views yet. Anonymous visits, if any, appear only as a count." />}
    </section>
  </div></main>;
}

function Avatar({ name, url, small = false }: { name: string; url: string; small?: boolean }) { const size = small ? 48 : 64; return url ? <Image src={url} alt="" width={size} height={size} unoptimized className={`${small ? "size-12" : "size-16"} shrink-0 rounded-full object-cover`} /> : <div className={`grid ${small ? "size-12" : "size-16"} shrink-0 place-items-center rounded-full bg-gradient-to-br from-teal to-amber font-bold text-app`}>{name[0]}</div>; }
function Empty({ text }: { text: string }) { return <div className="panel mt-5 p-8 text-center text-sm text-muted">{text}</div>; }
