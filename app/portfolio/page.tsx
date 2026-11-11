import Link from "next/link";
import PortfolioDemos from "../../components/library/portfolio-demos";
import { ThemeToggle } from "../../components/landing/theme-toggle";
export const metadata = { title: "Portfolio components | oRangeUi", description: "An animated banner, responsive footer, painted truck and social stickers with sample content." };
export default function PortfolioPage() {
  return <main className="portfolio-standalone"><nav className="portfolio-standalone-nav" aria-label="Portfolio demo"><Link href="/components">Back to components</Link><ThemeToggle /></nav><PortfolioDemos /></main>;
}
