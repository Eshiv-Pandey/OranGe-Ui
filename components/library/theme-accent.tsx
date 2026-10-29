"use client";

import { useEffect, useSyncExternalStore } from "react";
import { accentTokens, DEFAULT_ACCENT, normalizeAccent } from "../../lib/theme";

let temporaryAccent: string | undefined;
function readAccent() { if (temporaryAccent) return temporaryAccent; try { return normalizeAccent(localStorage.getItem("orangeui-accent")); } catch { return DEFAULT_ACCENT; } }
function subscribe(notify: () => void) {
  const storage = (event: StorageEvent) => { if (event.key && event.key !== "orangeui-accent") return; temporaryAccent = undefined; notify(); };
  window.addEventListener("orange-accent", notify); window.addEventListener("storage", storage);
  return () => { window.removeEventListener("orange-accent", notify); window.removeEventListener("storage", storage); };
}
export function useAccent() { return useSyncExternalStore(subscribe, readAccent, () => DEFAULT_ACCENT); }
export function setAccent(value: string) {
  const accent = normalizeAccent(value);
  let saved = true;
  try { localStorage.setItem("orangeui-accent", accent); temporaryAccent = undefined; }
  catch { temporaryAccent = accent; saved = false; }
  window.dispatchEvent(new Event("orange-accent"));
  return saved;
}

/** Applies saved accents on every route, including a direct landing-page visit. */
export function ThemeAccent() {
  const accent = useAccent();
  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => { const dark = root.dataset.theme === "dark" || (!root.dataset.theme && media.matches); for (const [name, value] of Object.entries(accentTokens(accent, dark))) root.style.setProperty(name, value); };
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    media.addEventListener("change", update);
    return () => { observer.disconnect(); media.removeEventListener("change", update); };
  }, [accent]);
  return null;
}
