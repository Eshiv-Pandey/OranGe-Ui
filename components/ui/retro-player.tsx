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
    {showEarbuds && <svg className="retro-earbuds" viewBox="0 0 340 480" aria-hidden="true"><g fill="none" stroke="#343339" strokeWidth="7"><path d="M218 143V35Q225-55 282 20T315 236Q300 390 244 404M102 400Q15 394 30 217l28-138M50 116Q-1 259 108 265"/></g><g fill="none" stroke="#faf9f5" strokeWidth="4"><path d="M218 143V35Q225-55 282 20T315 236Q300 390 244 404M102 400Q15 394 30 217l28-138M50 116Q-1 259 108 265"/></g><g fill="#faf9f5" stroke="#343339" strokeWidth="2.5"><path d="M42 48q-8-21 10-28t26 11q8 13-6 24l-11 38-13-4 9-36Z"/><ellipse cx="53" cy="34" rx="14" ry="12"/><path d="M8 152q-4-19 12-23t23 11q4 12-11 20l-8 39-13-4 8-38Z"/><ellipse cx="20" cy="140" rx="12" ry="11"/><rect x="208" y="109" width="20" height="35" rx="3"/></g><path d="m49 35 7 2m-40 104 7 2" stroke="#343339" strokeWidth="4"/></svg>}
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
    <CreativeEditorSlot><div className="retro-player-footer"><PlayerVolume player={player} /><button className="creative-button" type="button" aria-pressed={editing} onClick={() => setEditing(!editing)}>{editing ? "Done" : "Edit stickers"}</button></div>
    {editing && <StickerEditor stickers={currentStickers} onChange={changeStickers} />}</CreativeEditorSlot>
    <PlayerFeedback player={player} />
  </div>;
}
