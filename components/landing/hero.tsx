"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "../ui/button";
import { Icon } from "./icon";
import type { SceneController } from "./orange-scene";

function subscribeMotion(notify: () => void) {
  const query = matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
}

// A matching, original vector composition stays visible during loading and without WebGL.
function StaticScene() {
  return <svg className="hero-static" viewBox="0 0 700 720" aria-hidden="true">
    <defs>
      <radialGradient id="orange-skin" cx="32%" cy="23%" r="80%"><stop stopColor="#ffcc75" /><stop offset=".42" stopColor="#ff9438" /><stop offset=".8" stopColor="#ee5b1b" /><stop offset="1" stopColor="#b94011" /></radialGradient>
      <linearGradient id="leaf-skin" x2=".8" y2="1"><stop stopColor="#c5d777" /><stop offset="1" stopColor="#456139" /></linearGradient>
      <linearGradient id="tile-skin" x2="1" y2="1"><stop stopColor="#c1b2e6" /><stop offset="1" stopColor="#775ba5" /></linearGradient>
      <filter id="soft-shadow"><feGaussianBlur stdDeviation="16" /></filter>
    </defs>
    <ellipse cx="365" cy="585" rx="168" ry="22" fill="#624722" opacity=".15" filter="url(#soft-shadow)" />
    <path d="M498 552C652 512 682 381 631 291 519 352 481 432 498 552Z" fill="url(#leaf-skin)" />
    <path d="M518 592C621 628 700 590 720 522 623 491 563 507 518 592Z" fill="#809954" />
    <path d="M493 572Q558 440 628 331" fill="none" stroke="#e0e2a7" strokeWidth="3" />
    <g transform="translate(355 342) rotate(-9)">
      <ellipse rx="169" ry="161" fill="url(#orange-skin)" />
      <path d="M-4-153Q-12-191 12-209" stroke="#605138" strokeWidth="13" fill="none" strokeLinecap="round" />
      <path d="M0-167Q55-251 119-202 81-143 0-167Z" fill="url(#leaf-skin)" />
      <ellipse cx="-41" cy="8" rx="9" ry="18" fill="#362820" /><ellipse cx="30" cy="8" rx="9" ry="18" fill="#362820" />
      <path d="M-20 44Q-5 63 13 44" fill="none" stroke="#362820" strokeWidth="7" strokeLinecap="round" />
      <ellipse cx="-100" cy="-61" rx="23" ry="48" transform="rotate(32 -100 -61)" fill="#ffe0a3" opacity=".25" />
    </g>
    <g transform="translate(518 154) rotate(15)"><rect x="-47" y="-39" width="116" height="94" rx="24" fill="#655184" /><rect x="-53" y="-48" width="116" height="94" rx="24" fill="url(#tile-skin)" /><path d="m-20-1 17 17 31-35" stroke="#faf5e4" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>
    <g transform="translate(179 525) rotate(-18)"><rect x="-57" y="-30" width="126" height="62" rx="31" fill="#a0ad66" /><rect x="-63" y="-38" width="126" height="62" rx="31" fill="#d5e79d" /><circle cx="27" cy="-7" r="23" fill="#faf7ed" /></g>
    <circle cx="130" cy="210" r="17" fill="#b6c77b" /><circle cx="571" cy="647" r="28" fill="#ef8c48" />
  </svg>;
}

export function Hero() {
  const [paused, setPaused] = useState(false);
  const reduced = useSyncExternalStore(subscribeMotion, () => matchMedia("(prefers-reduced-motion: reduce)").matches, () => true);
  const container = useRef<HTMLDivElement>(null);
  const controller = useRef<SceneController | null>(null);
  const pauseState = useRef(false);

  useEffect(() => {
    pauseState.current = paused;
    controller.current?.setPaused(paused);
  }, [paused]);

  useEffect(() => {
    const host = container.current!;
    let cancelled = false;
    host.dataset.renderer = "static";
    if (reduced) return;
    import("./orange-scene").then(({ createOrangeScene }) => {
      if (cancelled) return;
      try { controller.current = createOrangeScene(host, pauseState.current); }
      catch { host.dataset.renderer = "static"; }
    }).catch(() => { host.dataset.renderer = "static"; });
    return () => { cancelled = true; controller.current?.dispose(); controller.current = null; host.dataset.renderer = "static"; };
  }, [reduced]);

  return <section className="hero" aria-labelledby="hero-title" data-motion={paused || reduced ? "paused" : "playing"}>
    <div className="hero-glow" aria-hidden="true" />
    <div className="hero-inner page-width">
      <div className="hero-heading">
        <p className="eyebrow"><span className="status-dot" />A LITTLE CHARACTER GOES A LONG WAY</p>
        <h1 id="hero-title">Play with pixels.<br /><span>Ship with polish.</span></h1>
        <p className="hero-subtitle">Thoughtful React components with a playful soul. A little unexpected. Ready for whatever you&apos;re building.</p>
        <Button asChild className="hero-cta"><a href="#components">Explore components<Icon name="arrow" /></a></Button>
        <p className="hero-detail">Open source. Accessible. Yours to make.</p>
      </div>
      <div className="hero-art" ref={container} data-renderer="static" aria-hidden="true"><StaticScene /></div>
    </div>
    <div className="hero-bottom page-width"><span>GOOD DESIGN HAS A PLAYFUL SIDE.</span><a href="#components" className="scroll-cue">Scroll to discover<span aria-hidden="true">↓</span></a><Button variant="ghost" className="motion-toggle" aria-label={reduced ? "Reduced motion" : paused ? "Motion paused. Resume motion" : "Pause motion"} aria-pressed={paused || reduced} disabled={reduced} onClick={() => setPaused(!paused)}><Icon name={paused || reduced ? "play" : "pause"} /><span>{reduced ? "Reduced motion" : paused ? "Motion paused" : "Pause motion"}</span></Button></div>
  </section>;
}
