"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import type { Appearance } from "./appearance";
import { createCreativeCanvas, useCreativeTheme, clamp, type CreativeTheme, type CreativeSize } from "./creative-surface";
import { createSeasonFoliage, paintTreeBranches, seededTreeRandom, TREE_PALETTES, TREE_SEASONS, type TreeSeason, type TreeTile } from "./season-tree-art";
import "../../styles/season-tree.css";

export type SeasonTreeProps = {
  season?: TreeSeason; onSeasonChange?: (season: TreeSeason) => void; showPicker?: boolean;
  windStrength?: number; fallRate?: number; pixelSize?: number; background?: string; paused?: boolean;
  size?: CreativeSize; theme?: CreativeTheme; appearance?: Appearance; className?: string;
};
type FallingLeaf = { x: number; y: number; rotation: number; speed: number; drift: number; color: string };

export function SeasonTree({ season, onSeasonChange, showPicker = true, windStrength = 0.6, fallRate = 1, pixelSize = 3, background, paused = false, size = 340, theme = "auto", className }: SeasonTreeProps) {
  const [localSeason, setLocalSeason] = useState<TreeSeason>("yellow"), activeSeason = season ?? localSeason;
  const resolved = useCreativeTheme(theme), canvas = useRef<HTMLCanvasElement>(null);
  const latest = useRef({ season: activeSeason, windStrength, fallRate, paused, resolved, background });
  const redraw = useRef<(() => void) | null>(null);
  useEffect(() => { latest.current = { season: activeSeason, windStrength, fallRate, paused, resolved, background }; redraw.current?.(); }, [activeSeason, windStrength, fallRate, paused, resolved, background]);
  useEffect(() => {
    const element = canvas.current; if (!element) return;
    let currentSeason = latest.current.season, foliage = createSeasonFoliage(currentSeason), previous: TreeTile[] = [], transition = 1, clock = 0, spawn = 0;
    const random = seededTreeRandom(872), falling: FallingLeaf[] = [], ground: FallingLeaf[] = [];
    const renderer = createCreativeCanvas(element, (context, frame) => {
      const config = latest.current;
      if (currentSeason !== config.season) {
        previous = foliage; foliage = createSeasonFoliage(config.season); currentSeason = config.season; transition = frame.reduced || config.paused ? 1 : 0;
        falling.length = 0; ground.length = 0;
      }
      const seconds = !frame.reduced && !config.paused ? frame.delta / 1000 : 0;
      clock += seconds; transition = Math.min(1, transition + seconds * 2.3);
      const palette = TREE_PALETTES[currentSeason], wind = clamp(config.windStrength, 0, 4);
      context.clearRect(0, 0, frame.width, frame.height);
      context.save(); context.scale(frame.width / 128, frame.height / 138);
      if (config.background && config.background !== "transparent") { context.fillStyle = config.background; context.fillRect(0, 0, 128, 138); }
      context.fillStyle = palette.ground; context.fillRect(15, 122, 101, 2); context.fillRect(23, 124, 80, 3);
      context.fillStyle = currentSeason === "winter" ? "#edf8ff" : "#f1af5b"; context.fillRect(40, 126, 46, 2);
      const paintFoliage = (tiles: TreeTile[], opacity: number, front: boolean) => {
        context.globalAlpha = opacity;
        for (const leaf of tiles) {
          if ((leaf.layer > 0.83) !== front) continue;
          const sway = Math.round(Math.sin(clock * 1.2 + leaf.y * 0.04) * wind * (leaf.y < 70 ? 0.8 : 0.3));
          context.fillStyle = leaf.color; context.fillRect(leaf.x + sway, leaf.y, leaf.w, leaf.h);
          if (currentSeason === "red" && leaf.layer > 0.7) context.fillRect(leaf.x + sway + 2, leaf.y - 2, 2, leaf.h + 4);
        }
        context.globalAlpha = 1;
      };
      if (transition < 1) paintFoliage(previous, 1 - transition, false);
      paintFoliage(foliage, transition, false); paintTreeBranches(context, currentSeason === "winter");
      if (transition < 1) paintFoliage(previous, (1 - transition) * 0.9, true);
      paintFoliage(foliage, transition, true);
      spawn += seconds * clamp(config.fallRate, 0, 15);
      while (spawn >= 1 && falling.length < 45) {
        spawn--;
        const origin = foliage[Math.floor(random() * foliage.length)];
        falling.push({ x: origin?.x ?? 20 + random() * 90, y: currentSeason === "winter" ? random() * 35 : origin?.y ?? 40, rotation: random() * 6, speed: 10 + random() * 10, drift: random() * 2 - 1, color: palette.fallen[Math.floor(random() * 3)] });
      }
      for (let index = falling.length - 1; index >= 0; index--) {
        const leaf = falling[index];
        leaf.y += seconds * leaf.speed; leaf.x += seconds * (leaf.drift + Math.sin(leaf.y / 7) * wind * 3); leaf.rotation += seconds * 1.4;
        context.save(); context.translate(Math.round(leaf.x), Math.round(leaf.y)); context.rotate(leaf.rotation); context.fillStyle = leaf.color;
        context.fillRect(-1, -1, currentSeason === "winter" ? 2 : 4, 2); context.restore();
        if (leaf.y >= 121) { ground.push({ ...leaf, y: 123 + random() * 3 }); if (ground.length > 28) ground.shift(); falling.splice(index, 1); }
      }
      const settled = ground.length ? ground : [{ x: 39, y: 120, rotation: 0, speed: 0, drift: 0, color: palette.fallen[0] }, { x: 92, y: 120, rotation: 0, speed: 0, drift: 0, color: palette.fallen[1] }];
      for (const leaf of settled) { context.fillStyle = leaf.color; context.fillRect(Math.round(leaf.x), Math.round(leaf.y), 4, 2); }
      context.restore();
    }, { pixelSize });
    redraw.current = renderer.redraw;
    return () => { redraw.current = null; renderer.destroy(); };
  }, [pixelSize]);
  return <div className={cn("creative-surface season-tree", className)} data-theme={resolved} data-appearance="pixel" style={{ "--tree-size": typeof size === "number" ? size + "px" : size } as CSSProperties}>
    <canvas ref={canvas} className="season-tree-canvas" role="img" aria-label={TREE_SEASONS.find((item) => item.value === activeSeason)?.label + " pixel tree with falling leaves"} />
    {showPicker && <div className="season-tree-picker" role="group" aria-label="Tree season">{TREE_SEASONS.map(({ value, label }) => <button key={value} type="button" aria-pressed={activeSeason === value} onClick={() => { if (season === undefined) setLocalSeason(value); onSeasonChange?.(value); }}><span style={{ background: TREE_PALETTES[value].leaves[0] }} aria-hidden="true" />{label}</button>)}</div>}
  </div>;
}
