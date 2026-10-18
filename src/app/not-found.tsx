import type { Metadata } from "next";
import { ErrorState } from "@/components/ErrorState";

export const metadata: Metadata = { title: "Not found" };

export default function NotFound() {
  return (
    <div className="min-h-screen bg-app text-ink">
      <ErrorState
        title="Page not found"
        description="This page doesn't exist, or the profile or group was removed."
      />
    </div>
  );
}
