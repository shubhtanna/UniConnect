"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ErrorState";

export default function ProtectedError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <ErrorState
      title="This page didn't load"
      description="Something went wrong on our side. Your data is safe — please try again in a moment."
      onRetry={reset}
    />
  );
}
