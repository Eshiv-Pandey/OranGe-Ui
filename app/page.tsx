import { PixelMascot } from "../components/art/pixel-mascot";
import { GamerBoy } from "../components/art/gamer-boy";
import { PixelGrass } from "../components/art/pixel-grass";
import { Button } from "../components/ui/button";
import { ComponentShowcase } from "../components/landing/component-showcase";
import { HandheldConsole } from "../components/landing/handheld-console";
import { PixelIcon, PixelLogo, PixelTree } from "../components/landing/pixel-icon";
import { ThemeToggle } from "../components/landing/theme-toggle";
import "../styles/landing.css";

const github = "https://github.com/Eshiv-Pandey/OranGe-Ui";

export default function Home() {
  return <>
    <a href="#main" className="skip-link">Skip to content</a>
    <header className="site-header page-width">
      <a className="wordmark" href="#" aria-label="oRangeUi home"><PixelLogo /><span className="pixel-type">oRangeUi<span className="wordmark-dot">.</span></span></a>
      <nav aria-label="Main navigation"><a href="#components">Components</a><a href="#features">Why oRangeUi?</a><a href="#coming-soon">What&apos;s next</a></nav>
      <div className="nav-actions"><ThemeToggle /><Button asChild variant="secondary" className="github-button"><a href={github}><PixelIcon name="github" /><span>GitHub</span><PixelIcon name="arrow" /></a></Button></div>
    </header>
    <main id="main">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-heading"><p className="eyebrow"><span className="status-dot" />OPEN SOURCE. FULL OF CHARACTER.</p><h1 id="hero-title" className="pixel-type">Play with pixels.<br /><span>Ship with polish.</span></h1><p className="hero-subtitle">oRangeUi is an open source React component library with a pixel soul. Polished, accessible, and readable by AI tools.</p></div>
        <div className="hero-scene"><div className="landscape landscape--left"><span className="pixel-cloud" /><PixelTree /><PixelTree small /><span className="pixel-flower" /></div><PixelMascot /><div className="landscape landscape--right"><span className="pixel-cloud" /><PixelTree small /><PixelTree /><span className="pixel-flower" /></div><span className="scene-spark scene-spark--one"><PixelIcon name="sparkle" /></span><span className="scene-spark scene-spark--two"><PixelIcon name="sparkle" /></span></div>
      </section>
      <div className="showcase-wrap"><div className="grass-divider"><PixelGrass /></div><ComponentShowcase /></div>
      <section id="coming-soon" className="coming-soon" aria-labelledby="coming-soon-title"><div className="page-width coming-layout"><div className="coming-copy"><p className="eyebrow">THE NEXT LEVEL</p><h2 id="coming-soon-title" className="pixel-type">Good things<br />take a few pixels.</h2><p>A small library, built with care. More components are on the way. Until then, there is plenty to play with.</p><Button asChild variant="secondary"><a href={github}>Follow along<PixelIcon name="arrow" /></a></Button><div className="gamer-caption"><GamerBoy /><span>Currently: making<br />every pixel count.</span></div></div><HandheldConsole /></div></section>
    </main>
    <footer className="site-footer page-width"><div><a className="wordmark" href="#" aria-label="oRangeUi home"><PixelLogo /><span className="pixel-type">oRangeUi<span className="wordmark-dot">.</span></span></a><p>A pixel soul. A polished finish.</p></div><div className="footer-links"><a href={`${github}/blob/main/LICENSE`}>MIT license</a><a href={github}>GitHub<PixelIcon name="arrow" /></a><span>Made for the joy of building.<PixelIcon name="heart" /></span></div></footer>
  </>;
}
