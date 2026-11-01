import Link from "next/link";
import { ReferenceScene } from "../components/landing/reference-scene";
import { ReferenceNavigation } from "../components/landing/reference-navigation";
import "../styles/reference-landing.css";

export const metadata = {
  title: "orange UI | Components with a little more warmth.",
  description: "An open source React component library. Explore expressive components, make them your own, and bring a little more warmth to what you build.",
  alternates: { canonical: "/" },
};

// Kept as ordinary content so the supplied placeholder copy is easy to change.
const copy = {
  title: "orange UI",
  tagline: "Components with a little more warmth.",
  introduction: "An open source React library for interfaces with a little more character. Find a component, make it yours, and start building.",
  detail: "From everyday essentials to expressive scenes, explore five appearances, edit the details, and take the source into your next project.",
};

export default function Home() {
  return <div className="reference-landing">
    <link rel="preload" as="image" href="/landing/reference-scene.png" />
    <a href="#main" className="reference-skip">Skip to content</a>
    <ReferenceScene />
    <ReferenceNavigation />
    <main id="main" className="reference-content">
      <div className="reference-heading"><h1>{copy.title}</h1><p>{copy.tagline}</p></div>
      <Link className="reference-start" href="/components">Get Started</Link>
      <div className="reference-divider" aria-hidden="true" />
      <div className="reference-description"><p>{copy.introduction}</p><p>{copy.detail}</p></div>
    </main>
    <footer className="reference-meta"><span>Beautifully crafted components.</span><div><span>orange UI &copy;2026</span><Link href="/classic">Classic view</Link></div></footer>
  </div>;
}
