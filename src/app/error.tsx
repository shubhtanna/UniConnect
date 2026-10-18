"use client";

import { ErrorState } from "@/components/ErrorState";

export default function RootError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen bg-app text-ink">
      <ErrorState
        title="Something went wrong"
        description="UniConnect hit an unexpected problem. Please try again in a moment."
        onRetry={reset}
      />
    </div>
  );
}
