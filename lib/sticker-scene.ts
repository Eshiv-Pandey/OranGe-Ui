import { getSticker, STICKERS, stickerSvg, type StickerName } from "../components/ui/sticker-artwork";
import { DEFAULT_STICKER_OPTIONS, type StickerOptions } from "./sticker-options";

export const STICKER_SCENE_WIDTH = 960;
export const STICKER_SCENE_HEIGHT = 600;
export const STICKER_CANVAS_BACKGROUNDS = [
  { name: "Paper", color: "#faf9f6" },
  { name: "White", color: "#ffffff" },
  { name: "Ink", color: "#171923" },
  { name: "Lavender", color: "#eeeaff" },
] as const;
export type StickerPlacement = StickerOptions & { id: string; name: StickerName; x: number; y: number };
export type StickerScene = { caption: string; background: string; placements: StickerPlacement[] };
const clamp = (value: number, min: number, max: number, fallback: number) => Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
const precision = (value: number) => Math.round(value * 100) / 100;

/** Keep finite, editable geometry while allowing intentional artwork bleed beyond the canvas. */
export function boundStickerPlacement(placement: StickerPlacement): StickerPlacement {
  const size = clamp(placement.size, 48, 360, 160), rotate = clamp(placement.rotate, -180, 180, 0);
  const motion = (["bounce", "wiggle", "spin", "none"] as const).includes(placement.motion) ? placement.motion : "bounce";
  return { ...DEFAULT_STICKER_OPTIONS, ...placement, size: precision(size), rotate: precision(rotate), motion, duration: precision(clamp(placement.duration, 200, 2000, 650)), intensity: precision(clamp(placement.intensity, .25, 2, 1)), shadow: placement.shadow !== false, x: precision(clamp(placement.x, -50, 150, 50)), y: precision(clamp(placement.y, -50, 150, 50)) };
}

/** The layer list is front-to-back; placements are stored back-to-front for rendering and exports. */
export function moveStickerLayer(placements: StickerPlacement[], id: string, frontIndex: number): StickerPlacement[] {
  const moving = placements.find(placement => placement.id === id);
  if (!moving) return placements;
  const frontFirst = placements.filter(placement => placement.id !== id).reverse();
  frontFirst.splice(Math.round(clamp(frontIndex, 0, frontFirst.length, 0)), 0, moving);
  return frontFirst.reverse();
}

