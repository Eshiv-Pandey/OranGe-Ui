import type { Metadata } from "next";
import { connection } from "next/server";
import { LibraryShell } from "../../components/library/library-shell";
import { GettingStarted } from "../../components/library/getting-started";
import { Avatar } from "../../components/ui/avatar";
const title = "Getting started | oRangeUi";
const description = "Install oRangeUi through its shadcn registry or source ZIPs, choose an appearance, and build accessible React interfaces.";
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/docs" },
  openGraph: { type: "website", siteName: "oRangeUi", title, description, images: ["/opengraph-image"] },
  twitter: { card: "summary_large_image", title, description, images: ["/opengraph-image"] },
};
export default async function DocsPage() { await connection(); return <LibraryShell><GettingStarted serverAvatar={<Avatar seed="user-42" size={80} aria-label="Server rendered avatar" />} /></LibraryShell>; }
