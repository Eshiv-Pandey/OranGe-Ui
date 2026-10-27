import { Suspense } from "react";
import { LibraryShell } from "../../components/library/library-shell";
import { GettingStarted } from "../../components/library/getting-started";
export const metadata = { title: "Getting started | oRangeUi" };
export default function DocsPage() { return <Suspense><LibraryShell><GettingStarted /></LibraryShell></Suspense>; }
