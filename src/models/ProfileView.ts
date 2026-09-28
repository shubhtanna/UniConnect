import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const profileViewSchema = new Schema({
  viewerUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  viewedUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  viewerMode: { type: String, enum: ["named", "anonymous"], required: true },
  viewCount: { type: Number, default: 0, min: 0 },
  lastViewedAt: { type: Date, default: Date.now, required: true },
}, { timestamps: true });

profileViewSchema.index({ viewerUserId: 1, viewedUserId: 1 }, { unique: true });
profileViewSchema.index({ viewedUserId: 1, lastViewedAt: -1 });

export type ProfileViewDocument = InferSchemaType<typeof profileViewSchema>;
export const ProfileView: Model<ProfileViewDocument> =
  (models.ProfileView as Model<ProfileViewDocument>) ?? model<ProfileViewDocument>("ProfileView", profileViewSchema);
