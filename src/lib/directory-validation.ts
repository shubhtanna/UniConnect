import { z } from "zod";

const cleanText = (maximum: number) => z.string().trim().max(maximum)
  .transform((value) => value.replace(/[\u0000-\u001F\u007F]/g, ""));

export const directoryQuerySchema = z.object({
  q: cleanText(100).default(""),
  cohort: cleanText(120).default(""),
  skill: cleanText(60).default(""),
  interest: cleanText(40).default(""),
  lookingFor: cleanText(160).default(""),
  page: z.coerce.number().int().min(0).max(100).default(0),
});

export type DirectoryQuery = z.infer<typeof directoryQuerySchema>;
