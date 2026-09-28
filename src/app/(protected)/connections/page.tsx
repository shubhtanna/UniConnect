import type { Metadata } from "next";
import { ConnectionsClient } from "@/components/connections/ConnectionsClient";
import { browseDirectory } from "@/lib/directory";

export const metadata: Metadata = { title: "Find connections" };

export default async function ConnectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const mode = (await searchParams).mode === "search" ? "search" : "browse";
  const initialDirectory =
    mode === "browse"
      ? await browseDirectory({
          q: "",
          cohort: "",
          skill: "",
          interest: "",
          lookingFor: "",
          page: 0,
        })
      : null;
  return (
    <ConnectionsClient initialMode={mode} initialDirectory={initialDirectory} />
  );
}
