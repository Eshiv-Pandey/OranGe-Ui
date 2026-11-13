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
};

export default function Home() {
  return <div className="reference-landing">
    <link rel="preload" as="image" href="/landing/sunset-scene.png" />
    <a href="#main" className="reference-skip">Skip to content</a>
    <ReferenceScene />
    <ReferenceNavigation />
    <main id="main" className="reference-content">
      <div className="reference-heading"><h1>{copy.title}</h1><p>{copy.tagline}</p></div>
    </main>
  </div>;
}
