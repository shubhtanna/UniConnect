import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const workExperienceSchema = new Schema(
  {
    company: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    duration: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const educationSchema = new Schema(
  {
    institution: { type: String, required: true, trim: true },
    degree: { type: String, required: true, trim: true },
    year: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const preloadedProfileSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/@mastersunion\.org$/i, "A Masters' Union email is required"],
    },
    sourceResumeName: { type: String, required: true, trim: true },
    cohort: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    skills: [{ type: String, trim: true }],
    interests: [{ type: String, trim: true }],
    workExperience: { type: [workExperienceSchema], default: [] },
    education: { type: [educationSchema], default: [] },
    currentProject: { type: String, default: "", trim: true },
    lookingFor: { type: String, required: true, trim: true },
    linkedinUrl: { type: String, default: "", trim: true },
    contactLink: { type: String, default: "", trim: true },
    fieldsFilledManually: { type: [String], default: [] },
    resumeEmbedding: { type: [Number], required: true, select: false },
    status: {
      type: String,
      enum: ["pending", "claimed", "conflict"],
      default: "pending",
      required: true,
      index: true,
    },
    claimedUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    claimedAt: { type: Date, default: null },
    importBatchId: { type: String, required: true, trim: true, index: true },
  },
  { timestamps: true },
);

preloadedProfileSchema.index({ email: 1, status: 1 });

export type PreloadedProfileDocument = InferSchemaType<typeof preloadedProfileSchema>;

export const PreloadedProfile: Model<PreloadedProfileDocument> =
  (models.PreloadedProfile as Model<PreloadedProfileDocument>) ??
  model<PreloadedProfileDocument>("PreloadedProfile", preloadedProfileSchema);
