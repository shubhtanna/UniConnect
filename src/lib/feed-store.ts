import { randomUUID } from "crypto";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { getServerEnv } from "@/lib/env";
import type { CreatePostInput, FeedComment, FeedPost, FeedType } from "@/lib/feed-types";
import { getProfileSummaries } from "@/lib/profile-store";
import { Post } from "@/models/Post";

type MemoryComment = {
  id: string;
  userId: string;
  text: string;
  reports: string[];
  createdAt: string;
};

type MemoryPost = CreatePostInput & {
  id: string;
  authorId: string;
  likes: string[];
  shares: string[];
  reports: string[];
  comments: MemoryComment[];
  createdAt: string;
};

const globalWithFeed = globalThis as typeof globalThis & {
  uniconnectMemoryPosts?: Map<string, MemoryPost>;
};
const memoryPosts = globalWithFeed.uniconnectMemoryPosts ?? new Map<string, MemoryPost>();
globalWithFeed.uniconnectMemoryPosts = memoryPosts;

function usesMemoryStore() {
  return getServerEnv().DATABASE_MODE === "memory";
}

export async function createPost(authorId: string, input: CreatePostInput) {
  if (input.type === "spotlight") {
    const used = await countSpotlightsToday(authorId);
    if (!canCreateSpotlight(used)) throw new SpotlightLimitError();
  }

  if (usesMemoryStore()) {
    const post: MemoryPost = {
      ...input,
      id: randomUUID(),
      authorId,
      likes: [],
      shares: [],
      reports: [],
      comments: [],
      createdAt: new Date().toISOString(),
    };
    memoryPosts.set(post.id, post);
    return post.id;
  }

  await connectToDatabase();
  const post = await Post.create({
    ...input,
    authorId,
    likes: [],
    shares: [],
    reports: [],
    comments: [],
    shareCount: 0,
    reportCount: 0,
  });
  return post._id.toString();
}

export async function listPosts(options: {
  type: FeedType;
  currentUserId: string;
  cursor?: string;
  limit: number;
}) {
  let rawPosts: MemoryPost[];
  if (usesMemoryStore()) {
    rawPosts = [...memoryPosts.values()]
      .filter((post) => post.type === options.type)
      .filter((post) => !options.cursor || post.createdAt < options.cursor)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, options.limit + 1);
  } else {
    await connectToDatabase();
    const query: Record<string, unknown> = { type: options.type };
    if (options.cursor) query.createdAt = { $lt: new Date(options.cursor) };
    const documents = await Post.find(query)
      .select("+shares +reports +comments.reports")
      .sort({ createdAt: -1 })
      .limit(options.limit + 1)
      .lean();
    rawPosts = documents.map((post) => ({
      id: post._id.toString(),
      authorId: post.authorId.toString(),
      type: post.type,
      content: post.content,
      mediaUrls: post.mediaUrls,
      businessName: post.businessName ?? undefined,
      businessLink: post.businessLink ?? undefined,
      category: post.category ?? undefined,
      likes: post.likes.map((id) => id.toString()),
      shares: (post.shares ?? []).map((id) => id.toString()),
      reports: (post.reports ?? []).map((id) => id.toString()),
      comments: post.comments.map((comment) => ({
        id: comment._id.toString(),
        userId: comment.userId.toString(),
        text: comment.text,
        reports: (comment.reports ?? []).map((id) => id.toString()),
        createdAt: comment.createdAt.toISOString(),
      })),
      createdAt: post.createdAt.toISOString(),
    }));
  }

  const hasMore = rawPosts.length > options.limit;
  const page = rawPosts.slice(0, options.limit);
  const userIds = page.flatMap((post) => [post.authorId, ...post.comments.map((comment) => comment.userId)]);
  const profiles = await getProfileSummaries(userIds);
  const posts: FeedPost[] = page.map((post) => {
    const author = profiles[post.authorId];
    return {
      id: post.id,
      authorId: post.authorId,
      authorName: author?.name ?? "MU Student",
      authorPhotoUrl: author?.profilePhotoUrl ?? "",
      authorCohort: author?.cohort ?? "Masters' Union",
      type: post.type,
      content: post.content,
      mediaUrls: post.mediaUrls,
      businessName: post.businessName,
      businessLink: post.businessLink,
      category: post.category,
      likeCount: post.likes.length,
      commentCount: post.comments.length,
      shareCount: post.shares.length,
      reportCount: post.reports.length,
      likedByCurrentUser: post.likes.includes(options.currentUserId),
      sharedByCurrentUser: post.shares.includes(options.currentUserId),
      comments: post.comments.map((comment): FeedComment => ({
        id: comment.id,
        userId: comment.userId,
        authorName: profiles[comment.userId]?.name ?? "MU Student",
        authorPhotoUrl: profiles[comment.userId]?.profilePhotoUrl ?? "",
        text: comment.text,
        reportCount: comment.reports.length,
        createdAt: comment.createdAt,
      })),
      createdAt: post.createdAt,
    };
  });

  return {
    posts,
    nextCursor: hasMore ? page.at(-1)?.createdAt ?? null : null,
  };
}

