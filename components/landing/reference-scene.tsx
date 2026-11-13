"use client";

import { useEffect, useRef } from "react";
import { REFERENCE_SCENE_CONFIG } from "./reference-scene-config";
import { createReferenceRenderer } from "./reference-renderer";

/** The photographic fallback is present in server HTML and is never removed. */
export function ReferenceScene() {
  const canvas = useRef<HTMLCanvasElement>(null), host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!canvas.current) return;
    const renderer = createReferenceRenderer(canvas.current, REFERENCE_SCENE_CONFIG, (state) => { if (host.current) host.current.dataset.renderer = state; });
    return () => renderer.destroy();
  }, []);
  return (
    <div ref={host} className="reference-background" data-renderer="fallback" aria-hidden="true">
      <div className="reference-static" />
      <canvas ref={canvas} className="reference-canvas" />
      <div className="reference-shade" />
    </div>
  );
}
