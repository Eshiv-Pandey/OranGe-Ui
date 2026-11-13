"use client";

import { useState, type CSSProperties } from "react";

export function KineticImage({ src, alt, className, style }: { src: string; alt: string; className?: string; style?: CSSProperties }) {
  const [failed, setFailed] = useState<string>();
  return failed === src ? <span className={`kinetic-image-fallback ${className ?? ""}`} style={style} role="img" aria-label={alt || "Image unavailable"}>Image unavailable</span> :
    /* eslint-disable-next-line @next/next/no-img-element */
    <img src={src} alt={alt} className={className} style={style} draggable={false} decoding="async" onError={() => setFailed(src)} />;
}

export function KineticArrow({ direction = "right" }: { direction?: "left" | "right" | "up" | "down" }) {
  const angle = { right: 0, down: 90, left: 180, up: -90 }[direction];
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ transform: `rotate(${angle}deg)` }}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
}
