"use client";

import { useRef, useState, type CSSProperties } from "react";
import type { AppearanceProps } from "./appearance";
import { useCreativeTheme, useCreativeMotion, type CreativeTheme } from "./creative-surface";
import { useAudioPlayer, audioTime, type AudioTrack } from "./use-audio-player";
import { PlayerEqualizer, PlayerControls, PlayerFeedback } from "./creative-player-parts";
import { KEEPSAKE_PHOTOS } from "./keepsake-photos";
import "../../styles/reference-players.css";

export type VinylPlayerProps = AppearanceProps & { tracks: readonly AudioTrack[]; volume?: number; muted?: boolean; size?: number | string; theme?: CreativeTheme };
export function VinylPlayer({ tracks, volume = .65, muted = false, size = 360, theme = "auto", appearance = "polished", className }: VinylPlayerProps) {
  const player = useAudioPlayer({ tracks, volume, muted }), resolved = useCreativeTheme(theme), root = useRef<HTMLDivElement>(null), [expanded, setExpanded] = useState(false);
  useCreativeMotion(root);
  return <div ref={root} className={["creative-surface vinyl-player", className].filter(Boolean).join(" ")} data-theme={resolved} data-appearance={appearance} data-playing={player.playing} data-cover-expanded={expanded} role="group" aria-label="Vinyl music player" style={{ "--vinyl-size": typeof size === "number" ? `${size}px` : size } as CSSProperties}>
    <button className="vinyl-record" type="button" aria-label={expanded ? "Collapse album artwork" : "Expand album artwork"} aria-pressed={expanded} onClick={() => setExpanded(!expanded)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={player.track?.cover ?? KEEPSAKE_PHOTOS[4].src} alt="" draggable="false" />
      <span className="vinyl-grooves" aria-hidden="true" /><span className="vinyl-spindle" aria-hidden="true" />
    </button>
    <div className="vinyl-copy"><PlayerEqualizer player={player} /><span className="vinyl-artist">{player.track?.artist ?? "Add a playlist"}</span><strong>{player.track?.title ?? "A record for today"}</strong>
      <input className="vinyl-progress" type="range" aria-label="Track progress" min={0} max={player.duration || 1} step={.1} value={Math.min(player.currentTime, player.duration || 0)} disabled={!player.duration} onChange={(event) => player.seek(Number(event.target.value))} style={{ "--progress": `${player.duration ? player.currentTime / player.duration * 100 : 0}%` } as CSSProperties} />
      <div className="vinyl-time"><span>{audioTime(player.currentTime)}</span><span> / {audioTime(player.duration)}</span></div>
      <PlayerControls player={player} /><PlayerFeedback player={player} />
    </div>
  </div>;
}
