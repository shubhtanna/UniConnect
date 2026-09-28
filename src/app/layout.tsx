import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: {
    default: "UniConnect — Find your people at MU",
    template: "%s · UniConnect",
  },
  description:
    "A verified network for Masters' Union students to discover skills, projects, and collaborators.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
