import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/@mastersunion\.org$/i, "A Masters' Union email is required"],
    },
    isEmailVerified: { type: Boolean, default: false, required: true },
    isProfileComplete: { type: Boolean, default: false, required: true },
    profileViewMode: { type: String, enum: ["named", "anonymous"], default: "named", required: true },
  },
  { timestamps: true },
);

export type UserDocument = InferSchemaType<typeof userSchema>;

export const User: Model<UserDocument> =
  (models.User as Model<UserDocument>) ?? model<UserDocument>("User", userSchema);
