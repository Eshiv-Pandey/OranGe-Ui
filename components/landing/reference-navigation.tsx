import Link from "next/link";
import { PixelLogo } from "./pixel-icon";

export function ReferenceNavigation({ pricing = false }: { pricing?: boolean }) {
  return <header className="reference-header"><nav className="reference-nav" aria-label="Main navigation">
    <Link href="/docs">Docs</Link>
    <Link href="/components">Components</Link>
    <Link href="/" className="reference-logo" aria-label="oRangeUi home"><PixelLogo /></Link>
    <Link href="/pricing" aria-current={pricing ? "page" : undefined}>Pricing</Link>
    <a href="https://github.com/Eshiv-Pandey/OranGe-Ui">GitHub</a>
  </nav></header>;
}