export async function toggleLike(postId: string, userId: string) {
  requireValidId(postId);
  if (usesMemoryStore()) {
    const post = requireMemoryPost(postId);
    post.likes = toggleId(post.likes, userId);
    return post.likes.includes(userId);
  }
  await connectToDatabase();
  const post = await Post.findById(postId).select("likes");
  if (!post) throw new PostNotFoundError();
  const liked = post.likes.some((id) => id.toString() === userId);
  if (liked) post.likes = post.likes.filter((id) => id.toString() !== userId);
  else post.likes.push(new Types.ObjectId(userId));
  await post.save();
  return !liked;
}

export async function toggleShare(postId: string, userId: string) {
  requireValidId(postId);
  if (usesMemoryStore()) {
    const post = requireMemoryPost(postId);
    post.shares = toggleId(post.shares, userId);
    return post.shares.includes(userId);
  }
  await connectToDatabase();
  const post = await Post.findById(postId).select("+shares");
  if (!post) throw new PostNotFoundError();
  const shared = post.shares.some((id) => id.toString() === userId);
  if (shared) post.shares = post.shares.filter((id) => id.toString() !== userId);
  else post.shares.push(new Types.ObjectId(userId));
  post.shareCount = post.shares.length;
  await post.save();
  return !shared;
}

export async function addComment(postId: string, userId: string, text: string) {
  requireValidId(postId);
  if (usesMemoryStore()) {
    const post = requireMemoryPost(postId);
    const comment: MemoryComment = { id: randomUUID(), userId, text, reports: [], createdAt: new Date().toISOString() };
    post.comments.push(comment);
    return comment.id;
  }
  await connectToDatabase();
  const id = new Types.ObjectId();
  const result = await Post.updateOne(
    { _id: postId },
    { $push: { comments: { _id: id, userId, text, reports: [], reportCount: 0, createdAt: new Date() } } },
  );
  if (!result.matchedCount) throw new PostNotFoundError();
  return id.toString();
}

export async function reportPost(postId: string, userId: string) {
  requireValidId(postId);
  if (usesMemoryStore()) {
    const post = requireMemoryPost(postId);
    if (!post.reports.includes(userId)) post.reports.push(userId);
    return;
  }
  await connectToDatabase();
  const result = await Post.updateOne(
    { _id: postId, reports: { $ne: userId } },
    { $addToSet: { reports: userId }, $inc: { reportCount: 1 } },
  );
  if (!result.matchedCount) throw new PostNotFoundError();
}

export async function reportComment(postId: string, commentId: string, userId: string) {
  requireValidId(postId);
  requireValidId(commentId);
  if (usesMemoryStore()) {
    const comment = requireMemoryPost(postId).comments.find((item) => item.id === commentId);
    if (!comment) throw new PostNotFoundError();
    if (!comment.reports.includes(userId)) comment.reports.push(userId);
    return;
  }
  await connectToDatabase();
  const result = await Post.updateOne(
    { _id: postId, comments: { $elemMatch: { _id: commentId, reports: { $ne: userId } } } },
    { $addToSet: { "comments.$.reports": userId }, $inc: { "comments.$.reportCount": 1 } },
  );
  if (!result.matchedCount) throw new PostNotFoundError();
}

async function countSpotlightsToday(authorId: string) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (usesMemoryStore()) {
    return [...memoryPosts.values()].filter(
      (post) => post.authorId === authorId && post.type === "spotlight" && new Date(post.createdAt) >= start,
    ).length;
  }
  await connectToDatabase();
  return Post.countDocuments({ authorId, type: "spotlight", createdAt: { $gte: start } });
}

function requireMemoryPost(id: string) {
  const post = memoryPosts.get(id);
  if (!post) throw new PostNotFoundError();
  return post;
}

function toggleId(ids: string[], id: string) {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
}

function requireValidId(id: string) {
  const valid = usesMemoryStore()
    ? /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
    : Types.ObjectId.isValid(id);
  if (!valid) throw new PostNotFoundError();
}

export class SpotlightLimitError extends Error {}
export class PostNotFoundError extends Error {}

export function canCreateSpotlight(postsToday: number) {
  return postsToday < 2;
}
