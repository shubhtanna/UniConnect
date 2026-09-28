"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ConnectionSearchResponse } from "@/lib/connection-types";
import { DirectoryBrowser } from "@/components/connections/DirectoryBrowser";

const suggestions = [
  "Find a product designer interested in consumer brands",
  "Who has ecommerce and growth marketing experience?",
  "Find a technical cofounder who knows AI and Next.js",
];

export function ConnectionsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedMode =
    searchParams.get("mode") === "search" ? "search" : "browse";
  const [mode, setMode] = useState<"browse" | "search">(requestedMode);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<ConnectionSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => setMode(requestedMode), [requestedMode]);

  function changeMode(nextMode: "browse" | "search") {
    setMode(nextMode);
    router.replace(`/connections?mode=${nextMode}`, { scroll: false });
  }

  async function search(
    event?: FormEvent<HTMLFormElement>,
    suggestedQuery?: string,
  ) {
    event?.preventDefault();
    const submittedQuery = (suggestedQuery ?? query).trim();
    if (submittedQuery.length < 3) return;
    setQuery(submittedQuery);
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/connections/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: submittedQuery }),
      });
      const data = (await response.json()) as ConnectionSearchResponse & {
        error?: string;
      };
      if (!response.ok) throw new Error(data.error ?? "Search failed");
      setResult(data);
    } catch (searchError) {
      setResult(null);
      setError(
        searchError instanceof Error ? searchError.message : "Search failed",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid-texture min-h-screen px-4 pb-28 pt-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">Verified MU directory</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">
            Find your people. <span className="gradient-text">Your way.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">
            Browse the student directory or describe the exact collaborator you
            want to meet.
          </p>
        </header>

        <div
          className="mx-auto mt-8 flex w-fit rounded-full border border-line bg-surface p-1"
          role="tablist"
          aria-label="Connection discovery mode"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === "browse"}
            onClick={() => changeMode("browse")}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${mode === "browse" ? "bg-gradient-to-r from-teal to-amber text-app shadow-glow" : "text-muted hover:text-ink"}`}
          >
            Browse students
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "search"}
            onClick={() => changeMode("search")}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${mode === "search" ? "bg-gradient-to-r from-teal to-amber text-app shadow-glow" : "text-muted hover:text-ink"}`}
          >
            AI people search
          </button>
        </div>

        {mode === "browse" ? (
          <DirectoryBrowser />
        ) : (
          <>
            <form
              onSubmit={search}
              className="mx-auto mt-9 max-w-3xl"
              role="search"
            >
              <label className="sr-only" htmlFor="connection-query">
                Describe the person you want to meet
              </label>
              <div className="rounded-[1.4rem] bg-gradient-to-r from-teal/70 to-amber/70 p-px shadow-glow focus-within:from-teal focus-within:to-amber">
                <div className="flex items-end gap-3 rounded-[calc(1.4rem-1px)] bg-[#101010] p-3 pl-5">
                  <textarea
                    id="connection-query"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Find someone who has worked in ecommerce and wants to build a consumer brand…"
                    maxLength={500}
                    rows={2}
                    className="min-h-14 flex-1 resize-none appearance-none border-0 bg-transparent py-2 text-base text-ink outline-none ring-0 placeholder:text-muted/60 focus:border-transparent focus:outline-none focus:ring-0"
                    aria-describedby={
                      error ? "connection-error" : "search-help"
                    }
                  />
                  <button
                    className="primary-button !size-12 !min-h-0 !px-0"
                    type="submit"
                    disabled={loading || query.trim().length < 3}
                    aria-label="Search connections"
                  >
                    {loading ? (
                      <span className="animate-spin" aria-hidden="true">
                        ◌
                      </span>
                    ) : (
                      "↑"
                    )}
                  </button>
                </div>
              </div>
              <p
                id="search-help"
                className="mt-3 text-center text-xs text-muted"
              >
                Searches use profile summaries only—never private resume files.
              </p>
            </form>

            {!result && !loading && !error && (
              <section
                className="mx-auto mt-9 max-w-3xl"
                aria-labelledby="try-searches"
              >
                <h2
                  id="try-searches"
                  className="text-center text-xs font-semibold uppercase tracking-[0.16em] text-muted"
                >
                  Try a search
                </h2>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => void search(undefined, suggestion)}
                      className="rounded-full border border-line bg-surface px-4 py-2 text-sm text-muted transition hover:border-teal/50 hover:text-ink"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </section>
            )}
            {error && (
              <p
                id="connection-error"
                role="alert"
                className="mx-auto mt-7 max-w-3xl rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300"
              >
                {error}
              </p>
            )}
            {loading && <SearchSkeleton />}
            {result && !loading && (
              <section
                className="mt-10"
                aria-live="polite"
                aria-label="Search results"
              >
                <div className="panel p-6 sm:p-8">
                  <p className="eyebrow">UniConnect answer</p>
                  <p className="mt-4 text-lg leading-8 text-white/85">
                    {result.answer}
                  </p>
                  <p className="mt-3 text-xs text-muted">
                    {result.answerMode === "ai"
                      ? "AI-grounded answer"
                      : "Private local matching"}{" "}
                    · {result.profiles.length} verified result
                    {result.profiles.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="mt-5 grid gap-4">
                  {result.profiles.map((profile) => (
                    <ConnectionCardView
                      key={profile.userId}
                      profile={profile}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function ConnectionCardView({
  profile,
}: {
  profile: ConnectionSearchResponse["profiles"][number];
}) {
  return (
    <article className="panel p-5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        {profile.profilePhotoUrl ? (
          <Image
            src={profile.profilePhotoUrl}
            alt=""
            width={72}
            height={72}
            unoptimized
            className="size-[72px] rounded-full border border-line object-cover"
          />
        ) : (
          <div className="grid size-[72px] place-items-center rounded-full bg-gradient-to-br from-teal to-amber text-xl font-black text-app">
            {profile.name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold">{profile.name}</h2>
            <span className="rounded-full border border-line px-2.5 py-1 text-xs text-muted">
              {profile.cohort}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-white/70">
            {profile.matchReason}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {profile.skills.slice(0, 5).map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-white/5 px-3 py-1 text-xs text-muted"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
        <Link
          href={`/connections/${profile.userId}`}
          className="secondary-button !min-h-10 shrink-0 !px-5 !py-2"
        >
          View profile
        </Link>
      </div>
    </article>
  );
}

function SearchSkeleton() {
  return (
    <div className="mt-10 space-y-4" aria-label="Searching">
      <div className="panel animate-pulse p-8">
        <div className="h-3 w-32 rounded bg-white/10" />
        <div className="mt-5 h-5 w-4/5 rounded bg-white/5" />
      </div>
      {[1, 2].map((item) => (
        <div key={item} className="panel animate-pulse p-6">
          <div className="flex gap-4">
            <div className="size-[72px] rounded-full bg-white/10" />
            <div className="flex-1">
              <div className="h-4 w-36 rounded bg-white/10" />
              <div className="mt-4 h-3 w-3/4 rounded bg-white/5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
