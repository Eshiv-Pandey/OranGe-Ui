import { PixelSprite, type PixelPalette } from "./pixel-sprite";
import "../../styles/pixel-art.css";

export const mascotPixels = [
  "................................",
  "...............IIIIIII..........",
  ".............IGGGGGGGII.........",
  ".............IGGGGGGGII.........",
  "............IggggggII...........",
  "............IIIIIgIII...........",
  "................Ig..............",
  "............IOOOOOOOOI..........",
  "..........IOOOOOOOOOOOOI........",
  ".........IOOOHHHOOOOOOOOI.......",
  "........IOHHHOOOOOOOOOOOOI......",
  ".......IOOHHHOOOOOOOOOOOOOI.....",
  ".......IHHOOOOOOOOOOOOOOSSI.....",
  "......IOHHEEEEOOOOOOEEEESSOI....",
  "......IOHHEEEEOOOOOOEEEESSOI....",
  "......IOHHEEEPOOOOOOEEEPSSOI....",
  ".....IOOOOEEPPOOOOOOEEPPSSOOI...",
  "....IOOOOOEEPPOOOOOOEEPPSSOOOI..",
  "...IOOOOOOOOOOOOOOOOOOOOOOOOOOI.",
  "...IOOOOOCCCOOOOIIIOOOCCCOOOOOI.",
  "....IOOOOOOOOOOOOIOOOOOOOOOOOI..",
  "......IOOOOOOOOOOOOOOOOSSOOI....",
  ".......IOOOOOOOOOOOOOOOSSOI.....",
  "........IOOSSSSSSSSSSSOOOI......",
  ".........IOOOOOOOOOOOOOOI.......",
  "..........IOOOOOOOOOOOOI........",
  "..........ISSSI.....ISSSI.......",
  "..........ISSSI.....ISSSI.......",
  "..........IIIII.....IIIII.......",
  "................................",
  "................................",
  "................................",
] as const;

const bodyPalette: PixelPalette = {
  I: "#242b20", O: "var(--primary)", H: "var(--primary-hover)", S: "#d85528",
  G: "var(--accent-lime)", g: "var(--grass-front)", C: "var(--accent-coral)",
  E: "var(--primary)", P: "var(--primary)",
};

export function PixelMascot({ className = "" }: { className?: string }) {
  return (
    <div className={`pixel-mascot ${className}`} aria-hidden="true">
      <svg className="pixel-mascot__spark pixel-mascot__spark--left" viewBox="0 0 16 16" width="16" height="16">
        <path d="M6 0h4v6h6v4h-6v6H6v-6H0V6h6z" fill="var(--primary)" />
        <rect x="6" y="6" width="4" height="4" fill="var(--cream)" />
      </svg>
      <svg className="pixel-mascot__bubble" viewBox="0 0 48 40" width="48" height="40">
        <path d="M4 0h40v4h4v24h-4v4H20v4h-4v4h-4V28H4V24H0V4h4z" fill="#242b20" />
        <path d="M6 3h36v3h3v19h-3v4H17v3h-2v-7H6v-3H3V6h3z" fill="var(--surface)" />
        <path className="pixel-mascot__heart" d="M15 8h6v3h6V8h6v3h3v6h-3v3h-3v3h-3v3h-6v-3h-3v-3h-3v-3h-3v-6h3z" fill="var(--primary)" />
      </svg>
      <div className="pixel-mascot__body">
        <PixelSprite rows={mascotPixels} palette={bodyPalette} className="pixel-mascot__sprite" />
        <PixelSprite rows={mascotPixels} palette={{ E: "#fffaf0", P: "#242b20" }} className="pixel-mascot__eyes pixel-mascot__eyes--open" />
        <svg className="pixel-mascot__eyes pixel-mascot__eyes--closed" width="32" height="32" viewBox="0 0 32 32">
          <rect x="10" y="16" width="4" height="1" fill="#242b20" />
          <rect x="20" y="16" width="4" height="1" fill="#242b20" />
        </svg>
      </div>
      <svg className="pixel-mascot__spark pixel-mascot__spark--right" viewBox="0 0 16 16" width="16" height="16">
        <path d="M6 0h4v6h6v4h-6v6H6v-6H0V6h6z" fill="var(--grass-mid)" />
      </svg>
      <span className="pixel-mascot__shadow" />
    </div>
  );
}
