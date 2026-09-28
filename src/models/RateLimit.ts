import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const rateLimitSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    count: { type: Number, required: true, default: 0 },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true },
);

export type RateLimitDocument = InferSchemaType<typeof rateLimitSchema>;
export const RateLimit: Model<RateLimitDocument> =
  (models.RateLimit as Model<RateLimitDocument>) ??
  model<RateLimitDocument>("RateLimit", rateLimitSchema);
