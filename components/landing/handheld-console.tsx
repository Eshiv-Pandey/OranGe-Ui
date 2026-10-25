"use client";

import { useState } from "react";
import { PixelIcon } from "./pixel-icon";

export function HandheldConsole() {
  const [message, setMessage] = useState("More components loading...");
  const [playing, setPlaying] = useState(false);
  const reactions = { Up: "Good things are growing.", Left: "A little nostalgia. A lot of care.", Right: "One pixel closer.", Down: "More components loading..." };

  return <div className="handheld" aria-label="Interactive handheld console">
    <div className="handheld-top"><span>ORANGE / POCKET EDITION</span><span className="handheld-dot" /></div>
    <div className="handheld-screen">
      <div className="screen-status"><span>LEVEL 01</span><span className="battery" role="img" aria-label="Full battery"><i /><i /><i /></span></div>
      <p className="console-title pixel-type">Coming <br />soon</p>
      <p role="status" className="console-message">{message}</p>
      <div className={`loading-pixels${playing ? " loading-pixels--playing" : ""}`} aria-hidden="true">{Array.from({ length: 12 }, (_, i) => <span key={i} />)}</div>
    </div>
    <div className="handheld-controls">
      <button className="console-play" aria-label="Play console demo" aria-pressed={playing} onClick={() => { setPlaying(!playing); setMessage(playing ? "More components loading..." : "A new adventure is loading."); }}><span className="pixel-type">PLAY</span></button>
      <div className="console-buttons">{(Object.keys(reactions) as (keyof typeof reactions)[]).map((direction) => <button key={direction} className={`console-button console-button--${direction.toLowerCase()}`} aria-label={`Console ${direction.toLowerCase()}`} onClick={() => setMessage(reactions[direction])}>{direction.toUpperCase()}</button>)}</div>
    </div>
    <div className="handheld-bottom"><span className="pixel-type">oRangeUi</span><div className="speaker" aria-hidden="true"><i /><i /><i /><i /></div><PixelIcon name="heart" /></div>
  </div>;
}
