"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Status = "opening" | "failed";

export function TestAccessClient() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("opening");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function openAccess() {
      const token = window.location.hash.slice(1);
      window.history.replaceState(null, "", window.location.pathname);

      if (!token) {
        setError("This private test link is incomplete or has expired.");
        setStatus("failed");
        return;
      }

      try {
        const response = await fetch("/api/auth/test-access", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const result = (await response.json()) as {
          error?: string;
          redirectTo?: string;
        };

        if (!response.ok) {
          throw new Error(result.error ?? "Private test access is unavailable.");
        }

        if (active) router.replace(result.redirectTo ?? "/dashboard");
      } catch (accessError) {
        if (!active) return;
        setError(
          accessError instanceof Error
            ? accessError.message
            : "Private test access is unavailable.",
        );
        setStatus("failed");
      }
    }

    void openAccess();
    return () => {
      active = false;
    };
  }, [router]);

  return (
    <div className="text-center">
      <p className="eyebrow">Private tester access</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-ink">
        {status === "opening" ? "Opening UniConnect…" : "Link unavailable"}
      </h1>
      <p className="mx-auto mt-4 max-w-md leading-7 text-ink/60" role="status">
        {status === "opening"
          ? "We’re creating your temporary test session. No OTP is required."
          : error}
      </p>
      {status === "opening" && (
        <div className="mx-auto mt-8 h-1.5 w-40 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-teal to-yellow" />
        </div>
      )}
      {status === "failed" && (
        <a className="primary-button mt-8 inline-flex" href="/login">
          Return to sign in
        </a>
      )}
    </div>
  );
}
