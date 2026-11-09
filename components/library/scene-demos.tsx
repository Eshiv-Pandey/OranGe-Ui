"use client";

import { useState } from "react";
import type { Appearance } from "../ui/appearance";
import { NeonSign404, NeonNotFound } from "../ui/neon-sign-404";
import { ChaiBreak404 } from "../ui/chai-break-404";
import { PavilionFooter } from "../ui/pavilion-footer";
import "../../styles/scene-demos.css";

export function SceneDemo({ slug, appearance, thumbnail = false }: { slug: string; appearance: Appearance; thumbnail?: boolean }) {
  const [pixel, setPixel] = useState(appearance === "pixel"), [layout, setLayout] = useState(false), [flicker, setFlicker] = useState(true);
  if (slug === "neon-sign-404") {
    if (thumbnail) return <div className="scene-neon-thumbnail"><NeonSign404 size={125} flicker={false} pixelated={pixel} /></div>;
    return <div className="scene-demo"><div className="scene-demo-controls"><label><input type="checkbox" checked={pixel} onChange={event => setPixel(event.target.checked)} /> Pixel tubes</label><label><input type="checkbox" checked={flicker} onChange={event => setFlicker(event.target.checked)} /> Flicker</label><label><input type="checkbox" checked={layout} onChange={event => setLayout(event.target.checked)} /> Full 404 layout</label></div>{layout ? <NeonNotFound pixelated={pixel} flicker={flicker} size={190} /> : <div className="scene-neon-sizes"><figure><NeonSign404 size={140} pixelated={pixel} flicker={flicker} /><figcaption>Small · 140 px</figcaption></figure><figure><NeonSign404 size={190} pixelated={pixel} flicker={flicker} /><figcaption>Medium · 190 px</figcaption></figure><figure><NeonSign404 digits="OPEN" size={230} color="#ff65ad" borderColor="#58bcff" glow={.65} pixelated={pixel} flicker={flicker} /><figcaption>Large · OPEN · custom colors</figcaption></figure></div>}</div>;
  }
  if (slug === "chai-break-404") return <div className="scene-demo"><ChaiBreak404 speed={1} grain={.035} interactive={!thumbnail} className={thumbnail ? "scene-chai-thumbnail" : "scene-chai-preview"} /></div>;
  return <div className="scene-demo">{!thumbnail && <div className="scene-demo-controls"><label><input type="checkbox" checked={pixel} onChange={event => setPixel(event.target.checked)} /> Pixel pavilion</label></div>}<PavilionFooter pixelated={pixel} interactive={!thumbnail} className={thumbnail ? "scene-pavilion-thumbnail" : undefined} /></div>;
}
