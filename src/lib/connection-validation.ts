import { z } from "zod";

export const connectionSearchSchema = z.object({
  query: z
    .string()
    .trim()
    .min(3, "Describe who you would like to meet")
    .max(500, "Keep your search under 500 characters")
    .transform((value) => value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")),
});
