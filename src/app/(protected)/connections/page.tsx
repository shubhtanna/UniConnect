import type { Metadata } from "next";
import { ConnectionsClient } from "@/components/connections/ConnectionsClient";

export const metadata: Metadata = { title: "Find connections" };

export default function ConnectionsPage() {
  return <ConnectionsClient />;
}
