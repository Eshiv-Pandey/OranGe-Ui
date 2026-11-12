import { ArrowUpRight } from "lucide-react";
import type { CSSProperties } from "react";
import type { BlockAction } from "./shared";

export function SectionLink({ action, className = "" }: { action: BlockAction; className?: string }) {
  return <a className={`sb-link ${className}`} href={action.href}>{action.label}<ArrowUpRight aria-hidden="true" /></a>;
}

export function SectionArt({ kind, className = "" }: { kind: "sprout" | "fold" | "pebble" | "spark" | "smile" | "sun" | "eye"; className?: string }) {
  const images = { sprout: "/art/footer/playful-colony-sprout.webp", fold: "/art/footer/playful-colony-fold.webp", pebble: "/art/footer/playful-colony-pebble.webp", spark: "/art/footer/playful-sticker-spark.webp", smile: "/art/footer/playful-sticker-smile.webp", sun: "/art/footer/playful-sticker-sun.webp", eye: "/art/footer/playful-sticker-eye.webp" };
  // eslint-disable-next-line @next/next/no-img-element -- Portable original illustration, no image service required.
  return <img src={images[kind]} alt="" className={`sb-art ${className}`} loading="lazy" decoding="async" />;
}

/** Exact radial geometry, kept native and editable rather than a stock illustration. */
export function SectionRosette({ className = "" }: { className?: string }) {
  return <div className={`sb-rosette ${className}`} aria-hidden="true">{Array.from({ length: 10 }, (_, index) => <i key={index} style={{ "--petal": index } as CSSProperties} />)}<span /></div>;
}

export function SectionPhone({ brand = "Current", className = "" }: { brand?: string; className?: string }) {
  return <div className={`sb-phone ${className}`} aria-hidden="true"><div className="sb-phone-camera" /><span>9:41</span><strong>{brand}</strong><div className="sb-phone-orbit"><i /><i /><i /></div><div className="sb-phone-bottom"><b>Make your move.</b><span>Explore the collection</span><ArrowUpRight /></div></div>;
}
