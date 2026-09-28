type LogLevel = "error" | "warn";

export function logServerError(event: string, error: unknown, level: LogLevel = "error") {
  const detail = error instanceof Error
    ? { name: error.name, message: error.message, ...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {}) }
    : { message: "Unknown server error" };
  console[level](JSON.stringify({ event, ...detail, timestamp: new Date().toISOString() }));
}
