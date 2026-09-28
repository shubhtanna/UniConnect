import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
const brainstormMessageSchema = new Schema({
  groupId: { type: Schema.Types.ObjectId, ref: "BrainstormGroup", required: true, index: true },
  authorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  body: { type: String, required: true, trim: true, maxlength: 2000 },
}, { timestamps: true });
brainstormMessageSchema.index({ groupId: 1, createdAt: 1 });
export type BrainstormMessageDocument = InferSchemaType<typeof brainstormMessageSchema>;
export const BrainstormMessage: Model<BrainstormMessageDocument> = (models.BrainstormMessage as Model<BrainstormMessageDocument>) ?? model<BrainstormMessageDocument>("BrainstormMessage", brainstormMessageSchema);
