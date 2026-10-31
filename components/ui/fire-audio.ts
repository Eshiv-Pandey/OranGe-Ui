"use client";

import { acquireCreativeAudio } from "./creative-audio";
import { clamp } from "./creative-surface";

/** An original fire bed: soft turbulent air, low combustion and irregular wood crackles. */
export function createFireAudio() {
  let lease: ReturnType<typeof acquireCreativeAudio> = null;
  let source: AudioBufferSourceNode | null = null, gain: GainNode | null = null, buffer: AudioBuffer | null = null;
  let destroyed = false, requestedVolume: number | null = null;
  const unlock = () => { if (!destroyed) lease ??= acquireCreativeAudio(); };
  const stop = () => {
    requestedVolume = null;
    if (!source) return;
    const ending = source, output = gain, context = lease?.context;
    source = null; gain = null;
    if (context && output) {
      output.gain.cancelScheduledValues(context.currentTime);
      output.gain.setTargetAtTime(0, context.currentTime, 0.025);
      ending.onended = () => { ending.disconnect(); output.disconnect(); };
      try { ending.stop(context.currentTime + 0.12); } catch {}
    } else { try { ending.stop(); } catch {} ending.disconnect(); output?.disconnect(); }
  };
  const session = {
    unlock,
    start(volume: number): void {
      const context = lease?.context;
      if (destroyed || !context) return;
      requestedVolume = volume;
      if (context.state !== "running") {
        void context.resume().then(() => { if (!destroyed && requestedVolume !== null && context.state === "running") session.start(requestedVolume); }).catch(() => {});
        return;
      }
      if (gain) { gain.gain.setTargetAtTime(clamp(volume, 0, 1) * 0.7, context.currentTime, 0.08); return; }
      if (!buffer) {
        const seconds = 17, length = Math.round(context.sampleRate * seconds);
        buffer = context.createBuffer(2, length, context.sampleRate);
        for (let channel = 0; channel < 2; channel++) {
          const data = buffer.getChannelData(channel);
          let low = 0, mid = 0, slow = 0;
          for (let i = 0; i < length; i++) {
            const white = Math.random() * 2 - 1, t = i / context.sampleRate;
            low += (white - low) * 0.018; mid += (white - mid) * 0.17; slow += (white - slow) * 0.0008;
            const swell = 0.7 + 0.16 * Math.sin(t * 2.1) + 0.1 * Math.sin(t * 5.3 + channel);
            data[i] = (low * 0.8 + mid * 0.075 + (white - mid) * 0.012) * swell + slow * 0.18;
          }
          // Short, clustered transients differ in weight and length like burning wood.
          for (let time = 0.06; time < seconds - 0.3; time += 0.025 + Math.pow(Math.random(), 2) * 0.43) {
            const start = Math.floor(time * context.sampleRate), weight = Math.pow(Math.random(), 2);
            const duration = 0.008 + weight * 0.12, count = Math.floor(duration * context.sampleRate);
            let body = 0;
            for (let i = 0; i < count; i++) {
              const white = Math.random() * 2 - 1;
              body += (white - body) * (0.08 + weight * 0.3);
              const envelope = Math.exp(-i / (count * 0.19)) * Math.min(1, i / 5);
              data[start + i] += (body * 0.65 + white * 0.24) * envelope * (0.13 + weight * 0.9);
            }
          }
          const seam = Math.floor(context.sampleRate * 0.1);
          for (let i = 0; i < seam; i++) {
            const blend = i / seam, a = data[i], b = data[length - seam + i];
            data[length - seam + i] = b * (1 - blend) + a * blend;
          }
        }
      }
      source = context.createBufferSource(); gain = context.createGain();
      source.buffer = buffer; source.loop = true; source.loopStart = 0.1;
      gain.gain.setValueAtTime(0, context.currentTime); gain.gain.setTargetAtTime(clamp(volume, 0, 1) * 0.7, context.currentTime, 0.08);
      source.connect(gain); gain.connect(context.destination); source.start();
    },
    stop,
    destroy() { destroyed = true; stop(); buffer = null; lease?.release(); lease = null; },
  };
  return session;
}
