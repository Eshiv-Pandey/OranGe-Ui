"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import type { Appearance } from "./appearance";
import { createCreativeCanvas, useCreativeTheme, usePropPreference, clamp, type CreativeTheme, type CreativeSize } from "./creative-surface";
import { createCreativeSound } from "./creative-audio";
import { CreativeIcon } from "./creative-icons";
import { stickerSource } from "./creative-decals";
import type { KeychainWorld } from "./keychain-physics";
import "../../styles/swing-keychain.css";

export type KeychainCharm = { id: string; kind?: "orange" | "flower" | "star" | "planet" | "bolt"; image?: string; color?: string; label?: string };
export const DEFAULT_CHARMS: readonly KeychainCharm[] = [{ id: "citrus", kind: "orange" }, { id: "orbit", kind: "planet" }, { id: "petal", kind: "flower" }, { id: "lightning", kind: "bolt" }, { id: "sun", kind: "star" }];
export type SwingKeychainProps = {
  charms?: readonly KeychainCharm[]; chainLength?: number; gravity?: number; damping?: number;
  muted?: boolean; volume?: number; clipColor?: string; background?: string; size?: CreativeSize;
  theme?: CreativeTheme; appearance?: Appearance; className?: string;
};

export function SwingKeychain({ charms = DEFAULT_CHARMS, chainLength = 6, gravity = 850, damping = 0.96, muted = true, volume = 0.35, clipColor = "#91afc3", background = "#ffe28b", size = 340, theme = "auto", appearance = "polished", className }: SwingKeychainProps) {
  const root = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null), world = useRef<KeychainWorld | null>(null);
  const physics = useRef<typeof import("./keychain-physics") | null>(null), sound = useRef<ReturnType<typeof createCreativeSound> | null>(null);
  const [isMuted, setMuted] = usePropPreference(muted), resolved = useCreativeTheme(theme);
  const latest = useRef({ charms, gravity, damping, isMuted, volume, clipColor, background });
  useEffect(() => { latest.current = { charms, gravity, damping, isMuted, volume, clipColor, background }; }, [charms, gravity, damping, isMuted, volume, clipColor, background]);
  useEffect(() => {
    let cancelled = false, renderer: ReturnType<typeof createCreativeCanvas> | undefined;
    const images: HTMLImageElement[] = [], session = createCreativeSound(); sound.current = session;
    void import("./keychain-physics").then((module) => {
      if (cancelled || !canvas.current) return;
      physics.current = module;
      const model = module.createKeychainWorld(360, 420, Math.max(1, charms.length), chainLength); world.current = model;
      for (let i = 0; i < 90; i++) module.stepKeychain(model, 1 / 60, gravity, damping);
      for (const [index, charm] of charms.entries()) {
        const image = new Image(); image.crossOrigin = "anonymous";
        image.onload = () => renderer?.redraw(); image.src = charm.image || stickerSource({ id: charm.id, kind: charm.kind || "star", x: 0, y: 0, size: 1 }); images[index] = image;
      }
      let lastSound = 0;
      renderer = createCreativeCanvas(canvas.current, (context, frame) => {
        const config = latest.current, dt = frame.reduced ? 0 : frame.delta / 1000;
        const impact = dt ? module.stepKeychain(model, dt, clamp(config.gravity, 0, 2500), clamp(config.damping, 0.5, 0.999)) : 0;
        if (impact > 45 && frame.time - lastSound > 120 && !config.isMuted) { session.play("clink", config.volume, impact / 450); lastSound = frame.time; }
        if (!frame.reduced && model.grabbed === null) {
          const anchor = model.particles[0]; anchor.x = 180 + Math.sin(frame.time / 1800) * 1.5;
        }
        context.clearRect(0, 0, frame.width, frame.height); context.save(); context.scale(frame.width / 360, frame.height / 420);
        context.fillStyle = config.background; context.fillRect(0, 0, 360, 420);
        const metal = context.createLinearGradient(146, 0, 211, 0); metal.addColorStop(0, "#d5e6ef"); metal.addColorStop(0.45, config.clipColor); metal.addColorStop(1, "#4e7394");
        context.lineCap = "round"; context.lineJoin = "round";
        context.beginPath(); context.moveTo(167, 84); context.bezierCurveTo(118, 13, 224, -4, 214, 55); context.bezierCurveTo(210, 87, 190, 107, 169, 83);
        context.strokeStyle = "#273f5a"; context.lineWidth = 13; context.stroke(); context.strokeStyle = metal; context.lineWidth = 8; context.stroke();
        context.beginPath(); context.moveTo(154, 34); context.lineTo(169, 78); context.strokeStyle = "#314e69"; context.lineWidth = 8; context.stroke(); context.strokeStyle = "#b5d2df"; context.lineWidth = 4; context.stroke();
        for (const link of model.links) {
          const a = model.particles[link.a], b = model.particles[link.b];
          context.beginPath(); context.moveTo(a.x, a.y); context.lineTo(b.x, b.y); context.strokeStyle = "#314768"; context.lineWidth = 7; context.stroke(); context.strokeStyle = "#b8cede"; context.lineWidth = 3.5; context.stroke();
        }
        for (let index = 1; index < model.charmStart; index++) {
          const node = model.particles[index]; context.beginPath(); context.ellipse(node.x, node.y, 6, 8, index % 2 ? 0.35 : -0.35, 0, Math.PI * 2); context.strokeStyle = "#2b425c"; context.lineWidth = 3; context.stroke(); context.strokeStyle = "#bdd3de"; context.lineWidth = 1.4; context.stroke();
        }
        for (let index = 0; index < config.charms.length && model.charmStart + index < model.particles.length; index++) {
          const node = model.particles[model.charmStart + index], anchor = model.particles[model.charmStart - 1], image = images[index], charm = config.charms[index];
          const angle = Math.atan2(node.x - anchor.x, node.y - anchor.y) * -0.55;
          context.save(); context.translate(node.x, node.y); context.rotate(angle);
          context.shadowColor = "#8e63295c"; context.shadowBlur = 6; context.shadowOffsetX = 3; context.shadowOffsetY = 6;
          context.beginPath(); context.roundRect(-node.radius - 3, -node.radius - 3, node.radius * 2 + 6, node.radius * 2 + 6, charm.image ? 10 : node.radius * 0.4); context.fillStyle = "#fffdf4"; context.fill(); context.shadowColor = "transparent";
          context.strokeStyle = charm.color || "#344d68"; context.lineWidth = 2; context.stroke();
          if (image?.complete && image.naturalWidth) context.drawImage(image, -node.radius + 2, -node.radius + 2, node.radius * 2 - 4, node.radius * 2 - 4);
          context.beginPath(); context.arc(0, -node.radius + 2, 3, 0, Math.PI * 2); context.fillStyle = "#8bacc0"; context.fill(); context.strokeStyle = "#3b5b72"; context.lineWidth = 1; context.stroke();
          context.restore();
        }
        context.restore(); if (root.current) root.current.dataset.ready = "true";
      });
    }).catch(() => { if (root.current) root.current.dataset.ready = "false"; });
    return () => {
      cancelled = true; renderer?.destroy(); session.destroy(); sound.current = null; world.current = null; physics.current = null;
      images.forEach((image) => { image.onload = null; image.onerror = null; image.src = ""; });
    };
  }, [charms, chainLength, gravity, damping]);
  const position = (event: React.PointerEvent<HTMLCanvasElement>) => { const box = event.currentTarget.getBoundingClientRect(); return [(event.clientX - box.left) / box.width * 360, (event.clientY - box.top) / box.height * 420] as const; };
  return <div ref={root} className={cn("creative-surface swing-keychain", className)} data-theme={resolved} data-appearance={appearance} style={{ "--keychain-size": typeof size === "number" ? size + "px" : size, "--keychain-background": background } as CSSProperties}>
    <div className="keychain-still" aria-hidden="true"><svg viewBox="0 0 360 420"><path d="M170 80Q125 10 188 15Q240 15 209 73Q185 111 170 80M180 96v70" fill="none" stroke={clipColor} strokeWidth="11"/>{charms.slice(0, 7).map((charm, index) => <g key={charm.id}><path d={"M180 160 " + (100 + index * 31) + " " + (235 + index % 3 * 30)} stroke="#5b7894" strokeWidth="4"/><image href={charm.image || stickerSource({ id: charm.id, kind: charm.kind || "star", x: 0, y: 0, size: 1 })} x={73 + index * 31} y={209 + index % 3 * 30} width="57" height="57"/></g>)}</svg></div>
    <canvas ref={canvas} tabIndex={0} aria-label="Swing keychain. Drag a charm, or use arrow keys and Space to swing." onPointerDown={(event) => { if (!world.current) return; event.currentTarget.setPointerCapture(event.pointerId); sound.current?.unlock(); const [x, y] = position(event); physics.current?.grabKeychain(world.current, x, y); }}
      onPointerMove={(event) => { if (!world.current || world.current.grabbed === null) return; const [x, y] = position(event); physics.current?.moveKeychain(world.current, x, y); }}
      onPointerUp={() => { if (world.current) physics.current?.releaseKeychain(world.current); }} onPointerCancel={() => { if (world.current) physics.current?.releaseKeychain(world.current); }}
      onKeyDown={(event) => {
        if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(event.key) || !world.current) return;
        event.preventDefault(); sound.current?.unlock(); const node = world.current.particles[world.current.charmStart];
        if (event.key === "ArrowLeft") node.px += 20; else if (event.key === "ArrowRight" || event.key === " ") node.px -= event.key === " " ? 48 : 20;
        else node.py += event.key === "ArrowUp" ? 20 : -20;
      }} />
    <div className="keychain-footer"><span>Grab a charm. Give it a swing.</span><button type="button" className="creative-icon-button" aria-label={isMuted ? "Unmute keychain" : "Mute keychain"} aria-pressed={isMuted} onClick={() => { if (isMuted) sound.current?.unlock(); setMuted(!isMuted); }}><CreativeIcon name={isMuted ? "muted" : "speaker"} /></button></div>
  </div>;
}
