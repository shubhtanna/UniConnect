import type { Metadata, Viewport } from "next";
import "@/app/globals.css";

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://uniconnect-teal.vercel.app"),
  openGraph: {
    type: "website",
    siteName: "UniConnect",
    title: "UniConnect — Find your people at MU",
    description: "A verified network for Masters' Union students to discover skills, projects, and collaborators.",
  },
  robots: { index: false, follow: false },
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
