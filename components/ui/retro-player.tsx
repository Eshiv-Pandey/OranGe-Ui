"use client";

import { CreativeEditorSlot } from "./creative-editor-slot";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import type { Appearance } from "./appearance";
import { useCreativeTheme, clamp, type CreativeTheme } from "./creative-surface";
import { useAudioPlayer, audioTime, type AudioTrack } from "./use-audio-player";
import { PlayerVolume, PlayerFeedback } from "./creative-player-parts";
import { CreativeIcon } from "./creative-icons";
import { createCreativeSound } from "./creative-audio";
import { DecalLayer, StickerEditor, ORIGINAL_STICKERS, type CreativeSticker } from "./creative-decals";
import { SAMPLE_COVERS } from "./creative-art";

export type RetroPlayerProps = {
  tracks: readonly AudioTrack[]; autoPlay?: boolean; bodyColor?: string; screenColor?: string;
  stickers?: readonly CreativeSticker[]; onStickersChange?: (stickers: CreativeSticker[]) => void;
  showEarbuds?: boolean; volume?: number; muted?: boolean; theme?: CreativeTheme;
  appearance?: Appearance; className?: string;
};

export function RetroPlayer({ tracks, autoPlay = false, bodyColor = "#e6e5df", screenColor = "#f6f5ee", stickers, onStickersChange, showEarbuds = true, volume = 0.65, muted = false, theme = "auto", appearance = "retro-os", className }: RetroPlayerProps) {
  const player = useAudioPlayer({ tracks, autoPlay, volume, muted }), resolved = useCreativeTheme(theme);
  const [menu, setMenu] = useState<"music" | "volume" | "tracks">("music"), [editing, setEditing] = useState(false);
  const [localStickers, setLocalStickers] = useState<readonly CreativeSticker[]>(ORIGINAL_STICKERS);
  const currentStickers = stickers ?? localStickers;
  const sound = useRef<ReturnType<typeof createCreativeSound> | null>(null);
  const wheel = useRef<{ angle: number; remainder: number; moved: boolean; x: number; y: number } | null>(null);
  const changeStickers = (next: CreativeSticker[]) => { if (stickers === undefined) setLocalStickers(next); onStickersChange?.(next); };
  useEffect(() => { const session = createCreativeSound(); sound.current = session; return () => { session.destroy(); sound.current = null; }; }, []);
  const tick = () => { if (!player.muted) { sound.current?.unlock(); sound.current?.play("tick", player.volume * 0.5); } };
  const turn = (steps: number) => {
    if (menu === "volume") player.setVolume(clamp(player.volume + steps * 0.025, 0, 1));
    else player.seek(player.currentTime + steps);
    tick();
  };
  return <div className={cn("creative-surface retro-player-scene", className)} data-theme={resolved} data-appearance={appearance} style={{ "--device-body": bodyColor, "--device-screen": screenColor } as CSSProperties}>
    <div className="retro-player-hardware">
    {showEarbuds && <svg className="retro-earbuds" viewBox="0 0 248 354" aria-hidden="true"><g fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M180-2V-38Q181-71 217-69Q278-66 282 34L278 142Q281 162 268 174M268 174Q284 216 279 288Q276 376 198 380Q-52 396-46 229L-30 94M268 174Q-82 178-52 41L-27-32" stroke="#59565f" strokeWidth="6"/><path d="M180-2V-38Q181-71 217-69Q278-66 282 34L278 142Q281 162 268 174M268 174Q284 216 279 288Q276 376 198 380Q-52 396-46 229L-30 94M268 174Q-82 178-52 41L-27-32" stroke="#f5f4ed" strokeWidth="3.5"/></g><g fill="#f6f5ed" stroke="#48454e" strokeWidth="1.8"><rect x="175" y="-24" width="10" height="23" rx="3"/><rect x="176" y="-4" width="8" height="6" rx="1" fill="#9fa6ad"/><path d="M-30-34L-38-57Q-40-75-22-74Q-3-71-11-52L-22-29Z"/><ellipse cx="-26" cy="-62" rx="10" ry="8"/><path d="M-32 96L-43 71Q-47 55-31 51Q-13 50-10 65Q-7 76-22 84L-24 98Z"/><ellipse cx="-29" cy="65" rx="10" ry="8"/><rect x="264" y="162" width="9" height="22" rx="3"/></g><path d="M-31-64l7 3M-34 64l7 3" stroke="#48454e" strokeWidth="2.8"/></svg>}
    <div className="retro-player-body" onPointerDown={player.allowAutoPlay}>
      <div className="retro-player-screen">
        <div className="retro-screen-heading"><span>ORANGE / MUSIC</span><span className="retro-battery" aria-hidden="true" /></div>
        {menu === "tracks" ? <div className="retro-track-menu">{tracks.map((track, index) => <button type="button" key={track.src + index} aria-pressed={player.index === index} onClick={() => { player.select(index); setMenu("music"); }}>{String(index + 1).padStart(2, "0") + " " + track.title}</button>)}</div> : <>
          <div className="retro-screen-track"><img src={player.track?.cover || SAMPLE_COVERS[0]} alt="" /><div><strong>{player.track?.title || "No track yet"}</strong><span>{player.track?.artist || "Add your music"}</span>{menu === "volume" && <small>{"VOLUME " + Math.round(player.volume * 100) + "%"}</small>}</div></div>
          <input className="retro-screen-progress" type="range" aria-label="Track progress" min="0" max={player.duration || 1} step="0.1" value={Math.min(player.currentTime, player.duration || 0)} disabled={!player.duration} onChange={(event) => player.seek(Number(event.target.value))} />
          <div className="retro-screen-time"><span>{audioTime(player.currentTime)}</span><span>{audioTime(player.duration)}</span></div>
        </>}
      </div>
      <DecalLayer stickers={currentStickers} editable={editing} onChange={changeStickers} />
      <div className="retro-click-wheel" role="group" aria-label="Click wheel">
        <div className="retro-wheel-ring" role="slider" tabIndex={0} aria-label={menu === "volume" ? "Click wheel volume" : "Click wheel track progress"} aria-valuemin={0} aria-valuemax={menu === "volume" ? 100 : Math.round(player.duration)} aria-valuenow={menu === "volume" ? Math.round(player.volume * 100) : Math.round(player.currentTime)}
          onPointerDown={(event) => {
            const box = event.currentTarget.getBoundingClientRect();
            event.currentTarget.setPointerCapture(event.pointerId);
            sound.current?.unlock();
            wheel.current = { angle: Math.atan2(event.clientY - box.top - box.height / 2, event.clientX - box.left - box.width / 2), remainder: 0, moved: false, x: event.clientX, y: event.clientY };
          }}
          onPointerMove={(event) => {
            const current = wheel.current; if (!current) return;
            const box = event.currentTarget.getBoundingClientRect(), angle = Math.atan2(event.clientY - box.top - box.height / 2, event.clientX - box.left - box.width / 2);
            let delta = angle - current.angle;
            if (delta > Math.PI) delta -= Math.PI * 2; if (delta < -Math.PI) delta += Math.PI * 2;
            current.angle = angle; current.remainder += delta;
            current.moved ||= Math.hypot(event.clientX - current.x, event.clientY - current.y) > 4;
            const steps = Math.trunc(current.remainder / 0.12);
            if (steps) { current.remainder -= steps * 0.12; turn(steps); }
          }}
          onPointerUp={() => { wheel.current = null; }} onPointerCancel={() => { wheel.current = null; }}
          onKeyDown={(event) => { if (["ArrowLeft", "ArrowDown", "ArrowRight", "ArrowUp"].includes(event.key)) { event.preventDefault(); turn(event.key === "ArrowLeft" || event.key === "ArrowDown" ? -1 : 1); } }} />
        <button type="button" className="retro-wheel-zone retro-wheel-menu" onClick={() => { tick(); setMenu(menu === "music" ? "tracks" : menu === "tracks" ? "volume" : "music"); }}>MENU</button>
        <button type="button" className="retro-wheel-zone retro-wheel-previous" aria-label="Previous track" onClick={() => { tick(); player.previous(); }}><CreativeIcon name="previous" /></button>
        <button type="button" className="retro-wheel-zone retro-wheel-next" aria-label="Next track" onClick={() => { tick(); player.next(); }}><CreativeIcon name="next" /></button>
        <button type="button" className="retro-wheel-zone retro-wheel-play" aria-label={player.playing ? "Pause" : "Play"} onClick={() => { tick(); player.toggle(); }}><CreativeIcon name={player.playing ? "pause" : "play"} width="15" height="15" /></button>
        <button type="button" className="retro-wheel-center" aria-label={player.playing ? "Pause" : "Play"} onClick={player.toggle} />
      </div>
    </div>
    </div>
    <CreativeEditorSlot><div className="retro-player-footer"><PlayerVolume player={player} /><button className="creative-button" type="button" aria-pressed={editing} onClick={() => setEditing(!editing)}>{editing ? "Done" : "Edit stickers"}</button></div>
    {editing && <StickerEditor stickers={currentStickers} onChange={changeStickers} />}</CreativeEditorSlot>
    <PlayerFeedback player={player} />
  </div>;
}
