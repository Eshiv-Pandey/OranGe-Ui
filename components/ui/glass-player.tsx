"use client";

import { useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import type { Appearance } from "./appearance";
import { useCreativeTheme, useCreativeMotion, clamp, type CreativeTheme, type CreativeSize } from "./creative-surface";
import { useAudioPlayer, type AudioTrack } from "./use-audio-player";
import { PlayerProgress, PlayerControls, PlayerVolume, PlayerFeedback } from "./creative-player-parts";
import { CreativeIcon } from "./creative-icons";
import { SAMPLE_COVERS } from "./creative-art";

export type GlassPlayerProps = {
  tracks: readonly AudioTrack[]; liked?: boolean; onLike?: (liked: boolean) => void;
  onShare?: (track: AudioTrack) => void | Promise<void>; blur?: number; volume?: number; muted?: boolean;
  theme?: CreativeTheme; size?: CreativeSize; appearance?: Appearance; className?: string;
};

export function GlassPlayer({ tracks, liked, onLike, onShare, blur = 26, volume = 0.65, muted = false, theme = "auto", size = 380, appearance = "polished", className }: GlassPlayerProps) {
  const player = useAudioPlayer({ tracks, volume, muted });
  const [localLiked, setLocalLiked] = useState(false), [message, setMessage] = useState("");
  const resolved = useCreativeTheme(theme), root = useRef<HTMLDivElement>(null);
  const isLiked = liked ?? localLiked, cover = player.track?.cover || SAMPLE_COVERS[1];
  useCreativeMotion(root);
  const share = async () => {
    const track = player.track;
    if (!track) return;
    try {
      if (onShare) { await onShare(track); setMessage("Shared."); return; }
      const url = track.href || window.location.href;
      if (navigator.share) { await navigator.share({ title: track.title, text: track.title + " by " + track.artist, url }); setMessage("Shared."); }
      else if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(url); setMessage("Link copied."); }
      else setMessage("Copy this link: " + url);
    } catch (error) { if ((error as DOMException).name !== "AbortError") setMessage("Sharing failed. Try again or copy this page's link."); }
  };
  return <div ref={root} className={cn("creative-surface glass-player-scene", className)} data-theme={resolved} data-appearance={appearance} style={{ "--player-size": typeof size === "number" ? size + "px" : size, "--glass-blur": clamp(blur, 0, 60) + "px" } as CSSProperties}>
    <div className="glass-player-backdrop" style={{ backgroundImage: "url(" + JSON.stringify(cover) + ")" }} aria-hidden="true" />
    <div className="glass-player" role="group" aria-label="Glass music player">
      <img className="glass-player-cover" src={cover} alt={player.track ? "Cover for " + player.track.title : "Original blue cover"} />
      <div className="glass-player-top">
        <div className="glass-artist-pill"><img src={player.track?.avatar || cover} alt="" /><div><strong>{player.track?.artist || "Your artist"}</strong><span>{player.track?.title || "Add a playlist"}</span></div></div>
        <button type="button" className="creative-icon-button" aria-label="Share track" disabled={!player.track} onClick={() => void share()}><CreativeIcon name="share" /></button>
        <button type="button" className="creative-icon-button" aria-label={isLiked ? "Unlike track" : "Like track"} aria-pressed={isLiked} onClick={() => { if (liked === undefined) setLocalLiked(!isLiked); onLike?.(!isLiked); }}><CreativeIcon name="heart" /></button>
      </div>
      <PlayerVolume player={player} showSlider={false} />
      <div className="glass-player-bottom"><PlayerProgress player={player} /><PlayerControls player={player} /><PlayerFeedback player={player} /></div>
    </div>
    {message && <p className="creative-feedback glass-player-message" role="status">{message}</p>}
  </div>;
}
