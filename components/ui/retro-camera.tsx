"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import type { Appearance } from "./appearance";
import { useCreativeTheme, usePropPreference, observeCreativeVisibility, clamp, type CreativeTheme, type CreativeSize } from "./creative-surface";
import { createCreativeSound } from "./creative-audio";
import { CreativeIcon } from "./creative-icons";
import { DecalLayer, StickerEditor, type CreativeSticker } from "./creative-decals";
import { GARDEN_ART } from "./creative-art";

export type CameraFilter = "none" | "warm" | "mono" | "grain";
export type RetroCameraProps = {
  bodyColor?: string; stickers?: readonly CreativeSticker[]; onStickersChange?: (stickers: CreativeSticker[]) => void;
  facingMode?: "user" | "environment"; onCapture?: (blob: Blob) => void; mirror?: boolean; muted?: boolean; volume?: number;
  filters?: readonly CameraFilter[]; brandText?: string; megapixelLabel?: string; theme?: CreativeTheme;
  size?: CreativeSize; appearance?: Appearance; className?: string;
};
type CameraPhoto = { id: number; url: string; blob: Blob };
const cameraStickers: CreativeSticker[] = [
  { id: "flower", kind: "flower", x: 8, y: 39, size: 11, rotation: -15 }, { id: "orange", kind: "orange", x: 25, y: 68, size: 11, rotation: 10 },
  { id: "star", kind: "star", x: 4, y: 70, size: 9, rotation: 8 }, { id: "planet", kind: "planet", x: 28, y: 34, size: 11, rotation: 12 },
];
const filterCss: Record<CameraFilter, string> = { none: "none", warm: "sepia(.3) saturate(1.25)", mono: "grayscale(1)", grain: "contrast(1.08) saturate(.8)" };

