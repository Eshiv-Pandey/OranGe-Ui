"use client";

import { useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import type { Appearance } from "./appearance";
import { useCreativeTheme, useCreativeMotion, type CreativeTheme, type CreativeSize } from "./creative-surface";
import { useAudioPlayer, type AudioTrack } from "./use-audio-player";
import { PlayerProgress, PlayerControls, PlayerVolume, PlayerEqualizer, PlayerFeedback } from "./creative-player-parts";
import { CreativeIcon } from "./creative-icons";
import { SAMPLE_COVERS } from "./creative-art";

export type IslandPlayerProps = {
  tracks: readonly AudioTrack[]; index?: number; onTrackChange?: (index: number) => void;
  showOutputIcon?: boolean; volume?: number; muted?: boolean; size?: CreativeSize;
  theme?: CreativeTheme; appearance?: Appearance; className?: string;
};

export function IslandPlayer({ tracks, index, onTrackChange, showOutputIcon = true, volume = 0.65, muted = false, size = 360, theme = "auto", appearance = "polished", className }: IslandPlayerProps) {
  const player = useAudioPlayer({ tracks, index, onTrackChange, volume, muted });
  const resolved = useCreativeTheme(theme), root = useRef<HTMLDivElement>(null);
  const [output, setOutput] = useState("");
  useCreativeMotion(root);
  return <div ref={root} className={cn("creative-surface island-player", className)} data-theme={resolved} data-appearance={appearance} style={{ "--player-size": typeof size === "number" ? size + "px" : size } as CSSProperties} role="group" aria-label="Island music player">
    <div className="island-player-top">
      <img className="island-player-cover" src={player.track?.cover || SAMPLE_COVERS[0]} alt={player.track ? "Cover for " + player.track.title : "Original landscape cover"} />
      <div className="creative-track-copy"><strong>{player.track?.title || "Your next favourite"}</strong><span>{player.track?.artist || "Add a playlist"}</span></div>
      <PlayerEqualizer player={player} />
    </div>
    <PlayerProgress player={player} />
    <div className="island-player-bottom">
      <PlayerVolume player={player} showSlider={false} />
      <PlayerControls player={player} />
      {showOutputIcon && <button type="button" className="creative-icon-button island-player-output" aria-label="Choose audio output" onClick={async () => setOutput(await player.selectOutput())}><CreativeIcon name="output" /></button>}
    </div>
    {output && <p className="creative-player-feedback" role="status">{output}</p>}
    <PlayerFeedback player={player} />
  </div>;
}
