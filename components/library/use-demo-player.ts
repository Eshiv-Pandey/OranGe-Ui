"use client";
import { useEffect, useRef, useState } from "react";
import { copyCanvasFrame } from "../ui/canvas-frame";

export type DemoStep = { t: number; action: "move" | "hover" | "click" | "leave"; to?: "center" | string | { x: number; y: number } };
export const DEFAULT_DEMO: DemoStep[] = [{ t: 0, action: "move", to: "center" }, { t: 800, action: "hover" }, { t: 1800, action: "click" }, { t: 3000, action: "leave" }];
type Player = { visible: boolean; human: number; reduced: boolean; update: (active: boolean) => void };
const players = new Set<Player>();
function balance() { const active = [...players].filter(p => p.visible && (p.human || !p.reduced) && !document.hidden).sort((a, b) => b.human - a.human).slice(0, 6); players.forEach(p => p.update(active.includes(p))); }
// Synthetic events do not set :hover. Mirror existing rules, without changing components.
const copiedRules = new Set<string>(), scannedSheets = new WeakSet<CSSStyleSheet>();
function hoverRules() {
  const style = document.getElementById("preview-hover-rules") as HTMLStyleElement | null ?? Object.assign(document.createElement("style"), { id: "preview-hover-rules" });
  if (!style.isConnected) document.head.append(style);
  const copy = (rules: CSSRuleList, parents: string[] = []) => { for (const rule of Array.from(rules)) {
    if (rule instanceof CSSStyleRule && rule.selectorText.includes(":hover")) { const text = parents.reduceRight((css, parent) => `${parent}{${css}}`, `@scope (.demo-preview) {${rule.cssText.replaceAll(":hover", "[data-preview-hover]")}}`); if (!copiedRules.has(text)) { copiedRules.add(text); style.sheet?.insertRule(text, style.sheet.cssRules.length); } }
    else if ("cssRules" in rule && !(rule instanceof CSSStyleRule)) copy((rule as CSSGroupingRule).cssRules, [...parents, rule.cssText.slice(0, rule.cssText.indexOf("{"))]);
  } };
  for (const sheet of Array.from(document.styleSheets)) if (sheet !== style.sheet && !scannedSheets.has(sheet)) { try { copy(sheet.cssRules); scannedSheets.add(sheet); } catch { /* Cross-origin styles are intentionally inaccessible. */ } }
}

