export type FeedType = "community" | "spotlight";

export type FeedComment = {
  id: string;
  userId: string;
  authorName: string;
  authorPhotoUrl: string;
  text: string;
  reportCount: number;
  createdAt: string;
};

export type FeedPost = {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoUrl: string;
  authorCohort: string;
  type: FeedType;
  content: string;
  mediaUrls: string[];
  businessName?: string;
  businessLink?: string;
  category?: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  reportCount: number;
  likedByCurrentUser: boolean;
  sharedByCurrentUser: boolean;
  comments: FeedComment[];
  createdAt: string;
};

export type CreatePostInput = {
  type: FeedType;
  content: string;
  mediaUrls: string[];
  businessName?: string;
  businessLink?: string;
  category?: string;
};
