import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";

const reportDetailSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    category: {
      type: String,
      enum: [
        "harassment",
        "hate_or_abuse",
        "spam_or_scam",
        "unsafe_link",
        "privacy",
        "other",
      ],
      required: true,
    },
    reason: { type: String, required: true, trim: true, maxlength: 500 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const commentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true, maxlength: 1500 },
    reportCount: { type: Number, default: 0, min: 0 },
    reports: [{ type: Schema.Types.ObjectId, ref: "User", select: false }],
    reportDetails: { type: [reportDetailSchema], default: [], select: false },
    editedAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const postSchema = new Schema(
  {
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["community", "spotlight"],
      required: true,
      index: true,
    },
    content: { type: String, required: true, trim: true, maxlength: 5000 },
    mediaUrls: { type: [String], default: [] },
    businessName: { type: String, trim: true },
    businessLink: { type: String, trim: true },
    category: { type: String, trim: true },
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    shares: [{ type: Schema.Types.ObjectId, ref: "User", select: false }],
    reports: [{ type: Schema.Types.ObjectId, ref: "User", select: false }],
    reportDetails: { type: [reportDetailSchema], default: [], select: false },
    comments: { type: [commentSchema], default: [] },
    shareCount: { type: Number, default: 0, min: 0 },
    reportCount: { type: Number, default: 0, min: 0 },
    editedAt: { type: Date },
  },
  { timestamps: true },
);

postSchema.pre("validate", function validateSpotlightFields(next) {
  if (
    this.type === "spotlight" &&
    (!this.businessName || !this.businessLink || !this.category)
  ) {
    next(
      new Error(
        "Spotlight posts require a business name, business link, and category",
      ),
    );
    return;
  }
  next();
});

postSchema.index({ createdAt: -1 });
postSchema.index({ authorId: 1, type: 1, createdAt: -1 });

export type PostDocument = InferSchemaType<typeof postSchema>;

export const Post: Model<PostDocument> =
  (models.Post as Model<PostDocument>) ??
  model<PostDocument>("Post", postSchema);
