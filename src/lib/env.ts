import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_MODE: z.enum(["mongodb", "memory"]).default("mongodb"),
  MONGODB_URI: z.string().optional(),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters"),
  OTP_PEPPER: z.string().min(32, "OTP_PEPPER must be at least 32 characters"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().default("UniConnect <no-reply@mastersunion.org>"),
  STORAGE_MODE: z.enum(["local", "cloudinary"]).default("local"),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_CHAT_MODEL: z.string().default("gpt-4o-mini"),
  OPENAI_EMBEDDING_MODEL: z.string().default("text-embedding-3-small"),
  OPENAI_EMBEDDING_DIMENSIONS: z.coerce.number().int().positive().default(1536),
  ATLAS_VECTOR_INDEX: z.string().default("profile_embedding"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
}).superRefine((env, context) => {
  if (env.DATABASE_MODE === "mongodb" && !env.MONGODB_URI) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["MONGODB_URI"],
      message: "MONGODB_URI is required when DATABASE_MODE is mongodb",
    });
  }

  if (env.NODE_ENV === "production" && env.DATABASE_MODE === "memory") {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["DATABASE_MODE"],
      message: "In-memory storage is not allowed in production",
    });
  }

  if (env.NODE_ENV === "production" && env.STORAGE_MODE !== "cloudinary") {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["STORAGE_MODE"],
      message: "Cloudinary storage is required in production",
    });
  }

  if (
    env.NODE_ENV === "production" &&
    (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["SMTP_HOST"],
      message: "SMTP host and credentials are required in production",
    });
  }

  if (
    env.STORAGE_MODE === "cloudinary" &&
    (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["CLOUDINARY_CLOUD_NAME"],
      message: "Cloudinary credentials are required when STORAGE_MODE is cloudinary",
    });
  }
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedEnv: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  if (cachedEnv) return cachedEnv;

  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid server environment: ${message}`);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}
