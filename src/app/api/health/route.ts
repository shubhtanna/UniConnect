import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getServerEnv } from "@/lib/env";
import { logServerError } from "@/lib/logger";

export async function GET() {
  const env = getServerEnv();
  let database = env.DATABASE_MODE === "memory" ? "development-memory" : "connected";
  try {
    if (env.DATABASE_MODE === "mongodb") {
      const connection = await connectToDatabase();
      await connection.connection.db?.admin().ping();
    }
  } catch (error) {
    logServerError("health_database_failed", error);
    database = "unavailable";
  }

  const ready = database !== "unavailable";
  return NextResponse.json(
    {
      status: ready ? "ok" : "degraded",
      database,
      storage: env.STORAGE_MODE,
      email: env.SMTP_HOST ? "configured" : "development-console",
      ai: env.OPENAI_API_KEY ? "configured" : "local-fallback",
      timestamp: new Date().toISOString(),
    },
    { status: ready ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
