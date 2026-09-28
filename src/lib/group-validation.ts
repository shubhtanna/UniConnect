import { z } from "zod";
import { muEmailSchema } from "@/lib/validation";
import { normalizeProfileInterests } from "@/lib/profile-validation";

export const createGroupSchema = z.object({
  name: z.string().trim().min(3).max(80),
  description: z.string().trim().min(20).max(600),
  tags: z.array(z.string()).transform(normalizeProfileInterests).pipe(z.array(z.string().min(2).max(30)).min(1).max(6)),
  access: z.enum(["open", "invite_only"]),
  inviteEmails: z.array(muEmailSchema).max(20).default([]),
});
export const groupMessageSchema = z.object({ body: z.string().trim().min(1).max(2000) });
