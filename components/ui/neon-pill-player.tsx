"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import type { Appearance } from "./appearance";
import { useCreativeTheme, useCreativeMotion, type CreativeTheme } from "./creative-surface";
import { useAudioPlayer, type AudioTrack } from "./use-audio-player";
import { PlayerProgress, PlayerVolume, PlayerEqualizer, PlayerFeedback } from "./creative-player-parts";
import { CreativeIcon } from "./creative-icons";
import { SAMPLE_COVERS } from "./creative-art";

export type NeonPillPlayerProps = {
  tracks: readonly AudioTrack[]; glowColor?: string; expandOn?: "hover" | "click";
  defaultExpanded?: boolean; volume?: number; muted?: boolean; theme?: CreativeTheme;
  appearance?: Appearance; className?: string;
};

export function NeonPillPlayer({ tracks, glowColor = "#ce72ef", expandOn = "hover", defaultExpanded = false, volume = 0.65, muted = false, theme = "auto", appearance = "polished", className }: NeonPillPlayerProps) {
  const player = useAudioPlayer({ tracks, volume, muted }), resolved = useCreativeTheme(theme);
  const [expanded, setExpanded] = useState(defaultExpanded), root = useRef<HTMLDivElement>(null), touch = useRef(false);
  useCreativeMotion(root);
  useEffect(() => {
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setExpanded(false); };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, []);
  return <div ref={root} className={cn("creative-surface neon-pill-player", className)} data-expanded={expanded} data-theme={resolved} data-appearance={appearance} style={{ "--neon-glow": glowColor } as CSSProperties} role="group" aria-label="Neon pill music player"
    onPointerEnter={(event) => { if (expandOn === "hover" && event.pointerType !== "touch") setExpanded(true); }}
    onPointerLeave={() => { if (expandOn === "hover" && !root.current?.contains(document.activeElement)) setExpanded(false); }}
    onFocusCapture={() => { if (expandOn === "hover") setExpanded(true); }}
    onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setExpanded(false); }}
    onKeyDown={(event) => { if (event.key === "Escape") setExpanded(false); }}>
    <button type="button" className="neon-cover-button" aria-label={expanded ? player.playing ? "Pause" : "Play" : "Expand music player"} aria-expanded={expanded} onPointerDown={(event) => { touch.current = event.pointerType === "touch"; }}
      onClick={() => { if (!expanded && (touch.current || expandOn === "click")) setExpanded(true); else player.toggle(); }}>
      <img src={player.track?.cover || SAMPLE_COVERS[2]} alt="" />
      {expanded && <span className="creative-play-morph" data-playing={player.playing}><CreativeIcon name="play" /><CreativeIcon name="pause" /></span>}
    </button>
    <div className="neon-pill-copy" inert={!expanded}>
      <span className="neon-now-playing">NOW PLAYING</span>
      <div className="creative-track-copy"><strong>{player.track?.title || "Your next favourite"}</strong><span>{player.track?.artist || "Add a playlist"}</span></div>
      <PlayerProgress player={player} compact />
      <div className="neon-expanded-actions">
        <CreativeIcon name="music" width="12" height="12" />
        <button type="button" className="creative-icon-button" aria-label="Previous track" onClick={player.previous}><CreativeIcon name="previous" /></button>
        <button type="button" className="creative-icon-button" aria-label="Next track" onClick={player.next}><CreativeIcon name="next" /></button>
      </div>
      <PlayerFeedback player={player} />
    </div>
    <div className="neon-pill-end"><PlayerEqualizer player={player} /><PlayerVolume player={player} showSlider={false} /></div>
  </div>;
}