export function RetroCamera({ bodyColor = "#a7cf59", stickers, onStickersChange, facingMode = "user", onCapture, mirror = true, muted = true, volume = 0.35, filters = ["none", "warm", "mono", "grain"], brandText = "ORANGE", megapixelLabel = "12.0 MP", theme = "auto", size = 360, appearance = "retro-os", className }: RetroCameraProps) {
  const root = useRef<HTMLDivElement>(null), video = useRef<HTMLVideoElement>(null), still = useRef<HTMLImageElement>(null);
  const stream = useRef<MediaStream | null>(null), alive = useRef(false), visible = useRef(false), requestId = useRef(0), savedPhotos = useRef<CameraPhoto[]>([]);
  const sound = useRef<ReturnType<typeof createCreativeSound> | null>(null), flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [view, setView] = useState<"back" | "front">("back"), [status, setStatus] = useState<"demo" | "requesting" | "live" | "denied" | "missing" | "paused">("demo");
  const [photos, setPhotos] = useState<CameraPhoto[]>([]), [selected, setSelected] = useState<number | null>(null), [zoom, setZoom] = useState(1);
  const [filter, setFilter] = useState<CameraFilter>("none"), [menu, setMenu] = useState(false), [flash, setFlash] = useState(false), [editing, setEditing] = useState(false), [localMuted, setLocalMuted] = usePropPreference(muted);
  const [localStickers, setLocalStickers] = useState<readonly CreativeSticker[]>(cameraStickers);
  const resolved = useCreativeTheme(theme), lensId = useId().replace(/:/g, ""), currentPhoto = photos.find((photo) => photo.id === selected), currentStickers = stickers ?? localStickers;
  useEffect(() => {
    alive.current = true;
    const session = createCreativeSound(); sound.current = session;
    const stop = () => {
      requestId.current++;
      stream.current?.getTracks().forEach((track) => track.stop()); stream.current = null;
      if (video.current) video.current.srcObject = null;
      if (alive.current) setStatus((value) => value === "live" || value === "requesting" ? "paused" : value);
    };
    const unsubscribe = root.current ? observeCreativeVisibility(root.current, (active) => { visible.current = active; if (!active) stop(); }) : () => {};
    return () => {
      alive.current = false; unsubscribe(); stop(); session.destroy(); sound.current = null;
      if (flashTimer.current) clearTimeout(flashTimer.current);
      savedPhotos.current.forEach((photo) => URL.revokeObjectURL(photo.url)); savedPhotos.current = [];
    };
  }, []);
  const enable = async () => {
    if (!navigator.mediaDevices?.getUserMedia) { setStatus("missing"); return; }
    const id = ++requestId.current; setStatus("requesting");
    try {
      const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode, width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false });
      if (!alive.current || !visible.current || id !== requestId.current) { media.getTracks().forEach((track) => track.stop()); return; }
      stream.current?.getTracks().forEach((track) => track.stop()); stream.current = media;
      if (video.current) { video.current.srcObject = media; void video.current.play().catch(() => {}); }
      setStatus("live"); setSelected(null);
    } catch (error) {
      if (!alive.current || id !== requestId.current) return;
      setStatus((error as DOMException).name === "NotAllowedError" || (error as DOMException).name === "SecurityError" ? "denied" : "missing");
    }
  };
  const capture = () => {
    const element = document.createElement("canvas"), context = element.getContext("2d");
    if (!context) return;
    const live = status === "live" && video.current && video.current.readyState >= 2;
    const image = live ? video.current! : still.current;
    if (!image || (!live && !still.current?.complete)) return;
    const width = live ? video.current!.videoWidth : still.current!.naturalWidth, height = live ? video.current!.videoHeight : still.current!.naturalHeight;
    element.width = Math.min(1280, width); element.height = Math.round(element.width * height / width);
    context.filter = filterCss[filter];
    if (mirror && live && facingMode === "user") { context.translate(element.width, 0); context.scale(-1, 1); }
    const cropWidth = width / zoom, cropHeight = height / zoom;
    context.drawImage(image, (width - cropWidth) / 2, (height - cropHeight) / 2, cropWidth, cropHeight, 0, 0, element.width, element.height);
    if (filter === "grain") {
      const pixels = context.getImageData(0, 0, element.width, element.height);
      for (let index = 0; index < pixels.data.length; index += 4) { const noise = Math.random() * 20 - 10; pixels.data[index] += noise; pixels.data[index + 1] += noise; pixels.data[index + 2] += noise; }
      context.putImageData(pixels, 0, 0);
    }
    if (!localMuted) { sound.current?.unlock(); sound.current?.play("shutter", volume); }
    setFlash(true); if (flashTimer.current) clearTimeout(flashTimer.current); flashTimer.current = setTimeout(() => { if (alive.current) setFlash(false); }, 120);
    element.toBlob((blob) => {
      if (!blob || !alive.current) return;
      const photo = { id: Date.now() + savedPhotos.current.length, blob, url: URL.createObjectURL(blob) };
      savedPhotos.current = [...savedPhotos.current, photo]; setPhotos(savedPhotos.current); setSelected(photo.id); onCapture?.(blob);
    }, "image/png");
  };
  const remove = () => {
    if (!currentPhoto) return;
    URL.revokeObjectURL(currentPhoto.url); savedPhotos.current = savedPhotos.current.filter((photo) => photo.id !== currentPhoto.id);
    setPhotos(savedPhotos.current); setSelected(savedPhotos.current.at(-1)?.id ?? null);
  };
  const changeStickers = (next: CreativeSticker[]) => { if (stickers === undefined) setLocalStickers(next); onStickersChange?.(next); };
  const message = { demo: "Demo scene. Enable your camera for a live view.", requesting: "Waiting for camera permission...", live: "Live camera", denied: "Camera permission denied. Allow access in your browser, then try again.", missing: "No camera is available here. You can still capture the demo scene.", paused: "Camera stopped while hidden. Enable it to resume." }[status];
  return <div ref={root} className={cn("creative-surface retro-camera", className)} data-theme={resolved} data-appearance={appearance} style={{ "--device-body": bodyColor, "--camera-size": typeof size === "number" ? size + "px" : size } as CSSProperties}>
    <div className="retro-camera-top"><span>{brandText} / POCKET CAMERA</span><button type="button" className="camera-shutter" aria-label="Take photo" onClick={capture}><CreativeIcon name="camera" width="15" height="15" /></button></div>
    <div className="retro-camera-stage" data-view={view}>
      <div className="retro-camera-rotator">
        <div className="retro-camera-side retro-camera-back" aria-hidden={view !== "back"} inert={view !== "back"}>
          <div className="retro-camera-screen">
            <img ref={still} className="camera-demo-image" src={GARDEN_ART} alt="Original garden demo scene" style={{ opacity: status === "live" ? 0 : 1, transform: "scale(" + zoom + ")", filter: filterCss[filter] }} />
            <video ref={video} muted playsInline className="camera-video" aria-label="Live camera preview" style={{ opacity: status === "live" ? 1 : 0, transform: "scale(" + zoom + ") scaleX(" + (mirror && facingMode === "user" ? -1 : 1) + ")", filter: filterCss[filter] }} />
            {currentPhoto && <img className="camera-review-image" src={currentPhoto.url} alt="Captured photo review" />}
            {filter === "grain" && <div className="camera-grain" aria-hidden="true" />}
            <div className="camera-screen-hud" aria-hidden="true"><span>{currentPhoto ? "REVIEW" : status === "live" ? "LIVE" : "DEMO"}</span><span>{zoom.toFixed(1) + "×"}</span></div>
            {flash && <div className="camera-flash" aria-hidden="true" />}
          </div>
          <div className="camera-buttons">
            <div className="camera-zoom"><button type="button" aria-label="Zoom out" onClick={() => setZoom(clamp(zoom - 0.25, 1, 3))}>W</button><button type="button" aria-label="Zoom in" onClick={() => setZoom(clamp(zoom + 0.25, 1, 3))}>T</button></div>
            <div className="camera-dpad"><button type="button" aria-label="Previous photo" onClick={() => { const index = photos.findIndex((photo) => photo.id === selected); setSelected(photos[(index - 1 + photos.length) % photos.length]?.id ?? null); }} disabled={!photos.length}>‹</button><button type="button" aria-label="OK, return to preview" onClick={() => setSelected(null)}>OK</button><button type="button" aria-label="Next photo" onClick={() => { const index = photos.findIndex((photo) => photo.id === selected); setSelected(photos[(index + 1) % photos.length]?.id ?? null); }} disabled={!photos.length}>›</button></div>
            <button type="button" className="camera-menu-button" onClick={() => setMenu(!menu)} aria-expanded={menu}>MENU</button>
            <button type="button" className="camera-delete-button" aria-label="Delete selected photo" disabled={!currentPhoto} onClick={remove}><CreativeIcon name="trash" width="13" height="13" /></button>
          </div>
          <span className="camera-bottom-brand" aria-hidden="true">{brandText}</span>
        </div>
        <div className="retro-camera-side retro-camera-front" aria-hidden={view !== "front"} inert={view !== "front"}>
          <div className="camera-front-flash" /><span className="camera-front-brand">{brandText}</span><span className="camera-megapixels">{megapixelLabel}</span>
          <DecalLayer stickers={currentStickers} editable={editing} onChange={changeStickers} />
          <svg className="camera-lens" viewBox="0 0 180 180" aria-hidden="true"><defs><linearGradient id={lensId + "metal"} x2=".7" y2="1"><stop stopColor="#c7ddd8"/><stop offset=".18" stopColor="#4d8c83"/><stop offset=".45" stopColor="#e4ede2"/><stop offset=".65" stopColor="#729f9c"/><stop offset="1" stopColor="#345a69"/></linearGradient><radialGradient id={lensId + "glass"}><stop stopColor="#385773"/><stop offset=".55" stopColor="#192835"/><stop offset="1" stopColor="#0d1626"/></radialGradient></defs><circle cx="90" cy="90" r="86" fill={"url(#" + lensId + "metal)"} stroke="#234755" strokeWidth="3"/><circle cx="90" cy="90" r="70" fill="none" stroke="#375b69" strokeWidth="3"/><circle cx="90" cy="90" r="60" fill={"url(#" + lensId + "metal)"} stroke="#8caeb3" strokeWidth="7"/><circle cx="90" cy="90" r="43" fill="#243f4b" stroke="#bccccc" strokeWidth="3"/><circle cx="90" cy="90" r="31" fill={"url(#" + lensId + "glass)"} stroke="#405365" strokeWidth="3"/><circle cx="90" cy="90" r="17" fill="#0b1220"/><ellipse cx="81" cy="80" rx="7" ry="9" fill="#95baac" opacity=".6"/><circle cx="95" cy="94" r="5" fill="#594e93"/></svg>
        </div>
      </div>
    </div>
    <div className="camera-action-row">
      <button type="button" className="creative-button" onClick={() => setView(view === "back" ? "front" : "back")}><CreativeIcon name="flip" width="15" height="15" />{view === "back" ? "Front" : "Back"}</button>
      <button type="button" className="creative-button" onClick={() => void enable()} disabled={status === "requesting" || status === "live"}>{status === "live" ? "Camera on" : "Enable camera"}</button>
      <button type="button" className="creative-icon-button" aria-label={localMuted ? "Unmute shutter" : "Mute shutter"} aria-pressed={localMuted} onClick={() => { if (localMuted) sound.current?.unlock(); setLocalMuted(!localMuted); }}><CreativeIcon name={localMuted ? "muted" : "speaker"} /></button>
    </div>
    <p className="creative-feedback" role="status">{currentPhoto ? "Photo saved in this session. Download or return to preview." : message}</p>
    {menu && <div className="creative-controls"><label>Photo filter<select value={filter} onChange={(event) => setFilter(event.target.value as CameraFilter)}>{filters.map((value) => <option value={value} key={value}>{value}</option>)}</select></label><button type="button" className="creative-button" onClick={() => { setEditing(!editing); setView("front"); }}>{editing ? "Done editing" : "Edit stickers"}</button></div>}
    {editing && <StickerEditor stickers={currentStickers} onChange={changeStickers} />}
    {!!photos.length && <div className="camera-gallery" aria-label="Captured photos">{photos.map((photo, index) => <button type="button" key={photo.id} onClick={() => { setSelected(photo.id); setView("back"); }} aria-label={"Review photo " + (index + 1)} aria-pressed={selected === photo.id}><img src={photo.url} alt="" /></button>)}{currentPhoto && <a className="creative-button" href={currentPhoto.url} download={"orange-photo-" + currentPhoto.id + ".png"} aria-label="Download selected photo"><CreativeIcon name="download" width="17" height="17" /></a>}</div>}
  </div>;
}