export function useDemoPlayer(demo = DEFAULT_DEMO, autonomous = false) {
  const root = useRef<HTMLDivElement>(null), live = useRef<HTMLDivElement>(null), still = useRef<HTMLDivElement>(null), cursor = useRef<HTMLSpanElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const node = root.current!, surface = node.closest(".component-tile") ?? node, media = matchMedia("(prefers-reduced-motion: reduce)");
    let running = false, primed = false, destroyed = false, emitting = false, frame = 0, capture = 0, elapsed = 0, previous = 0, index = 0, humanTimer = 0, freezeTimer = 0;
    let target: Element | null = null, destination: DemoStep["to"] = "center", x = -18, y = 20, tx = 0, ty = 0;
    const emit = (el: Element, type: string, px = x, py = y) => { const box = node.getBoundingClientRect(); emitting = true; try { el.dispatchEvent(new PointerEvent(type, { bubbles: !["pointerenter", "pointerleave"].includes(type), cancelable: true, pointerId: 47, pointerType: "mouse", isPrimary: true, clientX: box.left + px, clientY: box.top + py, buttons: type === "pointerdown" ? 1 : 0 })); } finally { emitting = false; } };
    const leave = () => { if (target) { emit(target, "pointerout"); emit(target, "pointerleave"); } node.querySelectorAll("[data-preview-hover]").forEach(el => el.removeAttribute("data-preview-hover")); target = null; };
    const stop = () => { cancelAnimationFrame(frame); frame = 0; previous = 0; elapsed = 0; index = 0; leave(); cursor.current?.getAnimations({ subtree: true }).forEach(a => a.cancel()); node.dataset.cursor = "false"; };
    const freeze = () => {
      if (running || destroyed || !live.current?.firstChild || !still.current || live.current.querySelector("[data-preview-pending]")) return;
      const snapshot = live.current.cloneNode(true) as HTMLElement;
      snapshot.querySelectorAll("canvas").forEach((canvas, i) => { try { copyCanvasFrame(live.current!.querySelectorAll("canvas")[i], canvas); } catch { canvas.remove(); } });
      snapshot.querySelectorAll("input,textarea,select").forEach((el, i) => { const original = live.current!.querySelectorAll<HTMLInputElement>("input,textarea,select")[i]; if (original.type !== "file") (el as HTMLInputElement).value = original.value; if (el instanceof HTMLInputElement) el.checked = original.checked; });
      still.current.replaceChildren(snapshot); primed = true; setMounted(false);
    };
    const locate = () => {
      const box = node.getBoundingClientRect(); let el: Element | null = null;
      if (typeof destination === "string" && destination !== "center") { try { el = live.current?.querySelector(destination) ?? null; } catch { /* Invalid or missing selectors fall back to the preview center. */ } }
      if (destination === "center") el = live.current?.querySelector("button:not(:disabled),[role=button],input:not(:disabled),canvas") ?? null;
      const rect = el?.getBoundingClientRect(); tx = rect ? rect.left - box.left + rect.width / 2 : box.width * (typeof destination === "object" ? destination.x / 100 : .5); ty = rect ? rect.top - box.top + rect.height / 2 : box.height * (typeof destination === "object" ? destination.y / 100 : .5);
      return el ?? (document.elementFromPoint?.(box.left + tx, box.top + ty) && live.current?.contains(document.elementFromPoint(box.left + tx, box.top + ty)) ? document.elementFromPoint(box.left + tx, box.top + ty) : live.current);
    };
    const tick = (now: number) => {
      if (!running || player.reduced || player.human || autonomous || !live.current) return;
      elapsed += previous ? Math.min(now - previous, 50) : 0; previous = now;
      while (index < demo.length && elapsed >= demo[index].t) {
        const step = demo[index++]; destination = step.to ?? destination; const next = locate();
        if (step.action === "leave") { leave(); node.dataset.cursor = "false"; }
        else if (next) {
          if (target !== next) { leave(); target = next; emit(next, "pointerover", tx, ty); emit(next, "pointerenter", tx, ty); for (let el: Element | null = next; el && el !== node; el = el.parentElement) el.setAttribute("data-preview-hover", ""); }
          node.dataset.cursor = "true";
          if (step.action === "click") { x = tx; y = ty; if (!next.closest("a[href],input[type=file],[aria-haspopup]")) { emit(next, "pointerdown"); emit(next, "pointerup"); emit(next, "click"); } cursor.current?.querySelector("i")?.animate([{ transform: "scale(.3)", opacity: .75 }, { transform: "scale(2.3)", opacity: 0 }], { duration: 480, easing: "ease-out" }); }
        }
      }
      x += (tx - x) * .13; y += (ty - y) * .13; if (cursor.current) cursor.current.style.transform = `translate3d(${x}px,${y}px,0)`; if (target) emit(target, "pointermove");
      if (elapsed > (demo.at(-1)?.t ?? 3000) + 1100) { elapsed = 0; index = 0; x = -18; y = 20; hoverRules(); }
      frame = requestAnimationFrame(tick);
    };
    const player: Player = { visible: false, human: 0, reduced: media.matches, update(active) {
      const changed = active !== running; running = active; node.dataset.playing = String(active && !player.reduced); node.dataset.motion = active && !player.reduced ? "running" : "paused";
      if (active || player.visible && !primed) { clearTimeout(freezeTimer); freezeTimer = 0; setMounted(true); }
      if (!active) { stop(); if (!freezeTimer) freezeTimer = window.setTimeout(() => { freezeTimer = 0; if (document.hidden) freeze(); else capture = requestAnimationFrame(freeze); }, primed ? 0 : 180); }
      else if ((changed || !frame) && !player.reduced && !player.human && !autonomous) { hoverRules(); frame = requestAnimationFrame(tick); }
    } };
    const resume = () => { if (node.contains(document.activeElement)) { humanTimer = window.setTimeout(resume, 2000); return; } player.human = 0; balance(); };
    const human = (event: Event) => { if (!event.isTrusted || emitting) return; stop(); clearTimeout(humanTimer); player.human = performance.now() || 1; balance(); humanTimer = window.setTimeout(resume, 2000); };
    const visibility = () => balance(), preference = () => { player.reduced = media.matches; balance(); };
    const content = new MutationObserver(() => { if (!running && live.current?.firstChild && !live.current.querySelector("[data-preview-pending]")) { clearTimeout(freezeTimer); freezeTimer = window.setTimeout(() => { freezeTimer = 0; capture = requestAnimationFrame(freeze); }, 100); } }); content.observe(node, { childList: true, subtree: true });
    players.add(player); const observer = new IntersectionObserver(([entry]) => { player.visible = entry.isIntersecting; balance(); }, { threshold: .08 }); observer.observe(node);
    surface.addEventListener("pointermove", human); surface.addEventListener("pointerdown", human); surface.addEventListener("focusin", human); document.addEventListener("visibilitychange", visibility); media.addEventListener("change", preference);
    return () => { destroyed = true; stop(); cancelAnimationFrame(capture); clearTimeout(humanTimer); clearTimeout(freezeTimer); observer.disconnect(); content.disconnect(); players.delete(player); balance(); surface.removeEventListener("pointermove", human); surface.removeEventListener("pointerdown", human); surface.removeEventListener("focusin", human); document.removeEventListener("visibilitychange", visibility); media.removeEventListener("change", preference); };
  }, [demo, autonomous]);
  return { root, live, still, cursor, mounted };
}
