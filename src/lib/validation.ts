import { z } from "zod";

export const muEmailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address")
  .transform((value) => value.toLowerCase())
  .refine((value) => value.split("@")[1] === "mastersunion.org", {
    message: "Use your @mastersunion.org email address",
  });

export const requestOtpSchema = z.object({
  email: muEmailSchema,
});

export const verifyOtpSchema = z.object({
  email: muEmailSchema,
  otp: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code"),
});
