import { PixelSprite, type PixelPalette } from "./pixel-sprite";
import "../../styles/pixel-art.css";

export const gamerBoyPixels = [
  "................................",
  "................................",
  "................................",
  "..........IIIIIIIIIIII..........",
  "..........HHHHHHHHHHHI..........",
  ".........IBBBBBBBBBBBBII........",
  ".........IBBBBBBBBBBBBII........",
  ".........IBIIIIIIIIIIIIII.......",
  ".........IBBBBFFFFFFFFFFI.......",
  ".........IIBBBFFFFFFFFFFI.......",
  "...........BBBFFFFFFFIFIII......",
  "...........BBBFFFFFFFIFIFI......",
  "...........BFFFFFFFFFFFIII......",
  "...........IFFFFFFFFFIIFI.......",
  "..............IffffffffI........",
  "................IFFFI...........",
  "................IFFFI...........",
  "..........IIIIIIIIIIIIII........",
  ".........IIIITTTTTTTTTTI..III...",
  ".........IttITTIIIIIIIIIIIIII...",
  ".........IttITTIKKIIIIIIIKKII...",
  ".........IttITTIIKIGGGGGIOKII...",
  ".........IttIIIIIIIIIIIIIKKII...",
  ".........IttIFFFFFKKKKKKKKKII...",
  ".........IIIIIIIIIIIIIIIIIIII...",
  "...........ISSSSSSSSSSSI........",
  "...........IIIIIIIIIIIII........",
  "............IFFFI..IFFFI........",
  "............IFFFI..IFFFI........",
  "............IIIII..IIIII........",
  "...........IIIIIIIIIIIIII.......",
  "................................",
] as const;

const palette: PixelPalette = {
  I: "#242b20", B: "#3f352b", H: "#66513a", F: "#f3bd87", f: "#d99963",
  T: "var(--accent-mint)", t: "var(--grass-mid)", S: "var(--accent-sky)",
  K: "#fffaf0", G: "var(--accent-lime)", O: "var(--primary)",
};

export function GamerBoy({ className = "" }: { className?: string }) {
  return (
    <div className={`gamer-boy ${className}`} aria-hidden="true">
      <PixelSprite rows={gamerBoyPixels} palette={palette} className="gamer-boy__sprite" />
      <svg className="gamer-boy__thumb" width="32" height="32" viewBox="0 0 32 32">
        <rect x="25" y="21" width="2" height="2" fill="#242b20" />
        <rect x="25" y="21" width="1" height="1" fill="#f3bd87" />
      </svg>
      <span className="gamer-boy__shadow" />
    </div>
  );
}
