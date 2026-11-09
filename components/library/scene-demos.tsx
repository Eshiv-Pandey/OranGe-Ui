"use client";

import { useState } from "react";
import type { Appearance } from "../ui/appearance";
import { WorkbenchInspector } from "../ui/workbench-inspector";
import { ShaderCheck } from "./shader-demo-controls";
import { NeonSign404, NeonNotFound } from "../ui/neon-sign-404";
import { ChaiBreak404 } from "../ui/chai-break-404";
import { PavilionFooter } from "../ui/pavilion-footer";
import "../../styles/scene-demos.css";

export function SceneDemo({ slug, appearance, thumbnail = false }: { slug: string; appearance: Appearance; thumbnail?: boolean }) {
  const [pixelArt, setPixelArt] = useState(false);
  const pixel = pixelArt || appearance === "pixel";
  const pixelControl = (label: string) => <WorkbenchInspector><div className="creative-controls"><ShaderCheck label={label} value={pixel} onChange={setPixelArt} /></div></WorkbenchInspector>;
  if (slug === "neon-sign-404") {
    if (thumbnail) return <div className="scene-neon-thumbnail"><NeonSign404 size={125} flicker={false} pixelated={pixel} /></div>;
    return <div className="scene-demo scene-neon-demo"><NeonNotFound pixelated={pixel} size={340} />{pixelControl("Pixel tubes")}</div>;
  }
  if (slug === "chai-break-404") return <div className="scene-demo"><ChaiBreak404 speed={1} grain={.035} interactive={!thumbnail} className={thumbnail ? "scene-chai-thumbnail" : "scene-chai-preview"} /></div>;
  return <div className="scene-demo"><PavilionFooter pixelated={pixel} interactive={!thumbnail} className={thumbnail ? "scene-pavilion-thumbnail" : undefined} />{!thumbnail && pixelControl("Pixel pavilion")}</div>;
}
