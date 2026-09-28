"use client";

import Image from "next/image";
import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { FeedPost, FeedType } from "@/lib/feed-types";

type CurrentUser = { name: string; photoUrl: string; cohort: string };

async function requestJson(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  const data = (await response.json()) as Record<string, unknown> & {
    error?: string;
  };
  if (!response.ok) throw new Error(data.error ?? "Something went wrong");
  return data;
}

export function FeedClient({
  currentUser,
  initialType = "community",
  initialPosts = [],
  initialCursor = null,
}: {
  currentUser: CurrentUser;
  initialType?: FeedType;
  initialPosts?: FeedPost[];
  initialCursor?: string | null;
}) {
  const [activeType, setActiveType] = useState<FeedType>(initialType);
  const [posts, setPosts] = useState<FeedPost[]>(initialPosts);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const skipInitialRequest = useRef(true);

  const loadPosts = useCallback(async (type: FeedType, nextCursor?: string) => {
    const query = new URLSearchParams({ type });
    if (nextCursor) query.set("cursor", nextCursor);
    const result = (await requestJson(`/api/feed?${query}`)) as unknown as {
      posts: FeedPost[];
      nextCursor: string | null;
    };
    setPosts((current) =>
      nextCursor ? [...current, ...result.posts] : result.posts,
    );
    setCursor(result.nextCursor);
  }, []);

  useEffect(() => {
    if (skipInitialRequest.current && activeType === initialType) {
      skipInitialRequest.current = false;
      return;
    }
    setLoading(true);
    setError("");
    loadPosts(activeType)
      .catch((loadError) =>
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load posts",
        ),
      )
      .finally(() => setLoading(false));
  }, [activeType, initialType, loadPosts]);

  async function refresh() {
    await loadPosts(activeType);
  }

  return (
    <main className="min-h-screen px-4 pb-28 pt-7 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-3xl">
        <header className="sticky top-0 z-20 -mx-4 border-b border-line bg-app/90 px-4 pb-5 pt-3 backdrop-blur sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12">
          <p className="eyebrow">MU Community</p>
          <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-[-0.045em]">
                The Feed
              </h1>
              <p className="mt-2 text-sm text-muted">
                Ideas, progress, opportunities, and ventures.
              </p>
            </div>
            <div
              className="flex rounded-full border border-line bg-surface p-1"
              role="tablist"
              aria-label="Feed type"
            >
              {(["community", "spotlight"] as FeedType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  role="tab"
                  aria-selected={activeType === type}
                  onClick={() => {
                    setActiveType(type);
                    window.history.replaceState(null, "", `/feed?type=${type}`);
                  }}
                  className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${activeType === type ? "bg-gradient-to-r from-teal to-amber text-app" : "text-muted hover:text-ink"}`}
                >
                  {type === "community" ? "Community" : "Venture showcase"}
                </button>
              ))}
            </div>
          </div>
        </header>
        <Composer
          type={activeType}
          currentUser={currentUser}
          onCreated={refresh}
        />
        {error && (
          <p className="mt-6 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}
        <section className="mt-6 space-y-5" aria-live="polite">
          {loading ? (
            <FeedSkeleton />
          ) : posts.length === 0 ? (
            <EmptyFeed type={activeType} />
          ) : (
            posts.map((post) => (
              <PostCard key={post.id} post={post} onChanged={refresh} />
            ))
          )}
        </section>
        {cursor && !loading && (
          <button
            type="button"
            className="secondary-button mx-auto mt-8 flex"
            disabled={loadingMore}
            onClick={async () => {
              setLoadingMore(true);
              try {
                await loadPosts(activeType, cursor);
              } finally {
                setLoadingMore(false);
              }
            }}
          >
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        )}
      </div>
    </main>
  );
}

function Composer({
  type,
  currentUser,
  onCreated,
}: {
  type: FeedType;
  currentUser: CurrentUser;
  onCreated: () => Promise<void>;
}) {
  const [content, setContent] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessLink, setBusinessLink] = useState("");
  const [category, setCategory] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaName, setMediaName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    setError("");
  }, [type]);

  async function uploadMedia(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError("");
    setMediaName(file.name);
    const data = new FormData();
    data.append("file", file);
    try {
      const result = await requestJson("/api/feed/upload-media", {
        method: "POST",
        body: data,
      });
      setMediaUrl(String(result.url));
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Could not upload image",
      );
      setMediaName("");
    } finally {
      setLoading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await requestJson("/api/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          content,
          mediaUrls: mediaUrl ? [mediaUrl] : [],
          businessName,
          businessLink,
          category,
        }),
      });
      setContent("");
      setBusinessName("");
      setBusinessLink("");
      setCategory("");
      setMediaUrl("");
      setMediaName("");
      await onCreated();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not publish post",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className={`panel mt-7 p-5 sm:p-6 ${type === "spotlight" ? "border-l-2 border-l-teal" : ""}`}
    >
      <div className="flex gap-4">
        <Avatar src={currentUser.photoUrl} name={currentUser.name} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">
            {type === "community"
              ? "Share with the community"
              : "Spotlight your venture"}
          </p>
          <p className="mt-1 text-xs text-muted">
            {type === "spotlight"
              ? "Two Spotlight posts allowed per day."
              : `Posting as ${currentUser.name}`}
          </p>
        </div>
      </div>
      {type === "spotlight" && (
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <input
            className="text-field"
            value={businessName}
            onChange={(event) => setBusinessName(event.target.value)}
            placeholder="Business name"
            required
          />
          <input
            className="text-field"
            value={businessLink}
            onChange={(event) => setBusinessLink(event.target.value)}
            placeholder="https://business.com"
            type="url"
            required
          />
          <input
            className="text-field"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            placeholder="Category"
            required
          />
        </div>
      )}
      <textarea
        className="text-field mt-5 min-h-28 resize-y"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        maxLength={5000}
        required
        placeholder={
          type === "community"
            ? "What are you building, learning, or looking for?"
            : "Tell the MU community what makes this worth checking out…"
        }
      />
      {mediaName && (
        <div className="mt-3 flex items-center justify-between rounded-xl border border-line bg-white/[0.03] px-4 py-3 text-sm">
          <span className="truncate text-muted">{mediaName}</span>
          <button
            type="button"
            className="ml-3 text-xs text-red-300"
            onClick={() => {
              setMediaUrl("");
              setMediaName("");
            }}
          >
            Remove
          </button>
        </div>
      )}
      {error && (
        <p className="mt-3 text-sm text-red-300" role="alert">
          {error}
        </p>
      )}
      <div className="mt-4 flex items-center justify-between">
        <label className="cursor-pointer rounded-full border border-line px-4 py-2 text-sm font-semibold text-muted transition hover:border-teal/50 hover:text-ink">
          ＋ Add image
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={uploadMedia}
            className="sr-only"
            disabled={loading}
          />
        </label>
        <button
          className="primary-button !min-h-10 !px-6 !py-2"
          disabled={loading || !content.trim()}
          type="submit"
        >
          {loading
            ? "Working…"
            : type === "community"
              ? "Post"
              : "Publish Spotlight"}
        </button>
      </div>
    </form>
  );
}

function PostCard({
  post,
  onChanged,
}: {
  post: FeedPost;
  onChanged: () => Promise<void>;
}) {
  const [comment, setComment] = useState("");
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  async function action(path: string, body?: object, method = "POST") {
    setWorking(true);
    setMessage("");
    try {
      await requestJson(path, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      await onChanged();
    } catch (actionError) {
      setMessage(
        actionError instanceof Error ? actionError.message : "Action failed",
      );
    } finally {
      setWorking(false);
    }
  }
  async function sharePost() {
    setWorking(true);
    setMessage("");
    const url = `${window.location.origin}/feed?type=${post.type}#post-${post.id}`;
    try {
      if (navigator.share)
        await navigator.share({
          title: post.businessName ?? "UniConnect post",
          text: post.content.slice(0, 180),
          url,
        });
      else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setMessage("Post link copied.");
      } else window.prompt("Copy this post link", url);
      await requestJson(`/api/feed/${post.id}/share`, { method: "POST" });
      await onChanged();
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setMessage(
        error instanceof Error ? error.message : "Could not share this post",
      );
    } finally {
      setWorking(false);
    }
  }
  function report(path: string) {
    const reason = window.prompt(
      "Why are you reporting this? Please describe the problem.",
    );
    if (!reason) return;
    void action(path, { category: "other", reason });
  }
  function editPost() {
    const content = window.prompt("Edit your post", post.content);
    if (!content || content === post.content) return;
    void action(
      `/api/feed/${post.id}`,
      {
        type: post.type,
        content,
        mediaUrls: post.mediaUrls,
        businessName: post.businessName ?? "",
        businessLink: post.businessLink ?? "",
        category: post.category ?? "",
      },
      "PATCH",
    );
  }
  return (
    <article
      id={`post-${post.id}`}
      className={`panel scroll-mt-32 p-5 sm:p-6 ${post.type === "spotlight" ? "border-l-2 border-l-teal" : ""}`}
    >
      {post.type === "spotlight" && (
        <div className="mb-5 flex items-center justify-between">
          <span className="rounded-full bg-gradient-to-r from-teal to-amber px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-app">
            Spotlight
          </span>
          <span className="text-xs text-muted">{post.category}</span>
        </div>
      )}
      <header className="flex items-start gap-3">
        <Avatar src={post.authorPhotoUrl} name={post.authorName} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{post.authorName}</p>
          <p className="mt-1 text-xs text-muted">
            {post.authorCohort} · {formatTime(post.createdAt)}
            {post.editedAt ? " · edited" : ""}
          </p>
        </div>
        {post.isOwnedByCurrentUser ? (
          <div className="flex gap-3">
            <button
              type="button"
              disabled={working}
              onClick={editPost}
              className="text-xs text-muted hover:text-teal"
            >
              Edit
            </button>
            <button
              type="button"
              disabled={working}
              onClick={() => {
                if (window.confirm("Delete this post permanently?"))
                  void action(`/api/feed/${post.id}`, undefined, "DELETE");
              }}
              className="text-xs text-muted hover:text-red-300"
            >
              Delete
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={working}
            onClick={() => report(`/api/feed/${post.id}/report`)}
            className="text-xs text-muted hover:text-amber"
            title="Report this post"
          >
            Report
          </button>
        )}
      </header>
      {post.type === "spotlight" && (
        <div className="mt-5">
          <h2 className="text-xl font-semibold">{post.businessName}</h2>
          {post.businessLink && (
            <a
              href={post.businessLink}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block text-sm text-teal hover:underline"
            >
              Visit business ↗
            </a>
          )}
        </div>
      )}
      <p className="mt-5 whitespace-pre-wrap leading-7 text-white/85">
        {post.content}
      </p>
      {post.mediaUrls[0] && (
        <Image
          src={post.mediaUrls[0]}
          alt="Post attachment"
          width={900}
          height={600}
          unoptimized
          className="mt-5 max-h-[34rem] w-full rounded-xl border border-line object-cover"
        />
      )}
      <div className="mt-5 flex items-center gap-1 border-y border-line py-2">
        <ActionButton
          active={post.likedByCurrentUser}
          label={`♡ ${post.likeCount || "Like"}`}
          onClick={() => action(`/api/feed/${post.id}/like`)}
        />
        <ActionButton
          label={`◯ ${post.commentCount || "Comment"}`}
          onClick={() => document.getElementById(`comment-${post.id}`)?.focus()}
        />
        <ActionButton
          active={post.sharedByCurrentUser}
          label={`↗ ${post.shareCount || "Share"}`}
          onClick={sharePost}
        />
      </div>
      {post.comments.length > 0 && (
        <div className="mt-4 space-y-3">
          {post.comments.map((item) => (
            <div
              key={item.id}
              className="flex gap-3 rounded-xl bg-white/[0.035] p-3"
            >
              <Avatar src={item.authorPhotoUrl} name={item.authorName} small />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">
                    {item.authorName}
                    {item.editedAt && (
                      <span className="ml-2 text-[10px] font-normal text-muted">
                        edited
                      </span>
                    )}
                  </p>
                  {item.isOwnedByCurrentUser ? (
                    <div className="flex gap-3">
                      <button
                        type="button"
                        className="text-[11px] text-muted hover:text-teal"
                        onClick={() => {
                          const text = window.prompt(
                            "Edit your comment",
                            item.text,
                          );
                          if (text && text !== item.text)
                            void action(
                              `/api/feed/${post.id}/comments/${item.id}`,
                              { text },
                              "PATCH",
                            );
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="text-[11px] text-muted hover:text-red-300"
                        onClick={() => {
                          if (window.confirm("Delete this comment?"))
                            void action(
                              `/api/feed/${post.id}/comments/${item.id}`,
                              undefined,
                              "DELETE",
                            );
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="text-[11px] text-muted hover:text-amber"
                      onClick={() =>
                        report(
                          `/api/feed/${post.id}/comments/${item.id}/report`,
                        )
                      }
                    >
                      Report
                    </button>
                  )}
                </div>
                <p className="mt-1 text-sm leading-6 text-white/75">
                  {item.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
      <form
        className="mt-4 flex gap-2"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!comment.trim()) return;
          await action(`/api/feed/${post.id}/comments`, { text: comment });
          setComment("");
        }}
      >
        <input
          id={`comment-${post.id}`}
          className="text-field !min-h-10 flex-1 !rounded-full !py-2"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Add a comment…"
          maxLength={1500}
        />
        <button
          type="submit"
          disabled={working || !comment.trim()}
          className="grid size-10 place-items-center rounded-full bg-gradient-to-r from-teal to-amber font-bold text-app disabled:opacity-40"
        >
          ↑
        </button>
      </form>
      {message && <p className="mt-3 text-xs text-amber">{message}</p>}
    </article>
  );
}

function Avatar({
  src,
  name,
  small = false,
}: {
  src: string;
  name: string;
  small?: boolean;
}) {
  const size = small ? 34 : 44;
  return src ? (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      unoptimized
      className={`${small ? "size-[34px]" : "size-11"} shrink-0 rounded-full border border-line object-cover`}
    />
  ) : (
    <span
      className={`${small ? "size-[34px] text-xs" : "size-11 text-sm"} grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-teal/70 to-amber/60 font-bold text-app`}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
function ActionButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-lg px-2 py-2 text-xs font-semibold transition sm:text-sm ${active ? "bg-teal/10 text-teal" : "text-muted hover:bg-white/5 hover:text-ink"}`}
    >
      {label}
    </button>
  );
}
function EmptyFeed({ type }: { type: FeedType }) {
  return (
    <div className="panel px-6 py-16 text-center">
      <span className="gradient-text text-4xl">✦</span>
      <h2 className="mt-5 text-xl font-semibold">
        Start the {type === "community" ? "conversation" : "showcase"}.
      </h2>
      <p className="mt-2 text-sm text-muted">
        Be the first person to post here.
      </p>
    </div>
  );
}
function FeedSkeleton() {
  return (
    <div className="panel animate-pulse p-6">
      <div className="flex gap-3">
        <div className="size-11 rounded-full bg-white/10" />
        <div className="flex-1">
          <div className="h-3 w-32 rounded bg-white/10" />
          <div className="mt-3 h-2 w-24 rounded bg-white/5" />
        </div>
      </div>
      <div className="mt-7 h-20 rounded-xl bg-white/5" />
    </div>
  );
}
function formatTime(value: string) {
  const date = new Date(value);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
