"use client";

import { useState, type CSSProperties } from "react";
import type { AppearanceProps } from "./appearance";
import { useCreativeTheme, type CreativeTheme } from "./creative-surface";
import { useAudioPlayer, type AudioTrack } from "./use-audio-player";
import { PlayerFeedback } from "./creative-player-parts";
import { CreativeIcon } from "./creative-icons";
import { KEEPSAKE_PHOTOS } from "./keepsake-photos";
import "../../styles/reference-players.css";

export type WavePlayerProps = AppearanceProps & { tracks: readonly AudioTrack[]; volume?: number; muted?: boolean; liked?: boolean; onLikeChange?: (liked: boolean) => void; size?: number | string; theme?: CreativeTheme };
export function WavePlayer({ tracks, volume = .65, muted = false, liked, onLikeChange, size = 680, theme = "auto", appearance = "polished", className }: WavePlayerProps) {
  const player = useAudioPlayer({ tracks, volume, muted }), resolved = useCreativeTheme(theme), [localLiked, setLiked] = useState(false), [output, setOutput] = useState("");
  const saved = liked ?? localLiked, progress = player.duration ? player.currentTime / player.duration : 0;
  const wave = "M0 15" + Array.from({ length: 14 }, (_, index) => `q10 ${index % 2 ? -12 : 12} 20 0`).join("");
  return <div className={["creative-surface wave-player", className].filter(Boolean).join(" ")} data-theme={resolved} data-appearance={appearance} role="group" aria-label="Wave music player" style={{ "--wave-size": typeof size === "number" ? `${size}px` : size } as CSSProperties}>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img className="wave-cover" src={player.track?.cover ?? KEEPSAKE_PHOTOS[6].src} alt="" />
    <div className="wave-content">
      <div className="wave-top"><CreativeIcon name="music" /><button className="wave-device" type="button" onClick={async () => setOutput(await player.selectOutput())} aria-label="Choose audio output for This device"><CreativeIcon name="output" /><span>This device</span></button></div>
      <div className="wave-main"><div><strong>{player.track?.title ?? "Your next favourite"}</strong><span>{player.track?.artist ?? "Add a playlist"}</span></div><button className="wave-play" type="button" aria-label={player.playing ? "Pause" : "Play"} disabled={!player.track} aria-busy={player.loading} onClick={player.toggle}><CreativeIcon name={player.playing ? "pause" : "play"} /></button></div>
      <div className="wave-bottom">
        <button className="creative-icon-button" type="button" aria-label="Previous track" disabled={!player.track} onClick={player.previous}><CreativeIcon name="previous" /></button>
        <div className="wave-progress"><svg viewBox="0 0 280 30" preserveAspectRatio="none" aria-hidden="true"><path d="M0 15H280" className="wave-rest" style={{ clipPath: `inset(0 0 0 ${progress * 100}%)` }} /><path d={wave} style={{ clipPath: `inset(0 ${100 - progress * 100}% 0 0)` }} /></svg><input type="range" aria-label="Track progress" min={0} max={player.duration || 1} step={.1} value={Math.min(player.currentTime, player.duration || 0)} disabled={!player.duration} onChange={(event) => player.seek(Number(event.target.value))} /></div>
        <button className="creative-icon-button" type="button" aria-label="Next track" disabled={!player.track} onClick={player.next}><CreativeIcon name="next" /></button>
        <button className="creative-icon-button wave-save" type="button" aria-label={saved ? "Remove from favourites" : "Add to favourites"} aria-pressed={saved} onClick={() => { setLiked(!saved); onLikeChange?.(!saved); }}><CreativeIcon name={saved ? "heart" : "plus"} /></button>
        <button className="creative-icon-button" type="button" aria-label={player.muted ? "Unmute" : "Mute"} aria-pressed={player.muted} onClick={player.toggleMute}><CreativeIcon name={player.muted ? "muted" : "speaker"} /></button>
      </div>
      {output && <p className="creative-player-feedback" role="status">{output}</p>}<PlayerFeedback player={player} />
    </div>
  </div>;
}
