import { z } from "zod";
import { contentSafetyIssue, isSafePublicHttpsUrl } from "@/lib/content-safety";

const clean = (value: string) =>
  value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
const publicHttpsUrl = z
  .string()
  .url()
  .max(300)
  .refine(isSafePublicHttpsUrl, "Use a direct public HTTPS link");

function moderatedText(
  maximum: number,
  emptyMessage: string,
  allowLinks = true,
) {
  return z
    .string()
    .transform(clean)
    .pipe(z.string().min(1, emptyMessage).max(maximum))
    .superRefine((value, context) => {
      const issue = contentSafetyIssue(value, { allowLinks });
      if (issue)
        context.addIssue({ code: z.ZodIssueCode.custom, message: issue });
    });
}

export const feedTypeSchema = z.enum(["community", "spotlight"]);

export const createPostSchema = z
  .object({
    type: feedTypeSchema,
    content: moderatedText(5000, "Write something before posting"),
    mediaUrls: z.array(z.string().startsWith("/api/files/")).max(1).default([]),
    businessName: z
      .union([
        z.literal(""),
        moderatedText(120, "Business name is required", false),
      ])
      .optional(),
    businessLink: z.union([z.literal(""), publicHttpsUrl]).optional(),
    category: z
      .union([z.literal(""), moderatedText(80, "Category is required", false)])
      .optional(),
  })
  .superRefine((post, context) => {
    if (post.type !== "spotlight") return;
    for (const field of ["businessName", "businessLink", "category"] as const) {
      if (!post[field]) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field],
          message: `${field.replace(/([A-Z])/g, " $1").toLowerCase()} is required`,
        });
      }
    }
  });

export const commentSchema = z.object({
  text: moderatedText(1500, "Comment cannot be empty"),
});

export const updatePostSchema = createPostSchema;
export const reportSchema = z.object({
  category: z.enum([
    "harassment",
    "hate_or_abuse",
    "spam_or_scam",
    "unsafe_link",
    "privacy",
    "other",
  ]),
  reason: moderatedText(500, "Explain why you are reporting this", false).pipe(
    z.string().min(10, "Please provide at least 10 characters"),
  ),
});
