"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { REFERENCE_SCENE_CONFIG } from "./reference-scene-config";
import { createReferenceRenderer } from "./reference-renderer";

function subscribeMotion(notify: () => void) {
  const media = matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", notify); return () => media.removeEventListener("change", notify);
}

/** The photographic fallback is present in server HTML and is never removed. */
export function ReferenceScene() {
  const canvas = useRef<HTMLCanvasElement>(null), host = useRef<HTMLDivElement>(null);
  const controller = useRef<ReturnType<typeof createReferenceRenderer> | null>(null);
  const [paused, setPaused] = useState(false);
  const reduced = useSyncExternalStore(subscribeMotion, () => matchMedia("(prefers-reduced-motion: reduce)").matches, () => true);
  useEffect(() => {
    if (!canvas.current) return;
    controller.current = createReferenceRenderer(canvas.current, REFERENCE_SCENE_CONFIG, (state) => { if (host.current) host.current.dataset.renderer = state; });
    return () => { controller.current?.destroy(); controller.current = null; };
  }, []);
  useEffect(() => { controller.current?.setPaused(paused); }, [paused]);
  return <>
    <div ref={host} className="reference-background" data-renderer="fallback" aria-hidden="true">
      <div className="reference-static" />
      <canvas ref={canvas} className="reference-canvas" />
      <div className="reference-shade" />
    </div>
    <aside className="reference-motion" aria-label="Scene motion"><button type="button" className="reference-motion-toggle" aria-label={reduced ? "Still scene: reduced motion enabled" : paused ? "Play scene: resume motion" : "Pause scene motion"} aria-pressed={paused || reduced} disabled={reduced} onClick={() => setPaused(!paused)}>
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">{paused || reduced ? <path d="m7 4 8 6-8 6Z" /> : <path d="M7 4v12M13 4v12" />}</svg>
      <span>{reduced ? "Still scene" : paused ? "Play scene" : "Pause scene"}</span>
    </button></aside>
  </>;
}
