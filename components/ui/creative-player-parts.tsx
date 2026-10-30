"use client";

import { useEffect, useRef } from "react";
import { CreativeIcon } from "./creative-icons";
import { audioTime, type AudioPlayer } from "./use-audio-player";
import { createMotionActivity } from "./use-motion-activity";
import "../../styles/creative-players.css";

export function PlayerProgress({ player, compact = false }: { player: AudioPlayer; compact?: boolean }) {
  return <div className={"creative-progress" + (compact ? " creative-progress-compact" : "")}>
    <span>{audioTime(player.currentTime)}</span>
    <input type="range" aria-label="Track progress" min="0" max={player.duration || 1} step="0.1" value={Math.min(player.currentTime, player.duration || 0)} onChange={(event) => player.seek(Number(event.target.value))} disabled={!player.duration} style={{ "--progress": (player.duration ? player.currentTime / player.duration * 100 : 0) + "%" } as React.CSSProperties} />
    <span>{"-" + audioTime(player.duration - player.currentTime)}</span>
  </div>;
}

export function PlayerControls({ player }: { player: AudioPlayer }) {
  return <div className="creative-transport">
    <button type="button" className="creative-icon-button" aria-label="Previous track" onClick={player.previous} disabled={!player.track}><CreativeIcon name="previous" /></button>
    <button type="button" className="creative-icon-button creative-play-button" aria-label={player.playing ? "Pause" : "Play"} onClick={player.toggle} disabled={!player.track} aria-busy={player.loading}><span className="creative-play-morph" data-playing={player.playing}><CreativeIcon name="play" /><CreativeIcon name="pause" /></span></button>
    <button type="button" className="creative-icon-button" aria-label="Next track" onClick={player.next} disabled={!player.track}><CreativeIcon name="next" /></button>
  </div>;
}

export function PlayerVolume({ player, showSlider = true }: { player: AudioPlayer; showSlider?: boolean }) {
  return <div className="creative-volume">
    <button type="button" className="creative-icon-button" aria-label={player.muted ? "Unmute" : "Mute"} aria-pressed={player.muted} onClick={player.toggleMute}><CreativeIcon name={player.muted ? "muted" : "speaker"} /></button>
    {showSlider && <input aria-label="Volume" type="range" min="0" max="1" step="0.01" value={player.volume} onChange={(event) => player.setVolume(Number(event.target.value))} />}
  </div>;
}

export function PlayerEqualizer({ player }: { player: AudioPlayer }) {
  const reference = useRef<HTMLSpanElement>(null);
  const current = useRef(player);
  useEffect(() => { current.current = player; }, [player]);
  useEffect(() => {
    const element = reference.current;
    if (!element) return;
    const bars = [...element.children] as HTMLElement[], bins = new Uint8Array(32);
    const reset = () => bars.forEach((bar, index) => bar.style.setProperty("--bar", String([0.2, 0.45, 0.7, 0.35, 0.2][index])));
    reset();
    const activity = createMotionActivity(element, {
      onFrame: ({ time }) => {
        const analyser = current.current.getAnalyser();
        analyser?.getByteFrequencyData(bins);
        bars.forEach((bar, index) => {
          const height = !current.current.playing ? [0.2, 0.45, 0.7, 0.35, 0.2][index] : analyser ? Math.max(0.15, bins[index * 3 + 2] / 255) : 0.2 + Math.abs(Math.sin(time / 190 + index * 1.8)) * 0.75;
          bar.style.setProperty("--bar", height.toFixed(3));
        });
      },
      onStatus: (status) => { if (status !== "running") reset(); },
    });
    return () => activity.destroy();
  }, []);
  return <span className="creative-equalizer" ref={reference} aria-hidden="true">{[0, 1, 2, 3, 4].map((index) => <i key={index} />)}</span>;
}

export function PlayerFeedback({ player }: { player: AudioPlayer }) {
  if (!player.track) return <p className="creative-player-feedback" role="status">Add a track to start listening.</p>;
  return player.error ? <p className="creative-player-feedback" role="status">{player.error}</p> : null;
}
