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
    {showSlider && <input aria-label="Volume" type="range" min="0" max="1" step="0.01" value={player.volume} style={{ "--volume": player.volume * 100 + "%" } as React.CSSProperties} onChange={(event) => player.setVolume(Number(event.target.value))} />}
  </div>;
}

export function PlayerEqualizer({ player }: { player: AudioPlayer }) {
  const reference = useRef<HTMLSpanElement>(null);
  const current = useRef(player);
  useEffect(() => { current.current = player; }, [player]);
  useEffect(() => {
    const element = reference.current;
    if (!element) return;
    const bars = [...element.children] as HTMLElement[];
    const rest = [0.24, 0.48, 0.76, 0.48, 0.24], levels = [...rest];
    let bins = new Uint8Array(0);
    const reset = () => bars.forEach((bar, index) => { levels[index] = rest[index]; bar.style.setProperty("--bar", String(rest[index])); });
    reset();
    const activity = createMotionActivity(element, {
      onFrame: ({ time, delta }) => {
        const state = current.current, analyser = state.getAnalyser();
        const audible = state.playing && !state.loading && !state.muted && state.volume > 0;
        if (analyser && audible) {
          if (bins.length !== analyser.frequencyBinCount) bins = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(bins);
        }
        // Bass, low mids, voice, presence and treble. Average energy, not a
        // handful of arbitrary bins far above the notes in the sample tracks.
        const bands = [45, 180, 520, 1500, 4200, 12000];
        bars.forEach((bar, index) => {
          let height = rest[index];
          if (audible && analyser) {
            const hzPerBin = analyser.context.sampleRate / analyser.fftSize;
            const first = Math.max(1, Math.floor(bands[index] / hzPerBin));
            const last = Math.min(bins.length, Math.max(first + 1, Math.ceil(bands[index + 1] / hzPerBin)));
            let energy = 0, peak = 0;
            for (let bin = first; bin < last; bin++) { const value = bins[bin] / 255; energy += value * value; peak = Math.max(peak, value); }
            height = 0.08 + Math.min(0.92, (Math.sqrt(energy / Math.max(1, last - first)) * 0.65 + peak * 0.35) ** 1.5 * 1.25);
          } else if (audible) {
            // Remote audio without CORS cannot enter Web Audio. Its documented
            // playback indicator still follows play, pause, buffering and mute.
            height = 0.16 + Math.abs(Math.sin(time / (130 + index * 27) + index * 1.8)) * 0.8;
          }
          const response = 1 - Math.exp(-delta / (height > levels[index] ? 38 : 110));
          levels[index] += (height - levels[index]) * response;
          bar.style.setProperty("--bar", levels[index].toFixed(3));
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
