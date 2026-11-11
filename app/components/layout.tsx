import type { ReactNode } from "react";
import { LibraryShell } from "../../components/library/library-shell";
export default function ComponentsLayout({ children }: { children: ReactNode }) { return <LibraryShell>{children}</LibraryShell>; }
