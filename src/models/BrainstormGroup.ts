import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const brainstormGroupSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  description: { type: String, required: true, trim: true, maxlength: 600 },
  tags: [{ type: String, trim: true }],
  access: { type: String, enum: ["open", "invite_only"], default: "open", required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  memberIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
  status: { type: String, enum: ["active", "archived"], default: "active", required: true },
}, { timestamps: true });

brainstormGroupSchema.index({ status: 1, access: 1, updatedAt: -1 });
brainstormGroupSchema.index({ memberIds: 1, updatedAt: -1 });
export type BrainstormGroupDocument = InferSchemaType<typeof brainstormGroupSchema>;
export const BrainstormGroup: Model<BrainstormGroupDocument> = (models.BrainstormGroup as Model<BrainstormGroupDocument>) ?? model<BrainstormGroupDocument>("BrainstormGroup", brainstormGroupSchema);
