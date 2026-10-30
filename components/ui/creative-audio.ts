"use client";

import { clamp } from "./creative-surface";

let sharedContext: AudioContext | null = null;
let leases = 0;

/** Call from a gesture handler, never from mount, hover, or an animation frame. */
export function acquireCreativeAudio() {
  if (typeof window === "undefined") return null;
  const Constructor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Constructor) return null;
  if (!sharedContext || sharedContext.state === "closed") sharedContext = new Constructor();
  const context = sharedContext;
  leases += 1;
  void context.resume().catch(() => {});
  let released = false;
  return {
    context,
    release() {
      if (released) return;
      released = true;
      leases = Math.max(0, leases - 1);
      if (!leases && sharedContext === context) {
        sharedContext = null;
        void context.close().catch(() => {});
      }
    },
  };
}

export type EffectSound = "tick" | "clink" | "shutter" | "wipe" | "pop";

export function createCreativeSound() {
  let lease: ReturnType<typeof acquireCreativeAudio> = null;
  let destroyed = false;
  const sources = new Set<AudioScheduledSourceNode>();
  const nodes = new Set<AudioNode>();
  let fireStop: (() => void) | undefined;
  const unlock = () => {
    if (destroyed) return null;
    lease ??= acquireCreativeAudio();
    return lease?.context ?? null;
  };
  const disconnect = (source: AudioScheduledSourceNode, owned: AudioNode[]) => {
    sources.delete(source);
    for (const node of owned) { try { node.disconnect(); } catch {} nodes.delete(node); }
  };
  const play = (kind: EffectSound, volume = 0.25, impact = 1) => {
    // Animation/collision callers can only use an already unlocked session.
    const context = lease?.context;
    if (destroyed || !context || context.state !== "running" || volume <= 0) return;
    const duration = kind === "wipe" ? 0.17 : kind === "shutter" ? 0.09 : kind === "clink" ? 0.23 : 0.035;
    const gain = context.createGain();
    const peak = clamp(volume, 0, 1) * clamp(impact, 0.05, 1) * (kind === "clink" ? 0.12 : 0.07);
    gain.gain.setValueAtTime(peak, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
    gain.connect(context.destination);
    if (kind === "wipe" || kind === "shutter" || kind === "pop") {
      const source = context.createBufferSource(), filter = context.createBiquadFilter();
      const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      source.buffer = buffer;
      filter.type = kind === "wipe" ? "lowpass" : "bandpass";
      filter.frequency.value = kind === "wipe" ? 700 : 1900;
      source.connect(filter); filter.connect(gain);
      sources.add(source); nodes.add(source); nodes.add(filter); nodes.add(gain);
      source.onended = () => disconnect(source, [source, filter, gain]);
      source.start(); source.stop(context.currentTime + duration);
    } else {
      const source = context.createOscillator();
      source.type = kind === "clink" ? "triangle" : "sine";
      source.frequency.setValueAtTime(kind === "clink" ? 1800 + Math.random() * 900 : 1100, context.currentTime);
      source.frequency.exponentialRampToValueAtTime(kind === "clink" ? 850 : 650, context.currentTime + duration);
      source.connect(gain);
      sources.add(source); nodes.add(source); nodes.add(gain);
      source.onended = () => disconnect(source, [source, gain]);
      source.start(); source.stop(context.currentTime + duration);
    }
  };
  const startFire = (volume: number) => {
    fireStop?.();
    const context = lease?.context;
    if (!context || context.state !== "running" || destroyed) return;
    const source = context.createBufferSource(), filter = context.createBiquadFilter(), gain = context.createGain();
    const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate), data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    source.buffer = buffer; source.loop = true;
    filter.type = "lowpass"; filter.frequency.value = 180;
    gain.gain.value = clamp(volume, 0, 1) * 0.13;
    source.connect(filter); filter.connect(gain); gain.connect(context.destination);
    sources.add(source); for (const node of [source, filter, gain]) nodes.add(node);
    source.start();
    let stopped = false;
    fireStop = () => {
      if (stopped) return;
      stopped = true;
      try { source.stop(); } catch {}
      disconnect(source, [source, filter, gain]);
    };
  };
  return {
    unlock, play, startFire,
    stopFire() { fireStop?.(); fireStop = undefined; },
    destroy() {
      destroyed = true; fireStop?.();
      for (const source of sources) { source.onended = null; try { source.stop(); } catch {} }
      for (const node of nodes) { try { node.disconnect(); } catch {} }
      sources.clear(); nodes.clear(); lease?.release(); lease = null;
    },
  };
}
