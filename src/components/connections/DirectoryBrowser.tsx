"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { DirectoryProfile, DirectoryResponse } from "@/lib/directory-types";

export function DirectoryBrowser() {
  const [query, setQuery] = useState("");
  const [cohort, setCohort] = useState("");
  const [skill, setSkill] = useState("");
  const [interest, setInterest] = useState("");
  const [lookingFor, setLookingFor] = useState("");
  const [page, setPage] = useState(0);
  const [result, setResult] = useState<DirectoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ page: String(page) });
        if (query.trim()) params.set("q", query.trim());
        if (cohort) params.set("cohort", cohort);
        if (skill) params.set("skill", skill);
        if (interest) params.set("interest", interest);
        if (lookingFor.trim()) params.set("lookingFor", lookingFor.trim());
        const response = await fetch(`/api/directory?${params}`, { signal: controller.signal });
        const data = (await response.json()) as DirectoryResponse & { error?: string };
        if (!response.ok) throw new Error(data.error ?? "Directory failed to load");
        setResult(data);
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        setError(loadError instanceof Error ? loadError.message : "Directory failed to load");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 220);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, cohort, skill, interest, lookingFor, page]);

  const hasFilters = Boolean(query || cohort || skill || interest || lookingFor);
  function resetFilters() {
    setQuery("");
    setCohort("");
    setSkill("");
    setInterest("");
    setLookingFor("");
    setPage(0);
  }

  return (
    <section className="mt-9" aria-labelledby="directory-heading">
      <div className="panel p-5 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Student directory</p>
            <h2 id="directory-heading" className="mt-2 text-2xl font-semibold">Explore verified profiles</h2>
          </div>
          <p className="text-sm text-muted" aria-live="polite">
            {loading && !result ? "Loading students…" : `${result?.total ?? 0} student${result?.total === 1 ? "" : "s"}`}
          </p>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-4">
          <label className="lg:col-span-2">
            <span className="field-label">Search names, skills, projects</span>
            <input className="text-field" value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} placeholder="Try fintech, designer, D2C…" maxLength={100} />
          </label>
          <label>
            <span className="field-label">Batch</span>
            <select className="text-field" value={cohort} onChange={(event) => { setCohort(event.target.value); setPage(0); }}>
              <option value="">All batches</option>
              {(result?.facets.cohorts ?? []).map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label>
            <span className="field-label">Skill</span>
            <select className="text-field" value={skill} onChange={(event) => { setSkill(event.target.value); setPage(0); }}>
              <option value="">All skills</option>
              {(result?.facets.skills ?? []).map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label>
            <span className="field-label">Interest</span>
            <select className="text-field" value={interest} onChange={(event) => { setInterest(event.target.value); setPage(0); }}>
              <option value="">All interests</option>
              {(result?.facets.interests ?? []).map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="lg:col-span-2">
            <span className="field-label">What they’re looking for</span>
            <input className="text-field" value={lookingFor} onChange={(event) => { setLookingFor(event.target.value); setPage(0); }} placeholder="Cofounder, feedback, collaborators, internships…" maxLength={160} />
          </label>
          <div className="flex items-end">
            <button type="button" onClick={resetFilters} disabled={!hasFilters} className="secondary-button w-full !min-h-12 disabled:opacity-40">Clear filters</button>
          </div>
        </div>
      </div>

      {error && <p role="alert" className="mt-5 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}
      {loading && !result ? <DirectorySkeleton /> : null}
      {!loading && result?.profiles.length === 0 ? (
        <div className="panel mt-5 p-10 text-center">
          <h3 className="text-xl font-semibold">No students match these filters</h3>
          <p className="mt-2 text-muted">Try removing one filter or use AI people search for a broader match.</p>
          {hasFilters && <button type="button" onClick={resetFilters} className="secondary-button mt-5">Show everyone</button>}
        </div>
      ) : null}
      {result && result.profiles.length > 0 ? (
        <>
          <div className={`mt-5 grid gap-4 lg:grid-cols-2 ${loading ? "opacity-60" : ""}`} aria-busy={loading}>
            {result.profiles.map((profile) => <DirectoryCard key={profile.userId} profile={profile} />)}
          </div>
          <div className="mt-6 flex items-center justify-between border-t border-line pt-5">
            <button type="button" className="secondary-button !min-h-10 !px-5 !py-2" disabled={page === 0 || loading} onClick={() => setPage((value) => Math.max(0, value - 1))}>← Previous</button>
            <span className="text-sm text-muted">Page {page + 1}</span>
            <button type="button" className="secondary-button !min-h-10 !px-5 !py-2" disabled={!result.hasMore || loading} onClick={() => setPage((value) => value + 1)}>Next →</button>
          </div>
        </>
      ) : null}
    </section>
  );
}

function DirectoryCard({ profile }: { profile: DirectoryProfile }) {
  return (
    <article className="panel flex h-full flex-col p-5 sm:p-6">
      <div className="flex items-start gap-4">
        {profile.profilePhotoUrl ? <Image src={profile.profilePhotoUrl} alt="" width={72} height={72} unoptimized className="size-[72px] shrink-0 rounded-full border border-line object-cover" /> : <div className="grid size-[72px] shrink-0 place-items-center rounded-full bg-gradient-to-br from-teal to-amber text-xl font-black text-app">{profile.name.slice(0, 1).toUpperCase()}</div>}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold">{profile.name}</h3>
            <span className="rounded-full border border-line px-2.5 py-1 text-xs text-muted">{profile.cohort}</span>
          </div>
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/70"><span className="font-semibold text-ink">Looking for:</span> {profile.lookingFor}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {profile.skills.slice(0, 5).map((item) => <span key={item} className="rounded-full bg-white/5 px-3 py-1 text-xs text-muted">{item}</span>)}
        {profile.skills.length > 5 && <span className="rounded-full border border-line px-3 py-1 text-xs text-muted">+{profile.skills.length - 5}</span>}
      </div>
      {profile.interests.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{profile.interests.slice(0, 4).map((item) => <span key={item} className="rounded-full border border-amber/25 bg-amber/5 px-3 py-1 text-xs text-amber">{item}</span>)}</div>}
      {profile.currentProject && <p className="mt-4 line-clamp-2 text-sm leading-6 text-muted">Building: {profile.currentProject}</p>}
      <Link href={`/connections/${profile.userId}`} className="secondary-button mt-5 !min-h-10 w-full !py-2">View profile</Link>
    </article>
  );
}

function DirectorySkeleton() {
  return <div className="mt-5 grid gap-4 lg:grid-cols-2" aria-label="Loading directory">{[1, 2, 3, 4].map((item) => <div key={item} className="panel animate-pulse p-6"><div className="flex gap-4"><div className="size-[72px] rounded-full bg-white/10" /><div className="flex-1"><div className="h-4 w-36 rounded bg-white/10" /><div className="mt-4 h-3 w-3/4 rounded bg-white/5" /></div></div></div>)}</div>;
}
