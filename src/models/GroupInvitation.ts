import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";

const groupInvitationSchema = new Schema(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: "BrainstormGroup",
      required: true,
      index: true,
    },
    invitedEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/@mastersunion\.org$/i, "A Masters' Union email is required"],
      index: true,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    invitedUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "revoked"],
      default: "pending",
      required: true,
      index: true,
    },
    deliveryStatus: {
      type: String,
      enum: ["pending", "sent", "failed"],
      default: "pending",
      required: true,
    },
    respondedAt: { type: Date },
    sentAt: { type: Date },
  },
  { timestamps: true },
);

groupInvitationSchema.index(
  { groupId: 1, invitedEmail: 1 },
  { unique: true },
);
groupInvitationSchema.index({ invitedEmail: 1, status: 1, createdAt: -1 });

export type GroupInvitationDocument = InferSchemaType<
  typeof groupInvitationSchema
>;

export const GroupInvitation: Model<GroupInvitationDocument> =
  (models.GroupInvitation as Model<GroupInvitationDocument>) ??
  model<GroupInvitationDocument>("GroupInvitation", groupInvitationSchema);
