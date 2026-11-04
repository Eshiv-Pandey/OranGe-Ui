"use client";

import { useRef, type CSSProperties } from "react";
import { ShaderCanvas } from "./shader-canvas";
import { audioOrb } from "./shader-canvas/audio-orb";
import { clamp, useCreativeTheme, type CreativeTheme } from "./creative-surface";
import type { AppearanceProps } from "./appearance";
import "../../styles/audio-orb.css";

export type AudioOrbProps = AppearanceProps & {
  colors?: readonly string[]; size?: number | string; speed?: number; paused?: boolean;
  audioLevel?: number; getAnalyser?: () => AnalyserNode | null; audioActive?: boolean;
  theme?: CreativeTheme; label?: string;
};
const MODULES = [audioOrb];
const COLORS = ["#7dc8bc", "#387aab", "#cb9bf1", "#efbf7e"];

/** Soft pigment in motion. Audio changes its contour and flow, without React frame updates. */
export function AudioOrb({ colors = COLORS, size = 320, speed = .6, paused = false, audioLevel = 0, getAnalyser, audioActive = true, theme = "auto", label = "Animated audio-reactive gradient orb", appearance = "polished", className }: AudioOrbProps) {
  const bins = useRef(new Uint8Array(0)), energy = useRef(0), resolved = useCreativeTheme(theme);
  const level = () => {
    const analyser = audioActive ? getAnalyser?.() : null;
    let next = audioActive ? clamp(audioLevel, 0, 1) : 0;
    if (analyser) {
      if (bins.current.length !== analyser.frequencyBinCount) bins.current = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(bins.current);
      const end = Math.max(2, Math.min(bins.current.length, Math.ceil(2400 / (analyser.context.sampleRate / analyser.fftSize))));
      let sum = 0;
      for (let index = 1; index < end; index++) sum += (bins.current[index] / 255) ** 2;
      next = Math.min(1, Math.sqrt(sum / (end - 1)) * 1.8);
    }
    energy.current += (next - energy.current) * (next > energy.current ? .3 : .12);
    return energy.current;
  };
  return <div className={["creative-surface audio-orb", className].filter(Boolean).join(" ")} data-theme={resolved} data-appearance={appearance} data-audio-active={audioActive} style={{ width: typeof size === "number" ? clamp(size, 64, 720) : size, "--orb-one": colors[0] ?? COLORS[0], "--orb-two": colors[1] ?? COLORS[1], "--orb-three": colors[2] ?? COLORS[2] } as CSSProperties}>
    <span className="audio-orb-aura" aria-hidden="true" />
    <ShaderCanvas modules={MODULES} source={{ type: "audio-orb", colors, speed, audioLevel: level }} paused={paused} label={label} theme={resolved} appearance={appearance} />
  </div>;
}
