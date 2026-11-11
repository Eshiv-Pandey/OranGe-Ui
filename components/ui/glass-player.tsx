"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import type { Appearance } from "./appearance";
import { useCreativeTheme, useCreativeMotion, clamp, type CreativeTheme, type CreativeSize } from "./creative-surface";
import { useAudioPlayer, type AudioTrack } from "./use-audio-player";
import { PlayerProgress, PlayerControls, PlayerVolume, PlayerFeedback } from "./creative-player-parts";
import { CreativeIcon } from "./creative-icons";
import { SAMPLE_COVERS } from "./creative-art";

export type GlassPlayerProps = {
  tracks: readonly AudioTrack[]; liked?: boolean; onLike?: (liked: boolean) => void;
  onShare?: (track: AudioTrack) => void | Promise<void>; infoOpacity?: number; volume?: number; muted?: boolean;
  /** @deprecated The outer blurred backdrop has been removed. */
  blur?: number;
  theme?: CreativeTheme; size?: CreativeSize; appearance?: Appearance; className?: string;
};

export function GlassPlayer({ tracks, liked, onLike, onShare, infoOpacity = 0.42, volume = 0.65, muted = false, theme = "auto", size = 380, appearance = "polished", className }: GlassPlayerProps) {
  const player = useAudioPlayer({ tracks, volume, muted });
  const [localLiked, setLocalLiked] = useState(false), [message, setMessage] = useState(""), [burst, setBurst] = useState(0);
  const burstSequence = useRef(0);
  const resolved = useCreativeTheme(theme), root = useRef<HTMLDivElement>(null);
  const isLiked = liked ?? localLiked, cover = player.track?.cover || SAMPLE_COVERS[1];
  useCreativeMotion(root);
  useEffect(() => {
    if (!burst) return;
    const timer = window.setTimeout(() => setBurst(0), 760);
    return () => window.clearTimeout(timer);
  }, [burst]);
  const like = () => {
    if (liked === undefined) setLocalLiked(!isLiked);
    onLike?.(!isLiked);
    setBurst(isLiked ? 0 : ++burstSequence.current);
  };
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
  return <div ref={root} className={cn("creative-surface glass-player-scene", className)} data-theme={resolved} data-appearance={appearance} style={{ "--player-size": typeof size === "number" ? size + "px" : size, "--glass-info-opacity": clamp(infoOpacity, 0, 1) } as CSSProperties}>
    <div className="glass-player" role="group" aria-label="Glass music player">
      <img className="glass-player-cover" src={cover} alt={player.track ? "Cover for " + player.track.title : "Original blue cover"} />
      <div className="glass-player-top">
        <button type="button" className="creative-icon-button" aria-label="Share track" disabled={!player.track} onClick={() => void share()}><CreativeIcon name="share" /></button>
        <button type="button" className="creative-icon-button glass-like-button" aria-label={isLiked ? "Unlike track" : "Like track"} disabled={!player.track} aria-pressed={isLiked} onClick={like}>
          <CreativeIcon className="glass-like-icon" name="heart" />
          {burst > 0 && <span key={burst} className="glass-heart-burst" aria-hidden="true"><i className="glass-heart-ring" />{[[-29,-24,-25],[-12,-37,12],[15,-35,24],[34,-15,38],[31,17,65],[8,31,-16],[-23,25,-38],[-36,0,-60]].map(([x,y,angle], index) => <span className="glass-heart-particle" key={index} style={{ "--splash-x": x + "px", "--splash-y": y + "px", "--splash-turn": angle + "deg", "--splash-delay": index % 3 * 18 + "ms" } as CSSProperties}>{index % 2 ? <i /> : <CreativeIcon name="heart" />}</span>)}</span>}
        </button>
      </div>
      <div className="glass-player-bottom">
        <div className="glass-player-track"><div className="creative-track-copy"><strong>{player.track?.title || "Your next favourite"}</strong><span>{player.track?.artist || "Add a playlist"}</span></div><PlayerVolume player={player} showSlider={false} /></div>
        <PlayerProgress player={player} /><PlayerControls player={player} /><PlayerFeedback player={player} />
      </div>
    </div>
    {message && <p className="creative-feedback glass-player-message" role="status">{message}</p>}
  </div>;
}
