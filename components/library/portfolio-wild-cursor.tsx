"use client";

import { useEffect, useRef } from "react";
import { WILD_BRUSH, WILD_CELL, setWildHeatSampler, wildColor, wildHash } from "../ui/portfolio/wild-pixels";
import styles from "../../styles/portfolio-wild.module.css";

type Point = { x: number; y: number };
type Wave = Point & { bornAt: number; power: number };
type HeartSpark = Point & { vx: number; vy: number; life: number };
const INTERACTIVE = "a, button, input, textarea, select, summary, [role='button'], [contenteditable='true'], [data-cursor-ignore]";
const PACMAN_IDLE_MS = 6500;
const HEART = [
  [2, 1], [3, 1], [5, 1], [6, 1],
  [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2],
  [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3],
  [2, 4], [3, 4], [4, 4], [5, 4], [6, 4],
  [3, 5], [4, 5], [5, 5], [4, 6],
];

/** The reference's thermal cursor, charged waves, scrolling and idle Pac-Man. */
export function WildCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const touch = window.matchMedia("(hover: none), (pointer: coarse)");
    const seed = Math.random() * 1000;
    let width = 0, height = 0, columns = 0, rows = 0;
    let heat = new Float32Array(0), dissolve = new Float32Array(0);
    let frame = 0, lastFrame = 0, elapsed = 0, shake = 0;
    let pointer: Point | null = null, previous: Point | null = null;
    let lastActivity = 0;
    let press: (Point & { startedAt: number; pointerId: number }) | null = null;
    let pac: (Point & { direction: number; startX: number; age: number }) | null = null;
    let hero: HTMLElement | null = null;
    let heartStart: HTMLElement | null = null, heartEnd: HTMLElement | null = null;
    let heartActive = false;
    let scrollTargets: HTMLElement[] = [];
    const waves: Wave[] = [];
    const heartSparks: HeartSpark[] = [];

    function clear() {
      cancelAnimationFrame(frame);
      frame = 0;
      heat.fill(0);
      dissolve.fill(0);
      waves.length = 0;
      heartSparks.length = 0;
      heartActive = false;
      pointer = previous = pac = press = null;
      shake = 0;
      context!.clearRect(0, 0, width, height);
      canvas!.dataset.active = "false";
      canvas!.dataset.shape = "cloud";
    }

    function resize() {
      clear();
      width = window.innerWidth;
      height = window.innerHeight;
      columns = Math.ceil(width / WILD_CELL) + 1;
      rows = Math.ceil(height / WILD_CELL) + 1;
      heat = new Float32Array(columns * rows);
      dissolve = new Float32Array(columns * rows);
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.round(width * ratio);
      canvas!.height = Math.round(height * ratio);
      context!.setTransform(ratio, 0, 0, ratio, 0, 0);
      context!.imageSmoothingEnabled = false;
      hero = document.querySelector("[data-cursor-hero]");
      heartStart = document.getElementById("skills");
      heartEnd = document.getElementById("highlights");
      scrollTargets = Array.from(document.querySelectorAll("[data-wild-scroll-target], [data-hero-controls] button"));
    }

    function start() {
      if (frame || reducedMotion.matches || document.hidden) return;
      lastFrame = performance.now();
      canvas!.dataset.active = "true";
      frame = requestAnimationFrame(render);
    }

    function deposit(x: number, y: number, amount: number, sigma: number) {
      const cc = x / WILD_CELL, cr = y / WILD_CELL;
      const radius = Math.ceil(sigma * 1.6), inverse = 1 / (2 * sigma * sigma * 0.18);
      for (let dr = -radius; dr <= radius; dr++) {
        for (let dc = -radius; dc <= radius; dc++) {
          const column = Math.trunc(cc + dc), row = Math.trunc(cr + dr);
          if (column < 0 || row < 0 || column >= columns || row >= rows) continue;
          const dx = column + 0.5 - cc, dy = row + 0.5 - cr;
          const weight = Math.exp(-(dx * dx + dy * dy) * inverse);
          if (weight < 0.02) continue;
          const index = row * columns + column;
          heat[index] = Math.min(1, heat[index] + amount * weight);
        }
      }
    }

    function follow(target: Point, sigma: number) {
      const from = previous ?? target;
      const dx = target.x - from.x, dy = target.y - from.y;
      const samples = Math.max(1, Math.min(48, Math.round(Math.hypot(dx, dy) / (WILD_CELL * 0.8))));
      for (let sample = 1; sample <= samples; sample++) {
        const progress = sample / samples;
        deposit(from.x + dx * progress, from.y + dy * progress, 0.16, sigma);
      }
      previous = { ...target };
    }

    function stampHeart(target: Point) {
      const scale = touch.matches ? 1 : 2;
      const offset = touch.matches ? 0 : window.scrollY % WILD_CELL;
      const centerColumn = Math.round(target.x / WILD_CELL), centerRow = Math.round((target.y + offset) / WILD_CELL);
      for (const [x, y] of HEART) {
        for (let dy = 0; dy < scale; dy++) {
          for (let dx = 0; dx < scale; dx++) {
            const column = centerColumn + (x - 4) * scale + dx;
            const row = centerRow + (y - 4) * scale + dy;
            if (column < 0 || row < 0 || column >= columns || row >= rows) continue;
            const index = row * columns + column;
            heat[index] = Math.max(heat[index], 0.86 + 0.12 * Math.sin((column + row) * 0.6 - elapsed * 0.006));
          }
        }
      }
    }

    function popHeart(target: Point) {
      heat.fill(0);
      dissolve.fill(0);
      for (let i = 0; i < 16; i++) {
        const angle = i / 16 * Math.PI * 2;
        const speed = 3 + wildHash(i, target.x, seed) * 3;
        heartSparks.push({ ...target, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1 });
      }
    }

    function wander(target: Point, step: number) {
      const radius = WILD_BRUSH * 3.4;
      if (!pac) pac = { ...target, direction: target.x < width / 2 ? 1 : -1, startX: target.x, age: 0 };
      pac.age += step;
      pac.x += pac.direction * 2.6 * step;
      if (pac.x > width + radius + 12 || pac.x < -radius - 12) {
        pac.direction = Math.random() < 0.5 ? 1 : -1;
        pac.y = 70 + Math.random() * Math.max(1, height - 140);
        pac.x = pac.direction > 0 ? -radius : width + radius;
        pac.startX = pac.x;
        pac.age = 0;
      }
      const pelletRow = Math.round(pac.y / WILD_CELL);
      for (let k = 1; k <= 80; k++) {
        const x = pac.startX + pac.direction * radius * k;
        const column = Math.round(x / WILD_CELL);
        if (column >= 0 && column < columns && pelletRow >= 0 && pelletRow < rows && pac.direction * (x - pac.x) > radius * 0.7) {
          const index = pelletRow * columns + column;
          heat[index] = Math.max(heat[index], 0.72);
        }
      }
      const angle = pac.direction > 0 ? 0 : Math.PI;
      const mouth = 0.05 + 0.6 * Math.abs(Math.sin(pac.age * 0.16));
      for (let row = Math.max(0, Math.floor((pac.y - radius) / WILD_CELL)); row <= Math.min(rows - 1, Math.ceil((pac.y + radius) / WILD_CELL)); row++) {
        for (let column = Math.max(0, Math.floor((pac.x - radius) / WILD_CELL)); column <= Math.min(columns - 1, Math.ceil((pac.x + radius) / WILD_CELL)); column++) {
          const dx = (column + 0.5) * WILD_CELL - pac.x, dy = (row + 0.5) * WILD_CELL - pac.y;
          if (dx * dx + dy * dy > radius * radius) continue;
          const difference = Math.abs(((Math.atan2(dy, dx) - angle) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI);
          if (difference < mouth) continue;
          const index = row * columns + column;
          heat[index] = Math.max(heat[index], 0.72 + 0.03 * Math.sin((column + row) * 0.7 - elapsed * 0.01));
        }
      }
    }

    function paintWaves(now: number, heroBottom: number) {
      for (let wi = waves.length - 1; wi >= 0; wi--) {
        const wave = waves[wi], age = (now - wave.bornAt) / 1000;
        if (age > 1.5) { waves.splice(wi, 1); continue; }
        const radius = age * Math.hypot(width, height) * 1.7;
        const sigma = WILD_CELL * 5.5 * wave.power;
        const amplitude = Math.max(0, 1 - age / 1.5) * 1.2 * wave.power;
        const inverse = 1 / (2 * sigma * sigma);
        for (let row = 0; row < rows; row++) {
          for (let column = 0; column < columns; column++) {
            const distance = Math.hypot((column + 0.5) * WILD_CELL - wave.x, (row + 0.5) * WILD_CELL - wave.y);
            const value = amplitude * Math.exp(-((distance - radius) ** 2) * inverse);
            if (value <= 0.02) continue;
            const index = row * columns + column;
            heat[index] = Math.max(heat[index], value);
            if ((row + 0.5) * WILD_CELL > heroBottom && value > 0.25 && dissolve[index] === 0) {
              dissolve[index] = 0.45 + wildHash(column, row, seed) * 0.7;
            }
          }
        }
      }
    }

    function render(now: number) {
      const step = Math.max(0.25, Math.min((now - lastFrame) / (1000 / 60), 2.4));
      elapsed += now - lastFrame;
      lastFrame = now;
      const heroBottom = hero?.getBoundingClientRect().bottom ?? 0;
      for (let i = 0; i < heat.length; i++) {
        if (dissolve[i] > 0 && Math.floor(i / columns) * WILD_CELL > heroBottom) {
          dissolve[i] -= 0.007 * step;
          if (dissolve[i] <= 0) { dissolve[i] = 0; heat[i] = 0; }
          else if (dissolve[i] < 0.3) heat[i] *= Math.pow(0.88, step);
          else heat[i] = Math.max(heat[i] * Math.pow(0.95, step), 0.9);
        } else {
          dissolve[i] = 0;
          heat[i] *= Math.pow(touch.matches ? 0.85 : 0.878, step);
          if (heat[i] < 0.003) heat[i] = 0;
        }
      }

      if (touch.matches) {
        const scrollY = window.scrollY;
        let target = {
          x: width * 0.5 + Math.sin(scrollY * 0.0026 + 0.6) * width * 0.33,
          y: height * 0.5 + Math.sin(scrollY * 0.0052) * height * 0.2,
        };
        let closest = height * 0.42;
        for (const element of scrollTargets) {
          const bounds = element.getBoundingClientRect();
          if (bounds.width < 2 || bounds.bottom < 0 || bounds.top > height) continue;
          const cy = bounds.top + bounds.height / 2, distance = Math.abs(cy - height * 0.5);
          if (distance < closest) { closest = distance; target = { x: bounds.left + bounds.width / 2, y: cy }; }
        }
        if (!pointer) pointer = { ...target };
        pointer.x += (target.x - pointer.x) * (1 - Math.pow(0.89, step));
        pointer.y += (target.y - pointer.y) * (1 - Math.pow(0.89, step));
        pointer.x = Math.max(8, Math.min(width - 8, pointer.x));
        pointer.y = Math.max(8, Math.min(height - 8, pointer.y));
        lastActivity = now;
      }
      if (pointer) {
        const idle = now - lastActivity;
        const inHeartRange = !!heartStart && !!heartEnd &&
          pointer.y >= heartStart.getBoundingClientRect().top && pointer.y <= heartEnd.getBoundingClientRect().bottom;
        if (inHeartRange) {
          if (!heartActive) popHeart(pointer);
          stampHeart(pointer);
          previous = { ...pointer };
          pac = null;
          canvas!.dataset.shape = "heart";
        } else if (idle > PACMAN_IDLE_MS && !touch.matches) {
          wander(pointer, step);
          previous = { ...pointer };
          canvas!.dataset.shape = "pacman";
        } else {
          follow(pointer, pointer.y > heroBottom ? WILD_BRUSH * 0.5 : WILD_BRUSH);
          canvas!.dataset.shape = "cloud";
        }
        heartActive = inHeartRange;
      }
      for (let i = heartSparks.length - 1; i >= 0; i--) {
        const spark = heartSparks[i];
        spark.life -= 0.035 * step;
        if (spark.life <= 0) { heartSparks.splice(i, 1); continue; }
        spark.x += spark.vx * step;
        spark.y += spark.vy * step;
        spark.vx *= Math.pow(0.95, step);
        spark.vy *= Math.pow(0.95, step);
        deposit(spark.x, spark.y, spark.life * 0.9, 0.7);
      }
      if (press) {
        const charge = Math.min((now - press.startedAt) / 2200, 1);
        deposit(press.x, press.y, 0.45 + charge * 0.5, WILD_BRUSH * (2 + charge * 8));
        shake = Math.max(shake, 0.12 + charge * 0.35);
      }
      paintWaves(now, heroBottom);

      context!.save();
      if (shake > 0.01) {
        shake *= Math.pow(0.9, step);
        context!.translate((Math.random() - 0.5) * shake * 20, (Math.random() - 0.5) * shake * 20);
      }
      context!.clearRect(-40, -40, width + 80, height + 80);
      const sy = touch.matches ? 0 : window.scrollY;
      const offset = sy - Math.floor(sy / WILD_CELL) * WILD_CELL;
      context!.strokeStyle = document.documentElement.dataset.theme === "dark" ? "#080808" : "#fafafa";
      context!.lineWidth = 1;
      context!.beginPath();
      for (let x = 0; x <= width; x += WILD_CELL) { context!.moveTo(x + 0.5, 0); context!.lineTo(x + 0.5, height); }
      for (let y = -offset; y <= height; y += WILD_CELL) { context!.moveTo(0, y + 0.5); context!.lineTo(width, y + 0.5); }
      context!.stroke();
      for (let y = -offset; y <= height; y += WILD_CELL) {
        const row = Math.floor((y + WILD_CELL * 0.5) / WILD_CELL);
        if (row < 0 || row >= rows) continue;
        for (let column = 0; column < columns; column++) {
          const color = wildColor(heat[row * columns + column] * 0.9);
          if (!color) continue;
          context!.fillStyle = color;
          context!.fillRect(column * WILD_CELL, y, WILD_CELL - 1, WILD_CELL - 1);
        }
      }
      context!.restore();
      if (!pointer && !press && waves.length === 0 && !heat.some(value => value >= 0.3)) clear();
      else frame = requestAnimationFrame(render);
    }

    function move(event: PointerEvent) {
      if (reducedMotion.matches || touch.matches || document.hidden) return;
      pointer = { x: event.clientX, y: event.clientY };
      lastActivity = performance.now();
      pac = null;
      start();
    }

    function down(event: PointerEvent) {
      if (event.button !== 0 || reducedMotion.matches || touch.matches || document.hidden || (event.target instanceof Element && event.target.closest(INTERACTIVE))) return;
      press = { x: event.clientX, y: event.clientY, startedAt: performance.now(), pointerId: event.pointerId };
      start();
    }

    function release(event: PointerEvent) {
      if (!press || press.pointerId !== event.pointerId) return;
      const now = performance.now(), charge = Math.min((now - press.startedAt) / 2200, 1);
      waves.push({ x: press.x, y: press.y, bornAt: now, power: 0.35 + charge * 2.1 });
      deposit(press.x, press.y, 1, WILD_BRUSH * (2.5 + charge * 18));
      shake = 0.45 + charge * 1.9;
      pointer = { x: press.x, y: press.y };
      lastActivity = now;
      pac = press = null;
      start();
    }

    function doubleClick(event: MouseEvent) {
      if (touch.matches || reducedMotion.matches || (event.target instanceof Element && event.target.closest(INTERACTIVE))) return;
      waves.push({ x: event.clientX, y: event.clientY, bornAt: performance.now(), power: 2.8 });
      deposit(event.clientX, event.clientY, 1, WILD_BRUSH * 22);
      shake = 2.4;
      start();
    }

    function scroll() {
      if (reducedMotion.matches || document.hidden) return;
      lastActivity = performance.now();
      pac = null;
      if (pointer || touch.matches) start();
    }

    function leave() { pointer = previous = pac = null; heartActive = false; }
    function cancel() { press = null; }
    function visibility() { if (document.hidden) clear(); else if (touch.matches) start(); }
    function motionChange() { clear(); if (touch.matches) start(); }

    resize();
    setWildHeatSampler((x, y) => {
      const column = Math.floor(x / WILD_CELL), row = Math.floor(y / WILD_CELL);
      return column >= 0 && row >= 0 && column < columns && row < rows ? heat[row * columns + column] * 0.9 : 0;
    });
    if (touch.matches) start();
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", down, { passive: true });
    window.addEventListener("pointerup", release, { passive: true });
    window.addEventListener("pointercancel", cancel);
    window.addEventListener("dblclick", doubleClick);
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("resize", resize);
    window.addEventListener("blur", clear);
    document.addEventListener("pointerleave", leave);
    document.addEventListener("visibilitychange", visibility);
    reducedMotion.addEventListener("change", motionChange);

    return () => {
      clear();
      setWildHeatSampler(null);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("dblclick", doubleClick);
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("resize", resize);
      window.removeEventListener("blur", clear);
      document.removeEventListener("pointerleave", leave);
      document.removeEventListener("visibilitychange", visibility);
      reducedMotion.removeEventListener("change", motionChange);
    };
  }, []);

  return <canvas ref={canvasRef} data-wild-cursor data-active="false" aria-hidden="true" className={styles.cursor} />;
}
