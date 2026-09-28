import { requireCompleteUser } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await requireCompleteUser();
  return <AppShell email={user.email}>{children}</AppShell>;
}
