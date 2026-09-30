import { z } from "zod";
import { muEmailSchema } from "@/lib/validation";
import { normalizeProfileInterests } from "@/lib/profile-validation";
import { contentSafetyIssue } from "@/lib/content-safety";

const safeGroupText = (minimum: number, maximum: number, allowLinks = true) =>
  z
    .string()
    .trim()
    .min(minimum)
    .max(maximum)
    .superRefine((value, context) => {
      const issue = contentSafetyIssue(value, { allowLinks });
      if (issue)
        context.addIssue({ code: z.ZodIssueCode.custom, message: issue });
    });

export const createGroupSchema = z.object({
  name: safeGroupText(3, 80, false),
  description: safeGroupText(20, 600),
  tags: z
    .array(z.string())
    .transform(normalizeProfileInterests)
    .pipe(z.array(z.string().min(2).max(30)).min(1).max(6)),
  access: z.enum(["open", "invite_only"]),
  inviteEmails: z
    .array(muEmailSchema)
    .max(20)
    .transform((emails) => [...new Set(emails)])
    .default([]),
});
export const updateGroupSchema = createGroupSchema.omit({ inviteEmails: true });
export const groupMessageSchema = z.object({ body: safeGroupText(1, 2000) });
export const groupInvitationResponseSchema = z.object({
  action: z.enum(["accept", "decline"]),
});
