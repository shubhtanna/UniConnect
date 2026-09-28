import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const emailOtpSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    otpHash: { type: String, required: true, select: false },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    resendAvailableAt: { type: Date, required: true },
    attempts: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

export type EmailOtpDocument = InferSchemaType<typeof emailOtpSchema>;

export const EmailOtp: Model<EmailOtpDocument> =
  (models.EmailOtp as Model<EmailOtpDocument>) ??
  model<EmailOtpDocument>("EmailOtp", emailOtpSchema);