function canvasLuminance(background: string): number {
  if (!/^#[\da-f]{6}$/i.test(background)) return 1;
  const [red, green, blue] = [1, 3, 5].map(start => parseInt(background.slice(start, start + 2), 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return .2126 * red + .7152 * green + .0722 * blue;
}

/** Retain the workspace lettering colors when readable, with a contrast-safe fallback for middle tones. */
export function stickerCanvasCaptionColor(background: string): string {
  const luminance = canvasLuminance(background);
  const contrast = (color: string) => (Math.max(luminance, canvasLuminance(color)) + .05) / (Math.min(luminance, canvasLuminance(color)) + .05);
  const preferred = contrast("#f4f3f0") > contrast("#25242b") ? "#f4f3f0" : "#25242b";
  if (contrast(preferred) >= 4.5) return preferred;
  return contrast("#ffffff") > contrast("#000000") ? "#ffffff" : "#000000";
}

export function stickerCanvasIsDark(background: string): boolean {
  const caption = stickerCanvasCaptionColor(background);
  return caption === "#f4f3f0" || caption === "#ffffff";
}

/** Validate output independently of editor state so downloaded code contains only supported art and finite geometry. */
export function normalizeStickerScene(scene: StickerScene): StickerScene {
  const validNames = new Set<string>(STICKERS.map(sticker => sticker.name));
  const placements = scene.placements.filter(placement => validNames.has(placement.name)).slice(0, 80).map((placement, index) => boundStickerPlacement({ ...placement, id: `sticker-${index + 1}`, finish: placement.finish === "sharp" ? "sharp" : "playful" }));
  return { caption: String(scene.caption).slice(0, 120), background: scene.background === "transparent" || /^#[\da-f]{6}$/i.test(scene.background) ? scene.background : STICKER_CANVAS_BACKGROUNDS[0].color, placements };
}
export function stickerSceneJson(scene: StickerScene): string {
  return JSON.stringify({ version: 1, width: STICKER_SCENE_WIDTH, height: STICKER_SCENE_HEIGHT, ...normalizeStickerScene(scene) }, null, 2);
}
const escapeHtml = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
const codeString = (value: string) => JSON.stringify(value).replaceAll("<", "\\u003c").replaceAll(">", "\\u003e").replaceAll("\u2028", "\\u2028").replaceAll("\u2029", "\\u2029");

export function stickerSceneReact(scene: StickerScene): string {
  const clean = normalizeStickerScene(scene);
  return `"use client";\n\nimport { Sticker } from "orangeui-stickers";\nimport "orangeui-stickers/styles.css";\n\n/** Responsive layout authored in the oRangeUi sticker playground. */\nexport default function MyStickerCanvas() {\n  return (\n    <div aria-label="My sticker canvas" style={{ position: "relative", width: "100%", aspectRatio: "${STICKER_SCENE_WIDTH} / ${STICKER_SCENE_HEIGHT}", overflow: "hidden", background: ${codeString(clean.background)}, isolation: "isolate" }}>\n      <p style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", margin: 0, padding: "10%", textAlign: "center", fontFamily: "Arial, sans-serif", fontSize: "clamp(20px, 5vw, 64px)", fontWeight: 600, letterSpacing: "-0.035em", lineHeight: 1.05, color: ${codeString(stickerCanvasCaptionColor(clean.background))}, pointerEvents: "none" }}>{${codeString(clean.caption)}}</p>\n${clean.placements.map(placement => `      <div style={{ position: "absolute", left: "${placement.x}%", top: "${placement.y}%", width: "${precision(placement.size / STICKER_SCENE_WIDTH * 100)}%", transform: "translate(-50%, -50%)" }}>\n        <Sticker name=${codeString(placement.name)} finish=${codeString(placement.finish)} size="100%" rotate={${placement.rotate}} motion=${codeString(placement.motion)} duration={${placement.duration}} intensity={${placement.intensity}} shadow={${placement.shadow}} interactive />\n      </div>`).join("\n")}\n    </div>\n  );\n}\n`;
}

export function stickerSceneHtml(scene: StickerScene): string {
  const clean = normalizeStickerScene(scene), dark = stickerCanvasIsDark(clean.background);
  return `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>My sticker canvas</title>\n<style>\n*{box-sizing:border-box}body{margin:0;background:${clean.background};font-family:Arial,sans-serif}.sticker-canvas{position:relative;width:100%;aspect-ratio:${STICKER_SCENE_WIDTH}/${STICKER_SCENE_HEIGHT};overflow:hidden;isolation:isolate}.sticker-caption{position:absolute;inset:0;display:grid;place-items:center;margin:0;padding:10%;text-align:center;font-size:clamp(20px,5vw,64px);font-weight:600;letter-spacing:-.035em;line-height:1.05;color:${stickerCanvasCaptionColor(clean.background)};pointer-events:none}.sticker-position{position:absolute;transform:translate(-50%,-50%)}.sticker-button{display:block;width:100%;aspect-ratio:1;border:0;padding:0;background:transparent;cursor:pointer;transform:rotate(var(--rotation));-webkit-tap-highlight-color:transparent}.sticker-button:focus-visible{outline:2px solid ${dark ? "#ffb36b" : "#c14900"};outline-offset:5px;border-radius:8px}.sticker-art{display:block;width:100%;height:100%;transform-origin:50% 50%;filter:drop-shadow(0 3px 2px rgb(18 26 44 / .15))}.sticker-art svg{display:block;width:100%;height:100%} @media(prefers-reduced-motion:reduce){.sticker-art{animation:none!important}}\n</style>\n</head>\n<body>\n<main class="sticker-canvas" aria-label="My sticker canvas">\n<p class="sticker-caption">${escapeHtml(clean.caption)}</p>\n${clean.placements.map(placement => `<div class="sticker-position" style="left:${placement.x}%;top:${placement.y}%;width:${precision(placement.size / STICKER_SCENE_WIDTH * 100)}%"><button type="button" class="sticker-button" data-motion="${placement.motion}" data-duration="${placement.duration}" data-intensity="${placement.intensity}" style="--rotation:${placement.rotate}deg" aria-label="Animate ${escapeHtml(getSticker(placement.name).title)}"><span class="sticker-art"${placement.shadow ? "" : ' style="filter:none"'}>${stickerSvg(placement.name, 512, placement.finish).replace('role="img"', 'aria-hidden="true"')}</span></button></div>`).join("\n")}\n</main>\n<script>\ndocument.querySelectorAll('.sticker-button').forEach(function(button){button.addEventListener('click',function(){var motion=button.dataset.motion;if(motion==='none'||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;var art=button.querySelector('.sticker-art'),i=Number(button.dataset.intensity),frames;art.getAnimations().forEach(function(animation){animation.cancel()});if(motion==='wiggle'){frames=[{transform:'rotate(0deg)'},{transform:'rotate('+(-10*i)+'deg)',offset:.15},{transform:'rotate('+(8*i)+'deg)',offset:.35},{transform:'rotate('+(-5*i)+'deg)',offset:.55},{transform:'rotate('+(2*i)+'deg)',offset:.75},{transform:'rotate(0deg)'}]}else if(motion==='spin'){frames=[{transform:'rotate(0deg) scale(1)'},{transform:'rotate(60deg) scale(.9)',offset:.25},{transform:'rotate(390deg) scale(1.04)',offset:.76},{transform:'rotate(360deg) scale(1)'}]}else{frames=[{transform:'translateY(0) scale(1) rotate(0deg)'},{transform:'translateY('+(1.5*i)+'%) scale(1.06,.9) rotate(-3deg)',offset:.18},{transform:'translateY('+(-5*i)+'%) scale(.96,1.07) rotate(5deg)',offset:.42},{transform:'translateY(1%) scale(1.02,.98) rotate(-2deg)',offset:.68},{transform:'translateY(0) scale(1) rotate(0deg)'}]}art.animate(frames,{duration:Number(button.dataset.duration),easing:motion==='wiggle'?'ease-out':'cubic-bezier(.2,.8,.2,1)'})})});\n</script>\n</body>\n</html>\n`;
}
