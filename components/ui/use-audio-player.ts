"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { acquireCreativeAudio } from "./creative-audio";
import { clamp } from "./creative-surface";

export type AudioTrack = { title: string; artist: string; src: string; cover?: string; avatar?: string; href?: string };
export type AudioPlayerOptions = {
  tracks: readonly AudioTrack[];
  index?: number;
  onTrackChange?: (index: number) => void;
  volume?: number;
  muted?: boolean;
  autoPlay?: boolean;
  analyse?: boolean;
};
export type AudioPlayerState = {
  index: number; playing: boolean; currentTime: number; duration: number;
  volume: number; muted: boolean; loading: boolean; error: string | null;
};

/** One media element per mounted player. No media element or audio context during SSR. */
export class AudioPlayerEngine {
  private options: AudioPlayerOptions;
  private state: AudioPlayerState;
  private initial: AudioPlayerState;
  private listeners = new Set<() => void>();
  private audio: HTMLAudioElement | null = null;
  private removeEvents?: () => void;
  private lease: ReturnType<typeof acquireCreativeAudio> = null;
  private source: MediaElementAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private initiated = false;
  private playRequest = 0;
  private pendingResume = false;

  constructor(options: AudioPlayerOptions) {
    this.options = options;
    this.state = {
      index: clamp(Math.floor(options.index ?? 0), 0, Math.max(0, options.tracks.length - 1)),
      playing: false, currentTime: 0, duration: 0, volume: clamp(options.volume ?? 0.65, 0, 1),
      muted: options.muted ?? false, loading: false, error: null,
    };
    this.initial = this.state;
  }
  getSnapshot = () => this.state;
  getServerSnapshot = () => this.initial;
  getAnalyser = () => this.analyser;
  getTrack = () => this.options.tracks[this.state.index];
  private update(patch: Partial<AudioPlayerState>) {
    const next = { ...this.state, ...patch };
    if ((Object.keys(next) as (keyof AudioPlayerState)[]).every((key) => next[key] === this.state[key])) return;
    this.state = next;
    for (const listener of this.listeners) listener();
  }
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    if (!this.audio) this.mount();
    return () => { this.listeners.delete(listener); if (!this.listeners.size) this.destroyMedia(); };
  };
  configure(options: AudioPlayerOptions) {
    const previous = this.options, source = this.getTrack()?.src;
    this.options = options;
    const index = clamp(Math.floor(options.index ?? this.state.index), 0, Math.max(0, options.tracks.length - 1));
    const playing = this.state.playing;
    this.update({ index });
    if (source !== this.getTrack()?.src) { const resume = playing || this.pendingResume; this.pendingResume = false; this.loadTrack(resume); }
    if (options.volume !== previous.volume && options.volume !== undefined) this.setVolume(options.volume);
    if (options.muted !== previous.muted && options.muted !== undefined) this.setMuted(options.muted);
  }
  private mount() {
    if (typeof document === "undefined") return;
    const audio = document.createElement("audio");
    this.audio = audio;
    audio.preload = "metadata";
    audio.volume = this.state.volume; audio.muted = this.state.muted;
    const timing = () => this.update({
      currentTime: Number.isFinite(audio.currentTime) ? audio.currentTime : 0,
      duration: Number.isFinite(audio.duration) ? audio.duration : 0,
    });
    const events: [string, EventListener][] = [
      ["loadedmetadata", () => { timing(); this.update({ loading: false }); }],
      ["durationchange", timing], ["timeupdate", timing],
      ["playing", () => this.update({ playing: true, loading: false, error: null })],
      ["pause", () => this.update({ playing: false })],
      ["waiting", () => this.update({ loading: true })],
      ["canplay", () => this.update({ loading: false })],
      ["volumechange", () => this.update({ volume: audio.volume, muted: audio.muted })],
      ["error", () => this.update({ playing: false, loading: false, error: "This track could not be loaded. Try another track." })],
      ["ended", () => { this.update({ playing: false }); this.select(this.state.index + 1, true); }],
    ];
    for (const [name, listener] of events) audio.addEventListener(name, listener);
    this.removeEvents = () => { for (const [name, listener] of events) audio.removeEventListener(name, listener); };
    this.loadTrack(false);
  }
  private loadTrack(resume: boolean) {
    const audio = this.audio, track = this.getTrack();
    if (!audio) return;
    if (this.source && track?.src) {
      const url = new URL(track.src, window.location.href);
      if (url.protocol !== "data:" && url.protocol !== "blob:" && url.origin !== window.location.origin) {
        this.destroyMedia(); this.mount(); if (resume && this.initiated) void this.play(); return;
      }
    }
    this.playRequest++;
    audio.pause();
    this.update({ playing: false, currentTime: 0, duration: 0, loading: Boolean(track?.src), error: null });
    if (!track?.src) { audio.removeAttribute("src"); audio.load(); this.update({ loading: false }); return; }
    audio.src = track.src;
    audio.load();
    if (resume && this.initiated) void this.play();
  }
  private connectAnalysis() {
    if (this.source || !this.audio || this.options.analyse === false) return;
    // Remote files without CORS should remain audible; they use the visual fallback.
    try {
      const url = new URL(this.getTrack()?.src ?? "", window.location.href);
      if (url.protocol !== "data:" && url.protocol !== "blob:" && url.origin !== window.location.origin) return;
      this.lease ??= acquireCreativeAudio();
      const context = this.lease?.context;
      if (!context) return;
      const source = context.createMediaElementSource(this.audio), analyser = context.createAnalyser();
      analyser.fftSize = 64; analyser.smoothingTimeConstant = 0.85;
      source.connect(analyser); analyser.connect(context.destination);
      this.source = source; this.analyser = analyser;
    } catch {
      this.lease?.release(); this.lease = null;
    }
  }
  play = async () => {
    if (!this.audio || !this.getTrack()?.src) return;
    this.initiated = true;
    this.connectAnalysis();
    if (this.lease?.context.state === "suspended") void this.lease.context.resume().catch(() => {});
    const audio = this.audio, request = ++this.playRequest;
    this.update({ error: null, loading: true });
    try { await audio.play(); if (this.audio === audio && request === this.playRequest) this.update({ playing: true, loading: false }); }
    catch (error) {
      if (this.audio !== audio || request !== this.playRequest || (error as DOMException)?.name === "AbortError") return;
      this.update({ playing: false, loading: false, error: "Playback could not start. Press play to try again." });
    }
  };
  pause = () => { this.playRequest++; this.pendingResume = false; this.audio?.pause(); this.update({ playing: false, loading: false }); };
  toggle = () => { if (this.state.playing) this.pause(); else void this.play(); };
  allowAutoPlay = () => { if (this.options.autoPlay && !this.initiated) void this.play(); };
  seek = (seconds: number) => {
    if (!this.audio || !Number.isFinite(seconds) || !this.state.duration) return;
    const time = clamp(seconds, 0, this.state.duration);
    this.audio.currentTime = time; this.update({ currentTime: time });
  };
  select = (requested: number, resume = this.state.playing) => {
    const length = this.options.tracks.length;
    if (!length) return;
    const index = ((Math.floor(requested) % length) + length) % length;
    this.options.onTrackChange?.(index);
    if (this.options.index !== undefined) { this.pendingResume = resume; return; }
    this.update({ index });
    this.loadTrack(resume);
  };
  next = () => this.select(this.state.index + 1);
  previous = () => { if (this.state.currentTime > 3) this.seek(0); else this.select(this.state.index - 1); };
  setVolume = (volume: number) => {
    const value = clamp(volume, 0, 1);
    if (this.audio) this.audio.volume = value;
    this.update({ volume: value });
  };
  setMuted = (muted: boolean) => { if (this.audio) this.audio.muted = muted; this.update({ muted }); };
  toggleMute = () => this.setMuted(!this.state.muted);
  selectOutput = async () => {
    const media = navigator.mediaDevices as MediaDevices & { selectAudioOutput?: () => Promise<MediaDeviceInfo> };
    const audio = this.audio as (HTMLAudioElement & { setSinkId?: (id: string) => Promise<void> }) | null;
    if (!media?.selectAudioOutput || !audio?.setSinkId) return "Choose your output in your browser or system sound settings.";
    try {
      const device = await media.selectAudioOutput();
      await audio.setSinkId(device.deviceId);
      return "Output: " + (device.label || "selected device");
    } catch { return "Output selection was cancelled. Your current output is unchanged."; }
  };
  private destroyMedia() {
    this.playRequest++;
    this.removeEvents?.(); this.removeEvents = undefined;
    this.audio?.pause();
    if (this.audio) { this.audio.removeAttribute("src"); this.audio.load(); }
    try { this.source?.disconnect(); this.analyser?.disconnect(); } catch {}
    this.source = null; this.analyser = null; this.audio = null;
    this.lease?.release(); this.lease = null;
    this.update({ playing: false, loading: false });
  }
}

export function useAudioPlayer(options: AudioPlayerOptions) {
  const [engine] = useState(() => new AudioPlayerEngine(options));
  useEffect(() => { engine.configure(options); }, [engine, options]);
  const state = useSyncExternalStore(engine.subscribe, engine.getSnapshot, engine.getServerSnapshot);
  return {
    ...state, track: options.tracks[state.index], play: engine.play, pause: engine.pause, toggle: engine.toggle,
    seek: engine.seek, next: engine.next, previous: engine.previous, select: engine.select,
    setVolume: engine.setVolume, setMuted: engine.setMuted, toggleMute: engine.toggleMute,
    getAnalyser: engine.getAnalyser, allowAutoPlay: engine.allowAutoPlay,
    selectOutput: engine.selectOutput,
  };
}

export type AudioPlayer = ReturnType<typeof useAudioPlayer>;
export function audioTime(seconds: number) {
  const value = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  return Math.floor(value / 60) + ":" + String(value % 60).padStart(2, "0");
}
