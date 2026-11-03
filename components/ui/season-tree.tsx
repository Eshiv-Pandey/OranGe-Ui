"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import type { Appearance } from "./appearance";
import { createCreativeCanvas, useCreativeTheme, clamp, type CreativeTheme, type CreativeSize } from "./creative-surface";
import { createTreeLayers, paintTreeLeaf, seededTreeRandom, TREE_HEIGHT, TREE_WIDTH, TREE_PALETTES, TREE_SEASONS, type TreeSeason } from "./season-tree-art";
import "../../styles/season-tree.css";

export type SeasonTreeProps = {
  season?: TreeSeason; onSeasonChange?: (season: TreeSeason) => void; showPicker?: boolean;
  windStrength?: number; fallRate?: number; pixelSize?: number; background?: string; paused?: boolean;
  size?: CreativeSize; theme?: CreativeTheme; appearance?: Appearance; className?: string;
};
type FallingLeaf = { x: number; y: number; rotation: number; speed: number; drift: number; color: string; size: number; phase: number };

export function SeasonTree({ season, onSeasonChange, showPicker = true, windStrength = .6, fallRate = 2.5, pixelSize, background, paused = false, size = 480, theme = "auto", appearance = "polished", className }: SeasonTreeProps) {
  const [localSeason, setLocalSeason] = useState<TreeSeason>("pink"), activeSeason = season ?? localSeason;
  const resolved = useCreativeTheme(theme), canvas = useRef<HTMLCanvasElement>(null);
  const latest = useRef({ season: activeSeason, windStrength, fallRate, paused, background });
  const redraw = useRef<(() => void) | null>(null);
  useEffect(() => { latest.current = { season: activeSeason, windStrength, fallRate, paused, background }; redraw.current?.(); }, [activeSeason, windStrength, fallRate, paused, background]);
  useEffect(() => {
    const element = canvas.current; if (!element) return;
    let currentSeason = latest.current.season, art = createTreeLayers(currentSeason), previous: ReturnType<typeof createTreeLayers> | null = null, transition = 1, clock = 0, spawn = 0, accumulated = 0;
    const random = seededTreeRandom(872), falling: FallingLeaf[] = [];
    const addLeaf = (initial = false) => {
      const origin = art.foliage[Math.floor(random() * art.foliage.length)], palette = TREE_PALETTES[currentSeason];
      falling.push({ x: origin?.x ?? 100 + random() * 700, y: initial ? 450 + random() * 420 : currentSeason === "winter" ? random() * 80 : origin?.y ?? 100, rotation: random() * 6.28, speed: 25 + random() * 36, drift: random() * 26 - 18, color: palette.fallen[Math.floor(random() * 3)], size: 3 + random() * 4, phase: random() * 6.28 });
    };
    if (latest.current.fallRate > 0) for (let i = 0; i < 10; i++) addLeaf(true);
    const renderer = createCreativeCanvas(element, (context, frame) => {
      const config = latest.current;
      if (currentSeason !== config.season) {
        previous?.destroy(); previous = art; art = createTreeLayers(config.season); currentSeason = config.season; transition = frame.reduced || config.paused ? 1 : 0;
        falling.length = 0; spawn = 0;
      }
      accumulated += frame.delta;
      if (frame.delta && (config.paused || frame.reduced || accumulated < 1000 / 30)) return;
      const seconds = !frame.reduced && !config.paused ? Math.min(accumulated / 1000, .1) : 0;
      accumulated = 0; clock += seconds; transition = Math.min(1, transition + seconds * 1.8);
      const wind = clamp(config.windStrength, 0, 4);
      context.clearRect(0, 0, frame.width, frame.height);
      context.save(); context.scale(frame.width / TREE_WIDTH, frame.height / TREE_HEIGHT);
      if (config.background && config.background !== "transparent") { context.fillStyle = config.background; context.fillRect(0, 0, TREE_WIDTH, TREE_HEIGHT); }
      const paint = (tree: typeof art, opacity: number) => tree.layers.forEach((layer, i) => {
        context.save(); context.globalAlpha = opacity;
        context.translate(450, 850); context.rotate(Math.sin(clock * .72 + i * .4) * wind * .0014 * (i + 1)); context.translate(-450, -850);
        context.drawImage(layer, 0, 0); context.restore();
      });
      if (previous && transition < 1) paint(previous, 1 - transition);
      paint(art, transition);
      if (previous && transition === 1) { previous.destroy(); previous = null; }
      spawn = Math.min(2, spawn + seconds * clamp(config.fallRate, 0, 15));
      while (spawn >= 1 && falling.length < 45) { spawn--; addLeaf(); }
      for (let i = falling.length - 1; i >= 0; i--) {
        const leaf = falling[i];
        leaf.y += seconds * leaf.speed; leaf.x += seconds * (leaf.drift + Math.sin(clock * 1.5 + leaf.phase) * wind * 24); leaf.rotation += seconds * .9;
        context.globalAlpha = Math.min(1, Math.max(0, (TREE_HEIGHT - leaf.y) / 70));
        if (currentSeason === "winter") {
          context.fillStyle = leaf.color; context.beginPath(); context.arc(leaf.x, leaf.y, leaf.size * .3, 0, Math.PI * 2); context.fill();
        } else paintTreeLeaf(context, { ...leaf, w: leaf.size, h: leaf.size * (.4 + Math.abs(Math.cos(clock * 1.7 + leaf.phase)) * .3), blossom: currentSeason === "pink" });
        if (leaf.y > TREE_HEIGHT || leaf.x < -15 || leaf.x > TREE_WIDTH + 15) falling.splice(i, 1);
      }
      context.restore();
    }, { pixelSize });
    redraw.current = renderer.redraw;
    return () => { redraw.current = null; renderer.destroy(); art.destroy(); previous?.destroy(); };
  }, [pixelSize]);
  return <div className={cn("creative-surface season-tree", className)} data-theme={resolved} data-appearance={appearance} style={{ "--tree-size": typeof size === "number" ? size + "px" : size } as CSSProperties}>
    <canvas ref={canvas} className="season-tree-canvas" role="img" aria-label={activeSeason === "winter" ? "Winter tree with snow on its bare branches" : TREE_SEASONS.find((item) => item.value === activeSeason)?.label + " tree with falling " + (activeSeason === "pink" ? "blossoms" : "leaves")} />
    {showPicker && <div className="season-tree-picker" role="group" aria-label="Tree season">{TREE_SEASONS.map(({ value, label }) => <button key={value} type="button" aria-pressed={value === activeSeason} onClick={() => { if (season === undefined) setLocalSeason(value); onSeasonChange?.(value); }}><span style={{ backgroundColor: TREE_PALETTES[value].leaves[3] }} />{label}</button>)}</div>}
  </div>;
}
