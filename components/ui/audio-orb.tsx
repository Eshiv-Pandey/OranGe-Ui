"use client";

import { useRef, useState, type CSSProperties } from "react";
import { useAudioInput } from "./use-audio-input";
import { useAudioPlayer, type AudioTrack } from "./use-audio-player";
import { CreativeIcon } from "./creative-icons";
import { ShaderCanvas } from "./shader-canvas";
import { audioOrb } from "./shader-canvas/audio-orb";
import { clamp, useCreativeTheme, type CreativeTheme } from "./creative-surface";
import type { AppearanceProps } from "./appearance";
import "../../styles/audio-orb.css";

export type AudioOrbProps = AppearanceProps & {
  colors?: readonly string[]; size?: number | string; speed?: number; paused?: boolean;
  audioLevel?: number; getAnalyser?: () => AnalyserNode | null; audioActive?: boolean;
  theme?: CreativeTheme; label?: string;
  tracks?: readonly AudioTrack[]; showControls?: boolean; sensitivity?: number;
};
const MODULES = [audioOrb];
const COLORS = ["#13f4da", "#1d8bff", "#ef41ff", "#ffe866"];

/** Crystal reflections respond to playback or gesture-enabled local microphone analysis. */
export function AudioOrb({ colors = COLORS, size = 320, speed = .6, paused = false, audioLevel = 0, getAnalyser, audioActive = true, theme = "auto", label = "Animated audio-reactive gradient orb", appearance = "polished", className, tracks, sensitivity = 1.6, showControls = Boolean(tracks?.length) }: AudioOrbProps) {
  const player = useAudioPlayer({ tracks: tracks ?? [] }), microphone = useAudioInput();
  const [mode, setMode] = useState<"play" | "listen">("play");
  const active = showControls ? mode === "listen" ? microphone.listening : player.playing && !player.loading && !player.muted && player.volume > 0 : audioActive;
  const analyserSource = showControls ? mode === "listen" ? microphone.getAnalyser : player.getAnalyser : getAnalyser;
  const bins = useRef(new Uint8Array(0)), energy = useRef(0), visualRef = useRef<HTMLDivElement>(null), resolved = useCreativeTheme(theme);
  const level = () => {
    const analyser = active ? analyserSource?.() : null;
    let next = active ? clamp(audioLevel, 0, 1) : 0;
    if (analyser) {
      if (bins.current.length !== analyser.frequencyBinCount) bins.current = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(bins.current);
      const end = Math.max(2, Math.min(bins.current.length, Math.ceil(5000 / (analyser.context.sampleRate / analyser.fftSize))));
      let sum = 0;
      for (let index = 1; index < end; index++) sum += (bins.current[index] / 255) ** 2;
      next = Math.sqrt(sum / (end - 1)) * 2.6;
    }
    next = Math.pow(clamp(next * clamp(sensitivity, .25, 4), 0, 1), .75);
    energy.current += (next - energy.current) * (next > energy.current ? .55 : .15);
    visualRef.current?.style.setProperty("--orb-energy", energy.current.toFixed(4));
    return energy.current;
  };
  const visual = <div ref={visualRef} className={["creative-surface audio-orb", className].filter(Boolean).join(" ")} data-theme={resolved} data-appearance={appearance} data-audio-active={active} style={{ width: typeof size === "number" ? clamp(size, 64, 720) : size, "--orb-one": colors[0] ?? COLORS[0], "--orb-two": colors[1] ?? COLORS[1], "--orb-three": colors[2] ?? COLORS[2] } as CSSProperties}>
    <span className="audio-orb-aura" aria-hidden="true" />
    <ShaderCanvas modules={MODULES} source={{ type: "audio-orb", colors, speed, audioLevel: level }} paused={paused} label={label} theme={resolved} appearance={appearance} />
  </div>;
  if (!showControls) return visual;
  return <div className="audio-orb-widget" data-mode={mode}>{visual}<div className="audio-orb-actions">
    <button type="button" aria-pressed={mode === "play" && player.playing} onClick={() => { microphone.stop(); setMode("play"); player.toggle(); }} disabled={!player.track}><CreativeIcon name={player.playing ? "pause" : "play"} />{player.playing ? "Pause music" : "Play music"}</button>
    <button type="button" aria-pressed={microphone.listening} aria-busy={microphone.pending} onClick={() => { player.pause(); setMode("listen"); if (microphone.listening) microphone.stop(); else void microphone.start(); }}> {microphone.pending ? "Starting microphone" : microphone.listening ? "Stop listening" : "Listen"}</button>
  </div><p className="audio-orb-status" role="status">{(mode === "listen" ? microphone.error : player.error) || (mode === "listen" ? microphone.listening ? "Listening to this microphone" : "Microphone is off" : player.playing ? player.track?.title : "Choose Play music or Listen")}</p></div>;
}
