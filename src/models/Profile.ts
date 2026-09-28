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

const profileSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    profilePhotoUrl: { type: String, default: "", trim: true },
    resumeUrl: { type: String, default: "", trim: true, select: false },
    cohort: { type: String, required: true, trim: true },
    skills: [{ type: String, trim: true }],
    interests: [{ type: String, trim: true }],
    workExperience: { type: [workExperienceSchema], default: [] },
    education: { type: [educationSchema], default: [] },
    currentProject: { type: String, default: "", trim: true },
    lookingFor: { type: String, required: true, trim: true },
    linkedinUrl: { type: String, default: "", trim: true },
    contactLink: { type: String, default: "", trim: true },
    fieldsFilledManually: { type: [String], default: [] },
    resumeEmbedding: { type: [Number], default: [], select: false },
    origin: { type: String, enum: ["self", "masters_cv"], default: "self", required: true },
    sourceResumeName: { type: String, default: "", trim: true, select: false },
    preloadedNoticeAcknowledgedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

profileSchema.index({ skills: 1 });
profileSchema.index({ interests: 1 });
profileSchema.index({ cohort: 1 });

export type ProfileDocument = InferSchemaType<typeof profileSchema>;

export const Profile: Model<ProfileDocument> =
  (models.Profile as Model<ProfileDocument>) ??
  model<ProfileDocument>("Profile", profileSchema);
