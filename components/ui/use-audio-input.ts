"use client";
import { useCallback, useEffect, useRef, useState } from "react";
/** Microphone analysis stays local. The input never connects to the audio output. */
export function useAudioInput() {
  const session = useRef<{ stream: MediaStream; context: AudioContext; analyser: AnalyserNode; source: MediaStreamAudioSourceNode } | null>(null);
  const generation = useRef(0), [listening, setListening] = useState(false), [pending, setPending] = useState(false), [error, setError] = useState("");
  const stop = useCallback(() => {
    generation.current++;
    const current = session.current; session.current = null;
    current?.stream.getTracks().forEach(track => track.stop()); current?.source.disconnect();
    if (current) void current.context.close().catch(() => {});
    setListening(false); setPending(false);
  }, []);
  const start = async () => {
    if (pending || listening) return;
    const request = ++generation.current; setPending(true); setError("");
    let stream: MediaStream | undefined, context: AudioContext | undefined;
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Microphone input requires HTTPS or localhost.");
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (request !== generation.current || document.hidden) { stream.getTracks().forEach(track => track.stop()); return; }
      context = new AudioContext(); await context.resume();
      if (request !== generation.current) { stream.getTracks().forEach(track => track.stop()); await context.close(); return; }
      const source = context.createMediaStreamSource(stream), analyser = context.createAnalyser(); analyser.fftSize = 512; analyser.smoothingTimeConstant = .65;
      source.connect(analyser); session.current = { stream, context, source, analyser }; setListening(true);
    } catch (cause) {
      stream?.getTracks().forEach(track => track.stop()); if (context) void context.close().catch(() => {});
      if (request === generation.current) setError(cause instanceof DOMException && cause.name === "NotAllowedError" ? "Microphone access was denied. Allow access and try Listen again." : cause instanceof Error ? cause.message : "Could not start microphone input.");
    } finally { if (request === generation.current) setPending(false); }
  };
  useEffect(() => { const hide = () => { if (document.hidden) stop(); }; document.addEventListener("visibilitychange", hide); return () => { document.removeEventListener("visibilitychange", hide); stop(); }; }, [stop]);
  const getAnalyser = useCallback(() => session.current?.analyser ?? null, []);
  return { listening, pending, error, start, stop, getAnalyser };
}
