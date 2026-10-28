import { connection } from "next/server";
import { LibraryShell } from "../../components/library/library-shell";
import { GettingStarted } from "../../components/library/getting-started";
import { Avatar } from "../../components/ui/avatar";
export const metadata = { title: "Getting started | oRangeUi" };
export default async function DocsPage() { await connection(); return <LibraryShell><GettingStarted serverAvatar={<Avatar seed="user-42" size={80} aria-label="Server rendered avatar" />} /></LibraryShell>; }
