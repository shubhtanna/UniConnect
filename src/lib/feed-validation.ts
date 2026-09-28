import { z } from "zod";

const clean = (value: string) => value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
const httpUrl = z.string().url().max(300).refine((value) => {
  const protocol = new URL(value).protocol;
  return protocol === "https:" || protocol === "http:";
}, "Use an http or https link");

export const feedTypeSchema = z.enum(["community", "spotlight"]);

export const createPostSchema = z
  .object({
    type: feedTypeSchema,
    content: z.string().transform(clean).pipe(z.string().min(1, "Write something before posting").max(5000)),
    mediaUrls: z.array(z.string().startsWith("/api/files/")).max(1).default([]),
    businessName: z.string().transform(clean).pipe(z.string().max(120)).optional(),
    businessLink: z.union([z.literal(""), httpUrl]).optional(),
    category: z.string().transform(clean).pipe(z.string().max(80)).optional(),
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
  text: z.string().transform(clean).pipe(z.string().min(1, "Comment cannot be empty").max(1500)),
});
