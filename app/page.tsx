import Link from "next/link";
import { Button } from "../components/ui/button";
import { ComponentShowcase } from "../components/landing/component-showcase";
import { HandheldConsole } from "../components/landing/handheld-console";
import { PixelLogo } from "../components/landing/pixel-icon";
import { Icon } from "../components/landing/icon";
import { Hero } from "../components/landing/hero";
import { ThemeToggle } from "../components/landing/theme-toggle";
import "../styles/landing.css";

const github = "https://github.com/Eshiv-Pandey/OranGe-Ui";

export default function Home() {
  return <>
    <a href="#main" className="skip-link">Skip to content</a>
    <header className="site-header page-width">
      <a className="wordmark" href="#" aria-label="oRangeUi home"><PixelLogo /><span>oRangeUi<span className="wordmark-dot">.</span></span></a>
      <nav aria-label="Main navigation"><Link href="/components">Components</Link><Link href="/docs">Documentation</Link></nav>
      <div className="nav-actions"><ThemeToggle /><Button asChild variant="secondary" className="github-button"><a href={github} aria-label="GitHub"><Icon name="github" /><span>GitHub</span><Icon name="arrow" /></a></Button></div>
    </header>
    <main id="main">
      <Hero />
      <ComponentShowcase />
      <section id="coming-soon" className="coming-soon" aria-labelledby="coming-soon-title"><div className="page-width coming-layout">
        <div className="coming-copy"><p className="eyebrow">LESS SCROLLING. MORE PLAYING.</p><h2 id="coming-soon-title">A little break.<br />A new high score.</h2><p>Meet GamerBoy. A purple pocket of play, ready to make itself at home in your next project. Collect four stars and make it yours.</p><Button asChild variant="secondary"><Link href="/components/gamer-boy">Get the GamerBoy<Icon name="arrow" /></Link></Button><span className="coming-note">Built for the joy of making things.</span></div>
        <HandheldConsole />
      </div></section>
    </main>
    <footer className="site-footer page-width"><div><a className="wordmark" href="#" aria-label="oRangeUi home"><PixelLogo /><span>oRangeUi<span className="wordmark-dot">.</span></span></a><p>A pixel soul. A polished finish.</p></div><div className="footer-links"><a href={`${github}/blob/main/LICENSE`}>MIT license</a><a href={github}>GitHub<Icon name="arrow" /></a><span>Made for the joy of building.<Icon name="heart" /></span></div></footer>
  </>;
}
